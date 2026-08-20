# Agent Runtime（LangGraph）说明

对应选型方案「AI 与智能体技术架构」与规约第八章。

## 图结构

```
START
  └─ supervisor（路由）
        ├─ market_analyst      市场分析智能体 + market_trend_query
        ├─ social_marketer     社媒营销智能体 + social_content_generate
        ├─ lead_miner          潜客挖掘智能体 + mkt_campaign_launch（高风险）
        ├─ sales_converter     销售转化智能体 + sales_lead_assign（高风险）
        └─ decision_officer    智能决策智能体 + decision_kpi_query → END
```

- 状态：`AgentState`（messages / tenant / goal / agent_outputs / tool_results / requires_approval…）
- 持久化：`MemorySaver` checkpointer（可按 `thread_id` 断点续跑；生产可换 Postgres/SQLite saver）
- 工具：仅允许 `SkillRegistry` 已注册技能；经 `McpToolClient` 调用（本地 mock 或 HTTP MCP）

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/api/v1/skills` | 已注册技能目录 |
| POST | `/api/v1/agent/run` | 执行协作任务 |

请求体示例：

```json
{
  "goal": "分析德国工业泵市场机会",
  "tenant_id": "1",
  "user_id": "u_admin"
}
```

请求头建议携带：`X-Trace-Id`。

## 与 Java 边界

- Runtime **不**直连业务库
- 模型调用走 Agent/LLM 网关（`LINGXI_LLM_BASE_URL`）
- 业务能力只走注册技能 / MCP
- 高风险动作 `requiresApproval=true` → 状态 `awaiting_human`，由工作台待办接管
