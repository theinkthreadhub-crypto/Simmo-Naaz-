import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export interface WhatsAppConnectionRecord {
  id: string;
  user_id: string;
  phone_number: string;
  display_phone_number?: string;
  verified: boolean;
  status:
    | 'NOT_CONFIGURED'
    | 'READY_TO_CONNECT'
    | 'WAITING_LINK'
    | 'CONNECTED'
    | 'TOKEN_ERROR'
    | 'WEBHOOK_ERROR'
    | 'DISCONNECTED';
}

function normalizePhone(phoneNumber: string): string | null {
  const digits = String(phoneNumber || '').replace(/[^0-9]/g, '');
  return /^[0-9]{8,15}$/.test(digits) ? digits : null;
}

function generateSixDigitCode(): string {
  const value = crypto.randomInt(100000, 1000000);
  return String(value);
}

export async function generateWhatsAppLinkCode(userId: string): Promise<string> {
  const supabase = createClient();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error: expireError } = await supabase
    .from('whatsapp_link_codes')
    .update({ used: true })
    .eq('user_id', userId)
    .eq('used', false);

  if (expireError) throw new Error(expireError.message);

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateSixDigitCode();
    const { error } = await supabase.from('whatsapp_link_codes').insert({
      user_id: userId,
      code,
      expires_at: expiresAt,
      used: false
    });

    if (!error) return code;
    if (error.code !== '23505') throw new Error(error.message);
  }

  throw new Error('WHATSAPP_LINK_CODE_GENERATION_FAILED');
}

export async function resolveUserByPhone(phoneNumber: string): Promise<string | null> {
  const cleanPhone = normalizePhone(phoneNumber);
  if (!cleanPhone) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('whatsapp_connections')
    .select('user_id')
    .eq('phone_number', cleanPhone)
    .eq('verified', true)
    .eq('status', 'CONNECTED')
    .maybeSingle();

  if (error) return null;
  return data?.user_id || null;
}

export async function touchWhatsAppConnection(
  userId: string,
  phoneNumber: string
): Promise<void> {
  const cleanPhone = normalizePhone(phoneNumber);
  if (!cleanPhone) return;

  const supabase = createClient();
  await supabase
    .from('whatsapp_connections')
    .update({
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('phone_number', cleanPhone)
    .eq('status', 'CONNECTED');
}

export async function linkUserByCode(
  phoneNumber: string,
  submittedCode: string
): Promise<{ success: boolean; message: string; userId?: string }> {
  const cleanPhone = normalizePhone(phoneNumber);
  const cleanCode = String(submittedCode || '').replace(/[^0-9]/g, '');

  if (!cleanPhone) {
    return { success: false, message: 'Invalid WhatsApp phone number.' };
  }

  if (!/^[0-9]{6}$/.test(cleanCode)) {
    return { success: false, message: 'Verification code must be 6 digits.' };
  }

  try {
    const supabase = createClient();
    const { data: linkedUserId, error } = await supabase.rpc(
      'consume_whatsapp_link_code',
      {
        p_code: cleanCode,
        p_phone: cleanPhone
      }
    );

    if (error || !linkedUserId) {
      return {
        success: false,
        message: 'Invalid, expired, or already used verification code.'
      };
    }

    const now = new Date().toISOString();
    const { error: integrationError } = await supabase
      .from('integrations')
      .upsert({
        user_id: linkedUserId,
        provider: 'WHATSAPP',
        service: 'WHATSAPP_CLOUD_API',
        status: 'CONNECTED',
        account_id: cleanPhone,
        last_sync_at: now,
        metadata: {
          linked_via: 'CLOUD_API_CODE',
          verified_at: now
        },
        updated_at: now
      }, { onConflict: 'user_id,service' });

    if (integrationError) throw new Error(integrationError.message);

    return {
      success: true,
      message: 'WhatsApp successfully linked to your MENTRA account.',
      userId: linkedUserId
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'WhatsApp linking failed.'
    };
  }
}

export async function unlinkWhatsApp(userId: string): Promise<boolean> {
  const supabase = createClient();
  const now = new Date().toISOString();

  const { error: connectionError } = await supabase
    .from('whatsapp_connections')
    .update({
      status: 'DISCONNECTED',
      verified: false,
      updated_at: now
    })
    .eq('user_id', userId);

  if (connectionError) throw new Error(connectionError.message);

  const { error: integrationError } = await supabase
    .from('integrations')
    .update({
      status: 'DISCONNECTED',
      account_id: null,
      last_sync_at: null,
      metadata: {},
      updated_at: now
    })
    .eq('user_id', userId)
    .eq('service', 'WHATSAPP_CLOUD_API');

  if (integrationError) throw new Error(integrationError.message);

  await supabase
    .from('whatsapp_link_codes')
    .update({ used: true })
    .eq('user_id', userId)
    .eq('used', false);

  return true;
}
