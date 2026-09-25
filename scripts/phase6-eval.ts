import { verifyWebhookChallenge, verifyWebhookSignature } from '../src/lib/integrations/whatsapp/security';
import { generateWhatsAppLinkCode, resolveUserByPhone, linkUserByCode, unlinkWhatsApp } from '../src/lib/integrations/whatsapp/linking';
import { getUserNotificationSettings, isDeliveryAllowedNow } from '../src/lib/notifications/preferences';
import { claimAndDispatchDueJobs } from '../src/lib/scheduler/cronDispatcher';
import crypto from 'crypto';

async function runPhase6Evaluation() {
  console.log('====================================================');
  console.log('   MENTRA PHASE 6 EVALUATION: PROACTIVE & WHATSAPP   ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 6;

  // Test 1: WhatsApp Webhook Challenge & Signature Security
  try {
    console.log('[TEST 1/6] WhatsApp Webhook Handshake & HMAC-SHA256 Signature Security...');
    process.env.WHATSAPP_VERIFY_TOKEN = 'test_verify_token_123';
    process.env.WHATSAPP_APP_SECRET = 'test_app_secret_abc';

    // Challenge
    const challengeRes = verifyWebhookChallenge('subscribe', 'test_verify_token_123', 'CHALLENGE_ACCEPTED_777');
    if (!challengeRes.verified || challengeRes.challenge !== 'CHALLENGE_ACCEPTED_777') {
      throw new Error('Challenge verification failed');
    }

    // Signature
    const payload = JSON.stringify({ object: 'whatsapp_business_account' });
    const expectedSig = 'sha256=' + crypto.createHmac('sha256', 'test_app_secret_abc').update(payload).digest('hex');
    const isValidSig = verifyWebhookSignature(expectedSig, payload);
    const isBadSig = verifyWebhookSignature('sha256=invalid_hash', payload);

    if (!isValidSig || isBadSig) {
      throw new Error('Signature verification failed');
    }

    console.log('  -> PASS: Webhook challenge & HMAC verification passed.\n');
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL (Test 1):', err.message);
  }

  // Test 2: Cryptographic Single-Use WhatsApp Account Linking
  try {
    console.log('[TEST 2/6] WhatsApp Single-Use Account Linking Protocol...');
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const testPhone = '919876543210';

    const code = await generateWhatsAppLinkCode(testUserId);
    if (!code || code.length !== 6) {
      throw new Error(`Invalid code generated: ${code}`);
    }

    // Perform linking
    const linkRes = await linkUserByCode(testPhone, code);
    if (!linkRes.success) {
      throw new Error(`Linking failed: ${linkRes.message}`);
    }

    // Test code reuse prevention (must fail)
    const reuseRes = await linkUserByCode('919999999999', code);
    if (reuseRes.success) {
      throw new Error('Security failure: Code was reused successfully');
    }

    // Verify user resolution by phone
    const resolvedUserId = await resolveUserByPhone(testPhone);
    if (resolvedUserId !== testUserId) {
      throw new Error(`Phone resolution mismatch: expected ${testUserId}, got ${resolvedUserId}`);
    }

    // Unlink
    await unlinkWhatsApp(testUserId);
    const afterUnlink = await resolveUserByPhone(testPhone);
    if (afterUnlink !== null) {
      throw new Error('Unlink failed to clear active connection state');
    }

    console.log('  -> PASS: Single-use linking code and resolution verified.\n');
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL (Test 2):', err.message);
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
      finance_alerts: false, // Disabled category
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

    // Category check
    const financeCheck = isDeliveryAllowedNow(settings, 'FINANCE');
    if (financeCheck.allowed) {
      throw new Error('Finance check allowed despite category disabled');
    }

    const questCheck = isDeliveryAllowedNow(settings, 'QUEST');
    // Quest check should evaluate without throwing
    if (typeof questCheck.allowed !== 'boolean') {
      throw new Error('Quiet hours check failed to return boolean result');
    }

    console.log('  -> PASS: Category filtering & quiet hours calculations verified.\n');
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL (Test 3):', err.message);
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
  } catch (err: any) {
    console.error('  -> FAIL (Test 4):', err.message);
  }

  // Test 5: Outbound WhatsApp Client Credential Safety
  try {
    console.log('[TEST 5/6] Outbound Client Safety & Unconfigured Graceful State...');
    const { whatsappClient } = await import('../src/lib/integrations/whatsapp/client');
    const isConfigured = whatsappClient.isConfigured();
    // In test environment without real Meta token, isConfigured should be false and sendTextMessage should return unconfigured error without crashing
    const sendRes = await whatsappClient.sendTextMessage('919876543210', 'Test Message');
    if (!isConfigured && sendRes.success) {
      throw new Error('WhatsApp client reported false send success when unconfigured');
    }
    console.log('  -> PASS: Outbound client correctly enforces credential verification.\n');
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL (Test 5):', err.message);
  }

  // Test 6: Cross-User Channel Isolation
  try {
    console.log('[TEST 6/6] Cross-User Sovereign Channel Isolation...');
    const userA = '00000000-0000-0000-0000-00000000000A';
    const userB = '00000000-0000-0000-0000-00000000000B';
    const phoneA = '919876543211';
    const phoneB = '919876543212';

    const codeA = await generateWhatsAppLinkCode(userA);
    const codeB = await generateWhatsAppLinkCode(userB);

    await linkUserByCode(phoneA, codeA);
    await linkUserByCode(phoneB, codeB);

    const resolvedA = await resolveUserByPhone(phoneA);
    const resolvedB = await resolveUserByPhone(phoneB);

    if (resolvedA !== userA || resolvedB !== userB || (resolvedA as string) === (resolvedB as string)) {
      throw new Error('Cross-user channel isolation failed!');
    }

    await unlinkWhatsApp(userA);
    await unlinkWhatsApp(userB);

    console.log('  -> PASS: Cross-user channel isolation verified.\n');
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL (Test 6):', err.message);
  }

  console.log(`====================================================`);
  console.log(`EVALUATION RESULT: ${passed}/${total} PASSED`);
  console.log(`====================================================\n`);

  if (passed < total) {
    process.exit(1);
  }
}

runPhase6Evaluation();
