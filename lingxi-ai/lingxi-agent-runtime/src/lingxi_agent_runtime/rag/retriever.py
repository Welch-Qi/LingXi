from __future__ import annotations

from typing import Any

from lingxi_agent_runtime.tools.mcp_client import McpToolClient


class KnowledgeRetriever:
    """知识中心 RAG 检索封装（经 knowledge_rag_search 技能，带租户上下文）。"""

    def __init__(self, tools: McpToolClient) -> None:
        self.tools = tools

    def retrieve(self, query: str, *, tenant_id: str, user_id: str, trace_id: str = "") -> str:
        result = self.tools.call(
            "knowledge_rag_search",
            {"query": query},
            tenant_id=tenant_id,
            user_id=user_id,
            trace_id=trace_id,
        )
        hits = result.get("result", {}).get("hits", [])
        if not hits:
            return ""
        lines = [f"- [{h.get('id')}] {h.get('title')}: {h.get('snippet')}" for h in hits]
        return "知识依据：\n" + "\n".join(lines)


def format_rag_block(rag_context: str) -> str:
    return rag_context.strip() if rag_context else "（无额外知识片段）"
