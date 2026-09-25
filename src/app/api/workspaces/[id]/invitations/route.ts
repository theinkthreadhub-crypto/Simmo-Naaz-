import { NextRequest, NextResponse } from 'next/server';
import { createInvitation, can } from '@/lib/db/workspace';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = params.id;
    const body = await req.json();
    const { email, role, invited_by, expiresInDays } = body;

    if (!email || !role || !invited_by) {
      return NextResponse.json({ error: 'Missing required fields: email, role, invited_by' }, { status: 400 });
    }

    const isAllowed = await can(invited_by, 'members.invite', workspaceId);
    if (!isAllowed) {
      return NextResponse.json({ error: 'FORBIDDEN: Insufficient permissions to invite members' }, { status: 403 });
    }

    const invitation = await createInvitation({
      workspace_id: workspaceId,
      email,
      role,
      invited_by,
      expiresInDays,
    });

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
