import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  ApprovalDecision,
  executeApprovalDecision
} from '@/lib/approvals/executor';

export async function GET() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const { data: approvals, error } = await supabase
    .from('approval_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, approvals: approvals || [] });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const approvalId =
    typeof body.approvalId === 'string' ? body.approvalId : '';
  const decision = body.decision as ApprovalDecision;

  if (
    !approvalId ||
    (decision !== 'APPROVE' && decision !== 'REJECT')
  ) {
    return NextResponse.json(
      { success: false, error: 'approvalId and valid decision required' },
      { status: 400 }
    );
  }

  const result = await executeApprovalDecision(
    user.id,
    approvalId,
    decision
  );

  return NextResponse.json(
    result,
    { status: result.success ? 200 : result.status === 'EXPIRED' ? 410 : 400 }
  );
}
