export const REPLY_MARK = '\u{1F9E0} MENTRA';

export function jidNumber(jid) {
  return String(jid || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
}

export function normalizeJid(value) {
  return String(value || '').replace(/:\d+(?=@)/, '');
}

export function unwrapMessage(message) {
  for (let depth = 0; depth < 8; depth++) {
    const inner =
      message?.deviceSentMessage?.message ||
      message?.ephemeralMessage?.message ||
      message?.viewOnceMessage?.message ||
      message?.viewOnceMessageV2?.message ||
      message?.viewOnceMessageV2Extension?.message ||
      message?.documentWithCaptionMessage?.message ||
      message?.editedMessage?.message ||
      message?.protocolMessage?.editedMessage;
    if (!inner) return message;
    message = inner;
  }
  return message;
}

export function extractText(message) {
  const content = unwrapMessage(message);
  return content?.conversation ||
    content?.extendedTextMessage?.text ||
    content?.imageMessage?.caption ||
    content?.videoMessage?.caption ||
    content?.documentMessage?.caption ||
    content?.buttonsResponseMessage?.selectedDisplayText ||
    content?.templateButtonReplyMessage?.selectedDisplayText ||
    content?.listResponseMessage?.title ||
    '';
}

export function shouldIgnoreTransportJid(jid) {
  const value = String(jid || '');
  return (
    !value ||
    value === 'status@broadcast' ||
    value.endsWith('@newsletter') ||
    value.endsWith('@g.us')
  );
}

export function isAllowedChat(sock, envelope, { allowSelfChat = true, allowedNumbers = [], selfOnly = true } = {}) {
  const key = envelope?.key || {};
  const jid = key.remoteJid || '';
  if (!jid || !/@(s\.whatsapp\.net|lid)$/.test(jid)) return false;
  if (jid.endsWith('@g.us') || jid.endsWith('@newsletter') || jid === 'status@broadcast') return false;

  const ownIds = [sock?.user?.id, sock?.user?.lid, sock?.user?.jid]
    .filter(Boolean)
    .map(normalizeJid);

  const deviceDestination = envelope?.message?.deviceSentMessage?.destinationJid;
  const destinations = [jid, key.remoteJidAlt, deviceDestination]
    .filter(Boolean)
    .map(normalizeJid);

  const isExactSelf =
    allowSelfChat &&
    key.fromMe === true &&
    destinations.some(destination => ownIds.includes(destination));

  if (selfOnly) return isExactSelf;
  if (isExactSelf) return true;
  if (key.fromMe === true) return false;

  const num = jidNumber(jid);
  const altNum = key.remoteJidAlt ? jidNumber(key.remoteJidAlt) : '';
  const participantNum = key.participant ? jidNumber(key.participant) : '';

  return (
    allowedNumbers.includes(num) ||
    (altNum && allowedNumbers.includes(altNum)) ||
    (participantNum && allowedNumbers.includes(participantNum))
  );
}

export function createMessageDeduplicator(limit = 2000) {
  const ids = new Set();
  return {
    claim(jid, id) {
      if (!id) return false;
      const key = jid + ':' + id;
      if (ids.has(key)) return false;
      ids.add(key);
      if (ids.size > limit) ids.delete(ids.values().next().value);
      return true;
    },
    release(jid, id) { ids.delete(jid + ':' + id); }
  };
}
