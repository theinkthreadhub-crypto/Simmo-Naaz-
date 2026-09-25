export const GOOGLE_SCOPES = {
  // Read Scopes
  GMAIL_READ: 'https://www.googleapis.com/auth/gmail.readonly',
  CALENDAR_READ: 'https://www.googleapis.com/auth/calendar.readonly',
  DRIVE_READ: 'https://www.googleapis.com/auth/drive.readonly',
  SHEETS_READ: 'https://www.googleapis.com/auth/spreadsheets.readonly',
  CONTACTS_READ: 'https://www.googleapis.com/auth/contacts.readonly',

  // Progressive Write Scopes
  GMAIL_COMPOSE: 'https://www.googleapis.com/auth/gmail.compose',
  GMAIL_SEND: 'https://www.googleapis.com/auth/gmail.send',
  CALENDAR_EVENTS: 'https://www.googleapis.com/auth/calendar.events',
  SHEETS_WRITE: 'https://www.googleapis.com/auth/spreadsheets'
};

export const DEFAULT_GOOGLE_SCOPES = [
  GOOGLE_SCOPES.GMAIL_READ,
  GOOGLE_SCOPES.CALENDAR_READ,
  GOOGLE_SCOPES.DRIVE_READ,
  GOOGLE_SCOPES.SHEETS_READ,
  GOOGLE_SCOPES.CONTACTS_READ,
  GOOGLE_SCOPES.GMAIL_COMPOSE,
  GOOGLE_SCOPES.CALENDAR_EVENTS
];

export function getGoogleOAuthUrl(state: string, scopes: string[] = DEFAULT_GOOGLE_SCOPES): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/integrations/google/callback`;

  if (!clientId) {
    return `/connections?error=GOOGLE_CLIENT_ID_MISSING`;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
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
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/integrations/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured.');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Failed to exchange authorization code');
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in || 3600,
    scopes: (data.scope || '').split(' ').filter(Boolean),
    idToken: data.id_token
  };
}

export async function getGoogleUserProfile(accessToken: string): Promise<{ email: string; name?: string }> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    return { email: 'Connected Google Account' };
  }

  const data = await res.json();
  return {
    email: data.email || 'Connected Google Account',
    name: data.name
  };
}
