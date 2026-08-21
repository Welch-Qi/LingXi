# M10-frontend 任务简报：统一工作台前端页面接入真实 API

## 任务概述

统一工作台后端（M10-backend，PR 已合并）已提供个性化工作区 / 统一待办 / 询盘提醒等契约端点（路径已对齐：`/dashboard`、`/tasks`、`/inquiries`、`/acknowledge`）。本项目前端 `超级工作台` 页面（`dashboard-page.tsx`）目前是 **纯 mock 驱动的交互稿**（KPI/智能体/增长图/实时流全为写死数据），且文件**没有** `// @ts-nocheck`（本就是 mock 稿）。任务目标：**把统一工作台页面从 mock 切换为真实后端 API，并消除/确保 TypeScript 错误为零。**

## 仓库信息

- 仓库：`https://github.com/Welch-Qi/LingXi.git`
- 基线分支：`main`
- 工作分支：`cursor/feat-m10-frontend`
- 本模块契约：读取 `contracts.md` 的 **M10. 统一工作台** 章节 + `tasks/M10-backend.md`（端点清单）。

## 范围（只能修改以下文件）

- `lingxi-web/apps/lingxi-web/src/components/pages/dashboard-page.tsx`（主实现，当前 202 行，纯 mock）
- `lingxi-web/apps/lingxi-web/src/app/(workbench)/workbench/page.tsx`（路由壳，已 import DashboardPage 并接 `onNavigate`，基本不用改）
- 如需本模块专属 API 函数，新建 `lingxi-web/apps/lingxi-web/src/lib/api-workbench.ts`（**不要**改 `lib/bapi.ts` / `lib/api.ts` / `src/types/index.ts`）

## 后端真实端点（路径已与仓库 Controller 核验，调用时不要带 `/api/v1` 前缀）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/workbench/dashboard` | 个性化工作区（KPI 概览 + 待办统计 + 询盘统计） |
| GET | `/workbench/tasks` | 统一待办列表（支持 status/mineOnly 等参数） |
| POST | `/workbench/tasks` | 创建任务 |
| POST | `/workbench/tasks/{id}/complete` | 完成任务 |
| PATCH | `/workbench/tasks/{id}` | 更新任务状态/优先级/负责人（status: OPEN/IN_PROGRESS/DONE/CANCELLED） |
| GET | `/workbench/inquiries` | 询盘提醒列表 |
| POST | `/workbench/inquiries/{id}/acknowledge` | 确认询盘 |

## 实现要求

1. 读取 `contracts.md` M10 章节、`tasks/M10-backend.md` 与现有 `dashboard-page.tsx`，理解当前结构：问候 Banner + KPI 网格（dashboardMetrics mock）+ 智能体协作网络（agents mock）+ 今日要点（写死）+ 快捷操作 + 增长动能趋势图（growthTrend mock）+ 需要人工决策（写死）+ 业务实时流（flowEvents mock）。
2. **保留现有视觉设计与布局**，替换数据来源（核心是工作台自身数据，智能体协作网络/增长图等可保留 mock 或接 dashboard 聚合字段，二选一，优先不破坏视觉）：
   - **KPI 网格**：用 `GET /workbench/dashboard` 返回的 KPI 概览渲染（dashboard 返回字段以实际为准，防御式解析；缺失则保留 mock）。
   - **新增「待办任务」区块**：用 `GET /workbench/tasks` 拉取真实待办列表，渲染为卡片/表格；每条提供「完成」按钮调 `POST /workbench/tasks/{id}/complete`（或 `PATCH /workbench/tasks/{id}` 设 status=DONE）；可用现有「需要人工决策」区块承载，或新增独立区块。
   - **新增「询盘提醒」区块**：用 `GET /workbench/inquiries` 拉取真实询盘，每条提供「确认」按钮调 `POST /workbench/inquiries/{id}/acknowledge`。可并入「今日要点」或新增区块。
   - 「智能体协作网络」「增长动能趋势图」「业务实时流」：若无专门端点，保留现有 mock（注明），不强制接。
3. DashboardPage 接收 `onNavigate` 回调（由 workbench/page.tsx 注入，路由跳转），保留快捷操作/智能体的跳转能力。
4. **确保** `dashboard-page.tsx` 通过 `pnpm typecheck`（当前无 `@ts-nocheck`，但新增 API/类型后需类型正确）。**禁止** `any`。
5. 类型：API 行用 `Record<string, unknown>` + mapper；新增 UI 类型在文件内联或 `lib/api-workbench.ts` 中定义。
6. 复用 `@/components/ui/*`（Card/Table/Badge/Button 等）与 `@/components/lingxi-ui/*`（LxKpi/LxAgentCard/LxInsightCard）。
7. 调用失败回退 mock 不白屏。

## 前端通用规范（必读）

- 数据请求统一用 `lib/api.ts` 的 `apiGet/apiPost/apiPut/apiDelete`。路径不带头：`apiGet("/workbench/dashboard")`。
- 分页归一化用 `lib/format.ts` 的 `pickRows` / `asList`；统一响应体 `apiGet` 已解包 `data`。
- **禁止** `any`；**不要**编辑 `src/types/index.ts`、`lib/bapi.ts`、`lib/api.ts`。新类型内联或放 `lib/api-workbench.ts`。
- 保留中文文案。
- 完成后运行 `cd lingxi-web && pnpm install && pnpm typecheck`（若环境无 pnpm/网络，请仔细自查类型并在 result.json 注明），写入 `artifacts/M10-frontend/result.json`，commit 并推送分支 `cursor/feat-m10-frontend`，autoCreatePR 开启。

## 回传结果（强制）

写入 `artifacts/M10-frontend/result.json`：

```json
{
  "task": "M10-frontend",
  "agent": "<agentId>",
  "runId": "<runId>",
  "status": "COMPLETED",
  "prUrl": "<PR 链接>",
  "branch": "cursor/feat-m10-frontend",
  "summary": "统一工作台页面接入真实 API（dashboard/tasks 完成/inquiries 确认），新增待办与询盘区块，typecheck 通过",
  "changedFiles": ["lingxi-web/apps/lingxi-web/src/components/pages/dashboard-page.tsx", "lingxi-web/apps/lingxi-web/src/lib/api-workbench.ts"],
  "tests": { "total": 0, "passed": 0, "failed": 0, "coverage": 0, "note": "前端以 typecheck/build 为验证，无单元测试" },
  "contractChecks": { "passed": 3, "failed": 0 },
  "blockers": [],
  "nextActions": []
}
```

## 验收标准

1. `dashboard-page.tsx` 通过 `pnpm typecheck`，无 `any`、无类型错误。
2. 工作台 KPI 来自真实 `/workbench/dashboard`；新增待办列表（可完成）与询盘提醒（可确认），均接真实端点，失败回退 mock 不白屏。
3. 视觉与布局结构一致。
4. PR 已创建并推送。
