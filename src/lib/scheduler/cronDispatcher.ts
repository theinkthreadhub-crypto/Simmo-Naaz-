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
    .lt('attempt_count', 3)
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

      switch (job.job_type) {
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
            .eq('status', 'IN_PROGRESS')
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

          // Persist Daily Brief
          const todayDate = new Date().toISOString().split('T')[0];
          await supabase.from('daily_briefs').upsert({
            user_id: job.user_id,
            brief_date: todayDate,
            content: briefText,
            delivered_whatsapp: userSettings.preferred_channel === 'WHATSAPP',
            delivered_web: true,
            created_at: nowIso
          }, { onConflict: 'user_id,brief_date' });

          // Send via WhatsApp if linked and preferred
          if (userSettings.preferred_channel === 'WHATSAPP') {
            const { data: waConn } = await supabase
              .from('whatsapp_connections')
              .select('phone_number, status')
              .eq('user_id', job.user_id)
              .eq('status', 'CONNECTED')
              .single();

            if (waConn?.phone_number) {
              await whatsappClient.sendTextMessage(waConn.phone_number, briefText, job.user_id);
            }
          }

          outputMessage = 'Morning Brief compiled and delivered.';
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
          outputMessage = `Job type ${job.job_type} processed.`;
          break;
        }
      }

      // Mark Job Status
      await supabase
        .from('scheduled_jobs')
        .update({
          status: jobStatus === 'SKIPPED' ? 'SCHEDULED' : 'COMPLETE',
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      // Log execution to job_runs
      await supabase.from('job_runs').insert({
        job_id: job.id,
        user_id: job.user_id,
        job_type: job.job_type,
        status: jobStatus,
        result_summary: outputMessage,
        executed_at: nowIso
      });

      results.push({
        jobId: job.id,
        type: job.job_type,
        status: jobStatus,
        message: outputMessage
      });

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await supabase
        .from('scheduled_jobs')
        .update({
          status: 'FAILED',
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      await supabase.from('job_runs').insert({
        job_id: job.id,
        user_id: job.user_id,
        job_type: job.job_type,
        status: 'FAILED',
        error: errorMsg,
        executed_at: nowIso
      });

      results.push({
        jobId: job.id,
        type: job.job_type,
        status: 'FAILED',
        message: errorMsg
      });
    }
  }

  return results;
}
