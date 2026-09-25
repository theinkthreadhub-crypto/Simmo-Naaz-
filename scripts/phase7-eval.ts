import { speechProvider } from '../src/lib/speech/speechProvider';
import { evaluateSpeakingAttempt } from '../src/lib/speech/voiceCoach';
import { classifyActionRisk, evaluateActionPermission } from '../src/lib/safety/riskEngine';
import { createAutonomousPlan, executePlanStep } from '../src/lib/planner/planEngine';
import { createMission } from '../src/lib/missions/missionEngine';
import { browserAgent } from '../src/lib/agents/browserAgent';
import { computerAgent } from '../src/lib/agents/computerAgent';

async function runPhase7Evaluation() {
  console.log('====================================================');
  console.log('   MENTRA PHASE 7 EVALUATION: VOICE, MISSIONS & OS   ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 6;

  // Test 1: Speech Metric Analyzer & Filler Word Detection
  try {
    console.log('[TEST 1/6] Speech Metric & Articulation Evaluation...');
    const sampleTranscript = 'Good morning team. Um today we are basically launching our new product line, you know, with high efficiency.';
    const duration = 15; // seconds

    const metrics = speechProvider.analyzeAudio(sampleTranscript, duration);

    if (metrics.wordCount === 0 || metrics.speakingRateWpm === 0) {
      throw new Error('Failed to compute valid word count or speaking rate');
    }

    if (metrics.fillerWordsCount !== 3) { // 'um', 'basically', 'you know'
      throw new Error(`Expected 3 filler words, found ${metrics.fillerWordsCount} (${metrics.fillerWordsList.join(', ')})`);
    }

    if (metrics.clarityScore <= 0 || metrics.clarityScore > 100) {
      throw new Error(`Clarity score out of bounds: ${metrics.clarityScore}`);
    }

    console.log(`  -> PASS: Analyzed ${metrics.wordCount} words at ${metrics.speakingRateWpm} WPM with ${metrics.fillerWordsCount} fillers. Score: ${metrics.clarityScore}/100.\n`);
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL (Test 1):', err.message);
  }

  // Test 2: Deterministic Action Risk Engine & Autonomy Gating
  try {
    console.log('[TEST 2/6] Deterministic Action Risk Engine & Autonomy Matrix...');

    // Destructive and Financial must ALWAYS require approval
    const deleteCheck = evaluateActionPermission('TRUSTED_INTERNAL', 'delete_database_record');
    if (deleteCheck.riskLevel !== 'DESTRUCTIVE' || !deleteCheck.requiresApproval) {
      throw new Error('Destructive action did not require approval');
    }

    const payCheck = evaluateActionPermission('TRUSTED_INTERNAL', 'execute_payment');
    if (payCheck.riskLevel !== 'FINANCIAL' || !payCheck.requiresApproval) {
      throw new Error('Financial action did not require approval');
    }

    // Read only queries should run autonomously in ASSISTED mode
    const searchCheck = evaluateActionPermission('ASSISTED', 'live_web_research');
    if (searchCheck.requiresApproval) {
      throw new Error('Read-only research was blocked in assisted mode');
    }

    console.log('  -> PASS: Risk classification and autonomy boundary checks verified.\n');
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL (Test 2):', err.message);
  }

  // Test 3: Autonomous DAG Task Graph Plan Decomposition
  try {
    console.log('[TEST 3/6] Autonomous Task Graph & Plan Decomposition...');
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const goal = 'Launch next week InkThread summer drop';

    const plan = await createAutonomousPlan(testUserId, goal, 'ASSISTED');

    if (!plan.steps || plan.steps.length < 4) {
      throw new Error(`Plan generated fewer steps than required: ${plan.steps?.length}`);
    }

    // Verify dependencies are properly wired
    const synthesisStep = plan.steps.find((s) => s.stepType === 'ANALYZE');
    if (!synthesisStep || synthesisStep.dependencies.length === 0) {
      throw new Error('DAG dependency wiring missing on synthesis step');
    }

    console.log(`  -> PASS: Plan successfully decomposed into ${plan.steps.length} dependency-wired steps.\n`);
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL (Test 3):', err.message);
  }

  // Test 4: Sovereign Mission Creation & Milestone Schema
  try {
    console.log('[TEST 4/6] Sovereign Mission Campaign Architecture...');
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const mission = await createMission(testUserId, 'Summer Drop 2026', 'Execute 7-day multi-channel collection drop', 7);

    if (mission.milestones.length !== 4) {
      throw new Error(`Expected 4 milestones, found ${mission.milestones.length}`);
    }

    if (mission.totalXp <= 0) {
      throw new Error('Mission total XP calculation invalid');
    }

    console.log(`  -> PASS: Mission initialized with ${mission.milestones.length} milestones and ${mission.totalXp} XP reward.\n`);
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL (Test 4):', err.message);
  }

  // Test 5: Controlled Browser Agent Provider Safety
  try {
    console.log('[TEST 5/6] Browser Agent Safety & Controlled Execution Checks...');
    const isConfigured = browserAgent.isConfigured();

    const navRes = await browserAgent.navigate('https://example.com');
    if (!isConfigured && navRes.success) {
      throw new Error('Browser agent claimed success when provider is unconfigured');
    }

    const clickRes = await browserAgent.click('https://example.com', '#submit-btn');
    if (clickRes.requiresApproval === undefined) {
      throw new Error('Browser click action bypassed permission evaluation');
    }

    console.log('  -> PASS: Browser agent enforced provider check and approval boundaries.\n');
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL (Test 5):', err.message);
  }

  // Test 6: Controlled Computer Agent Provider Safety
  try {
    console.log('[TEST 6/6] Computer Agent Safety & Provider Safety...');
    const isConfigured = computerAgent.isConfigured();

    const openRes = await computerAgent.openApp('Terminal');
    if (!isConfigured && openRes.success) {
      throw new Error('Computer agent claimed success when provider is unconfigured');
    }

    console.log('  -> PASS: Computer agent safely handled unconfigured environment state.\n');
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

runPhase7Evaluation();
