import { googleApiFetch } from './tokens';

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

function header(headers: any[], name: string): string {
  return headers.find((h: any) => String(h.name).toLowerCase() === name.toLowerCase())?.value || '';
}

function decodeBase64Url(value: string): string {
  try {
    return Buffer.from(value, 'base64url').toString('utf8');
  } catch {
    return '';
  }
}

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function collectMimeText(part: any, mimeType: 'text/plain' | 'text/html'): string[] {
  const output: string[] = [];
  if (!part) return output;

  if (part.mimeType === mimeType && part.body?.data) {
    output.push(decodeBase64Url(part.body.data));
  }

  for (const child of part.parts || []) {
    output.push(...collectMimeText(child, mimeType));
  }

  return output.filter(Boolean);
}

function bodyFromPayload(payload: any, fallback = ''): string {
  const plain = collectMimeText(payload, 'text/plain').join('\n\n').trim();
  if (plain) return plain.slice(0, 12_000);

  const html = collectMimeText(payload, 'text/html').join('\n').trim();
  if (html) return stripHtml(html).slice(0, 12_000);

  if (payload?.body?.data) {
    return stripHtml(decodeBase64Url(payload.body.data)).slice(0, 12_000);
  }

  return fallback.slice(0, 12_000);
}

function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function validateRecipient(value: string): string | null {
  const clean = sanitizeHeaderValue(value);
  if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return null;
  return clean;
}

function encodeMessage(raw: string): string {
  return Buffer.from(raw, 'utf8').toString('base64url');
}

export async function searchGmail(
  userId: string,
  query = 'is:inbox',
  maxResults = 5
): Promise<{ emails: GmailEmailSnippet[]; error?: string }> {
  const limit = Math.min(20, Math.max(1, Number(maxResults) || 5));
  const listUrl =
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${limit}`;

  const list = await googleApiFetch(userId, listUrl);
  if (!list.response) return { emails: [], error: list.error || 'CONNECTION_REQUIRED' };

  if (!list.response.ok) {
    return { emails: [], error: `GMAIL_API_ERROR_${list.response.status}` };
  }

  const listData = await list.response.json();
  const messages = listData.messages || [];

  const detailed = await Promise.all(
    messages.map(async (msg: any) => {
      const details = await googleApiFetch(
        userId,
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(msg.id)}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date&metadataHeaders=To`
      );

      if (!details.response?.ok) return null;
      const data = await details.response.json();
      const headers = data.payload?.headers || [];

      return {
        id: data.id,
        threadId: data.threadId,
        subject: header(headers, 'Subject') || '(No Subject)',
        from: header(headers, 'From') || 'Unknown Sender',
        to: header(headers, 'To') || undefined,
        date: header(headers, 'Date'),
        snippet: data.snippet || '',
        isUnread: (data.labelIds || []).includes('UNREAD')
      } as GmailEmailSnippet;
    })
  );

  return { emails: detailed.filter(Boolean) as GmailEmailSnippet[] };
}

export async function readGmailMessage(
  userId: string,
  messageId: string
): Promise<{ email?: GmailEmailDetail; error?: string }> {
  const result = await googleApiFetch(
    userId,
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(messageId)}?format=full`
  );

  if (!result.response) return { error: result.error || 'CONNECTION_REQUIRED' };
  if (!result.response.ok) {
    return { error: `GMAIL_FETCH_FAILED_${result.response.status}` };
  }

  const data = await result.response.json();
  const headers = data.payload?.headers || [];

  return {
    email: {
      id: data.id,
      threadId: data.threadId,
      subject: header(headers, 'Subject') || '(No Subject)',
      from: header(headers, 'From') || 'Unknown Sender',
      to: header(headers, 'To') || undefined,
      date: header(headers, 'Date'),
      snippet: data.snippet || '',
      isUnread: (data.labelIds || []).includes('UNREAD'),
      bodyText: bodyFromPayload(data.payload, data.snippet || '')
    }
  };
}

async function replyThreadHeaders(
  userId: string,
  messageId: string
): Promise<{ threadId?: string; messageIdHeader?: string }> {
  const result = await googleApiFetch(
    userId,
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(messageId)}?format=metadata&metadataHeaders=Message-ID`
  );

  if (!result.response?.ok) return {};
  const data = await result.response.json();

  return {
    threadId: data.threadId,
    messageIdHeader: header(data.payload?.headers || [], 'Message-ID') || undefined
  };
}

export async function createGmailDraft(
  userId: string,
  to: string,
  subject: string,
  body: string,
  replyToMessageId?: string
): Promise<{ draftId?: string; error?: string }> {
  const recipient = validateRecipient(to);
  if (!recipient) return { error: 'INVALID_RECIPIENT_EMAIL' };

  const cleanSubject = sanitizeHeaderValue(subject);
  if (!cleanSubject) return { error: 'EMAIL_SUBJECT_REQUIRED' };

  const rawHeaders = [
    `To: ${recipient}`,
    `Subject: ${cleanSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit'
  ];

  let threadId: string | undefined;
  if (replyToMessageId) {
    const reply = await replyThreadHeaders(userId, replyToMessageId);
    threadId = reply.threadId;
    if (reply.messageIdHeader) {
      const messageId = sanitizeHeaderValue(reply.messageIdHeader);
      rawHeaders.push(`In-Reply-To: ${messageId}`);
      rawHeaders.push(`References: ${messageId}`);
    }
  }

  const raw = `${rawHeaders.join('\r\n')}\r\n\r\n${body}`;
  const result = await googleApiFetch(
    userId,
    'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          raw: encodeMessage(raw),
          ...(threadId ? { threadId } : {})
        }
      })
    }
  );

  if (!result.response) return { error: result.error || 'CONNECTION_REQUIRED' };
  if (!result.response.ok) {
    return { error: `DRAFT_CREATION_FAILED_${result.response.status}` };
  }

  const data = await result.response.json();
  return { draftId: data.id };
}

export async function sendGmailMessage(
  userId: string,
  to: string,
  subject: string,
  body: string
): Promise<{ messageId?: string; threadId?: string; error?: string }> {
  const recipient = validateRecipient(to);
  if (!recipient) return { error: 'INVALID_RECIPIENT_EMAIL' };

  const cleanSubject = sanitizeHeaderValue(subject);
  if (!cleanSubject) return { error: 'EMAIL_SUBJECT_REQUIRED' };

  const raw = [
    `To: ${recipient}`,
    `Subject: ${cleanSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    body
  ].join('\r\n');

  const result = await googleApiFetch(
    userId,
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encodeMessage(raw) })
    }
  );

  if (!result.response) return { error: result.error || 'CONNECTION_REQUIRED' };
  if (!result.response.ok) {
    return { error: `GMAIL_SEND_FAILED_${result.response.status}` };
  }

  const data = await result.response.json();
  return { messageId: data.id, threadId: data.threadId };
}
