import { z } from 'zod';
import { ToolDefinition, ToolExecutionContext, ToolResult } from '../types';
import { createClient } from '@/lib/supabase/server';
import { getUserFinance } from '@/lib/db/finance';
import { getUserQuests, createQuest, completeUserQuest } from '@/lib/db/quests';
import { getUserGoals, createGoal, updateGoalProgress } from '@/lib/db/goals';
import { getUserJournal, createJournalEntry } from '@/lib/db/journal';
import { searchMemoriesHybrid, storeMemoryWithEmbedding } from '@/lib/memory/hybridMemory';
import { getPlayerProgress, getProfile, getPlayerStats } from '@/lib/db/profiles';
import { getLearningProfile, getSkillRoadmapWithModules, getPracticeAttempts, saveLearningProfile, initializePublicSpeakingRoadmap } from '@/lib/db/learning';
import { getUserSkills } from '@/lib/db/skills';
import { getUserIntegrations } from '@/lib/db/integrations';
import { addXPServer } from '@/lib/progression/playerProgression';
import { QUEST_REWARD_RULES, QuestDifficulty } from '@/types/mentra';
import { scheduleOperativeAgent } from '@/lib/agents/operativeAgent';
import { getMentraSkill, listMentraSkills } from '@/lib/skills/catalog';
import { browserAgent } from '@/lib/agents/browserAgent';
import { sanitizeExternalContent } from '@/lib/safety/promptInjectionShield';

// ==============================================================================
// 1. PROGRESS & PROFILE TOOLS
// ==============================================================================
export const getPlayerProgressTool: ToolDefinition = {
  name: 'getPlayerProgress',
  description: 'Retrieve current player RPG level, XP progression, streak, and attributes.',
  permission: 'READ',
  schema: z.object({}),
  execute: async (_, context) => {
    const [progress, profile, stats] = await Promise.all([
      getPlayerProgress(context.userId),
      getProfile(context.userId),
      getPlayerStats(context.userId)
    ]);

    const level = progress?.level || 1;
    const currentXp = progress?.current_xp || 0;
    const nextLevelXp = level * 1000;
    const streak = progress?.current_streak || 1;

    return {
      ok: true,
      data: {
        operatorName: profile?.display_name || 'Operator',
        level,
        currentXp,
        nextLevelXp,
        streakDays: streak,
        totalQuestsCompleted: progress?.quests_completed || 0,
        stats: stats || {}
      },
      card: {
        id: `card_${Date.now()}`,
        type: 'DAILY_PLAN',
        title: `Operator Telemetry: Level ${level.toString().padStart(2, '0')}`,
        subtitle: `${currentXp} / ${nextLevelXp} XP • ${streak} Day Streak 🔥`,
        data: { level, currentXp, nextLevelXp, streak }
      },
      message: `Operator is at Level ${level} with ${currentXp}/${nextLevelXp} XP and a ${streak}-day streak.`
    };
  }
};

// ==============================================================================
// 2. FINANCE TOOLS
// ==============================================================================
export const addFinanceTransactionTool: ToolDefinition = {
  name: 'addFinanceTransaction',
  description: 'Record an income or expense in the financial ledger.',
  permission: 'WRITE_LOW',
  schema: z.object({
    amount: z.number().positive('Amount must be positive'),
    type: z.enum(['INCOME', 'EXPENSE']),
    category: z.string().default('BUSINESS_ADS'),
    description: z.string().min(1, 'Description is required'),
    scope: z.enum(['BUSINESS', 'PERSONAL']).default('BUSINESS')
  }),
  execute: async (input, context) => {
    const supabase = createClient();

    // 1. Idempotency Check: Prevent duplicate transaction if same key
    if (context.idempotencyKey) {
      const { data: existing } = await supabase
        .from('ai_tool_calls')
        .select('id, output')
        .eq('user_id', context.userId)
        .eq('idempotency_key', context.idempotencyKey)
        .single();

      if (existing) {
        return {
          ok: true,
          data: existing.output,
          message: `Transaction already processed (Idempotent replay).`
        };
      }
    }

    const { data: tx, error } = await supabase
      .from('finance_transactions')
      .insert({
        user_id: context.userId,
        amount: input.amount,
        type: input.type,
        category: input.category,
        description: input.description,
        business_personal: input.scope,
        date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error || !tx) {
      return { ok: false, errorCode: 'FINANCE_INSERT_FAILED', message: error?.message || 'Failed to record transaction.' };
    }

    // Award minor discipline XP for tracking
    await addXPServer(context.userId, 15, 'JOURNAL_LOG', tx.id, `Logged ${input.type}: ₹${input.amount}`);

    return {
      ok: true,
      data: tx,
      card: {
        id: `card_${Date.now()}`,
        type: input.type === 'EXPENSE' ? 'EXPENSE_ADDED' : 'INCOME_ADDED',
        title: `${input.type === 'EXPENSE' ? 'Expense' : 'Income'} Recorded: ₹${input.amount}`,
        subtitle: `${input.description} • ${input.category}`,
        data: { amount: input.amount, type: input.type, category: input.category, description: input.description }
      },
      message: `₹${input.amount} ${input.description} ${input.type === 'EXPENSE' ? 'expense' : 'income'} recorded.`
    };
  }
};

export const getFinanceSummaryTool: ToolDefinition = {
  name: 'getFinanceSummary',
  description: 'Retrieve real-time monthly financial summary, income, expenses, and burn rate.',
  permission: 'READ',
  schema: z.object({}),
  execute: async (_, context) => {
    const summary = await getUserFinance(context.userId);
    return {
      ok: true,
      data: summary,
      card: {
        id: `card_${Date.now()}`,
        type: 'DAILY_PLAN',
        title: `Capital Velocity: ₹${summary.monthlyIncome.toLocaleString()}`,
        subtitle: `Monthly Expenses: ₹${summary.monthlyExpenses.toLocaleString()} • Net: ₹${summary.monthlySavings.toLocaleString()}`,
        data: summary
      },
      message: `Monthly income: ₹${summary.monthlyIncome}, Expenses: ₹${summary.monthlyExpenses}, Net: ₹${summary.monthlySavings}.`
    };
  }
};

// ==============================================================================
// 3. QUEST TOOLS
// ==============================================================================
export const createQuestTool: ToolDefinition = {
  name: 'createQuest',
  description: 'Initialize a new daily, main, or side quest in the Life RPG matrix.',
  permission: 'WRITE_LOW',
  schema: z.object({
    title: z.string().min(1, 'Title required'),
    description: z.string().default(''),
    category: z.enum(['BUSINESS', 'FINANCE', 'LEARNING', 'COMMUNICATION', 'FITNESS', 'PERSONAL_GROWTH']).default('BUSINESS'),
    type: z.enum(['DAILY', 'MAIN', 'SIDE', 'WEEKLY', 'BOSS']).default('DAILY'),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EPIC', 'BOSS']).default('MEDIUM'),
    due_date: z.string().optional()
  }),
  execute: async (input, context) => {
    const supabase = createClient();
    const rewards = QUEST_REWARD_RULES[input.difficulty as QuestDifficulty] || QUEST_REWARD_RULES.MEDIUM;

    const { data: quest, error } = await supabase
      .from('quests')
      .insert({
        user_id: context.userId,
        title: input.title.trim(),
        description: input.description,
        category: input.category,
        type: input.type,
        difficulty: input.difficulty,
        xp_reward: rewards.xp,
        skill_xp_reward: rewards.skillXp,
        due_date: input.due_date || null,
        status: 'ACTIVE',
        progress_percent: 0,
        required_action: 'Execute priority protocol'
      })
      .select()
      .single();

    if (error || !quest) {
      return { ok: false, errorCode: 'QUEST_CREATE_FAILED', message: error?.message || 'Failed to create quest.' };
    }

    return {
      ok: true,
      data: quest,
      card: {
        id: `card_${Date.now()}`,
        type: 'QUEST_CREATED',
        title: `Mission Initialized: "${quest.title}"`,
        subtitle: `Reward: +${rewards.xp} XP • Difficulty: ${input.difficulty}`,
        data: quest
      },
      message: `Quest "${quest.title}" initialized (+${rewards.xp} XP reward).`
    };
  }
};

export const getTodayQuestsTool: ToolDefinition = {
  name: 'getTodayQuests',
  description: 'Retrieve all active daily quests and missions for today.',
  permission: 'READ',
  schema: z.object({}),
  execute: async (_, context) => {
    const quests = await getUserQuests(context.userId);
    const active = quests.filter(q => q.status === 'ACTIVE');
    return {
      ok: true,
      data: active,
      card: {
        id: `card_${Date.now()}`,
        type: 'DAILY_PLAN',
        title: `Active Missions (${active.length})`,
        subtitle: active.length > 0 ? active[0].title : 'No active quests today',
        data: { activeCount: active.length, quests: active.slice(0, 5) }
      },
      message: `Operator has ${active.length} active missions today.`
    };
  }
};

export const completeQuestTool: ToolDefinition = {
  name: 'completeQuest',
  description: 'Complete an active quest and claim verified XP reward.',
  permission: 'WRITE_LOW',
  schema: z.object({
    questId: z.string().min(1, 'Quest ID is required')
  }),
  execute: async (input, context) => {
    const supabase = createClient();
    const { data: quest } = await supabase
      .from('quests')
      .select('*')
      .eq('id', input.questId)
      .eq('user_id', context.userId)
      .single();

    if (!quest) {
      return { ok: false, errorCode: 'NOT_FOUND', message: 'Quest not found.' };
    }

    await completeUserQuest(context.userId, input.questId);
    const xpResult = await addXPServer(context.userId, quest.xp_reward || 60, 'QUEST', quest.id, `Completed: ${quest.title}`);

    return {
      ok: true,
      data: { quest, xpResult },
      card: {
        id: `card_${Date.now()}`,
        type: 'QUEST_COMPLETED',
        title: `Mission Complete: "${quest.title}"`,
        subtitle: `+${quest.xp_reward || 60} XP Awarded`,
        data: { quest, xpResult }
      },
      message: `Quest "${quest.title}" completed. +${quest.xp_reward || 60} XP claimed.`
    };
  }
};

// ==============================================================================
// 4. GOAL TOOLS
// ==============================================================================
export const createGoalTool: ToolDefinition = {
  name: 'createGoal',
  description: 'Establish a strategic macro goal with tactical milestones.',
  permission: 'WRITE_LOW',
  schema: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().default(''),
    category: z.enum(['BUSINESS', 'FINANCE', 'LEARNING', 'COMMUNICATION', 'FITNESS']).default('BUSINESS'),
    targetDate: z.string().optional()
  }),
  execute: async (input, context) => {
    const goal = await createGoal(context.userId, {
      title: input.title,
      description: input.description,
      category: input.category as any,
      targetDate: input.targetDate || '2026-12-31'
    });

    return {
      ok: true,
      data: goal,
      card: {
        id: `card_${Date.now()}`,
        type: 'GOAL_CREATED',
        title: `Macro Goal: "${input.title}"`,
        subtitle: `Category: ${input.category} • Target: ${input.targetDate || '2026-12-31'}`,
        data: goal
      },
      message: `Macro goal "${input.title}" established.`
    };
  }
};

// ==============================================================================
// 5. SKILL & LEARNING TOOLS
// ==============================================================================
export const createSkillTool: ToolDefinition = {
  name: 'createSkill',
  description: 'Initialize a new adaptive skill learning track and generate roadmap.',
  permission: 'WRITE_LOW',
  schema: z.object({
    skillName: z.string().min(1, 'Skill name required'),
    whyLearn: z.string().default('Sovereign skill acquisition'),
    currentExperience: z.string().default('Beginner')
  }),
  execute: async (input, context) => {
    const skillId = input.skillName.toLowerCase().includes('speaking') ? 'skill_public_speaking' : `skill_${input.skillName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    await saveLearningProfile({
      user_id: context.userId,
      skill_id: skillId,
      why_learn: input.whyLearn,
      current_experience: input.currentExperience,
      target_goal: `Mastery in ${input.skillName}`,
      preferred_language: 'Both (Hindi + English)'
    });

    if (skillId === 'skill_public_speaking') {
      await initializePublicSpeakingRoadmap(context.userId);
    }

    return {
      ok: true,
      data: { skillId, skillName: input.skillName },
      card: {
        id: `card_${Date.now()}`,
        type: 'SKILL_STARTED',
        title: `Skill Track Activated: "${input.skillName}"`,
        subtitle: `Level 01 • Adaptive Roadmap Initialized`,
        data: { skillId, skillName: input.skillName }
      },
      message: `Skill trajectory for "${input.skillName}" initiated.`
    };
  }
};

export const getNextLearningActivityTool: ToolDefinition = {
  name: 'getNextLearningActivity',
  description: 'Retrieve the active skill learning exercise or Public Speaking practice challenge.',
  permission: 'READ',
  schema: z.object({
    skillId: z.string().default('skill_public_speaking')
  }),
  execute: async (input, context) => {
    const roadmap = await getSkillRoadmapWithModules(context.userId, input.skillId);
    const mod = roadmap?.modules?.[0];
    const lesson = mod?.lessons?.[0];
    const exercise = lesson?.exercises?.[0];

    return {
      ok: true,
      data: { roadmap, lesson, exercise },
      card: {
        id: `card_${Date.now()}`,
        type: 'PRACTICE_SCHEDULED',
        title: `Today's Practice: ${exercise?.title || '60-Second Professional Intro'}`,
        subtitle: `Duration: ${exercise?.duration_seconds || 60}s • Prep: 20s`,
        data: { lesson, exercise }
      },
      message: `Today's practice challenge: "${exercise?.title || '60-Second Self Intro'}". Focus on pacing and zero-filler silence.`
    };
  }
};

// ==============================================================================
// 6. JOURNAL & MEMORY TOOLS
// ==============================================================================
export const saveJournalTool: ToolDefinition = {
  name: 'saveJournal',
  description: 'Record daily reflection journal and extract strategic insights.',
  permission: 'WRITE_LOW',
  schema: z.object({
    content: z.string().min(1, 'Content is required'),
    mood: z.enum(['PEAK', 'PRODUCTIVE', 'NEUTRAL', 'EXHAUSTED', 'REFLECTIVE']).default('PRODUCTIVE'),
    wins: z.array(z.string()).default([]),
    decisions: z.array(z.string()).default([]),
    tomorrowActions: z.array(z.string()).default([])
  }),
  execute: async (input, context) => {
    const entry = await createJournalEntry(context.userId, {
      rawContent: input.content,
      mood: input.mood,
      wins: input.wins,
      decisions: input.decisions,
      tomorrowActions: input.tomorrowActions,
      tags: ['DailyLog', 'AIEntry']
    });

    // Save decision to memory if exists
    if (input.decisions.length > 0) {
      for (const dec of input.decisions) {
        await storeMemoryWithEmbedding(context.userId, {
          type: 'DECISION',
          title: `Decision: ${dec.slice(0, 50)}`,
          content: dec,
          source: 'Journal Log',
          importance: 'HIGH',
          tags: ['Decision']
        });
      }
    }

    // Award +60 XP
    await addXPServer(context.userId, 60, 'JOURNAL', entry?.id || `j_${Date.now()}`, 'Daily journal reflection saved');

    return {
      ok: true,
      data: entry,
      card: {
        id: `card_${Date.now()}`,
        type: 'JOURNAL_SAVED',
        title: 'Daily Reflection Logged',
        subtitle: `Mood: ${input.mood} • +60 XP Awarded`,
        data: entry
      },
      message: `Journal entry saved and +60 XP awarded.`
    };
  }
};

export const searchMemoryTool: ToolDefinition = {
  name: 'searchMemory',
  description: 'Search Second Brain memory using hybrid semantic + keyword retrieval.',
  permission: 'READ',
  schema: z.object({
    query: z.string().min(1, 'Search query required'),
    limit: z.number().int().min(1).max(20).default(6)
  }),
  execute: async (input, context) => {
    const matches = await searchMemoriesHybrid(context.userId, input.query, input.limit);

    if (matches.length === 0) {
      return {
        ok: true,
        data: [],
        message: `No saved memory found matching "${input.query}".`
      };
    }

    return {
      ok: true,
      data: matches,
      card: {
        id: `card_${Date.now()}`,
        type: 'MEMORY_FOUND',
        title: `Memory Anchor Found (${matches.length})`,
        subtitle: matches[0].title,
        data: matches[0]
      },
      message: `Found ${matches.length} relevant memories. Best match: "${matches[0].title}": ${matches[0].content}`
    };
  }
};

export const listMentraSkillsTool: ToolDefinition = {
  name: 'listMentraSkills',
  description: 'List reusable MENTRA workflows for research, business, productivity, and weekly reviews.',
  permission: 'READ',
  schema: z.object({
    category: z.enum(['PERSONAL_OS', 'BUSINESS', 'RESEARCH', 'PRODUCTIVITY', 'LEARNING']).optional()
  }),
  execute: async (input) => {
    const skills = listMentraSkills(input.category);
    return {
      ok: true,
      data: skills,
      message: skills.length > 0
        ? `Available skills: ${skills.map(skill => skill.name).join(', ')}`
        : 'No skills found for that category.'
    };
  }
};

export const activateMentraSkillTool: ToolDefinition = {
  name: 'activateMentraSkill',
  description: 'Load a reusable workflow manifest so the agent can execute its required tools step-by-step.',
  permission: 'READ',
  schema: z.object({
    skillName: z.string().min(1),
    objective: z.string().default('')
  }),
  execute: async (input) => {
    const skill = getMentraSkill(input.skillName);

    if (!skill) {
      return {
        ok: false,
        errorCode: 'SKILL_NOT_FOUND',
        message: `Skill "${input.skillName}" is not installed.`
      };
    }

    return {
      ok: true,
      data: {
        ...skill,
        objective: input.objective,
        protocol: 'Execute requiredTools in the order that best satisfies the objective. Re-plan after each verified tool result. Never bypass approval gates.'
      },
      message: `Skill "${skill.title}" activated. Required tools: ${skill.requiredTools.join(', ')}.`
    };
  }
};

// ==============================================================================
// 7. INTEGRATION & AGENT ROUTING TOOLS
// ==============================================================================
export const getConnectionsTool: ToolDefinition = {
  name: 'getConnections',
  description: 'Verify connected Google Workspace or WhatsApp integration status.',
  permission: 'READ',
  schema: z.object({
    service: z.string().default('GOOGLE_ACCOUNT')
  }),
  execute: async (input, context) => {
    const integrations = await getUserIntegrations(context.userId);
    const found = integrations.find(i => i.service === input.service || i.name.toLowerCase().includes(input.service.toLowerCase()));
    const isConnected = found?.status === 'CONNECTED';

    if (!isConnected) {
      return {
        ok: true,
        data: { connected: false, service: input.service },
        card: {
          id: `card_${Date.now()}`,
          type: 'CONNECTION_REQUIRED',
          title: 'Google Workspace Disconnected',
          subtitle: 'Connect your Google account in Settings to enable Gmail/Calendar tools.',
          data: { service: input.service },
          actionUrl: '/connections',
          actionLabel: 'Connect Google'
        },
        message: `Google Workspace is currently not connected. Please connect your account in Settings.`
      };
    }

    return {
      ok: true,
      data: found,
      message: `${input.service} is connected and active.`
    };
  }
};

export const routeToAgentTool: ToolDefinition = {
  name: 'routeToAgent',
  description: 'Dispatch complex task to specialized autonomous agent.',
  permission: 'WRITE_LOW',
  schema: z.object({
    agentId: z.enum(['research_agent', 'finance_agent', 'learning_agent', 'business_agent', 'memory_agent', 'gmail_agent']),
    taskDescription: z.string().min(1, 'Task description required')
  }),
  execute: async (input, context) => {
    return {
      ok: true,
      data: input,
      card: {
        id: `card_${Date.now()}`,
        type: 'AGENT_WORKING',
        title: `Agent Dispatched: ${input.agentId.replace('_', ' ').toUpperCase()}`,
        subtitle: input.taskDescription,
        data: input
      },
      message: `Dispatched task to ${input.agentId}.`
    };
  }
};

export const scheduleMonitorTool: ToolDefinition = {
  name: 'scheduleMonitor',
  description: 'Create or update a persistent Operative monitor that checks an objective on a recurring schedule.',
  permission: 'WRITE_LOW',
  schema: z.object({
    title: z.string().min(1).max(120),
    objective: z.string().min(1).max(2000),
    cadence: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY'),
    notifyWhen: z.string().max(1000).default('Notify only on meaningful actionable change.'),
    notifyOnEveryRun: z.boolean().default(false)
  }),
  execute: async (input, context) => {
    const scheduled = await scheduleOperativeAgent(context.userId, input);
    return {
      ok: true,
      data: scheduled,
      card: {
        id: `card_${Date.now()}`,
        type: 'AGENT_WORKING',
        title: `Monitor Scheduled: ${input.title}`,
        subtitle: `${input.cadence} • ${input.notifyWhen}`,
        data: scheduled
      },
      message: `Persistent monitor "${input.title}" scheduled ${input.cadence.toLowerCase()}.`
    };
  }
};

export const listMonitorsTool: ToolDefinition = {
  name: 'listMonitors',
  description: 'List the operator\'s persistent scheduled Operative monitors and their next run state.',
  permission: 'READ',
  schema: z.object({}),
  execute: async (_, context) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('scheduled_jobs')
      .select('id, payload, recurrence, status, scheduled_for, next_run_at, last_run_at, attempt_count')
      .eq('user_id', context.userId)
      .eq('type', 'AGENT_SCHEDULE')
      .order('created_at', { ascending: false });

    if (error) {
      return { ok: false, errorCode: 'MONITOR_LIST_FAILED', message: error.message };
    }

    return {
      ok: true,
      data: data || [],
      message: data?.length
        ? `You have ${data.length} persistent monitor(s).`
        : 'No persistent monitors are currently configured.'
    };
  }
};

export const browserReadTool: ToolDefinition = {
  name: 'browserRead',
  description: 'Open a public URL and read visible page content through the controlled browser layer.',
  permission: 'READ',
  schema: z.object({
    url: z.string().url()
  }),
  execute: async (input, context) => {
    const result = await browserAgent.readPage(input.url);
    await browserAgent.logBrowserAction(
      context.userId,
      context.conversationId || `browser_${Date.now()}`,
      result,
      'LOW_RISK_EXTERNAL'
    );

    const safeContent = result.extractedContent
      ? sanitizeExternalContent(result.extractedContent, 'BROWSER_PAGE').sanitizedContent
      : undefined;

    return {
      ok: result.success,
      data: { ...result, extractedContent: safeContent },
      errorCode: result.success ? undefined : result.status,
      message: result.success
        ? `Read ${result.targetUrl} successfully.`
        : (result.error || 'Browser read failed.')
    };
  }
};

export const browserClickTool: ToolDefinition = {
  name: 'browserClick',
  description: 'Click a specific CSS selector on a public webpage. Requires explicit approval.',
  permission: 'APPROVAL_REQUIRED',
  schema: z.object({
    url: z.string().url(),
    selector: z.string().min(1).max(500)
  }),
  execute: async (input, context) => {
    const result = await browserAgent.click(
      input.url,
      input.selector,
      Boolean(context.approved)
    );

    await browserAgent.logBrowserAction(
      context.userId,
      context.conversationId || `browser_${Date.now()}`,
      result,
      'SENSITIVE'
    );

    const safeContent = result.extractedContent
      ? sanitizeExternalContent(result.extractedContent, 'BROWSER_PAGE').sanitizedContent
      : undefined;

    return {
      ok: result.success,
      data: { ...result, extractedContent: safeContent },
      errorCode: result.success ? undefined : result.status,
      message: result.success
        ? `Clicked ${input.selector} on ${result.targetUrl}.`
        : (result.error || 'Browser click failed.')
    };
  }
};

export const browserTypeTool: ToolDefinition = {
  name: 'browserType',
  description: 'Type text into a CSS selector on a public webpage. Requires explicit approval.',
  permission: 'APPROVAL_REQUIRED',
  schema: z.object({
    url: z.string().url(),
    selector: z.string().min(1).max(500),
    text: z.string().max(4000)
  }),
  execute: async (input, context) => {
    const result = await browserAgent.type(
      input.url,
      input.selector,
      input.text,
      Boolean(context.approved)
    );

    await browserAgent.logBrowserAction(
      context.userId,
      context.conversationId || `browser_${Date.now()}`,
      result,
      'SENSITIVE'
    );

    const safeContent = result.extractedContent
      ? sanitizeExternalContent(result.extractedContent, 'BROWSER_PAGE').sanitizedContent
      : undefined;

    return {
      ok: result.success,
      data: { ...result, extractedContent: safeContent },
      errorCode: result.success ? undefined : result.status,
      message: result.success
        ? `Typed into ${input.selector} on ${result.targetUrl}.`
        : (result.error || 'Browser typing failed.')
    };
  }
};

export const browserSubmitTool: ToolDefinition = {
  name: 'browserSubmit',
  description: 'Fill named fields and submit a form selected by CSS selector. Requires explicit approval.',
  permission: 'APPROVAL_REQUIRED',
  schema: z.object({
    url: z.string().url(),
    selector: z.string().min(1).max(500),
    fields: z.record(z.union([z.string(), z.number(), z.boolean()]))
  }),
  execute: async (input, context) => {
    const result = await browserAgent.submit(
      input.url,
      input.selector,
      input.fields,
      Boolean(context.approved)
    );

    await browserAgent.logBrowserAction(
      context.userId,
      context.conversationId || `browser_${Date.now()}`,
      result,
      'SENSITIVE'
    );

    const safeContent = result.extractedContent
      ? sanitizeExternalContent(result.extractedContent, 'BROWSER_PAGE').sanitizedContent
      : undefined;

    return {
      ok: result.success,
      data: { ...result, extractedContent: safeContent },
      errorCode: result.success ? undefined : result.status,
      message: result.success
        ? `Submitted the approved form on ${result.targetUrl}.`
        : (result.error || 'Browser form submission failed.')
    };
  }
};

// ==============================================================================
// 8. GOOGLE WORKSPACE & RESEARCH TOOLS (PHASE 5)
// ==============================================================================

import { searchGmail, readGmailMessage, createGmailDraft, sendGmailMessage } from '@/lib/integrations/google/gmail';
import { getGoogleCalendarEvents, createGoogleCalendarEvent, detectCalendarConflicts } from '@/lib/integrations/google/calendar';
import { searchGoogleDrive, readGoogleDriveFileText } from '@/lib/integrations/google/drive';
import { readGoogleSheetRange, appendGoogleSheetRow } from '@/lib/integrations/google/sheets';
import { searchGoogleContacts } from '@/lib/integrations/google/contacts';
import { executeWebResearch } from '@/lib/research/researchAgent';
import { runMultiAgentTask } from '@/lib/agents/orchestrator';

export const searchGmailTool: ToolDefinition = {
  name: 'searchGmail',
  description: 'Search connected Gmail inbox for emails by sender, topic, date, or unread status.',
  permission: 'READ',
  schema: z.object({
    query: z.string().default('is:inbox'),
    maxResults: z.number().default(5)
  }),
  execute: async (input, context) => {
    const { emails, error } = await searchGmail(context.userId, input.query, input.maxResults);
    if (error === 'CONNECTION_REQUIRED' || error === 'TOKEN_EXPIRED') {
      return {
        ok: false,
        errorCode: 'CONNECTION_REQUIRED',
        card: {
          id: `card_${Date.now()}`,
          type: 'CONNECTION_REQUIRED',
          title: 'Google Workspace Connection Required',
          subtitle: 'Connect your Gmail in Settings to search and inspect real emails.',
          data: { service: 'GMAIL' },
          actionUrl: '/connections',
          actionLabel: 'Connect Google'
        },
        message: 'Gmail is not connected. Connect your Google account in Settings to search real emails.'
      };
    }

    if (error) {
      return { ok: false, errorCode: error, message: `Gmail search error: ${error}` };
    }

    return {
      ok: true,
      data: emails,
      message: emails.length > 0
        ? `Found ${emails.length} emails matching "${input.query}":\n` + emails.map((e, i) => `${i + 1}. [${e.from}]: "${e.subject}" (${e.date.slice(0, 16)})`).join('\n')
        : `No emails found matching "${input.query}".`
    };
  }
};

export const readEmailTool: ToolDefinition = {
  name: 'readEmail',
  description: 'Read the full plain-text body of a specific email message.',
  permission: 'READ',
  schema: z.object({
    messageId: z.string().min(1, 'messageId is required')
  }),
  execute: async (input, context) => {
    const { email, error } = await readGmailMessage(context.userId, input.messageId);
    if (error) {
      return { ok: false, errorCode: error, message: `Failed to read email: ${error}` };
    }

    return {
      ok: true,
      data: email,
      message: `[Email Body from ${email?.from}]: Subject: "${email?.subject}"\n\n${email?.bodyText}`
    };
  }
};

export const draftEmailTool: ToolDefinition = {
  name: 'draftEmail',
  description: 'Prepare an email reply draft in Gmail without sending it.',
  permission: 'WRITE_LOW',
  schema: z.object({
    to: z.string().email('Valid recipient email required'),
    subject: z.string().min(1, 'Subject required'),
    body: z.string().min(1, 'Email body required'),
    replyToMessageId: z.string().optional()
  }),
  execute: async (input, context) => {
    const { draftId, error } = await createGmailDraft(context.userId, input.to, input.subject, input.body, input.replyToMessageId);
    if (error === 'CONNECTION_REQUIRED') {
      return {
        ok: false,
        errorCode: 'CONNECTION_REQUIRED',
        card: {
          id: `card_${Date.now()}`,
          type: 'CONNECTION_REQUIRED',
          title: 'Gmail Disconnected',
          subtitle: 'Connect Google account to draft emails.',
          data: { service: 'GMAIL' }
        },
        message: 'Gmail connection required to create drafts.'
      };
    }

    if (error) {
      return { ok: false, errorCode: error, message: `Draft creation failed: ${error}` };
    }

    return {
      ok: true,
      data: { draftId, to: input.to, subject: input.subject, body: input.body },
      card: {
        id: `card_${Date.now()}`,
        type: 'APPROVAL_REQUIRED',
        title: `Email Draft Ready: "${input.subject}"`,
        subtitle: `To: ${input.to}`,
        data: { draftId, to: input.to, subject: input.subject, body: input.body }
      },
      message: `Email draft prepared for ${input.to} with subject "${input.subject}". You can review and approve sending.`
    };
  }
};

export const sendEmailTool: ToolDefinition = {
  name: 'sendEmail',
  description: 'Send an email to a recipient (REQUIRES EXPLICIT OPERATOR APPROVAL).',
  permission: 'APPROVAL_REQUIRED',
  schema: z.object({
    to: z.string().email(),
    subject: z.string().min(1),
    body: z.string().min(1)
  }),
  execute: async (input, context) => {
    const supabase = createClient();

    // 1. Create Approval Request record
    const { data: approval } = await supabase
      .from('approval_requests')
      .insert({
        user_id: context.userId,
        tool_name: 'sendEmail',
        tool_input: input,
        description: `Send email to ${input.to}: "${input.subject}"`,
        status: 'PENDING'
      })
      .select()
      .single();

    return {
      ok: true,
      requiresApproval: true,
      approvalId: approval?.id,
      card: {
        id: `card_${Date.now()}`,
        type: 'APPROVAL_REQUIRED',
        title: `Approval Required: Send Email`,
        subtitle: `To: ${input.to} • Subject: ${input.subject}`,
        data: input,
        requiresApproval: true,
        approvalId: approval?.id
      },
      message: `Email to ${input.to} has been prepared. Please confirm sending in the Approval Center.`
    };
  }
};

export const getCalendarEventsTool: ToolDefinition = {
  name: 'getCalendarEvents',
  description: 'Retrieve Google Calendar events and meetings for today or specified time window.',
  permission: 'READ',
  schema: z.object({
    timeMin: z.string().optional(),
    timeMax: z.string().optional()
  }),
  execute: async (input, context) => {
    const { events, error } = await getGoogleCalendarEvents(context.userId, input.timeMin, input.timeMax);
    if (error === 'CONNECTION_REQUIRED' || error === 'TOKEN_EXPIRED') {
      return {
        ok: false,
        errorCode: 'CONNECTION_REQUIRED',
        card: {
          id: `card_${Date.now()}`,
          type: 'CONNECTION_REQUIRED',
          title: 'Google Calendar Disconnected',
          subtitle: 'Connect Google Calendar in Settings to view schedule.',
          data: { service: 'GOOGLE_CALENDAR' },
          actionUrl: '/connections',
          actionLabel: 'Connect Google'
        },
        message: 'Google Calendar is not connected.'
      };
    }

    if (error) {
      return { ok: false, errorCode: error, message: `Calendar fetch failed: ${error}` };
    }

    return {
      ok: true,
      data: events,
      message: events.length > 0
        ? `Calendar Schedule (${events.length} events):\n` + events.map(e => `• ${e.summary} (${e.start.slice(11, 16)} - ${e.end.slice(11, 16)})`).join('\n')
        : 'Your calendar is free. No events scheduled in this window.'
    };
  }
};

export const createCalendarEventTool: ToolDefinition = {
  name: 'createCalendarEvent',
  description: 'Schedule a new event or deep focus block on Google Calendar with conflict checking.',
  permission: 'WRITE_LOW',
  schema: z.object({
    summary: z.string().min(1, 'Title required'),
    startDateTime: z.string(), // ISO
    endDateTime: z.string(),   // ISO
    location: z.string().optional(),
    description: z.string().optional(),
    attendees: z.array(z.string()).optional()
  }),
  execute: async (input, context) => {
    // 1. Conflict Check
    const conflicts = await detectCalendarConflicts(context.userId, input.startDateTime, input.endDateTime);
    if (conflicts.hasConflict) {
      return {
        ok: false,
        errorCode: 'CALENDAR_CONFLICT',
        message: `Schedule conflict detected with: "${conflicts.conflictingEvents[0].summary}" (${conflicts.conflictingEvents[0].start.slice(11, 16)}). Would you like to schedule at a nearby slot?`
      };
    }

    const res = await createGoogleCalendarEvent(context.userId, input);
    if (res.error) {
      return { ok: false, errorCode: res.error, message: `Failed to create calendar event: ${res.error}` };
    }

    return {
      ok: true,
      data: res,
      card: {
        id: `card_${Date.now()}`,
        type: 'DAILY_PLAN',
        title: `Event Scheduled: "${input.summary}"`,
        subtitle: `${input.startDateTime.slice(11, 16)} - ${input.endDateTime.slice(11, 16)} (IST)`,
        data: input
      },
      message: `Calendar event "${input.summary}" scheduled for ${input.startDateTime.slice(0, 16)}.`
    };
  }
};

export const searchDriveTool: ToolDefinition = {
  name: 'searchDrive',
  description: 'Search Google Drive for files, mockups, tech packs, and spreadsheets.',
  permission: 'READ',
  schema: z.object({
    query: z.string().default(''),
    maxResults: z.number().default(5)
  }),
  execute: async (input, context) => {
    const { files, error } = await searchGoogleDrive(context.userId, input.query, input.maxResults);
    if (error) {
      return { ok: false, errorCode: error, message: `Drive search error: ${error}` };
    }

    return {
      ok: true,
      data: files,
      message: files.length > 0
        ? `Found ${files.length} Drive files:\n` + files.map(f => `• ${f.name} (${f.mimeType.split('.').pop()})`).join('\n')
        : `No files found matching "${input.query}".`
    };
  }
};

export const readDriveFileTool: ToolDefinition = {
  name: 'readDriveFile',
  description: 'Extract and summarize text content from a Google Doc or Drive file.',
  permission: 'READ',
  schema: z.object({
    fileId: z.string().min(1, 'fileId is required'),
    mimeType: z.string().optional()
  }),
  execute: async (input, context) => {
    const { text, error } = await readGoogleDriveFileText(context.userId, input.fileId, input.mimeType);
    if (error) {
      return { ok: false, errorCode: error, message: `Failed to read file: ${error}` };
    }

    return {
      ok: true,
      data: { text },
      message: `[Drive Document Content]:\n\n${text}`
    };
  }
};

export const readSheetTool: ToolDefinition = {
  name: 'readSheet',
  description: 'Read rows and columns from a Google Sheet ledger.',
  permission: 'READ',
  schema: z.object({
    spreadsheetId: z.string().min(1),
    range: z.string().default('Sheet1!A1:Z50')
  }),
  execute: async (input, context) => {
    const { rows, error } = await readGoogleSheetRange(context.userId, input.spreadsheetId, input.range);
    if (error) {
      return { ok: false, errorCode: error, message: `Failed to read Sheet: ${error}` };
    }

    return {
      ok: true,
      data: rows,
      message: `Read ${rows.length} rows from Google Sheet (${input.range}).`
    };
  }
};

export const appendToSheetTool: ToolDefinition = {
  name: 'appendToSheet',
  description: 'Append a row of data to a Google Sheet (Requires Approval for first-time per sheet).',
  permission: 'APPROVAL_REQUIRED',
  schema: z.object({
    spreadsheetId: z.string().min(1),
    range: z.string().default('Sheet1!A:Z'),
    values: z.array(z.union([z.string(), z.number()]))
  }),
  execute: async (input, context) => {
    const supabase = createClient();
    const { data: approval } = await supabase
      .from('approval_requests')
      .insert({
        user_id: context.userId,
        tool_name: 'appendToSheet',
        tool_input: input,
        description: `Append row [${input.values.join(', ')}] to Google Sheet ${input.spreadsheetId.slice(0, 8)}...`,
        status: 'PENDING'
      })
      .select()
      .single();

    return {
      ok: true,
      requiresApproval: true,
      approvalId: approval?.id,
      card: {
        id: `card_${Date.now()}`,
        type: 'APPROVAL_REQUIRED',
        title: 'Approval Required: Append to Google Sheet',
        subtitle: `Values: ${input.values.join(', ')}`,
        data: input,
        requiresApproval: true,
        approvalId: approval?.id
      },
      message: `Sheet update prepared. Please approve in Approval Center to execute.`
    };
  }
};

export const searchContactsTool: ToolDefinition = {
  name: 'searchContacts',
  description: 'Search Google Contacts by name or email.',
  permission: 'READ',
  schema: z.object({
    query: z.string().default('')
  }),
  execute: async (input, context) => {
    const { contacts, error } = await searchGoogleContacts(context.userId, input.query);
    if (error) {
      return { ok: false, errorCode: error, message: `Failed to search contacts: ${error}` };
    }

    return {
      ok: true,
      data: contacts,
      message: contacts.length > 0
        ? `Found ${contacts.length} matching contacts:\n` + contacts.map(c => `• ${c.name} (${c.email || 'No email'})`).join('\n')
        : `No contacts found matching "${input.query}".`
    };
  }
};

export const runWebResearchTool: ToolDefinition = {
  name: 'runWebResearch',
  description: 'Conduct deep live web research across credible sources and synthesize structured intelligence report.',
  permission: 'READ',
  schema: z.object({
    topic: z.string().min(1, 'Research topic required'),
    objective: z.string().optional(),
    depth: z.enum(['QUICK', 'STANDARD', 'DEEP']).default('STANDARD')
  }),
  execute: async (input, context) => {
    const report = await executeWebResearch(context.userId, input.topic, input.objective, input.depth);

    return {
      ok: true,
      data: report,
      card: {
        id: `card_${Date.now()}`,
        type: 'DAILY_PLAN',
        title: `Intelligence Report: "${input.topic}"`,
        subtitle: `Synthesized ${report.sources.length} sources • Depth: ${input.depth}`,
        data: report
      },
      message: `Research synthesized (${report.sources.length} sources):\n\n${report.summary}\n\nKey Findings:\n` + report.keyFindings.map((f, i) => `${i + 1}. **${f.topic}**: ${f.insight}`).join('\n')
    };
  }
};

export const runMultiAgentTaskTool: ToolDefinition = {
  name: 'runMultiAgentTask',
  description: 'Coordinate a multi-agent workflow (Business + Research + Finance + Calendar) to solve complex cross-domain tasks.',
  permission: 'WRITE_LOW',
  schema: z.object({
    taskTitle: z.string().min(1),
    agentChain: z.array(z.string()).default(['ag_business', 'ag_research', 'ag_finance']),
    query: z.string().min(1)
  }),
  execute: async (input, context) => {
    const result = await runMultiAgentTask(context.userId, input);

    return {
      ok: result.status !== 'FAILED',
      data: result,
      card: {
        id: `card_${Date.now()}`,
        type: 'AGENT_WORKING',
        title: `Multi-Agent Plan: "${input.taskTitle}"`,
        subtitle: result.summary,
        data: result
      },
      message: result.summary
    };
  }
};

// Tool Registry Map
export const MENTRA_TOOL_REGISTRY: Record<string, ToolDefinition> = {
  getPlayerProgress: getPlayerProgressTool,
  addFinanceTransaction: addFinanceTransactionTool,
  getFinanceSummary: getFinanceSummaryTool,
  createQuest: createQuestTool,
  getTodayQuests: getTodayQuestsTool,
  completeQuest: completeQuestTool,
  createGoal: createGoalTool,
  createSkill: createSkillTool,
  getNextLearningActivity: getNextLearningActivityTool,
  saveJournal: saveJournalTool,
  searchMemory: searchMemoryTool,
  listMentraSkills: listMentraSkillsTool,
  activateMentraSkill: activateMentraSkillTool,
  getConnections: getConnectionsTool,
  routeToAgent: routeToAgentTool,
  scheduleMonitor: scheduleMonitorTool,
  listMonitors: listMonitorsTool,
  browserRead: browserReadTool,
  browserClick: browserClickTool,
  browserType: browserTypeTool,
  browserSubmit: browserSubmitTool,
  
  // Phase 5 Google Workspace & Research Tools
  searchGmail: searchGmailTool,
  readEmail: readEmailTool,
  draftEmail: draftEmailTool,
  sendEmail: sendEmailTool,
  getCalendarEvents: getCalendarEventsTool,
  createCalendarEvent: createCalendarEventTool,
  searchDrive: searchDriveTool,
  readDriveFile: readDriveFileTool,
  readSheet: readSheetTool,
  appendToSheet: appendToSheetTool,
  searchContacts: searchContactsTool,
  runWebResearch: runWebResearchTool,
  runMultiAgentTask: runMultiAgentTaskTool
};

export const ALL_MENTRA_TOOLS = Object.values(MENTRA_TOOL_REGISTRY);

