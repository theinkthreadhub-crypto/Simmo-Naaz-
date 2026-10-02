# MENTRA + Langflow

MENTRA uses Langflow as an optional orchestration/advisory layer.

## Safety boundary

Langflow does not directly receive authority to mutate MENTRA data or execute high-risk tools.
MENTRA keeps ownership of:

- authenticated user identity
- Supabase row scoping
- tool schema validation
- risk classification
- approval requests
- tool execution
- audit logging
- WhatsApp sender restrictions

In advisory mode, MENTRA sends the sanitized user request and MENTRA conversation ID to the configured Langflow flow. The returned text is injected into the MENTRA system context as untrusted orchestration advice. The normal MENTRA agent runtime still decides and executes tools through the existing permission model.

If Langflow is unavailable, times out, or returns invalid output, MENTRA silently falls back to its native runtime.

## Environment

```env
LANGFLOW_ENABLED=false
LANGFLOW_MODE=advisory
LANGFLOW_URL=http://127.0.0.1:7860
LANGFLOW_FLOW_ID=
LANGFLOW_API_KEY=
LANGFLOW_TIMEOUT_MS=15000
```

For a Vercel deployment, `LANGFLOW_URL` must be a network-reachable Langflow server. `127.0.0.1` only works when Langflow and MENTRA run on the same machine/container network.

## API

Authenticated status endpoint:

```
GET /api/langflow/status
```

No Langflow API key is exposed to the browser.
