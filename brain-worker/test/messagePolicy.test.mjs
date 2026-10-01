import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedChat, extractText, createMessageDeduplicator, REPLY_MARK } from '../src/messagePolicy.mjs';

const sock = { user: { id: '911234567890:4@s.whatsapp.net', lid: '123456:2@lid' } };

test('Message Yourself accepts exact owner phone and LID', () => {
  for (const remoteJid of ['911234567890@s.whatsapp.net', '123456@lid']) {
    assert.equal(isAllowedChat(sock, { key: { remoteJid, fromMe: true } }), true);
  }
});

test('Device-sent self chat accepts owner destination even if envelope uses another LID', () => {
  assert.equal(isAllowedChat(sock, {
    key: { remoteJid: '999888777@lid', fromMe: true },
    message: { deviceSentMessage: { destinationJid: '911234567890:4@s.whatsapp.net', message: { conversation: 'hello' } } }
  }), true);
});

test('Device-sent message to another contact is rejected', () => {
  assert.equal(isAllowedChat(sock, {
    key: { remoteJid: '999888777@lid', fromMe: true },
    message: { deviceSentMessage: { destinationJid: '919999999999@s.whatsapp.net', message: { conversation: 'hello' } } }
  }), false);
});

test('Strangers, groups, status and arbitrary LIDs cannot access owner assistant', () => {
  for (const remoteJid of ['919999999999@s.whatsapp.net','999888777@lid','911234567890@g.us','status@broadcast']) {
    assert.equal(isAllowedChat(sock, { key: { remoteJid, fromMe: false } }), false);
  }
  assert.equal(isAllowedChat(sock, { key: { remoteJid: '999888777@lid', fromMe: true } }), false);
});

test('Owner sender fields alone do not make another contact a self-chat', () => {
  assert.equal(isAllowedChat(sock, { key: { remoteJid: '919999999999@s.whatsapp.net', fromMe: true, senderPn: sock.user.id } }), false);
});

test('Explicit allowlist only works when selfOnly is intentionally disabled', () => {
  assert.equal(isAllowedChat(sock, { key: { remoteJid: '919999999999@s.whatsapp.net', fromMe: false } }, { allowedNumbers: ['919999999999'] }), false);
  assert.equal(isAllowedChat(sock, { key: { remoteJid: '919999999999@s.whatsapp.net', fromMe: false } }, { allowSelfChat: false, allowedNumbers: ['919999999999'], selfOnly: false }), true);
});

test('Wrapped and device-sent messages expose readable text', () => {
  assert.equal(extractText({ ephemeralMessage: { message: { extendedTextMessage: { text: 'hello' } } } }), 'hello');
  assert.equal(extractText({ conversation: REPLY_MARK + '\nhello' }).startsWith(REPLY_MARK), true);
  assert.equal(extractText({ deviceSentMessage: { destinationJid: sock.user.id, message: { conversation: 'hello from phone' } } }), 'hello from phone');
});

test('Deduplicator can release failed sends for retry', () => {
  const dedup = createMessageDeduplicator(2);
  assert.equal(dedup.claim('self','a'), true);
  assert.equal(dedup.claim('self','a'), false);
  dedup.release('self','a');
  assert.equal(dedup.claim('self','a'), true);
});
