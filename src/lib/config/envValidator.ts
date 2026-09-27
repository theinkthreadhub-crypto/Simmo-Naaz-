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

  const aiProvider = (env.AI_PROVIDER || 'auto').toLowerCase();
  const gatewayAuthReady = Boolean(env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN);
  const geminiAuthReady = Boolean(env.AI_API_KEY || env.AI_PROVIDER_API_KEY);
  const localAiReady = Boolean(env.AI_LOCAL_BASE_URL);

  let aiRequiredEnv: string[] = [];
  let aiMissingEnv: string[] = [];
  let aiStatus: CapabilityStatus = 'DEGRADED';
  let aiDescription = 'No real model provider is connected.';

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
    aiMissingEnv = anyModelReady ? [] : ['at least one real model provider'];
    aiStatus = anyModelReady ? 'CONNECTED' : 'CONFIG_REQUIRED';
    aiDescription = anyModelReady
      ? 'Real multi-provider AI routing is available.'
      : 'Real AI is not configured; production must not silently simulate reasoning.';
  } else if (['fallback', 'deterministic'].includes(aiProvider)) {
    const allowed =
      env.AI_ALLOW_DETERMINISTIC_FALLBACK === 'true' || !isProd;
    aiRequiredEnv = [];
    aiMissingEnv = allowed ? [] : ['real model provider required in production'];
    aiStatus = allowed ? 'DEGRADED' : 'CONFIG_REQUIRED';
    aiDescription = allowed
      ? 'Deterministic fallback is explicitly enabled; this is not full model reasoning.'
      : 'Deterministic fallback is disabled in production.';
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
    google_workspace: (() => {
      const required = [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'SUPABASE_SERVICE_ROLE_KEY',
        'TOKEN_ENCRYPTION_KEY'
      ];
      const state = check(required);
      const disabled = env.GOOGLE_ENABLED === 'false';

      return {
        name: 'Google Workspace Integration',
        category: 'INTEGRATION' as const,
        requiredEnv: required,
        missingEnv: state.missing,
        status: disabled
          ? 'DISABLED' as const
          : state.ready
            ? 'CODE_READY' as const
            : 'CONFIG_REQUIRED' as const,
        description: disabled
          ? 'Google Workspace integration is disabled by configuration.'
          : state.ready
            ? 'OAuth, encrypted token storage, Gmail, Calendar, Drive, Sheets, and Contacts are code-ready; per-user connection is verified separately.'
            : 'Google Workspace requires OAuth credentials plus server-only token encryption/storage configuration.'
      };
    })(),
    whatsapp_cloud: (() => {
      const required = [
        'WHATSAPP_PHONE_NUMBER_ID',
        'WHATSAPP_ACCESS_TOKEN',
        'WHATSAPP_VERIFY_TOKEN',
        'WHATSAPP_APP_SECRET',
        'WHATSAPP_BUSINESS_DISPLAY_NUMBER',
        'WHATSAPP_ALLOWED_NUMBERS'
      ];
      const state = check(required);
      const disabled = env.WHATSAPP_ENABLED === 'false';

      return {
        name: 'WhatsApp Cloud API',
        category: 'INTEGRATION' as const,
        requiredEnv: required,
        missingEnv: state.missing,
        status: disabled
          ? 'DISABLED' as const
          : state.ready
            ? 'CODE_READY' as const
            : 'CONFIG_REQUIRED' as const,
        description: disabled
          ? 'Official Meta WhatsApp Cloud API is disabled by configuration.'
          : state.ready
            ? 'Official Cloud API webhook and outbound transport are server-ready; per-user phone linking is verified separately.'
            : 'Official Cloud API requires Meta phone, access token, webhook verify token, app secret, business display number, and an explicit owner allowlist.'
      };
    })(),
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
      requiredEnv: [],
      missingEnv: [],
      status: env.TAVILY_API_KEY || env.RESEARCH_API_KEY ? 'CONNECTED' : 'CODE_READY',
      description: env.TAVILY_API_KEY || env.RESEARCH_API_KEY
        ? 'Dedicated Tavily live-search provider with source-preserving synthesis.'
        : 'Public-web search fallback is code-ready; Tavily is optional for higher reliability.'
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
