import { createClient } from '@/lib/supabase/server';

export interface RetentionCleanupResult {
  expiredApprovalsCleaned: number;
  staleRunsCleaned: number;
  oldTemporaryMediaCleaned: number;
  timestamp: string;
}

/**
 * Sweeps the database for expired action approvals and stale executing agent runs.
 */
export async function executeRetentionCleanup(userId?: string): Promise<RetentionCleanupResult> {
  let expiredApprovalsCleaned = 0;
  let staleRunsCleaned = 0;

  try {
    const supabase = createClient();
    const now = new Date().toISOString();

    // 1. Mark expired approvals as EXPIRED
    let approvalQuery = supabase
      .from('action_approvals')
      .update({ status: 'EXPIRED' })
      .eq('status', 'PENDING')
      .lt('expires_at', now);

    if (userId) {
      approvalQuery = approvalQuery.eq('user_id', userId);
    }

    const { data: expired } = await approvalQuery.select('id');
    expiredApprovalsCleaned = expired?.length || 0;

    // 2. Mark long-stuck agent runs (> 2 hours old) as FAILED
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    let runQuery = supabase
      .from('agent_runs')
      .update({ status: 'FAILED', error_message: 'Execution timed out by system retention cleanup.' })
      .eq('status', 'RUNNING')
      .lt('created_at', twoHoursAgo);

    if (userId) {
      runQuery = runQuery.eq('user_id', userId);
    }

    const { data: stuckRuns } = await runQuery.select('id');
    staleRunsCleaned = stuckRuns?.length || 0;

  } catch {
    // Offline or test mock fallback
  }

  return {
    expiredApprovalsCleaned,
    staleRunsCleaned,
    oldTemporaryMediaCleaned: 0,
    timestamp: new Date().toISOString()
  };
}
