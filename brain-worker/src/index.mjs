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
const schedulerInterval = Math.max(
  60_000,
  Number(process.env.SCHEDULER_INTERVAL_MS || 60_000)
);
const heartbeatInterval = Math.max(
  60_000,
  Number(process.env.HEARTBEAT_INTERVAL_MS || 60_000)
);
const sessionFile = path.resolve('./data/user-session.json');

let accessToken = '';
let refreshToken = process.env.MENTRA_REFRESH_TOKEN || '';
let accessTokenExpiresAt = 0;
let userId = '';
let activeSocket = null;
let reconnectTimer = null;

function assertConfig() {
  const missing = [];
  if (!baseUrl) missing.push('MENTRA_BASE_URL');
  if (!workerSecret) missing.push('BRAIN_WORKER_SECRET');
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
  if (!refreshToken) missing.push('MENTRA_REFRESH_TOKEN');
  if (missing.length) {
    throw new Error(`Missing worker env: ${missing.join(', ')}`);
  }
}

async function loadPersistedSession() {
  try {
    const raw = JSON.parse(await fs.readFile(sessionFile, 'utf8'));
    refreshToken = raw.refreshToken || refreshToken;
    accessToken = raw.accessToken || '';
    accessTokenExpiresAt = Number(raw.accessTokenExpiresAt || 0);
    userId = raw.userId || '';
  } catch {
    // First boot.
  }
}

async function persistSession() {
  await fs.mkdir(path.dirname(sessionFile), { recursive: true });
  await fs.writeFile(
    sessionFile,
    JSON.stringify({
      refreshToken,
      accessToken,
      accessTokenExpiresAt,
      userId
    }, null, 2),
    { mode: 0o600 }
  );
}

async function refreshUserSession(force = false) {
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
      body: JSON.stringify({ refresh_token: refreshToken })
    }
  );

  if (!response.ok) {
    throw new Error(
      `Supabase token refresh failed: ${response.status} ${await response.text()}`
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
    body: JSON.stringify(body)
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
  if (!userId) await refreshUserSession();
  await postInternal('/api/worker/heartbeat', {
    workerId,
    userId,
    status,
    metadata
  });
}

async function sendWhatsAppEvent(status, extra = {}) {
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

async function handleIncoming(sock, envelope) {
  const jid = envelope.key?.remoteJid || '';
  if (
    !jid ||
    envelope.key?.fromMe ||
    jid.endsWith('@g.us') ||
    jid === 'status@broadcast'
  ) {
    return;
  }

  const text = extractText(envelope.message).trim();
  if (!text) return;

  const result = await postInternal(
    '/api/worker/whatsapp/inbound',
    {
      jid,
      messageId: envelope.key?.id || `wa_${Date.now()}`,
      text,
      pushName: envelope.pushName || ''
    },
    { userAuth: true }
  );

  if (result?.reply) {
    await sock.sendMessage(jid, {
      text: String(result.reply).slice(0, 12000)
    });
  }
}

async function connectWhatsApp() {
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
        console.log(
          '[MENTRA Brain Worker] WhatsApp connected:',
          connectedNumber || 'linked device'
        );
      }

      if (update.connection === 'close') {
        const statusCode =
          update.lastDisconnect?.error?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        await sendWhatsAppEvent(
          loggedOut ? 'DISCONNECTED' : 'ERROR',
          {
            error:
              update.lastDisconnect?.error?.message ||
              `Socket closed (${statusCode || 'unknown'})`
          }
        );

        activeSocket = null;

        if (!loggedOut && !reconnectTimer) {
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
  if (!cronSecret) return;

  try {
    const response = await fetch(`${baseUrl}/api/cron/dispatch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cronSecret}`
      }
    });

    if (!response.ok) {
      console.warn(
        '[Scheduler tick]',
        response.status,
        await response.text()
      );
    }
  } catch (error) {
    console.warn('[Scheduler tick]', error);
  }
}

async function main() {
  assertConfig();
  await loadPersistedSession();
  await refreshUserSession(true);
  await sendHeartbeat('STARTING', { node: process.version });
  await sendWhatsAppEvent('WAITING_QR');

  setInterval(() => {
    sendHeartbeat('ONLINE', {
      whatsappConnected: Boolean(activeSocket?.user)
    }).catch(error => console.warn('[Heartbeat]', error));
  }, heartbeatInterval).unref();

  setInterval(() => {
    triggerScheduler().catch(error => console.warn('[Scheduler]', error));
  }, schedulerInterval).unref();

  await connectWhatsApp();
}

process.on('SIGTERM', async () => {
  try {
    await sendHeartbeat('STOPPING');
    activeSocket?.end?.(new Error('Worker shutting down'));
  } finally {
    process.exit(0);
  }
});

main().catch(error => {
  console.error('[MENTRA Brain Worker] Fatal:', error);
  process.exit(1);
});
