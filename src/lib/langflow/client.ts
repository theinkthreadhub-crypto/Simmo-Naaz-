/**
 * Server-only Langflow bridge for MENTRA.
 *
 * Langflow is intentionally used as an optional orchestration/advisory layer.
 * MENTRA remains the authority for authentication, permissions, approvals,
 * tool execution, persistence, and user-scoped data access.
 */

type JsonRecord = Record<string, unknown>;

export interface LangflowRunInput {
  inputValue: string;
  sessionId: string;
  tweaks?: JsonRecord;
}

export interface LangflowRunResult {
  text: string;
  sessionId: string;
  raw: unknown;
}

export interface LangflowStatus {
  enabled: boolean;
  configured: boolean;
  mode: string;
  runtime: 'langflow' | 'lfx';
  urlConfigured: boolean;
  flowConfigured: boolean;
  apiKeyConfigured: boolean;
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function getTimeoutMs(): number {
  const parsed = Number(process.env.LANGFLOW_TIMEOUT_MS || 15000);
  if (!Number.isFinite(parsed)) return 15000;
  return Math.min(45000, Math.max(1000, parsed));
}

const MENTRA_LFX_URL = 'https://mentra-lfx-core.onrender.com';
const MENTRA_LFX_FLOW_ID = '66a1aeb0-784d-4b50-b926-2fc53d89adf1';

function getRuntime(): 'langflow' | 'lfx' {
  return (process.env.LANGFLOW_RUNTIME || 'lfx').trim().toLowerCase() === 'langflow'
    ? 'langflow'
    : 'lfx';
}

function getResolvedUrl(runtime: 'langflow' | 'lfx'): string {
  return process.env.LANGFLOW_URL?.trim() || (runtime === 'lfx' ? MENTRA_LFX_URL : '');
}

function getResolvedFlowId(runtime: 'langflow' | 'lfx'): string {
  return process.env.LANGFLOW_FLOW_ID?.trim() || (runtime === 'lfx' ? MENTRA_LFX_FLOW_ID : '');
}

export function getLangflowStatus(): LangflowStatus {
  const enabled = process.env.LANGFLOW_ENABLED === 'true';
  const runtime = getRuntime();
  const urlConfigured = Boolean(getResolvedUrl(runtime));
  const flowConfigured = Boolean(getResolvedFlowId(runtime));

  return {
    enabled,
    configured: enabled && urlConfigured && flowConfigured,
    mode: (process.env.LANGFLOW_MODE || 'advisory').trim().toLowerCase(),
    runtime,
    urlConfigured,
    flowConfigured,
    apiKeyConfigured: Boolean(process.env.LANGFLOW_API_KEY?.trim())
  };
}

export function isLangflowAdvisoryEnabled(): boolean {
  const status = getLangflowStatus();
  return status.configured && status.mode === 'advisory';
}

function getByPath(value: unknown, path: Array<string | number>): unknown {
  let current: unknown = value;

  for (const key of path) {
    if (typeof key === 'number') {
      if (!Array.isArray(current)) return undefined;
      current = current[key];
      continue;
    }

    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }

    current = (current as JsonRecord)[key];
  }

  return current;
}

function extractLangflowText(payload: unknown): string {
  const candidates: Array<Array<string | number>> = [
    ['outputs', 0, 'outputs', 0, 'results', 'message', 'text'],
    ['outputs', 0, 'outputs', 0, 'results', 'text', 'data', 'text'],
    ['outputs', 0, 'outputs', 0, 'results', 'text'],
    ['outputs', 0, 'outputs', 0, 'message', 'text'],
    ['result', 'message', 'text'],
    ['result', 'text'],
    ['result'],
    ['message', 'text'],
    ['text']
  ];

  for (const path of candidates) {
    const value = getByPath(payload, path);
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

export async function runLangflow(input: LangflowRunInput): Promise<LangflowRunResult> {
  const status = getLangflowStatus();
  if (!status.configured) {
    throw new Error('LANGFLOW_NOT_CONFIGURED');
  }

  const baseUrl = normalizeBaseUrl(getResolvedUrl(status.runtime));
  const flowId = getResolvedFlowId(status.runtime);
  const apiKey = process.env.LANGFLOW_API_KEY?.trim();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const isLfx = status.runtime === 'lfx';
    const endpoint = isLfx
      ? `${baseUrl}/flows/${encodeURIComponent(flowId)}/run`
      : `${baseUrl}/api/v1/run/${encodeURIComponent(flowId)}`;

    const body = isLfx
      ? {
          input_value: input.inputValue,
          session_id: input.sessionId
        }
      : {
          input_value: input.inputValue,
          input_type: 'chat',
          output_type: 'chat',
          session_id: input.sessionId,
          ...(input.tweaks ? { tweaks: input.tweaks } : {})
        };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: controller.signal
    });

    const responseText = await response.text();
    let payload: unknown = {};

    if (responseText) {
      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = { text: responseText };
      }
    }

    if (!response.ok) {
      throw new Error(`LANGFLOW_HTTP_${response.status}`);
    }

    const text = extractLangflowText(payload);
    if (!text) {
      throw new Error('LANGFLOW_EMPTY_OUTPUT');
    }

    const returnedSessionId = getByPath(payload, ['session_id']);

    return {
      text,
      sessionId:
        typeof returnedSessionId === 'string' && returnedSessionId.trim()
          ? returnedSessionId
          : input.sessionId,
      raw: payload
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('LANGFLOW_TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
