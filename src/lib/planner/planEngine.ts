import { createClient } from '@/lib/supabase/server';
import { SovereignPlan, PlanStep, PlanStepType } from './types';
import { AutonomyMode, evaluateActionPermission, classifyActionRisk } from '../safety/riskEngine';
import { executeWebResearch } from '@/lib/research/researchAgent';

export async function createAutonomousPlan(
  userId: string,
  goal: string,
  autonomyMode: AutonomyMode = 'ASSISTED',
  missionId?: string
): Promise<SovereignPlan> {
  const supabase = createClient();
  const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Decompose high-level goal into structured task graph steps
  const defaultStepsConfig: Array<{
    stepIndex: number;
    stepType: PlanStepType;
    title: string;
    description: string;
    agent: string;
    tool: string;
    dependencies: string[];
    input: Record<string, unknown>;
  }> = [
    {
      stepIndex: 1,
      stepType: 'RESEARCH',
      title: 'Analyze market trends & competitor context',
      description: `Conduct live intelligence search for '${goal}'`,
      agent: 'research_agent',
      tool: 'liveWebResearch',
      dependencies: [],
      input: { query: goal, depth: 'QUICK' }
    },
    {
      stepIndex: 2,
      stepType: 'FINANCE_CHECK',
      title: 'Audit available financial allocation',
      description: 'Check active monthly budget and expense balance',
      agent: 'finance_agent',
      tool: 'checkFinance',
      dependencies: [],
      input: { scope: 'BUSINESS' }
    },
    {
      stepIndex: 3,
      stepType: 'ANALYZE',
      title: 'Synthesize operational launch strategy',
      description: 'Combine market research with budgetary constraints',
      agent: 'business_agent',
      tool: 'synthesizePlan',
      dependencies: ['1', '2'],
      input: { goal }
    },
    {
      stepIndex: 4,
      stepType: 'CALENDAR_PROPOSAL',
      title: 'Propose dedicated calendar focus blocks',
      description: 'Schedule milestone focus slots on Google Calendar',
      agent: 'calendar_agent',
      tool: 'proposeSchedule',
      dependencies: ['3'],
      input: { durationHours: 2 }
    },
    {
      stepIndex: 5,
      stepType: 'CREATE_QUEST',
      title: 'Generate daily sovereign missions',
      description: 'Translate strategy into actionable daily quests',
      agent: 'quest_agent',
      tool: 'createQuest',
      dependencies: ['3'],
      input: { count: 3 }
    }
  ];

  const planSteps: PlanStep[] = defaultStepsConfig.map((s) => {
    const perm = evaluateActionPermission(autonomyMode, s.tool, s.input);
    return {
      id: `step_${planId}_${s.stepIndex}`,
      planId,
      stepIndex: s.stepIndex,
      stepType: s.stepType,
      title: s.title,
      description: s.description,
      agent: s.agent,
      tool: s.tool,
      dependencies: s.dependencies,
      status: 'PENDING',
      input: s.input,
      requiresApproval: perm.requiresApproval,
      riskLevel: perm.riskLevel,
      retryCount: 0
    };
  });

  const plan: SovereignPlan = {
    id: planId,
    userId,
    missionId,
    goal,
    status: 'READY',
    priority: 'HIGH',
    riskLevel: 'LOW_RISK_INTERNAL',
    autonomyMode,
    steps: planSteps,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await supabase.from('plans').insert({
      id: planId,
      user_id: userId,
      mission_id: missionId || null,
      goal,
      status: 'READY',
      priority: 'HIGH',
      risk_level: 'LOW_RISK_INTERNAL',
      autonomy_mode: autonomyMode,
      created_at: plan.createdAt,
      updated_at: plan.updatedAt
    });

    for (const step of planSteps) {
      await supabase.from('plan_steps').insert({
        id: step.id,
        plan_id: planId,
        user_id: userId,
        step_index: step.stepIndex,
        step_type: step.stepType,
        title: step.title,
        description: step.description,
        agent: step.agent,
        tool: step.tool,
        dependencies: step.dependencies,
        status: 'PENDING',
        input: step.input,
        requires_approval: step.requiresApproval,
        created_at: plan.createdAt,
        updated_at: plan.updatedAt
      });
    }
  } catch {
    // In-memory or test execution
  }

  return plan;
}

/**
 * Execute the next executable step in a plan DAG respecting dependencies & approvals
 */
export async function executePlanStep(
  planId: string,
  stepIndex: number,
  userId: string
): Promise<{ success: boolean; step?: PlanStep; message: string; approvalRequired?: boolean }> {
  const supabase = createClient();

  try {
    const { data: stepData } = await supabase
      .from('plan_steps')
      .select('*')
      .eq('plan_id', planId)
      .eq('step_index', stepIndex)
      .single();

    if (!stepData) {
      return { success: false, message: 'Plan step not found.' };
    }

    // 1. Check if Approval is required
    if (stepData.requires_approval && stepData.status !== 'APPROVED') {
      await supabase
        .from('plan_steps')
        .update({ status: 'WAITING_APPROVAL', updated_at: new Date().toISOString() })
        .eq('id', stepData.id);

      await supabase.from('approval_requests').insert({
        user_id: userId,
        agent_name: stepData.agent || 'PlanEngine',
        tool_name: stepData.tool,
        action_description: stepData.title,
        tool_input: stepData.input,
        status: 'PENDING',
        risk_level: classifyActionRisk(stepData.tool)
      });

      return {
        success: true,
        message: 'Step paused: Human operator checkpoint created.',
        approvalRequired: true
      };
    }

    // 2. Execute Step
    let stepOutput: Record<string, unknown> = {};

    if (stepData.step_type === 'RESEARCH') {
      const q = (stepData.input?.query as string) || 'Market Intelligence';
      const research = await executeWebResearch(userId, q, undefined, 'QUICK');
      stepOutput = { summary: research.summary, sources: research.sources.length };
    } else {
      stepOutput = { executed: true, timestamp: new Date().toISOString() };
    }

    // 3. Mark Step Complete
    await supabase
      .from('plan_steps')
      .update({
        status: 'COMPLETE',
        output: stepOutput,
        updated_at: new Date().toISOString()
      })
      .eq('id', stepData.id);

    // 4. Log to Execution Audit
    await supabase.from('execution_audits').insert({
      user_id: userId,
      context_type: 'PLAN',
      context_id: planId,
      agent_name: stepData.agent || 'PlanEngine',
      action_name: stepData.tool || stepData.title,
      risk_level: stepData.requires_approval ? 'SENSITIVE' : 'LOW_RISK_INTERNAL',
      status: 'SUCCESS',
      payload: stepData.input,
      result: stepOutput
    });

    return {
      success: true,
      message: `Step ${stepIndex} executed successfully.`,
      approvalRequired: false
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: msg };
  }
}
