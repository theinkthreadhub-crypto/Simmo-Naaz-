import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';

const baseUrl = (process.env.MENTRA_BASE_URL || '').replace(/\/$/, '');
const workerSecret = process.env.BRAIN_WORKER_SECRET || '';
const cronSecret = process.env.CRON_SECRET || '';
const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const authDir = process.env.WHATSAPP_AUTH_DIR || './data/whatsapp-auth';
const workerId = process.env.WORKER_ID || 'mentra-brain-01';
const workerUserId = process.env.WORKER_USER_ID || '';
const whatsappMode = (process.env.WHATSAPP_WORKER_MODE || 'disabled').toLowerCase();
const schedulerEnabled =
  (process.env.SCHEDULER_ENABLED || 'true').toLowerCase() !== 'false';

const schedulerInterval = Math.max(
  60_000,
  Number(process.env.SCHEDULER_INTERVAL_MS || 60_000)
);
const heartbeatInterval = Math.max(
  60_000,
  Number(process.env.HEARTBEAT_INTERVAL_MS || 60_000)
);
const sessionFile = path.resolve('./data/user-session.json');

const allowedNumbers = new Set(
  (process.env.WHATSAPP_ALLOWED_NUMBERS || '')
    .split(',')
    .map(value => value.replace(/[^0-9]/g, ''))
    .filter(Boolean)
);
const allowSelfChat =
  (process.env.WHATSAPP_SELF_CHAT || 'true').toLowerCase() !== 'false';

const REPLY_MARK = '🧠 MENTRA';
const sentByBot = new Set();

let accessToken = '';
let refreshToken = process.env.MENTRA_REFRESH_TOKEN || '';
let accessTokenExpiresAt = 0;
let userId = workerUserId;
let activeSocket = null;
let reconnectTimer = null;
let shuttingDown = false;

function assertConfig() {
  const missing = [];

  if (!baseUrl) missing.push('MENTRA_BASE_URL');
  if (!workerSecret) missing.push('BRAIN_WORKER_SECRET');

  if (schedulerEnabled && !cronSecret) {
    missing.push('CRON_SECRET');
  }

  if (whatsappMode === 'baileys') {
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
    if (!refreshToken) missing.push('MENTRA_REFRESH_TOKEN');
  } else if (whatsappMode !== 'disabled') {
    throw new Error(
      'WHATSAPP_WORKER_MODE must be "disabled" or "baileys". Official Cloud API runs in the MENTRA web app webhook, not this worker.'
    );
  }

  if (missing.length) {
    throw new Error(`Missing worker env: ${missing.join(', ')}`);
  }
}

async function loadPersistedSession() {
  if (whatsappMode !== 'baileys') return;

  try {
    const raw = JSON.parse(await fs.readFile(sessionFile, 'utf8'));
    refreshToken = raw.refreshToken || refreshToken;
    accessToken = raw.accessToken || '';
    accessTokenExpiresAt = Number(raw.accessTokenExpiresAt || 0);
    userId = raw.userId || userId;
  } catch {
    // First boot or no persisted user session.
  }
}

async function persistSession() {
  if (whatsappMode !== 'baileys') return;

  await fs.mkdir(path.dirname(sessionFile), { recursive: true });
  await fs.writeFile(
    sessionFile,
    JSON.stringify(
      {
        refreshToken,
        accessToken,
        accessTokenExpiresAt,
        userId
      },
      null,
      2
    ),
    { mode: 0o600 }
  );
}

async function refreshUserSession(force = false) {
  if (whatsappMode !== 'baileys') {
    throw new Error('USER_SESSION_NOT_REQUIRED_IN_DISABLED_WHATSAPP_MODE');
  }

  if (
    !force &&
    accessToken &&
    Date.now() < accessTokenExpiresAt - 60_000
  ) {
    return accessToken;
  }

  const response = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: AbortSignal.timeout(15_000)
    }
  );

  if (!response.ok) {
    throw new Error(
      `Supabase token refresh failed: ${response.status} ${(
        await response.text()
      ).slice(0, 500)}`
    );
  }

  const data = await response.json();
  accessToken = data.access_token;
  refreshToken = data.refresh_token || refreshToken;
  accessTokenExpiresAt =
    Date.now() + Number(data.expires_in || 3600) * 1000;
  userId = data.user?.id || userId;

  if (!userId) {
    throw new Error('Supabase refresh response did not contain a user id.');
  }

  await persistSession();
  return accessToken;
}

async function postInternal(endpoint, body, { userAuth = false } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-mentra-internal-secret': workerSecret
  };

  if (userAuth) {
    headers.Authorization = `Bearer ${await refreshUserSession()}`;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000)
  });

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { text };
  }

  if (!response.ok) {
    throw new Error(
      `${endpoint} failed: ${response.status} ${text.slice(0, 500)}`
    );
  }

  return data;
}

async function sendHeartbeat(status = 'ONLINE', metadata = {}) {
  await postInternal('/api/worker/heartbeat', {
    workerId,
    userId: userId || null,
    status,
    metadata: {
      schedulerEnabled,
      whatsappMode,
      ...metadata
    }
  });
}

async function sendWhatsAppEvent(status, extra = {}) {
  if (whatsappMode !== 'baileys') return;
  if (!userId) await refreshUserSession();

  await postInternal('/api/worker/whatsapp/event', {
    workerId,
    userId,
    status,
    ...extra
  });
}

function extractText(message) {
  return (
    message?.conversation ||
    message?.extendedTextMessage?.text ||
    message?.imageMessage?.caption ||
    message?.videoMessage?.caption ||
    ''
  );
}

function jidNumber(jid) {
  return String(jid || '')
    .split('@')[0]
    .split(':')[0]
    .replace(/[^0-9]/g, '');
}

function rememberBotMessage(id) {
  if (!id) return;
  sentByBot.add(id);

  if (sentByBot.size > 500) {
    const oldest = sentByBot.values().next().value;
    if (oldest) sentByBot.delete(oldest);
  }
}

function isAllowedChat(sock, envelope) {
  const key = envelope.key || {};
  const jid = key.remoteJid || '';
  const ownNumber = jidNumber(sock.user?.id);
  const ownLid = jidNumber(sock.user?.lid);

  const candidates = [
    jid,
    key.remoteJidAlt,
    key.senderPn,
    key.participantPn
  ]
    .filter(Boolean)
    .map(jidNumber)
    .filter(Boolean);

  const isSelfChat = candidates.some(
    number =>
      number === ownNumber ||
      Boolean(ownLid && number === ownLid)
  );

  if (isSelfChat) return allowSelfChat;
  if (key.fromMe) return false;

  return candidates.some(number => allowedNumbers.has(number));
}

async function handleIncoming(sock, envelope) {
  const jid = envelope.key?.remoteJid || '';

  if (
    !jid ||
    jid.endsWith('@g.us') ||
    jid.endsWith('@newsletter') ||
    jid === 'status@broadcast'
  ) {
    return;
  }

  if (sentByBot.has(envelope.key?.id)) return;

  const text = extractText(envelope.message).trim();
  if (!text || text.startsWith(REPLY_MARK)) return;
  if (!isAllowedChat(sock, envelope)) return;

  const messageId = envelope.key?.id;
  if (!messageId) return;

  const result = await postInternal(
    '/api/worker/whatsapp/inbound',
    {
      jid,
      messageId,
      text,
      pushName: envelope.pushName || ''
    },
    { userAuth: true }
  );

  if (result?.duplicate || !result?.reply) return;

  const sent = await sock.sendMessage(jid, {
    text: `${REPLY_MARK}\n${String(result.reply)}`.slice(0, 12000)
  });

  rememberBotMessage(sent?.key?.id);
}

async function connectWhatsApp() {
  if (whatsappMode !== 'baileys' || shuttingDown) return;

  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const sock = makeWASocket({
    auth: state,
    markOnlineOnConnect: false,
    syncFullHistory: false
  });

  activeSocket = sock;
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async update => {
    try {
      if (update.qr) {
        qrcode.generate(update.qr, { small: true });
        await sendWhatsAppEvent('QR_READY', { qr: update.qr });
      }

      if (update.connection === 'open') {
        const connectedNumber = String(sock.user?.id || '')
          .split(':')[0]
          .split('@')[0];

        await sendWhatsAppEvent('CONNECTED', { connectedNumber });
      }

      if (update.connection === 'close') {
        const statusCode =
          update.lastDisconnect?.error?.output?.statusCode;
        const loggedOut =
          statusCode === DisconnectReason.loggedOut;

        await sendWhatsAppEvent(
          loggedOut ? 'DISCONNECTED' : 'ERROR',
          {
            error:
              update.lastDisconnect?.error?.message ||
              `Socket closed (${statusCode || 'unknown'})`
          }
        );

        activeSocket = null;

        if (!loggedOut && !shuttingDown && !reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connectWhatsApp().catch(error =>
              console.error('[WhatsApp reconnect]', error)
            );
          }, 5000);
        }
      }
    } catch (error) {
      console.error('[WhatsApp connection event]', error);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const message of messages || []) {
      try {
        await handleIncoming(sock, message);
      } catch (error) {
        console.error('[WhatsApp inbound]', error);
      }
    }
  });
}

async function triggerScheduler() {
  if (!schedulerEnabled || !cronSecret || shuttingDown) return;

  try {
    const response = await fetch(`${baseUrl}/api/cron/dispatch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cronSecret}`
      },
      signal: AbortSignal.timeout(45_000)
    });

    if (!response.ok) {
      console.warn(
        '[Scheduler tick]',
        response.status,
        (await response.text()).slice(0, 500)
      );
    }
  } catch (error) {
    console.warn('[Scheduler tick]', error);
  }
}

async function main() {
  assertConfig();
  await loadPersistedSession();

  if (whatsappMode === 'baileys') {
    await refreshUserSession(true);
  }

  await sendHeartbeat('STARTING', { node: process.version });

  const heartbeatTimer = setInterval(() => {
    sendHeartbeat('ONLINE', {
      whatsappConnected: Boolean(activeSocket?.user)
    }).catch(error => console.warn('[Heartbeat]', error));
  }, heartbeatInterval);
  heartbeatTimer.unref();

  if (schedulerEnabled) {
    await triggerScheduler();
    const schedulerTimer = setInterval(() => {
      triggerScheduler().catch(error =>
        console.warn('[Scheduler]', error)
      );
    }, schedulerInterval);
    schedulerTimer.unref();
  }

  if (whatsappMode === 'baileys') {
    await sendWhatsAppEvent('WAITING_QR');
    await connectWhatsApp();
  } else {
    await sendHeartbeat('ONLINE', {
      whatsappConnected: false,
      note: 'Official WhatsApp Cloud API is handled by the MENTRA webhook.'
    });
  }
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  try {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    await sendHeartbeat('STOPPING', { signal });
    activeSocket?.end?.(new Error('Worker shutting down'));
  } catch (error) {
    console.warn('[Worker shutdown]', error);
  } finally {
    process.exit(0);
  }
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

main().catch(error => {
  console.error('[MENTRA Brain Worker] Fatal:', error);
  process.exit(1);
});
