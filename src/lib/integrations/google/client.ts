const PRODUCTION_GOOGLE_REDIRECT_URI =
  'https://mentra.inkthreadhub.in/api/integrations/google/callback';

export function getGoogleRedirectUri(): string {
  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_GOOGLE_REDIRECT_URI;
  }

  return (
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/integrations/google/callback`
  );
}

export const GOOGLE_SCOPES = {
  OPENID: 'openid',
  EMAIL: 'email',
  PROFILE: 'profile',
  GMAIL_READ: 'https://www.googleapis.com/auth/gmail.readonly',
  GMAIL_COMPOSE: 'https://www.googleapis.com/auth/gmail.compose',
  GMAIL_SEND: 'https://www.googleapis.com/auth/gmail.send',
  CALENDAR_READ: 'https://www.googleapis.com/auth/calendar.readonly',
  CALENDAR_EVENTS: 'https://www.googleapis.com/auth/calendar.events',
  DRIVE_READ: 'https://www.googleapis.com/auth/drive.readonly',
  SHEETS_READ: 'https://www.googleapis.com/auth/spreadsheets.readonly',
  SHEETS_WRITE: 'https://www.googleapis.com/auth/spreadsheets',
  CONTACTS_READ: 'https://www.googleapis.com/auth/contacts.readonly'
} as const;

export const DEFAULT_GOOGLE_SCOPES = [
  GOOGLE_SCOPES.OPENID,
  GOOGLE_SCOPES.EMAIL,
  GOOGLE_SCOPES.PROFILE,
  GOOGLE_SCOPES.GMAIL_READ,
  GOOGLE_SCOPES.GMAIL_COMPOSE,
  GOOGLE_SCOPES.CALENDAR_EVENTS,
  GOOGLE_SCOPES.DRIVE_READ,
  GOOGLE_SCOPES.SHEETS_WRITE,
  GOOGLE_SCOPES.CONTACTS_READ
];

export const GOOGLE_SERVICE_SCOPE_REQUIREMENTS: Record<string, string[]> = {
  GOOGLE_ACCOUNT: [GOOGLE_SCOPES.OPENID, GOOGLE_SCOPES.EMAIL],
  GMAIL: [
    GOOGLE_SCOPES.GMAIL_READ,
    GOOGLE_SCOPES.GMAIL_COMPOSE
  ],
  GOOGLE_CALENDAR: [GOOGLE_SCOPES.CALENDAR_EVENTS],
  GOOGLE_DRIVE: [GOOGLE_SCOPES.DRIVE_READ],
  GOOGLE_SHEETS: [GOOGLE_SCOPES.SHEETS_WRITE],
  GOOGLE_CONTACTS: [GOOGLE_SCOPES.CONTACTS_READ]
};

export function getGoogleOAuthUrl(
  state: string,
  scopes: string[] = DEFAULT_GOOGLE_SCOPES
): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID_MISSING');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: 'code',
    scope: [...new Set(scopes)].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForGoogleTokens(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scopes: string[];
  idToken?: string;
}> {
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
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: 'authorization_code'
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || `GOOGLE_TOKEN_EXCHANGE_FAILED_${res.status}`
    );
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || undefined,
    expiresIn: Number(data.expires_in || 3600),
    scopes: String(data.scope || '')
      .split(' ')
      .map((scope: string) => scope.trim())
      .filter(Boolean),
    idToken: data.id_token || undefined
  };
}

export async function getGoogleUserProfile(
  accessToken: string
): Promise<{ id?: string; email: string; name?: string }> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000)
  });

  if (!res.ok) {
    throw new Error(`GOOGLE_PROFILE_FETCH_FAILED_${res.status}`);
  }

  const data = await res.json();
  if (!data.email) throw new Error('GOOGLE_PROFILE_EMAIL_MISSING');

  return {
    id: data.id || undefined,
    email: data.email,
    name: data.name || undefined
  };
}

export async function revokeGoogleToken(token: string): Promise<boolean> {
  if (!token) return false;

  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(10_000)
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}
