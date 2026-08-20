from __future__ import annotations

from lingxi_agent_runtime.agents.base import AgentRuntimeContext, run_specialist
from lingxi_agent_runtime.state import AgentState


def market_analyst_node(ctx: AgentRuntimeContext):
    def _node(state: AgentState) -> dict:
        goal = state.get("goal", "工业泵 德国市场")
        return run_specialist(
            ctx,
            state,
            agent_key="market_analyst",
            role_name="市场分析智能体（首席市场分析师）",
            skill_id="market_trend_query",
            skill_payload={"keyword": goal, "region": "DE"},
            user_instruction="分析搜索趋势并给出市场机会判断。",
        )

    return _node
