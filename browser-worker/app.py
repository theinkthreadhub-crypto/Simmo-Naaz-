import os
from typing import Any

from browser_use import Agent, Browser, ChatBrowserUse, ChatGoogle, ChatOpenAI
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Mentra Browser Worker", version="0.1.0")


class BrowserTask(BaseModel):
    task: str = Field(min_length=3, max_length=8000)
    use_cloud: bool = False
    model: str | None = None
    max_steps: int = Field(default=20, ge=1, le=50)


def _authorized(token: str | None) -> bool:
    expected = os.getenv("BROWSER_WORKER_SECRET")
    return bool(expected and token and token == expected)


def _llm(model: str | None):
    provider = os.getenv("BROWSER_LLM_PROVIDER", "browser-use").lower()
    selected = model or os.getenv("BROWSER_LLM_MODEL")

    if provider == "google":
        return ChatGoogle(model=selected or "gemini-2.5-flash")
    if provider == "openai":
        return ChatOpenAI(model=selected or "gpt-5.6-luna")
    return ChatBrowserUse(model=selected or "bu-2-0")


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"ok": True, "service": "mentra-browser-worker"}


@app.post("/run")
async def run_task(payload: BrowserTask, authorization: str | None = Header(default=None)):
    token = authorization.removeprefix("Bearer ").strip() if authorization else None
    if not _authorized(token):
        raise HTTPException(status_code=401, detail="Unauthorized")

    browser = Browser(use_cloud=True) if payload.use_cloud else Browser()
    agent = Agent(task=payload.task, llm=_llm(payload.model), browser=browser)

    try:
        history = await agent.run(max_steps=payload.max_steps)
        return {
            "ok": True,
            "result": history.final_result(),
            "is_done": history.is_done(),
            "has_errors": history.has_errors(),
        }
    finally:
        await browser.stop()
