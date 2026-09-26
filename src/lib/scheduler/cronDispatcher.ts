import { createClient } from '@/lib/supabase/server';
import { whatsappClient } from '@/lib/integrations/whatsapp/client';
import { getUserNotificationSettings, isDeliveryAllowedNow } from '@/lib/notifications/preferences';
import { getGoogleCalendarEvents, CalendarEventSummary } from '@/lib/integrations/google/calendar';

export interface JobExecutionResult {
  jobId: string;
  type: string;
  status: 'COMPLETE' | 'FAILED' | 'SKIPPED';
  message: string;
}

function nextRecurringRun(fromIso: string, recurrence?: string | null): string | null {
  if (!recurrence || recurrence === 'NONE') return null;

  const next = new Date(fromIso);
  if (recurrence === 'DAILY') {
    next.setUTCDate(next.getUTCDate() + 1);
  } else if (recurrence === 'WEEKLY') {
    next.setUTCDate(next.getUTCDate() + 7);
  } else if (recurrence === 'MONTHLY') {
    next.setUTCMonth(next.getUTCMonth() + 1);
  } else {
    return null;
  }

  return next.toISOString();
}

function deferredRun(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

export async function claimAndDispatchDueJobs(): Promise<JobExecutionResult[]> {
  const supabase = createClient();
  const nowIso = new Date().toISOString();
  const results: JobExecutionResult[] = [];

  // 1. Fetch due jobs that are SCHEDULED
  const { data: dueJobs, error } = await supabase
    .from('scheduled_jobs')
    .select('*')
    .eq('status', 'SCHEDULED')
    .lte('scheduled_for', nowIso)
    .order('scheduled_for', { ascending: true })
    .limit(10);

  if (error || !dueJobs || dueJobs.length === 0) {
    return results;
  }

  for (const job of dueJobs) {
    // 2. Atomic Claim: Update status to CLAIMED
    const { data: claimedJob, error: claimErr } = await supabase
      .from('scheduled_jobs')
      .update({
        status: 'CLAIMED',
        last_run_at: nowIso,
        attempt_count: (job.attempt_count || 0) + 1,
        updated_at: nowIso
      })
      .eq('id', job.id)
      .eq('status', 'SCHEDULED')
      .select()
      .single();

    if (claimErr || !claimedJob) {
      // Job was claimed by another concurrent worker
      continue;
    }

    // 3. Execute Job Logic
    let jobStatus: 'COMPLETE' | 'FAILED' | 'SKIPPED' = 'COMPLETE';
    let outputMessage = '';

    try {
      const userSettings = await getUserNotificationSettings(job.user_id);

      switch (job.type) {
        case 'MORNING_BRIEF': {
          const deliveryCheck = isDeliveryAllowedNow(userSettings, 'REPORT');
          if (!deliveryCheck.allowed && deliveryCheck.reason === 'QUIET_HOURS_ACTIVE') {
            jobStatus = 'SKIPPED';
            outputMessage = 'Quiet hours active. Morning brief deferred.';
            break;
          }

          // Compile Morning Brief Data
          // Quests
          const { data: quests } = await supabase
            .from('quests')
            .select('title, xp_reward, status')
            .eq('user_id', job.user_id)
            .eq('status', 'ACTIVE')
            .limit(3);

          // Player XP
          const { data: player } = await supabase
            .from('player_progress')
            .select('level, total_xp')
            .eq('user_id', job.user_id)
            .single();

          // Calendar
          let calendarText = 'No events scheduled.';
          const calEvents = await getGoogleCalendarEvents(job.user_id);
          if (calEvents.events && calEvents.events.length > 0) {
            calendarText = calEvents.events
              .map((e: CalendarEventSummary) => `• ${e.summary} (${new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`)
              .join('\n');
          }

          const priorities = quests && quests.length > 0
            ? quests.map((q, idx) => `${idx + 1}. ${q.title} (+${q.xp_reward} XP)`).join('\n')
            : '1. Establish daily sovereign objectives';

          const briefText = `🌅 *GOOD MORNING — MENTRA BRIEF*\n\n🎯 *Today's Priorities:*\n${priorities}\n\n📅 *Schedule:*\n${calendarText}\n\n⚡ *Rank:* Level ${player?.level || 1} • ${player?.total_xp || 0} XP\n\n_Reply with "1 done" to check off your first mission._`;

          // Send via WhatsApp if linked and preferred, then persist truthful delivery state.
          let whatsappDeliveryStatus = 'SKIPPED';
          if (userSettings.preferred_channel === 'WHATSAPP') {
            const { data: waConn } = await supabase
              .from('whatsapp_connections')
              .select('phone_number, status')
              .eq('user_id', job.user_id)
              .eq('status', 'CONNECTED')
              .single();

            if (waConn?.phone_number) {
              const sent = await whatsappClient.sendTextMessage(waConn.phone_number, briefText, job.user_id);
              whatsappDeliveryStatus = sent.success ? 'SENT' : 'FAILED';
            } else {
              whatsappDeliveryStatus = 'NOT_CONNECTED';
            }
          }

          const todayDate = new Date().toISOString().split('T')[0];
          await supabase.from('daily_briefs').upsert({
            user_id: job.user_id,
            date: todayDate,
            timezone: userSettings.timezone || 'Asia/Kolkata',
            content: briefText,
            priorities: (quests || []).map(q => ({ title: q.title, xp_reward: q.xp_reward })),
            delivery_channels: userSettings.preferred_channel === 'WHATSAPP'
              ? ['WEB', 'WHATSAPP']
              : ['WEB'],
            delivery_status: {
              WEB: 'DELIVERED',
              WHATSAPP: whatsappDeliveryStatus
            },
            created_at: nowIso
          }, { onConflict: 'user_id,date' });

          outputMessage = whatsappDeliveryStatus === 'FAILED'
            ? 'Morning Brief compiled; WhatsApp delivery failed.'
            : 'Morning Brief compiled and delivered.';
          break;
        }

        case 'EVENING_REFLECTION': {
          const { data: completedQuests } = await supabase
            .from('quests')
            .select('title, xp_reward')
            .eq('user_id', job.user_id)
            .eq('status', 'COMPLETED')
            .gte('updated_at', new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString());

          const finishedCount = completedQuests?.length || 0;
          const xpGained = completedQuests?.reduce((acc, q) => acc + (q.xp_reward || 0), 0) || 0;

          const reflectionText = `🌙 *DAY COMPLETE? — EVENING REFLECTION*\n\nToday you finished *${finishedCount} quests* earning *+${xpGained} XP*.\n\n_How did today go? Share your wins or lessons, and MENTRA will log your Sovereign Journal._`;

          const { data: waConn } = await supabase
            .from('whatsapp_connections')
            .select('phone_number')
            .eq('user_id', job.user_id)
            .eq('status', 'CONNECTED')
            .single();

          if (waConn?.phone_number && userSettings.preferred_channel === 'WHATSAPP') {
            await whatsappClient.sendTextMessage(waConn.phone_number, reflectionText, job.user_id);
          }

          outputMessage = 'Evening Reflection prompt sent.';
          break;
        }

        case 'REMINDER': {
          const reminderMsg = job.payload?.text || 'Scheduled Sovereign Reminder';
          const { data: waConn } = await supabase
            .from('whatsapp_connections')
            .select('phone_number')
            .eq('user_id', job.user_id)
            .eq('status', 'CONNECTED')
            .single();

          if (waConn?.phone_number) {
            await whatsappClient.sendTextMessage(
              waConn.phone_number,
              `⏰ *REMINDER*\n\n${reminderMsg}`,
              job.user_id
            );
          }
          outputMessage = `Reminder dispatched: ${reminderMsg}`;
          break;
        }

        case 'LEARNING_NUDGE': {
          const { data: waConn } = await supabase
            .from('whatsapp_connections')
            .select('phone_number')
            .eq('user_id', job.user_id)
            .eq('status', 'CONNECTED')
            .single();

          if (waConn?.phone_number) {
            await whatsappClient.sendTextMessage(
              waConn.phone_number,
              `🎙️ *SKILL QUEST — PUBLIC SPEAKING*\n\nTopic: _Explain your current business strategy concisely in 60s._\n\nSend a voice note or type your response to claim +25 XP!`,
              job.user_id
            );
          }
          outputMessage = 'Learning reminder dispatched.';
          break;
        }

        default: {
          outputMessage = `Job type ${job.type} processed.`;
          break;
        }
      }

      // Persist scheduler state using the Phase-6 schema contract.
      const recurringRun = nextRecurringRun(nowIso, job.recurrence);
      const nextRun = jobStatus === 'SKIPPED' ? deferredRun(15) : recurringRun;

      await supabase
        .from('scheduled_jobs')
        .update({
          status: nextRun ? 'SCHEDULED' : 'COMPLETE',
          scheduled_for: nextRun || job.scheduled_for,
          next_run_at: nextRun,
          attempt_count: nextRun ? 0 : claimedJob.attempt_count,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      // job_runs uses SUCCESS/FAILED/RETRYING and JSON result fields.
      await supabase.from('job_runs').insert({
        job_id: job.id,
        user_id: job.user_id,
        status: 'SUCCESS',
        result: {
          scheduler_status: jobStatus,
          job_type: job.type,
          message: outputMessage
        },
        started_at: nowIso,
        completed_at: new Date().toISOString()
      });

      results.push({
        jobId: job.id,
        type: job.type,
        status: jobStatus,
        message: outputMessage
      });

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const attempts = claimedJob.attempt_count || 1;
      const maxAttempts = claimedJob.max_attempts || 3;
      const shouldRetry = attempts < maxAttempts;
      const retryAt = shouldRetry ? deferredRun(5) : null;

      await supabase
        .from('scheduled_jobs')
        .update({
          status: shouldRetry ? 'SCHEDULED' : 'FAILED',
          scheduled_for: retryAt || job.scheduled_for,
          next_run_at: retryAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      await supabase.from('job_runs').insert({
        job_id: job.id,
        user_id: job.user_id,
        status: shouldRetry ? 'RETRYING' : 'FAILED',
        result: {
          job_type: job.type,
          retry_scheduled_for: retryAt
        },
        error_message: errorMsg,
        started_at: nowIso,
        completed_at: new Date().toISOString()
      });

      results.push({
        jobId: job.id,
        type: job.type,
        status: 'FAILED',
        message: shouldRetry ? `${errorMsg} Retry scheduled.` : errorMsg
      });
    }
  }

  return results;
}
