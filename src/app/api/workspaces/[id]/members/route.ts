import { NextRequest, NextResponse } from 'next/server';
import { 
  getWorkspaceMembers, 
  updateMemberRole, 
  removeWorkspaceMember, 
  can 
} from '@/lib/db/workspace';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = params.id;
    const members = await getWorkspaceMembers(workspaceId);
    return NextResponse.json({ members });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = params.id;
    const body = await req.json();
    const { targetUserId, newRole, actorId } = body;

    const isAllowed = await can(actorId, 'members.manage', workspaceId);
    if (!isAllowed) {
      return NextResponse.json({ error: 'FORBIDDEN: Insufficient permissions to manage members' }, { status: 403 });
    }

    const success = await updateMemberRole(workspaceId, targetUserId, newRole, actorId);
    if (!success) {
      return NextResponse.json({ error: 'Member not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, targetUserId, newRole });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = params.id;
    const body = await req.json();
    const { targetUserId, actorId } = body;

    const isAllowed = await can(actorId, 'members.manage', workspaceId);
    if (!isAllowed) {
      return NextResponse.json({ error: 'FORBIDDEN: Insufficient permissions to remove members' }, { status: 403 });
    }

    const success = await removeWorkspaceMember(workspaceId, targetUserId, actorId);
    if (!success) {
      return NextResponse.json({ error: 'Member not found or removal failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, targetUserId, status: 'REMOVED' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
