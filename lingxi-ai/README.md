# lingxi-ai

Python 工程（uv workspace）：Agent Runtime 与全球市场数据任务。与 Java 业务栈解耦，仅通过 Agent 网关、MCP 工具、领域事件与受控 API 交互。

## 结构

- `lingxi-agent-runtime`：LangGraph 多智能体运行时（五大智能体 + Supervisor 协作总线）
- `lingxi-data-jobs`：外部数据源拉取、限速与质量监控

## 环境

- Python **3.11**（见 `.python-version`）
- 推荐使用 [uv](https://github.com/astral-sh/uv)

```bash
cd lingxi-ai
uv sync
```

## Agent Runtime（LangGraph）

默认 `LINGXI_AGENT_MOCK_LLM=true`，不依赖真实模型即可跑通图。

```bash
# 执行一次协作任务
uv run --directory lingxi-agent-runtime python -m lingxi_agent_runtime.main run \
  --goal "分析德国工业泵市场机会" --tenant-id 1 --user-id u_admin

# 启动 HTTP 服务（默认 :8090）
uv run --directory lingxi-agent-runtime python -m lingxi_agent_runtime.main serve

# 测试
uv run --directory lingxi-agent-runtime pytest -q
```

Windows 若 `uv run` 因路径编码异常，可：

```bash
set PYTHONPATH=lingxi-agent-runtime\src
.venv\Scripts\python.exe -m lingxi_agent_runtime.main run --goal "分析德国工业泵市场机会" --tenant-id 1 --user-id u_admin
```

对接真实模型（经 Agent/LLM 网关 OpenAI 兼容接口）：

```bash
set LINGXI_AGENT_MOCK_LLM=false
set LINGXI_LLM_BASE_URL=http://localhost:8088/v1
set LINGXI_LLM_API_KEY=sk-xxx
set LINGXI_LLM_MODEL=gpt-4o-mini
```

图结构：`START → supervisor → {market_analyst|social_marketer|lead_miner|sales_converter|decision_officer} → … → END`  
技能必须先注册（见 `tools/mock_tools.py`）；高风险技能会将任务置为 `awaiting_human`。

更多说明见仓库根目录 `docs/Agent-Runtime-LangGraph说明.md`。
