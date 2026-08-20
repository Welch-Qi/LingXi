from __future__ import annotations

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from lingxi_agent_runtime.agents.base import AgentRuntimeContext, system_prompt
from lingxi_agent_runtime.rag.retriever import format_rag_block
from lingxi_agent_runtime.state import AgentState


def decision_officer_node(ctx: AgentRuntimeContext):
    def _node(state: AgentState) -> dict:
        tenant_id = state.get("tenant_id", "")
        user_id = state.get("user_id", "")
        trace_id = state.get("trace_id", "")
        goal = state.get("goal", "")

        kpi = ctx.tools.call(
            "decision_kpi_query",
            {"metric": "lead_conversion_rate", "period": "last_7d"},
            tenant_id=tenant_id,
            user_id=user_id,
            trace_id=trace_id,
        )
        prior = state.get("agent_outputs") or {}
        rag = state.get("rag_context") or ""

        messages = [
            SystemMessage(content=system_prompt("智能决策智能体（首席数据官/协调者）", ctx.settings)),
            HumanMessage(
                content=(
                    f"业务目标：{goal}\n"
                    f"上游智能体输出：{prior}\n"
                    f"KPI：{kpi}\n"
                    f"{format_rag_block(rag)}\n"
                    "请汇总结论，给出可执行建议；若存在高风险动作，提醒人工接管。"
                )
            ),
        ]
        ai = ctx.llm.invoke(messages)
        content = ai.content if isinstance(ai.content, str) else str(ai.content)

        outputs = dict(prior)
        outputs["decision_officer"] = {"summary": content, "kpi": kpi}

        status = "awaiting_human" if state.get("requires_approval") else "completed"
        return {
            "messages": [AIMessage(content=f"[decision_officer] {content}")],
            "agent_outputs": outputs,
            "tool_results": [kpi],
            "final_answer": content,
            "next_agent": "finish",
            "status": status,
        }

    return _node
