import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createServer } from 'node:http';
import { NextRequest } from 'next/server';
import { POST as pendingWorkerHandler } from '../src/app/api/worker/whatsapp/pending/route';
import { encryptToken, decryptToken } from '../src/lib/integrations/crypto';
import { encryptToken as encryptEnvelope, decryptToken as decryptEnvelope } from '../src/lib/auth/tokenEncryption';
import { createGoogleOAuthState, validateGoogleOAuthState } from '../src/lib/integrations/google/oauthState';
import { verifyBrainWorkerSecret, verifyBrainWorkerSignature, verifyBrainWorkerToken } from '../src/lib/worker/auth';

test('Production rejects missing encryption keys in both token formats', () => {
  const previous = { ...process.env };
  try {
    Object.assign(process.env, { NODE_ENV: 'production' });
    delete process.env.TOKEN_ENCRYPTION_KEY; delete process.env.ENCRYPTION_SECRET;
    assert.throws(() => encryptToken('token'), /TOKEN_ENCRYPTION_KEY_REQUIRED/);
    assert.throws(() => encryptEnvelope('token'), /TOKEN_ENCRYPTION_KEY_REQUIRED/);
  } finally { process.env = previous; }
});
test('Access and refresh tokens survive separate envelopes and access rotation', () => {
  const previous = { ...process.env };
  try {
    process.env.TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
    const access = encryptToken('access');
    const refresh = encryptToken('refresh');
    assert.equal(decryptToken(access), 'access');
    assert.equal(decryptToken(refresh), 'refresh');
    assert.throws(() => decryptToken({ ...access, ciphertext: refresh.ciphertext }));
    assert.equal(decryptToken(encryptToken('new-access')), 'new-access');
    assert.equal(decryptToken(refresh), 'refresh');
    assert.equal(decryptEnvelope(encryptEnvelope('secret')), 'secret');
  } finally { process.env = previous; }
});
test('OAuth rejects mismatched cookies, another user and expired state', () => {
  const state = createGoogleOAuthState('owner');
  assert.equal(validateGoogleOAuthState(state, state, 'owner'), true);
  assert.equal(validateGoogleOAuthState(state, undefined, 'owner'), false);
  assert.equal(validateGoogleOAuthState(state, createGoogleOAuthState('owner'), 'owner'), false);
  assert.equal(validateGoogleOAuthState(state, state, 'other'), false);
  const expired = Buffer.from(JSON.stringify({ userId: 'owner', timestamp: Date.now() - 601000, nonce: 'x'.repeat(43) })).toString('base64url');
  assert.equal(validateGoogleOAuthState(expired, expired, 'owner'), false);
});
test('Worker credentials fail closed and token rotation retires old tokens', () => {
  const previous = { ...process.env };
  try {
    delete process.env.BRAIN_WORKER_SECRET; delete process.env.BRAIN_WORKER_TOKEN_HASH;
    assert.equal(verifyBrainWorkerSecret('mentra-brain-cluster-2026'), false);
    assert.equal(verifyBrainWorkerToken('anything'), false);
    process.env.BRAIN_WORKER_SECRET = 'configured-test-secret-long-random-value-for-testing';
    assert.equal(verifyBrainWorkerSecret('configured-test-secret-long-random-value-for-testing'), true);
    process.env.BRAIN_WORKER_TOKEN_HASH = crypto.createHash('sha256').update('new-token').digest('hex');
    assert.equal(verifyBrainWorkerToken('new-token'), true);
    assert.equal(verifyBrainWorkerToken('old-token'), false);
  } finally { process.env = previous; }
});
test('Worker signatures validate payload integrity and freshness', () => {
  const previous = { ...process.env };
  try {
    const keys = crypto.generateKeyPairSync('ed25519');
    process.env.BRAIN_WORKER_PUBLIC_KEY = keys.publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const timestamp = String(Date.now()); const body = '{"userId":"owner"}';
    const signature = crypto.sign(null, Buffer.from(`${timestamp}.${body}`), keys.privateKey).toString('base64');
    assert.equal(verifyBrainWorkerSignature(timestamp, signature, body), true);
    assert.equal(verifyBrainWorkerSignature(timestamp, signature, '{}'), false);
    assert.equal(verifyBrainWorkerSignature(String(Date.now() - 600000), signature, body), false);
  } finally { process.env = previous; }
});

test('Pending-session POST verifies the actual signed body before database access', async () => {
  const previous = { ...process.env };
  let databaseRequests = 0;
  const database = createServer((_req, res) => {
    databaseRequests++;
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('[]');
  });
  await new Promise<void>(resolve => database.listen(0, '127.0.0.1', resolve));
  try {
    const address = database.address() as { port: number };
    process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${address.port}`;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    delete process.env.BRAIN_WORKER_SECRET;
    const keys = crypto.generateKeyPairSync('ed25519');
    process.env.BRAIN_WORKER_PUBLIC_KEY = keys.publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const body = JSON.stringify({ userId: 'owner' }); const timestamp = String(Date.now());
    const headers = {
      'Content-Type': 'application/json',
      'x-mentra-worker-timestamp': timestamp,
      'x-mentra-worker-signature': crypto.sign(null, Buffer.from(`${timestamp}.${body}`), keys.privateKey).toString('base64')
    };
    const invalid = await pendingWorkerHandler(new NextRequest('http://localhost/api/worker/whatsapp/pending', { method: 'POST', headers, body: '{}' }));
    assert.equal(invalid.status, 401); assert.equal(databaseRequests, 0);
    const valid = await pendingWorkerHandler(new NextRequest('http://localhost/api/worker/whatsapp/pending', { method: 'POST', headers, body }));
    assert.equal(valid.status, 200); assert.equal(databaseRequests, 1);
  } finally {
    process.env = previous;
    await new Promise<void>((resolve, reject) => database.close(error => error ? reject(error) : resolve()));
  }
});
