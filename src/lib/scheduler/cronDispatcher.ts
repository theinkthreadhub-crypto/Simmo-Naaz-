import { createClient } from '@/lib/supabase/server';
import {
  getUserNotificationSettings,
  isDeliveryAllowedNow,
  NotificationCategory
} from '@/lib/notifications/preferences';
import {
  getGoogleCalendarEvents,
  CalendarEventSummary
} from '@/lib/integrations/google/calendar';
import { sendProactiveWhatsApp } from '@/lib/integrations/whatsapp/proactive';
import { runOperativeAgentTick } from '@/lib/agents/operativeAgent';
import { runAutomaticRecovery } from '@/lib/system/recoveryEngine';
import { nextLocalOccurrence } from './userSchedules';

export interface JobExecutionResult {
  jobId: string;
  type: string;
  status: 'COMPLETE' | 'FAILED' | 'SKIPPED';
  message: string;
}

interface WhatsAppConnection {
  phone_number: string;
  last_active_at?: string | null;
}

const CLAIM_LEASE_MINUTES = 5;

function deferredRun(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function addRecurrence(from: Date, recurrence?: string | null): Date | null {
  const next = new Date(from);

  if (!recurrence || recurrence === 'NONE') return null;
  if (recurrence === 'HOURLY') next.setUTCHours(next.getUTCHours() + 1);
  else if (recurrence === 'DAILY') next.setUTCDate(next.getUTCDate() + 1);
  else if (recurrence === 'WEEKLY') next.setUTCDate(next.getUTCDate() + 7);
  else if (recurrence === 'MONTHLY') next.setUTCMonth(next.getUTCMonth() + 1);
  else return null;

  return next;
}

function nextRecurringRun(
  job: any,
  now = new Date()
): string | null {
  if (!job.recurrence || job.recurrence === 'NONE') return null;

  if (
    job.recurrence === 'DAILY' &&
    typeof job.payload?.configured_time === 'string' &&
    typeof job.timezone === 'string'
  ) {
    return nextLocalOccurrence(
      job.payload.configured_time,
      job.timezone,
      now
    );
  }

  let next = addRecurrence(
    new Date(job.scheduled_for || now.toISOString()),
    job.recurrence
  );

  // After downtime, skip missed intervals rather than firing a catch-up storm.
  for (let i = 0; next && next.getTime() <= now.getTime() && i < 100; i++) {
    next = addRecurrence(next, job.recurrence);
  }

  return next?.toISOString() || null;
}

async function recoverStaleClaims(nowIso: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from('scheduled_jobs')
    .update({
      status: 'SCHEDULED',
      scheduled_for: nowIso,
      next_run_at: nowIso,
      claimed_at: null,
      claimed_by: null,
      lease_expires_at: null,
      updated_at: nowIso
    })
    .in('status', ['CLAIMED', 'RUNNING'])
    .lte('lease_expires_at', nowIso);
}

async function getWhatsAppConnection(
  userId: string
): Promise<WhatsAppConnection | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('whatsapp_connections')
    .select('phone_number, last_active_at')
    .eq('user_id', userId)
    .eq('verified', true)
    .eq('status', 'CONNECTED')
    .maybeSingle();

  return data || null;
}

async function createWebNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  priority: 'LOW' | 'NORMAL' | 'URGENT' = 'NORMAL'
): Promise<void> {
  const supabase = createClient();
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    unread: true,
    priority
  });
}

async function maybeSendWhatsApp(
  userId: string,
  connection: WhatsAppConnection | null,
  text: string,
  templateName: string | undefined,
  deduplicationKey: string
): Promise<{ attempted: boolean; success: boolean; detail: string }> {
  if (!connection?.phone_number) {
    return {
      attempted: false,
      success: false,
      detail: 'WHATSAPP_NOT_LINKED'
    };
  }

  const result = await sendProactiveWhatsApp({
    userId,
    phoneNumber: connection.phone_number,
    lastActiveAt: connection.last_active_at,
    text,
    templateName,
    templateParameters: [text],
    deduplicationKey
  });

  return {
    attempted: true,
    success: result.success,
    detail: result.success
      ? `WHATSAPP_${result.mode || 'SENT'}`
      : result.error || 'WHATSAPP_SEND_FAILED'
  };
}

function deliveryGate(
  settings: Awaited<ReturnType<typeof getUserNotificationSettings>>,
  category: NotificationCategory
): { allowed: boolean; defer: boolean; reason?: string } {
  const check = isDeliveryAllowedNow(settings, category);
  return {
    allowed: check.allowed,
    defer: check.reason === 'QUIET_HOURS_ACTIVE',
    reason: check.reason
  };
}

export async function claimAndDispatchDueJobs(): Promise<JobExecutionResult[]> {
  const supabase = createClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const workerId =
    process.env.SCHEDULER_WORKER_ID ||
    process.env.VERCEL_REGION ||
    'mentra-scheduler';

  if (process.env.SYSTEM_AUTO_RECOVERY !== 'false') {
    try {
      await runAutomaticRecovery();
    } catch {
      // Scheduler execution must not be blocked by optional recovery work.
    }
  }

  await recoverStaleClaims(nowIso);

  const { data: dueJobs, error } = await supabase
    .from('scheduled_jobs')
    .select('*')
    .eq('status', 'SCHEDULED')
    .lte('scheduled_for', nowIso)
    .order('scheduled_for', { ascending: true })
    .limit(20);

  if (error) throw new Error(error.message);
  if (!dueJobs?.length) return [];

  const results: JobExecutionResult[] = [];

  for (const job of dueJobs) {
    const leaseExpiresAt = new Date(
      Date.now() + CLAIM_LEASE_MINUTES * 60 * 1000
    ).toISOString();

    const { data: claimedJob, error: claimError } = await supabase
      .from('scheduled_jobs')
      .update({
        status: 'CLAIMED',
        claimed_at: nowIso,
        claimed_by: workerId,
        lease_expires_at: leaseExpiresAt,
        last_run_at: nowIso,
        attempt_count: Number(job.attempt_count || 0) + 1,
        updated_at: nowIso
      })
      .eq('id', job.id)
      .eq('status', 'SCHEDULED')
      .select()
      .maybeSingle();

    if (claimError || !claimedJob) continue;

    await supabase
      .from('scheduled_jobs')
      .update({ status: 'RUNNING', updated_at: new Date().toISOString() })
      .eq('id', job.id)
      .eq('status', 'CLAIMED')
      .eq('claimed_by', workerId);

    let schedulerStatus: 'COMPLETE' | 'FAILED' | 'SKIPPED' = 'COMPLETE';
    let outputMessage = '';

    try {
      const settings = await getUserNotificationSettings(job.user_id);
      const waConnection =
        settings.preferred_channel === 'WHATSAPP'
          ? await getWhatsAppConnection(job.user_id)
          : null;
      const occurrenceKey = `${job.id}:${job.scheduled_for}`;

      switch (job.type) {
        case 'MORNING_BRIEF': {
          if (!settings.morning_brief_enabled) {
            schedulerStatus = 'SKIPPED';
            outputMessage = 'Morning brief is disabled by the user.';
            break;
          }

          const gate = deliveryGate(settings, 'JOURNAL');
          if (!gate.allowed) {
            schedulerStatus = 'SKIPPED';
            outputMessage = gate.reason || 'Morning brief delivery suppressed.';
            break;
          }

          const [{ data: quests }, { data: player }, calendar] = await Promise.all([
            supabase
              .from('quests')
              .select('title, xp_reward')
              .eq('user_id', job.user_id)
              .eq('status', 'ACTIVE')
              .order('created_at', { ascending: false })
              .limit(3),
            supabase
              .from('player_progress')
              .select('level, total_xp')
              .eq('user_id', job.user_id)
              .maybeSingle(),
            getGoogleCalendarEvents(job.user_id)
          ]);

          let calendarText = 'No connected-calendar events for today.';
          if (calendar.events.length > 0) {
            calendarText = calendar.events
              .map((event: CalendarEventSummary) => {
                const time = event.start.includes('T')
                  ? new Date(event.start).toLocaleTimeString('en-IN', {
                      timeZone: settings.timezone,
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'All day';
                return `• ${event.summary} (${time})`;
              })
              .join('\n');
          } else if (calendar.error && calendar.error !== 'CONNECTION_REQUIRED') {
            calendarText = 'Calendar data is temporarily unavailable.';
          }

          const priorities = quests?.length
            ? quests
                .map(
                  (quest, index) =>
                    `${index + 1}. ${quest.title} (+${quest.xp_reward || 0} XP)`
                )
                .join('\n')
            : 'No active quests yet.';

          const briefText =
            `MENTRA MORNING BRIEF\n\nToday's priorities:\n${priorities}\n\nSchedule:\n${calendarText}\n\nLevel ${player?.level || 1} • ${player?.total_xp || 0} total XP`;

          const dateInUserTz = new Intl.DateTimeFormat('en-CA', {
            timeZone: settings.timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(now);

          let whatsappStatus = 'NOT_REQUESTED';
          if (settings.preferred_channel === 'WHATSAPP') {
            const sent = await maybeSendWhatsApp(
              job.user_id,
              waConnection,
              briefText,
              process.env.WHATSAPP_TEMPLATE_MORNING_BRIEF,
              `morning:${occurrenceKey}`
            );
            whatsappStatus = sent.detail;
          }

          await supabase.from('daily_briefs').upsert(
            {
              user_id: job.user_id,
              date: dateInUserTz,
              timezone: settings.timezone,
              content: briefText,
              priorities: quests || [],
              delivery_channels:
                settings.preferred_channel === 'WHATSAPP'
                  ? ['WEB', 'WHATSAPP']
                  : ['WEB'],
              delivery_status: {
                WEB: 'DELIVERED',
                WHATSAPP: whatsappStatus
              },
              created_at: nowIso
            },
            { onConflict: 'user_id,date' }
          );

          outputMessage =
            settings.preferred_channel === 'WHATSAPP'
              ? `Morning brief saved to web. WhatsApp: ${whatsappStatus}.`
              : 'Morning brief saved to web.';
          break;
        }

        case 'EVENING_REFLECTION': {
          if (!settings.evening_reflection_enabled) {
            schedulerStatus = 'SKIPPED';
            outputMessage = 'Evening reflection is disabled by the user.';
            break;
          }

          const gate = deliveryGate(settings, 'JOURNAL');
          if (!gate.allowed) {
            schedulerStatus = 'SKIPPED';
            outputMessage = gate.reason || 'Evening reflection suppressed.';
            break;
          }

          const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: completedQuests } = await supabase
            .from('quests')
            .select('title, xp_reward')
            .eq('user_id', job.user_id)
            .eq('status', 'COMPLETED')
            .gte('updated_at', since);

          const finishedCount = completedQuests?.length || 0;
          const xpGained =
            completedQuests?.reduce(
              (sum, quest) => sum + Number(quest.xp_reward || 0),
              0
            ) || 0;

          const reflectionText =
            `MENTRA EVENING REFLECTION\n\nYou completed ${finishedCount} quest(s) and earned ${xpGained} XP today. What were your biggest win and lesson?`;

          await createWebNotification(
            job.user_id,
            'EVENING_REFLECTION',
            'Evening Reflection',
            reflectionText
          );

          let whatsappStatus = 'NOT_REQUESTED';
          if (settings.preferred_channel === 'WHATSAPP') {
            const sent = await maybeSendWhatsApp(
              job.user_id,
              waConnection,
              reflectionText,
              process.env.WHATSAPP_TEMPLATE_EVENING_REFLECTION,
              `evening:${occurrenceKey}`
            );
            whatsappStatus = sent.detail;
          }

          outputMessage =
            `Evening reflection saved to web. WhatsApp: ${whatsappStatus}.`;
          break;
        }

        case 'REMINDER': {
          const gate = deliveryGate(settings, 'JOURNAL');
          if (!gate.allowed) {
            schedulerStatus = 'SKIPPED';
            outputMessage = gate.reason || 'Reminder suppressed.';
            break;
          }

          const reminderText =
            typeof job.payload?.text === 'string' && job.payload.text.trim()
              ? job.payload.text.trim().slice(0, 3000)
              : 'Scheduled reminder';

          await createWebNotification(
            job.user_id,
            'REMINDER',
            'Reminder',
            reminderText
          );

          let whatsappStatus = 'NOT_REQUESTED';
          if (settings.preferred_channel === 'WHATSAPP') {
            const sent = await maybeSendWhatsApp(
              job.user_id,
              waConnection,
              `REMINDER\n\n${reminderText}`,
              process.env.WHATSAPP_TEMPLATE_REMINDER,
              `reminder:${occurrenceKey}`
            );
            whatsappStatus = sent.detail;
          }

          outputMessage =
            `Reminder delivered to web. WhatsApp: ${whatsappStatus}.`;
          break;
        }

        case 'LEARNING_NUDGE': {
          const gate = deliveryGate(settings, 'LEARNING');
          if (!gate.allowed) {
            schedulerStatus = 'SKIPPED';
            outputMessage = gate.reason || 'Learning reminders are disabled.';
            break;
          }

          const nudge =
            typeof job.payload?.text === 'string' && job.payload.text.trim()
              ? job.payload.text.trim().slice(0, 3000)
              : 'Practice one focused skill for 10 minutes and log what improved.';

          await createWebNotification(
            job.user_id,
            'LEARNING_NUDGE',
            'Learning Nudge',
            nudge
          );

          let whatsappStatus = 'NOT_REQUESTED';
          if (settings.preferred_channel === 'WHATSAPP') {
            const sent = await maybeSendWhatsApp(
              job.user_id,
              waConnection,
              nudge,
              process.env.WHATSAPP_TEMPLATE_LEARNING_NUDGE,
              `learning:${occurrenceKey}`
            );
            whatsappStatus = sent.detail;
          }

          outputMessage =
            `Learning nudge delivered to web. WhatsApp: ${whatsappStatus}.`;
          break;
        }

        case 'WEEKLY_REPORT': {
          const gate = deliveryGate(settings, 'REPORT');
          if (!gate.allowed) {
            schedulerStatus = 'SKIPPED';
            outputMessage = gate.reason || 'Weekly reports are disabled.';
            break;
          }

          const since = new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString();

          const [
            { data: completedQuests, error: questError },
            { data: financeRows, error: financeError },
            { data: goals, error: goalError }
          ] = await Promise.all([
            supabase
              .from('quests')
              .select('id, xp_reward')
              .eq('user_id', job.user_id)
              .eq('status', 'COMPLETED')
              .gte('completed_at', since),
            supabase
              .from('finance_transactions')
              .select('amount')
              .eq('user_id', job.user_id)
              .gte('created_at', since),
            supabase
              .from('goals')
              .select('title, current_value, target_value, unit, status')
              .eq('user_id', job.user_id)
              .eq('status', 'IN_PROGRESS')
              .limit(5)
          ]);

          if (questError) throw new Error(questError.message);
          if (financeError) throw new Error(financeError.message);
          if (goalError) throw new Error(goalError.message);

          const questCount = completedQuests?.length || 0;
          const xp = (completedQuests || []).reduce(
            (sum, quest) => sum + Number(quest.xp_reward || 0),
            0
          );

          const income = (financeRows || [])
            .filter(row => Number(row.amount || 0) >= 0)
            .reduce((sum, row) => sum + Number(row.amount || 0), 0);
          const expenses = (financeRows || [])
            .filter(row => Number(row.amount || 0) < 0)
            .reduce((sum, row) => sum + Math.abs(Number(row.amount || 0)), 0);

          const goalText = goals?.length
            ? goals
                .map(goal =>
                  `• ${goal.title}: ${goal.current_value || 0}/${goal.target_value || 0} ${goal.unit || ''}`
                )
                .join('\n')
            : 'No active goals.';

          const report =
            `MENTRA WEEKLY REPORT\n\nCompleted quests: ${questCount}\nXP earned: ${xp}\nIncome logged: ₹${income}\nExpenses logged: ₹${expenses}\nNet logged: ₹${income - expenses}\n\nActive goals:\n${goalText}`;

          await createWebNotification(
            job.user_id,
            'WEEKLY_REPORT',
            'Weekly Report',
            report
          );

          let whatsappStatus = 'NOT_REQUESTED';
          if (settings.preferred_channel === 'WHATSAPP') {
            const sent = await maybeSendWhatsApp(
              job.user_id,
              waConnection,
              report,
              process.env.WHATSAPP_TEMPLATE_WEEKLY_REPORT,
              `weekly:${occurrenceKey}`
            );
            whatsappStatus = sent.detail;
          }

          outputMessage =
            `Weekly report saved to web. WhatsApp: ${whatsappStatus}.`;
          break;
        }

        case 'FINANCE_ALERT': {
          const gate = deliveryGate(settings, 'FINANCE');
          if (!gate.allowed) {
            schedulerStatus = 'SKIPPED';
            outputMessage = gate.reason || 'Finance alerts are disabled.';
            break;
          }

          const alertText =
            typeof job.payload?.text === 'string'
              ? job.payload.text.trim().slice(0, 3000)
              : '';

          if (!alertText) {
            throw new Error('FINANCE_ALERT_TEXT_REQUIRED');
          }

          await createWebNotification(
            job.user_id,
            'FINANCE_ALERT',
            'Finance Alert',
            alertText,
            'URGENT'
          );

          let whatsappStatus = 'NOT_REQUESTED';
          if (settings.preferred_channel === 'WHATSAPP') {
            const sent = await maybeSendWhatsApp(
              job.user_id,
              waConnection,
              alertText,
              process.env.WHATSAPP_TEMPLATE_FINANCE_ALERT,
              `finance:${occurrenceKey}`
            );
            whatsappStatus = sent.detail;
          }

          outputMessage =
            `Finance alert saved to web. WhatsApp: ${whatsappStatus}.`;
          break;
        }

        case 'STREAK_CHECK': {
          const gate = deliveryGate(settings, 'QUEST');
          if (!gate.allowed) {
            schedulerStatus = 'SKIPPED';
            outputMessage = gate.reason || 'Quest alerts are disabled.';
            break;
          }

          const { data: progress, error: progressError } = await supabase
            .from('player_progress')
            .select('current_streak, longest_streak, last_active_date')
            .eq('user_id', job.user_id)
            .maybeSingle();

          if (progressError) throw new Error(progressError.message);

          if (!progress) {
            outputMessage = 'No player progression record exists yet.';
            break;
          }

          const streakText =
            `MENTRA STREAK CHECK\n\nCurrent streak: ${progress.current_streak || 0} day(s). Longest streak: ${progress.longest_streak || 0} day(s). Last active: ${progress.last_active_date || 'unknown'}.`;

          await createWebNotification(
            job.user_id,
            'STREAK_CHECK',
            'Streak Check',
            streakText
          );

          let whatsappStatus = 'NOT_REQUESTED';
          if (settings.preferred_channel === 'WHATSAPP') {
            const sent = await maybeSendWhatsApp(
              job.user_id,
              waConnection,
              streakText,
              process.env.WHATSAPP_TEMPLATE_STREAK_ALERT,
              `streak:${occurrenceKey}`
            );
            whatsappStatus = sent.detail;
          }

          outputMessage =
            `Streak status saved to web. WhatsApp: ${whatsappStatus}.`;
          break;
        }

        case 'AGENT_SCHEDULE': {
          const operative = await runOperativeAgentTick(
            job.user_id,
            job.payload || {}
          );

          if (!operative.shouldNotify) {
            outputMessage =
              'Operative monitor completed; notification condition was not met.';
            break;
          }

          const gate = deliveryGate(settings, 'AGENT');
          if (!gate.allowed) {
            schedulerStatus = 'SKIPPED';
            outputMessage =
              gate.reason || 'Agent notifications are currently suppressed.';
            break;
          }

          await createWebNotification(
            job.user_id,
            'AGENT_ALERT',
            job.payload?.title || 'MENTRA Operative Alert',
            operative.message
          );

          let whatsappStatus = 'NOT_REQUESTED';
          if (settings.preferred_channel === 'WHATSAPP') {
            const sent = await maybeSendWhatsApp(
              job.user_id,
              waConnection,
              `MENTRA OPERATIVE ALERT\n\n${operative.message}`,
              process.env.WHATSAPP_TEMPLATE_AGENT_ALERT,
              `agent:${occurrenceKey}`
            );
            whatsappStatus = sent.detail;
          }

          outputMessage =
            `Operative alert saved to web. WhatsApp: ${whatsappStatus}.`;
          break;
        }

        default:
          throw new Error(`UNSUPPORTED_SCHEDULED_JOB_TYPE:${job.type}`);
      }

      const gateWasQuiet =
        schedulerStatus === 'SKIPPED' &&
        outputMessage === 'QUIET_HOURS_ACTIVE';

      const nextRun = gateWasQuiet
        ? deferredRun(15)
        : nextRecurringRun(job, new Date());

      await supabase
        .from('scheduled_jobs')
        .update({
          status: nextRun ? 'SCHEDULED' : 'COMPLETE',
          scheduled_for: nextRun || job.scheduled_for,
          next_run_at: nextRun,
          attempt_count: nextRun ? 0 : claimedJob.attempt_count,
          claimed_at: null,
          claimed_by: null,
          lease_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)
        .eq('claimed_by', workerId);

      await supabase.from('job_runs').insert({
        job_id: job.id,
        user_id: job.user_id,
        status: 'SUCCESS',
        result: {
          scheduler_status: schedulerStatus,
          job_type: job.type,
          message: outputMessage,
          worker_id: workerId
        },
        started_at: nowIso,
        completed_at: new Date().toISOString()
      });

      results.push({
        jobId: job.id,
        type: job.type,
        status: schedulerStatus,
        message: outputMessage
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const attempts = Number(claimedJob.attempt_count || 1);
      const maxAttempts = Number(claimedJob.max_attempts || 3);
      const shouldRetry = attempts < maxAttempts;
      const retryAt = shouldRetry ? deferredRun(Math.min(30, 5 * attempts)) : null;

      await supabase
        .from('scheduled_jobs')
        .update({
          status: shouldRetry ? 'SCHEDULED' : 'FAILED',
          scheduled_for: retryAt || job.scheduled_for,
          next_run_at: retryAt,
          claimed_at: null,
          claimed_by: null,
          lease_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)
        .eq('claimed_by', workerId);

      await supabase.from('job_runs').insert({
        job_id: job.id,
        user_id: job.user_id,
        status: shouldRetry ? 'RETRYING' : 'FAILED',
        result: {
          job_type: job.type,
          retry_scheduled_for: retryAt,
          worker_id: workerId
        },
        error_message: errorMessage,
        started_at: nowIso,
        completed_at: new Date().toISOString()
      });

      results.push({
        jobId: job.id,
        type: job.type,
        status: 'FAILED',
        message: shouldRetry
          ? `${errorMessage} Retry scheduled.`
          : errorMessage
      });
    }
  }

  return results;
}
