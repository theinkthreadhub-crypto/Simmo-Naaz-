import { createClient } from '@/lib/supabase/server';

export interface RecoveryAction {
  action: string;
  targetType: string;
  targetId?: string;
  userId?: string;
  status: 'RECOVERED' | 'FAILED' | 'SKIPPED';
  message: string;
}

export interface RecoverySummary {
  enabled: boolean;
  startedAt: string;
  completedAt: string;
  recovered: number;
  failed: number;
  skipped: number;
  actions: RecoveryAction[];
}

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function isoMinutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function scoped(query: any, userId?: string) {
  return userId ? query.eq('user_id', userId) : query;
}

async function recordEvent(
  supabase: ReturnType<typeof createClient>,
  action: RecoveryAction
): Promise<void> {
  try {
    await supabase.from('system_recovery_events').insert({
      user_id: action.userId || null,
      action: action.action,
      target_type: action.targetType,
      target_id: action.targetId || null,
      status: action.status,
      details: { message: action.message }
    });
  } catch {
    // Recovery must not fail because observability storage is unavailable.
  }
}

export async function runAutomaticRecovery(
  userId?: string,
  force: boolean = false
): Promise<RecoverySummary> {
  const enabled = force || process.env.SYSTEM_AUTO_RECOVERY !== 'false';
  const startedAt = new Date().toISOString();
  const actions: RecoveryAction[] = [];

  if (!enabled) {
    return {
      enabled: false,
      startedAt,
      completedAt: new Date().toISOString(),
      recovered: 0,
      failed: 0,
      skipped: 1,
      actions: []
    };
  }

  const supabase = createClient();

  try {
    let query = supabase
      .from('scheduled_jobs')
      .select('id, user_id, status, attempt_count, max_attempts, scheduled_for')
      .in('status', ['CLAIMED', 'RUNNING'])
      .lt('updated_at', isoMinutesAgo(15))
      .limit(25);

    query = scoped(query, userId);
    const { data: jobs, error } = await query;

    if (!error) {
      for (const job of jobs || []) {
        const attempts = Number(job.attempt_count || 0);
        const maxAttempts = Number(job.max_attempts || 3);
        const retryable = attempts < maxAttempts;
        const retryAt = retryable ? isoMinutesFromNow(1) : null;

        const { error: updateError } = await supabase
          .from('scheduled_jobs')
          .update({
            status: retryable ? 'SCHEDULED' : 'FAILED',
            scheduled_for: retryAt || job.scheduled_for,
            next_run_at: retryAt,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id)
          .eq('user_id', job.user_id)
          .in('status', ['CLAIMED', 'RUNNING']);

        const action: RecoveryAction = {
          action: retryable ? 'REQUEUE_STALE_JOB' : 'FAIL_EXHAUSTED_JOB',
          targetType: 'scheduled_job',
          targetId: job.id,
          userId: job.user_id,
          status: updateError ? 'FAILED' : 'RECOVERED',
          message: updateError
            ? updateError.message
            : retryable
              ? 'Stale claimed job re-queued safely.'
              : 'Stale job exhausted retry budget and was failed closed.'
        };

        actions.push(action);
        await recordEvent(supabase, action);
      }
    }
  } catch {
    // Continue with other recovery domains.
  }

  try {
    let pendingQuery = supabase
      .from('approval_requests')
      .select('id, user_id')
      .eq('status', 'PENDING')
      .lte('expires_at', new Date().toISOString())
      .limit(50);

    pendingQuery = scoped(pendingQuery, userId);
    const { data: expired } = await pendingQuery;

    for (const approval of expired || []) {
      const { error } = await supabase
        .from('approval_requests')
        .update({
          status: 'EXPIRED',
          updated_at: new Date().toISOString()
        })
        .eq('id', approval.id)
        .eq('user_id', approval.user_id)
        .eq('status', 'PENDING');

      const action: RecoveryAction = {
        action: 'EXPIRE_STALE_APPROVAL',
        targetType: 'approval_request',
        targetId: approval.id,
        userId: approval.user_id,
        status: error ? 'FAILED' : 'RECOVERED',
        message: error?.message || 'Expired approval removed from executable state.'
      };

      actions.push(action);
      await recordEvent(supabase, action);
    }
  } catch {
    // Continue.
  }

  try {
    let executingQuery = supabase
      .from('approval_requests')
      .select('id, user_id')
      .eq('status', 'EXECUTING')
      .lt('updated_at', isoMinutesAgo(15))
      .limit(25);

    executingQuery = scoped(executingQuery, userId);
    const { data: stuckApprovals } = await executingQuery;

    for (const approval of stuckApprovals || []) {
      const { error } = await supabase
        .from('approval_requests')
        .update({
          status: 'FAILED',
          error_message: 'RECOVERY_STALE_EXECUTION',
          updated_at: new Date().toISOString()
        })
        .eq('id', approval.id)
        .eq('user_id', approval.user_id)
        .eq('status', 'EXECUTING');

      const action: RecoveryAction = {
        action: 'FAIL_STALE_APPROVAL_EXECUTION',
        targetType: 'approval_request',
        targetId: approval.id,
        userId: approval.user_id,
        status: error ? 'FAILED' : 'RECOVERED',
        message: error?.message || 'Stuck approval execution failed closed.'
      };

      actions.push(action);
      await recordEvent(supabase, action);
    }
  } catch {
    // Continue.
  }

  try {
    let agentQuery = supabase
      .from('agent_runtime_state')
      .select('id, user_id, agent_key')
      .eq('status', 'PAUSED')
      .not('next_run_at', 'is', null)
      .lte('next_run_at', new Date().toISOString())
      .limit(25);

    agentQuery = scoped(agentQuery, userId);
    const { data: agents } = await agentQuery;

    for (const agent of agents || []) {
      const { error } = await supabase
        .from('agent_runtime_state')
        .update({
          status: 'ACTIVE',
          next_run_at: null,
          last_error: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', agent.id)
        .eq('user_id', agent.user_id)
        .eq('status', 'PAUSED');

      const action: RecoveryAction = {
        action: 'RESUME_SCHEDULED_AGENT',
        targetType: 'agent_runtime_state',
        targetId: agent.agent_key,
        userId: agent.user_id,
        status: error ? 'FAILED' : 'RECOVERED',
        message: error?.message || 'Scheduled paused agent returned to ACTIVE state.'
      };

      actions.push(action);
      await recordEvent(supabase, action);
    }
  } catch {
    // Continue.
  }

  try {
    let qrQuery = supabase
      .from('whatsapp_qr_sessions')
      .select('id, user_id')
      .eq('status', 'QR_READY')
      .lte('qr_expires_at', new Date().toISOString())
      .limit(25);

    qrQuery = scoped(qrQuery, userId);
    const { data: qrSessions } = await qrQuery;

    for (const session of qrSessions || []) {
      const { error } = await supabase
        .from('whatsapp_qr_sessions')
        .update({
          status: 'WAITING_QR',
          qr_code: null,
          qr_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id)
        .eq('user_id', session.user_id)
        .eq('status', 'QR_READY');

      const action: RecoveryAction = {
        action: 'CLEAR_EXPIRED_WHATSAPP_QR',
        targetType: 'whatsapp_qr_session',
        targetId: session.id,
        userId: session.user_id,
        status: error ? 'FAILED' : 'RECOVERED',
        message: error?.message || 'Expired WhatsApp QR payload cleared.'
      };

      actions.push(action);
      await recordEvent(supabase, action);
    }
  } catch {
    // Continue.
  }

  return {
    enabled: true,
    startedAt,
    completedAt: new Date().toISOString(),
    recovered: actions.filter(action => action.status === 'RECOVERED').length,
    failed: actions.filter(action => action.status === 'FAILED').length,
    skipped: actions.filter(action => action.status === 'SKIPPED').length,
    actions
  };
}
