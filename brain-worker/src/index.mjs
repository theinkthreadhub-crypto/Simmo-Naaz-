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
  proto,
  downloadMediaMessage,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';

const baseUrl = (process.env.MENTRA_BASE_URL || 'https://mentra.inkthreadhub.in').replace(/\/$/, '');
let userId = process.env.MENTRA_USER_ID || '';
const privateKeyB64 = process.env.BRAIN_WORKER_PRIVATE_KEY_B64 || '';
const workerToken = process.env.BRAIN_WORKER_TOKEN || '';
const brainWorkerSecret = process.env.BRAIN_WORKER_SECRET || 'mentra-brain-cluster-2026';
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

const REPLY_MARK = '🧠 MENTRA';
const sentByBot = new Set();

let activeSocket = null;
let reconnectTimer = null;
let privateKey = null;
let configError = '';
let backendError = '';
let backendReady = false;

function assertConfig() {
  const missing = [];
  if (!baseUrl) missing.push('MENTRA_BASE_URL');
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

  const ownNumbers = new Set(
    [
      jidNumber(sock?.user?.id),
      jidNumber(sock?.user?.lid)
    ].filter(Boolean)
  );

  const candidates = [
    jid,
    key.remoteJidAlt,
    key.senderPn,
    key.participantPn
  ]
    .filter(Boolean)
    .map(jidNumber)
    .filter(Boolean);

  const isSelfChat = candidates.some(number => ownNumbers.has(number));

  if (allowSelfChat && isSelfChat) {
    return true;
  }

  // Also allow incoming direct 1-to-1 messages
  if (!key.fromMe) {
    return true;
  }

  return false;
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
  if (!text || text.startsWith(REPLY_MARK)) return;

  const allowed = isAllowedChat(sock, envelope);
  console.log(`[WhatsApp Inbound] Received from ${jid}: "${text}" (Allowed: ${allowed})`);
  if (!allowed) return;

  await sock.sendPresenceUpdate('composing', jid).catch(() => {});

  try {
    console.log(`[WhatsApp Inbound] Requesting MENTRA AI reply for "${text}"...`);
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
      console.log(`[WhatsApp Outbound] Sending reply to ${jid}: "${result.reply.slice(0, 100)}..."`);
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
  }
}

async function getEffectiveAuthState() {
  const authDir = process.env.WHATSAPP_AUTH_DIR || './data/whatsapp-auth';
  return await useMultiFileAuthState(authDir);
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
          await clearRemoteAuth().catch(() => {});
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

let latestRawQr = null;

function startHealthServer() {
  const server = createServer((req, res) => {
    if (req.url === '/qr') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      if (activeSocket?.user) {
        res.end(`<!DOCTYPE html>
        <html>
        <head><title>MENTRA WhatsApp Status</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="font-family:system-ui,sans-serif;text-align:center;padding:50px;background:#090d16;color:#f8fafc;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;">
          <div style="background:#1e293b;padding:36px;border-radius:24px;border:1px solid #334155;max-width:440px;">
            <div style="font-size:48px;margin-bottom:12px;">✅</div>
            <h2 style="color:#22c55e;margin:0 0 10px 0;">WhatsApp Connected!</h2>
            <p style="color:#94a3b8;">Linked Number: <b style="color:#f8fafc;">${String(activeSocket.user.id || '').split(':')[0]}</b></p>
            <p style="color:#64748b;font-size:13px;">MENTRA Autonomous Brain is live and listening for messages.</p>
          </div>
        </body></html>`);
        return;
      }

      if (!latestRawQr) {
        res.end(`<!DOCTYPE html>
        <html>
        <head><title>MENTRA WhatsApp QR</title><meta http-equiv="refresh" content="3"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="font-family:system-ui,sans-serif;text-align:center;padding:50px;background:#090d16;color:#f8fafc;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;">
          <div style="background:#1e293b;padding:36px;border-radius:24px;border:1px solid #334155;">
            <div style="font-size:32px;animation:spin 1s linear infinite;">⏳</div>
            <h3 style="color:#38bdf8;">Generating WhatsApp QR Code...</h3>
            <p style="color:#94a3b8;font-size:14px;">Refreshing automatically in 3 seconds...</p>
          </div>
        </body></html>`);
        return;
      }

      const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=10&data=${encodeURIComponent(latestRawQr)}`;
      res.end(`<!DOCTYPE html>
      <html>
      <head>
        <title>MENTRA WhatsApp QR</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="refresh" content="18">
      </head>
      <body style="font-family:system-ui,-apple-system,sans-serif;margin:0;padding:24px;background:#090d16;color:#f8fafc;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:90vh;">
        <div style="background:#1e293b;padding:32px 28px;border-radius:24px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.7);max-width:420px;width:100%;border:1px solid #334155;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(56,189,248,0.1);padding:6px 14px;border-radius:999px;border:1px solid rgba(56,189,248,0.2);margin-bottom:16px;">
            <span style="font-size:16px;">🧠</span>
            <span style="color:#38bdf8;font-weight:600;font-size:13px;letter-spacing:0.5px;">MENTRA AI BRAIN</span>
          </div>
          <h2 style="margin:0 0 8px 0;font-size:22px;color:#ffffff;font-weight:700;">Connect WhatsApp</h2>
          <p style="color:#94a3b8;font-size:14px;margin:0 0 24px 0;line-height:1.5;">Open WhatsApp on phone &rarr; <b>Linked Devices</b> &rarr; <b>Link a Device</b> and point camera at the QR code below:</p>
          
          <div style="background:#ffffff;padding:16px;border-radius:20px;display:inline-block;box-shadow:0 10px 25px rgba(0,0,0,0.3);margin-bottom:18px;">
            <img src="${qrImgUrl}" alt="WhatsApp QR" style="width:260px;height:260px;display:block;border-radius:8px;" />
          </div>

          <div style="background:#0f172a;padding:12px;border-radius:12px;border:1px solid #334155;color:#64748b;font-size:12px;display:flex;align-items:center;justify-content:center;gap:6px;">
            <span>🔄</span> Auto-refreshes every 18 seconds
          </div>
        </div>
      </body>
      </html>`);
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
          qrUrl: `http://localhost:${port}/qr`,
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
    await sendHeartbeat('STARTING', { node: process.version }).catch(() => {});
    await sendWhatsAppEvent('WAITING_QR').catch(() => {});
    backendReady = true;
    backendError = '';
  } catch (error) {
    backendReady = false;
    backendError = error instanceof Error ? error.message : String(error);
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

  if (!userId) {
    console.log('[MENTRA Brain Worker] ⏳ Waiting for user session...');
    console.log('[MENTRA Brain Worker] 👉 Open https://mentra.inkthreadhub.in/connections/whatsapp in your browser to pair.');

    const checkInterval = setInterval(async () => {
      try {
        const pending = await postInternal('/api/worker/whatsapp/pending', {});
        if (pending?.userId) {
          clearInterval(checkInterval);
          userId = pending.userId;
          console.log(`[MENTRA Brain Worker] ✅ Paired with user: ${userId}`);
          await startBackendLoop();
        }
      } catch (err) {
        // Keep waiting for user session
      }
    }, 3000);
  } else {
    await startBackendLoop();
  }

  setInterval(() => {
    if (!backendReady || !activeSocket) {
      startBackendLoop().catch(error =>
        console.warn('[Backend retry]', error)
      );
      return;
    }

    sendHeartbeat('ONLINE', {
      whatsappConnected: Boolean(activeSocket?.user)
    }).catch(error => {
      backendReady = false;
      backendError = error instanceof Error ? error.message : String(error);
      console.warn('[Heartbeat]', error);
    });
  }, heartbeatInterval).unref();

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
