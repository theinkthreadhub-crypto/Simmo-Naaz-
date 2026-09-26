import { createClient } from '@/lib/supabase/server';
import { redactForAudit } from '@/lib/safety/auditRedaction';
import { MENTRA_TOOL_REGISTRY } from '@/lib/ai/tools/registry';

export type ApprovalDecision = 'APPROVE' | 'REJECT';

export interface ApprovalDecisionResult {
  success: boolean;
  status: 'APPROVED' | 'REJECTED' | 'FAILED' | 'EXPIRED';
  message: string;
  result?: unknown;
  error?: string;
}

export async function executeApprovalDecision(
  userId: string,
  approvalId: string,
  decision: ApprovalDecision
): Promise<ApprovalDecisionResult> {
  const supabase = createClient();

  const { data: approval, error: fetchError } = await supabase
    .from('approval_requests')
    .select('*')
    .eq('id', approvalId)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError || !approval) {
    return {
      success: false,
      status: 'FAILED',
      message: 'Approval request was not found.',
      error: fetchError?.message || 'APPROVAL_NOT_FOUND'
    };
  }

  if (approval.status !== 'PENDING') {
    return {
      success: false,
      status: approval.status === 'EXPIRED' ? 'EXPIRED' : 'FAILED',
      message: `Approval is already ${approval.status}.`,
      error: 'APPROVAL_NOT_PENDING'
    };
  }

  if (approval.expires_at && new Date(approval.expires_at).getTime() <= Date.now()) {
    await supabase
      .from('approval_requests')
      .update({
        status: 'EXPIRED',
        updated_at: new Date().toISOString()
      })
      .eq('id', approvalId)
      .eq('user_id', userId)
      .eq('status', 'PENDING');

    return {
      success: false,
      status: 'EXPIRED',
      message: 'Approval request expired before execution.',
      error: 'APPROVAL_EXPIRED'
    };
  }

  if (decision === 'REJECT') {
    const { error } = await supabase
      .from('approval_requests')
      .update({
        status: 'REJECTED',
        updated_at: new Date().toISOString()
      })
      .eq('id', approvalId)
      .eq('user_id', userId)
      .eq('status', 'PENDING');

    if (error) {
      return {
        success: false,
        status: 'FAILED',
        message: 'Could not reject approval request.',
        error: error.message
      };
    }

    return {
      success: true,
      status: 'REJECTED',
      message: 'Action rejected by operator.'
    };
  }

  const tool = MENTRA_TOOL_REGISTRY[approval.tool_name];
  if (!tool) {
    await supabase
      .from('approval_requests')
      .update({
        status: 'FAILED',
        error_message: 'APPROVED_TOOL_NOT_REGISTERED',
        updated_at: new Date().toISOString()
      })
      .eq('id', approvalId)
      .eq('user_id', userId)
      .eq('status', 'PENDING');

    return {
      success: false,
      status: 'FAILED',
      message: `Tool "${approval.tool_name}" is no longer registered.`,
      error: 'APPROVED_TOOL_NOT_REGISTERED'
    };
  }

  const parsed = tool.schema.safeParse(approval.tool_input || {});
  if (!parsed.success) {
    const errorMessage = parsed.error.errors
      .map(error => `${error.path.join('.')}: ${error.message}`)
      .join('; ');

    await supabase
      .from('approval_requests')
      .update({
        status: 'FAILED',
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', approvalId)
      .eq('user_id', userId)
      .eq('status', 'PENDING');

    return {
      success: false,
      status: 'FAILED',
      message: 'Approved action failed validation.',
      error: errorMessage
    };
  }

  // Atomic claim prevents two web/WhatsApp approval clicks executing the same action.
  const { data: claimed, error: claimError } = await supabase
    .from('approval_requests')
    .update({
      status: 'EXECUTING',
      updated_at: new Date().toISOString()
    })
    .eq('id', approvalId)
    .eq('user_id', userId)
    .eq('status', 'PENDING')
    .select('id')
    .maybeSingle();

  if (claimError || !claimed) {
    return {
      success: false,
      status: 'FAILED',
      message: 'Approval was already claimed or could not be claimed.',
      error: claimError?.message || 'APPROVAL_CLAIM_FAILED'
    };
  }

  const startedAt = Date.now();
  let toolResult;

  try {
    toolResult = await tool.execute(parsed.data, {
      userId,
      idempotencyKey: `approval_${approvalId}`,
      approved: true
    });
  } catch (error) {
    toolResult = {
      ok: false,
      errorCode: 'APPROVED_TOOL_EXCEPTION',
      message: error instanceof Error ? error.message : String(error)
    };
  }

  const latencyMs = Date.now() - startedAt;

  await supabase.from('ai_tool_calls').insert({
    user_id: userId,
    tool_name: approval.tool_name,
    input: redactForAudit(parsed.data),
    output: redactForAudit(toolResult.data || {}),
    status: toolResult.ok ? 'SUCCESS' : 'FAILED',
    idempotency_key: `approval_${approvalId}`,
    latency_ms: latencyMs,
    error_message: toolResult.ok ? null : (toolResult.errorCode || toolResult.message)
  });

  if (!toolResult.ok) {
    await supabase
      .from('approval_requests')
      .update({
        status: 'FAILED',
        result: redactForAudit(toolResult.data || {}),
        error_message: toolResult.errorCode || toolResult.message || 'TOOL_FAILED',
        executed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', approvalId)
      .eq('user_id', userId)
      .eq('status', 'EXECUTING');

    return {
      success: false,
      status: 'FAILED',
      message: toolResult.message || 'Approved action failed.',
      result: toolResult.data,
      error: toolResult.errorCode
    };
  }

  await supabase
    .from('approval_requests')
    .update({
      status: 'APPROVED',
      result: redactForAudit(toolResult.data || {}),
      error_message: null,
      executed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', approvalId)
    .eq('user_id', userId)
    .eq('status', 'EXECUTING');

  return {
    success: true,
    status: 'APPROVED',
    message: toolResult.message || 'Approved action executed successfully.',
    result: toolResult.data
  };
}
