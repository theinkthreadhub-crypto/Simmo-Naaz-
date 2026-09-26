import { create } from 'zustand';
import {
  PlayerProfile,
  StatKey,
  Quest,
  Goal,
  SkillNode,
  FinanceSummary,
  FinanceTransaction,
  JournalEntry,
  MemoryItem,
  MentraAgent,
  IntegrationConnection,
  MentraNotification
} from '@/types/mentra';
import { getUserQuests } from '@/lib/db/quests';
import { getUserGoals } from '@/lib/db/goals';
import { getUserSkills } from '@/lib/db/skills';
import { getUserFinance } from '@/lib/db/finance';
import { getUserJournal } from '@/lib/db/journal';
import { getUserMemories } from '@/lib/db/memories';
import { getUserIntegrations } from '@/lib/db/integrations';
import { getProfile, getPlayerProgress, getPlayerStats } from '@/lib/db/profiles';

interface MentraState {
  player: PlayerProfile;
  quests: Quest[];
  goals: Goal[];
  skills: SkillNode[];
  finance: FinanceSummary;
  journalEntries: JournalEntry[];
  memories: MemoryItem[];
  agents: MentraAgent[];
  integrations: IntegrationConnection[];
  notifications: MentraNotification[];
  systemBooted: boolean;
  activeCommandResponse: string | null;

  bootSystem: () => void;
  completeQuest: (questId: string) => void;
  addXp: (amount: number, statCategory?: StatKey) => void;
  addTransaction: (tx: Omit<FinanceTransaction, 'id' | 'date'>) => void;
  addMemory: (item: Omit<MemoryItem, 'id' | 'createdAt'>) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'date' | 'extractedMemoryIds'>) => void;
  updateAgentStatus: (agentId: string, status: MentraAgent['status'], currentTask?: string) => void;
  approveAgentTask: (agentId: string) => void;
  toggleIntegration: (id: string) => void;
  executeCommand: (query: string) => { success: boolean; message: string };
  clearCommandResponse: () => void;
  syncUserDatabase: (userId: string) => Promise<void>;
  resetToNewUser: (name: string, userId: string) => void;
}

const emptyFinance = (): FinanceSummary => ({
  monthlyIncome: 0,
  monthlyExpenses: 0,
  monthlySavings: 0,
  budgetRemaining: 0,
  businessExpenseRatio: 0,
  aiInsight: 'No verified financial data yet.',
  transactions: []
});

const newPlayer = (name = 'Operator', userId = ''): PlayerProfile => ({
  id: userId,
  name,
  codename: userId ? `MENTRA-${name.slice(0, 3).toUpperCase()}-01` : 'MENTRA-OPR-01',
  title: 'Operator',
  level: 1,
  currentXp: 0,
  nextLevelXp: 1000,
  streakDays: 0,
  totalQuestsCompleted: 0,
  rank: 'NOVICE',
  stats: {
    focus: 0,
    discipline: 0,
    knowledge: 0,
    business: 0,
    finance: 0,
    communication: 0,
    fitness: 0
  }
});

function rankForLevel(level: number): PlayerProfile['rank'] {
  if (level >= 25) return 'SOVEREIGN';
  if (level >= 15) return 'ARCHITECT';
  if (level >= 10) return 'TACTICIAN';
  if (level >= 5) return 'OPERATOR';
  if (level >= 2) return 'APPRENTICE';
  return 'NOVICE';
}

export const useMentraStore = create<MentraState>((set, get) => ({
  player: newPlayer(),
  quests: [],
  goals: [],
  skills: [],
  finance: emptyFinance(),
  journalEntries: [],
  memories: [],
  agents: [],
  integrations: [],
  notifications: [],
  systemBooted: false,
  activeCommandResponse: null,

  bootSystem: () => set({ systemBooted: true }),

  // Cache-only helpers. Server APIs remain the source of truth.
  completeQuest: (questId: string) => {
    set(state => ({
      quests: state.quests.map(quest =>
        quest.id === questId
          ? { ...quest, status: 'COMPLETED', progressPercent: 100 }
          : quest
      )
    }));
  },

  addXp: (amount: number, statCategory?: StatKey) => {
    set(state => {
      const stats = { ...state.player.stats };
      if (statCategory) stats[statCategory] = Math.max(0, stats[statCategory] + 1);
      return {
        player: {
          ...state.player,
          currentXp: Math.max(0, state.player.currentXp + amount),
          stats
        }
      };
    });
  },

  addTransaction: (tx) => {
    const transaction: FinanceTransaction = {
      ...tx,
      id: `cache_tx_${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    set(state => ({
      finance: {
        ...state.finance,
        transactions: [transaction, ...state.finance.transactions]
      }
    }));
  },

  addMemory: (item) => {
    const memory: MemoryItem = {
      ...item,
      id: `cache_mem_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    set(state => ({ memories: [memory, ...state.memories] }));
  },

  addJournalEntry: (entry) => {
    const journal: JournalEntry = {
      ...entry,
      id: `cache_journal_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      extractedMemoryIds: []
    };
    set(state => ({ journalEntries: [journal, ...state.journalEntries] }));
  },

  updateAgentStatus: (agentId, status, currentTask) => {
    set(state => ({
      agents: state.agents.map(agent =>
        agent.id === agentId ? { ...agent, status, currentTask } : agent
      )
    }));
  },

  approveAgentTask: () => {
    set({
      activeCommandResponse:
        'Agent approvals are executed only through the verified Approval Center.'
    });
  },

  toggleIntegration: () => {
    set({
      activeCommandResponse:
        'Integration state is controlled by the real connection flow, not local UI state.'
    });
  },

  executeCommand: () => {
    const message =
      'Use the MENTRA chat endpoint for AI commands. Local simulated command execution is disabled.';
    set({ activeCommandResponse: message });
    return { success: false, message };
  },

  clearCommandResponse: () => set({ activeCommandResponse: null }),

  syncUserDatabase: async (userId: string) => {
    try {
      const [
        profile,
        progress,
        stats,
        quests,
        goals,
        skills,
        finance,
        journalEntries,
        memories,
        integrations
      ] = await Promise.all([
        getProfile(userId),
        getPlayerProgress(userId),
        getPlayerStats(userId),
        getUserQuests(userId),
        getUserGoals(userId),
        getUserSkills(userId),
        getUserFinance(userId),
        getUserJournal(userId),
        getUserMemories(userId),
        getUserIntegrations(userId)
      ]);

      const level = progress?.level || 1;
      const name = profile?.display_name || 'Operator';
      const player: PlayerProfile = {
        id: userId,
        name,
        codename: `MENTRA-${name.slice(0, 3).toUpperCase()}-01`,
        title: level >= 5 ? 'Operator' : 'Initiate Operator',
        level,
        currentXp: progress?.current_xp || 0,
        nextLevelXp: level * 1000,
        streakDays: progress?.current_streak || 0,
        totalQuestsCompleted: progress?.quests_completed || 0,
        rank: rankForLevel(level),
        stats: stats || newPlayer(name, userId).stats
      };

      set({
        player,
        quests,
        goals,
        skills,
        finance,
        journalEntries,
        memories,
        integrations,
        // Agent cards are populated by verified agent-run APIs, never seeded locally.
        agents: [],
        notifications: []
      });
    } catch (error) {
      console.error('[MENTRA STORE] Database sync failed:', error);
      set({
        activeCommandResponse:
          'Could not refresh verified MENTRA data. Existing cached data was left unchanged.'
      });
    }
  },

  resetToNewUser: (name: string, userId: string) => {
    set({
      player: newPlayer(name, userId),
      quests: [],
      goals: [],
      skills: [],
      finance: emptyFinance(),
      journalEntries: [],
      memories: [],
      agents: [],
      integrations: [],
      notifications: [],
      activeCommandResponse: null
    });
  }
}));
