import { supabase } from '@/lib/supabase/client';
import { JournalEntry } from '@/types/mentra';

export async function getUserJournal(userId: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false });

  if (error || !data) return [];
  return data.map(j => ({
    id: j.id,
    user_id: j.user_id,
    date: j.entry_date,
    rawContent: j.content,
    summary: j.ai_summary || j.title || 'Daily Reflection Log',
    wins: j.wins || [],
    problems: j.problems || [],
    decisions: j.decisions || [],
    lessons: j.lessons || [],
    tomorrowActions: j.tomorrow_actions || [],
    mood: j.mood || 'PRODUCTIVE',
    tags: j.tags || [],
    extractedMemoryIds: []
  }));
}

export async function createJournalEntry(
  userId: string,
  entry: Partial<JournalEntry>
): Promise<JournalEntry | null> {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: userId,
      title: entry.summary || 'Daily Reflection',
      content: entry.rawContent || '',
      entry_date: entry.date || new Date().toISOString().split('T')[0],
      mood: entry.mood || 'PRODUCTIVE',
      wins: entry.wins || [],
      problems: entry.problems || [],
      decisions: entry.decisions || [],
      lessons: entry.lessons || [],
      tomorrow_actions: entry.tomorrowActions || [],
      tags: entry.tags || [],
      ai_summary: entry.summary
    })
    .select()
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    user_id: data.user_id,
    date: data.entry_date,
    rawContent: data.content,
    summary: data.ai_summary || data.title,
    wins: data.wins || [],
    problems: data.problems || [],
    decisions: data.decisions || [],
    lessons: data.lessons || [],
    tomorrowActions: data.tomorrow_actions || [],
    mood: data.mood,
    tags: data.tags || [],
    extractedMemoryIds: []
  };
}
