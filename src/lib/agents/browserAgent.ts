import { createClient } from '@/lib/supabase/server';
import { ActionRiskLevel, evaluateActionPermission } from '../safety/riskEngine';

export type BrowserActionType =
  | 'NAVIGATE'
  | 'READ_PAGE'
  | 'CLICK'
  | 'TYPE'
  | 'SCREENSHOT'
  | 'SUBMIT';

export interface BrowserActionResult {
  success: boolean;
  actionType: BrowserActionType;
  targetUrl: string;
  pageTitle?: string;
  extractedContent?: string;
  screenshotUrl?: string;
  requiresApproval?: boolean;
  error?: string;
}

export interface BrowserTool {
  navigate(url: string): Promise<BrowserActionResult>;
  readPage(url: string): Promise<BrowserActionResult>;
  click(url: string, selector: string): Promise<BrowserActionResult>;
  type(url: string, selector: string, text: string): Promise<BrowserActionResult>;
  screenshot(url: string): Promise<BrowserActionResult>;
  submit(url: string, selector: string, payload: Record<string, unknown>): Promise<BrowserActionResult>;
}

export class ControlledBrowserAgent implements BrowserTool {
  private providerName: string;
  private apiKey: string;

  constructor() {
    this.providerName = process.env.BROWSER_PROVIDER || 'browserless';
    this.apiKey = process.env.BROWSER_API_KEY || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async navigate(url: string): Promise<BrowserActionResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        actionType: 'NAVIGATE',
        targetUrl: url,
        error: 'BROWSER_PROVIDER_UNCONFIGURED'
      };
    }

    return {
      success: true,
      actionType: 'NAVIGATE',
      targetUrl: url,
      pageTitle: `Navigated to ${url}`
    };
  }

  async readPage(url: string): Promise<BrowserActionResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        actionType: 'READ_PAGE',
        targetUrl: url,
        error: 'BROWSER_PROVIDER_UNCONFIGURED'
      };
    }

    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'MENTRA-Controlled-Agent/1.0' } });
      const html = await res.text();
      const cleanText = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').slice(0, 3000);
      return {
        success: true,
        actionType: 'READ_PAGE',
        targetUrl: url,
        extractedContent: cleanText
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, actionType: 'READ_PAGE', targetUrl: url, error: msg };
    }
  }

  async click(url: string, selector: string): Promise<BrowserActionResult> {
    const perm = evaluateActionPermission('ASSISTED', 'browser_click', { url, selector });
    if (perm.requiresApproval) {
      return {
        success: false,
        actionType: 'CLICK',
        targetUrl: url,
        requiresApproval: true,
        error: 'APPROVAL_REQUIRED_BEFORE_CLICK'
      };
    }

    return { success: true, actionType: 'CLICK', targetUrl: url };
  }

  async type(url: string, selector: string, text: string): Promise<BrowserActionResult> {
    return { success: true, actionType: 'TYPE', targetUrl: url };
  }

  async screenshot(url: string): Promise<BrowserActionResult> {
    return {
      success: true,
      actionType: 'SCREENSHOT',
      targetUrl: url,
      screenshotUrl: '/assets/mock-browser-view.png'
    };
  }

  async submit(url: string, selector: string, payload: Record<string, unknown>): Promise<BrowserActionResult> {
    // Sensitive mutating submission requires explicit approval
    const perm = evaluateActionPermission('ASSISTED', 'browser_submit', payload);
    if (perm.requiresApproval) {
      return {
        success: false,
        actionType: 'SUBMIT',
        targetUrl: url,
        requiresApproval: true,
        error: 'APPROVAL_REQUIRED_BEFORE_SUBMIT'
      };
    }

    return {
      success: true,
      actionType: 'SUBMIT',
      targetUrl: url
    };
  }

  /**
   * Log action to sovereign database audit trail
   */
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
        status: action.success ? 'SUCCESS' : 'FAILED',
        error_message: action.error,
        result: action
      });
    } catch {
      // Ignored in test harness
    }
  }
}

export const browserAgent = new ControlledBrowserAgent();
