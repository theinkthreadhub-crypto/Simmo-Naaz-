import { supabase } from '@/lib/supabase/client';
import { MemoryItem } from '@/types/mentra';

export async function getUserMemories(userId: string): Promise<MemoryItem[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(m => ({
    id: m.id,
    user_id: m.user_id,
    type: m.type,
    title: m.title,
    content: m.content,
    source: m.source || 'Neural Ingestion',
    importance: m.importance || 'MEDIUM',
    tags: m.tags || [],
    createdAt: m.created_at
  }));
}

export async function createMemory(
  userId: string,
  mem: Partial<MemoryItem>
): Promise<MemoryItem | null> {
  const { data, error } = await supabase
    .from('memories')
    .insert({
      user_id: userId,
      type: mem.type || 'Idea',
      title: mem.title || 'Untitled Memory',
      content: mem.content || '',
      source: mem.source || 'Direct Operator Ingestion',
      importance: mem.importance || 'MEDIUM',
      tags: mem.tags || []
    })
    .select()
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    user_id: data.user_id,
    type: data.type,
    title: data.title,
    content: data.content,
    source: data.source,
    importance: data.importance,
    tags: data.tags,
    createdAt: data.created_at
  };
}
