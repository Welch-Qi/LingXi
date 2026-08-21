# M6-frontend 任务简报：营销域前端页面接入真实 API

## 任务概述

营销域后端（M6-backend，PR 已合并）已提供社媒账号管理 / AI 内容生成等契约端点。本项目前端 `内容营销` 页面目前是 **mock 驱动的交互稿**：「内容生产」Tab 已部分接 `/marketing/contents` 与 `/marketing/contents/generate` 等，但**社媒账号绑定**缺失、**投放/分发** Tab 多为 mock。任务目标：**补全营销域页面真实 API 接入（尤其社媒账号），并消除 TypeScript 错误（去除 `@ts-nocheck`）。**

## 仓库信息

- 仓库：`https://github.com/Welch-Qi/LingXi.git`
- 基线分支：`main`
- 工作分支：`cursor/feat-m6-frontend`
- 本模块契约：读取 `contracts.md` 的 **M6. 营销域后端** 章节。

## 范围（只能修改以下文件）

- `lingxi-web/apps/lingxi-web/src/components/pages/marketing-page.tsx`（主实现，当前 662 行）
- `lingxi-web/apps/lingxi-web/src/app/(biz)/marketing/page.tsx`（路由壳，基本不用改）
- 如需本模块专属 API 函数，新建 `lingxi-web/apps/lingxi-web/src/lib/api-marketing.ts`（**不要**改 `lib/bapi.ts` / `lib/api.ts` / `src/types/index.ts`）

## 后端真实端点（路径已与仓库 Controller 核验，调用时不要带 `/api/v1` 前缀）

**社媒账号 social-accounts（`@RequestMapping("/api/v1/marketing")`）：**

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/marketing/social-accounts` | 查询已绑定社媒账号列表（**当前页面缺失此能力，需新增**） |
| POST | `/marketing/social-accounts` | 绑定社媒账号（platform/accountName 等） |
| DELETE | `/marketing/social-accounts/{id}` | 解绑账号 |

**内容 contents：**

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/marketing/contents` | 内容列表（已部分接） |
| POST | `/marketing/contents` | 创建内容 |
| POST | `/marketing/contents/generate` | AI 生成图文/视频内容（已部分接） |
| POST | `/marketing/contents/{id}/submit-review` | 提交审核（已部分接） |
| POST | `/marketing/contents/{id}/approve` | 审核通过（已部分接） |
| POST | `/marketing/contents/{id}/publish` | 发布（已部分接） |
| GET | `/marketing/campaigns` | 投放计划列表（已部分接） |
| POST | `/marketing/ai-content` | AI 内容生成（contracts M6.2，可选） |

> 社媒平台枚举：FACEBOOK / INSTAGRAM / LINKEDIN / TIKTOK（参考 contracts M6.3）。

## 实现要求

1. 读取 `contracts.md` M6 章节与现有 `marketing-page.tsx`，理解当前 3 个 Tab（内容生产 production / 内容分发 distribution / 投放管理 campaign）。
2. **保留现有视觉设计与 3-Tab 交互结构**，替换/补全数据来源：
   - **production Tab**：已接 `/marketing/contents` + `/generate` + `submit-review` + `approve` + `publish`，保留并修类型（现有 `mapAsset` 等 mapper 可用）。确认 `handleGenerate` 调 `POST /marketing/contents/generate` 真实落库、失败回退本地草稿的逻辑保持。
   - **新增「社媒账号」区**：在 production 或顶部新增社媒账号管理（参考现有 `channels` mock 思路）。用 `GET /marketing/social-accounts` 拉取已绑定账号、`POST /marketing/social-accounts` 绑定（表单含 platform 下拉 + 账号名）、`DELETE /marketing/social-accounts/{id}` 解绑。可用一个新卡片/抽屉承载。
   - **distribution Tab**：渠道分发效果可用 `/marketing/contents` 统计或保留 mock；内容渠道投放矩阵保留 mock 或接真实（无专门端点则保留并注明）。
   - **campaign Tab**：用 `GET /marketing/campaigns` 真实数据渲染投放计划卡片（现有 `reloadCampaigns` 已接，保留并修类型）。
3. **删除** `marketing-page.tsx` 顶部 `// @ts-nocheck`，修复全部 TS 错误使其可通过 `pnpm typecheck`。
4. 类型：API 行用 `Record<string, unknown>` + mapper；**禁止** `any`。
5. 复用 `@/components/ui/*`（Table/Card/Input/Select/Sheet/Progress 等）与 `@/components/lingxi-ui/*`（LxKpi）。
6. 调用失败回退（社媒账号接口不可用时保留空态/提示，不白屏）。

## 前端通用规范（必读）

- 数据请求统一用 `lib/api.ts` 的 `apiGet/apiPost/apiPut/apiDelete`。路径不带头：`apiPost("/marketing/social-accounts", { platform, accountName })`。
- 分页归一化用 `lib/format.ts` 的 `pickRows` / `asList`；统一响应体 `apiGet` 已解包 `data`。
- **禁止** `any`；**不要**编辑 `src/types/index.ts`、`lib/bapi.ts`、`lib/api.ts`。新类型内联或放 `lib/api-marketing.ts`。
- 保留中文文案。
- 完成后运行 `cd lingxi-web && pnpm install && pnpm typecheck`（若环境无 pnpm/网络，请仔细自查类型并在 result.json 注明），写入 `artifacts/M6-frontend/result.json`，commit 并推送分支 `cursor/feat-m6-frontend`，autoCreatePR 开启。

## 回传结果（强制）

写入 `artifacts/M6-frontend/result.json`：

```json
{
  "task": "M6-frontend",
  "agent": "<agentId>",
  "runId": "<runId>",
  "status": "COMPLETED",
  "prUrl": "<PR 链接>",
  "branch": "cursor/feat-m6-frontend",
  "summary": "营销域页面接入真实 API（social-accounts 绑定/解绑 + contents/campaigns 全链路），新增社媒账号管理，去除 @ts-nocheck，typecheck 通过",
  "changedFiles": ["lingxi-web/apps/lingxi-web/src/components/pages/marketing-page.tsx", "lingxi-web/apps/lingxi-web/src/lib/api-marketing.ts"],
  "tests": { "total": 0, "passed": 0, "failed": 0, "coverage": 0, "note": "前端以 typecheck/build 为验证，无单元测试" },
  "contractChecks": { "passed": 4, "failed": 0 },
  "blockers": [],
  "nextActions": []
}
```

## 验收标准

1. `marketing-page.tsx` 不再有 `// @ts-nocheck`，`pnpm typecheck` 无错误。
2. 新增社媒账号绑定/解绑（真实 `/marketing/social-accounts`），内容生产/投放 Tab 数据来自真实端点，失败不白屏。
3. 视觉与 3-Tab 交互结构一致。
4. PR 已创建并推送。
