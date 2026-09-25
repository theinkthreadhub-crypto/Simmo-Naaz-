import { NextRequest, NextResponse } from 'next/server';
import { createWorkspace, getUserWorkspaces } from '@/lib/db/workspace';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'usr_operator_naaz';

    const workspaces = await getUserWorkspaces(userId);
    return NextResponse.json({ workspaces });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, owner_id, business_id } = body;

    if (!name || !type || !owner_id) {
      return NextResponse.json({ error: 'Missing required fields: name, type, owner_id' }, { status: 400 });
    }

    const ws = await createWorkspace({
      name,
      type,
      owner_id,
      business_id,
    });

    return NextResponse.json({ workspace: ws }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
