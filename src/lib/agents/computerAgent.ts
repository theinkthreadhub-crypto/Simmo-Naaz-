import { ActionRiskLevel, evaluateActionPermission } from '../safety/riskEngine';

export interface ComputerActionResult {
  success: boolean;
  action: string;
  targetApp?: string;
  requiresApproval?: boolean;
  error?: string;
}

export interface ComputerTool {
  openApp(appName: string): Promise<ComputerActionResult>;
  readScreen(): Promise<ComputerActionResult>;
  clickUI(x: number, y: number): Promise<ComputerActionResult>;
  typeText(text: string): Promise<ComputerActionResult>;
}

export class ControlledComputerAgent implements ComputerTool {
  private provider: string;
  private apiKey: string;

  constructor() {
    this.provider = process.env.COMPUTER_PROVIDER || 'anthropic_computer_use';
    this.apiKey = process.env.COMPUTER_API_KEY || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async openApp(appName: string): Promise<ComputerActionResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        action: 'OPEN_APP',
        targetApp: appName,
        error: 'COMPUTER_USE_PROVIDER_UNCONFIGURED'
      };
    }

    const perm = evaluateActionPermission('ASSISTED', 'open_application', { appName });
    if (perm.requiresApproval) {
      return {
        success: false,
        action: 'OPEN_APP',
        targetApp: appName,
        requiresApproval: true,
        error: 'APPROVAL_REQUIRED_BEFORE_OPENING_APP'
      };
    }

    return { success: true, action: 'OPEN_APP', targetApp: appName };
  }

  async readScreen(): Promise<ComputerActionResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        action: 'READ_SCREEN',
        error: 'COMPUTER_USE_PROVIDER_UNCONFIGURED'
      };
    }

    return { success: true, action: 'READ_SCREEN' };
  }

  async clickUI(x: number, y: number): Promise<ComputerActionResult> {
    if (!this.isConfigured()) {
      return { success: false, action: 'CLICK_UI', error: 'COMPUTER_USE_PROVIDER_UNCONFIGURED' };
    }

    const perm = evaluateActionPermission('ASSISTED', 'computer_click', { x, y });
    if (perm.requiresApproval) {
      return { success: false, action: 'CLICK_UI', requiresApproval: true, error: 'APPROVAL_REQUIRED' };
    }

    return { success: true, action: 'CLICK_UI' };
  }

  async typeText(text: string): Promise<ComputerActionResult> {
    if (!this.isConfigured()) {
      return { success: false, action: 'TYPE_TEXT', error: 'COMPUTER_USE_PROVIDER_UNCONFIGURED' };
    }

    return { success: true, action: 'TYPE_TEXT' };
  }
}

export const computerAgent = new ControlledComputerAgent();
