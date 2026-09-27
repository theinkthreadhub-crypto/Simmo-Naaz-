import { createServer } from 'node:http';
import {
  createPrivateKey,
  sign as signPayload
} from 'node:crypto';
import process from 'node:process';
import makeWASocket, {
  BufferJSON,
  DisconnectReason,
  initAuthCreds,
  proto
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';

const baseUrl = (process.env.MENTRA_BASE_URL || '').replace(/\/$/, '');
const userId = process.env.MENTRA_USER_ID || '';
const privateKeyB64 = process.env.BRAIN_WORKER_PRIVATE_KEY_B64 || '';
const cronSecret = process.env.CRON_SECRET || '';
const workerId = process.env.WORKER_ID || 'mentra-brain-01';
const port = Number(process.env.PORT || 10000);
const schedulerInterval = Math.max(
  60_000,
  Number(process.env.SCHEDULER_INTERVAL_MS || 60_000)
);
const heartbeatInterval = Math.max(
  60_000,
  Number(process.env.HEARTBEAT_INTERVAL_MS || 60_000)
);

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

let activeSocket = null;
let reconnectTimer = null;
let privateKey = null;
let configError = '';

function assertConfig() {
  const missing = [];
  if (!baseUrl) missing.push('MENTRA_BASE_URL');
  if (!userId) missing.push('MENTRA_USER_ID');
  if (!privateKeyB64) missing.push('BRAIN_WORKER_PRIVATE_KEY_B64');

  if (missing.length) {
    throw new Error(`Missing worker env: ${missing.join(', ')}`);
  }

  privateKey = createPrivateKey(
    Buffer.from(privateKeyB64, 'base64').toString('utf8')
  );
}

function signedHeaders(bodyText) {
  const timestamp = String(Date.now());
  const signature = signPayload(
    null,
    Buffer.from(`${timestamp}.${bodyText}`, 'utf8'),
    privateKey
  ).toString('base64');

  return {
    'Content-Type': 'application/json',
    'x-mentra-worker-timestamp': timestamp,
    'x-mentra-worker-signature': signature
  };
}

async function postInternal(endpoint, body = {}) {
  const payload = {
    userId,
    ...body
  };
  const bodyText = JSON.stringify(payload);

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: signedHeaders(bodyText),
    body: bodyText,
    signal: AbortSignal.timeout(45_000)
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

async function authStore(action, body = {}) {
  return postInternal('/api/worker/whatsapp/auth', {
    action,
    ...body
  });
}

async function useRemoteAuthState() {
  const loaded = await authStore('load_creds');

  const creds = loaded?.creds
    ? JSON.parse(loaded.creds, BufferJSON.reviver)
    : initAuthCreds();

  const state = {
    creds,
    keys: {
      get: async (type, ids) => {
        const response = await authStore('get_keys', {
          type,
          ids
        });

        const data = {};
        for (const id of ids) {
          const encoded = response?.values?.[id];
          let value = encoded
            ? JSON.parse(encoded, BufferJSON.reviver)
            : undefined;

          if (type === 'app-state-sync-key' && value) {
            value = proto.Message.AppStateSyncKeyData.fromObject(value);
          }

          data[id] = value;
        }

        return data;
      },

      set: async data => {
        const entries = [];

        for (const category of Object.keys(data || {})) {
          for (const id of Object.keys(data[category] || {})) {
            const value = data[category][id];
            entries.push({
              type: category,
              keyId: id,
              value:
                value === null || typeof value === 'undefined'
                  ? null
                  : JSON.stringify(value, BufferJSON.replacer)
            });
          }
        }

        if (entries.length > 0) {
          await authStore('set_keys', { entries });
        }
      }
    }
  };

  return {
    state,
    saveCreds: async () => {
      await authStore('save_creds', {
        creds: JSON.stringify(state.creds, BufferJSON.replacer)
      });
    }
  };
}

async function clearRemoteAuth() {
  await authStore('clear');
}

async function sendHeartbeat(status = 'ONLINE', metadata = {}) {
  await postInternal('/api/worker/heartbeat', {
    workerId,
    status,
    metadata
  });
}

async function sendWhatsAppEvent(status, extra = {}) {
  await postInternal('/api/worker/whatsapp/event', {
    workerId,
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
    sentByBot.delete(oldest);
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
    number => number === ownNumber || (ownLid && number === ownLid)
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

  const result = await postInternal(
    '/api/worker/whatsapp/inbound',
    {
      jid,
      messageId: envelope.key?.id || `wa_${Date.now()}`,
      text,
      pushName: envelope.pushName || ''
    }
  );

  if (result?.reply) {
    const sent = await sock.sendMessage(jid, {
      text: `${REPLY_MARK}\n${String(result.reply)}`.slice(0, 12000)
    });
    rememberBotMessage(sent?.key?.id);
  }
}

async function connectWhatsApp() {
  const { state, saveCreds } = await useRemoteAuthState();

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

        await saveCreds();
        await sendWhatsAppEvent('CONNECTED', { connectedNumber });

        console.log(
          '[MENTRA Brain Worker] WhatsApp connected:',
          connectedNumber || 'linked device'
        );
        console.log(
          '[MENTRA Brain Worker] Replies to:',
          [
            allowSelfChat ? 'self chat' : null,
            ...Array.from(allowedNumbers)
          ]
            .filter(Boolean)
            .join(', ') || 'nobody'
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

        if (loggedOut) {
          await clearRemoteAuth().catch(error =>
            console.warn('[WhatsApp auth clear]', error)
          );
          return;
        }

        if (!reconnectTimer) {
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
      },
      signal: AbortSignal.timeout(30_000)
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

function startHealthServer() {
  const server = createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: true,
          service: 'mentra-brain-worker',
          configured: !configError,
          configError: configError || null,
          whatsappConnected: Boolean(activeSocket?.user),
          selfChat: allowSelfChat,
          workerId,
          now: new Date().toISOString()
        })
      );
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'NOT_FOUND' }));
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[MENTRA Brain Worker] Health server listening on :${port}`);
  });

  return server;
}

async function main() {
  startHealthServer();

  try {
    assertConfig();
  } catch (error) {
    configError = error instanceof Error ? error.message : String(error);
    console.error('[MENTRA Brain Worker] Configuration required:', configError);
    return;
  }

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
