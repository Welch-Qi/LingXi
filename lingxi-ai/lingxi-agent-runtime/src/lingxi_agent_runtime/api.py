from __future__ import annotations

import threading
import uuid
from functools import lru_cache
from typing import Any

from fastapi import FastAPI, Header, HTTPException
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from lingxi_agent_runtime.agents.base import system_prompt
from lingxi_agent_runtime.config import get_settings
from lingxi_agent_runtime.obs.trajectory import new_task_id
from lingxi_agent_runtime.runtime import AgentRuntime

_task_store: dict[str, dict[str, Any]] = {}
_task_store_lock = threading.Lock()

ERROR_RESOURCE_NOT_FOUND = 30005


class RunRequest(BaseModel):
    goal: str = Field(..., min_length=1, description="自然语言任务目标")
    tenant_id: str = Field(..., min_length=1)
    user_id: str = Field(..., min_length=1)
    thread_id: str | None = None


class CreateTaskRequest(BaseModel):
    goal: str = Field(..., min_length=1, description="自然语言任务目标")
    context: dict[str, Any] | None = None
    async_: bool = Field(default=True, alias="async", description="是否异步执行")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="用户消息")
    session_id: str | None = Field(default=None, alias="sessionId")


def _success(data: Any, message: str = "success") -> dict[str, Any]:
    return {"code": 0, "message": message, "data": data}


def _error(code: int, message: str) -> dict[str, Any]:
    return {"code": code, "message": message, "data": None}


def _map_run_status(status: str) -> str:
    if status in {"completed", "awaiting_human"}:
        return "FINISHED"
    if status == "failed":
        return "FAILED"
    return "RUNNING"


def _extract_identity(context: dict[str, Any] | None) -> tuple[str, str]:
    ctx = context or {}
    tenant_id = str(ctx.get("tenantId") or ctx.get("tenant_id") or "1")
    user_id = str(ctx.get("userId") or ctx.get("user_id") or "u_admin")
    return tenant_id, user_id


def _store_task(task_id: str, payload: dict[str, Any]) -> None:
    with _task_store_lock:
        _task_store[task_id] = payload


def _get_task(task_id: str) -> dict[str, Any] | None:
    with _task_store_lock:
        return _task_store.get(task_id)


def _suggest_agents(message: str) -> list[str]:
    text = message.lower()
    if any(k in text for k in ("社媒", "social", "tiktok", "linkedin")):
        return ["social_marketer"]
    if any(k in text for k in ("潜客", "邮件", "whatsapp", "edm", "触达")):
        return ["lead_miner"]
    if any(k in text for k in ("销售", "线索", "商机", "客户")):
        return ["sales_converter"]
    if any(k in text for k in ("决策", "roi", "预警", "归因", "看板")):
        return ["decision_officer"]
    if any(k in text for k in ("市场", "热词", "趋势", "贸易", "热门")):
        return ["market_analyst"]
    return ["market_analyst"]


def _run_task_and_store(
    rt: AgentRuntime,
    *,
    task_id: str,
    goal: str,
    tenant_id: str,
    user_id: str,
    trace_id: str,
    thread_id: str | None,
) -> None:
    result = rt.run(
        goal,
        tenant_id=tenant_id,
        user_id=user_id,
        trace_id=trace_id,
        thread_id=thread_id,
        task_id=task_id,
    )
    _store_task(
        task_id,
        {
            "taskId": result["taskId"],
            "traceId": result["traceId"],
            "status": _map_run_status(result.get("status", "failed")),
            "finalAnswer": result.get("finalAnswer", ""),
            "agentOutputs": result.get("agentOutputs") or {},
            "toolResults": result.get("toolResults") or [],
            "requiresApproval": result.get("requiresApproval", False),
            "error": result.get("error"),
            "trajectory": result.get("trajectory"),
        },
    )


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

    @app.post("/api/v1/agent/tasks")
    def create_task(
        body: CreateTaskRequest,
        x_trace_id: str | None = Header(default=None, alias="X-Trace-Id"),
    ) -> dict[str, Any]:
        tenant_id, user_id = _extract_identity(body.context)
        task_id = new_task_id()
        trace_id = x_trace_id or uuid.uuid4().hex
        thread_id = (body.context or {}).get("threadId") or (body.context or {}).get("thread_id")

        if body.async_:
            _store_task(
                task_id,
                {
                    "taskId": task_id,
                    "traceId": trace_id,
                    "status": "RUNNING",
                },
            )
            thread = threading.Thread(
                target=_run_task_and_store,
                kwargs={
                    "rt": runtime(),
                    "task_id": task_id,
                    "goal": body.goal,
                    "tenant_id": tenant_id,
                    "user_id": user_id,
                    "trace_id": trace_id,
                    "thread_id": thread_id,
                },
                daemon=True,
            )
            thread.start()
            return _success(
                {
                    "taskId": task_id,
                    "status": "RUNNING",
                    "traceId": trace_id,
                }
            )

        _run_task_and_store(
            runtime(),
            task_id=task_id,
            goal=body.goal,
            tenant_id=tenant_id,
            user_id=user_id,
            trace_id=trace_id,
            thread_id=thread_id,
        )
        stored = _get_task(task_id) or {}
        return _success(
            {
                "taskId": task_id,
                "status": stored.get("status", "FINISHED"),
                "traceId": trace_id,
            }
        )

    @app.get("/api/v1/agent/tasks/{task_id}")
    def get_task(task_id: str) -> dict[str, Any]:
        stored = _get_task(task_id)
        if stored is None:
            return _error(ERROR_RESOURCE_NOT_FOUND, "resource not found")

        data: dict[str, Any] = {
            "taskId": stored["taskId"],
            "status": stored["status"],
            "traceId": stored["traceId"],
        }
        if stored["status"] == "FINISHED":
            data["finalAnswer"] = stored.get("finalAnswer", "")
            data["agentOutputs"] = stored.get("agentOutputs") or {}
        elif stored["status"] == "FAILED":
            data["error"] = stored.get("error", "")
        return _success(data)

    @app.post("/api/v1/agent/chat")
    def chat(body: ChatRequest) -> dict[str, Any]:
        session_id = body.session_id or f"session_{uuid.uuid4().hex[:16]}"
        settings = get_settings()
        llm = runtime().ctx.llm
        messages = [
            SystemMessage(
                content=system_prompt("智能对话助手", settings)
                + "你是轻量级对话接口，仅提供建议性回复，不执行高风险工具调用。"
            ),
            HumanMessage(content=body.message),
        ]
        ai = llm.invoke(messages)
        reply = ai.content if isinstance(ai.content, str) else str(ai.content)
        suggested_agents = _suggest_agents(body.message)
        return _success(
            {
                "reply": reply,
                "suggestedAgents": suggested_agents,
                "sessionId": session_id,
            }
        )

    return app


app = create_app()
