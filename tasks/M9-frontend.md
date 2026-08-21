# M9-frontend 任务简报：智能体中心前端页面接入真实 API

## 任务概述

AI Agent Runtime 后端（M9-backend，PR 已合并）提供智能体配置、运行记录、触发运行等端点。本项目前端 `智能中心` 页面目前是 **mock 驱动的交互稿**，已通过 `lib/bapi.ts` 接了 `/agents/{code}/config` 与 `/agents/run-logs`，但文件带 `// @ts-nocheck`，且「运行智能体」能力未接。任务目标：**把智能体中心页面数据切换为真实后端 API（使用真实 `/agents/...` 路径），并消除 TypeScript 错误。**

## ⚠️ 重要：端点以真实后端为准（与 contracts.md M9 不同）

`contracts.md` M9 写的是 `POST /agent/tasks`、`GET /agent/tasks/{id}`、`POST /agent/chat`，**但这些路径在后端并未实现**。仓库中 `AgentController`（`lingxi-agent` 模块）的真实基址是 **`/api/v1/agents`（复数）**，端点如下。前端必须以真实端点为准（现有 `lib/bapi.ts` 已正确调用 `/agents/...`，请沿用）：

| 方法 | 真实路径 | 说明 |
|------|---------|------|
| GET | `/agents` | 智能体列表 |
| GET | `/agents/prompt-codes` | 提示词码枚举 |
| GET | `/agents/{code}/config` | 查询某智能体配置（已接 loadAgentConfig） |
| PUT | `/agents/{code}/config` | 保存某智能体配置（已接 saveAgentConfig） |
| GET | `/agents/run-logs` | 运行记录列表（已接 loadAgentRunLogs） |
| POST | `/agents/run` | 触发智能体运行（**需新增**：可选） |

> 智能体 `code` 与前端 AgentId 的映射见 `lib/bapi.ts` 的 `UI_AGENT_CODE`（analyst→decision_officer / market→market_analyst / content→social_marketer / sales→sales_converter）。

## 仓库信息

- 仓库：`https://github.com/Welch-Qi/LingXi.git`
- 基线分支：`main`
- 工作分支：`cursor/feat-m9-frontend`
- 本模块真实端点：见上表（以仓库 `AgentController` 为准）。

## 范围（只能修改以下文件）

- `lingxi-web/apps/lingxi-web/src/components/pages/agents-page.tsx`（主实现，当前 339 行）
- `lingxi-web/apps/lingxi-web/src/app/(platform)/agent/page.tsx`（路由壳，基本不用改）
- 如需本模块专属 API 函数，新建 `lingxi-web/apps/lingxi-web/src/lib/api-agent.ts`（**不要**改 `lib/bapi.ts` / `lib/api.ts` / `src/types/index.ts`）。注意 `lib/bapi.ts` 已有 `loadAgentConfig/saveAgentConfig/loadAgentRunLogs`，**可继续复用，不要重写**。

## 实现要求

1. 读取现有 `agents-page.tsx` 与 `lib/bapi.ts`，理解当前结构：智能体卡片网格（4 个智能体，来自 `lib/mocks/dashboard` 的 `agents`）+ 统计卡 + 运行记录表（已接 `/agents/run-logs`）+ 配置抽屉（已接 `/agents/{code}/config` 读写）。
2. **保留现有视觉设计与交互**，替换数据来源：
   - 智能体卡片列表：可接 `GET /agents` 拉取真实智能体列表渲染（若返回结构与现有 `agents` mock 差异大，保留 mock 列表但用真实 `config`/`run-logs` 填充动态数据；二选一，优先不破坏视觉）。
   - 运行记录表：已接 `/agents/run-logs`（loadAgentRunLogs），保留并修类型（`mapRunLog` 已存在）。
   - 配置抽屉：已接 `/agents/{code}/config` 读写（loadAgentConfig/saveAgentConfig），保留并修类型。
   - **（可选增强）** 在配置抽屉或卡片加「运行智能体」按钮，调 `POST /agents/run`（请求体含 `agentCode` 等，以实际为准），运行后刷新 run-logs。不做也不影响验收。
3. **删除** `agents-page.tsx` 顶部 `// @ts-nocheck`，修复全部 TS 错误使其可通过 `pnpm typecheck`。
4. 类型：API 行用 `Record<string, unknown>` + mapper；**禁止** `any`。
5. 复用 `@/components/ui/*`（Card/Table/Badge/Button/Sheet/Progress/Input 等）。
6. 调用失败回退 mock 不白屏（保留现有 `.catch(() => 保留 mock)` 风格）。

## 前端通用规范（必读）

- 数据请求统一用 `lib/api.ts` 的 `apiGet/apiPost/apiPut/apiDelete`。路径不带头：`apiGet("/agents/run-logs")`。
- 分页归一化用 `lib/format.ts` 的 `pickRows` / `asList`；统一响应体 `apiGet` 已解包 `data`。
- **禁止** `any`；**不要**编辑 `src/types/index.ts`、`lib/bapi.ts`、`lib/api.ts`（新建函数放 `lib/api-agent.ts`）。
- 保留中文文案。
- 完成后运行 `cd lingxi-web && pnpm install && pnpm typecheck`（若环境无 pnpm/网络，请仔细自查类型并在 result.json 注明），写入 `artifacts/M9-frontend/result.json`，commit 并推送分支 `cursor/feat-m9-frontend`，autoCreatePR 开启。

## 回传结果（强制）

写入 `artifacts/M9-frontend/result.json`：

```json
{
  "task": "M9-frontend",
  "agent": "<agentId>",
  "runId": "<runId>",
  "status": "COMPLETED",
  "prUrl": "<PR 链接>",
  "branch": "cursor/feat-m9-frontend",
  "summary": "智能体中心页面接入真实 /agents 端点（config/run-logs，沿用 lib/bapi），去除 @ts-nocheck，typecheck 通过",
  "changedFiles": ["lingxi-web/apps/lingxi-web/src/components/pages/agents-page.tsx"],
  "tests": { "total": 0, "passed": 0, "failed": 0, "coverage": 0, "note": "前端以 typecheck/build 为验证，无单元测试" },
  "contractChecks": { "passed": 2, "failed": 0 },
  "blockers": [],
  "nextActions": []
}
```

## 验收标准

1. `agents-page.tsx` 不再有 `// @ts-nocheck`，`pnpm typecheck` 无错误。
2. 配置读写与运行记录均来自真实 `/agents/...` 端点（沿用 `lib/bapi.ts`），不调用不存在的 `/agent/tasks` 等路径。
3. 视觉与交互结构一致。
4. PR 已创建并推送。
