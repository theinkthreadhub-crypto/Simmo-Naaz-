import { createClient } from '@/lib/supabase/server';

export interface WhatsAppConnectionRecord {
  id: string;
  user_id: string;
  phone_number: string;
  display_phone_number?: string;
  verified: boolean;
  status: 'NOT_CONFIGURED' | 'READY_TO_CONNECT' | 'WAITING_LINK' | 'CONNECTED' | 'TOKEN_ERROR' | 'DISCONNECTED';
}

// Supabase is the source of truth. This small process-local cache only avoids
// repeat lookups while a server instance remains warm.
const memConnections = new Map<string, { userId: string; phoneNumber: string; status: string }>();

export async function resolveUserByPhone(phoneNumber: string): Promise<string | null> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

  const mem = memConnections.get(cleanPhone);
  if (mem && mem.status === 'CONNECTED') {
    return mem.userId;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('whatsapp_connections')
      .select('user_id, status')
      .eq('phone_number', cleanPhone)
      .eq('status', 'CONNECTED')
      .maybeSingle();

    if (error) {
      console.warn('[WhatsAppLinking] Connection lookup failed:', error.message);
      return null;
    }

    if (data?.user_id) {
      memConnections.set(cleanPhone, {
        userId: data.user_id,
        phoneNumber: cleanPhone,
        status: 'CONNECTED'
      });
      return data.user_id;
    }
  } catch (error) {
    console.warn(
      '[WhatsAppLinking] Connection lookup failed:',
      error instanceof Error ? error.message : String(error)
    );
  }

  return null;
}

export async function unlinkWhatsApp(userId: string): Promise<boolean> {
  memConnections.forEach((conn, phone) => {
    if (conn.userId === userId) {
      memConnections.delete(phone);
    }
  });

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('whatsapp_connections')
      .update({
        status: 'DISCONNECTED',
        verified: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.warn('[WhatsAppLinking] Disconnect update failed:', error.message);
      return false;
    }
  } catch (error) {
    console.warn(
      '[WhatsAppLinking] Disconnect update failed:',
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }

  return true;
}
