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
let reconnectAttempt = 0;
let connectingWhatsApp = false;
let explicitStopRequested = false;
let shuttingDown = false;
let lastInboundAt = null;
let lastOutboundAt = null;
let lastMessageError = '';
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
  // Preserve the credential priority that is already provisioned in Render/Vercel.
  // Sending only the active credential avoids auth mismatches between worker versions.
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

  if (privateKey) {
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

  throw new Error('WORKER_AUTH_NOT_CONFIGURED');
}

async function postInternal(endpoint, body = {}, timeoutMs = 120_000) {
  const payload = {
    ...(userId ? { userId } : {}),
    ...body
  };
  const bodyText = JSON.stringify(payload);

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: signedHeaders(bodyText),
    body: bodyText,
    signal: AbortSignal.timeout(timeoutMs)
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

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

function targetUserIds() {
  return userId ? [userId] : [];
}

async function syncToSupabaseDirect(table, payload, conflictKey = 'user_id') {
  if (!supabaseUrl || !supabaseKey) return false;
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?on_conflict=${encodeURIComponent(conflictKey)}`, {
      method: 'POST',
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000)
    });
    if (!response.ok) { console.warn('[Supabase direct sync]', table, response.status); return false; }
    return true;
  } catch (error) { console.warn('[Supabase direct sync]', table, error?.message || error); return false; }
}

async function patchSupabaseDirect(table, userIdValue, payload) {
  if (!supabaseUrl || !supabaseKey || !userIdValue) return false;
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?user_id=eq.${encodeURIComponent(userIdValue)}`, {
      method: 'PATCH',
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000)
    });
    if (!response.ok) { console.warn('[Supabase direct patch]', table, response.status); return false; }
    return true;
  } catch (error) { console.warn('[Supabase direct patch]', table, error?.message || error); return false; }
}

async function sendHeartbeat(status = 'ONLINE', metadata = {}) {
  try { await postInternal('/api/worker/heartbeat', { workerId, status, metadata }, 15_000); return; }
  catch (error) { console.warn('[Heartbeat API fallback]', error?.message || error); }
  const now = new Date().toISOString();
  for (const uid of targetUserIds()) {
    await syncToSupabaseDirect('brain_worker_heartbeats', { worker_id: workerId, user_id: uid, status, metadata, last_seen_at: now, updated_at: now }, 'worker_id');
  }
}

async function sendWhatsAppEvent(status, extra = {}) {
  try { await postInternal('/api/worker/whatsapp/event', { workerId, status, ...extra }, 20_000); return; }
  catch (error) { console.warn('[WhatsApp event API fallback]', status, error?.message || error); }
  const qrReady = status === 'QR_READY' && typeof extra.qr === 'string';
  const now = new Date();
  for (const uid of targetUserIds()) {
    await syncToSupabaseDirect('whatsapp_qr_sessions', {
      user_id: uid, worker_id: workerId, status,
      qr_code: qrReady ? extra.qr : null,
      qr_expires_at: qrReady ? new Date(now.getTime() + 75_000).toISOString() : null,
      connected_number: typeof extra.connectedNumber === 'string' ? extra.connectedNumber : null,
      last_error: typeof extra.error === 'string' ? extra.error.slice(0, 1000) : null,
      connected_at: status === 'CONNECTED' ? now.toISOString() : null,
      updated_at: now.toISOString()
    });
    if (status === 'CONNECTED' && extra.connectedNumber) {
      const phone = String(extra.connectedNumber).replace(/[^0-9]/g, '');
      await syncToSupabaseDirect('whatsapp_connections', { user_id: uid, phone_number: phone, display_phone_number: `+${phone}`, verified: true, status: 'CONNECTED', last_active_at: now.toISOString(), updated_at: now.toISOString() });
    } else if (status === 'DISCONNECTED' || status === 'ERROR') {
      await patchSupabaseDirect('whatsapp_connections', uid, { verified: false, status: 'DISCONNECTED', updated_at: now.toISOString() });
    }
  }
}

function rememberBotMessage(id) {
  if (!id) return;
  sentByBot.add(id);
  if (sentByBot.size > 500) sentByBot.delete(sentByBot.values().next().value);
}

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
const geminiModel = process.env.AI_MODEL_FAST || 'gemini-flash-latest';

async function generateAutonomousAIReply(userText, pushName = '', mediaInfo = null) {
  try {
    const systemPrompt = `You are MENTRA — the Sovereign AI Fashion & Business Intelligence Agent built for InkThread Hub and Simmo-Naaz.
Your creator is Shubham (InkThread Hub).
You speak directly with the user over WhatsApp.
Tone & Persona:
- Professional, hyper-intelligent, warm, creative, and action-oriented.
- Naturally bilingual (fluent in Hinglish, Hindi, and English). Respond in the language or style the user speaks.
- Specialized in high-end apparel, streetwear styling, tech packs, fabric sourcing, fashion production, brand marketing, e-commerce, and business automation.
- Format responses beautifully for WhatsApp: use bold *text* for emphasis, clean emojis, bullet points, and keep messages crisp (under 250 words unless detail requested).`;

    const parts = [
      { text: `${systemPrompt}\n\nSender: ${pushName || 'User'}\nIncoming WhatsApp Message: "${userText}"` }
    ];

    if (mediaInfo?.base64) {
      parts.push({
        inlineData: {
          mimeType: mediaInfo.mimeType || 'image/jpeg',
          data: mediaInfo.base64
        }
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        }),
        signal: AbortSignal.timeout(25_000)
      }
    );

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return reply || null;
  } catch (err) {
    console.error('[Autonomous Gemini Generation Failed]', err);
    return null;
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function requestMentraBackend(payload) {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await postInternal('/api/worker/whatsapp/inbound', payload, 55_000);
      if (result?.status === 'PROCESSING') {
        if (attempt < 2) { await sleep(Math.max(500, Number(result.retryAfterMs || 1000))); continue; }
        return result;
      }
      return result;
    } catch (error) { lastError = error; if (attempt < 2) await sleep(800 * (attempt + 1)); }
  }
  if (lastError) console.warn('[Backend Inbound]', lastError?.message || lastError);
  return null;
}

async function sendMessageWithRetry(sock, jid, text) {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await sock.sendMessage(jid, { text }); }
    catch (error) { lastError = error; if (attempt < 2) await sleep(600 * (attempt + 1)); }
  }
  throw lastError || new Error('WHATSAPP_SEND_FAILED');
}

async function handleIncoming(sock, envelope) {
  const jid = envelope.key?.remoteJid || '';
  if (!jid || jid.endsWith('@g.us') || jid.endsWith('@newsletter') || jid === 'status@broadcast') return;
  if (sentByBot.has(envelope.key?.id)) return;
  if (!isAllowedChat(sock, envelope, { allowSelfChat, allowedNumbers })) {
    console.log('[WhatsApp message skipped]', JSON.stringify({ reason: 'CHAT_NOT_ALLOWED', destinationType: jid.split('@')[1], fromMe: Boolean(envelope.key?.fromMe) }));
    return;
  }
  envelope = { ...envelope, message: unwrapMessage(envelope.message) };
  const isImage = Boolean(envelope.message?.imageMessage);
  const rawText = extractText(envelope.message).trim();
  const text = rawText || (isImage ? '[FASHION_DESIGN_IMAGE_UPLOAD]' : '');
  if (!text || text.startsWith(REPLY_MARK)) {
    console.log('[WhatsApp message skipped]', JSON.stringify({ reason: text ? 'BOT_REPLY' : 'NO_TEXT', contentTypes: Object.keys(envelope.message || {}) }));
    return;
  }
  if (!receivedMessages.claim(jid, envelope.key?.id)) {
    console.log('[WhatsApp message skipped]', JSON.stringify({ reason: 'DUPLICATE_TEXT', fromMe: Boolean(envelope.key?.fromMe) }));
    return;
  }
  lastInboundAt = new Date().toISOString();
  lastMessageError = '';
  let imageBase64 = null;
  let mimeType = null;
  if (isImage) {
    try {
      const buffer = await downloadMediaMessage(envelope, 'buffer', {});
      if (buffer) { imageBase64 = buffer.toString('base64'); mimeType = envelope.message?.imageMessage?.mimetype || 'image/jpeg'; }
    } catch (error) { console.warn('[Media download failed]', error?.message || error); }
  }
  console.log('[WhatsApp Inbound] Accepted owner message', envelope.key?.id);
  await sock.sendPresenceUpdate('composing', jid).catch(() => {});
  const payload = {
    jid, messageId: envelope.key?.id || `wa_${Date.now()}`, text, pushName: envelope.pushName || '',
    media: imageBase64 ? { base64: imageBase64, mimeType: mimeType || 'image/jpeg', caption: rawText } : null
  };
  const backendResult = await requestMentraBackend(payload);
  if (backendResult?.duplicate && backendResult?.delivered) {
    console.log('[WhatsApp Inbound] Duplicate already delivered; skipping resend');
    await sock.sendPresenceUpdate('paused', jid).catch(() => {});
    return;
  }
  let finalReply = backendResult?.reply ? String(backendResult.reply) : null;
  if (!finalReply) {
    console.log('[Autonomous AI Engine] Backend unavailable; using direct fallback');
    finalReply = await generateAutonomousAIReply(text, envelope.pushName || '', imageBase64 ? { base64: imageBase64, mimeType } : null);
  }
  if (!finalReply) finalReply = 'MENTRA is connected, but the AI service is temporarily unavailable. Please send the message again.';
  await sock.sendPresenceUpdate('paused', jid).catch(() => {});
  try {
    const outboundText = `${REPLY_MARK}\n${String(finalReply)}`.slice(0, 12000);
    const sent = await sendMessageWithRetry(sock, jid, outboundText);
    rememberBotMessage(sent?.key?.id);
    lastOutboundAt = new Date().toISOString();
    if (backendResult?.reply && envelope.key?.id) {
      postInternal('/api/worker/whatsapp/inbound', { action: 'ack', messageId: envelope.key.id }, 10_000).catch(error => console.warn('[Delivery ack]', error?.message || error));
    }
  } catch (error) {
    lastMessageError = error instanceof Error ? error.message : String(error);
    receivedMessages.release(jid, envelope.key?.id);
    console.error('[WhatsApp Outbound]', error);
    throw error;
  }
}

async function getEffectiveAuthState() {
  if (process.env.WHATSAPP_AUTH_STORE !== 'local') return useRemoteAuthState();
  const authDir = process.env.WHATSAPP_AUTH_DIR || './data/whatsapp-auth';
  return useMultiFileAuthState(authDir);
}

function messageTimestampMs(value) {
  if (!value) return 0;
  const seconds = typeof value === 'number' ? value : Number(value?.low ?? value?.toString?.() ?? 0);
  return Number.isFinite(seconds) ? seconds * 1000 : 0;
}

function scheduleReconnect(delayMs) {
  if (shuttingDown || reconnectTimer || activeSocket || connectingWhatsApp) return;
  const delay = Math.max(250, Number(delayMs || 0));
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (shuttingDown || activeSocket || connectingWhatsApp) return;
    connectWhatsApp().catch(error => console.error('[WhatsApp reconnect]', error));
  }, delay);
  reconnectTimer.unref?.();
}

async function connectWhatsApp() {
  if (shuttingDown || connectingWhatsApp) return;
  connectingWhatsApp = true;
  try {
    if (activeSocket) {
      try {
        activeSocket.ev.removeAllListeners('connection.update'); activeSocket.ev.removeAllListeners('creds.update');
        activeSocket.ev.removeAllListeners('messages.upsert'); activeSocket.ev.removeAllListeners('messages.update');
        activeSocket.ev.removeAllListeners('messaging-history.set'); activeSocket.end(new Error('Reconnecting'));
      } catch {}
      activeSocket = null;
    }
    const { state, saveCreds } = await getEffectiveAuthState();
    const sock = makeWASocket({ auth: state, emitOwnEvents: true, markOnlineOnConnect: true, syncFullHistory: false });
    activeSocket = sock;
    let connectionOpenedAtMs = Date.now();
    sock.ev.on('creds.update', () => { saveCreds().catch(error => console.warn('[WhatsApp creds]', error?.message || error)); });
    sock.ev.on('connection.update', async update => {
      try {
        if (update.qr) { console.log('[WhatsApp QR] Fresh QR generated for authenticated dashboard'); await sendWhatsAppEvent('QR_READY', { qr: update.qr }).catch(() => {}); }
        if (update.connection === 'open') {
          connectionOpenedAtMs = Date.now(); reconnectAttempt = 0; explicitStopRequested = false;
          const connectedNumber = String(sock.user?.id || '').split(':')[0].split('@')[0];
          await saveCreds();
          if (!userId) {
            try { const pending = await postInternal('/api/worker/whatsapp/pending', { connectedNumber }, 15_000); if (pending?.userId) userId = pending.userId; }
            catch (error) { console.warn('[Session binding]', error?.message || error); }
          }
          await sendWhatsAppEvent('CONNECTED', { connectedNumber }).catch(() => {});
          await sendHeartbeat('ONLINE', { whatsappConnected: true }).catch(() => {});
          console.log('[MENTRA Brain Worker] WhatsApp CONNECTED; owner self-chat only');
        }
        if (update.connection === 'close') {
          const statusCode = update.lastDisconnect?.error?.output?.statusCode;
          const loggedOut = statusCode === DisconnectReason.loggedOut;
          const stopRequested = explicitStopRequested;
          explicitStopRequested = false;
          if (activeSocket === sock) activeSocket = null;
          if (shuttingDown) return;
          if (loggedOut) {
            const authDir = process.env.WHATSAPP_AUTH_DIR || './data/whatsapp-auth';
            try { if (fs.existsSync(authDir)) fs.rmSync(authDir, { recursive: true, force: true }); } catch {}
            await clearRemoteAuth().catch(() => {});
            if (stopRequested) { await sendWhatsAppEvent('DISCONNECTED').catch(() => {}); await sendHeartbeat('ONLINE', { whatsappConnected: false }).catch(() => {}); return; }
            await sendWhatsAppEvent('WAITING_QR', { error: update.lastDisconnect?.error?.message || 'WhatsApp session requires re-linking' }).catch(() => {});
            await sendHeartbeat('ONLINE', { whatsappConnected: false }).catch(() => {});
            scheduleReconnect(2_000); return;
          }
          await sendWhatsAppEvent('ERROR', { error: update.lastDisconnect?.error?.message || `Socket closed (${statusCode || 'unknown'})` }).catch(() => {});
          await sendHeartbeat('ONLINE', { whatsappConnected: false }).catch(() => {});
          reconnectAttempt += 1;
          scheduleReconnect(Math.min(30_000, 2_000 * (2 ** Math.min(reconnectAttempt, 4))));
        }
      } catch (error) { console.error('[WhatsApp connection event]', error); }
    });
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify' && type !== 'append') return;
      for (const message of messages || []) {
        try {
          const msgTimestamp = messageTimestampMs(message.messageTimestamp);
          if (msgTimestamp && Date.now() - msgTimestamp > 120_000) continue;
          messageQueue = messageQueue.then(() => handleIncoming(sock, message)).catch(error => console.error('[WhatsApp inbound]', error));
          await messageQueue;
        } catch (error) { console.error('[WhatsApp inbound]', error); }
      }
    });
    sock.ev.on('messaging-history.set', async event => {
      const historyMessages = Array.isArray(event?.messages) ? event.messages : [];
      for (const message of historyMessages) {
        try {
          const msgTimestamp = messageTimestampMs(message?.messageTimestamp);
          if (!msgTimestamp || msgTimestamp < connectionOpenedAtMs - 2_000) continue;
          if (Date.now() - msgTimestamp > 120_000) continue;
          if (!message?.key?.remoteJid || !extractText(message.message).trim()) continue;
          if (!isAllowedChat(sock, message, { allowSelfChat, allowedNumbers })) continue;
          messageQueue = messageQueue.then(() => handleIncoming(sock, message)).catch(error => console.error('[WhatsApp inbound history]', error));
          await messageQueue;
        } catch (error) { console.error('[WhatsApp inbound history]', error); }
      }
    });
    sock.ev.on('messages.update', async updates => {
      for (const entry of updates || []) {
        try {
          const update = entry?.update || {};
          if (!update.message || !entry?.key?.remoteJid) continue;
          const synthetic = { key: entry.key, message: update.message, messageTimestamp: update.messageTimestamp || Math.floor(Date.now() / 1000), pushName: '' };
          if (!extractText(synthetic.message).trim()) continue;
          messageQueue = messageQueue.then(() => handleIncoming(sock, synthetic)).catch(error => console.error('[WhatsApp inbound update]', error));
          await messageQueue;
        } catch (error) { console.error('[WhatsApp inbound update]', error); }
      }
    });
  } finally { connectingWhatsApp = false; }
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
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    if (req.url.startsWith('/pair')) {
      res.writeHead(410, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'PAIRING_CODE_DISABLED', message: 'MENTRA supports authenticated QR pairing only.' }));
      return;
    }
    if (req.url === '/qr') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'AUTHENTICATED_DASHBOARD_REQUIRED', qrUrl: `${baseUrl}/connections/whatsapp` }));
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
          whatsappMode: 'QR_SELF_ONLY',
          lastInboundAt,
          lastOutboundAt,
          lastMessageError: lastMessageError || null,
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
    console.log(`[MENTRA Brain Worker] Authenticated QR UI: ${baseUrl}/connections/whatsapp`);
  });

  return server;
}

async function startBackendLoop() {
  if (activeSocket || connectingWhatsApp || shuttingDown) return;
  try {
    await sendHeartbeat('STARTING', { node: process.version, whatsappConnected: false });
    backendReady = true; backendError = '';
  } catch (error) { backendReady = false; backendError = error instanceof Error ? error.message : String(error); console.warn('[Backend Notice]', backendError); }
  try { await connectWhatsApp(); }
  catch (error) { backendReady = false; backendError = error instanceof Error ? error.message : String(error); console.error('[MENTRA Brain Worker] connectWhatsApp error:', error); scheduleReconnect(5_000); }
}

async function main() {
  startHealthServer();
  try { assertConfig(); }
  catch (error) { configError = error instanceof Error ? error.message : String(error); console.error('[MENTRA Brain Worker] Configuration required:', configError); return; }
  sendHeartbeat('ONLINE', { workerId, whatsappConnected: false }).catch(() => {});
  await startBackendLoop();
  setInterval(() => {
    if (!userId || shuttingDown) return;
    if (!activeSocket && !connectingWhatsApp) { startBackendLoop().catch(error => console.warn('[Backend retry]', error)); return; }
    sendHeartbeat('ONLINE', { whatsappConnected: Boolean(activeSocket?.user), lastInboundAt, lastOutboundAt, lastMessageError: lastMessageError || null })
      .then(() => { backendReady = true; backendError = ''; })
      .catch(error => { backendReady = false; backendError = error instanceof Error ? error.message : String(error); console.warn('[Heartbeat]', error); });
  }, heartbeatInterval).unref();
  let checkingControl = false;
  setInterval(async () => {
    if (!userId || checkingControl || shuttingDown) return;
    checkingControl = true;
    try {
      const desired = await postInternal('/api/worker/whatsapp/pending', {}, 10_000);
      if (desired.status === 'DISCONNECTED') {
        explicitStopRequested = true;
        await clearRemoteAuth().catch(() => {});
        if (activeSocket?.user) await activeSocket.logout();
        else if (activeSocket) { try { activeSocket.end(new Error('Disconnected by control plane')); } catch {} activeSocket = null; }
        return;
      }
      if (desired.status === 'WAITING_QR') {
        if (activeSocket?.user) { explicitStopRequested = false; await clearRemoteAuth().catch(() => {}); await activeSocket.logout(); }
        else if (!activeSocket && !connectingWhatsApp) scheduleReconnect(250);
      }
    } catch (error) { console.warn('[WhatsApp control]', error?.message || error); }
    finally { checkingControl = false; }
  }, 10_000).unref();
  setInterval(() => { triggerScheduler().catch(error => console.warn('[Scheduler]', error)); }, schedulerInterval).unref();
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[MENTRA Brain Worker] ${signal} received; preserving WhatsApp session`);
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  try {
    await sendHeartbeat('STOPPING', { whatsappConnected: Boolean(activeSocket?.user) });
    activeSocket?.ev?.removeAllListeners?.('connection.update');
    activeSocket?.end?.(new Error('Worker shutting down'));
  } catch (error) { console.warn('[Shutdown]', error?.message || error); }
  finally { process.exit(0); }
}

process.once('SIGTERM', () => { shutdown('SIGTERM').catch(() => process.exit(0)); });
process.once('SIGINT', () => { shutdown('SIGINT').catch(() => process.exit(0)); });
process.on('unhandledRejection', error => { console.error('[Unhandled rejection]', error); });

main().catch(error => { backendReady = false; backendError = error instanceof Error ? error.message : String(error); console.error('[MENTRA Brain Worker] Startup error:', error); });
