import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceActivity } from '@/lib/db/workspace';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = params.id;
    const activity = await getWorkspaceActivity(workspaceId);
    return NextResponse.json({ activity });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
