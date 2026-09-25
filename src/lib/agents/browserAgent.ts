import { createClient } from '@/lib/supabase/server';
import { ActionRiskLevel, evaluateActionPermission } from '../safety/riskEngine';
import { validatePublicResearchUrl } from '../research/provider';

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
  | 'BROWSER_ACTION_NOT_IMPLEMENTED'
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
}

export interface BrowserCapabilities {
  navigate: boolean;
  readPage: boolean;
  click: boolean;
  type: boolean;
  screenshot: boolean;
  submit: boolean;
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
  submit(url: string, selector: string, payload: Record<string, unknown>): Promise<BrowserActionResult>;
}

/**
 * Real Headless Browserless / Playwright HTTP & WebSocket Provider
 */
export class BrowserlessProvider implements BrowserProvider {
  name = 'browserless';
  private endpoint: string;
  private apiKey: string;

  constructor() {
    this.endpoint = process.env.BROWSER_ENDPOINT || 'https://chrome.browserless.io';
    this.apiKey = process.env.BROWSER_API_KEY || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  getCapabilities(): BrowserCapabilities {
    const configured = this.isConfigured();
    return {
      navigate: configured,
      readPage: true, // HTTP text fetch is always supported with SSRF check
      click: configured,
      type: configured,
      screenshot: configured,
      submit: configured,
    };
  }

  async fetchPublicPageText(url: string): Promise<BrowserActionResult> {
    if (!validatePublicResearchUrl(url)) {
      return {
        success: false,
        actionType: 'READ_PAGE',
        targetUrl: url,
        status: 'BLOCKED_BY_SSRF_PROTECTION',
        error: 'BLOCKED_BY_SSRF_PROTECTION: Target resolves to restricted internal or private address.',
      };
    }

    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'MENTRA-Controlled-Agent/1.0' } });
      if (!res.ok) {
        return {
          success: false,
          actionType: 'READ_PAGE',
          targetUrl: url,
          status: 'FAILED',
          error: `HTTP_FETCH_FAILED_${res.status}`,
        };
      }
      const html = await res.text();
      const cleanText = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').slice(0, 4000);
      return {
        success: true,
        actionType: 'READ_PAGE',
        targetUrl: url,
        status: 'SUCCESS',
        extractedContent: cleanText,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        actionType: 'READ_PAGE',
        targetUrl: url,
        status: 'FAILED',
        error: msg,
      };
    }
  }

  async navigate(url: string): Promise<BrowserActionResult> {
    if (!validatePublicResearchUrl(url)) {
      return {
        success: false,
        actionType: 'NAVIGATE',
        targetUrl: url,
        status: 'BLOCKED_BY_SSRF_PROTECTION',
        error: 'BLOCKED_BY_SSRF_PROTECTION',
      };
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        actionType: 'NAVIGATE',
        targetUrl: url,
        status: 'BROWSER_PROVIDER_UNCONFIGURED',
        error: 'BROWSER_PROVIDER_UNCONFIGURED',
      };
    }

    try {
      const res = await fetch(`${this.endpoint}/content?token=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        return {
          success: false,
          actionType: 'NAVIGATE',
          targetUrl: url,
          status: 'FAILED',
          error: `BROWSER_NAVIGATE_ERROR_${res.status}`,
        };
      }

      const html = await res.text();
      return {
        success: true,
        actionType: 'NAVIGATE',
        targetUrl: url,
        status: 'SUCCESS',
        pageTitle: `Rendered ${url}`,
        extractedContent: html.slice(0, 1000),
      };
    } catch (err: unknown) {
      return {
        success: false,
        actionType: 'NAVIGATE',
        targetUrl: url,
        status: 'FAILED',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async click(url: string, selector: string): Promise<BrowserActionResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        actionType: 'CLICK',
        targetUrl: url,
        status: 'BROWSER_PROVIDER_UNCONFIGURED',
        error: 'BROWSER_PROVIDER_UNCONFIGURED',
      };
    }

    // In a real browserless function call, evaluate code on endpoint
    return {
      success: false,
      actionType: 'CLICK',
      targetUrl: url,
      status: 'BROWSER_ACTION_NOT_IMPLEMENTED',
      error: 'BROWSER_ACTION_NOT_IMPLEMENTED: Interactive click requires full WebSocket session.',
    };
  }

  async type(url: string, selector: string, text: string): Promise<BrowserActionResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        actionType: 'TYPE',
        targetUrl: url,
        status: 'BROWSER_PROVIDER_UNCONFIGURED',
        error: 'BROWSER_PROVIDER_UNCONFIGURED',
      };
    }

    return {
      success: false,
      actionType: 'TYPE',
      targetUrl: url,
      status: 'BROWSER_ACTION_NOT_IMPLEMENTED',
      error: 'BROWSER_ACTION_NOT_IMPLEMENTED: Interactive type requires full WebSocket session.',
    };
  }

  async screenshot(url: string): Promise<BrowserActionResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        actionType: 'SCREENSHOT',
        targetUrl: url,
        status: 'BROWSER_PROVIDER_UNCONFIGURED',
        error: 'BROWSER_PROVIDER_UNCONFIGURED',
      };
    }

    try {
      const res = await fetch(`${this.endpoint}/screenshot?token=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        return {
          success: false,
          actionType: 'SCREENSHOT',
          targetUrl: url,
          status: 'SCREENSHOT_NOT_AVAILABLE',
          error: `SCREENSHOT_CAPTURE_FAILED_${res.status}`,
        };
      }

      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return {
        success: true,
        actionType: 'SCREENSHOT',
        targetUrl: url,
        status: 'SUCCESS',
        screenshotUrl: `data:image/png;base64,${base64}`,
      };
    } catch (err: unknown) {
      return {
        success: false,
        actionType: 'SCREENSHOT',
        targetUrl: url,
        status: 'SCREENSHOT_NOT_AVAILABLE',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async submit(url: string, selector: string, payload: Record<string, unknown>): Promise<BrowserActionResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        actionType: 'SUBMIT',
        targetUrl: url,
        status: 'BROWSER_PROVIDER_UNCONFIGURED',
        error: 'BROWSER_PROVIDER_UNCONFIGURED',
      };
    }

    return {
      success: false,
      actionType: 'SUBMIT',
      targetUrl: url,
      status: 'BROWSER_ACTION_NOT_IMPLEMENTED',
      error: 'BROWSER_ACTION_NOT_IMPLEMENTED: Form submission requires verified provider driver.',
    };
  }
}

/**
 * Controlled Browser Agent wrapping provider execution and enforcing security risk checks.
 */
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

  async navigate(url: string): Promise<BrowserActionResult> {
    return this.provider.navigate(url);
  }

  async readPage(url: string): Promise<BrowserActionResult> {
    return this.provider.fetchPublicPageText(url);
  }

  async click(url: string, selector: string): Promise<BrowserActionResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        actionType: 'CLICK',
        targetUrl: url,
        status: 'BROWSER_PROVIDER_UNCONFIGURED',
        error: 'BROWSER_PROVIDER_UNCONFIGURED',
      };
    }

    const perm = evaluateActionPermission('ASSISTED', 'browser_click', { url, selector });
    if (perm.requiresApproval) {
      return {
        success: false,
        actionType: 'CLICK',
        targetUrl: url,
        status: 'APPROVAL_REQUIRED',
        requiresApproval: true,
        error: 'APPROVAL_REQUIRED_BEFORE_CLICK',
      };
    }

    return this.provider.click(url, selector);
  }

  async type(url: string, selector: string, text: string): Promise<BrowserActionResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        actionType: 'TYPE',
        targetUrl: url,
        status: 'BROWSER_PROVIDER_UNCONFIGURED',
        error: 'BROWSER_PROVIDER_UNCONFIGURED',
      };
    }

    const perm = evaluateActionPermission('ASSISTED', 'browser_type', { url, selector, textLength: text.length });
    if (perm.requiresApproval) {
      return {
        success: false,
        actionType: 'TYPE',
        targetUrl: url,
        status: 'APPROVAL_REQUIRED',
        requiresApproval: true,
        error: 'APPROVAL_REQUIRED_BEFORE_TYPE',
      };
    }

    return this.provider.type(url, selector, text);
  }

  async screenshot(url: string): Promise<BrowserActionResult> {
    return this.provider.screenshot(url);
  }

  async submit(url: string, selector: string, payload: Record<string, unknown>): Promise<BrowserActionResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        actionType: 'SUBMIT',
        targetUrl: url,
        status: 'BROWSER_PROVIDER_UNCONFIGURED',
        error: 'BROWSER_PROVIDER_UNCONFIGURED',
      };
    }

    const perm = evaluateActionPermission('ASSISTED', 'browser_submit', payload);
    if (perm.requiresApproval) {
      return {
        success: false,
        actionType: 'SUBMIT',
        targetUrl: url,
        status: 'APPROVAL_REQUIRED',
        requiresApproval: true,
        error: 'APPROVAL_REQUIRED_BEFORE_SUBMIT',
      };
    }

    return this.provider.submit(url, selector, payload);
  }

  async logBrowserAction(
    userId: string,
    sessionId: string,
    action: BrowserActionResult,
    riskLevel: ActionRiskLevel = 'LOW_RISK_EXTERNAL'
  ): Promise<void> {
    try {
      const supabase = createClient();
      await supabase.from('browser_actions').insert({
        session_id: sessionId,
        user_id: userId,
        action_type: action.actionType,
        target_url: action.targetUrl,
        risk_level: riskLevel,
        status: action.status,
        error_message: action.error,
        result: action,
      });
    } catch {
      // Ignored
    }
  }
}

export const browserAgent = new ControlledBrowserAgent();
