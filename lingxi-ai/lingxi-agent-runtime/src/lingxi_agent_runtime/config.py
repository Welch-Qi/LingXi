from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="LINGXI_", env_file=".env", extra="ignore")

    # OpenAI-compatible Agent 网关
    llm_base_url: str = "http://localhost:8088/v1"
    llm_api_key: str = "changeme"
    llm_model: str = "gpt-4o-mini"

    # true 时不调用真实模型，使用确定性 Mock LLM（本地联调）
    agent_mock_llm: bool = True

    # 业务 API / MCP
    biz_api_base_url: str = "http://localhost:8080"
    mcp_base_url: str = "http://localhost:8080/mcp"

    # 服务
    host: str = "0.0.0.0"
    port: int = 8090

    # 企业公约注入（简化：本地配置；生产由配置中心下发）
    brand_constraints: str = "内容需专业、合规，禁止夸大宣传与敏感词。"


@lru_cache
def get_settings() -> Settings:
    return Settings()
