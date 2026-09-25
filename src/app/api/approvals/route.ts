import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendGmailMessage } from '@/lib/integrations/google/gmail';
import { appendGoogleSheetRow } from '@/lib/integrations/google/sheets';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { data: approvals, error } = await supabase
    .from('approval_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, approvals: approvals || [] });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { approvalId, decision } = body; // decision: 'APPROVE' | 'REJECT'

    if (!approvalId || !decision) {
      return NextResponse.json({ success: false, error: 'approvalId and decision required' }, { status: 400 });
    }

    // 1. Fetch approval request
    const { data: approval, error } = await supabase
      .from('approval_requests')
      .select('*')
      .eq('id', approvalId)
      .eq('user_id', user.id)
      .single();

    if (error || !approval) {
      return NextResponse.json({ success: false, error: 'APPROVAL_NOT_FOUND' }, { status: 404 });
    }

    if (approval.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: `Approval is already ${approval.status}` }, { status: 400 });
    }

    if (decision === 'REJECT') {
      await supabase
        .from('approval_requests')
        .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
        .eq('id', approvalId);

      // Log external action rejected
      await supabase.from('external_action_logs').insert({
        user_id: user.id,
        agent_id: 'ag_approvals',
        service: approval.tool_name,
        action_type: 'REJECTED_BY_OPERATOR',
        payload: approval.tool_input,
        status: 'REJECTED',
        approval_id: approvalId
      });

      return NextResponse.json({ success: true, message: 'Action rejected by operator.' });
    }

    // 2. Execute Approved Action
    let executionResult: any = null;
    let actionError: string | null = null;

    if (approval.tool_name === 'sendEmail') {
      const input = approval.tool_input;
      const res = await sendGmailMessage(user.id, input.to, input.subject, input.body);
      if (res.error) actionError = res.error;
      else executionResult = res;
    } else if (approval.tool_name === 'appendToSheet') {
      const input = approval.tool_input;
      const res = await appendGoogleSheetRow(user.id, input.spreadsheetId, input.range, input.values);
      if (res.error) actionError = res.error;
      else executionResult = res;
    }

    if (actionError) {
      return NextResponse.json({ success: false, error: actionError }, { status: 500 });
    }

    // 3. Mark Approved
    await supabase
      .from('approval_requests')
      .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
      .eq('id', approvalId);

    // 4. Log to external_action_logs
    await supabase.from('external_action_logs').insert({
      user_id: user.id,
      agent_id: 'ag_approvals',
      service: approval.tool_name,
      action_type: 'EXECUTE_APPROVED_ACTION',
      payload: approval.tool_input,
      result: executionResult || {},
      status: 'SUCCESS',
      approval_id: approvalId
    });

    return NextResponse.json({
      success: true,
      message: 'Approved action executed successfully.',
      result: executionResult
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
