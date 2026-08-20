from __future__ import annotations

from lingxi_agent_runtime.agents.base import AgentRuntimeContext, run_specialist
from lingxi_agent_runtime.state import AgentState


def sales_converter_node(ctx: AgentRuntimeContext):
    def _node(state: AgentState) -> dict:
        return run_specialist(
            ctx,
            state,
            agent_key="sales_converter",
            role_name="销售转化智能体（销售运营总监）",
            skill_id="sales_lead_assign",
            skill_payload={"leadId": "lead_mock_001", "ownerId": state.get("user_id", "u_sales")},
            user_instruction="对线索评分并给出分配建议（高风险需人工确认）。",
        )

    return _node
