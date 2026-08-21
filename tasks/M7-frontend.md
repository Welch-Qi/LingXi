# M7-frontend 任务简报：知识中心前端页面接入真实 API

## 任务概述

知识中心后端（M7-backend，PR 已合并）已提供模板 / 话术 / 提示词 的 CRUD 契约端点。本项目前端 `知识中心` 页面目前是 **mock 驱动的交互稿**：已通过 `lib/bapi.ts` 的 `loadKnowledgeTemplates/Scripts/Prompts`（GET）与 `updateKnowledgeXxx`（PUT）接了只读与编辑，但**缺少「新建」能力**，且文件带 `// @ts-nocheck`。任务目标：**补全知识中心真实 API 接入（新增创建能力），并消除 TypeScript 错误。**

## 仓库信息

- 仓库：`https://github.com/Welch-Qi/LingXi.git`
- 基线分支：`main`
- 工作分支：`cursor/feat-m7-frontend`
- 本模块契约：读取 `contracts.md` 的 **M7. 知识中心** 章节。

## 范围（只能修改以下文件）

- `lingxi-web/apps/lingxi-web/src/components/pages/knowledge-center-page.tsx`（主实现，当前 308 行）
- `lingxi-web/apps/lingxi-web/src/app/(platform)/knowledge/page.tsx`（路由壳，基本不用改）
- 如需本模块专属 API 函数，新建 `lingxi-web/apps/lingxi-web/src/lib/api-knowledge.ts`（**不要**改 `lib/bapi.ts` / `lib/api.ts` / `src/types/index.ts`）。注意 `lib/bapi.ts` 已有 `loadKnowledgeTemplates/Scripts/Prompts` 与 `updateKnowledgeXxx`，**可继续复用，不要重写**。

## 后端真实端点（路径已与仓库 Controller 核验，调用时不要带 `/api/v1` 前缀）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/knowledge/templates` | 分页查询模板（已接） |
| POST | `/knowledge/templates` | 创建模板（**需新增**） |
| PUT | `/knowledge/templates/{id}` | 更新模板（已接 updateKnowledgeTemplate） |
| GET | `/knowledge/scripts` | 分页查询话术（已接） |
| POST | `/knowledge/scripts` | 创建话术（**需新增**） |
| PUT | `/knowledge/scripts/{id}` | 更新话术（已接） |
| GET | `/knowledge/prompts` | 分页查询提示词（已接） |
| POST | `/knowledge/prompts` | 创建提示词（**需新增**） |
| PUT | `/knowledge/prompts/{id}` | 更新提示词（已接） |

> 模板类型枚举（contracts M7.3）：DEVELOPMENT_LETTER / QUOTATION / CONTRACT / FOLLOWUP_EMAIL。多语言用 JSONB（`locale` 字段）。

## 实现要求

1. 读取 `contracts.md` M7 章节与现有 `knowledge-center-page.tsx`，理解当前 3 个 Tab（内容模板 templates / 销售话术 scripts / Agent 提示词 prompts）。
2. **保留现有视觉设计与 3-Tab 交互结构**，补全数据来源：
   - 现有 `loadKnowledgeXxx`（GET）与 `updateKnowledgeXxx`（PUT）已接真实 API，**保留并修类型**（去掉 `// @ts-nocheck` 后类型需正确）。
   - **新增「创建」能力**：每个 Tab 增加「新建」按钮 + 抽屉/表单，调用对应 `POST /knowledge/{templates|scripts|prompts}`。模板表单含 name/category/locale/body；话术含 scene/locale/body；提示词含 name（或 promptCode）/agentDomain/body/versionLabel。创建后刷新列表。
   - 编辑（`updateKnowledgeXxx`）保留现有 `window.prompt` 简易交互或升级为抽屉表单（二选一，建议保留现有交互以降低风险）。
   - 统计卡片（模板/话术/提示词总数）基于真实列表长度计算。
3. **删除** `knowledge-center-page.tsx` 顶部 `// @ts-nocheck`，修复全部 TS 错误使其可通过 `pnpm typecheck`。
4. 类型：API 行用 `Record<string, unknown>` + mapper（`mapTemplate/mapScript/mapPrompt` 已存在，保留）；**禁止** `any`。
5. 复用 `@/components/ui/*`（Card/Table/Badge/Button/Tabs/Input/Textarea/Sheet 等）。
6. 调用失败回退 mock 不白屏（保留现有 `.catch(() => null)` 风格）。

## 前端通用规范（必读）

- 数据请求统一用 `lib/api.ts` 的 `apiGet/apiPost/apiPut/apiDelete`。路径不带头：`apiGet("/knowledge/templates")`。
- 分页归一化用 `lib/format.ts` 的 `pickRows` / `asList`；统一响应体 `apiGet` 已解包 `data`。
- **禁止** `any`；**不要**编辑 `src/types/index.ts`、`lib/bapi.ts`、`lib/api.ts`（如需新建函数放 `lib/api-knowledge.ts`）。
- 保留中文文案。
- 完成后运行 `cd lingxi-web && pnpm install && pnpm typecheck`（若环境无 pnpm/网络，请仔细自查类型并在 result.json 注明），写入 `artifacts/M7-frontend/result.json`，commit 并推送分支 `cursor/feat-m7-frontend`，autoCreatePR 开启。

## 回传结果（强制）

写入 `artifacts/M7-frontend/result.json`：

```json
{
  "task": "M7-frontend",
  "agent": "<agentId>",
  "runId": "<runId>",
  "status": "COMPLETED",
  "prUrl": "<PR 链接>",
  "branch": "cursor/feat-m7-frontend",
  "summary": "知识中心页面补全真实 API（templates/scripts/prompts 增改查），新增创建能力，去除 @ts-nocheck，typecheck 通过",
  "changedFiles": ["lingxi-web/apps/lingxi-web/src/components/pages/knowledge-center-page.tsx"],
  "tests": { "total": 0, "passed": 0, "failed": 0, "coverage": 0, "note": "前端以 typecheck/build 为验证，无单元测试" },
  "contractChecks": { "passed": 3, "failed": 0 },
  "blockers": [],
  "nextActions": []
}
```

## 验收标准

1. `knowledge-center-page.tsx` 不再有 `// @ts-nocheck`，`pnpm typecheck` 无错误。
2. 三个 Tab 的模板/话术/提示词均支持真实「读取 + 编辑 + 新建」（POST 创建为新增能力）。
3. 视觉与 3-Tab 交互结构一致。
4. PR 已创建并推送。
