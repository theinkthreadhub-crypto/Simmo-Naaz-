import { createClient } from '@/lib/supabase/server';
import { ActionRiskLevel } from '@/lib/safety/riskEngine';
import { validatePublicResearchUrl } from '@/lib/research/provider';

export type BrowserActionType =
  | 'NAVIGATE'
  | 'READ_PAGE'
  | 'CLICK'
  | 'TYPE'
  | 'SCREENSHOT'
  | 'SUBMIT';

export type BrowserExecutionStatus =
  | 'SUCCESS'
  | 'FAILED'
  | 'APPROVAL_REQUIRED'
  | 'BROWSER_PROVIDER_UNCONFIGURED'
  | 'SCREENSHOT_NOT_AVAILABLE'
  | 'BLOCKED_BY_SSRF_PROTECTION'
  | 'UNCERTAIN';

export interface BrowserActionResult {
  success: boolean;
  actionType: BrowserActionType;
  targetUrl: string;
  status: BrowserExecutionStatus;
  pageTitle?: string;
  extractedContent?: string;
  screenshotUrl?: string;
  executionId?: string;
  requiresApproval?: boolean;
  error?: string;
  durationMs?: number;
}

export interface BrowserCapabilities {
  navigate: boolean;
  readPage: boolean;
  click: boolean;
  type: boolean;
  screenshot: boolean;
  submit: boolean;
  persistentProfile: boolean;
}

export interface BrowserProvider {
  name: string;
  isConfigured(): boolean;
  getCapabilities(): BrowserCapabilities;
  navigate(url: string): Promise<BrowserActionResult>;
  fetchPublicPageText(url: string): Promise<BrowserActionResult>;
  click(url: string, selector: string): Promise<BrowserActionResult>;
  type(url: string, selector: string, text: string): Promise<BrowserActionResult>;
  screenshot(url: string): Promise<BrowserActionResult>;
  submit(
    url: string,
    selector: string,
    payload: Record<string, unknown>
  ): Promise<BrowserActionResult>;
}

function blocked(
  actionType: BrowserActionType,
  url: string
): BrowserActionResult {
  return {
    success: false,
    actionType,
    targetUrl: url,
    status: 'BLOCKED_BY_SSRF_PROTECTION',
    error:
      'BLOCKED_BY_SSRF_PROTECTION: only public http/https targets are allowed.'
  };
}

function safePublicUrl(url: string): boolean {
  return validatePublicResearchUrl(url);
}

function stripHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000);
}

export class BrowserlessProvider implements BrowserProvider {
  name = 'browserless';
  private endpoint: string;
  private apiKey: string;
  private profile: string;

  constructor() {
    this.endpoint = (
      process.env.BROWSER_ENDPOINT ||
      'https://production-sfo.browserless.io'
    ).replace(/\/$/, '');
    this.apiKey = process.env.BROWSER_API_KEY || '';
    this.profile = process.env.BROWSER_PROFILE || '';
  }

  isConfigured(): boolean {
    return this.apiKey.trim().length > 0;
  }

  getCapabilities(): BrowserCapabilities {
    const configured = this.isConfigured();
    return {
      navigate: configured,
      readPage: true,
      click: configured,
      type: configured,
      screenshot: configured,
      submit: configured,
      persistentProfile: configured && Boolean(this.profile)
    };
  }

  private endpointUrl(path: string): string {
    const params = new URLSearchParams({ token: this.apiKey });
    if (this.profile) params.set('profile', this.profile);
    params.set('timeout', '45000');
    return `${this.endpoint}${path}?${params.toString()}`;
  }

  private async runFunction(
    actionType: BrowserActionType,
    url: string,
    code: string,
    context: Record<string, unknown>
  ): Promise<BrowserActionResult> {
    if (!safePublicUrl(url)) return blocked(actionType, url);

    if (!this.isConfigured()) {
      return {
        success: false,
        actionType,
        targetUrl: url,
        status: 'BROWSER_PROVIDER_UNCONFIGURED',
        error: 'BROWSER_PROVIDER_UNCONFIGURED'
      };
    }

    const startedAt = Date.now();

    try {
      const res = await fetch(this.endpointUrl('/function'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(50_000),
        body: JSON.stringify({
          code,
          context: { url, ...context }
        })
      });

      const raw = await res.text();
      let parsed: any = {};

      try {
        parsed = raw ? JSON.parse(raw) : {};
      } catch {
        parsed = { text: raw };
      }

      const data =
        parsed &&
        typeof parsed === 'object' &&
        parsed.data &&
        typeof parsed.data === 'object'
          ? parsed.data
          : parsed;

      if (!res.ok || data?.error) {
        return {
          success: false,
          actionType,
          targetUrl: url,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          error:
            data?.error?.message ||
            data?.error ||
            `BROWSER_FUNCTION_FAILED_${res.status}`
        };
      }

      return {
        success: true,
        actionType,
        targetUrl:
          typeof data?.url === 'string' && safePublicUrl(data.url)
            ? data.url
            : url,
        status: 'SUCCESS',
        pageTitle:
          typeof data?.title === 'string'
            ? data.title.slice(0, 500)
            : undefined,
        extractedContent:
          typeof data?.text === 'string'
            ? data.text.slice(0, 8000)
            : undefined,
        executionId:
          typeof data?.executionId === 'string'
            ? data.executionId
            : undefined,
        durationMs: Date.now() - startedAt
      };
    } catch (error) {
      return {
        success: false,
        actionType,
        targetUrl: url,
        status: 'FAILED',
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async fetchPublicPageText(url: string): Promise<BrowserActionResult> {
    if (!safePublicUrl(url)) return blocked('READ_PAGE', url);

    // Prefer a rendered browser when configured so JS-heavy pages are read
    // truthfully. A direct public HTTP fallback keeps read-only research useful
    // when the paid browser provider is not configured.
    if (this.isConfigured()) {
      const code = `export default async ({ page, context }) => {
        await page.goto(context.url, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        await new Promise(resolve => setTimeout(resolve, 800));
        return {
          data: {
            title: await page.title(),
            url: page.url(),
            text: (await page.evaluate(
              () => document.body?.innerText || ''
            )).slice(0, 8000)
          },
          type: 'application/json'
        };
      };`;

      return this.runFunction('READ_PAGE', url, code, {});
    }

    const startedAt = Date.now();

    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
        headers: {
          'User-Agent': 'MENTRA-Controlled-Agent/1.0',
          Accept: 'text/html,text/plain;q=0.9,*/*;q=0.5'
        }
      });

      const finalUrl = res.url || url;
      if (!safePublicUrl(finalUrl)) return blocked('READ_PAGE', finalUrl);

      if (!res.ok) {
        return {
          success: false,
          actionType: 'READ_PAGE',
          targetUrl: finalUrl,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          error: `HTTP_FETCH_FAILED_${res.status}`
        };
      }

      const html = await res.text();

      return {
        success: true,
        actionType: 'READ_PAGE',
        targetUrl: finalUrl,
        status: 'SUCCESS',
        extractedContent: stripHtml(html),
        durationMs: Date.now() - startedAt
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'READ_PAGE',
        targetUrl: url,
        status: 'FAILED',
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async navigate(url: string): Promise<BrowserActionResult> {
    const code = `export default async ({ page, context }) => {
      const response = await page.goto(context.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      return {
        data: {
          title: await page.title(),
          url: page.url(),
          text: (await page.evaluate(
            () => document.body?.innerText || ''
          )).slice(0, 4000),
          statusCode: response?.status?.() || null
        },
        type: 'application/json'
      };
    };`;

    return this.runFunction('NAVIGATE', url, code, {});
  }

  async click(url: string, selector: string): Promise<BrowserActionResult> {
    const code = `export default async ({ page, context }) => {
      await page.goto(context.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      await page.waitForSelector(context.selector, {
        visible: true,
        timeout: 15000
      });

      const navigation = page
        .waitForNavigation({
          waitUntil: 'domcontentloaded',
          timeout: 8000
        })
        .catch(() => null);

      await page.click(context.selector);
      await navigation;
      await new Promise(resolve => setTimeout(resolve, 400));

      return {
        data: {
          title: await page.title(),
          url: page.url(),
          text: (await page.evaluate(
            () => document.body?.innerText || ''
          )).slice(0, 5000)
        },
        type: 'application/json'
      };
    };`;

    return this.runFunction('CLICK', url, code, { selector });
  }

  async type(
    url: string,
    selector: string,
    text: string
  ): Promise<BrowserActionResult> {
    const code = `export default async ({ page, context }) => {
      await page.goto(context.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      await page.waitForSelector(context.selector, {
        visible: true,
        timeout: 15000
      });
      await page.focus(context.selector);
      await page.evaluate(selector => {
        const element = document.querySelector(selector);
        if (
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement
        ) {
          element.value = '';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, context.selector);
      await page.type(context.selector, context.text, { delay: 20 });

      return {
        data: {
          title: await page.title(),
          url: page.url(),
          text: (await page.evaluate(
            () => document.body?.innerText || ''
          )).slice(0, 5000)
        },
        type: 'application/json'
      };
    };`;

    return this.runFunction('TYPE', url, code, { selector, text });
  }

  async screenshot(url: string): Promise<BrowserActionResult> {
    if (!safePublicUrl(url)) return blocked('SCREENSHOT', url);

    if (!this.isConfigured()) {
      return {
        success: false,
        actionType: 'SCREENSHOT',
        targetUrl: url,
        status: 'BROWSER_PROVIDER_UNCONFIGURED',
        error: 'BROWSER_PROVIDER_UNCONFIGURED'
      };
    }

    const startedAt = Date.now();

    try {
      const res = await fetch(this.endpointUrl('/screenshot'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: AbortSignal.timeout(50_000),
        body: JSON.stringify({
          url,
          options: {
            fullPage: false,
            type: 'png'
          },
          viewport: {
            width: 1365,
            height: 768,
            deviceScaleFactor: 1
          }
        })
      });

      if (!res.ok) {
        return {
          success: false,
          actionType: 'SCREENSHOT',
          targetUrl: url,
          status: 'SCREENSHOT_NOT_AVAILABLE',
          durationMs: Date.now() - startedAt,
          error: `SCREENSHOT_CAPTURE_FAILED_${res.status}`
        };
      }

      const buffer = Buffer.from(await res.arrayBuffer());

      // Keep server responses bounded. Huge pages should use the browser UI,
      // not inject multi-megabyte screenshots into the model context.
      if (buffer.byteLength > 2_500_000) {
        return {
          success: false,
          actionType: 'SCREENSHOT',
          targetUrl: url,
          status: 'SCREENSHOT_NOT_AVAILABLE',
          durationMs: Date.now() - startedAt,
          error: 'SCREENSHOT_TOO_LARGE'
        };
      }

      return {
        success: true,
        actionType: 'SCREENSHOT',
        targetUrl: url,
        status: 'SUCCESS',
        screenshotUrl: `data:image/png;base64,${buffer.toString('base64')}`,
        durationMs: Date.now() - startedAt
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'SCREENSHOT',
        targetUrl: url,
        status: 'SCREENSHOT_NOT_AVAILABLE',
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async submit(
    url: string,
    selector: string,
    payload: Record<string, unknown>
  ): Promise<BrowserActionResult> {
    const code = `export default async ({ page, context }) => {
      await page.goto(context.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      await page.waitForSelector(context.selector, {
        visible: true,
        timeout: 15000
      });

      await page.$eval(
        context.selector,
        (form, rawPayload) => {
          if (!(form instanceof HTMLFormElement)) {
            throw new Error('SUBMIT_SELECTOR_NOT_FORM');
          }

          for (const [name, value] of Object.entries(rawPayload || {})) {
            const field = Array.from(form.elements).find(
              element =>
                element instanceof HTMLElement &&
                element.getAttribute('name') === name
            );

            if (
              field instanceof HTMLInputElement ||
              field instanceof HTMLTextAreaElement ||
              field instanceof HTMLSelectElement
            ) {
              field.value = String(value ?? '');
              field.dispatchEvent(new Event('input', { bubbles: true }));
              field.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        },
        context.payload
      );

      const navigation = page
        .waitForNavigation({
          waitUntil: 'domcontentloaded',
          timeout: 10000
        })
        .catch(() => null);

      await page.$eval(context.selector, form => {
        if (!(form instanceof HTMLFormElement)) {
          throw new Error('SUBMIT_SELECTOR_NOT_FORM');
        }
        if (typeof form.requestSubmit === 'function') {
          form.requestSubmit();
        } else {
          form.submit();
        }
      });

      await navigation;

      return {
        data: {
          title: await page.title(),
          url: page.url(),
          text: (await page.evaluate(
            () => document.body?.innerText || ''
          )).slice(0, 5000)
        },
        type: 'application/json'
      };
    };`;

    return this.runFunction('SUBMIT', url, code, {
      selector,
      payload
    });
  }
}

export class ControlledBrowserAgent {
  private provider: BrowserProvider;

  constructor(provider?: BrowserProvider) {
    this.provider = provider || new BrowserlessProvider();
  }

  isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  getCapabilities(): BrowserCapabilities {
    return this.provider.getCapabilities();
  }

  async ensureSession(
    userId: string,
    currentUrl?: string
  ): Promise<string> {
    const supabase = createClient();

    const { data: existing } = await supabase
      .from('browser_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      if (currentUrl) {
        await supabase
          .from('browser_sessions')
          .update({
            current_url: currentUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .eq('user_id', userId);
      }
      return existing.id;
    }

    const { data: created, error } = await supabase
      .from('browser_sessions')
      .insert({
        user_id: userId,
        status: 'ACTIVE',
        current_url: currentUrl || null,
        provider: this.provider.name,
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error || !created?.id) {
      throw new Error(error?.message || 'BROWSER_SESSION_CREATE_FAILED');
    }

    return created.id;
  }

  async closeSession(userId: string, sessionId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('browser_sessions')
      .update({
        status: 'CLOSED',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .eq('status', 'ACTIVE');

    return !error;
  }

  async navigate(url: string): Promise<BrowserActionResult> {
    return this.provider.navigate(url);
  }

  async readPage(url: string): Promise<BrowserActionResult> {
    return this.provider.fetchPublicPageText(url);
  }

  async click(
    url: string,
    selector: string,
    approved = false
  ): Promise<BrowserActionResult> {
    if (!approved) {
      return {
        success: false,
        actionType: 'CLICK',
        targetUrl: url,
        status: 'APPROVAL_REQUIRED',
        requiresApproval: true,
        error: 'APPROVAL_REQUIRED_BEFORE_CLICK'
      };
    }
    return this.provider.click(url, selector);
  }

  async type(
    url: string,
    selector: string,
    text: string,
    approved = false
  ): Promise<BrowserActionResult> {
    if (!approved) {
      return {
        success: false,
        actionType: 'TYPE',
        targetUrl: url,
        status: 'APPROVAL_REQUIRED',
        requiresApproval: true,
        error: 'APPROVAL_REQUIRED_BEFORE_TYPE'
      };
    }
    return this.provider.type(url, selector, text);
  }

  async screenshot(url: string): Promise<BrowserActionResult> {
    return this.provider.screenshot(url);
  }

  async submit(
    url: string,
    selector: string,
    payload: Record<string, unknown>,
    approved = false
  ): Promise<BrowserActionResult> {
    if (!approved) {
      return {
        success: false,
        actionType: 'SUBMIT',
        targetUrl: url,
        status: 'APPROVAL_REQUIRED',
        requiresApproval: true,
        error: 'APPROVAL_REQUIRED_BEFORE_SUBMIT'
      };
    }
    return this.provider.submit(url, selector, payload);
  }

  async logBrowserAction(
    userId: string,
    sessionId: string,
    action: BrowserActionResult,
    riskLevel: ActionRiskLevel,
    options: {
      selector?: string;
      payload?: Record<string, unknown>;
      requiresApproval?: boolean;
      idempotencyKey?: string;
    } = {}
  ): Promise<void> {
    const supabase = createClient();

    const safeResult = {
      success: action.success,
      actionType: action.actionType,
      targetUrl: action.targetUrl,
      status: action.status,
      pageTitle: action.pageTitle,
      extractedContent: action.extractedContent?.slice(0, 2000),
      hasScreenshot: Boolean(action.screenshotUrl),
      executionId: action.executionId,
      durationMs: action.durationMs,
      error: action.error
    };

    const row = {
      session_id: sessionId,
      user_id: userId,
      action_type: action.actionType,
      target_url: action.targetUrl,
      selector: options.selector || null,
      payload: options.payload || {},
      risk_level: riskLevel,
      status: action.status,
      requires_approval:
        options.requiresApproval ?? Boolean(action.requiresApproval),
      screenshot_url: null,
      result: safeResult,
      error_message: action.error || null,
      idempotency_key: options.idempotencyKey || null,
      executed_at: new Date().toISOString()
    };

    const { error } = await supabase.from('browser_actions').insert(row);

    if (error?.code === '23505' && options.idempotencyKey) {
      return;
    }

    if (error) throw new Error(error.message);

    await supabase
      .from('browser_sessions')
      .update({
        current_url: action.targetUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', userId);
  }
}

export const browserAgent = new ControlledBrowserAgent();
