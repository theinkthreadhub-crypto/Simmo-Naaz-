import { createServer } from 'node:http';
import fs from 'node:fs';
import {
  createPrivateKey,
  sign as signPayload
} from 'node:crypto';
import process from 'node:process';
import makeWASocket, {
  BufferJSON,
  DisconnectReason,
  initAuthCreds,
  proto,
  downloadMediaMessage,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import { REPLY_MARK, extractText, isAllowedChat, unwrapMessage, createMessageDeduplicator } from './messagePolicy.mjs';

const baseUrl = (process.env.MENTRA_BASE_URL || 'https://mentra.inkthreadhub.in').replace(/\/$/, '');
let userId = process.env.MENTRA_USER_ID || '';
const privateKeyB64 = process.env.BRAIN_WORKER_PRIVATE_KEY_B64 || '';
const workerToken = process.env.BRAIN_WORKER_TOKEN || '';
const brainWorkerSecret = process.env.BRAIN_WORKER_SECRET || '';
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

const allowSelfChat =
  (process.env.WHATSAPP_SELF_CHAT || 'true').toLowerCase() !== 'false';

const sentByBot = new Set();
const receivedMessages = createMessageDeduplicator();
const allowedNumbers = (process.env.WHATSAPP_ALLOWED_NUMBERS || '').split(',').map(value => value.replace(/[^0-9]/g, '')).filter(Boolean);
let messageQueue = Promise.resolve();

let activeSocket = null;
let reconnectTimer = null;
let privateKey = null;
let configError = '';
let backendError = '';
let backendReady = false;

function assertConfig() {
  const missing = [];
  if (!baseUrl) missing.push('MENTRA_BASE_URL');
  if (!userId) missing.push('MENTRA_USER_ID');
  if (!workerToken && !privateKeyB64 && !brainWorkerSecret) {
    missing.push('BRAIN_WORKER_SECRET, BRAIN_WORKER_TOKEN, or BRAIN_WORKER_PRIVATE_KEY_B64');
  }

  if (missing.length) {
    throw new Error(`Missing worker env: ${missing.join(', ')}`);
  }

  if (privateKeyB64) {
    privateKey = createPrivateKey(
      Buffer.from(privateKeyB64, 'base64').toString('utf8')
    );
  }
}

function signedHeaders(bodyText) {
  if (workerToken) {
    return {
      'Content-Type': 'application/json',
      'x-mentra-worker-token': workerToken
    };
  }

  if (brainWorkerSecret) {
    return {
      'Content-Type': 'application/json',
      'x-mentra-internal-secret': brainWorkerSecret
    };
  }

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
    ...(userId ? { userId } : {}),
    ...body
  };
  const bodyText = JSON.stringify(payload);

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: signedHeaders(bodyText),
    body: bodyText,
    signal: AbortSignal.timeout(120_000)
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

function rememberBotMessage(id) {
  if (!id) return;
  sentByBot.add(id);
  if (sentByBot.size > 500) sentByBot.delete(sentByBot.values().next().value);
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
  if (!isAllowedChat(sock, envelope, { allowSelfChat, allowedNumbers })) {
    console.log('[WhatsApp message skipped]', JSON.stringify({ reason: 'CHAT_NOT_ALLOWED', destinationType: jid.split('@')[1], fromMe: Boolean(envelope.key?.fromMe) }));
    return;
  }
  envelope = { ...envelope, message: unwrapMessage(envelope.message) };
  if (!receivedMessages.claim(jid, envelope.key?.id)) return;

  let imageBase64 = null;
  let mimeType = null;
  const isImage = Boolean(envelope.message?.imageMessage);

  if (isImage) {
    try {
      const buffer = await downloadMediaMessage(envelope, 'buffer', {});
      if (buffer) {
        imageBase64 = buffer.toString('base64');
        mimeType = envelope.message?.imageMessage?.mimetype || 'image/jpeg';
      }
    } catch (err) {
      console.warn('[Media download failed]', err);
    }
  }

  const rawText = extractText(envelope.message).trim();
  const text = rawText || (isImage ? '[FASHION_DESIGN_IMAGE_UPLOAD]' : '');
  if (!text || text.startsWith(REPLY_MARK)) {
    console.log('[WhatsApp message skipped]', JSON.stringify({ reason: text ? 'BOT_REPLY' : 'NO_TEXT', contentTypes: Object.keys(envelope.message || {}) }));
    return;
  }

  const allowed = isAllowedChat(sock, envelope, { allowSelfChat, allowedNumbers });
  console.log('[WhatsApp Inbound] Accepted message', envelope.key?.id);
  if (!allowed) return;

  await sock.sendPresenceUpdate('composing', jid).catch(() => {});

  try {
    console.log('[WhatsApp Inbound] Requesting MENTRA reply');
    const result = await postInternal(
      '/api/worker/whatsapp/inbound',
      {
        jid,
        messageId: envelope.key?.id || `wa_${Date.now()}`,
        text,
        pushName: envelope.pushName || '',
        media: imageBase64 ? {
          base64: imageBase64,
          mimeType: mimeType || 'image/jpeg',
          caption: rawText
        } : null
      }
    );

    await sock.sendPresenceUpdate('paused', jid).catch(() => {});

    if (result?.reply) {
      console.log('[WhatsApp Outbound] Sending MENTRA reply');
      const sent = await sock.sendMessage(jid, {
        text: `${REPLY_MARK}\n${String(result.reply)}`.slice(0, 12000)
      });
      rememberBotMessage(sent?.key?.id);
    } else {
      console.log(`[WhatsApp Outbound] No reply returned from backend for ${jid}`);
    }
  } catch (error) {
    console.error(`[WhatsApp Inbound Error] Failed to process message from ${jid}:`, error);
    await sock.sendPresenceUpdate('paused', jid).catch(() => {});
    const sent = await sock.sendMessage(jid, { text: `${REPLY_MARK}\nAbhi MENTRA se reply nahi aa paya. Thodi der mein message dobara bhejo.` }).catch(() => null);
    rememberBotMessage(sent?.key?.id);
  }
}

async function getEffectiveAuthState() {
  if (process.env.WHATSAPP_AUTH_STORE !== 'local') return useRemoteAuthState();
  const authDir = process.env.WHATSAPP_AUTH_DIR || './data/whatsapp-auth';
  return useMultiFileAuthState(authDir);
}

async function connectWhatsApp() {
  if (activeSocket) {
    try {
      activeSocket.ev.removeAllListeners('connection.update');
      activeSocket.ev.removeAllListeners('creds.update');
      activeSocket.ev.removeAllListeners('messages.upsert');
      activeSocket.end(new Error('Reconnecting'));
    } catch {}
    activeSocket = null;
  }

  const { state, saveCreds } = await getEffectiveAuthState();

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
        latestRawQr = update.qr;
        console.log('\n======================================================');
        console.log('📱 SCAN THIS WHATSAPP QR CODE WITH YOUR PHONE CAMERA:');
        console.log('🌐 OR OPEN IN BROWSER: http://localhost:10000/qr');
        console.log('======================================================\n');
        qrcode.generate(update.qr, { small: true });
        const qrText = await new Promise(resolve => {
          qrcode.generate(update.qr, { small: true }, code => resolve(code));
        }).catch(() => update.qr);
        console.log('\n======================================================\n');
        await sendWhatsAppEvent('QR_READY', { qr: update.qr, rawQr: update.qr, asciiQr: qrText }).catch(() => {});
      }

      if (update.connection === 'open') {
        latestRawQr = null;
        const connectedNumber = String(sock.user?.id || '')
          .split(':')[0]
          .split('@')[0];

        await saveCreds();

        if (!userId) {
          try {
            const pending = await postInternal('/api/worker/whatsapp/pending', { connectedNumber });
            if (pending?.userId) {
              userId = pending.userId;
              console.log(`[MENTRA Brain Worker] ✅ Bound session to user: ${userId}`);
            }
          } catch (e) {
            console.warn('[Session binding]', e?.message || e);
          }
        }

        await sendWhatsAppEvent('CONNECTED', { connectedNumber }).catch(() => {});

        console.log(
          '\n✅ [MENTRA Brain Worker] WhatsApp CONNECTED successfully to:',
          connectedNumber || 'linked device'
        );
        console.log(
          '[MENTRA Brain Worker] Bot replies to: self chat ("Message yourself") and direct messages'
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
        ).catch(() => {});

        activeSocket = null;

        if (loggedOut) {
          activeSocket = null;
          latestRawQr = null;
          const authDir = process.env.WHATSAPP_AUTH_DIR || './data/whatsapp-auth';
          try {
            if (fs.existsSync(authDir)) {
              fs.rmSync(authDir, { recursive: true, force: true });
            }
          } catch {}
          await clearRemoteAuth().catch(() => {});
          console.log('[MENTRA Brain Worker] WhatsApp logged out. Generating fresh QR code in 2s...');
          setTimeout(() => {
            connectWhatsApp().catch(error =>
              console.error('[WhatsApp reconnect]', error)
            );
          }, 2000);
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
    console.log('[WhatsApp message event]', JSON.stringify({ type, count: messages?.length || 0 }));
    if (type !== 'notify' && type !== 'append') return;

    for (const message of messages || []) {
      try {
        const msgTimestamp = Number(message.messageTimestamp) * 1000;
        if (msgTimestamp && (Date.now() - msgTimestamp) > 120_000) {
          continue;
        }
        messageQueue = messageQueue.then(() => handleIncoming(sock, message)).catch(error => console.error('[WhatsApp inbound]', error));
        await messageQueue;
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

let latestRawQr = null;

function startHealthServer() {
  const server = createServer((req, res) => {
    // Pairing QR and session changes are available only in the authenticated app.
    if (['/qr', '/logout', '/disconnect'].includes(req.url)) {
      res.writeHead(403, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ error: 'USE_AUTHENTICATED_MENTRA_CONNECTIONS', url: `${baseUrl}/connections/whatsapp` }));
      return;
    }

    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: true,
          service: 'mentra-brain-worker',
          configured: !configError,
          configError: configError || null,
          backendReady,
          backendError: backendError || null,
          whatsappConnected: Boolean(activeSocket?.user),
          selfChat: allowSelfChat,
          workerId,
          qrUrl: `${baseUrl}/connections/whatsapp`,
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
    console.log(`[MENTRA Brain Worker] 🌐 Visual QR Web Page: http://localhost:${port}/qr`);
  });

  return server;
}

async function startBackendLoop() {
  if (activeSocket) return;

  try {
    await sendHeartbeat('STARTING', { node: process.version });
    await sendWhatsAppEvent('WAITING_QR');
    backendReady = true;
    backendError = '';
  } catch (error) {
    backendReady = false;
    backendError = error instanceof Error ? error.message : String(error);
    return;
  }

  // Connect WhatsApp socket
  try {
    await connectWhatsApp();
  } catch (err) {
    console.error('[MENTRA Brain Worker] connectWhatsApp error:', err);
  }
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

  // Announce worker presence immediately
  sendHeartbeat('ONLINE', { workerId }).catch(() => {});

  await startBackendLoop();

  setInterval(() => {
    if (!userId) return;
    if (!activeSocket) {
      startBackendLoop().catch(error =>
        console.warn('[Backend retry]', error)
      );
      return;
    }

    sendHeartbeat('ONLINE', {
      whatsappConnected: Boolean(activeSocket?.user)
    }).then(() => { backendReady = true; backendError = ''; }).catch(error => {
      backendReady = false;
      backendError = error instanceof Error ? error.message : String(error);
      console.warn('[Heartbeat]', error);
    });
  }, heartbeatInterval).unref();

  // The authenticated app can request disconnect or a fresh pairing QR.
  let checkingControl = false;
  setInterval(async () => {
    if (!userId || !activeSocket?.user || checkingControl) return;
    checkingControl = true;
    try {
      const desired = await postInternal('/api/worker/whatsapp/pending', {});
      if (desired.status === 'DISCONNECTED' || desired.status === 'WAITING_QR') {
        await clearRemoteAuth();
        await activeSocket.logout();
      }
    } catch (error) { console.warn('[WhatsApp control]', error?.message || error); }
    finally { checkingControl = false; }
  }, 10_000).unref();

  setInterval(() => {
    triggerScheduler().catch(error => console.warn('[Scheduler]', error));
  }, schedulerInterval).unref();
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
  backendReady = false;
  backendError = error instanceof Error ? error.message : String(error);
  console.error('[MENTRA Brain Worker] Startup error:', error);
});
