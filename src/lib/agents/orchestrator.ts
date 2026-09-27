import { createClient } from '@/lib/supabase/server';
import { executeWebResearch } from '../research/researchAgent';
import { getUserFinance } from '../db/finance';
import { getUserQuests } from '../db/quests';
import { getUserGoals } from '../db/goals';
import { getGoogleCalendarEvents } from '../integrations/google/calendar';
import { isLeadAgentEnabled, runLeadAgent } from './lead/runner';

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

/**
 * Lead Agent path (AI_LEAD_AGENT=true): AI planning + scoped sub-agents.
 * Returns null on unexpected failure so the legacy pipeline can take over.
 */
async function runViaLeadAgent(
  userId: string,
  input: MultiAgentTaskInput
): Promise<MultiAgentTaskResult | null> {
  try {
    const lead = await runLeadAgent(userId, {
      taskTitle: input.taskTitle,
      query: input.query,
      agentHints: input.agentChain,
      context: input.context
    });

    const approvalCard = lead.cards.find(card => card.requiresApproval && card.approvalId);

    return {
      taskId: lead.runId || `task_${Date.now()}`,
      status: lead.status,
      currentStage: lead.status,
      results: {
        engine: 'LEAD_AGENT',
        plan: lead.plan,
        plannerError: lead.plannerError || null,
        steps: lead.steps.map(({ cards: _cards, ...step }) => step),
        cards: lead.cards,
        usage: lead.usage
      },
      summary: lead.summary,
      approvalRequired: lead.status === 'WAITING_APPROVAL',
      approvalDetails: approvalCard
        ? {
            actionType: String(approvalCard.data?.toolName || 'APPROVAL'),
            description: approvalCard.subtitle || approvalCard.title,
            payload: {
              approvalId: approvalCard.approvalId,
              ...(approvalCard.data?.payload || {})
            }
          }
        : undefined
    };
  } catch (err) {
    console.error('[ORCHESTRATOR]: Lead Agent failed, falling back to legacy pipeline:', err);
    return null;
  }
}

export async function runMultiAgentTask(
  userId: string,
  input: MultiAgentTaskInput
): Promise<MultiAgentTaskResult> {
  if (isLeadAgentEnabled()) {
    const leadResult = await runViaLeadAgent(userId, input);
    if (leadResult) return leadResult;
  }

  const supabase = createClient();
  let taskId = '';
  const results: Record<string, any> = {};
  let currentStage = 'INITIALIZING';

  try {
    const { data: task, error: taskError } = await supabase
      .from('agent_tasks')
      .insert({
        user_id: userId,
        agent_id: input.agentChain[0] || 'ag_core',
        title: input.taskTitle,
        task_type: 'MULTI_AGENT_CHAIN',
        input: input as any,
        status: 'RUNNING',
        current_stage: 'INITIALIZING'
      })
      .select('id')
      .single();

    if (taskError || !task?.id) {
      throw new Error(
        taskError?.message || 'AGENT_TASK_PERSIST_FAILED'
      );
    }

    taskId = task.id;
    currentStage = 'PLANNING';
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
    const { error: completeError } = await supabase
      .from('agent_tasks')
      .update({
        status: 'COMPLETE',
        current_stage: 'COMPLETE',
        output: results as any,
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('user_id', userId);

    if (completeError) throw new Error(completeError.message);

    return {
      taskId,
      status: 'COMPLETE',
      currentStage: 'COMPLETE',
      results,
      summary
    };

  } catch (err: any) {
    console.error('[ORCHESTRATOR ERROR]:', err);
    if (taskId) {
      await supabase
        .from('agent_tasks')
        .update({
          status: 'FAILED',
          current_stage: currentStage,
          error_message: err instanceof Error ? err.message : String(err),
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('user_id', userId);
    }

    return {
      taskId,
      status: 'FAILED',
      currentStage,
      results,
      summary: `Multi-agent task failed at stage ${currentStage}: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}
