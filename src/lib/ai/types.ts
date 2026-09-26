import { z } from 'zod';

export type ChannelType = 'WEB' | 'WHATSAPP' | 'MOBILE' | 'API';

export type MentraRole = 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';

export type ToolPermissionLevel = 'READ' | 'WRITE_LOW' | 'APPROVAL_REQUIRED';

export type MentraIntent = 
  | 'CHAT'
  | 'DAILY_PLAN'
  | 'GET_PROGRESS'
  | 'CREATE_QUEST'
  | 'UPDATE_QUEST'
  | 'COMPLETE_QUEST'
  | 'CREATE_GOAL'
  | 'UPDATE_GOAL'
  | 'CREATE_SKILL'
  | 'START_LEARNING'
  | 'START_PRACTICE'
  | 'CREATE_JOURNAL'
  | 'CREATE_MEMORY'
  | 'SEARCH_MEMORY'
  | 'ADD_EXPENSE'
  | 'ADD_INCOME'
  | 'CHECK_FINANCE'
  | 'CREATE_REMINDER'
  | 'AGENT_TASK'
  | 'GOOGLE_ACTION'
  | 'UNKNOWN';

export interface MentraIncomingMessage {
  userId: string;
  channel: ChannelType;
  text: string;
  attachments?: Array<{
    type: 'IMAGE' | 'AUDIO' | 'DOCUMENT';
    url: string;
    mimeType?: string;
  }>;
  timestamp: string;
  externalMessageId?: string;
  conversationId?: string;
  pageContext?: string;
}

export type ActionCardType = 
  | 'QUEST_CREATED'
  | 'QUEST_COMPLETED'
  | 'EXPENSE_ADDED'
  | 'INCOME_ADDED'
  | 'GOAL_CREATED'
  | 'SKILL_STARTED'
  | 'PRACTICE_SCHEDULED'
  | 'JOURNAL_SAVED'
  | 'MEMORY_FOUND'
  | 'MEMORY_SAVED'
  | 'APPROVAL_REQUIRED'
  | 'AGENT_WORKING'
  | 'CONNECTION_REQUIRED'
  | 'LEVEL_UP_ALERT'
  | 'DAILY_PLAN';

export interface ActionCard {
  id: string;
  type: ActionCardType;
  title: string;
  subtitle?: string;
  data?: Record<string, any> | any;
  actionUrl?: string;
  actionLabel?: string;
  requiresApproval?: boolean;
  approvalId?: string;
}

export interface MentraMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: MentraRole;
  content: string;
  cards?: ActionCard[];
  intent?: MentraIntent;
  toolCalls?: Array<{
    name: string;
    input: Record<string, any>;
    output?: Record<string, any>;
    status: 'SUCCESS' | 'FAILED' | 'PENDING_APPROVAL';
  }>;
  createdAt: string;
}

export interface MentraConversation {
  id: string;
  userId: string;
  title: string;
  channel: ChannelType;
  createdAt: string;
  updatedAt: string;
}

// Tool System Types
export interface ToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  permission: ToolPermissionLevel;
  schema: z.ZodType<TInput>;
  execute: (input: TInput, context: ToolExecutionContext) => Promise<ToolResult<TOutput>>;
}

export interface ToolExecutionContext {
  userId: string;
  conversationId?: string;
  messageId?: string;
  idempotencyKey?: string;
  pageContext?: string;
}

export interface ToolResult<T = any> {
  ok: boolean;
  data?: T;
  card?: ActionCard;
  message?: string;
  errorCode?: string;
  requiresApproval?: boolean;
  approvalId?: string;
}

// AI Provider Abstraction Types
export interface ModelMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
  structuredSchema?: z.ZodType<any>;
}

export interface AIProviderResponse {
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
  }>;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface AIProvider {
  name: string;
  model?: string;
  generate(messages: ModelMessage[], options?: GenerateOptions): Promise<AIProviderResponse>;
  stream(
    messages: ModelMessage[],
    options: GenerateOptions,
    callbacks: {
      onToken: (token: string) => void;
      onStatus?: (status: string) => void;
    }
  ): Promise<AIProviderResponse>;
}
