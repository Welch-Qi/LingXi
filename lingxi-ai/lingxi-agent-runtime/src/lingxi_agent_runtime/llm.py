from __future__ import annotations

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from langchain_openai import ChatOpenAI

from lingxi_agent_runtime.config import Settings, get_settings


class MockChatModel(BaseChatModel):
    """确定性 Mock：本地无模型密钥时跑通 LangGraph。"""

    @property
    def _llm_type(self) -> str:
        return "lingxi-mock"

    def _generate(self, messages, stop=None, run_manager=None, **kwargs) -> ChatResult:  # type: ignore[no-untyped-def]
        last = messages[-1].content if messages else ""
        text = str(last).lower()
        if "route" in text or "选择下一个" in text or "next_agent" in text:
            content = self._route(text)
        elif "市场" in text or "market" in text or "趋势" in text:
            content = (
                "【市场分析】目标市场搜索热度上升，建议优先德国/东南亚。"
                "已调用 market_trend_query；机会评分 78。"
            )
        elif "社媒" in text or "social" in text:
            content = "【社媒营销】已生成多语言帖文草稿，并登记发布任务（mock）。"
        elif "潜客" in text or "lead" in text or "邮件" in text:
            content = "【潜客挖掘】已生成开发信多版本，并创建触达任务（mock）。"
        elif "销售" in text or "sales" in text or "商机" in text:
            content = "【销售转化】线索已评分并建议分配给负责销售（mock）。"
        elif "决策" in text or "decision" in text or "roi" in text:
            content = "【智能决策】本周线索转化率下降，建议加大高潜市场触达权重（mock）。"
        else:
            content = "已完成任务规划与工具调用（mock）。结论：建议进入下一业务环节。"
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=content))])

    def _route(self, text: str) -> str:
        if any(k in text for k in ("社媒", "social", "tiktok", "linkedin")):
            return "social_marketer"
        if any(k in text for k in ("潜客", "邮件", "whatsapp", "edm", "触达")):
            return "lead_miner"
        if any(k in text for k in ("销售", "线索", "商机", "客户")):
            return "sales_converter"
        if any(k in text for k in ("决策", "roi", "预警", "归因", "看板")):
            return "decision_officer"
        if any(k in text for k in ("市场", "热词", "趋势", "贸易")):
            return "market_analyst"
        return "decision_officer"


def build_llm(settings: Settings | None = None) -> BaseChatModel:
    cfg = settings or get_settings()
    if cfg.agent_mock_llm:
        return MockChatModel()
    return ChatOpenAI(
        base_url=cfg.llm_base_url,
        api_key=cfg.llm_api_key,
        model=cfg.llm_model,
        temperature=0.2,
    )
