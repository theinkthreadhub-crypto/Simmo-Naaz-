import { createClient } from '@/lib/supabase/server';
import { encryptToken, decryptToken } from '../crypto';

export interface DecryptedGoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scopes: string[];
}

export async function getValidGoogleAccessToken(userId: string): Promise<{ token: string | null; error?: string }> {
  const supabase = createClient();

  const { data: tokenRecord, error } = await supabase
    .from('integration_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'GOOGLE')
    .single();

  if (error || !tokenRecord) {
    return { token: null, error: 'CONNECTION_REQUIRED' };
  }

  // Decrypt tokens
  let accessToken = '';
  let refreshToken = '';
  try {
    accessToken = decryptToken({
      ciphertext: tokenRecord.encrypted_access_token,
      iv: tokenRecord.token_iv,
      tag: tokenRecord.token_tag
    });

    if (tokenRecord.encrypted_refresh_token) {
      refreshToken = decryptToken({
        ciphertext: tokenRecord.encrypted_refresh_token,
        iv: tokenRecord.token_iv,
        tag: tokenRecord.token_tag
      });
    }
  } catch (err: any) {
    return { token: null, error: 'TOKEN_DECRYPTION_ERROR' };
  }

  // Check Expiration (with 60-second safety buffer)
  const isExpired = tokenRecord.expires_at 
    ? new Date(tokenRecord.expires_at).getTime() < Date.now() + 60000
    : false;

  if (!isExpired && accessToken) {
    return { token: accessToken };
  }

  // Attempt refresh if refresh token exists
  if (!refreshToken) {
    await markIntegrationStatus(userId, 'GOOGLE', 'ACTION_REQUIRED');
    return { token: null, error: 'TOKEN_EXPIRED_NO_REFRESH' };
  }

  try {
    const refreshed = await refreshGoogleToken(refreshToken);
    if (!refreshed.accessToken) {
      await markIntegrationStatus(userId, 'GOOGLE', 'TOKEN_EXPIRED');
      return { token: null, error: 'TOKEN_REFRESH_FAILED' };
    }

    // Encrypt and persist refreshed token
    const encrypted = encryptToken(refreshed.accessToken);
    const newExpiresAt = new Date(Date.now() + (refreshed.expiresIn || 3600) * 1000).toISOString();

    await supabase
      .from('integration_tokens')
      .update({
        encrypted_access_token: encrypted.ciphertext,
        token_iv: encrypted.iv,
        token_tag: encrypted.tag,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('provider', 'GOOGLE');

    return { token: refreshed.accessToken };
  } catch (err: any) {
    await markIntegrationStatus(userId, 'GOOGLE', 'TOKEN_EXPIRED');
    return { token: null, error: 'TOKEN_REFRESH_NETWORK_ERROR' };
  }
}

async function refreshGoogleToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials missing on server.');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Failed to refresh token');
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 3600
  };
}

export async function markIntegrationStatus(
  userId: string,
  provider: string,
  status: 'CONNECTED' | 'DISCONNECTED' | 'ACTION_REQUIRED' | 'TOKEN_EXPIRED'
) {
  const supabase = createClient();
  await supabase
    .from('integrations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('provider', provider);
}
