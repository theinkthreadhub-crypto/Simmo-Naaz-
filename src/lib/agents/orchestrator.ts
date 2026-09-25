import { createClient } from '@/lib/supabase/server';
import { executeWebResearch } from '../research/researchAgent';
import { getUserFinance } from '../db/finance';
import { getUserQuests } from '../db/quests';
import { getUserGoals } from '../db/goals';
import { searchGmail } from '../integrations/google/gmail';
import { getGoogleCalendarEvents } from '../integrations/google/calendar';

export interface MultiAgentTaskInput {
  taskTitle: string;
  agentChain: string[]; // e.g. ['ag_business', 'ag_research', 'ag_finance']
  query: string;
  context?: Record<string, any>;
}

export interface MultiAgentTaskResult {
  taskId: string;
  status: 'COMPLETE' | 'PARTIAL' | 'WAITING_APPROVAL' | 'FAILED';
  currentStage: string;
  results: Record<string, any>;
  summary: string;
  approvalRequired?: boolean;
  approvalDetails?: {
    actionType: string;
    description: string;
    payload: Record<string, any>;
  };
}

export async function runMultiAgentTask(
  userId: string,
  input: MultiAgentTaskInput
): Promise<MultiAgentTaskResult> {
  const supabase = createClient();
  const taskId = `task_${Date.now()}`;

  // 1. Initialize Task in Queue
  try {
    await supabase.from('agent_tasks').insert({
      user_id: userId,
      agent_id: input.agentChain[0] || 'ag_core',
      title: input.taskTitle,
      task_type: 'MULTI_AGENT_CHAIN',
      input: input as any,
      status: 'RUNNING',
      current_stage: 'INITIALIZING'
    });
  } catch (err) {
    console.warn('[ORCHESTRATOR]: Failed to create agent task record:', err);
  }

  const results: Record<string, any> = {};
  let currentStage = 'PLANNING';

  try {
    // Stage 1: Market & Strategy Intelligence (Research Agent)
    if (input.agentChain.includes('ag_research') || input.query.toLowerCase().includes('trend') || input.query.toLowerCase().includes('research')) {
      currentStage = 'RESEARCHING_MARKET';
      const research = await executeWebResearch(userId, input.query, 'Strategic business expansion and tactics', 'STANDARD');
      results.research = research;
    }

    // Stage 2: Financial Runway & Ledgers (Finance Agent)
    if (input.agentChain.includes('ag_finance') || input.query.toLowerCase().includes('budget') || input.query.toLowerCase().includes('growth') || input.query.toLowerCase().includes('plan')) {
      currentStage = 'ANALYZING_FINANCIALS';
      const finance = await getUserFinance(userId);
      results.finance = {
        monthlyIncome: finance.monthlyIncome,
        monthlyExpenses: finance.monthlyExpenses,
        monthlySavings: finance.monthlySavings,
        burnRateSafe: finance.monthlySavings >= 0
      };
    }

    // Stage 3: Operator Mission Status (Business Agent)
    currentStage = 'SYNTHESIZING_BUSINESS_PLAN';
    const [quests, goals] = await Promise.all([
      getUserQuests(userId),
      getUserGoals(userId)
    ]);
    results.activeQuestsCount = quests.filter(q => q.status === 'ACTIVE').length;
    results.macroGoals = goals.filter(g => g.status === 'IN_PROGRESS').map(g => g.title);

    // Stage 4: Calendar Availability Check (Calendar Agent)
    if (input.agentChain.includes('ag_calendar')) {
      currentStage = 'CHECKING_TIME_HORIZON';
      const cal = await getGoogleCalendarEvents(userId);
      results.calendarEvents = cal.events;
    }

    const summary = `Multi-Agent Executive Plan synthesized. Market intelligence incorporated (${results.research?.sources?.length || 0} sources), monthly burn audited (₹${results.finance?.monthlyExpenses || 0}), and aligned with ${results.macroGoals?.length || 0} sovereign goals.`;

    // 5. Update Task Queue to COMPLETE
    try {
      await supabase
        .from('agent_tasks')
        .update({
          status: 'COMPLETE',
          current_stage: 'COMPLETE',
          output: results as any,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('title', input.taskTitle);
    } catch {}

    return {
      taskId,
      status: 'COMPLETE',
      currentStage: 'COMPLETE',
      results,
      summary
    };

  } catch (err: any) {
    console.error('[ORCHESTRATOR ERROR]:', err);
    try {
      await supabase
        .from('agent_tasks')
        .update({
          status: 'FAILED',
          current_stage: currentStage,
          error_message: err.message,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('title', input.taskTitle);
    } catch {}

    return {
      taskId,
      status: 'FAILED',
      currentStage,
      results,
      summary: `Multi-agent task failed at stage ${currentStage}: ${err.message}`
    };
  }
}
