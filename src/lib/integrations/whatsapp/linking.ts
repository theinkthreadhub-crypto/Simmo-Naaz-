import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export interface WhatsAppConnectionRecord {
  id: string;
  user_id: string;
  phone_number: string;
  display_phone_number?: string;
  verified: boolean;
  status: 'NOT_CONFIGURED' | 'READY_TO_CONNECT' | 'WAITING_LINK' | 'CONNECTED' | 'TOKEN_ERROR' | 'DISCONNECTED';
}

// In-memory cache. On serverless each request may hit a different instance,
// so Supabase is the source of truth and every write below is awaited.
const memLinkCodes = new Map<string, { userId: string; code: string; expiresAt: number; used: boolean }>();
const memConnections = new Map<string, { userId: string; phoneNumber: string; status: string }>();

export async function generateWhatsAppLinkCode(userId: string): Promise<string> {
  const randomBytes = crypto.randomBytes(3);
  const code = (randomBytes.readUIntBE(0, 3) % 900000 + 100000).toString();
  const expiresAtMs = Date.now() + 15 * 60 * 1000;

  memLinkCodes.set(code, { userId, code, expiresAt: expiresAtMs, used: false });

  try {
    const supabase = createClient();
    await supabase
      .from('whatsapp_link_codes')
      .update({ used: true })
      .eq('user_id', userId)
      .eq('used', false);

    const { error } = await supabase.from('whatsapp_link_codes').insert({
      user_id: userId,
      code,
      expires_at: new Date(expiresAtMs).toISOString(),
      used: false
    });
    if (error) console.warn('[WhatsAppLinking] Could not store link code:', error.message);
  } catch (error) {
    console.warn('[WhatsAppLinking] Could not store link code:', error);
  }

  return code;
}

export async function resolveUserByPhone(phoneNumber: string): Promise<string | null> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

  const mem = memConnections.get(cleanPhone);
  if (mem && mem.status === 'CONNECTED') {
    return mem.userId;
  }

  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('whatsapp_connections')
      .select('user_id, status')
      .eq('phone_number', cleanPhone)
      .eq('status', 'CONNECTED')
      .maybeSingle();

    if (data?.user_id) {
      memConnections.set(cleanPhone, { userId: data.user_id, phoneNumber: cleanPhone, status: 'CONNECTED' });
      return data.user_id;
    }
  } catch {
    // fall through
  }

  return null;
}

async function saveConnection(userId: string, cleanPhone: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('whatsapp_connections').upsert(
    {
      user_id: userId,
      phone_number: cleanPhone,
      display_phone_number: `+${cleanPhone}`,
      verified: true,
      status: 'CONNECTED',
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id' }
  );
  if (error) throw new Error(error.message);
}

export async function linkUserByCode(phoneNumber: string, submittedCode: string): Promise<{ success: boolean; message: string; userId?: string }> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const cleanCode = submittedCode.trim().replace(/[^0-9]/g, '');

  const memRecord = memLinkCodes.get(cleanCode);
  if (memRecord) {
    if (memRecord.used) {
      return { success: false, message: 'Invalid or already used verification code.' };
    }
    if (Date.now() > memRecord.expiresAt) {
      return { success: false, message: 'Verification code has expired.' };
    }

    try {
      await saveConnection(memRecord.userId, cleanPhone);
    } catch (error) {
      return { success: false, message: `Could not save the link: ${error instanceof Error ? error.message : String(error)}` };
    }

    memRecord.used = true;
    memConnections.set(cleanPhone, { userId: memRecord.userId, phoneNumber: cleanPhone, status: 'CONNECTED' });

    return {
      success: true,
      message: 'WhatsApp successfully linked to your MENTRA account.',
      userId: memRecord.userId
    };
  }

  try {
    const supabase = createClient();
    const { data: linkRecord, error } = await supabase
      .from('whatsapp_link_codes')
      .select('*')
      .eq('code', cleanCode)
      .eq('used', false)
      .maybeSingle();

    if (error || !linkRecord) {
      return { success: false, message: 'Invalid or already used verification code.' };
    }

    const isExpired = new Date(linkRecord.expires_at).getTime() < Date.now();
    if (isExpired) {
      return { success: false, message: 'Verification code has expired.' };
    }

    await supabase
      .from('whatsapp_link_codes')
      .update({ used: true })
      .eq('id', linkRecord.id);

    await saveConnection(linkRecord.user_id, cleanPhone);
    memConnections.set(cleanPhone, { userId: linkRecord.user_id, phoneNumber: cleanPhone, status: 'CONNECTED' });

    return {
      success: true,
      message: 'WhatsApp successfully linked to your MENTRA account.',
      userId: linkRecord.user_id
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: errorMsg };
  }
}

export async function unlinkWhatsApp(userId: string): Promise<boolean> {
  memConnections.forEach((conn, phone) => {
    if (conn.userId === userId) {
      memConnections.delete(phone);
    }
  });

  try {
    const supabase = createClient();
    await supabase
      .from('whatsapp_connections')
      .update({ status: 'DISCONNECTED', verified: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  } catch {
    // Ignored
  }

  return true;
}
