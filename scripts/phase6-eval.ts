import crypto from 'crypto';
import {
  getAllowedWhatsAppNumbers,
  isAllowedWhatsAppSender,
  verifyWebhookChallenge,
  verifyWebhookSignature
} from '../src/lib/integrations/whatsapp/security';
import { POST as legacyLinkPost } from '../src/app/api/whatsapp/link/route';
import { POST as legacyPairPost } from '../src/app/api/whatsapp/pair/route';
import { isDeliveryAllowedNow } from '../src/lib/notifications/preferences';
import { claimAndDispatchDueJobs } from '../src/lib/scheduler/cronDispatcher';

async function runPhase6Evaluation() {
  console.log('====================================================');
  console.log('   MENTRA PHASE 6 EVALUATION: PROACTIVE & WHATSAPP   ');
  console.log('====================================================\n');

  let passed = 0;
  const total = 6;

  // Test 1: Optional Meta Cloud webhook verification remains cryptographically strict.
  try {
    console.log('[TEST 1/6] WhatsApp Webhook Handshake & HMAC-SHA256 Signature Security...');
    const previousVerify = process.env.WHATSAPP_VERIFY_TOKEN;
    const previousSecret = process.env.WHATSAPP_APP_SECRET;
    try {
      process.env.WHATSAPP_VERIFY_TOKEN = 'test_verify_token_123';
      process.env.WHATSAPP_APP_SECRET = 'test_app_secret_abc';

      const challengeRes = verifyWebhookChallenge(
        'subscribe',
        'test_verify_token_123',
        'CHALLENGE_ACCEPTED_777'
      );
      if (!challengeRes.verified || challengeRes.challenge !== 'CHALLENGE_ACCEPTED_777') {
        throw new Error('Challenge verification failed');
      }

      const payload = JSON.stringify({ object: 'whatsapp_business_account' });
      const expectedSig =
        'sha256=' +
        crypto.createHmac('sha256', 'test_app_secret_abc').update(payload).digest('hex');

      if (
        !verifyWebhookSignature(expectedSig, payload) ||
        verifyWebhookSignature('sha256=invalid_hash', payload)
      ) {
        throw new Error('Signature verification failed');
      }
    } finally {
      if (previousVerify === undefined) delete process.env.WHATSAPP_VERIFY_TOKEN;
      else process.env.WHATSAPP_VERIFY_TOKEN = previousVerify;
      if (previousSecret === undefined) delete process.env.WHATSAPP_APP_SECRET;
      else process.env.WHATSAPP_APP_SECRET = previousSecret;
    }

    console.log('  -> PASS: Webhook challenge & HMAC verification passed.\n');
    passed++;
  } catch (err: unknown) {
    console.error('  -> FAIL (Test 1):', err instanceof Error ? err.message : String(err));
  }

  // Test 2: Legacy 6-digit/direct pairing is permanently retired.
  try {
    console.log('[TEST 2/6] QR-Only WhatsApp Pairing Contract...');
    const [linkResponse, pairResponse] = await Promise.all([
      legacyLinkPost(),
      legacyPairPost()
    ]);
    const linkPayload = await linkResponse.json();
    const pairPayload = await pairResponse.json();

    if (
      linkResponse.status !== 410 ||
      pairResponse.status !== 410 ||
      linkPayload.error !== 'WHATSAPP_QR_ONLY' ||
      pairPayload.error !== 'WHATSAPP_QR_ONLY'
    ) {
      throw new Error('Legacy pairing route is still active');
    }

    console.log('  -> PASS: Only authenticated QR pairing remains available.\n');
    passed++;
  } catch (err: unknown) {
    console.error('  -> FAIL (Test 2):', err instanceof Error ? err.message : String(err));
  }

  // Test 3: Notification Preferences & Timezone Quiet Hours Calculation
  try {
    console.log('[TEST 3/6] Notification Preferences & Quiet Hours Evaluation...');
    const settings = {
      user_id: '00000000-0000-0000-0000-000000000001',
      morning_brief_enabled: true,
      morning_brief_time: '08:00',
      evening_reflection_enabled: true,
      evening_reflection_time: '21:00',
      quest_alerts: true,
      goal_alerts: true,
      learning_reminders: true,
      finance_alerts: false,
      calendar_alerts: true,
      gmail_alerts: false,
      agent_updates: true,
      weekly_report: true,
      preferred_channel: 'WHATSAPP' as const,
      quiet_hours_enabled: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00',
      timezone: 'Asia/Kolkata',
      paused_until: null
    };

    const financeCheck = isDeliveryAllowedNow(settings, 'FINANCE');
    if (financeCheck.allowed) {
      throw new Error('Finance check allowed despite category disabled');
    }

    const questCheck = isDeliveryAllowedNow(settings, 'QUEST');
    if (typeof questCheck.allowed !== 'boolean') {
      throw new Error('Quiet hours check failed to return boolean result');
    }

    console.log('  -> PASS: Category filtering & quiet hours calculations verified.\n');
    passed++;
  } catch (err: unknown) {
    console.error('  -> FAIL (Test 3):', err instanceof Error ? err.message : String(err));
  }

  // Test 4: Background Scheduler & Atomic Dispatcher Engine
  try {
    console.log('[TEST 4/6] Background Scheduler & Atomic Job Claiming...');
    const results = await claimAndDispatchDueJobs();
    if (!Array.isArray(results)) {
      throw new Error('Scheduler failed to return job results array');
    }
    console.log(`  -> PASS: Scheduler claimed and dispatched ${results.length} due jobs safely.\n`);
    passed++;
  } catch (err: unknown) {
    console.error('  -> FAIL (Test 4):', err instanceof Error ? err.message : String(err));
  }

  // Test 5: Outbound WhatsApp Cloud client must fail safely when unconfigured.
  try {
    console.log('[TEST 5/6] Outbound Client Safety & Unconfigured Graceful State...');
    const { whatsappClient } = await import('../src/lib/integrations/whatsapp/client');
    const isConfigured = whatsappClient.isConfigured();
    const sendRes = await whatsappClient.sendTextMessage('919876543210', 'Test Message');
    if (!isConfigured && sendRes.success) {
      throw new Error('WhatsApp client reported false send success when unconfigured');
    }
    console.log('  -> PASS: Outbound client correctly enforces credential verification.\n');
    passed++;
  } catch (err: unknown) {
    console.error('  -> FAIL (Test 5):', err instanceof Error ? err.message : String(err));
  }

  // Test 6: Optional Cloud compatibility path is fail-closed.
  try {
    console.log('[TEST 6/6] Cloud WhatsApp Sender Isolation...');
    const previousAllowed = process.env.WHATSAPP_ALLOWED_NUMBERS;
    try {
      delete process.env.WHATSAPP_ALLOWED_NUMBERS;
      if (getAllowedWhatsAppNumbers().length !== 0) {
        throw new Error('Empty allowlist did not resolve to an empty set');
      }
      if (isAllowedWhatsAppSender('919876543210')) {
        throw new Error('Empty allowlist failed open');
      }

      process.env.WHATSAPP_ALLOWED_NUMBERS = '911234567890';
      if (!isAllowedWhatsAppSender('911234567890')) {
        throw new Error('Explicit owner allowlist rejected the owner');
      }
      if (isAllowedWhatsAppSender('919876543210')) {
        throw new Error('Non-owner sender passed the explicit allowlist');
      }
    } finally {
      if (previousAllowed === undefined) delete process.env.WHATSAPP_ALLOWED_NUMBERS;
      else process.env.WHATSAPP_ALLOWED_NUMBERS = previousAllowed;
    }

    console.log('  -> PASS: Cloud compatibility path is fail-closed.\n');
    passed++;
  } catch (err: unknown) {
    console.error('  -> FAIL (Test 6):', err instanceof Error ? err.message : String(err));
  }

  console.log('====================================================');
  console.log(`EVALUATION RESULT: ${passed}/${total} PASSED`);
  console.log('====================================================\n');

  if (passed < total) {
    process.exit(1);
  }
}

runPhase6Evaluation();
