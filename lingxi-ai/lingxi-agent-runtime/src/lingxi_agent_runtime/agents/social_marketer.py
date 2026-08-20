from __future__ import annotations

from lingxi_agent_runtime.agents.base import AgentRuntimeContext, run_specialist
from lingxi_agent_runtime.state import AgentState


def social_marketer_node(ctx: AgentRuntimeContext):
    def _node(state: AgentState) -> dict:
        goal = state.get("goal", "product launch")
        topic = goal
        locale = "en-US"
        if "| locale=" in goal:
            left, right = goal.split("| locale=", 1)
            topic = left.strip() or topic
            locale = (right.strip().split() or ["en-US"])[0]
        return run_specialist(
            ctx,
            state,
            agent_key="social_marketer",
            role_name="社媒营销智能体（社媒营销总监）",
            skill_id="social_content_generate",
            skill_payload={"topic": topic, "locale": locale},
            user_instruction="生成符合品牌调性的社媒内容草稿。",
        )

    return _node
