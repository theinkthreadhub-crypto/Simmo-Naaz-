import { ResearchProvider, ResearchSource } from './types';

const PRIVATE_IPV4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./
];

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/gi, '/')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function cleanHtml(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Public-web boundary used by the research layer.
 * Rejects credentials, localhost/private/link-local hosts and unsafe protocols.
 */
export function validatePublicResearchUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    if (url.username || url.password) return false;

    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host === '169.254.169.254' ||
      host.endsWith('.local') ||
      host.endsWith('.localhost') ||
      host.startsWith('fc') ||
      host.startsWith('fd') ||
      host.startsWith('fe80:')
    ) return false;

    if (/^\d+\.\d+\.\d+\.\d+$/.test(host) && PRIVATE_IPV4.some(rule => rule.test(host))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function normalizeDuckDuckGoUrl(raw: string): string | null {
  try {
    let decoded = decodeHtml(raw.trim());
    if (decoded.startsWith('//')) decoded = `https:${decoded}`;

    const url = new URL(decoded);
    if (url.hostname.endsWith('duckduckgo.com') && url.pathname.startsWith('/l/')) {
      const target = url.searchParams.get('uddg');
      if (!target) return null;
      decoded = decodeURIComponent(target);
    }

    return validatePublicResearchUrl(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

export class TavilySearchProvider implements ResearchProvider {
  name = 'tavily';
  constructor(private apiKey: string) {}

  async search(query: string, maxResults = 5): Promise<Omit<ResearchSource, 'id'>[]> {
    if (!this.apiKey) return [];

    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        api_key: this.apiKey,
        query,
        search_depth: 'advanced',
        include_answer: false,
        max_results: Math.min(Math.max(maxResults, 1), 10)
      })
    });

    if (!res.ok) throw new Error(`TAVILY_SEARCH_FAILED_${res.status}`);

    const data = await res.json();
    return (data.results || [])
      .filter((r: any) => r?.url && validatePublicResearchUrl(r.url))
      .map((r: any) => ({
        title: cleanHtml(r.title || 'Source'),
        url: r.url,
        domain: new URL(r.url).hostname.replace(/^www\./, ''),
        snippet: cleanHtml(r.content || '').slice(0, 1400),
        publishedDate: r.published_date || undefined,
        score: typeof r.score === 'number' ? r.score : undefined
      }));
  }
}

export class LiveWebSearchProvider implements ResearchProvider {
  name = 'duckduckgo_public_web';

  async search(query: string, maxResults = 5): Promise<Omit<ResearchSource, 'id'>[]> {
    const endpoint = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(endpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MENTRA-Research/1.0; +https://mentra.inkthreadhub.in)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(12_000)
    });

    if (!res.ok) throw new Error(`PUBLIC_SEARCH_FAILED_${res.status}`);
    const html = await res.text();
    const results: Omit<ResearchSource, 'id'>[] = [];

    const resultRegex = /<a[^>]*class=["'][^"']*result__a[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = resultRegex.exec(html)) !== null && results.length < maxResults) {
      const target = normalizeDuckDuckGoUrl(match[1]);
      if (!target) continue;

      const title = cleanHtml(match[2]);
      const snippet = cleanHtml(match[3]);
      if (!title || !snippet) continue;

      results.push({
        title,
        url: target,
        domain: new URL(target).hostname.replace(/^www\./, ''),
        snippet: snippet.slice(0, 1000)
      });
    }

    return results;
  }
}

export function getResearchProvider(): ResearchProvider {
  const tavilyKey = process.env.TAVILY_API_KEY || process.env.RESEARCH_API_KEY;
  return tavilyKey
    ? new TavilySearchProvider(tavilyKey)
    : new LiveWebSearchProvider();
}
