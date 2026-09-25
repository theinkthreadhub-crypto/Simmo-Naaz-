import { NextRequest, NextResponse } from 'next/server';
import { 
  getWorkspaceTasks, 
  createWorkspaceTask, 
  updateWorkspaceTaskStatus, 
  can 
} from '@/lib/db/workspace';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = params.id;
    const tasks = await getWorkspaceTasks(workspaceId);
    return NextResponse.json({ tasks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = params.id;
    const body = await req.json();
    const { title, description, created_by, assigned_to, priority, due_date, project_id, campaign_id } = body;

    if (!title || !created_by) {
      return NextResponse.json({ error: 'Missing title or created_by' }, { status: 400 });
    }

    const isAllowed = await can(created_by, 'tasks.create', workspaceId);
    if (!isAllowed) {
      return NextResponse.json({ error: 'FORBIDDEN: Insufficient permissions to create tasks' }, { status: 403 });
    }

    const task = await createWorkspaceTask({
      workspace_id: workspaceId,
      project_id,
      campaign_id,
      title,
      description,
      created_by,
      assigned_to,
      priority,
      due_date,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const _workspaceId = params.id;
    const body = await req.json();
    const { taskId, status, actorId, blockerReason } = body;

    if (!taskId || !status || !actorId) {
      return NextResponse.json({ error: 'Missing taskId, status, or actorId' }, { status: 400 });
    }

    const updated = await updateWorkspaceTaskStatus(taskId, status, actorId, blockerReason);
    if (!updated) {
      return NextResponse.json({ error: 'Task not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ task: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
