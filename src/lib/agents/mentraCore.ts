/**
 * MENTRA Core Agent Orchestrator
 * High-level coordinator that analyzes user intent and delegates tasks to specialized sub-agents.
 */

export interface AgentTaskRequest {
  query: string;
  context?: Record<string, any>;
}

export interface AgentTaskResponse {
  agentId: string;
  intent: 'FINANCE' | 'QUEST' | 'BRIEFING' | 'LEARNING' | 'MEMORY' | 'JOURNAL' | 'GENERAL';
  requiresApproval: boolean;
  actionPayload?: Record<string, any>;
  message: string;
}

export class MentraCoreAgent {
  static parseIntent(query: string): AgentTaskResponse {
    const clean = query.toLowerCase().trim();

    // 1. Finance intent
    if (clean.includes('expense') || clean.includes('income') || clean.includes('budget') || clean.includes('kharcha') || clean.includes('₹') || clean.includes('rs.')) {
      return {
        agentId: 'ag_finance',
        intent: 'FINANCE',
        requiresApproval: false,
        message: 'Dispatched to Finance Sentinel Agent for real-time ledger accounting.'
      };
    }

    // 2. Briefing / Quests
    if (clean.includes('aaj') || clean.includes('today') || clean.includes('quest') || clean.includes('task') || clean.includes('briefing')) {
      return {
        agentId: 'ag_business',
        intent: 'BRIEFING',
        requiresApproval: false,
        message: 'Synthesizing operator daily mission briefing...'
      };
    }

    // 3. Learning & Skill Progression
    if (clean.includes('learn') || clean.includes('seekhna') || clean.includes('course') || clean.includes('python')) {
      return {
        agentId: 'ag_learning',
        intent: 'LEARNING',
        requiresApproval: false,
        message: 'Accessing Learning Agent curriculum and skill milestones.'
      };
    }

    // 4. Memory Vault
    if (clean.includes('remember') || clean.includes('yaad') || clean.includes('vault') || clean.includes('memory')) {
      return {
        agentId: 'ag_memory',
        intent: 'MEMORY',
        requiresApproval: false,
        message: 'Querying vector memory vault for strategic anchors.'
      };
    }

    // 5. Executive / Destructive actions requiring Human-in-the-loop approval
    if (clean.includes('send email') || clean.includes('delete') || clean.includes('launch campaign') || clean.includes('bhejo')) {
      return {
        agentId: 'ag_business',
        intent: 'GENERAL',
        requiresApproval: true,
        message: 'Action prepared. Elevated execution requires human operator approval.'
      };
    }

    return {
      agentId: 'ag_research',
      intent: 'GENERAL',
      requiresApproval: false,
      message: 'Command processed. System telemetry updated.'
    };
  }
}
