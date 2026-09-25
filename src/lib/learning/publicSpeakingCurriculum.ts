import { 
  SkillModule, 
  SkillLesson, 
  SkillExercise, 
  BossMission, 
  SkillNode 
} from '@/types/mentra';

export const PUBLIC_SPEAKING_SKILL_ID = 'skill_public_speaking';

export const PUBLIC_SPEAKING_TREE_NODES: SkillNode[] = [
  {
    id: 'ps_node_01',
    name: 'Confidence & Breath Control',
    category: 'COMMUNICATION',
    level: 1,
    maxLevel: 10,
    currentXp: 180,
    nextLevelXp: 300,
    unlocked: true,
    status: 'ACTIVE',
    prerequisites: [],
    description: 'Diaphragmatic breathing, posture grounding, and eliminating stage nervousness before speaking.',
    practiceQuests: ['60-Second Box Breathing Drill', 'Posture Anchor & Voice Warmup'],
    roadmap: ['Physiological Sigh', 'Shoulder Grounding', 'Micro-Nervousness Reframing']
  },
  {
    id: 'ps_node_02',
    name: 'Pace, Pauses & Filler Reduction',
    category: 'COMMUNICATION',
    level: 1,
    maxLevel: 10,
    currentXp: 90,
    nextLevelXp: 300,
    unlocked: true,
    status: 'ACTIVE',
    prerequisites: ['ps_node_01'],
    description: 'Replacing "umm", "like", "actually" with 2-second deliberate pauses at 130-150 WPM cadence.',
    practiceQuests: ['30-Second Zero-Filler Intro', '2-Second Strategic Pause Exercise'],
    roadmap: ['Filler Word Awareness', 'Deliberate Silence Practice', 'Rhythm Modulation']
  },
  {
    id: 'ps_node_03',
    name: 'PREP Speech Structure',
    category: 'COMMUNICATION',
    level: 1,
    maxLevel: 10,
    currentXp: 0,
    nextLevelXp: 300,
    unlocked: true,
    status: 'ACTIVE',
    prerequisites: ['ps_node_02'],
    description: 'Point → Reason → Example → Point. The executive structure for instantly clear answers and impromptu speeches.',
    practiceQuests: ['Answer impromptu question using PREP', '2-Minute structured pitch'],
    roadmap: ['PREP Framework Basics', 'Example Story Insertion', 'Crisp Conclusion Landings']
  },
  {
    id: 'ps_node_04',
    name: 'Storytelling & Emotional Hook',
    category: 'COMMUNICATION',
    level: 0,
    maxLevel: 10,
    currentXp: 0,
    nextLevelXp: 300,
    unlocked: false,
    status: 'LOCKED',
    prerequisites: ['ps_node_03'],
    description: 'Hooking attention in the first 7 seconds, building dramatic tension, and landing memorable lessons.',
    practiceQuests: ['Narrate personal failure & lesson in 90 seconds', 'Hook-first opening exercise'],
    roadmap: ['The 7-Second Rule', 'Conflict Escalation', 'The Takeaway Punchline']
  },
  {
    id: 'ps_node_05',
    name: 'Audience Engagement & Stage Command',
    category: 'COMMUNICATION',
    level: 0,
    maxLevel: 10,
    currentXp: 0,
    nextLevelXp: 300,
    unlocked: false,
    status: 'LOCKED',
    prerequisites: ['ps_node_04'],
    description: 'Eye contact triangles, rhetorical questions, voice projection, and commanding large rooms.',
    practiceQuests: ['Deliver presentation to 3+ people', 'Handle 2 tough live audience questions'],
    roadmap: ['Eye Contact Triangulation', 'Rhetorical Pacing', 'Q&A Defense Protocols']
  }
];

export interface CurriculumExercise {
  id?: string;
  title: string;
  prompt: string;
  exercise_type: 'SPEAKING_OR_TEXT' | 'AUDIO_RECORD' | 'TEXT_PRACTICE' | 'TIMED_CHALLENGE' | 'REAL_WORLD';
  duration_seconds: number;
  xp_reward: number;
  skill_xp_reward: number;
}

export interface CurriculumLesson {
  id?: string;
  title: string;
  concept_summary: string;
  demonstration_example: string;
  framework_steps: string[];
  order_index: number;
  xp_reward: number;
  skill_xp_reward: number;
  completed: boolean;
  exercises: CurriculumExercise[];
}

export interface CurriculumModule {
  id?: string;
  title: string;
  description: string;
  order_index: number;
  required_level: number;
  estimated_duration: string;
  completed: boolean;
  lessons: CurriculumLesson[];
}

export const PUBLIC_SPEAKING_CURRICULUM: {
  modules: CurriculumModule[];
  bossMission: Omit<BossMission, 'id' | 'user_id'>;
} = {
  modules: [
    {
      title: 'Module 1: Baseline Diagnostic & Nervousness Reset',
      description: 'Establish your speaking baseline and master somatic breathing techniques.',
      order_index: 1,
      required_level: 1,
      estimated_duration: '2 Days',
      completed: false,
      lessons: [
        {
          title: 'Lesson 1.1: The 60-Second Baseline Diagnostic',
          concept_summary: 'Speaking is a physical and psychological feedback loop. Before improving, we capture an honest baseline recording.',
          demonstration_example: 'Speak about who you are, what you are building, and why it matters without editing or over-preparing.',
          framework_steps: ['Stand upright', 'Take 1 deep belly breath', 'Start timer for 60 seconds', 'Speak naturally without stopping'],
          order_index: 1,
          xp_reward: 50,
          skill_xp_reward: 35,
          completed: false,
          exercises: [
            {
              title: 'Baseline Assessment: 60-Second Self Introduction',
              prompt: 'Record or present a 60-second introduction about yourself, your current mission, and your primary goal.',
              exercise_type: 'AUDIO_RECORD',
              duration_seconds: 60,
              xp_reward: 60,
              skill_xp_reward: 40
            }
          ]
        },
        {
          title: 'Lesson 1.2: Physiological Reset & Eliminating Tremor',
          concept_summary: 'Nervousness is adrenal energy. Instead of suppressing it, double inhale through the nose and long exhale to reset heart rate.',
          demonstration_example: 'Inhale deep -> quick top-up inhale -> slow 6-second exhale -> speak on empty reserve.',
          framework_steps: ['Two quick inhales through nose', 'Slow exhale through mouth', 'Ground feet shoulder-width', 'Project from abdomen'],
          order_index: 2,
          xp_reward: 40,
          skill_xp_reward: 25,
          completed: false,
          exercises: [
            {
              title: 'Somatic Breath Drill & 30-Sec Sustained Tone',
              prompt: 'Perform 3 cycles of physiological sighs, then deliver a clear 30-second opening statement with relaxed abdominal support.',
              exercise_type: 'SPEAKING_OR_TEXT',
              duration_seconds: 30,
              xp_reward: 45,
              skill_xp_reward: 30
            }
          ]
        }
      ]
    },
    {
      title: 'Module 2: Eliminating Filler Words & Strategic Pausing',
      description: 'Transform filler sounds (um, ah, matlab, actually) into powerful executive silence.',
      order_index: 2,
      required_level: 2,
      estimated_duration: '3 Days',
      completed: false,
      lessons: [
        {
          title: 'Lesson 2.1: The 2-Second Silence Principle',
          concept_summary: 'Audiences perceive silence as confidence and intellect. When searching for a word, close your lips and pause for 2 seconds instead of making a sound.',
          demonstration_example: 'Instead of: "We launched the product and umm... the revenue was... like 50k", speak: "We launched the product. [2-sec pause] Revenue hit 50k."',
          framework_steps: ['Notice the urge to say um/like', 'Close lips immediately', 'Count 1-2 silently', 'Deliver next sentence'],
          order_index: 1,
          xp_reward: 45,
          skill_xp_reward: 30,
          completed: false,
          exercises: [
            {
              title: 'Zero-Filler Drill: 45-Second Explanation',
              prompt: 'Explain how your favorite software or tool works for 45 seconds without using any filler words.',
              exercise_type: 'TIMED_CHALLENGE',
              duration_seconds: 45,
              xp_reward: 50,
              skill_xp_reward: 35
            }
          ]
        }
      ]
    },
    {
      title: 'Module 3: The PREP Framework for Instant Clarity',
      description: 'Master Point → Reason → Example → Point for meetings, interviews, and presentations.',
      order_index: 3,
      required_level: 3,
      estimated_duration: '3 Days',
      completed: false,
      lessons: [
        {
          title: 'Lesson 3.1: Structuring Any Response in 4 Steps',
          concept_summary: 'P = Main claim. R = Why it is true. E = Concrete proof/story. P = Summary reiteration.',
          demonstration_example: 'Point: Cold email is our highest ROI channel. Reason: It targets decision-makers directly with zero ad waste. Example: Last week, 50 personalized emails generated 4 demo calls. Point: Therefore, we must double our outbound capacity this quarter.',
          framework_steps: ['1. State Point in 1 sentence', '2. Give Reason (Because...)', '3. Give Specific Example (For instance...)', '4. Re-state Point (In summary...)'],
          order_index: 1,
          xp_reward: 60,
          skill_xp_reward: 45,
          completed: false,
          exercises: [
            {
              title: 'Impromptu PREP Challenge',
              prompt: 'Pick a random question: "Should founders focus on product or marketing first?" and answer using strict PREP structure in 90 seconds.',
              exercise_type: 'SPEAKING_OR_TEXT',
              duration_seconds: 90,
              xp_reward: 70,
              skill_xp_reward: 50
            }
          ]
        }
      ]
    }
  ],
  bossMission: {
    skill_id: PUBLIC_SPEAKING_SKILL_ID,
    title: 'BOSS MISSION: Deliver Your First Live 5-Minute Presentation',
    description: 'A major real-world challenge testing breath control, zero-filler pacing, and PREP structure before a live audience.',
    reward_xp: 500,
    reward_skill_xp: 200,
    status: 'ACTIVE',
    objectives: [
      {
        id: 'bo_01',
        boss_mission_id: 'bm_ps_01',
        user_id: '',
        title: 'Draft a 5-minute presentation script using PREP framework',
        is_mandatory: true,
        completed: false
      },
      {
        id: 'bo_02',
        boss_mission_id: 'bm_ps_01',
        user_id: '',
        title: 'Record 3 full practice runs with under 5 total filler words',
        is_mandatory: true,
        completed: false
      },
      {
        id: 'bo_03',
        boss_mission_id: 'bm_ps_01',
        user_id: '',
        title: 'Present live to at least 2 real people or an online group',
        is_mandatory: true,
        completed: false
      },
      {
        id: 'bo_04',
        boss_mission_id: 'bm_ps_01',
        user_id: '',
        title: 'Submit post-presentation reflection log into MENTRA memory',
        is_mandatory: true,
        completed: false
      }
    ]
  }
};
