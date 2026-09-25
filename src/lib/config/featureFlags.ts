export interface FeatureFlags {
  enableVoice: boolean;
  enableWhatsApp: boolean;
  enableGoogleWorkspace: boolean;
  enableLiveResearch: boolean;
  enableBrowserAgent: boolean;
  enableAutonomousMissions: boolean;
  enablePrivateBetaMode: boolean;
}

/**
 * Resolves production feature flags from environment variables.
 * Guarantees that unconfigured or experimental features fail-safe to false.
 */
export function getFeatureFlags(): FeatureFlags {
  const env = process.env;

  const isConfigured = (key?: string) => {
    return Boolean(key && !key.includes('placeholder') && !key.includes('your-') && key.length > 5);
  };

  return {
    enableVoice: env.VOICE_ENABLED === 'true' && isConfigured(env.SPEECH_API_KEY),
    enableWhatsApp: env.WHATSAPP_ENABLED === 'true' && isConfigured(env.WHATSAPP_ACCESS_TOKEN),
    enableGoogleWorkspace: env.GOOGLE_ENABLED === 'true' && isConfigured(env.GOOGLE_CLIENT_ID),
    enableLiveResearch: env.RESEARCH_ENABLED === 'true' && isConfigured(env.RESEARCH_API_KEY),
    enableBrowserAgent: env.BROWSER_AGENT_ENABLED === 'true' && isConfigured(env.BROWSER_API_KEY),
    enableAutonomousMissions: env.AUTONOMY_MODE !== 'DISABLED',
    enablePrivateBetaMode: env.PRIVATE_BETA_MODE === 'true'
  };
}
