# M4-frontend 任务简报：市场域前端页面接入真实 API

## 任务概述

市场域后端（M4-backend，PR 已合并）已提供搜索指数 / 热词 / 机会扫描等契约端点。本项目前端 `市场域` 页面目前是 **mock 驱动的交互稿**，仅有「机会数量」用真实 `/market/opportunities` 探了一下。任务目标：**把市场域页面从 mock 切换为真实后端 API，并消除 TypeScript 错误（去除 `@ts-nocheck`）。**

## 仓库信息

- 仓库：`https://github.com/Welch-Qi/LingXi.git`
- 基线分支：`main`
- 工作分支：`cursor/feat-m4-frontend`
- 本模块契约：读取 `contracts.md` 的 **M4. 市场域后端** 章节。

## 范围（只能修改以下文件）

- `lingxi-web/apps/lingxi-web/src/components/pages/product-page.tsx`（主实现，当前 70 行、mock 为主）
- `lingxi-web/apps/lingxi-web/src/app/(biz)/market/page.tsx`（路由壳，已 import ProductPage，基本不用改）
- 如需本模块专属 API 函数，新建 `lingxi-web/apps/lingxi-web/src/lib/api-market.ts`（**不要**改 `lib/bapi.ts` / `lib/api.ts` / `src/types/index.ts`）

## 后端真实端点（路径已与仓库 Controller 核验，调用时不要带 `/api/v1` 前缀）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/market/search-trends` | 按品类/地区查询搜索热度趋势（趋势图数据源） |
| GET | `/market/region-heat` | 按国家/地区展示搜索热度分布（地域热力） |
| GET | `/market/hot-keywords` | 按行业/品类/地区热门关键词 |
| GET | `/market/rising-keywords` | 上升最快的新兴关键词 |
| GET | `/market/opportunities` | AI 推荐高潜力目标产品/市场组合（机会卡片数据源） |
| GET | `/market/trends` | 细分品类趋势（可选，作为 search-trends 兜底） |
| GET | `/market/keywords` | 关键词总览（可选） |

> 以上端点均为 **GET、无需写权限**。分页参数同通用约定：`pageNo`/`pageSize`/`keyword`（具体以实际返回为准，做防御式解析）。

## 实现要求

1. 读取 `contracts.md` M4 章节与现有 `product-page.tsx`，理解当前 3 个 Tab（市场趋势 trend / 产品开发 opportunity / 产品创意 idea）的交互稿。
2. **保留现有视觉设计与 3-Tab 交互结构**，只替换数据来源：
   - **trend Tab**：用 `GET /market/search-trends`（或 `/market/trends`）获取各细分品类的搜索热度序列，渲染现有 LineChart；若返回结构为 `{ list: [...] }` 或 `[]`，用 `lib/format.ts` 的 `pickRows` 归一化。热词可顺带从 `/market/hot-keywords` 取 Top N 展示。
   - **opportunity Tab**：用 `GET /market/opportunities` 获取机会列表，渲染现有机会卡片（评分 / 竞争分析 / 痛点爽点 / 开发机会）。字段映射以实际返回为准（用 `Record<string, unknown>` + mapper）。
   - **idea Tab**：产品创意保持本地 mock 或基于机会简单派生均可（创意推进本就是前端交互），但**顶部「已连接后端机会库：N 条」提示**必须基于真实 `/market/opportunities` 条数（现有逻辑已接，保留并修类型）。
3. 顶部「商品类别」切换器、阶段流转等交互保留。
4. **删除** `product-page.tsx` 顶部 `// @ts-nocheck`，修复全部 TS 错误使其可通过 `pnpm typecheck`。
5. 类型：API 行用 `Record<string, unknown>`，在文件内写 `mapXxx(row)` mapper 转成 UI 类型；不要新增 `any`。
6. 复用 `@/components/ui/*`（Card/Chart 等）与 `@/components/lingxi-ui/*`，图表沿用 `recharts`。
7. 加载态/空态：保留或新增 loading/空态，调用失败时**回退到已有 mock 数据**并 toast 提示（与现有 `apiOppCount` 的 catch 风格一致），不要白屏。

## 前端通用规范（必读）

- 数据请求统一用 `lib/api.ts` 的 `apiGet<T>(path)`。路径不带头：`apiGet("/market/search-trends")`。`apiGet` 已通过 `@lingxi/request` 的 `unwrap` 直接返回 `data` 字段。
- 分页归一化用 `lib/format.ts` 的 `pickRows` / `asList`。
- **禁止** `any`（第三方类型除外）；**不要**编辑 `src/types/index.ts`、`lib/bapi.ts`、`lib/api.ts`（并行任务会改，编辑会冲突）。新类型内联定义或放 `lib/api-market.ts`。
- 保留中文文案（产品稿本身中文）。
- 完成后运行 `cd lingxi-web && pnpm install && pnpm typecheck`（若环境无 pnpm/网络，请仔细自查类型并在 result.json 注明），将结果写入 `artifacts/M4-frontend/result.json`，commit 并推送分支 `cursor/feat-m4-frontend`，autoCreatePR 开启。

## 回传结果（强制）

写入 `artifacts/M4-frontend/result.json`：

```json
{
  "task": "M4-frontend",
  "agent": "<agentId>",
  "runId": "<runId>",
  "status": "COMPLETED",
  "prUrl": "<PR 链接>",
  "branch": "cursor/feat-m4-frontend",
  "summary": "市场域页面接入真实 API（search-trends/region-heat/hot-keywords/rising-keywords/opportunities），去除 @ts-nocheck，typecheck 通过",
  "changedFiles": ["lingxi-web/apps/lingxi-web/src/components/pages/product-page.tsx", "lingxi-web/apps/lingxi-web/src/lib/api-market.ts"],
  "tests": { "total": 0, "passed": 0, "failed": 0, "coverage": 0, "note": "前端以 typecheck/build 为验证，无单元测试" },
  "contractChecks": { "passed": 5, "failed": 0 },
  "blockers": [],
  "nextActions": []
}
```

## 验收标准

1. `product-page.tsx` 不再有 `// @ts-nocheck`，且 `pnpm typecheck` 无错误。
2. trend / opportunity 两个 Tab 的数据来自真实 `/market/*` 端点（非写死 mock），失败回退 mock 不白屏。
3. 视觉与 3-Tab 交互结构与改造前一致。
4. PR 已创建并推送。
