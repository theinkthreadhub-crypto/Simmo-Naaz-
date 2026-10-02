# Browser Use × Mentra

Mentra now has a separate Python Browser Use worker and a server-side Next.js bridge.

## Why separate service

The main Mentra app is Next.js/Vercel. Browser Use is strongest as a long-running Python browser process, so it should not run inside a Vercel request.

## Flow

Mentra UI/agent -> `POST /api/browser/run` -> Mentra server validates Supabase user -> Browser worker -> Browser Use agent -> result.

## Deploy worker

Deploy `browser-worker/` as a Docker web service on Render/Railway/VPS.

Worker env:

- `BROWSER_WORKER_SECRET`
- `BROWSER_LLM_PROVIDER=browser-use|google|openai`
- `BROWSER_LLM_MODEL`
- provider API key
- optionally `BROWSER_USE_API_KEY` for Browser Use Cloud

Mentra server env:

- `BROWSER_WORKER_URL=https://...`
- `BROWSER_WORKER_SECRET=<same secret>`
- `BROWSER_WORKER_TIMEOUT_MS=120000`

## Safety

Current bridge only classifies the task as browser navigation/read automation. Click/type/submit actions must remain approval-gated through Mentra's risk engine before they are exposed as autonomous tools.

Do not place passwords, cookies, tokens, card data, or other credentials inside plain-text tasks.
