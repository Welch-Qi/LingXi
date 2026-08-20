from __future__ import annotations

from lingxi_agent_runtime.agents.base import AgentRuntimeContext, run_specialist
from lingxi_agent_runtime.state import AgentState


def lead_miner_node(ctx: AgentRuntimeContext):
    def _node(state: AgentState) -> dict:
        return run_specialist(
            ctx,
            state,
            agent_key="lead_miner",
            role_name="潜客挖掘智能体（营销触达引擎）",
            skill_id="mkt_campaign_launch",
            skill_payload={"channel": "email", "audience": "warm-leads"},
            user_instruction="规划多轮开发信触达任务（高风险需人工确认）。",
        )

    return _node
