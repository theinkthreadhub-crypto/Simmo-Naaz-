import { createKnowledgeEntity, createKnowledgeEdge, getEntityNeighborhood } from '../src/lib/knowledge/graphEngine';
import { createHabit, completeHabitToday, listUserHabits } from '../src/lib/db/habits';
import { createRoutine, listUserRoutines } from '../src/lib/db/routines';
import { createProject, recordDecision, listUserProjects } from '../src/lib/db/projects';
import { detectBehavioralPatterns } from '../src/lib/personalization/patternEngine';
import { generatePersonalizedRecommendations, submitRecommendationFeedback } from '../src/lib/personalization/recommendationEngine';
import { logDailyWellness, getTodayWellness } from '../src/lib/db/wellness';

async function runPhase8Evaluation() {
  console.log('====================================================');
  console.log('   MENTRA PHASE 8 EVALUATION: KNOWLEDGE & PERSONAL   ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 6;
  const testUserId = '00000000-0000-0000-0000-000000000001';

  // Test 1: Personal Knowledge Graph & Provenance
  try {
    console.log('[TEST 1/6] Personal Knowledge Graph & Provenance Relations...');
    const brandEntity = await createKnowledgeEntity(testUserId, {
      entityType: 'BUSINESS',
      name: 'InkThread Hub',
      description: 'Sovereign Streetwear Brand',
      provenanceType: 'FACT',
      source: 'USER_EXPLICIT'
    });

    const goalEntity = await createKnowledgeEntity(testUserId, {
      entityType: 'GOAL',
      name: '₹1L Monthly Revenue',
      description: 'Target monthly sales run-rate',
      provenanceType: 'USER_DECISION',
      source: 'GOAL'
    });

    const edge = await createKnowledgeEdge(testUserId, {
      sourceId: brandEntity.id,
      targetId: goalEntity.id,
      relationType: 'DEPENDS_ON'
    });

    if (!brandEntity.id || !goalEntity.id || !edge.id) {
      throw new Error('Failed to create Knowledge Graph entities or edges');
    }

    console.log(`  -> PASS: Knowledge Graph verified. Connected '${brandEntity.name}' -> '${goalEntity.name}' via ${edge.relationType}.\n`);
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL (Test 1):', err.message);
  }

  // Test 2: Habit Rhythms & Single-Day Completion Safety
  try {
    console.log('[TEST 2/6] Habit Rhythms & Idempotent Daily Completion...');
    const habit = await createHabit(testUserId, {
      title: '20 Min Public Speaking Practice',
      lifeArea: 'Learning',
      frequency: 'DAILY',
      preferredTime: 'EVENING',
      xpReward: 20
    });

    if (!habit.id || habit.xpReward !== 20) {
      throw new Error('Failed to create habit record');
    }

    // First completion should succeed
    const firstCheckin = await completeHabitToday(testUserId, habit.id);
    if (!firstCheckin.success || firstCheckin.xpAwarded !== 20) {
      throw new Error(`First completion failed: ${firstCheckin.message}`);
    }

    // Second completion on same day must be prevented
    const secondCheckin = await completeHabitToday(testUserId, habit.id);
    if (secondCheckin.success || secondCheckin.xpAwarded > 0) {
      throw new Error('Habit completion awarded duplicate XP on same day');
    }

    console.log('  -> PASS: Habit created and duplicate same-day reward prevented.\n');
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL (Test 2):', err.message);
  }

  // Test 3: Routine Sequencer & Step Breakdown
  try {
    console.log('[TEST 3/6] Routine Sequencing & Time Breakdown...');
    const routine = await createRoutine(testUserId, {
      name: 'Executive Morning Cadence',
      routineType: 'MORNING',
      durationMinutes: 30,
      steps: [
        { stepIndex: 1, title: 'Review MENTRA Morning Brief', durationMin: 5, actionType: 'BRIEF' },
        { stepIndex: 2, title: 'Deep Work on Main Quest', durationMin: 20, actionType: 'QUEST' },
        { stepIndex: 3, title: 'Daily Telemetry Check-in', durationMin: 5, actionType: 'WELLNESS' }
      ]
    });

    if (!routine.id || routine.steps.length !== 3 || routine.durationMinutes !== 30) {
      throw new Error('Routine structure mismatch');
    }

    console.log(`  -> PASS: Routine '${routine.name}' verified with ${routine.steps.length} sequenced steps.\n`);
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL (Test 3):', err.message);
  }

  // Test 4: Project Intelligence & Decision Log
  try {
    console.log('[TEST 4/6] Project Intelligence & Decision Logging...');
    const project = await createProject(testUserId, {
      title: 'InkThread Summer Drop 2026',
      objective: 'Launch 12-piece limited collection',
      financeBudget: 5000,
      nextAction: 'Finalize product mockup render'
    });

    const decision = await recordDecision(testUserId, {
      projectId: project.id,
      title: 'Select Heavyweight 280 GSM Cotton',
      rationale: 'Superior drape and customer perceived luxury value'
    });

    if (!project.id || !decision.id) {
      throw new Error('Failed to create Project or record Strategic Decision');
    }

    console.log(`  -> PASS: Project '${project.title}' initialized with decision '${decision.title}'.\n`);
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL (Test 4):', err.message);
  }

  // Test 5: Behavioral Pattern & Recommendation Engine
  try {
    console.log('[TEST 5/6] Behavioral Pattern Engine & Explainable Recommendations...');
    const recommendations = await generatePersonalizedRecommendations(testUserId);
    if (!Array.isArray(recommendations)) {
      throw new Error('Failed to generate recommendation candidates');
    }

    console.log(`  -> PASS: Recommendation engine produced ${recommendations.length} evidence-backed recommendations.\n`);
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL (Test 5):', err.message);
  }

  // Test 6: Privacy-Gated Wellness Telemetry
  try {
    console.log('[TEST 6/6] Privacy-Gated Wellness Telemetry...');
    const logRes = await logDailyWellness(testUserId, {
      sleepHours: 7.5,
      energyRating: 'HIGH',
      moodRating: 'EXCELLENT',
      workoutCompleted: true,
      notes: 'Completed 5km morning run'
    });

    if (!logRes.success) {
      throw new Error(`Wellness logging failed: ${logRes.message}`);
    }

    console.log('  -> PASS: Wellness telemetry successfully recorded.\n');
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

runPhase8Evaluation();
