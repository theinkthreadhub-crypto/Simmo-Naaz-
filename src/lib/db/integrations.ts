import { supabase } from '@/lib/supabase/client';
import { IntegrationConnection } from '@/types/mentra';

const NAMES: Record<string,string> = {
  GOOGLE: 'Google Workspace',
  GOOGLE_ACCOUNT: 'Google Account',
  GMAIL: 'Gmail',
  GOOGLE_CALENDAR: 'Google Calendar',
  GOOGLE_DRIVE: 'Google Drive',
  GOOGLE_SHEETS: 'Google Sheets',
  GOOGLE_CONTACTS: 'Google Contacts',
  WHATSAPP: 'WhatsApp',
  WHATSAPP_CLOUD_API: 'WhatsApp Gateway'
};

export async function getUserIntegrations(userId: string): Promise<IntegrationConnection[]> {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => {
    const service = row.service || row.provider;
    return {
      id: row.id,
      user_id: row.user_id,
      service,
      name: NAMES[service] || service,
      status: row.status,
      lastSync: row.last_sync_at || row.metadata?.last_sync || undefined,
      accountEmail: row.account_email || row.metadata?.account_email || undefined,
      description: ''
    } as IntegrationConnection;
  });
}

export async function toggleIntegrationStatus(
  userId: string,
  provider: string,
  targetStatus: 'CONNECTED' | 'DISCONNECTED'
): Promise<boolean> {
  // This helper never fabricates a connection. It only updates an existing
  // row after an integration flow has independently established/revoked it.
  const { data: existing, error: lookupError } = await supabase
    .from('integrations')
    .select('id, service')
    .eq('user_id', userId)
    .or(`provider.eq.${provider},service.eq.${provider}`)
    .limit(1)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (!existing) return false;

  const { error } = await supabase
    .from('integrations')
    .update({
      status: targetStatus,
      last_sync_at: targetStatus === 'CONNECTED' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', existing.id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return true;
}
