export interface ComputerActionResult {
  success: boolean;
  action: string;
  targetApp?: string;
  requiresApproval?: boolean;
  error?: string;
  detail?: string;
}

export interface ComputerCapabilities {
  desktopBridgeConfigured: boolean;
  openApp: boolean;
  readScreen: boolean;
  clickUI: boolean;
  typeText: boolean;
}

export class ControlledComputerAgent {
  getCapabilities(): ComputerCapabilities {
    return {
      desktopBridgeConfigured: false,
      openApp: false,
      readScreen: false,
      clickUI: false,
      typeText: false
    };
  }

  isConfigured(): boolean {
    return false;
  }

  private unavailable(
    action: string,
    targetApp?: string
  ): ComputerActionResult {
    return {
      success: false,
      action,
      targetApp,
      error: 'LOCAL_COMPUTER_BRIDGE_NOT_CONFIGURED',
      detail:
        'MENTRA will not simulate desktop control. Use the controlled cloud browser for web actions until a real local desktop bridge is installed.'
    };
  }

  async openApp(appName: string): Promise<ComputerActionResult> {
    return this.unavailable('OPEN_APP', appName);
  }

  async readScreen(): Promise<ComputerActionResult> {
    return this.unavailable('READ_SCREEN');
  }

  async clickUI(_x: number, _y: number): Promise<ComputerActionResult> {
    return this.unavailable('CLICK_UI');
  }

  async typeText(_text: string): Promise<ComputerActionResult> {
    return this.unavailable('TYPE_TEXT');
  }
}

export const computerAgent = new ControlledComputerAgent();
