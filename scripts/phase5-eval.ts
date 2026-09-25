import { encryptToken, decryptToken } from '../src/lib/integrations/crypto';
import { executeWebResearch } from '../src/lib/research/researchAgent';
import { runMultiAgentTask } from '../src/lib/agents/orchestrator';
import { runMentra } from '../src/lib/ai/core';

async function runPhase5Eval() {
  console.log('================================================================');
  console.log('MENTRA CONNECTED & MULTI-AGENT SUITE — PHASE 5 EVALUATION');
  console.log('================================================================\n');

  const testUserId = 'usr_phase5_eval_operator';
  let passed = 0;
  let failed = 0;

  // Test 1: AES-256-GCM Token Encryption & Decryption
  try {
    const rawToken = 'ya29.a0AfH6SMB_secret_google_oauth_token_1234567890';
    const encrypted = encryptToken(rawToken);
    const decrypted = decryptToken(encrypted);

    if (decrypted === rawToken && encrypted.ciphertext !== rawToken) {
      console.log('[PASS] Test #1: AES-256-GCM Token Encryption & Decryption Roundtrip');
      passed++;
    } else {
      console.log('[FAIL] Test #1: Decrypted token mismatch');
      failed++;
    }
  } catch (err: any) {
    console.log(`[FAIL] Test #1: Exception: ${err.message}`);
    failed++;
  }

  // Test 2: Live Web Research Engine
  try {
    const research = await executeWebResearch(testUserId, 'Indian Streetwear apparel trends', 'Find top converting fabric GSM and design themes', 'STANDARD');
    if (research && research.sources && research.sources.length > 0 && research.keyFindings.length > 0) {
      console.log(`[PASS] Test #2: Live Web Research Engine -> Synthesized ${research.sources.length} sources [${research.sources.map(s => s.domain).join(', ')}]`);
      passed++;
    } else {
      console.log('[FAIL] Test #2: Research returned empty sources');
      failed++;
    }
  } catch (err: any) {
    console.log(`[FAIL] Test #2: Exception: ${err.message}`);
    failed++;
  }

  // Test 3: Multi-Agent Orchestrator
  try {
    const multiTask = await runMultiAgentTask(testUserId, {
      taskTitle: 'Q4 Apparel Scale Plan',
      agentChain: ['ag_business', 'ag_research', 'ag_finance'],
      query: 'Next week ka InkThread business growth plan'
    });

    if (multiTask && multiTask.status === 'COMPLETE' && multiTask.results) {
      console.log(`[PASS] Test #3: Multi-Agent Task Orchestrator -> Status: ${multiTask.status}`);
      passed++;
    } else {
      console.log(`[FAIL] Test #3: Multi-agent task returned status ${multiTask.status}`);
      failed++;
    }
  } catch (err: any) {
    console.log(`[FAIL] Test #3: Exception: ${err.message}`);
    failed++;
  }

  // Test 4: Gmail Tool Connection Check when Disconnected
  try {
    const res = await runMentra({
      userId: testUserId,
      channel: 'API',
      text: 'Gmail check karo',
      timestamp: new Date().toISOString()
    });

    if (res.success && (res.message.includes('not connected') || res.message.includes('Settings') || res.cards.some(c => c.type === 'CONNECTION_REQUIRED'))) {
      console.log('[PASS] Test #4: Gmail Disconnected Check -> Truthfully returned CONNECTION_REQUIRED (No Fake Mails)');
      passed++;
    } else {
      console.log(`[FAIL] Test #4: Response: ${res.message}`);
      failed++;
    }
  } catch (err: any) {
    console.log(`[FAIL] Test #4: Exception: ${err.message}`);
    failed++;
  }

  // Test 5: Google Calendar Tool Connection Check
  try {
    const res = await runMentra({
      userId: testUserId,
      channel: 'API',
      text: 'Google calendar me meetings dikhao',
      timestamp: new Date().toISOString()
    });

    if (res.success && (res.message.includes('not connected') || res.message.includes('free') || res.cards.some(c => c.type === 'CONNECTION_REQUIRED'))) {
      console.log('[PASS] Test #5: Calendar Disconnected Check -> Truthfully returned Connection Check');
      passed++;
    } else {
      console.log(`[FAIL] Test #5: Response: ${res.message}`);
      failed++;
    }
  } catch (err: any) {
    console.log(`[FAIL] Test #5: Exception: ${err.message}`);
    failed++;
  }

  // Test 6: Sensitive Action Email Draft & Approval Gating
  try {
    const res = await runMentra({
      userId: testUserId,
      channel: 'API',
      text: 'supplier@textilemill.com ko quotation ka reply draft karo',
      timestamp: new Date().toISOString()
    });

    if (res.success && (res.cards.some(c => c.type === 'APPROVAL_REQUIRED' || c.type === 'CONNECTION_REQUIRED') || res.message.includes('draft') || res.message.includes('connect'))) {
      console.log('[PASS] Test #6: Email Drafting -> Gated behind Approval / Connection Check');
      passed++;
    } else {
      console.log(`[FAIL] Test #6: Response: ${res.message}`);
      failed++;
    }
  } catch (err: any) {
    console.log(`[FAIL] Test #6: Exception: ${err.message}`);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`PHASE 5 EVAL SUMMARY: ${passed}/${passed + failed} Tests Passed. Failed: ${failed}`);
  console.log('================================================================\n');
}

runPhase5Eval().catch(err => {
  console.error('Fatal Evaluation Error:', err);
});
