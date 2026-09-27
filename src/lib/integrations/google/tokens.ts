import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { encryptToken, decryptToken } from '../crypto';

interface GoogleTokenRecord {
  id: string;
  user_id: string;
  provider: string;
  encrypted_access_token: string;
  encrypted_refresh_token?: string | null;
  token_iv: string;
  token_tag: string;
  refresh_token_iv?: string | null;
  refresh_token_tag?: string | null;
  expires_at?: string | null;
  scopes?: string[] | null;
}

export interface GoogleTokenHealth {
  tokenPresent: boolean;
  refreshAvailable: boolean;
  expiresAt?: string;
  scopes: string[];
}

function createGoogleAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error('GOOGLE_TOKEN_STORE_NOT_CONFIGURED');
  }

  return createSupabaseClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

async function getTokenRecord(userId: string): Promise<GoogleTokenRecord | null> {
  const admin = createGoogleAdminClient();
  const { data, error } = await admin
    .from('integration_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'GOOGLE')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as GoogleTokenRecord | null) || null;
}

function decryptAccessToken(record: GoogleTokenRecord): string {
  return decryptToken({
    ciphertext: record.encrypted_access_token,
    iv: record.token_iv,
    tag: record.token_tag
  });
}

function decryptRefreshToken(record: GoogleTokenRecord): string | null {
  if (!record.encrypted_refresh_token) return null;

  const iv = record.refresh_token_iv || record.token_iv;
  const tag = record.refresh_token_tag || record.token_tag;

  try {
    return decryptToken({
      ciphertext: record.encrypted_refresh_token,
      iv,
      tag
    });
  } catch {
    return null;
  }
}

export async function getGoogleTokenHealth(userId: string): Promise<GoogleTokenHealth> {
  const record = await getTokenRecord(userId);
  if (!record) {
    return {
      tokenPresent: false,
      refreshAvailable: false,
      scopes: []
    };
  }

  return {
    tokenPresent: true,
    refreshAvailable: Boolean(record.encrypted_refresh_token),
    expiresAt: record.expires_at || undefined,
    scopes: record.scopes || []
  };
}

export async function storeGoogleTokens(
  userId: string,
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
    scopes: string[];
  }
): Promise<void> {
  const admin = createGoogleAdminClient();
  const existing = await getTokenRecord(userId);

  const encryptedAccess = encryptToken(tokens.accessToken);
  let encryptedRefresh = tokens.refreshToken
    ? encryptToken(tokens.refreshToken)
    : null;

  // Google may omit refresh_token on a reconnect. Preserve the previously
  // encrypted refresh token rather than silently destroying offline access.
  if (!encryptedRefresh && existing?.encrypted_refresh_token) {
    encryptedRefresh = {
      ciphertext: existing.encrypted_refresh_token,
      iv: existing.refresh_token_iv || existing.token_iv,
      tag: existing.refresh_token_tag || existing.token_tag
    };
  }

  const expiresAt = new Date(
    Date.now() + Math.max(60, Number(tokens.expiresIn || 3600)) * 1000
  ).toISOString();

  const { error } = await admin
    .from('integration_tokens')
    .upsert({
      user_id: userId,
      provider: 'GOOGLE',
      encrypted_access_token: encryptedAccess.ciphertext,
      encrypted_refresh_token: encryptedRefresh?.ciphertext || null,
      token_iv: encryptedAccess.iv,
      token_tag: encryptedAccess.tag,
      refresh_token_iv: encryptedRefresh?.iv || null,
      refresh_token_tag: encryptedRefresh?.tag || null,
      expires_at: expiresAt,
      scopes: tokens.scopes || [],
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,provider' });

  if (error) throw new Error(error.message);
}

export async function deleteGoogleTokens(userId: string): Promise<void> {
  const admin = createGoogleAdminClient();
  const { error } = await admin
    .from('integration_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'GOOGLE');

  if (error) throw new Error(error.message);
}

export async function getGoogleTokenForRevocation(
  userId: string
): Promise<string | null> {
  const record = await getTokenRecord(userId);
  if (!record) return null;

  return decryptRefreshToken(record) || decryptAccessToken(record);
}

async function markIntegrationStatus(
  userId: string,
  status: 'CONNECTED' | 'DISCONNECTED' | 'ACTION_REQUIRED' | 'TOKEN_EXPIRED'
): Promise<void> {
  const admin = createGoogleAdminClient();
  await admin
    .from('integrations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('provider', 'GOOGLE');
}

async function refreshGoogleToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number; scopes?: string[] }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_OAUTH_NOT_CONFIGURED');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(15_000),
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || `GOOGLE_TOKEN_REFRESH_FAILED_${res.status}`
    );
  }

  return {
    accessToken: data.access_token,
    expiresIn: Number(data.expires_in || 3600),
    scopes: data.scope
      ? String(data.scope).split(' ').filter(Boolean)
      : undefined
  };
}

export async function getValidGoogleAccessToken(
  userId: string,
  forceRefresh = false
): Promise<{ token: string | null; error?: string }> {
  let record: GoogleTokenRecord | null;
  try {
    record = await getTokenRecord(userId);
  } catch {
    return { token: null, error: 'TOKEN_STORE_UNAVAILABLE' };
  }

  if (!record) {
    return { token: null, error: 'CONNECTION_REQUIRED' };
  }

  let accessToken: string;
  try {
    accessToken = decryptAccessToken(record);
  } catch {
    await markIntegrationStatus(userId, 'ACTION_REQUIRED').catch(() => undefined);
    return { token: null, error: 'TOKEN_DECRYPTION_ERROR' };
  }

  const expiresSoon = record.expires_at
    ? new Date(record.expires_at).getTime() <= Date.now() + 60_000
    : false;

  if (!forceRefresh && accessToken && !expiresSoon) {
    return { token: accessToken };
  }

  const refreshToken = decryptRefreshToken(record);
  if (!refreshToken) {
    await markIntegrationStatus(userId, 'ACTION_REQUIRED').catch(() => undefined);
    return { token: null, error: 'TOKEN_EXPIRED_NO_REFRESH' };
  }

  try {
    const refreshed = await refreshGoogleToken(refreshToken);
    const encryptedAccess = encryptToken(refreshed.accessToken);
    const expiresAt = new Date(
      Date.now() + Math.max(60, refreshed.expiresIn) * 1000
    ).toISOString();

    const admin = createGoogleAdminClient();
    const { error } = await admin
      .from('integration_tokens')
      .update({
        encrypted_access_token: encryptedAccess.ciphertext,
        token_iv: encryptedAccess.iv,
        token_tag: encryptedAccess.tag,
        expires_at: expiresAt,
        scopes: refreshed.scopes || record.scopes || [],
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('provider', 'GOOGLE');

    if (error) throw new Error(error.message);

    await markIntegrationStatus(userId, 'CONNECTED').catch(() => undefined);
    return { token: refreshed.accessToken };
  } catch {
    await markIntegrationStatus(userId, 'TOKEN_EXPIRED').catch(() => undefined);
    return { token: null, error: 'TOKEN_REFRESH_FAILED' };
  }
}

export async function googleApiFetch(
  userId: string,
  url: string,
  init: RequestInit = {}
): Promise<{ response?: Response; error?: string }> {
  const first = await getValidGoogleAccessToken(userId);
  if (!first.token) return { error: first.error || 'CONNECTION_REQUIRED' };

  const request = (token: string) => fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`
    },
    signal: init.signal || AbortSignal.timeout(15_000)
  });

  let response: Response;
  try {
    response = await request(first.token);
  } catch {
    return { error: 'GOOGLE_NETWORK_ERROR' };
  }

  if (response.status !== 401) return { response };

  const refreshed = await getValidGoogleAccessToken(userId, true);
  if (!refreshed.token) {
    return { error: refreshed.error || 'TOKEN_EXPIRED' };
  }

  try {
    response = await request(refreshed.token);
    return { response };
  } catch {
    return { error: 'GOOGLE_NETWORK_ERROR' };
  }
}
