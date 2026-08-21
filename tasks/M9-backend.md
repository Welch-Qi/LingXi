# M9-backend 任务简报：AI Agent Runtime 契约端点实现

## 任务概述

M9 AI Agent Runtime 是 Python/LangGraph 工程。现有代码仅有同步 `POST /api/v1/agent/run` 端点，contracts.md 定义了 3 个契约端点全部缺失。本任务目标是：**实现 3 个契约端点 + 测试**。

## 仓库信息

- 仓库：https://github.com/Welch-Qi/LingXi.git
- 基线分支：main
- 工作分支：cursor/feat-m9-backend

## 现有代码分析

### 项目结构

```
lingxi-ai/
  lingxi-agent-runtime/
    pyproject.toml
    src/lingxi_agent_runtime/
      api.py              — FastAPI 入口
      runtime.py          — AgentRuntime 门面
      config.py           — Settings (pydantic-settings)
      agents/
        supervisor.py     — LangGraph supervisor 图
        base.py           — AgentRuntimeContext + run_specialist
        market_analyst.py
        social_marketer.py
        lead_miner.py
        sales_converter.py
        decision_officer.py
      tools/
        registry.py       — SkillRegistry
        mcp_client.py     — McpToolClient
        mock_tools.py     — 6 个 mock 技能
    tests/
      test_supervisor_graph.py
```

### 已有端点（api.py）

| 方法 | 路径 | 说明 | 契约对照 |
|------|------|------|---------|
| GET | `/health` | 健康检查 | 非契约 |
| GET | `/api/v1/skills` | 列出技能 | 非契约 |
| POST | `/api/v1/agent/run` | 同步执行 | ❌ 不符契约 |

### 契约端点（contracts.md M9.2）

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| POST | `/api/v1/agent/tasks` | 创建智能体任务（异步） | 缺失 |
| GET | `/api/v1/agent/tasks/{id}` | 查询任务状态与结果 | 缺失 |
| POST | `/api/v1/agent/chat` | 智能体对话接口 | 缺失 |

### AgentRuntime.run() 返回结构（现有）

```python
{
    "taskId": "task_xxxx",
    "traceId": "xxxx",
    "status": "completed" | "awaiting_human" | "failed",
    "finalAnswer": "...",
    "requiresApproval": bool,
    "agentOutputs": dict,
    "toolResults": list,
    "trajectory": {...}
}
```

## 任务清单

### 任务 1：实现 POST /api/v1/agent/tasks

在 `api.py` 中新增 `POST /api/v1/agent/tasks` 端点：

请求体：
```json
{
  "goal": "分析东南亚市场趋势",
  "context": {"optional": "context data"},
  "async": true
}
```

行为：
- 调用 `AgentRuntime.run()` 执行智能体任务
- `async=true` 时立即返回 taskId（后台执行），`async=false` 时同步等待结果
- 返回统一响应体格式（与 Java 后端一致）：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "taskId": "task_xxxx",
    "status": "RUNNING",
    "traceId": "xxxx"
  }
}
```

保留现有 `POST /api/v1/agent/run` 端点不变（向后兼容）。

### 任务 2：实现 GET /api/v1/agent/tasks/{id}

新增 `GET /api/v1/agent/tasks/{task_id}` 端点：

行为：
- 查询任务状态和结果
- 如果任务仍在运行，返回 `status: "RUNNING"`
- 如果任务完成，返回完整结果（含 finalAnswer、agentOutputs）
- 如果任务不存在，返回 `code: 30005`（资源不存在）

返回格式：
```json
{
  "code": 0,
  "data": {
    "taskId": "task_xxxx",
    "status": "FINISHED",
    "finalAnswer": "...",
    "agentOutputs": {},
    "traceId": "xxxx"
  }
}
```

实现说明：
- 使用内存字典存储任务结果（`_task_store: dict[str, dict]`）
- 同步执行的任务在 run() 完成后立即写入 store
- 异步任务在后台线程完成后写入 store

### 任务 3：实现 POST /api/v1/agent/chat

新增 `POST /api/v1/agent/chat` 端点：

请求体：
```json
{
  "message": "帮我看看最近的热门市场",
  "sessionId": "session_xxx"
}
```

行为：
- 轻量级对话接口，直接调用 supervisor 的 LLM 路由
- 不走完整 AgentRuntime.run() 流程（不触发高风险技能）
- 返回建议性回复

返回格式：
```json
{
  "code": 0,
  "data": {
    "reply": "根据当前数据，东南亚市场...",
    "suggestedAgents": ["market_analyst"],
    "sessionId": "session_xxx"
  }
}
```

实现说明：
- 使用 `config.py` 中的 LLM 配置（Mock 或真实 OpenAI）
- Mock 模式下返回预设回复
- sessionId 可选，不传则生成新的

### 任务 4：补充测试

在 `lingxi-agent-runtime/tests/` 下创建 `test_api.py`：

测试用例（使用 FastAPI TestClient）：
1. `test_create_task_sync` — POST /api/v1/agent/tasks async=false，验证返回 taskId + status=FINISHED
2. `test_get_task_status` — 先创建任务，再 GET /api/v1/agent/tasks/{id} 查询状态
3. `test_get_task_not_found` — GET 不存在的 taskId，验证返回 code 非 0
4. `test_chat` — POST /api/v1/agent/chat，验证返回 reply 字段
5. `test_health` — GET /health 返回 200
6. `test_list_skills` — GET /api/v1/skills 返回技能列表

### 任务 5：Java 代理层对齐（可选）

如果 `lingxi-agent/src/main/java/com/lingxi/agent/app/AgentController.java` 中的 `POST /api/v1/agents/run` 代理端点仍在，确保它继续指向 Python 的 `/api/v1/agent/run`（向后兼容）。新增的契约端点由前端直接调用 Python Runtime 或通过 Java 代理转发。

## 验收标准

1. `POST /api/v1/agent/tasks` 端点存在且可创建任务
2. `GET /api/v1/agent/tasks/{id}` 端点存在且可查询任务状态
3. `POST /api/v1/agent/chat` 端点存在且可返回回复
4. 现有 `POST /api/v1/agent/run` 保持不变
5. `test_api.py` 至少 6 个测试全通过
6. 现有 `test_supervisor_graph.py` 测试仍通过

## 回传协议

完成后将结果写入 `artifacts/M9-backend/result.json`，格式：

```json
{
  "taskId": "M9-backend",
  "status": "COMPLETED",
  "summary": "一句话描述完成情况",
  "tests": {
    "total": 8,
    "passed": 8,
    "failed": 0,
    "skipped": 0
  },
  "filesChanged": 5,
  "linesAdded": 300,
  "contractChecks": [
    {"endpoint": "POST /api/v1/agent/tasks", "status": "PASS"},
    {"endpoint": "GET /api/v1/agent/tasks/{id}", "status": "PASS"},
    {"endpoint": "POST /api/v1/agent/chat", "status": "PASS"}
  ],
  "blockers": []
}
```

提交并推送分支 `cursor/feat-m9-backend`，确保 autoCreatePR 开启。
