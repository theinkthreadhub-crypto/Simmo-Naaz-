import crypto from 'crypto';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/provider';
import { storeMemoryWithEmbedding } from './hybridMemory';

const memoryCandidateSchema = z.object({
  type: z.enum(['PREFERENCE', 'DECISION', 'GOAL', 'CONSTRAINT', 'PROJECT', 'FACT']),
  title: z.string().min(1).max(120),
  content: z.string().min(1).max(1200),
  importance: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  tags: z.array(z.string().max(40)).max(8).default([])
});

const extractionSchema = z.array(memoryCandidateSchema).max(5);

const SENSITIVE_PATTERN =
  /(password|passcode|otp|one[- ]time password|api[_ -]?key|secret key|private key|access token|refresh token|bearer token|cvv|card number|aadhaar|pan number|bank account|upi pin)/i;

function normalizeSource(userText: string, assistantText: string): string {
  return userText.trim() + '\n---\n' + assistantText.trim();
}

function sourceHash(userText: string, assistantText: string): string {
  return crypto
    .createHash('sha256')
    .update(normalizeSource(userText, assistantText))
    .digest('hex');
}

function likelyDurable(userText: string): boolean {
  const text = userText.toLowerCase();
  return (
    /\b(remember|yaad|prefer|preference|decide|decision|goal|target|always|never|from now on|ab se|rule|constraint|project)\b/i.test(text) ||
    /\b(i like|i want|i need|mera goal|mujhe .* pasand|maine decide|hum decide|we decided)\b/i.test(text)
  );
}

function parseJsonArray(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start < 0 || end < start) return [];
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return [];
  }
}

export interface MemoryExtractionResult {
  extracted: number;
  skipped: number;
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
}

export async function extractDurableMemories(
  userId: string,
  userText: string,
  assistantText: string,
  conversationId?: string
): Promise<MemoryExtractionResult> {
  if (process.env.AI_MEMORY_AUTO_EXTRACT !== 'true') {
    return { extracted: 0, skipped: 0, status: 'SKIPPED' };
  }

  if (
    !userText.trim() ||
    !assistantText.trim() ||
    !likelyDurable(userText) ||
    SENSITIVE_PATTERN.test(userText)
  ) {
    return { extracted: 0, skipped: 1, status: 'SKIPPED' };
  }

  const hash = sourceHash(userText, assistantText);
  const supabase = createClient();

  const { data: previous } = await supabase
    .from('memory_extraction_runs')
    .select('id, status')
    .eq('user_id', userId)
    .eq('source_hash', hash)
    .maybeSingle();

  if (previous) {
    return { extracted: 0, skipped: 1, status: 'SKIPPED' };
  }

  try {
    const provider = getAIProvider({ purpose: 'MEMORY' });
    const response = await provider.generate([
      {
        role: 'system',
        content: [
          'You extract only durable user memory from a conversation.',
          'Return ONLY a JSON array. No markdown.',
          'Allowed types: PREFERENCE, DECISION, GOAL, CONSTRAINT, PROJECT, FACT.',
          'Save only information likely to matter in future conversations.',
          'Do not save temporary requests, small talk, guesses, assistant-created claims, passwords, OTPs, API keys, credentials, bank/card details, government IDs, or authentication data.',
          'Do not infer sensitive personal traits.',
          'Maximum 5 items.'
        ].join(' ')
      },
      {
        role: 'user',
        content: 'USER MESSAGE:\n' + userText + '\n\nASSISTANT RESPONSE:\n' + assistantText
      }
    ], {
      temperature: 0,
      maxTokens: 900
    });

    const parsed = extractionSchema.safeParse(
      parseJsonArray(response.content || '')
    );

    if (!parsed.success || parsed.data.length === 0) {
      await supabase.from('memory_extraction_runs').insert({
        user_id: userId,
        conversation_id: conversationId || null,
        source_hash: hash,
        extracted_count: 0,
        skipped_count: 1,
        status: 'SKIPPED'
      });
      return { extracted: 0, skipped: 1, status: 'SKIPPED' };
    }

    let extracted = 0;
    let skipped = 0;

    for (const candidate of parsed.data) {
      if (SENSITIVE_PATTERN.test(candidate.content)) {
        skipped++;
        continue;
      }

      const saved = await storeMemoryWithEmbedding(userId, {
        type: candidate.type,
        title: candidate.title,
        content: candidate.content,
        source: 'AUTO_EXTRACTED_CONVERSATION',
        source_id: conversationId,
        importance: candidate.importance,
        tags: candidate.tags,
        metadata: {
          extractionSourceHash: hash,
          autoExtracted: true
        }
      });

      if (saved) extracted++;
      else skipped++;
    }

    await supabase.from('memory_extraction_runs').insert({
      user_id: userId,
      conversation_id: conversationId || null,
      source_hash: hash,
      extracted_count: extracted,
      skipped_count: skipped,
      status: 'SUCCESS'
    });

    return { extracted, skipped, status: 'SUCCESS' };
  } catch (error) {
    await supabase.from('memory_extraction_runs').insert({
      user_id: userId,
      conversation_id: conversationId || null,
      source_hash: hash,
      extracted_count: 0,
      skipped_count: 0,
      status: 'FAILED',
      error_message: error instanceof Error ? error.message.slice(0, 1000) : String(error).slice(0, 1000)
    });

    return { extracted: 0, skipped: 0, status: 'FAILED' };
  }
}