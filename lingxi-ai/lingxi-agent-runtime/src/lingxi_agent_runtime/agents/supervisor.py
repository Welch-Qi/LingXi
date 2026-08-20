from __future__ import annotations

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from lingxi_agent_runtime.agents.base import AgentRuntimeContext, system_prompt
from lingxi_agent_runtime.agents.decision_officer import decision_officer_node
from lingxi_agent_runtime.agents.lead_miner import lead_miner_node
from lingxi_agent_runtime.agents.market_analyst import market_analyst_node
from lingxi_agent_runtime.agents.sales_converter import sales_converter_node
from lingxi_agent_runtime.agents.social_marketer import social_marketer_node
from lingxi_agent_runtime.prompts import BRAIN_AGENT_ALIASES, resolve_agent_key
from lingxi_agent_runtime.state import AgentState

VALID_AGENTS = {
    "market_analyst",
    "social_marketer",
    "lead_miner",
    "sales_converter",
    "decision_officer",
    "finish",
}

# Brain 旧名也允许出现在模型输出中
_ALIAS_HINT = " | ".join(sorted(BRAIN_AGENT_ALIASES.keys()))


def supervisor_node(ctx: AgentRuntimeContext):
    def _node(state: AgentState) -> dict:
        goal = state.get("goal", "")
        messages = [
            SystemMessage(
                content=system_prompt("多智能体协作总线路由员", ctx.settings)
                + " 你必须只回复一个 next_agent 名称："
                + " market_analyst | social_marketer | lead_miner | sales_converter | decision_officer | finish"
                + f"（兼容旧名：{_ALIAS_HINT}）"
            ),
            HumanMessage(
                content=(
                    f"用户目标：{goal}\n"
                    f"已有输出键：{list((state.get('agent_outputs') or {}).keys())}\n"
                    "选择下一个智能体。若已有专项结论且需要汇总，选择 decision_officer；"
                    "若已完成汇总，选择 finish。\n"
                    "请输出 next_agent=..."
                )
            ),
        ]
        ai = ctx.llm.invoke(messages)
        text = (ai.content if isinstance(ai.content, str) else str(ai.content)).strip().lower()

        chosen = "decision_officer"
        for name in list(VALID_AGENTS) + list(BRAIN_AGENT_ALIASES.keys()):
            if name in text:
                chosen = resolve_agent_key(name)
                break

        # 简单防环：同一专项智能体已产出则转向决策汇总
        outputs = state.get("agent_outputs") or {}
        if chosen in outputs and chosen != "decision_officer":
            chosen = "decision_officer"
        if chosen == "decision_officer" and "decision_officer" in outputs:
            chosen = "finish"

        return {
            "next_agent": chosen,
            "route_reason": text[:500],
            "status": "running",
        }

    return _node


def build_supervisor_graph(ctx: AgentRuntimeContext, *, checkpointer: bool = True):
    """
    多智能体协作总线：
    START -> supervisor -> (五大智能体之一) -> supervisor -> ... -> decision_officer -> END
    """

    graph = StateGraph(AgentState)
    graph.add_node("supervisor", supervisor_node(ctx))
    graph.add_node("market_analyst", market_analyst_node(ctx))
    graph.add_node("social_marketer", social_marketer_node(ctx))
    graph.add_node("lead_miner", lead_miner_node(ctx))
    graph.add_node("sales_converter", sales_converter_node(ctx))
    graph.add_node("decision_officer", decision_officer_node(ctx))

    graph.add_edge(START, "supervisor")

    def _route(state: AgentState) -> str:
        nxt = state.get("next_agent") or "decision_officer"
        if nxt not in VALID_AGENTS or nxt == "finish":
            return "end"
        return nxt

    graph.add_conditional_edges(
        "supervisor",
        _route,
        {
            "market_analyst": "market_analyst",
            "social_marketer": "social_marketer",
            "lead_miner": "lead_miner",
            "sales_converter": "sales_converter",
            "decision_officer": "decision_officer",
            "end": END,
        },
    )

    for specialist in (
        "market_analyst",
        "social_marketer",
        "lead_miner",
        "sales_converter",
    ):
        graph.add_edge(specialist, "supervisor")

    graph.add_edge("decision_officer", END)

    memory = MemorySaver() if checkpointer else None
    return graph.compile(checkpointer=memory)
