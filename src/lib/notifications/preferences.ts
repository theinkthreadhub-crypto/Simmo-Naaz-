import { createClient } from '@/lib/supabase/server';

export type NotificationCategory =
  | 'QUEST'
  | 'GOAL'
  | 'LEARNING'
  | 'FINANCE'
  | 'CALENDAR'
  | 'GMAIL'
  | 'AGENT'
  | 'REPORT'
  | 'JOURNAL'
  | 'SYSTEM';

export type NotificationChannel = 'WEB' | 'WHATSAPP' | 'EMAIL';

export interface UserNotificationSettings {
  user_id: string;
  morning_brief_enabled: boolean;
  morning_brief_time: string; // e.g. "08:00"
  evening_reflection_enabled: boolean;
  evening_reflection_time: string; // e.g. "21:00"
  quest_alerts: boolean;
  goal_alerts: boolean;
  learning_reminders: boolean;
  finance_alerts: boolean;
  calendar_alerts: boolean;
  gmail_alerts: boolean;
  agent_updates: boolean;
  weekly_report: boolean;
  preferred_channel: NotificationChannel;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // e.g. "22:00"
  quiet_hours_end: string; // e.g. "07:00"
  timezone: string; // e.g. "Asia/Kolkata"
  paused_until?: string | null;
}

const DEFAULT_SETTINGS: Omit<UserNotificationSettings, 'user_id'> = {
  morning_brief_enabled: true,
  morning_brief_time: '08:00',
  evening_reflection_enabled: true,
  evening_reflection_time: '21:00',
  quest_alerts: true,
  goal_alerts: true,
  learning_reminders: true,
  finance_alerts: true,
  calendar_alerts: true,
  gmail_alerts: false,
  agent_updates: true,
  weekly_report: true,
  preferred_channel: 'WHATSAPP',
  quiet_hours_enabled: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  timezone: 'Asia/Kolkata',
  paused_until: null
};

export async function getUserNotificationSettings(userId: string): Promise<UserNotificationSettings> {
  const supabase = createClient();
  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!data) {
    return { user_id: userId, ...DEFAULT_SETTINGS };
  }

  return {
    user_id: userId,
    morning_brief_enabled: data.morning_brief_enabled ?? DEFAULT_SETTINGS.morning_brief_enabled,
    morning_brief_time: data.morning_brief_time ?? DEFAULT_SETTINGS.morning_brief_time,
    evening_reflection_enabled: data.evening_reflection_enabled ?? DEFAULT_SETTINGS.evening_reflection_enabled,
    evening_reflection_time: data.evening_reflection_time ?? DEFAULT_SETTINGS.evening_reflection_time,
    quest_alerts: data.quest_alerts ?? DEFAULT_SETTINGS.quest_alerts,
    goal_alerts: data.goal_alerts ?? DEFAULT_SETTINGS.goal_alerts,
    learning_reminders: data.learning_reminders ?? DEFAULT_SETTINGS.learning_reminders,
    finance_alerts: data.finance_alerts ?? DEFAULT_SETTINGS.finance_alerts,
    calendar_alerts: data.calendar_alerts ?? DEFAULT_SETTINGS.calendar_alerts,
    gmail_alerts: data.gmail_alerts ?? DEFAULT_SETTINGS.gmail_alerts,
    agent_updates: data.agent_updates ?? DEFAULT_SETTINGS.agent_updates,
    weekly_report: data.weekly_report ?? DEFAULT_SETTINGS.weekly_report,
    preferred_channel: data.preferred_channel ?? DEFAULT_SETTINGS.preferred_channel,
    quiet_hours_enabled: data.quiet_hours_enabled ?? DEFAULT_SETTINGS.quiet_hours_enabled,
    quiet_hours_start: data.quiet_hours_start ?? DEFAULT_SETTINGS.quiet_hours_start,
    quiet_hours_end: data.quiet_hours_end ?? DEFAULT_SETTINGS.quiet_hours_end,
    timezone: data.timezone || DEFAULT_SETTINGS.timezone,
    paused_until: data.paused_until ?? null
  };
}

export async function updateUserNotificationSettings(
  userId: string,
  settings: Partial<UserNotificationSettings>
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: userId,
      ...settings,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  return !error;
}

/**
 * Check if the notification can be sent right now based on user's Quiet Hours and DND
 */
export function isDeliveryAllowedNow(settings: UserNotificationSettings, category: NotificationCategory): { allowed: boolean; reason?: string } {
  // 1. Check DND Pause
  if (settings.paused_until) {
    const pauseExpiry = new Date(settings.paused_until).getTime();
    if (pauseExpiry > Date.now()) {
      return { allowed: false, reason: 'NOTIFICATIONS_PAUSED_BY_USER' };
    }
  }

  // 2. Check Category Toggle
  if (category === 'QUEST' && !settings.quest_alerts) return { allowed: false, reason: 'CATEGORY_DISABLED' };
  if (category === 'GOAL' && !settings.goal_alerts) return { allowed: false, reason: 'CATEGORY_DISABLED' };
  if (category === 'LEARNING' && !settings.learning_reminders) return { allowed: false, reason: 'CATEGORY_DISABLED' };
  if (category === 'FINANCE' && !settings.finance_alerts) return { allowed: false, reason: 'CATEGORY_DISABLED' };
  if (category === 'CALENDAR' && !settings.calendar_alerts) return { allowed: false, reason: 'CATEGORY_DISABLED' };
  if (category === 'GMAIL' && !settings.gmail_alerts) return { allowed: false, reason: 'CATEGORY_DISABLED' };
  if (category === 'AGENT' && !settings.agent_updates) return { allowed: false, reason: 'CATEGORY_DISABLED' };
  if (category === 'REPORT' && !settings.weekly_report) return { allowed: false, reason: 'CATEGORY_DISABLED' };

  // 3. System and critical alerts bypass quiet hours
  if (category === 'SYSTEM') {
    return { allowed: true };
  }

  // 4. Quiet Hours Check
  if (settings.quiet_hours_enabled && settings.quiet_hours_start && settings.quiet_hours_end) {
    try {
      const now = new Date();
      // Format current time in user's timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: settings.timezone || 'Asia/Kolkata',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      });
      const parts = formatter.formatToParts(now);
      const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
      const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
      const currentMinutes = hour * 60 + minute;

      const [startH, startM] = settings.quiet_hours_start.split(':').map(Number);
      const [endH, endM] = settings.quiet_hours_end.split(':').map(Number);
      const startMinutes = startH * 60 + (startM || 0);
      const endMinutes = endH * 60 + (endM || 0);

      let inQuietHours = false;
      if (startMinutes <= endMinutes) {
        inQuietHours = currentMinutes >= startMinutes && currentMinutes < endMinutes;
      } else {
        // Overnight quiet hours (e.g. 22:00 to 07:00)
        inQuietHours = currentMinutes >= startMinutes || currentMinutes < endMinutes;
      }

      if (inQuietHours) {
        return { allowed: false, reason: 'QUIET_HOURS_ACTIVE' };
      }
    } catch (e) {
      console.warn('[Preferences] Timezone evaluation fallback:', e);
    }
  }

  return { allowed: true };
}
