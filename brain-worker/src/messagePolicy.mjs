export const REPLY_MARK = '\u{1F9E0} MENTRA';

export function jidNumber(jid) {
  return String(jid || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
}

export function unwrapMessage(message) {
  for (let depth = 0; depth < 5; depth++) {
    const inner = message?.deviceSentMessage?.message || message?.ephemeralMessage?.message || message?.viewOnceMessage?.message ||
      message?.viewOnceMessageV2?.message || message?.documentWithCaptionMessage?.message;
    if (!inner) return message;
    message = inner;
  }
  return message;
}

export function extractText(message) {
  const content = unwrapMessage(message);
  return content?.conversation || content?.extendedTextMessage?.text ||
    content?.imageMessage?.caption || content?.videoMessage?.caption || '';
}

export function isAllowedChat(sock, envelope, { allowSelfChat = true, allowedNumbers = [] } = {}) {
  const key = envelope.key || {};
  const jid = key.remoteJid || '';
  if (!jid || !/@(s\.whatsapp\.net|lid)$/.test(jid)) return false;
  // Only the destination identifies a self-chat. Sender fields identify the
  // owner on ALL outgoing messages, including messages sent to other contacts.
  const ownIds = new Set([sock?.user?.id, sock?.user?.lid].filter(Boolean)
    .map(value => String(value).replace(/:\d+(?=@)/, '')));
  const destinations = [jid, key.remoteJidAlt].filter(Boolean)
    .map(value => String(value).replace(/:\d+(?=@)/, ''));
  if (allowSelfChat && destinations.some(value => ownIds.has(value))) return true;
  return !key.fromMe && destinations.some(value => value.endsWith('@s.whatsapp.net') && allowedNumbers.includes(jidNumber(value)));
}

export function createMessageDeduplicator(limit = 2000) {
  const ids = new Set();
  return {
    claim(jid, id) {
      if (!id) return false;
      const key = `${jid}:${id}`;
      if (ids.has(key)) return false;
      ids.add(key);
      if (ids.size > limit) ids.delete(ids.values().next().value);
      return true;
    },
    release(jid, id) { ids.delete(`${jid}:${id}`); }
  };
}

