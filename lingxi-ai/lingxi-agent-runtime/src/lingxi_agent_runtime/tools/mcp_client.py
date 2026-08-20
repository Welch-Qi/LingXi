from __future__ import annotations

from typing import Any

import httpx

from lingxi_agent_runtime.config import Settings, get_settings
from lingxi_agent_runtime.tools.registry import SkillRegistry


class McpToolClient:
    """
    经业务域 / MCP 调用技能。
    一期默认走本地 SkillRegistry mock；配置 MCP 地址后可切换 HTTP。
    """

    def __init__(self, registry: SkillRegistry, settings: Settings | None = None) -> None:
        self.registry = registry
        self.settings = settings or get_settings()

    def call(
        self,
        skill_id: str,
        payload: dict[str, Any],
        *,
        tenant_id: str,
        user_id: str,
        trace_id: str = "",
        use_http: bool = False,
    ) -> dict[str, Any]:
        ctx = {"tenant_id": tenant_id, "user_id": user_id, "trace_id": trace_id}
        # 未注册直接拒绝
        self.registry.get(skill_id)
        if not use_http:
            return self.registry.invoke(skill_id, payload, ctx)

        headers = {
            "X-Tenant-Id": tenant_id,
            "X-User-Id": user_id,
            "X-Trace-Id": trace_id,
            "Content-Type": "application/json",
        }
        url = f"{self.settings.mcp_base_url.rstrip('/')}/tools/{skill_id}/invoke"
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, json={"input": payload}, headers=headers)
            resp.raise_for_status()
            return resp.json()
