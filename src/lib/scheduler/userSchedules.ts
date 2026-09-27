import { createClient } from '@/lib/supabase/server';
import { UserNotificationSettings } from '@/lib/notifications/preferences';

function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);

  const value = (type: string) =>
    Number(parts.find(part => part.type === type)?.value || 0);

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second')
  };
}

function offsetFor(date: Date, timeZone: string): number {
  const p = localParts(date, timeZone);
  const representedAsUtc = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second
  );
  return representedAsUtc - date.getTime();
}

function zonedLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  let guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  let offset = offsetFor(guess, timeZone);
  let result = new Date(guess.getTime() - offset);

  // A second pass handles DST boundaries for time zones that observe DST.
  offset = offsetFor(result, timeZone);
  result = new Date(guess.getTime() - offset);
  return result;
}

function parseClock(value: string): { hour: number; minute: number } {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) throw new Error('INVALID_NOTIFICATION_TIME');
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

export function nextLocalOccurrence(
  clock: string,
  timeZone: string,
  now = new Date()
): string {
  const { hour, minute } = parseClock(clock);
  const current = localParts(now, timeZone);

  let candidate = zonedLocalToUtc(
    current.year,
    current.month,
    current.day,
    hour,
    minute,
    timeZone
  );

  if (candidate.getTime() <= now.getTime()) {
    const tomorrowLocal = new Date(
      Date.UTC(current.year, current.month - 1, current.day + 1, 12, 0, 0)
    );
    const tomorrow = localParts(tomorrowLocal, 'UTC');

    candidate = zonedLocalToUtc(
      tomorrow.year,
      tomorrow.month,
      tomorrow.day,
      hour,
      minute,
      timeZone
    );
  }

  return candidate.toISOString();
}

async function upsertDailyJob(
  userId: string,
  type: 'MORNING_BRIEF' | 'EVENING_REFLECTION',
  enabled: boolean,
  clock: string,
  timeZone: string
): Promise<void> {
  const supabase = createClient();
  const deduplicationKey =
    type === 'MORNING_BRIEF'
      ? 'system:morning-brief'
      : 'system:evening-reflection';

  const { data: existing, error: lookupError } = await supabase
    .from('scheduled_jobs')
    .select('id, status')
    .eq('user_id', userId)
    .eq('deduplication_key', deduplicationKey)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);

  if (!enabled) {
    if (existing?.id) {
      const { error } = await supabase
        .from('scheduled_jobs')
        .update({
          status: 'CANCELLED',
          next_run_at: null,
          claimed_at: null,
          claimed_by: null,
          lease_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
    }
    return;
  }

  const nextRun = nextLocalOccurrence(clock, timeZone);
  const payload = { configured_time: clock };

  if (existing?.id) {
    const { error } = await supabase
      .from('scheduled_jobs')
      .update({
        type,
        payload,
        scheduled_for: nextRun,
        next_run_at: nextRun,
        timezone: timeZone,
        recurrence: 'DAILY',
        status: 'SCHEDULED',
        attempt_count: 0,
        claimed_at: null,
        claimed_by: null,
        lease_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from('scheduled_jobs').insert({
    user_id: userId,
    type,
    payload,
    scheduled_for: nextRun,
    next_run_at: nextRun,
    timezone: timeZone,
    recurrence: 'DAILY',
    status: 'SCHEDULED',
    deduplication_key: deduplicationKey,
    attempt_count: 0
  });

  if (error) throw new Error(error.message);
}

export async function syncUserDailySchedules(
  userId: string,
  settings: UserNotificationSettings
): Promise<void> {
  const timeZone = settings.timezone || 'Asia/Kolkata';

  // Validate timezone before writing jobs.
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
  } catch {
    throw new Error('INVALID_NOTIFICATION_TIMEZONE');
  }

  await Promise.all([
    upsertDailyJob(
      userId,
      'MORNING_BRIEF',
      settings.morning_brief_enabled,
      settings.morning_brief_time,
      timeZone
    ),
    upsertDailyJob(
      userId,
      'EVENING_REFLECTION',
      settings.evening_reflection_enabled,
      settings.evening_reflection_time,
      timeZone
    )
  ]);
}
