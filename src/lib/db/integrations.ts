import { supabase } from '@/lib/supabase/client';
import { IntegrationConnection } from '@/types/mentra';

const defaultIntegrations: Omit<IntegrationConnection, 'id'>[] = [
  { service: 'GOOGLE_ACCOUNT', name: 'Google Account', status: 'DISCONNECTED', description: 'Primary SSO and master identity verification.' },
  { service: 'GMAIL', name: 'Gmail Workspace', status: 'DISCONNECTED', description: 'Real-time inbox telemetry and draft assistant.' },
  { service: 'GOOGLE_CALENDAR', name: 'Google Calendar', status: 'DISCONNECTED', description: 'Deep work block synchronization and event management.' },
  { service: 'GOOGLE_DRIVE', name: 'Google Drive', status: 'DISCONNECTED', description: 'Mockup assets, tech packs, and brand guideline storage.' },
  { service: 'GOOGLE_SHEETS', name: 'Google Sheets', status: 'DISCONNECTED', description: 'Inventory, supplier bills, and cash flow ledgers.' },
  { service: 'GOOGLE_CONTACTS', name: 'Google Contacts', status: 'DISCONNECTED', description: 'Supplier, agency, and logistics contact directory.' },
  { service: 'WHATSAPP_CLOUD_API', name: 'WhatsApp Cloud Gateway', status: 'DISCONNECTED', description: 'Mobile natural language interface & instant executive audio memos.' },
];

export async function getUserIntegrations(userId: string): Promise<IntegrationConnection[]> {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId);

  if (error || !data || data.length === 0) {
    return defaultIntegrations.map((item, idx) => ({
      id: `int_seed_${idx}`,
      user_id: userId,
      ...item
    }));
  }

  return defaultIntegrations.map((def, idx) => {
    const existing = data.find(d => d.provider === def.service);
    if (existing) {
      return {
        id: existing.id,
        user_id: existing.user_id,
        service: def.service,
        name: def.name,
        status: existing.status,
        lastSync: existing.metadata?.last_sync || 'Connected',
        accountEmail: existing.metadata?.account_email || 'Linked Account',
        description: def.description
      };
    }
    return {
      id: `int_seed_${idx}`,
      user_id: userId,
      ...def
    };
  });
}

export async function toggleIntegrationStatus(
  userId: string,
  provider: string,
  targetStatus: 'CONNECTED' | 'DISCONNECTED'
): Promise<boolean> {
  const { error } = await supabase
    .from('integrations')
    .upsert({
      user_id: userId,
      provider,
      status: targetStatus,
      metadata: { last_sync: targetStatus === 'CONNECTED' ? 'Just now' : null },
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,provider' });

  return !error;
}
