import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  getUserNotificationSettings,
  updateUserNotificationSettings
} from '@/lib/notifications/preferences';
import { syncUserDailySchedules } from '@/lib/scheduler/userSchedules';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const preferencesSchema = z.object({
  morning_brief_enabled: z.boolean(),
  morning_brief_time: time,
  evening_reflection_enabled: z.boolean(),
  evening_reflection_time: time,
  quest_alerts: z.boolean(),
  goal_alerts: z.boolean(),
  learning_reminders: z.boolean(),
  finance_alerts: z.boolean(),
  calendar_alerts: z.boolean(),
  gmail_alerts: z.boolean(),
  agent_updates: z.boolean(),
  weekly_report: z.boolean(),
  preferred_channel: z.enum(['WEB', 'WHATSAPP']),
  quiet_hours_enabled: z.boolean(),
  quiet_hours_start: time,
  quiet_hours_end: time,
  timezone: z.string().min(1).max(100)
}).strict();

export async function GET() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const settings = await getUserNotificationSettings(user.id);
  return NextResponse.json({ success: true, settings });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const parsed = preferencesSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_NOTIFICATION_PREFERENCES',
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const success = await updateUserNotificationSettings(
      user.id,
      parsed.data
    );

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'PREFERENCES_SAVE_FAILED' },
        { status: 500 }
      );
    }

    const settings = await getUserNotificationSettings(user.id);
    await syncUserDailySchedules(user.id, settings);

    return NextResponse.json({
      success: true,
      settings,
      message: 'Notification preferences and daily schedules updated.'
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
