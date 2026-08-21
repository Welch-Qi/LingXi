# M5-frontend 任务简报：销售域前端页面接入真实 API

## 任务概述

销售域后端（M5-backend，PR 已合并）已提供线索 / 客户 360 / 商机 等契约端点。本项目前端 `销售转化` 页面目前是 **mock 驱动的交互稿**：「客户接待」Tab 已部分接 `/sales/sessions`，但「客户档案 / 跟进 / 成交」Tab 仍是 mock。任务目标：**把销售域页面从 mock 切换为真实后端 API，并消除 TypeScript 错误（去除 `@ts-nocheck`）。**

## 仓库信息

- 仓库：`https://github.com/Welch-Qi/LingXi.git`
- 基线分支：`main`
- 工作分支：`cursor/feat-m5-frontend`
- 本模块契约：读取 `contracts.md` 的 **M5. 销售域后端** 章节。

## 范围（只能修改以下文件）

- `lingxi-web/apps/lingxi-web/src/components/pages/sales-page.tsx`（主实现，当前 242 行）
- `lingxi-web/apps/lingxi-web/src/app/(biz)/sales/page.tsx`（路由壳，基本不用改）
- 如需本模块专属 API 函数，新建 `lingxi-web/apps/lingxi-web/src/lib/api-sales.ts`（**不要**改 `lib/bapi.ts` / `lib/api.ts` / `src/types/index.ts`）

## 后端真实端点（路径已与仓库 Controller 核验，调用时不要带 `/api/v1` 前缀）

**线索 leads（`@RequestMapping("/api/v1/sales/leads")`）：**

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/sales/leads` | 分页查询线索（支持 keyword/status 等参数） |
| POST | `/sales/leads` | 创建线索（多渠道归集） |
| GET | `/sales/leads/{id}` | 线索详情 |
| POST | `/sales/leads/{id}/assignment` | 线索分配 |
| POST | `/sales/leads/{id}/claim` | 认领 |
| POST | `/sales/leads/{id}/release` | 释放 |
| POST | `/sales/leads/dedup` | 查重防撞单 |
| GET | `/sales/leads/pool` | 公海线索 |

**客户 customers（`@RequestMapping("/api/v1/sales/customers")`）：**

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/sales/customers/{id}` | 客户详情 |
| GET | `/sales/customers/{id}/360` | 360 客户画像 |
| POST | `/sales/customers` | 创建客户 |

**商机 opportunities（`@RequestMapping("/api/v1/sales/opportunities")`）：**

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/sales/opportunities` | 分页查询商机 |
| GET | `/sales/opportunities/{id}` | 商机详情 |
| POST | `/sales/opportunities` | 创建商机 |
| PATCH | `/sales/opportunities/{id}/stage` | 商机阶段流转（contracts M5.2；若后端未实现则跳过并注明） |

**会话 sessions（`@RequestMapping("/api/v1/sales/sessions")`）：**

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/sales/sessions` | 接待会话列表（已部分接） |
| GET | `/sales/sessions/{id}/messages` | 会话消息（已部分接） |
| POST | `/sales/sessions/{id}/messages` | 发送消息（已部分接） |
| POST | `/sales/sessions/{id}/conversion` | 会话转客户建档（已部分接） |

> 现有代码已用 `/sales/sessions`、`/sales/sessions/{id}/messages`、`/sales/sessions/{id}/conversion`，**路径正确，保留并修类型**。

## 实现要求

1. 读取 `contracts.md` M5 章节与现有 `sales-page.tsx`，理解当前 4 个 Tab（客户接待 reception / 客户档案 profile / 客户跟进 follow / 客户成交 deal）。
2. **保留现有视觉设计与 4-Tab 交互结构**，替换数据来源：
   - **reception Tab**：已接 `/sales/sessions`，保留并修类型；消息流 `/sales/sessions/{id}/messages`、回复 `/sales/sessions/{id}/messages`(POST)、转建档 `/sales/sessions/{id}/conversion` 保留。把会话列表/消息从 mock 转为真实返回（用 `Record<string, unknown>` + mapper，参考现有 `mapSession`/`mapMessage`）。
   - **profile Tab**：客户档案列表与「客户建档」表单，改用 `GET /sales/leads`（或 `/sales/customers`）+ `POST /sales/customers`。新建客户走真实 `POST /sales/customers`；客户 360 弹层走 `GET /sales/customers/{id}/360`。筛选/搜索保留前端逻辑。
   - **follow Tab**：生命周期卡片下的客户列表，接真实线索/客户数据（可用 `/sales/leads` 按状态分组），「跟进」动作保留 toast 或接 `POST /sales/leads/{id}/assignment`。
   - **deal Tab**：成交趋势/列表，接真实商机 `GET /sales/opportunities` 渲染（阶段/金额/时间），KPI 卡片可基于真实数据计算或保留静态（注明）。
3. **删除** `sales-page.tsx` 顶部 `// @ts-nocheck`，修复全部 TS 错误使其可通过 `pnpm typecheck`。
4. 类型：API 行用 `Record<string, unknown>` + mapper；**禁止** `any`。
5. 复用 `@/components/ui/*`（Table/Card/Input/Select/Sheet/Textarea 等）与 `@/components/lingxi-ui/*`。
6. 调用失败**回退 mock 不白屏**（保持现有 catch 风格），并 toast 提示。

## 前端通用规范（必读）

- 数据请求统一用 `lib/api.ts` 的 `apiGet/apiPost/apiPut/apiDelete`。路径不带头：`apiGet("/sales/leads")`。
- 分页归一化用 `lib/format.ts` 的 `pickRows` / `asList`；统一响应体 `apiGet` 已解包 `data`。
- **禁止** `any`；**不要**编辑 `src/types/index.ts`、`lib/bapi.ts`、`lib/api.ts`。新类型内联或放 `lib/api-sales.ts`。
- 保留中文文案。
- 完成后运行 `cd lingxi-web && pnpm install && pnpm typecheck`（若环境无 pnpm/网络，请仔细自查类型并在 result.json 注明），写入 `artifacts/M5-frontend/result.json`，commit 并推送分支 `cursor/feat-m5-frontend`，autoCreatePR 开启。

## 回传结果（强制）

写入 `artifacts/M5-frontend/result.json`：

```json
{
  "task": "M5-frontend",
  "agent": "<agentId>",
  "runId": "<runId>",
  "status": "COMPLETED",
  "prUrl": "<PR 链接>",
  "branch": "cursor/feat-m5-frontend",
  "summary": "销售域页面接入真实 API（leads/customers/opportunities/sessions），去除 @ts-nocheck，typecheck 通过",
  "changedFiles": ["lingxi-web/apps/lingxi-web/src/components/pages/sales-page.tsx", "lingxi-web/apps/lingxi-web/src/lib/api-sales.ts"],
  "tests": { "total": 0, "passed": 0, "failed": 0, "coverage": 0, "note": "前端以 typecheck/build 为验证，无单元测试" },
  "contractChecks": { "passed": 6, "failed": 0 },
  "blockers": [],
  "nextActions": []
}
```

## 验收标准

1. `sales-page.tsx` 不再有 `// @ts-nocheck`，`pnpm typecheck` 无错误。
2. 4 个 Tab 的数据来自真实 `/sales/*` 端点（reception 已部分接，补全其余），失败回退 mock 不白屏。
3. 视觉与 4-Tab 交互结构一致。
4. PR 已创建并推送。
