import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedChat, extractText, createMessageDeduplicator, REPLY_MARK } from '../src/messagePolicy.mjs';

const sock = { user: { id: '911234567890:4@s.whatsapp.net', lid: '123456:2@lid' } };
test('Message yourself is accepted for phone and LID destinations', () => {
  for (const remoteJid of ['911234567890@s.whatsapp.net', '123456@lid']) {
    assert.equal(isAllowedChat(sock, { key: { remoteJid, fromMe: true } }), true);
  }
  assert.equal(isAllowedChat(sock, { key: { remoteJid: 'other@lid', remoteJidAlt: '911234567890@s.whatsapp.net', fromMe: true } }), true);
});
test('Owner sender fields do not make messages to another contact self-chat', () => {
  assert.equal(isAllowedChat(sock, { key: { remoteJid: '919999999999@s.whatsapp.net', fromMe: true, senderPn: sock.user.id } }), false);
});
test('Strangers and groups cannot access the owner assistant', () => {
  for (const remoteJid of ['919999999999@s.whatsapp.net','911234567890@g.us','status@broadcast']) {
    assert.equal(isAllowedChat(sock, { key: { remoteJid, fromMe: false } }), false);
  }
});
test('Explicit allowlist admits incoming messages only', () => {
  const options = { allowSelfChat: false, allowedNumbers: ['919999999999'] };
  assert.equal(isAllowedChat(sock, { key: { remoteJid: '919999999999@s.whatsapp.net', fromMe: false } }, options), true);
  assert.equal(isAllowedChat(sock, { key: { remoteJid: '919999999999@s.whatsapp.net', fromMe: true } }, options), false);
});
test('Wrapped and plain self-chat messages have readable text', () => {
  assert.equal(extractText({ ephemeralMessage: { message: { extendedTextMessage: { text: 'hello' } } } }), 'hello');
  assert.equal(extractText({ conversation: `${REPLY_MARK}\nhello` }).startsWith(REPLY_MARK), true);
});
test('Duplicate notify/append events are claimed once per chat', () => {
  const dedup = createMessageDeduplicator(2);
  assert.equal(dedup.claim('self','a'), true);
  assert.equal(dedup.claim('self','a'), false);
  assert.equal(dedup.claim('other','a'), true);
  dedup.claim('self','b');
  assert.equal(dedup.claim('self','a'), true);
});
