import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/ai/embeddings';

export interface HybridMemoryMatch {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  source?: string | null;
  source_id?: string | null;
  importance?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  rrf_score?: number;
  semantic_rank?: number | null;
  keyword_rank?: number | null;
}

function memoryDocumentText(memory: {
  title?: string | null;
  content?: string | null;
  type?: string | null;
  tags?: unknown;
}): string {
  const tags = Array.isArray(memory.tags) ? memory.tags.join(', ') : '';
  return [
    memory.type ? `Type: ${memory.type}` : '',
    memory.title ? `Title: ${memory.title}` : '',
    memory.content || '',
    tags ? `Tags: ${tags}` : ''
  ].filter(Boolean).join('\n');
}

export async function backfillRecentMemoryEmbeddings(
  userId: string,
  maxRows: number = 4
): Promise<number> {
  if (process.env.AI_MEMORY_V2 === 'false') return 0;

  const supabase = createClient();
  const { data: missing, error } = await supabase
    .from('memories')
    .select('id, title, content, type, tags')
    .eq('user_id', userId)
    .is('embedding', null)
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(maxRows, 8)));

  if (error || !missing || missing.length === 0) return 0;

  let updated = 0;

  for (const memory of missing) {
    const embedding = await generateEmbedding(memoryDocumentText(memory), 'DOCUMENT');
    if (!embedding) continue;

    const { error: updateError } = await supabase
      .from('memories')
      .update({
        embedding: embedding.values,
        embedding_model: embedding.model,
        embedding_updated_at: new Date().toISOString()
      })
      .eq('id', memory.id)
      .eq('user_id', userId);

    if (!updateError) updated += 1;
  }

  return updated;
}

async function lexicalFallback(
  userId: string,
  query: string,
  limit: number
): Promise<HybridMemoryMatch[]> {
  const supabase = createClient();
  const safe = query.replace(/[%_,()]/g, ' ').trim();

  if (!safe) return [];

  const { data, error } = await supabase
    .from('memories')
    .select('id, user_id, type, title, content, source, source_id, importance, tags, metadata, created_at, updated_at')
    .eq('user_id', userId)
    .or(`title.ilike.%${safe}%,content.ilike.%${safe}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as HybridMemoryMatch[];
}

export async function searchMemoriesHybrid(
  userId: string,
  query: string,
  limit: number = 6
): Promise<HybridMemoryMatch[]> {
  const cleanQuery = query.trim();
  const safeLimit = Math.max(1, Math.min(limit, 20));

  if (!cleanQuery) return [];

  if (process.env.AI_MEMORY_V2 === 'false') {
    return lexicalFallback(userId, cleanQuery, safeLimit);
  }

  const supabase = createClient();

  // Backfill a small number of legacy memories on each retrieval. This keeps
  // migration non-blocking and gradually upgrades old memory rows.
  const [queryEmbedding] = await Promise.all([
    generateEmbedding(cleanQuery, 'QUERY'),
    backfillRecentMemoryEmbeddings(userId, 4)
  ]);

  if (!queryEmbedding) {
    return lexicalFallback(userId, cleanQuery, safeLimit);
  }

  const { data, error } = await supabase.rpc('search_memories_hybrid', {
    p_query_text: cleanQuery,
    p_query_embedding: queryEmbedding.values,
    p_match_count: safeLimit
  });

  if (error) {
    console.warn('[MEMORY V2]: Hybrid RPC unavailable, using lexical fallback', error.message);
    return lexicalFallback(userId, cleanQuery, safeLimit);
  }

  return (data || []) as HybridMemoryMatch[];
}

export async function storeMemoryWithEmbedding(
  userId: string,
  memory: {
    type?: string;
    title?: string;
    content: string;
    source?: string;
    source_id?: string;
    importance?: 'HIGH' | 'MEDIUM' | 'LOW' | string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }
): Promise<HybridMemoryMatch | null> {
  const supabase = createClient();
  const embedding = process.env.AI_MEMORY_V2 === 'false'
    ? null
    : await generateEmbedding(memoryDocumentText(memory), 'DOCUMENT');

  const { data, error } = await supabase
    .from('memories')
    .insert({
      user_id: userId,
      type: memory.type || 'Idea',
      title: memory.title || 'Untitled Memory',
      content: memory.content,
      source: memory.source || 'MENTRA',
      source_id: memory.source_id || null,
      importance: memory.importance || 'MEDIUM',
      tags: memory.tags || [],
      metadata: memory.metadata || {},
      embedding: embedding?.values || null,
      embedding_model: embedding?.model || null,
      embedding_updated_at: embedding ? new Date().toISOString() : null
    })
    .select('id, user_id, type, title, content, source, source_id, importance, tags, metadata, created_at, updated_at')
    .single();

  if (error || !data) {
    console.warn('[MEMORY V2]: Failed to store memory', error?.message);
    return null;
  }

  return data as HybridMemoryMatch;
}
