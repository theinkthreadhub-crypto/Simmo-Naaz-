import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  verifyBrainWorkerSecret,
  verifyBrainWorkerSignature,
  verifyBrainWorkerToken,
  verifyBrainWorkerServiceKey
} from '@/lib/worker/auth';
import { runAsTrustedServer } from '@/lib/supabase/trustedScope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type WorkerAuthBody = {
  action?: 'load_creds' | 'save_creds' | 'get_keys' | 'set_keys' | 'clear';
  userId?: string;
  creds?: string;
  type?: string;
  ids?: string[];
  entries?: Array<{ type: string; keyId: string; value: string | null }>;
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const verified =
    verifyBrainWorkerSignature(req.headers.get('x-mentra-worker-timestamp'), req.headers.get('x-mentra-worker-signature'), rawBody) ||
    verifyBrainWorkerToken(req.headers.get('x-mentra-worker-token')) ||
    verifyBrainWorkerSecret(req.headers.get('x-mentra-internal-secret')) ||
    verifyBrainWorkerServiceKey(req.headers.get('x-mentra-service-key'));

  if (!verified) return NextResponse.json({ error: 'UNAUTHORIZED_WORKER' }, { status: 401 });

  let body: WorkerAuthBody;
  try { body = JSON.parse(rawBody || '{}') as WorkerAuthBody; }
  catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }

  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  if (!userId) return NextResponse.json({ error: 'USER_REQUIRED' }, { status: 400 });

  try {
    return await runAsTrustedServer('brain_worker_whatsapp_auth_store', async () => {
      const supabase = createClient();
      switch (body.action) {
        case 'load_creds': {
          const { data, error } = await supabase.from('whatsapp_worker_auth').select('creds_json').eq('user_id', userId).maybeSingle();
          if (error) throw error;
          return NextResponse.json({ success: true, creds: data?.creds_json || null });
        }
        case 'save_creds': {
          if (typeof body.creds !== 'string' || !body.creds) return NextResponse.json({ error: 'CREDS_REQUIRED' }, { status: 400 });
          const { error } = await supabase.from('whatsapp_worker_auth').upsert({ user_id: userId, creds_json: body.creds, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
          if (error) throw error;
          return NextResponse.json({ success: true });
        }
        case 'get_keys': {
          if (typeof body.type !== 'string' || !Array.isArray(body.ids)) return NextResponse.json({ error: 'KEY_QUERY_REQUIRED' }, { status: 400 });
          const ids = body.ids.slice(0, 2000);
          if (ids.length === 0) return NextResponse.json({ success: true, values: {} });
          const { data, error } = await supabase.from('whatsapp_worker_signal_keys').select('key_id, value_json').eq('user_id', userId).eq('key_type', body.type).in('key_id', ids);
          if (error) throw error;
          const values: Record<string, string> = {};
          for (const row of data || []) values[row.key_id] = row.value_json;
          return NextResponse.json({ success: true, values });
        }
        case 'set_keys': {
          if (!Array.isArray(body.entries)) return NextResponse.json({ error: 'KEY_ENTRIES_REQUIRED' }, { status: 400 });
          if (body.entries.length > 5000) return NextResponse.json({ error: 'TOO_MANY_KEY_ENTRIES' }, { status: 413 });
          const upserts = body.entries.filter(entry => entry && typeof entry.type === 'string' && typeof entry.keyId === 'string' && typeof entry.value === 'string');
          const deletes = body.entries.filter(entry => entry && typeof entry.type === 'string' && typeof entry.keyId === 'string' && entry.value === null);
          if (upserts.length > 0) {
            const { error } = await supabase.from('whatsapp_worker_signal_keys').upsert(
              upserts.map(entry => ({ user_id: userId, key_type: entry.type, key_id: entry.keyId, value_json: entry.value as string, updated_at: new Date().toISOString() })),
              { onConflict: 'user_id,key_type,key_id' }
            );
            if (error) throw error;
          }
          for (const entry of deletes) {
            const { error } = await supabase.from('whatsapp_worker_signal_keys').delete().eq('user_id', userId).eq('key_type', entry.type).eq('key_id', entry.keyId);
            if (error) throw error;
          }
          return NextResponse.json({ success: true });
        }
        case 'clear': {
          const { error: keysError } = await supabase.from('whatsapp_worker_signal_keys').delete().eq('user_id', userId);
          if (keysError) throw keysError;
          const { error: credsError } = await supabase.from('whatsapp_worker_auth').delete().eq('user_id', userId);
          if (credsError) throw credsError;
          return NextResponse.json({ success: true });
        }
        default:
          return NextResponse.json({ error: 'INVALID_ACTION' }, { status: 400 });
      }
    });
  } catch (error: unknown) {
    console.error('[WhatsAppWorkerAuth] Store error:', error);
    const message = error instanceof Error ? error.message : 'AUTH_STORE_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
