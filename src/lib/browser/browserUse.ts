import { evaluateActionPermission, getConfiguredAutonomyMode } from '@/lib/safety/riskEngine';

export type BrowserTaskRequest = {
  task: string;
  useCloud?: boolean;
  model?: string;
  maxSteps?: number;
};

export type BrowserTaskResult = {
  ok: boolean;
  result?: string | null;
  is_done?: boolean;
  has_errors?: boolean;
  error?: string;
};

export async function runBrowserTask(input: BrowserTaskRequest): Promise<BrowserTaskResult> {
  const permission = evaluateActionPermission(
    getConfiguredAutonomyMode(),
    'browser_navigate',
    { task: input.task }
  );

  if (!permission.allowed || permission.requiresApproval) {
    return { ok: false, error: permission.reason };
  }

  const baseUrl = process.env.BROWSER_WORKER_URL;
  const secret = process.env.BROWSER_WORKER_SECRET;
  if (!baseUrl || !secret) {
    return { ok: false, error: 'Browser worker is not configured.' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.BROWSER_WORKER_TIMEOUT_MS || 120000)
  );

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/run`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${secret}`
      },
      body: JSON.stringify({
        task: input.task,
        use_cloud: input.useCloud ?? false,
        model: input.model,
        max_steps: input.maxSteps ?? 20
      }),
      signal: controller.signal,
      cache: 'no-store'
    });

    const data = (await response.json()) as BrowserTaskResult & { detail?: string };
    if (!response.ok) {
      return { ok: false, error: data.detail || data.error || `Browser worker HTTP ${response.status}` };
    }
    return data;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Browser worker request failed.'
    };
  } finally {
    clearTimeout(timeout);
  }
}
