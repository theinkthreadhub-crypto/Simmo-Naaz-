# MENTRA LFX Runtime

This branch hosts the lightweight Langflow/LFX execution service used by MENTRA.

Render configuration:
- Runtime: Python
- Build: `python -m pip install --upgrade pip && pip install -r langflow-service/requirements-lfx.txt`
- Start: `lfx serve --host 0.0.0.0 --port $PORT`

Security:
- Set `LANGFLOW_API_KEY` as a secret environment variable in Render before enabling MENTRA traffic.
- Keep MENTRA's own authentication, approval gates, tool validation, and audit logging as the execution authority.
