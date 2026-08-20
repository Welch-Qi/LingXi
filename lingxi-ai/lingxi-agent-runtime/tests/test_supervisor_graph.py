from __future__ import annotations

from lingxi_agent_runtime.runtime import AgentRuntime


def test_supervisor_graph_market_goal_mock() -> None:
    runtime = AgentRuntime()
    assert runtime.settings.agent_mock_llm is True

    result = runtime.run(
        "分析德国市场工业泵搜索趋势与机会",
        tenant_id="1",
        user_id="u_admin",
    )
    assert result["status"] in {"completed", "awaiting_human"}
    assert result["taskId"]
    assert "market_analyst" in result["agentOutputs"] or "decision_officer" in result["agentOutputs"]
    assert result["finalAnswer"] or result["agentOutputs"]


def test_unregistered_skill_rejected() -> None:
    runtime = AgentRuntime()
    try:
        runtime.ctx.tools.call(
            "not_exists_skill",
            {},
            tenant_id="1",
            user_id="u_admin",
        )
        assert False, "expected PermissionError"
    except PermissionError as ex:
        assert "not registered" in str(ex)
