export type CapabilityStatus = 'CODE_READY' | 'CONFIG_REQUIRED' | 'CONNECTED' | 'DEGRADED' | 'DISABLED';

export interface ServiceCapability {
  name: string;
  category: 'CORE' | 'AI' | 'INTEGRATION' | 'VOICE' | 'AUTOMATION';
  status: CapabilityStatus;
  requiredEnv: string[];
  missingEnv: string[];
  description: string;
}

export interface EnvironmentAudit {
  isValidCore: boolean;
  environment: 'development' | 'production' | 'test';
  capabilities: Record<string, ServiceCapability>;
  summary: {
    total: number;
    readyOrConnected: number;
    configRequired: number;
  };
}

/**
 * Validates environment variables and evaluates capability readiness without leaking secrets.
 */
export function auditEnvironment(): EnvironmentAudit {
  const env = process.env;
  const isProd = env.NODE_ENV === 'production';

  const check = (keys: string[]): { ready: boolean; missing: string[] } => {
    const missing = keys.filter(k => !env[k] || env[k]?.includes('placeholder') || env[k]?.includes('your-'));
    return { ready: missing.length === 0, missing };
  };

  const aiProvider = (env.AI_PROVIDER || 'fallback').toLowerCase();
  const gatewayAuthReady = Boolean(env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN);
  const geminiAuthReady = Boolean(env.AI_API_KEY || env.AI_PROVIDER_API_KEY);
  const localAiReady = Boolean(env.AI_LOCAL_BASE_URL);

  let aiRequiredEnv: string[] = [];
  let aiMissingEnv: string[] = [];
  let aiStatus: CapabilityStatus = 'DEGRADED';
  let aiDescription = 'Deterministic fallback is active; full model reasoning is not enabled.';

  if (['gateway', 'vercel', 'vercel-ai-gateway'].includes(aiProvider)) {
    aiRequiredEnv = ['AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN'];
    aiMissingEnv = gatewayAuthReady ? [] : ['AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN'];
    aiStatus = gatewayAuthReady ? 'CONNECTED' : 'CONFIG_REQUIRED';
    aiDescription = 'Vercel AI Gateway reasoning and tool-calling runtime.';
  } else if (['gemini', 'google'].includes(aiProvider)) {
    aiRequiredEnv = ['AI_API_KEY'];
    aiMissingEnv = geminiAuthReady ? [] : ['AI_API_KEY'];
    aiStatus = geminiAuthReady ? 'CONNECTED' : 'CONFIG_REQUIRED';
    aiDescription = 'Gemini reasoning and tool-calling runtime.';
  } else if (['ollama', 'local'].includes(aiProvider)) {
    aiRequiredEnv = ['AI_LOCAL_BASE_URL'];
    aiMissingEnv = localAiReady ? [] : ['AI_LOCAL_BASE_URL'];
    aiStatus = localAiReady ? 'CONNECTED' : 'CONFIG_REQUIRED';
    aiDescription = 'Local/private model reasoning runtime.';
  } else if (['auto', 'hybrid'].includes(aiProvider)) {
    const anyModelReady = gatewayAuthReady || geminiAuthReady || localAiReady;
    aiRequiredEnv = ['AI_GATEWAY_API_KEY/VERCEL_OIDC_TOKEN, AI_API_KEY, or AI_LOCAL_BASE_URL'];
    aiMissingEnv = anyModelReady ? [] : ['at least one model provider'];
    aiStatus = anyModelReady ? 'CONNECTED' : 'CONFIG_REQUIRED';
    aiDescription = 'Resilient multi-provider AI routing.';
  }

  const capabilities: Record<string, ServiceCapability> = {
    supabase_auth: {
      name: 'Supabase Authentication & DB',
      category: 'CORE',
      requiredEnv: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
      missingEnv: check(['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']).missing,
      status: check(['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']).ready ? 'CONNECTED' : 'CONFIG_REQUIRED',
      description: 'PostgreSQL persistence, user accounts, and RLS data isolation.'
    },
    ai_core: {
      name: 'AI Agent Core',
      category: 'AI',
      requiredEnv: aiRequiredEnv,
      missingEnv: aiMissingEnv,
      status: aiStatus,
      description: aiDescription
    },
    google_workspace: {
      name: 'Google Workspace Integration',
      category: 'INTEGRATION',
      requiredEnv: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
      missingEnv: check(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']).missing,
      status: check(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']).ready ? 'CONNECTED' : 'CONFIG_REQUIRED',
      description: 'Gmail, Google Calendar, Drive, and Sheets read/draft operations.'
    },
    whatsapp_cloud: {
      name: 'WhatsApp Cloud API',
      category: 'INTEGRATION',
      requiredEnv: ['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN'],
      missingEnv: check(['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN']).missing,
      status: check(['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN']).ready ? 'CONNECTED' : 'CONFIG_REQUIRED',
      description: 'Two-way WhatsApp messaging, reminders, and voice transcription.'
    },
    voice_speech: {
      name: 'Sovereign Speech Engine',
      category: 'VOICE',
      requiredEnv: ['SPEECH_API_KEY'],
      missingEnv: check(['SPEECH_API_KEY']).missing,
      status: check(['SPEECH_API_KEY']).ready ? 'CONNECTED' : 'CONFIG_REQUIRED',
      description: 'Real-time STT transcription, TTS synthesis, and Public Speaking voice analysis.'
    },
    live_research: {
      name: 'Live Web Research',
      category: 'AUTOMATION',
      requiredEnv: ['RESEARCH_API_KEY'],
      missingEnv: check(['RESEARCH_API_KEY']).missing,
      status: check(['RESEARCH_API_KEY']).ready ? 'CONNECTED' : 'CONFIG_REQUIRED',
      description: 'Real-time web synthesis via search providers (Tavily/SerpAPI).'
    },
    browser_computer: {
      name: 'Browser & Computer Automation',
      category: 'AUTOMATION',
      requiredEnv: ['BROWSER_API_KEY'],
      missingEnv: check(['BROWSER_API_KEY']).missing,
      status: check(['BROWSER_API_KEY']).ready ? 'CONNECTED' : 'CONFIG_REQUIRED',
      description: 'Controlled browser action execution with snapshot verification.'
    }
  };

  const total = Object.keys(capabilities).length;
  const readyOrConnected = Object.values(capabilities).filter(c => c.status === 'CONNECTED' || c.status === 'CODE_READY').length;
  const configRequired = total - readyOrConnected;

  return {
    isValidCore: capabilities.supabase_auth.status !== 'CONFIG_REQUIRED' || !isProd,
    environment: (env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    capabilities,
    summary: {
      total,
      readyOrConnected,
      configRequired
    }
  };
}
