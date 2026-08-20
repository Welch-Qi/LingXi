from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable


@dataclass(frozen=True)
class SkillMeta:
    skill_id: str
    name: str
    domain: str
    description: str
    perm_codes: tuple[str, ...]
    high_risk: bool = False
    timeout_ms: int = 5000
    version: str = "1"
    input_schema: dict[str, Any] = field(default_factory=dict)


SkillHandler = Callable[[dict[str, Any], dict[str, str]], dict[str, Any]]


class SkillRegistry:
    """技能目录：未注册技能禁止被 Runtime 调用。"""

    def __init__(self) -> None:
        self._meta: dict[str, SkillMeta] = {}
        self._handlers: dict[str, SkillHandler] = {}

    def register(self, meta: SkillMeta, handler: SkillHandler) -> None:
        self._meta[meta.skill_id] = meta
        self._handlers[meta.skill_id] = handler

    def get(self, skill_id: str) -> SkillMeta:
        if skill_id not in self._meta:
            raise PermissionError(f"skill not registered: {skill_id}")
        return self._meta[skill_id]

    def invoke(self, skill_id: str, payload: dict[str, Any], ctx: dict[str, str]) -> dict[str, Any]:
        meta = self.get(skill_id)
        handler = self._handlers[skill_id]
        result = handler(payload, ctx)
        return {
            "skillId": skill_id,
            "version": meta.version,
            "highRisk": meta.high_risk,
            "result": result,
        }

    def list_skills(self) -> list[SkillMeta]:
        return list(self._meta.values())


def default_registry() -> SkillRegistry:
    from lingxi_agent_runtime.tools.mock_tools import register_mock_skills

    registry = SkillRegistry()
    register_mock_skills(registry)
    return registry
