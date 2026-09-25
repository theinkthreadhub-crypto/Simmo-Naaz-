import { createClient } from '@/lib/supabase/server';

export interface WellnessEntry {
  id: string;
  userId: string;
  entryDate: string;
  sleepHours?: number;
  energyRating: 'LOW' | 'NORMAL' | 'HIGH';
  moodRating: 'LOW' | 'NEUTRAL' | 'GOOD' | 'EXCELLENT';
  workoutCompleted: boolean;
  notes?: string;
  createdAt: string;
}

const memWellness = new Map<string, WellnessEntry>(); // key: `${userId}_${entryDate}`

export async function logDailyWellness(
  userId: string,
  entry: {
    sleepHours?: number;
    energyRating?: 'LOW' | 'NORMAL' | 'HIGH';
    moodRating?: 'LOW' | 'NEUTRAL' | 'GOOD' | 'EXCELLENT';
    workoutCompleted?: boolean;
    notes?: string;
  }
): Promise<{ success: boolean; message: string }> {
  const today = new Date().toISOString().split('T')[0];
  const id = `well_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newEntry: WellnessEntry = {
    id,
    userId,
    entryDate: today,
    sleepHours: entry.sleepHours,
    energyRating: entry.energyRating || 'NORMAL',
    moodRating: entry.moodRating || 'GOOD',
    workoutCompleted: entry.workoutCompleted ?? false,
    notes: entry.notes,
    createdAt: new Date().toISOString()
  };

  memWellness.set(`${userId}_${today}`, newEntry);

  // Background sync with Supabase
  try {
    const supabase = createClient();
    Promise.resolve(
      supabase
        .from('wellness_entries')
        .upsert({
          user_id: userId,
          entry_date: today,
          sleep_hours: entry.sleepHours || null,
          energy_rating: entry.energyRating || 'NORMAL',
          mood_rating: entry.moodRating || 'GOOD',
          workout_completed: entry.workoutCompleted ?? false,
          notes: entry.notes || null,
          created_at: newEntry.createdAt
        }, { onConflict: 'user_id,entry_date' })
    ).catch(() => {});
  } catch {
    // Ignore offline error
  }

  return { success: true, message: 'Wellness telemetry logged.' };
}

export async function getTodayWellness(userId: string): Promise<WellnessEntry | null> {
  const today = new Date().toISOString().split('T')[0];
  const mem = memWellness.get(`${userId}_${today}`);
  if (mem) return mem;

  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('wellness_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('entry_date', today)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      entryDate: data.entry_date,
      sleepHours: data.sleep_hours,
      energyRating: data.energy_rating,
      moodRating: data.mood_rating,
      workoutCompleted: data.workout_completed,
      notes: data.notes,
      createdAt: data.created_at
    };
  } catch {
    return null;
  }
}
