from __future__ import annotations

import uuid
from typing import Any

from langchain_core.messages import HumanMessage

from lingxi_agent_runtime.agents.base import AgentRuntimeContext
from lingxi_agent_runtime.agents.supervisor import build_supervisor_graph
from lingxi_agent_runtime.config import Settings, get_settings
from lingxi_agent_runtime.llm import build_llm
from lingxi_agent_runtime.obs.trajectory import TrajectoryRecorder, new_task_id
from lingxi_agent_runtime.rag.retriever import KnowledgeRetriever
from lingxi_agent_runtime.tools.mcp_client import McpToolClient
from lingxi_agent_runtime.tools.registry import default_registry


class AgentRuntime:
    """Agent Runtime 门面：构建图、执行任务、返回轨迹。"""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        registry = default_registry()
        tools = McpToolClient(registry, self.settings)
        retriever = KnowledgeRetriever(tools)
        llm = build_llm(self.settings)
        self.ctx = AgentRuntimeContext(llm=llm, tools=tools, retriever=retriever, settings=self.settings)
        self.graph = build_supervisor_graph(self.ctx, checkpointer=True)
        self.skills = registry.list_skills()

    def run(
        self,
        goal: str,
        *,
        tenant_id: str,
        user_id: str,
        trace_id: str | None = None,
        thread_id: str | None = None,
        task_id: str | None = None,
    ) -> dict[str, Any]:
        task_id = task_id or new_task_id()
        trace = trace_id or uuid.uuid4().hex
        recorder = TrajectoryRecorder(task_id=task_id)
        recorder.log("task_started", "supervisor", goal=goal, tenantId=tenant_id, userId=user_id)

        config = {"configurable": {"thread_id": thread_id or task_id}}
        initial: dict[str, Any] = {
            "messages": [HumanMessage(content=goal)],
            "tenant_id": tenant_id,
            "user_id": user_id,
            "trace_id": trace,
            "task_id": task_id,
            "goal": goal,
            "agent_outputs": {},
            "tool_results": [],
            "requires_approval": False,
            "status": "running",
        }

        try:
            final_state = self.graph.invoke(initial, config=config)
            recorder.log(
                "task_finished",
                "supervisor",
                status=final_state.get("status"),
                next_agent=final_state.get("next_agent"),
            )
            return {
                "taskId": task_id,
                "traceId": trace,
                "status": final_state.get("status", "completed"),
                "finalAnswer": final_state.get("final_answer", ""),
                "requiresApproval": bool(final_state.get("requires_approval")),
                "agentOutputs": final_state.get("agent_outputs") or {},
                "toolResults": final_state.get("tool_results") or [],
                "trajectory": recorder.to_dict(),
            }
        except Exception as ex:  # noqa: BLE001
            recorder.log("task_failed", "supervisor", error=str(ex))
            return {
                "taskId": task_id,
                "traceId": trace,
                "status": "failed",
                "error": str(ex),
                "finalAnswer": "",
                "requiresApproval": False,
                "agentOutputs": {},
                "toolResults": [],
                "trajectory": recorder.to_dict(),
            }
