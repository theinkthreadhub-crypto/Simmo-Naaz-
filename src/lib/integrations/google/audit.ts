import { createClient } from '@/lib/supabase/server';

export type ExternalActionStatus = 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REJECTED';

export async function findExternalActionByIdempotency(
  userId: string,
  idempotencyKey?: string
): Promise<any | null> {
  if (!idempotencyKey) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('external_action_logs')
    .select('id, service, action_type, result, status, created_at')
    .eq('user_id', userId)
    .eq('idempotency_key', idempotencyKey)
    .eq('status', 'SUCCESS')
    .maybeSingle();

  if (error) return null;
  return data || null;
}

export async function logExternalGoogleAction(
  userId: string,
  input: {
    service: string;
    actionType: string;
    payload: Record<string, unknown>;
    result?: Record<string, unknown>;
    status: ExternalActionStatus;
    approvalId?: string;
    idempotencyKey?: string;
  }
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('external_action_logs').insert({
    user_id: userId,
    agent_id: 'mentra_core',
    service: input.service,
    action_type: input.actionType,
    payload: input.payload,
    result: input.result || {},
    status: input.status,
    approval_id: input.approvalId || null,
    idempotency_key: input.idempotencyKey || null
  });

  return !error;
}
