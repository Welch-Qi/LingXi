"""提示词编码目录（与知识中心 kc_prompt.prompt_code 对齐，禁止业务内联长提示词）。"""

from __future__ import annotations

# 一期种子：见 R__novatech_demo_seed.sql
PROMPT_CATALOG: dict[str, str] = {
    "market_analyst": "prompt.market.opportunity.scan.v1",
    "social_marketer": "prompt.mkg.content.generate.v1",
    "content_creator": "prompt.mkg.content.generate.v1",  # Brain 别名
    "lead_miner": "prompt.market.opportunity.scan.v1",
    "sales_converter": "prompt.mkg.content.generate.v1",
    "sales_assistant": "prompt.mkg.content.generate.v1",  # Brain 别名
    "decision_officer": "prompt.market.opportunity.scan.v1",
}

# Brain → 主仓 Runtime 角色映射
BRAIN_AGENT_ALIASES: dict[str, str] = {
    "content_creator": "social_marketer",
    "sales_assistant": "sales_converter",
}


def resolve_agent_key(name: str) -> str:
    key = (name or "").strip().lower()
    return BRAIN_AGENT_ALIASES.get(key, key)


def prompt_code_for(agent_key: str) -> str | None:
    return PROMPT_CATALOG.get(resolve_agent_key(agent_key))
