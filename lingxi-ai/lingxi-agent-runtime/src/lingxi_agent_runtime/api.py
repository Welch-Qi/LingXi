from __future__ import annotations

from functools import lru_cache
from typing import Any

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from lingxi_agent_runtime.config import get_settings
from lingxi_agent_runtime.runtime import AgentRuntime


class RunRequest(BaseModel):
    goal: str = Field(..., min_length=1, description="自然语言任务目标")
    tenant_id: str = Field(..., min_length=1)
    user_id: str = Field(..., min_length=1)
    thread_id: str | None = None


def create_app() -> FastAPI:
    app = FastAPI(title="Lingxi Agent Runtime", version="0.1.0")

    @lru_cache
    def runtime() -> AgentRuntime:
        return AgentRuntime(get_settings())

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/v1/skills")
    def list_skills() -> dict[str, Any]:
        items = [
            {
                "skillId": s.skill_id,
                "name": s.name,
                "domain": s.domain,
                "permCodes": list(s.perm_codes),
                "highRisk": s.high_risk,
                "version": s.version,
            }
            for s in runtime().skills
        ]
        return {"items": items}

    @app.post("/api/v1/agent/run")
    def run_agent(
        body: RunRequest,
        x_trace_id: str | None = Header(default=None, alias="X-Trace-Id"),
    ) -> dict[str, Any]:
        if not body.tenant_id or not body.user_id:
            raise HTTPException(status_code=400, detail="tenant_id/user_id required")
        return runtime().run(
            body.goal,
            tenant_id=body.tenant_id,
            user_id=body.user_id,
            trace_id=x_trace_id,
            thread_id=body.thread_id,
        )

    return app


app = create_app()
