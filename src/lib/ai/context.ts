import { getProfile, getPlayerProgress } from '@/lib/db/profiles';
import { getUserQuests } from '@/lib/db/quests';
import { getUserGoals } from '@/lib/db/goals';
import { getUserFinance } from '@/lib/db/finance';
import { getUserSkills } from '@/lib/db/skills';
import { searchMemoriesHybrid } from '@/lib/memory/hybridMemory';

export async function buildMentraContext(
  userId: string,
  currentMessage?: string,
  pageContext?: string
): Promise<string> {
  try {
    const shouldRetrieveMemory = Boolean(
      currentMessage &&
      currentMessage.trim().length >= 8 &&
      process.env.AI_MEMORY_V2 !== 'false'
    );

    const [profile, progress, quests, goals, finance, skills, relevantMemories] = await Promise.all([
      getProfile(userId),
      getPlayerProgress(userId),
      getUserQuests(userId),
      getUserGoals(userId),
      getUserFinance(userId),
      getUserSkills(userId),
      shouldRetrieveMemory && currentMessage
        ? searchMemoriesHybrid(userId, currentMessage, 4)
        : Promise.resolve([])
    ]);

    const activeQuests = quests.filter(q => q.status === 'ACTIVE');
    const activeGoals = goals.filter(g => g.status === 'IN_PROGRESS');
    const activeSkill = skills[0];

    const contextLines: string[] = [];

    contextLines.push(`- Operator: ${profile?.display_name || 'Operator'}`);
    contextLines.push(
      `- Level: ${progress?.level || 1} (Current XP: ${progress?.current_xp || 0}, Streak: ${progress?.current_streak || 1} days)`
    );

    if (profile?.primary_goal) {
      contextLines.push(`- Primary Sovereign Goal: "${profile.primary_goal}"`);
    }

    if (activeQuests.length > 0) {
      const topQ = activeQuests
        .slice(0, 3)
        .map(q => `"${q.title}" (${q.difficulty}, +${q.rewardXp} XP)`)
        .join('; ');
      contextLines.push(`- Active Quests (${activeQuests.length}): ${topQ}`);
    } else {
      contextLines.push('- Active Quests: None scheduled today');
    }

    if (activeGoals.length > 0) {
      contextLines.push(
        `- Macro Goal: "${activeGoals[0].title}" (${activeGoals[0].progressPercent}% complete)`
      );
    }

    if (activeSkill) {
      contextLines.push(`- Active Skill Track: "${activeSkill.name}" (Level ${activeSkill.level})`);
    }

    contextLines.push(
      `- Finance: Monthly Income ₹${finance.monthlyIncome}, Expenses ₹${finance.monthlyExpenses}, Net Savings ₹${finance.monthlySavings}`
    );

    if (relevantMemories.length > 0) {
      const memoryText = relevantMemories
        .slice(0, 4)
        .map(memory => {
          const score = typeof memory.rrf_score === 'number'
            ? ` relevance=${memory.rrf_score.toFixed(4)}`
            : '';
          return `[${memory.type}${score}] ${memory.title}: ${memory.content}`;
        })
        .join(' | ');

      contextLines.push(`- Relevant Second-Brain Memory: ${memoryText}`);
    }

    if (pageContext) {
      contextLines.push(`- Current Operator Screen: /${pageContext}`);
    }

    return contextLines.join('\n');
  } catch (err) {
    console.warn('[CONTEXT BUILDER]: Fallback context applied:', err);
    return '- Telemetry: Basic operator session active';
  }
}
