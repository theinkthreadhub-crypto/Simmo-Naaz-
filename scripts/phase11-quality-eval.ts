/**
 * MENTRA PHASE 11: FEEDBACK INTELLIGENCE, CORRECTIONS & QUALITY EVALUATION SUITE
 */

import { submitUserFeedback, getFeedbackSummary } from '../src/lib/feedback/feedbackEngine';
import { applyUserCorrection, getActiveCorrections } from '../src/lib/feedback/correctionEngine';
import { getActivePrompt, getPromptByVersion } from '../src/lib/ai/prompts/registry';
import { evaluateGoldenCases } from '../src/lib/evals/goldenEvaluator';
import { recordAgentMetric, getAgentQualityMetrics, reportSystemIssue, getDetectedSystemIssues } from '../src/lib/evals/agentQuality';

async function runPhase11Evaluation() {
  console.log('====================================================');
  console.log('  MENTRA PHASE 11 EVALUATION: QUALITY & LEARNING   ');
  console.log('====================================================\n');

  let passed = 0;
  const total = 6;

  // TEST 1: User Feedback Submission & Aggregation
  try {
    console.log('[TEST 1/6] User Feedback Submission & Metric Aggregation...');
    const testUser = `usr_eval_fb_${Date.now()}`;
    await submitUserFeedback(testUser, {
      feature: 'MENTRA_CHAT',
      rating: 'HELPFUL',
      reason: 'Precise financial categorization'
    });

    await submitUserFeedback(testUser, {
      feature: 'RECOMMENDATION',
      rating: 'BAD_TIMING',
      reason: 'Busy during morning work block'
    });

    const summary = await getFeedbackSummary(testUser);
    if (summary.totalCount !== 2 || summary.helpfulCount !== 1 || summary.negativeCount !== 1) {
      throw new Error(`Feedback summary mismatch: ${JSON.stringify(summary)}`);
    }

    console.log('  -> PASS: Feedback recorded and aggregated accurately.');
    passed++;
  } catch (err: unknown) {
    console.error(`  -> FAIL (Test 1): ${err instanceof Error ? err.message : String(err)}`);
  }

  // TEST 2: User Correction Engine & Context Resolution
  try {
    console.log('\n[TEST 2/6] User Correction Engine & Active Context Resolution...');
    const testUser = `usr_eval_cor_${Date.now()}`;
    const result = await applyUserCorrection(testUser, {
      correctionType: 'WRONG_PRIORITY',
      targetEntityType: 'GOAL',
      oldValue: 'Grow Instagram to 10k',
      newValue: 'Scale Direct Website Sales (₹1L Revenue)'
    });

    if (!result.success || result.correction.newValue !== 'Scale Direct Website Sales (₹1L Revenue)') {
      throw new Error('Correction application failed');
    }

    const activeList = await getActiveCorrections(testUser);
    if (activeList.length === 0 || activeList[0].newValue !== 'Scale Direct Website Sales (₹1L Revenue)') {
      throw new Error('Active corrections list did not reflect applied correction');
    }

    console.log('  -> PASS: User correction applied and active context updated.');
    passed++;
  } catch (err: unknown) {
    console.error(`  -> FAIL (Test 2): ${err instanceof Error ? err.message : String(err)}`);
  }

  // TEST 3: Centralized Versioned Prompt Registry
  try {
    console.log('\n[TEST 3/6] Centralized Versioned Prompt Registry...');
    const activePrompt = getActivePrompt('MENTRA_CORE');
    if (activePrompt.version !== 'v1.1.0' || !activePrompt.isActive) {
      throw new Error(`Active prompt version unexpected: ${activePrompt.version}`);
    }

    const legacyPrompt = getPromptByVersion('MENTRA_CORE', 'v1.0.0');
    if (!legacyPrompt || legacyPrompt.version !== 'v1.0.0') {
      throw new Error('Legacy prompt version lookup failed');
    }

    const rendered = activePrompt.template('Operator primary goal: Website Sales');
    if (!rendered.includes('MENTRA ONLINE') || !rendered.includes('Operator primary goal: Website Sales')) {
      throw new Error('Rendered prompt missing context wrapper');
    }

    console.log('  -> PASS: Prompt versioning, active selection, and template rendering verified.');
    passed++;
  } catch (err: unknown) {
    console.error(`  -> FAIL (Test 3): ${err instanceof Error ? err.message : String(err)}`);
  }

  // TEST 4: Golden Test Case Regression Evaluation
  try {
    console.log('\n[TEST 4/6] Golden Test Case Regression Evaluation...');
    const evals = await evaluateGoldenCases();
    if (evals.passedCount !== evals.totalCases) {
      throw new Error(`Golden test regression failures: ${evals.failedCount} failed`);
    }

    console.log(`  -> PASS: All ${evals.totalCases} golden test cases passed.`);
    passed++;
  } catch (err: unknown) {
    console.error(`  -> FAIL (Test 4): ${err instanceof Error ? err.message : String(err)}`);
  }

  // TEST 5: Agent Quality & Performance Metrics Tracking
  try {
    console.log('\n[TEST 5/6] Agent Quality Metrics Tracking...');
    const agentName = 'ResearchAgent_Eval';
    recordAgentMetric(agentName, { success: true, durationMs: 1200, requiredApproval: false });
    recordAgentMetric(agentName, { success: true, durationMs: 800, requiredApproval: true });

    const metrics = getAgentQualityMetrics();
    const target = metrics.find(m => m.agentName === agentName);
    if (!target || target.totalRuns !== 2 || target.successfulRuns !== 2 || target.avgDurationMs !== 1000) {
      throw new Error(`Agent metrics mismatch: ${JSON.stringify(target)}`);
    }

    console.log('  -> PASS: Agent performance and duration telemetry aggregated correctly.');
    passed++;
  } catch (err: unknown) {
    console.error(`  -> FAIL (Test 5): ${err instanceof Error ? err.message : String(err)}`);
  }

  // TEST 6: Issue Detection & Clustering
  try {
    console.log('\n[TEST 6/6] Automatic Issue Clustering & Error Grouping...');
    reportSystemIssue('OAUTH_TOKEN_EXPIRED', 'GoogleCalendar', 'SEV2');
    reportSystemIssue('OAUTH_TOKEN_EXPIRED', 'GoogleCalendar', 'SEV2');

    const issues = getDetectedSystemIssues();
    const issue = issues.find(i => i.module === 'GoogleCalendar' && i.issueType === 'OAUTH_TOKEN_EXPIRED');
    if (!issue || issue.occurrenceCount !== 2) {
      throw new Error(`Issue clustering failed: ${JSON.stringify(issue)}`);
    }

    console.log(`  -> PASS: Technical issue clustered with occurrence count = ${issue.occurrenceCount}.`);
    passed++;
  } catch (err: unknown) {
    console.error(`  -> FAIL (Test 6): ${err instanceof Error ? err.message : String(err)}`);
  }

  console.log('\n====================================================');
  console.log(`EVALUATION RESULT: ${passed}/${total} PASSED`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runPhase11Evaluation().catch(err => {
  console.error('Unhandled Phase 11 evaluation failure:', err);
  process.exit(1);
});
