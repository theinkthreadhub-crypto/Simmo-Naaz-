export interface PublicRuntimeConfig {
  supabaseReady: boolean;
  missing: string[];
}

export function getPublicRuntimeConfig(): PublicRuntimeConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const missing: string[] = [];

  if (!url || url.includes('placeholder') || url.includes('your-')) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!key || key.includes('placeholder') || key.includes('your-')) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return {
    supabaseReady: missing.length === 0,
    missing
  };
}
