import { getValidGoogleAccessToken } from './tokens';

export interface GmailEmailSnippet {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to?: string;
  date: string;
  snippet: string;
  isUnread?: boolean;
}

export interface GmailEmailDetail extends GmailEmailSnippet {
  bodyText: string;
}

export async function searchGmail(
  userId: string,
  query: string = 'is:inbox',
  maxResults: number = 5
): Promise<{ emails: GmailEmailSnippet[]; error?: string }> {
  const { token, error } = await getValidGoogleAccessToken(userId);
  if (!token || error) {
    return { emails: [], error: error || 'CONNECTION_REQUIRED' };
  }

  try {
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!listRes.ok) {
      if (listRes.status === 401) return { emails: [], error: 'TOKEN_EXPIRED' };
      return { emails: [], error: `GMAIL_API_ERROR_${listRes.status}` };
    }

    const listData = await listRes.json();
    const messages = listData.messages || [];

    const detailedEmails: GmailEmailSnippet[] = [];
    for (const msg of messages) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date&metadataHeaders=To`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (msgRes.ok) {
        const d = await msgRes.json();
        const headers = d.payload?.headers || [];
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
        const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
        const date = headers.find((h: any) => h.name === 'Date')?.value || '';
        const to = headers.find((h: any) => h.name === 'To')?.value || '';
        const isUnread = (d.labelIds || []).includes('UNREAD');

        detailedEmails.push({
          id: d.id,
          threadId: d.threadId,
          subject,
          from,
          to,
          date,
          snippet: d.snippet || '',
          isUnread
        });
      }
    }

    return { emails: detailedEmails };
  } catch (err: any) {
    return { emails: [], error: err.message };
  }
}

export async function readGmailMessage(
  userId: string,
  messageId: string
): Promise<{ email?: GmailEmailDetail; error?: string }> {
  const { token, error } = await getValidGoogleAccessToken(userId);
  if (!token || error) {
    return { error: error || 'CONNECTION_REQUIRED' };
  }

  try {
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      return { error: `GMAIL_FETCH_FAILED_${res.status}` };
    }

    const data = await res.json();
    const headers = data.payload?.headers || [];
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
    const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
    const date = headers.find((h: any) => h.name === 'Date')?.value || '';

    // Extract text body
    let bodyText = data.snippet || '';
    if (data.payload?.parts) {
      const textPart = data.payload.parts.find((p: any) => p.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf8');
      }
    } else if (data.payload?.body?.data) {
      bodyText = Buffer.from(data.payload.body.data, 'base64').toString('utf8');
    }

    // Strip out HTML tags if present and cap length
    bodyText = bodyText.replace(/<[^>]*>?/gm, '').slice(0, 3000);

    return {
      email: {
        id: data.id,
        threadId: data.threadId,
        subject,
        from,
        date,
        snippet: data.snippet || '',
        bodyText
      }
    };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function createGmailDraft(
  userId: string,
  to: string,
  subject: string,
  body: string,
  replyToMessageId?: string
): Promise<{ draftId?: string; error?: string }> {
  const { token, error } = await getValidGoogleAccessToken(userId);
  if (!token || error) {
    return { error: error || 'CONNECTION_REQUIRED' };
  }

  try {
    const rawHeaders = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset="UTF-8"`
    ];

    if (replyToMessageId) {
      rawHeaders.push(`In-Reply-To: ${replyToMessageId}`);
    }

    const rawEmail = `${rawHeaders.join('\r\n')}\r\n\r\n${body}`;
    const base64EncodedEmail = Buffer.from(rawEmail).toString('base64url');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: { raw: base64EncodedEmail }
      })
    });

    if (!res.ok) {
      return { error: `DRAFT_CREATION_FAILED_${res.status}` };
    }

    const data = await res.json();
    return { draftId: data.id };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function sendGmailMessage(
  userId: string,
  to: string,
  subject: string,
  body: string
): Promise<{ messageId?: string; error?: string }> {
  const { token, error } = await getValidGoogleAccessToken(userId);
  if (!token || error) {
    return { error: error || 'CONNECTION_REQUIRED' };
  }

  try {
    const rawEmail = `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\n${body}`;
    const base64EncodedEmail = Buffer.from(rawEmail).toString('base64url');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: base64EncodedEmail
      })
    });

    if (!res.ok) {
      return { error: `GMAIL_SEND_FAILED_${res.status}` };
    }

    const data = await res.json();
    return { messageId: data.id };
  } catch (err: any) {
    return { error: err.message };
  }
}
