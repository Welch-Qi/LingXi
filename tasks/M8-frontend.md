# M8-frontend 任务简报：决策中心前端页面接入真实 API

## 任务概述

智能决策中心后端（M8-backend，PR 已合并）已提供经营驾驶舱与问答式查询端点。本项目前端 `经营分析` 页面目前是 **mock 驱动的交互稿**：已接 `GET /decision/dashboard`，但**问答接口调错了路径**（`/decision/qa`，正确应为 `/decision/ask`），且文件带 `// @ts-nocheck`。任务目标：**修正问答端点路径、把决策中心页面数据切换为真实后端 API，并消除 TypeScript 错误。**

## 仓库信息

- 仓库：`https://github.com/Welch-Qi/LingXi.git`
- 基线分支：`main`
- 工作分支：`cursor/feat-m8-frontend`
- 本模块契约：读取 `contracts.md` 的 **M8. 智能决策中心** 章节。

## 范围（只能修改以下文件）

- `lingxi-web/apps/lingxi-web/src/components/pages/analytics-page.tsx`（主实现，当前 465 行）
- `lingxi-web/apps/lingxi-web/src/app/(decision)/decision/page.tsx`（路由壳，基本不用改）
- 如需本模块专属 API 函数，新建 `lingxi-web/apps/lingxi-web/src/lib/api-decision.ts`（**不要**改 `lib/bapi.ts` / `lib/api.ts` / `src/types/index.ts`）

## 后端真实端点（路径已与仓库 Controller 核验，调用时不要带 `/api/v1` 前缀）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/decision/dashboard` | 核心 KPI 实时监控（驾驶舱数据源，已部分接） |
| GET | `/decision/kpis` | KPI 指标（可选，作为 dashboard 兜底） |
| POST | `/decision/ask` | **自然语言查询经营数据（问答）** |

> ⚠️ **关键修正**：现有 `analytics-page.tsx` 的 `sendMsg` 调的是 `POST /decision/qa`，但后端契约与实现均为 `POST /decision/ask`（contracts M8.2）。**必须改为 `/decision/ask`**，否则问答必 404。

## 实现要求

1. 读取 `contracts.md` M8 章节与现有 `analytics-page.tsx`，理解当前结构：顶部 AI 专家入口 + KPI 卡片 + 全球销量热度地图（react-simple-maps）+ 国家 Top10 / 产品 Top10 柱状图 + 营销漏斗 + 30 天趋势 + AI 问数聊天面板。
2. **保留现有视觉设计与全部图表/交互**，替换数据来源：
   - **KPI / 地图 / Top 榜 / 漏斗 / 趋势**：用 `GET /decision/dashboard` 的真实返回渲染（现有 useEffect 已接 `/decision/dashboard`，保留并修类型）。Dashboard 返回字段以实际为准，用 `Record<string, unknown>` + 防御式解析（`dash.kpis?.length` 等已存在）；若某字段缺失则保持 mock 兜底（`.catch(() => 保留 mock)` 已存在）。
   - **AI 问答**：把 `POST /decision/qa` **改为 `POST /decision/ask`**，请求体含 `question`（及后端需要的其它字段，如 `metricCode`，以实际返回为准）。把回答（`answer`/`message` 字段）展示到聊天面板；失败回退现有本地 `aiReply` 兜底（保留）。
3. **删除** `analytics-page.tsx` 顶部 `// @ts-nocheck`，修复全部 TS 错误使其可通过 `pnpm typecheck`。
4. 类型：API 行用 `Record<string, unknown>`；**禁止** `any`。地图 `react-simple-maps` 已 `"use client"`，保留。
5. 复用 `@/components/ui/*` 与 `@/components/lingxi-ui/*`，图表沿用 `recharts`。
6. 调用失败回退 mock 不白屏（保留现有 `.catch` 风格）。

## 前端通用规范（必读）

- 数据请求统一用 `lib/api.ts` 的 `apiGet/apiPost`。路径不带头：`apiPost("/decision/ask", { question })`。
- 分页归一化用 `lib/format.ts` 的 `pickRows` / `asList`；统一响应体 `apiGet` 已解包 `data`。
- **禁止** `any`；**不要**编辑 `src/types/index.ts`、`lib/bapi.ts`、`lib/api.ts`。新类型内联或放 `lib/api-decision.ts`。
- 保留中文文案。
- 完成后运行 `cd lingxi-web && pnpm install && pnpm typecheck`（若环境无 pnpm/网络，请仔细自查类型并在 result.json 注明），写入 `artifacts/M8-frontend/result.json`，commit 并推送分支 `cursor/feat-m8-frontend`，autoCreatePR 开启。

## 回传结果（强制）

写入 `artifacts/M8-frontend/result.json`：

```json
{
  "task": "M8-frontend",
  "agent": "<agentId>",
  "runId": "<runId>",
  "status": "COMPLETED",
  "prUrl": "<PR 链接>",
  "branch": "cursor/feat-m8-frontend",
  "summary": "决策中心页面接入真实 API（dashboard + ask 问答，修正 /qa→/ask 路径错误），去除 @ts-nocheck，typecheck 通过",
  "changedFiles": ["lingxi-web/apps/lingxi-web/src/components/pages/analytics-page.tsx"],
  "tests": { "total": 0, "passed": 0, "failed": 0, "coverage": 0, "note": "前端以 typecheck/build 为验证，无单元测试" },
  "contractChecks": { "passed": 2, "failed": 0 },
  "blockers": [],
  "nextActions": []
}
```

## 验收标准

1. `analytics-page.tsx` 不再有 `// @ts-nocheck`，`pnpm typecheck` 无错误。
2. 问答接口路径已修正为 `POST /decision/ask`（不再调 `/decision/qa`）。
3. KPI/地图/榜单/漏斗/趋势 数据来自真实 `/decision/dashboard`（失败回退 mock 不白屏）。
4. PR 已创建并推送。
