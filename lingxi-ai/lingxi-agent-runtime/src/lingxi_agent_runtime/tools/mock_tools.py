from __future__ import annotations

from typing import Any

from lingxi_agent_runtime.tools.registry import SkillMeta, SkillRegistry


def register_mock_skills(registry: SkillRegistry) -> None:
    registry.register(
        SkillMeta(
            skill_id="market_trend_query",
            name="市场趋势查询",
            domain="globalmarket",
            description="查询搜索指数/热词趋势",
            perm_codes=("gm:trend:view",),
            input_schema={"type": "object", "properties": {"keyword": {"type": "string"}, "region": {"type": "string"}}},
        ),
        _market_trend_query,
    )
    registry.register(
        SkillMeta(
            skill_id="social_content_generate",
            name="社媒内容生成",
            domain="ops",
            description="生成多语言社媒图文草稿",
            perm_codes=("ops:mkg:content:create",),
            input_schema={"type": "object", "properties": {"topic": {"type": "string"}, "locale": {"type": "string"}}},
        ),
        _social_content_generate,
    )
    registry.register(
        SkillMeta(
            skill_id="mkt_campaign_launch",
            name="营销触达任务创建",
            domain="ops",
            description="创建邮件/WhatsApp 触达任务",
            perm_codes=("ops:mkg:campaign:create",),
            high_risk=True,
            input_schema={"type": "object", "properties": {"channel": {"type": "string"}, "audience": {"type": "string"}}},
        ),
        _mkt_campaign_launch,
    )
    registry.register(
        SkillMeta(
            skill_id="sales_lead_assign",
            name="线索分配",
            domain="ops",
            description="按规则分配线索",
            perm_codes=("sal:lead:assign",),
            high_risk=True,
            input_schema={"type": "object", "properties": {"leadId": {"type": "string"}, "ownerId": {"type": "string"}}},
        ),
        _sales_lead_assign,
    )
    registry.register(
        SkillMeta(
            skill_id="decision_kpi_query",
            name="经营指标查询",
            domain="decision",
            description="查询核心 KPI（受控指标层）",
            perm_codes=("dm:insight:view",),
            input_schema={"type": "object", "properties": {"metric": {"type": "string"}, "period": {"type": "string"}}},
        ),
        _decision_kpi_query,
    )
    registry.register(
        SkillMeta(
            skill_id="knowledge_rag_search",
            name="知识检索",
            domain="knowledge",
            description="按租户与权限检索知识片段",
            perm_codes=("kc:knowledge:view",),
            input_schema={"type": "object", "properties": {"query": {"type": "string"}}},
        ),
        _knowledge_rag_search,
    )


def _ctx_ok(ctx: dict[str, str]) -> None:
    if not ctx.get("tenant_id") or not ctx.get("user_id"):
        raise PermissionError("missing tenant/user context")


def _market_trend_query(payload: dict[str, Any], ctx: dict[str, str]) -> dict[str, Any]:
    _ctx_ok(ctx)
    keyword = payload.get("keyword", "industrial pump")
    region = payload.get("region", "DE")
    return {
        "keyword": keyword,
        "region": region,
        "trend": "up",
        "score": 78,
        "source": "mock-globalmarket",
    }


def _social_content_generate(payload: dict[str, Any], ctx: dict[str, str]) -> dict[str, Any]:
    _ctx_ok(ctx)
    topic = payload.get("topic", "product launch")
    locale = payload.get("locale", "en-US")
    if str(locale).lower().startswith("zh"):
        draft = (
            f"【{locale}】主题：{topic}\n"
            "Hook：海外买家正在关注高可靠储能方案。\n"
            "卖点：安全认证 · 快速交付 · 本地化支持。\n"
            "CTA：留言获取产品手册与报价。"
        )
    else:
        draft = (
            f"[{locale}] Discover our latest {topic} — reliable quality for global buyers. "
            "Key benefits: certified safety, fast delivery, local support. CTA: DM for brochure & quote."
        )
    return {
        "topic": topic,
        "locale": locale,
        "draft": draft,
    }


def _mkt_campaign_launch(payload: dict[str, Any], ctx: dict[str, str]) -> dict[str, Any]:
    _ctx_ok(ctx)
    return {
        "campaignId": "cmp_mock_001",
        "channel": payload.get("channel", "email"),
        "audience": payload.get("audience", "warm-leads"),
        "status": "queued",
        "requiresApproval": True,
    }


def _sales_lead_assign(payload: dict[str, Any], ctx: dict[str, str]) -> dict[str, Any]:
    _ctx_ok(ctx)
    return {
        "leadId": payload.get("leadId", "lead_mock_001"),
        "ownerId": payload.get("ownerId", "u_sales"),
        "status": "assigned",
    }


def _decision_kpi_query(payload: dict[str, Any], ctx: dict[str, str]) -> dict[str, Any]:
    _ctx_ok(ctx)
    return {
        "metric": payload.get("metric", "lead_conversion_rate"),
        "period": payload.get("period", "last_7d"),
        "value": 0.126,
        "wow": -0.03,
    }


def _knowledge_rag_search(payload: dict[str, Any], ctx: dict[str, str]) -> dict[str, Any]:
    _ctx_ok(ctx)
    query = payload.get("query", "")
    return {
        "query": query,
        "hits": [
            {
                "id": "kc_tpl_001",
                "title": "冷开发信模板-工业品",
                "snippet": "Keep the first email under 120 words; focus on buyer pain.",
            }
        ],
    }
