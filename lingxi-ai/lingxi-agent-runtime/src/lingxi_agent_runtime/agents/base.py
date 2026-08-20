from __future__ import annotations

from typing import Any

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from lingxi_agent_runtime.config import Settings, get_settings
from lingxi_agent_runtime.prompts import prompt_code_for
from lingxi_agent_runtime.rag.retriever import KnowledgeRetriever, format_rag_block
from lingxi_agent_runtime.state import AgentState
from lingxi_agent_runtime.tools.mcp_client import McpToolClient


class AgentRuntimeContext:
    def __init__(
        self,
        llm: BaseChatModel,
        tools: McpToolClient,
        retriever: KnowledgeRetriever,
        settings: Settings | None = None,
    ) -> None:
        self.llm = llm
        self.tools = tools
        self.retriever = retriever
        self.settings = settings or get_settings()


def system_prompt(role: str, settings: Settings, *, agent_key: str | None = None) -> str:
    code = prompt_code_for(agent_key) if agent_key else None
    code_hint = f"提示词编码：{code}。" if code else ""
    return (
        f"你是灵犀系统的{role}。"
        f"{code_hint}"
        f"必须遵守企业公约约束：{settings.brand_constraints}"
        "只基于工具结果与给定上下文作答，不要编造未提供的客户隐私数据。"
    )


def run_specialist(
    ctx: AgentRuntimeContext,
    state: AgentState,
    *,
    agent_key: str,
    role_name: str,
    skill_id: str,
    skill_payload: dict[str, Any],
    user_instruction: str,
) -> dict[str, Any]:
    tenant_id = state.get("tenant_id", "")
    user_id = state.get("user_id", "")
    trace_id = state.get("trace_id", "")
    goal = state.get("goal", "")

    rag = ctx.retriever.retrieve(goal or user_instruction, tenant_id=tenant_id, user_id=user_id, trace_id=trace_id)
    tool_result = ctx.tools.call(
        skill_id,
        skill_payload,
        tenant_id=tenant_id,
        user_id=user_id,
        trace_id=trace_id,
    )

    messages = [
        SystemMessage(content=system_prompt(role_name, ctx.settings, agent_key=agent_key)),
        HumanMessage(
            content=(
                f"任务目标：{goal}\n"
                f"补充指令：{user_instruction}\n"
                f"{format_rag_block(rag)}\n"
                f"工具 {skill_id} 返回：{tool_result}\n"
                "请输出简洁结论与下一步建议。"
            )
        ),
    ]
    ai = ctx.llm.invoke(messages)
    content = ai.content if isinstance(ai.content, str) else str(ai.content)

    outputs = dict(state.get("agent_outputs") or {})
    outputs[agent_key] = {"summary": content, "tool": tool_result}

    requires_approval = bool(tool_result.get("highRisk")) or bool(
        tool_result.get("result", {}).get("requiresApproval")
    )

    return {
        "messages": [AIMessage(content=f"[{agent_key}] {content}")],
        "agent_outputs": outputs,
        "tool_results": [tool_result],
        "rag_context": rag,
        "requires_approval": state.get("requires_approval", False) or requires_approval,
        "next_agent": "decision_officer",
        "status": "awaiting_human" if requires_approval else "running",
    }
