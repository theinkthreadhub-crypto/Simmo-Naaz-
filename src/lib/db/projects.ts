import { createClient } from '@/lib/supabase/server';

export interface Project {
  id: string;
  userId: string;
  title: string;
  description?: string;
  objective: string;
  status: 'ACTIVE' | 'ON_TRACK' | 'AT_RISK' | 'BLOCKED' | 'PAUSED' | 'COMPLETE';
  health: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  targetDate?: string;
  relatedGoalId?: string;
  collaborators: Array<{ name: string; role: string; email?: string }>;
  financeBudget: number;
  financeSpent: number;
  nextAction?: string;
  createdAt: string;
}

export interface Decision {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  rationale: string;
  alternatives: string[];
  expectedOutcome?: string;
  actualOutcome?: string;
  status: 'DECIDED' | 'EVALUATED' | 'REVISED';
  source: string;
  decidedAt: string;
}

const memProjects = new Map<string, Project>();
const memDecisions = new Map<string, Decision>();

export async function createProject(
  userId: string,
  proj: {
    title: string;
    description?: string;
    objective: string;
    targetDate?: string;
    relatedGoalId?: string;
    financeBudget?: number;
    nextAction?: string;
  }
): Promise<Project> {
  const id = `prj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newProject: Project = {
    id,
    userId,
    title: proj.title,
    description: proj.description || '',
    objective: proj.objective,
    status: 'ACTIVE',
    health: 'ON_TRACK',
    priority: 'HIGH',
    targetDate: proj.targetDate,
    relatedGoalId: proj.relatedGoalId,
    collaborators: [],
    financeBudget: proj.financeBudget || 0,
    financeSpent: 0,
    nextAction: proj.nextAction || 'Establish initial milestone quests',
    createdAt: new Date().toISOString()
  };

  memProjects.set(id, newProject);

  try {
    const supabase = createClient();
    Promise.resolve(
      supabase.from('projects').insert({
        id,
        user_id: userId,
        title: newProject.title,
        description: newProject.description,
        objective: newProject.objective,
        status: newProject.status,
        health: newProject.health,
        priority: newProject.priority,
        target_date: newProject.targetDate || null,
        related_goal_id: newProject.relatedGoalId || null,
        collaborators: newProject.collaborators,
        finance_budget: newProject.financeBudget,
        finance_spent: newProject.financeSpent,
        next_action: newProject.nextAction,
        created_at: newProject.createdAt
      })
    ).catch(() => {});
  } catch {
    // In-memory fallback
  }

  return newProject;
}

export async function recordDecision(
  userId: string,
  decision: {
    projectId?: string;
    title: string;
    rationale: string;
    alternatives?: string[];
    expectedOutcome?: string;
  }
): Promise<Decision> {
  const id = `dec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newDecision: Decision = {
    id,
    userId,
    projectId: decision.projectId,
    title: decision.title,
    rationale: decision.rationale,
    alternatives: decision.alternatives || [],
    expectedOutcome: decision.expectedOutcome,
    status: 'DECIDED',
    source: 'OPERATOR',
    decidedAt: new Date().toISOString()
  };

  memDecisions.set(id, newDecision);

  try {
    const supabase = createClient();
    Promise.resolve(
      supabase.from('decisions').insert({
        id,
        user_id: userId,
        project_id: newDecision.projectId || null,
        title: newDecision.title,
        rationale: newDecision.rationale,
        alternatives: newDecision.alternatives,
        expected_outcome: newDecision.expectedOutcome,
        status: 'DECIDED',
        source: newDecision.source,
        decided_at: newDecision.decidedAt
      })
    ).catch(() => {});
  } catch {
    // In-memory fallback
  }

  return newDecision;
}

export async function listUserProjects(userId: string): Promise<Project[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        title: d.title,
        description: d.description,
        objective: d.objective,
        status: d.status,
        health: d.health,
        priority: d.priority,
        targetDate: d.target_date,
        relatedGoalId: d.related_goal_id,
        collaborators: d.collaborators || [],
        financeBudget: d.finance_budget || 0,
        financeSpent: d.finance_spent || 0,
        nextAction: d.next_action,
        createdAt: d.created_at
      }));
    }
  } catch {
    // Fallback
  }

  const list: Project[] = [];
  memProjects.forEach(p => {
    if (p.userId === userId) list.push(p);
  });
  return list;
}

export async function listDecisions(userId: string, projectId?: string): Promise<Decision[]> {
  try {
    const supabase = createClient();
    let query = supabase
      .from('decisions')
      .select('*')
      .eq('user_id', userId);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data } = await query.order('decided_at', { ascending: false });
    if (data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        projectId: d.project_id,
        title: d.title,
        rationale: d.rationale,
        alternatives: d.alternatives || [],
        expectedOutcome: d.expected_outcome,
        status: d.status,
        source: d.source,
        decidedAt: d.decided_at
      }));
    }
  } catch {
    // Fallback
  }

  const list: Decision[] = [];
  memDecisions.forEach(d => {
    if (d.userId === userId && (!projectId || d.projectId === projectId)) {
      list.push(d);
    }
  });
  return list;
}

export const getProjects = listUserProjects;
export const getDecisions = listDecisions;

