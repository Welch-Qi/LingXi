from __future__ import annotations

import operator
from typing import Annotated, Any, Literal, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict, total=False):
    """跨智能体共享状态（LangGraph checkpointer 可持久化）。"""

    messages: Annotated[list[BaseMessage], add_messages]
    tenant_id: str
    user_id: str
    trace_id: str
    task_id: str
    goal: str
    # market_analyst | social_marketer | lead_miner | sales_converter | decision_officer | finish
    next_agent: str
    route_reason: str
    agent_outputs: Annotated[dict[str, Any], operator.or_]
    tool_results: Annotated[list[dict[str, Any]], operator.add]
    rag_context: str
    requires_approval: bool
    final_answer: str
    status: Literal["running", "completed", "failed", "awaiting_human"]
    error: str


AgentName = Literal[
    "market_analyst",
    "social_marketer",
    "lead_miner",
    "sales_converter",
    "decision_officer",
    "finish",
]
