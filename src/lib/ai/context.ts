import { getProfile, getPlayerProgress, getPlayerStats } from '@/lib/db/profiles';
import { getUserQuests } from '@/lib/db/quests';
import { getUserGoals } from '@/lib/db/goals';
import { getUserFinance } from '@/lib/db/finance';
import { getUserMemories } from '@/lib/db/memories';
import { getUserSkills } from '@/lib/db/skills';

export async function buildMentraContext(userId: string, currentMessage?: string, pageContext?: string): Promise<string> {
  try {
    const [profile, progress, quests, goals, finance, skills, memories] = await Promise.all([
      getProfile(userId),
      getPlayerProgress(userId),
      getUserQuests(userId),
      getUserGoals(userId),
      getUserFinance(userId),
      getUserSkills(userId),
      getUserMemories(userId)
    ]);

    const activeQuests = quests.filter(q => q.status === 'ACTIVE');
    const activeGoals = goals.filter(g => g.status === 'IN_PROGRESS');
    const activeSkill = skills[0];

    const contextLines: string[] = [];

    // Base Operator Profile
    contextLines.push(`- Operator: ${profile?.display_name || 'Operator'}`);
    contextLines.push(`- Level: ${progress?.level || 1} (Current XP: ${progress?.current_xp || 0}, Streak: ${progress?.current_streak || 1} days)`);
    if (profile?.primary_goal) {
      contextLines.push(`- Primary Sovereign Goal: "${profile.primary_goal}"`);
    }

    // Active Quests
    if (activeQuests.length > 0) {
      const topQ = activeQuests.slice(0, 3).map(q => `"${q.title}" (${q.difficulty}, +${q.rewardXp} XP)`).join('; ');
      contextLines.push(`- Active Quests (${activeQuests.length}): ${topQ}`);
    } else {
      contextLines.push(`- Active Quests: None scheduled today`);
    }

    // Active Goals
    if (activeGoals.length > 0) {
      contextLines.push(`- Macro Goal: "${activeGoals[0].title}" (${activeGoals[0].progressPercent}% complete)`);
    }

    // Active Learning
    if (activeSkill) {
      contextLines.push(`- Active Skill Track: "${activeSkill.name}" (Level ${activeSkill.level})`);
    }

    // Finance Snapshot
    contextLines.push(`- Finance: Monthly Income ₹${finance.monthlyIncome}, Expenses ₹${finance.monthlyExpenses}, Net Savings ₹${finance.monthlySavings}`);

    // Contextual relevance to current message
    if (currentMessage) {
      const q = currentMessage.toLowerCase();
      if (q.includes('memory') || q.includes('decide') || q.includes('remember') || q.includes('yaad') || q.includes('ads')) {
        const matched = memories.filter(m => 
          m.title.toLowerCase().includes(q) || 
          m.content.toLowerCase().includes(q) ||
          m.tags?.some((t: string) => t.toLowerCase().includes(q))
        ).slice(0, 2);

        if (matched.length > 0) {
          contextLines.push(`- Relevant Neural Memories: ${matched.map(m => `[${m.type}]: ${m.title} - ${m.content}`).join(' | ')}`);
        }
      }
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
