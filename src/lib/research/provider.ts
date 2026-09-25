import { ResearchProvider, ResearchSource } from './types';

/**
 * SSRF and URL validation: Ensures that research only queries public HTTP/HTTPS endpoints.
 * Blocks localhost, private RFC1918 subnets, cloud metadata IPs, and unsafe protocols.
 */
export function validatePublicResearchUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    const host = url.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host === '169.254.169.254' || // Cloud metadata endpoint
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('172.16.') ||
      host.startsWith('172.17.') ||
      host.startsWith('172.18.') ||
      host.startsWith('172.19.') ||
      host.startsWith('172.20.') ||
      host.startsWith('172.21.') ||
      host.startsWith('172.22.') ||
      host.startsWith('172.23.') ||
      host.startsWith('172.24.') ||
      host.startsWith('172.25.') ||
      host.startsWith('172.26.') ||
      host.startsWith('172.27.') ||
      host.startsWith('172.28.') ||
      host.startsWith('172.29.') ||
      host.startsWith('172.30.') ||
      host.startsWith('172.31.')
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export class TavilySearchProvider implements ResearchProvider {
  name = 'tavily';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, maxResults: number = 5): Promise<ResearchSource[]> {
    if (!this.apiKey) {
      return [];
    }

    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: this.apiKey,
        query,
        search_depth: 'advanced',
        include_answer: false,
        max_results: maxResults
      })
    });

    if (!res.ok) {
      throw new Error(`Tavily search failed with status ${res.status}`);
    }

    const data = await res.json();
    const results: ResearchSource[] = [];

    for (const r of data.results || []) {
      if (r.url && validatePublicResearchUrl(r.url)) {
        results.push({
          title: r.title || 'Source',
          url: r.url,
          domain: new URL(r.url).hostname.replace('www.', ''),
          snippet: r.content || '',
          publishedDate: r.published_date,
          score: r.score
        });
      }
    }

    return results;
  }
}

export class LiveWebSearchProvider implements ResearchProvider {
  name = 'live_web';

  async search(query: string, maxResults: number = 5): Promise<ResearchSource[]> {
    try {
      // Use DuckDuckGo HTML endpoint
      const endpoint = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const res = await fetch(endpoint, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!res.ok) {
        // Return empty array truthfully when provider fails. Never synthesize fake articles.
        return [];
      }

      const html = await res.text();
      const results: ResearchSource[] = [];

      // Parse DuckDuckGo search result links and snippets
      const resultRegex = /<a class="result__url" href="([^"]+)">([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      while ((match = resultRegex.exec(html)) !== null && results.length < maxResults) {
        let rawUrl = match[1];
        if (rawUrl.startsWith('//duckduckgo.com/l/?uddg=')) {
          const urlParams = new URLSearchParams(rawUrl.split('?')[1]);
          rawUrl = decodeURIComponent(urlParams.get('uddg') || rawUrl);
        }

        const snippet = match[3].replace(/<[^>]*>?/gm, '').trim();
        let domain = 'web';
        try { domain = new URL(rawUrl).hostname.replace('www.', ''); } catch {}

        if (snippet && rawUrl.startsWith('http') && validatePublicResearchUrl(rawUrl)) {
          results.push({
            title: match[2].replace(/<[^>]*>?/gm, '').trim() || domain,
            url: rawUrl,
            domain,
            snippet
          });
        }
      }

      return results;
    } catch {
      // Never fabricate sources on network failure
      return [];
    }
  }
}

export function getResearchProvider(): ResearchProvider {
  const tavilyKey = process.env.TAVILY_API_KEY || process.env.RESEARCH_API_KEY;
  if (tavilyKey) {
    return new TavilySearchProvider(tavilyKey);
  }
  return new LiveWebSearchProvider();
}
