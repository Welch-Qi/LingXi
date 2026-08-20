# 灵犀系统 · WorkBuddy × Cursor 混合开发流水线可行性方案

> 日期：2026-08-19 ｜ 模式：**WorkBuddy 编排 + Cursor 核心代码开发**  
> 核心要解决的三件事：① WorkBuddy 如何自动给 Cursor 派任务 ② Cursor 如何执行 ③ 执行结果如何回传

---

## 〇、结论先行

**完全可行，且全部走 Cursor 官方通道，无需任何逆向或私有协议。**

Cursor 官方提供了三个可编程入口，WorkBuddy 只需通过 Bash/curl 即可调用：

| 官方入口                                                   | 定位                | 本方案中的用途                     |
| ------------------------------------------------------ | ----------------- | --------------------------- |
| **cursor-agent CLI**（headless/print 模式）                | 脚本、CI 中非交互执行      | 小任务、修复任务、本地快速执行             |
| **Cloud Agents API**（`api.cursor.com/v1/agents`，公开测试版） | 云端 VM 异步执行、自动开 PR | **模块级开发主通道**                |
| **TypeScript SDK @cursor/sdk**                         | 程序化控制本地/云端 Agent  | 可选，WorkBuddy 侧用 Node 脚本封装时用 |

**核心机制一句话**：WorkBuddy 把任务写成 `tasks/M4-backend.md` 任务简报 → 通过 CLI 或 Cloud API 触发 Cursor Agent 执行 → Cursor 在 git 分支上产出代码并**push 分支 + 开 PR + 写结构化结果文件 `artifacts/M4/result.json`** → WorkBuddy 轮询/拉取后，由测试 Agent 验证 → 通过则合并、解锁下一模块，失败则派修复任务。**派发走"任务文件 + API/CLI 触发"，回传走"git/PR + 结果文件 + 状态 API"，四路互补。**

---

## 一、总体架构

```
┌─────────────────────────────────────────────────────────────┐
│  WorkBuddy 编排层（大脑）                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────┐ │
│  │协调 Agent│ │Automation│ │Task 看板 │ │测试 Agent│ │环境│ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────┘ │
└──────────────┬──────────────────────────────┬───────────────┘
        ① 写 brief + 触发                 ③ 验证闭环（git fetch → 测试 → 合并/重派）
               ↓                                    ↑
┌──────────────┴────────────────────────────────────┴───────────────┐
│  共享 git 仓库（唯一事实源）                                        │
│  tasks/*.md 任务简报 │ contracts.md 契约 │ artifacts/*/result.json │
│  docs/ 文档 │ packages/** 代码 │ 分支 cursor/feat-* │ PR            │
└──────────────┬────────────────────────────────────┬───────────────┘
        ② API/CLI 触发                          ② push + PR + result.json
               ↓                                    ↑
┌─────────────────────────────────────────────────────────────┐
│  Cursor 执行层（双手）                                        │
│  通道A cursor-agent CLI（本地/同步）                          │
│  通道B Cloud Agents API（云端/异步）★主通道                  │
│  通道C 人工在 IDE 认领（复杂模块兜底）                        │
└─────────────────────────────────────────────────────────────┘
```



---

## 二、核心问题①：WorkBuddy 如何自动给 Cursor 派任务

### 通道 A：cursor-agent CLI（本地、同步、适合小任务/修复）

WorkBuddy 直接用 Bash 调用。安装：`curl https://cursor.com/install -fsS | bash`

```bash
# 派发修复任务：非交互 + 允许改文件 + JSON 输出
cursor-agent -p --force --output-format json \
  "读取 tasks/M4-fix-001.md 任务简报，修复其中的 bug，运行相关单元测试确认通过，并把结果写入 artifacts/M4-fix-001.result.json"

# 只读分析（不改文件）
cursor-agent -p --output-format json "审查 src/modules/auth 的代码，输出安全问题清单"

# 云端后台执行长任务（可关终端，之后 --resume 取结果）
cursor-agent -p --force -c "按 tasks/M3-backend.md 实现主数据模块"
```

关键参数：

- `-p / --print`：headless 非交互，输出到 stdout
- `--force / --yolo`：允许 Agent 直接改文件（不加则只读）
- `--output-format text|json|stream-json`：**json 可被 WorkBuddy 直接解析**
- `-c`：转交云端执行；`--resume`：接回结果
- 认证：环境变量 `CURSOR_API_KEY`，或先 `cursor auth login`

> 适用判断：任务 ≤ 10 分钟、单仓库本地、结果可预期。WorkBuddy 同步等待输出即可。

### 通道 B：Cloud Agents API（云端、异步、模块级开发主通道）★

WorkBuddy 用 Bash curl 调用 REST API，**不依赖本地 Cursor 环境**，云端 VM 独立执行。

```bash
# ① 派发任务（创建 agent + 首次 run 入队）
curl -sS --request POST https://api.cursor.com/v1/agents \
  -u "$CURSOR_API_KEY:" \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": {
      "text": "读取仓库中 tasks/M4-backend.md 任务简报和 contracts.md 中 M4 节，实现市场情报模块后端 API。完成后运行测试并把结果写入 artifacts/M4/result.json，提交并推送分支，autoCreatePR 开 PR。"
    },
    "model": { "id": "composer-2" },
    "repos": [{
      "url": "https://github.com/your-org/lingxi",
      "startingRef": "main",
      "autoCreatePR": true
    }],
    "workOnCurrentBranch": false
  }'
# 响应含 agent.id、run.id，例如：
# {"agent":{"id":"bc-xxx","status":"ACTIVE","latestRunId":"run-yyy"},"run":{"id":"run-yyy","status":"CREATING"}}
```

**派发要点**：

- `prompt.text` 中**只引用任务简报文件路径**，不把需求细节塞进 prompt——简报由 WorkBuddy 先写好并 commit 到仓库，Agent 自己读。这样需求变更只改简报，不动派发逻辑
- `repos[].url` + `startingRef` 指定仓库和基线分支
- `autoCreatePR: true`：完成后自动开 PR（PR 就是回传凭证）
- 可选：`envVars` 注入测试密钥、`mcpServers` 注入 GitHub/DB 工具
- 幂等：可传自定义 `agentId`（`bc-<uuid>`），重复 POST 返回 409 而非重复创建

### 通道 C：文件队列（人工/IDE 认领，复杂模块兜底）

WorkBuddy 只写 `tasks/M6-ui-交互联调.md` 并 commit；人在 Cursor IDE 里用 Agents Window 认领执行；完成后同样写回 `artifacts/M6/result.json` + 开 PR。**WorkBuddy 不感知执行者是谁，只认结果文件与 PR**——这是三层通道的统一抽象。

### 三条通道选择

| 场景                     | 推荐通道               | 原因          |
| ---------------------- | ------------------ | ----------- |
| 标准 CRUD 模块（M2/M3/M9）   | B Cloud API        | 异步、可并行、不占本地 |
| Bug 修复（≤5 轮循环内）        | A CLI              | 快、同步、改完即验   |
| 复杂交互/架构敏感模块（M10 超级工作台） | C 文件队列 + 人工        | 需要人在 IDE 里盯 |
| 夜间批量跑标准模块              | B Cloud API × N 并行 | 8 个上限充分利用   |

---

## 三、核心问题②：执行结果如何回传

### 回传四通道（互补，任一路可用即视为"结果已回传"）

| # | 通道             | 机制                                      | WorkBuddy 侧读取                                                   |
| - | -------------- | --------------------------------------- | --------------------------------------------------------------- |
| 1 | **git/PR 状态**  | Cursor push `cursor/feat-*` 分支并开 PR     | `git fetch` + `gh pr view <url> --json state,statusCheckRollup` |
| 2 | **约定产物文件**     | Agent 按要求写 `artifacts/<模块>/result.json` | 直接读文件（主通道，结构化）                                                  |
| 3 | **run 状态 API** | `GET /v1/agents/{id}/runs/{runId}`      | curl 轮询 status：`CREATING/RUNNING/COMPLETED/FAILED`              |
| 4 | **测试报告文件**     | Agent 运行测试后输出 junit.xml / coverage.json | 解析 XML/JSON，统计通过率与覆盖率                                           |

### result.json 契约（Agent 强制遵守，写入任务简报模板）

```json
{
  "task": "M4-backend",
  "agent": "bc-xxxx",
  "runId": "run-yyyy",
  "status": "COMPLETED",            // COMPLETED | FAILED | PARTIAL
  "prUrl": "https://github.com/your-org/lingxi/pull/12",
  "branch": "cursor/feat-m4-backend",
  "summary": "实现搜索指数 API 12 个端点，含输入校验与分页",
  "changedFiles": ["packages/server/src/modules/market/...", "migrations/..."],
  "tests": { "total": 48, "passed": 48, "failed": 0, "coverage": 0.86 },
  "contractChecks": { "passed": 12, "failed": 0 },
  "blockers": [],
  "nextActions": ["前端对接 /api/v1/keywords/search"]
}
```

### WorkBuddy 侧读取与验证脚本（示例）

```bash
# 轮询 run 状态（Automation 每次运行执行）
status=$(curl -sS https://api.cursor.com/v1/agents/bc-xxx/runs/run-yyy -u "$CURSOR_API_KEY:")
# → 若 COMPLETED：
# 1. git fetch origin cursor/feat-m4-backend
# 2. 读 artifacts/M4/result.json
# 3. 测试 Agent 在合并前先跑契约测试（checkout 该分支）
# 4. 全部通过 → 合并 PR（gh pr merge），解锁 M4 后续任务，更新 Task 看板
#    有失败 → 写 tasks/M4-fix-00N.md 修复简报，派修复 Agent（≤5 轮）
```

### 完整闭环时序（以 M4 市场情报为例）

```
T0  协调Agent：M1~M3 已闭环 → 解锁 M4，写 tasks/M4-backend.md（读 contracts.md M4 节）
T1  WorkBuddy：commit 简报 → curl POST /v1/agents 派发（通道B）→ 记录 agentId/runId 到 Task 看板
T2  Cursor 云端 VM：clone 仓库 → 读简报+契约 → 实现 API+migration+单测 → 跑测试
     → 写 artifacts/M4/result.json → push cursor/feat-m4-backend → autoCreatePR
T3  Automation 定时唤醒（每 15 分钟）：GET run 状态 → RUNNING 则跳过
T4  run=COMPLETED：git fetch + 读 result.json + gh pr view 校验
T5  测试Agent：checkout 分支 → 跑契约测试 + E2E → 出 test-report.xml
T6  通过 → 合并 PR → 更新看板（M4 后端 DONE）→ 解锁 M4 前端任务
     失败 → 生成 tasks/M4-fix-001.md（含失败用例与堆栈）→ 回到 T1 派修复 Agent（≤5 轮）
T7  M4 前后端均闭环 → 更新 contracts.md（标记 M4 契约已实现）→ 进入 M5/M6
```

---

## 四、WorkBuddy 侧工程配置

### 4.1 仓库目录约定

```
lingxi/
├── AGENTS.md                  # 仓库级 Agent 说明（构建/测试/规范）
├── contracts.md               # 模块间契约（唯一共识）
├── TASKS.md                   # M1~M10 依赖排序 + 状态总表
├── docs/                      # 产品说明书/API 设计/数据模型/原型
├── tasks/                     # ★ 任务简报队列（WorkBuddy 写入）
│   ├── M4-backend.md
│   └── M4-fix-001.md
├── artifacts/                 # ★ 结果回传区（Agent 写入）
│   └── M4/
│       ├── result.json
│       └── test-report.xml
├── packages/
│   ├── server/  web/  tests/
└── .cursor/
    ├── mcp.json               # 可选：给 Agent 注入 GitHub/DB 工具
    └── rules/                 # 代码风格/技术规约
```

### 4.2 任务简报模板（tasks/M4-backend.md）

```markdown
# 任务：M4 市场情报 · 后端 API 实现
## 输入
- 契约：contracts.md 第 M4 节（必须遵守，不得私自变更）
- API 设计：docs/api-design.md 第 4 章
- 数据模型：docs/data-model.md 第 4 章
- 技术规约：AGENTS.md
## 范围
- 仅允许修改 packages/server/src/modules/market/ 与 migrations/
- 禁止修改 contracts.md 之外的模块文件
## 输出（强制）
1. 完成 12 个 API 端点 + 输入校验 + 分页
2. Prisma migration（向后兼容）
3. 单元测试覆盖率 ≥ 80%
4. 运行 npm test 全部通过
5. 将执行结果写入 artifacts/M4/result.json（格式见模板）
6. push 分支 cursor/feat-m4-backend 并开 PR
## 验收标准
- [ ] 通过 docs/api-design.md 中的 12 个契约用例
- [ ] npm test 0 失败；coverage ≥ 80%
- [ ] 未越界修改其他模块
## 完成后声明
- 在 PR 描述中粘贴测试输出摘要
```

### 4.3 协调 Agent 的自动化 Prompt（WorkBuddy Automation 主循环）

```text
你是灵犀系统开发流水线的协调 Agent。请执行以下循环：

1. 读取仓库根目录 TASKS.md，找到状态为「就绪(READY)且依赖已满足」的下一个模块任务
2. 对每个 READY 任务：
   a. 若 tasks/ 下没有对应简报文件 → 根据 contracts.md 和 docs/ 生成简报并 commit
   b. 若简报已存在且没有 agentId/runId 记录 → 调用 Cursor Cloud Agents API 派发
      （curl POST api.cursor.com/v1/agents，记录返回的 agent.id 和 run.id 到 TASKS.md）
3. 对每个 RUNNING 任务：调用 GET /v1/agents/{id}/runs/{runId} 轮询状态
   - COMPLETED → 进入验证流程：git fetch 对应分支 → 读 artifacts/<模块>/result.json
     → 若 status=COMPLETED 且 tests 通过 → 合并 PR，更新 TASKS.md 为 DONE，
       检查是否解锁新模块；若 FAILED → 生成修复简报 tasks/<模块>-fix-NNN.md（≤5 轮）
   - FAILED → 生成修复简报并重新派发；修复轮次 >5 → 标记 BLOCKED，通知人工
4. 每次运行结束前，用 TaskUpdate 更新本地任务看板（断点续传依据）
5. 全程不修改任何业务代码——你只负责编排、验证、推进
```

### 4.4 关键环境变量（WorkBuddy 会话或 .env）

| 变量               | 用途                                   |
| ---------------- | ------------------------------------ |
| `CURSOR_API_KEY` | Cursor API 认证（Dashboard 生成，按量计费）     |
| `GITHUB_TOKEN`   | git fetch / gh pr view / gh pr merge |
| `REPO_URL`       | 仓库地址（派发时用）                           |

---

## 五、权限、成本与风险

### 5.1 安全

- `CURSOR_API_KEY` 存于 WorkBuddy 会话配置，不写入仓库；派发时用 `envVars` 注入会话级密钥（Cursor 端静态加密，Agent 删除时清除）
- Agent 默认在隔离云端 VM 中执行，代码/密钥不出控制范围；企业可选 self-hosted workers（`env.type: pool/machine`）把执行留在内网
- 关键安全审查（认证/支付/数据导出）强制人工检查点，不交给 Agent 自主合并

### 5.2 成本估算（Cloud API 按量计费）

- 标准模块（如 M3 主数据）：每 Agent run 约 $1~3（含 VM 时长 + MAX 模型）
- 复杂模块（M10 超级工作台）：约 $5~10，可能多轮
- 全项目估算：10 模块 ×（后端+前端+测试 3 run）+ 修复轮次 ≈ 40~~60 run ≈ \*\*$60~~150 总量\*\*，远低于 Cursor Background Agents 重度使用的周账单
- 建议：先跑 M1 记实际账单，再定后续预算；WorkBuddy 侧 Automation 可加「单模块费用上限」护栏

### 5.3 风险与缓解

| 风险              | 缓解                                                  |
| --------------- | --------------------------------------------------- |
| Agent 生成代码有 bug | 测试 Agent 独立验证（不信 Agent 自报）+ Bugbot 审 PR + 人工检查点     |
| 契约冲突（跨模块字段不一致）  | contracts.md 唯一事实源；Agent 想改契约必须先开 issue 等人仲裁        |
| run 卡死/超时       | Automation 轮询超 90 分钟无状态变化 → 强制 FAILED 重派            |
| 修复死循环           | ≤5 轮上限，超限升级人工                                       |
| API 是 Beta      | 接口可能变化 → 派发逻辑收敛到一个 `cursor_client.sh` 脚本，变更只改一处     |
| 多 Agent 并行冲突    | 每个任务独占 git 分支 + 范围限定在 brief 中，合并冲突由测试 Agent 在集成分支发现 |

---

## 六、分阶段落地路线

| 阶段                 | 内容                                                                                                    | 验收                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **P0 环境准备（0.5 天）** | 建 monorepo + AGENTS.md/contracts.md/TASKS.md 骨架；生成 CURSOR_API_KEY；写 cursor_client.sh（派发/轮询/取结果 3 个函数） | 脚本能手动派发一个"写 README"的 Agent 并取回 result.json |
| **P1 单模块试跑（1 天）**  | M1 认证与工作区：协调 Agent 自动派发 M1 后端 → 轮询 → 验证 → 合并                                                          | M1 后端 PR 自动合并，TASKS.md 状态正确流转              |
| **P2 闭环自动化（1 天）**  | 配置 WorkBuddy Automation 每 15 分钟唤醒协调 Agent；加修复循环 + 解锁逻辑                                                | 无人值守跑通 M2/M3                               |
| **P3 并行化（0.5 天）**  | M4/M5/M6 三模块并行派发；加单模块费用上限护栏                                                                           | 三 PR 并行落地，互不冲突                             |
| **P4 全量推进**        | 持续跑 M7~M10；3 个人工检查点按计划介入                                                                              | 全模块闭环，联调通过，交付验收                            |

---

## 七、附录：Cloud Agents API 速查

```bash
# 创建 Agent（派发）
POST https://api.cursor.com/v1/agents      -u $CURSOR_API_KEY:
# 列出 Agent
GET  https://api.cursor.com/v1/agents?limit=20
# 查 Agent 元数据（拿 latestRunId）
GET  https://api.cursor.com/v1/agents/{id}
# 查 run 状态（轮询主接口）
GET  https://api.cursor.com/v1/agents/{id}/runs/{runId}
# 后续指令（修复引导）
POST https://api.cursor.com/v1/agents/{id}/runs  # 追加 prompt 继续同一 Agent
# 删除/归档 Agent
DELETE https://api.cursor.com/v1/agents/{id}
```

> 说明：v1 为公开测试版；旧 v0 支持 Webhooks（Agent 完成时回调）。若需要「Cursor 完成 → 立即通知 WorkBuddy」而非轮询，可在 P2 阶段评估 v0 webhook 或 GitHub PR webhook + WorkBuddy Automation 的组合。本方案默认用轮询，零额外基础设施。

**参考来源**：Cursor Docs（Using Headless CLI / Cloud Agents API / TypeScript SDK）、Cursor 官方论坛（API 商用条款确认）、Cursor 官方博客（TypeScript SDK 发布）、社区实现（custom-cursor-mcp：Cursor Agents API 编排 GitHub issue→PR 全流程）。
