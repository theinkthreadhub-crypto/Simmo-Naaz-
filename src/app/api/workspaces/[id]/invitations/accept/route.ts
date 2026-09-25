import { NextRequest, NextResponse } from 'next/server';
import { acceptInvitation } from '@/lib/db/workspace';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, userId } = body;

    if (!token || !userId) {
      return NextResponse.json({ error: 'Missing token or userId' }, { status: 400 });
    }

    const result = await acceptInvitation(token, userId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, workspace_id: result.workspace_id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
