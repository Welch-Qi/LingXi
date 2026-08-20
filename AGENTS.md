# AGENTS.md — 灵犀系统仓库级 Agent 说明

> 本文件是所有 AI Agent（Cursor Cloud Agent / cursor-agent CLI / 人工 IDE 认领）在灵犀仓库中工作时的**强制规范**。
> Agent 执行任务前必须完整阅读本文件，并严格遵守其中约定。
> 技术规约详见 `docs/灵犀系统技术规约1.0.md`，模块间契约详见 `contracts.md`。

---

## 1. 项目概览

| 维度 | 内容 |
|------|------|
| 产品 | 灵犀系统 — 面向中小制造企业的 AI-Native 出海营销服 SaaS 平台 |
| 后端 | Java 17 + Spring Boot 3.2.5，Maven 多模块，模块化单体（`lingxi-server` 为聚合启动模块） |
| 前端 | Next.js 15.5（App Router）+ React 19 + TypeScript 5.7 strict，pnpm + Turborepo |
| AI | Python 3.11 + LangGraph，`lingxi-ai/` 下两个子工程：agent-runtime（五大智能体）与 data-jobs（市场数据拉取） |
| 数据库 | PostgreSQL（业务主库）+ Redis（缓存/锁/会话）+ Elasticsearch（检索）+ ClickHouse（分析）+ Milvus（向量）+ MinIO（文件） |
| 认证 | Casdoor（OIDC）；权限 Casbin（RBAC）；多租户隔离 |
| 远程仓库 | https://github.com/Welch-Qi/LingXi |

### 1.1 Maven 模块清单（根 pom.xml）

```
lingxi-dependencies    # 统一 BOM，唯一版本定义处
lingxi-starters        # 公共 Starter（core/security/mybatis/llm）
lingxi-platform        # 平台公共服务（9 子模块：auth/iam/user/tenant/notify/file/audit/id/search）
lingxi-workbench       # 统一工作台
lingxi-biz             # 业务运营中心（market/marketing/sales/service 四域）
lingxi-decision        # 智能决策中心
lingxi-marketdata      # 全球市场中心
lingxi-mdata           # 数据中心（主数据管理）
lingxi-open-site       # 触点开放 API（P0 联调骨架）
lingxi-knowledge       # 知识中心
lingxi-agent           # 智能体中心
lingxi-config          # 配置中心
lingxi-channel         # 触达通道（email/wa/social，独立部署）
lingxi-llm-gateway     # LLM 网关（独立部署）
lingxi-server          # 聚合启动模块（模块化单体入口）
```

### 1.2 模块内部分层（强制）

每个业务模块内部统一五层，依赖单向 `app -> domain <- infra`，跨模块只依赖目标模块的 `api` 包：

```
{module}/
├── api/            # 对外契约：DTO + Interface + 事件定义（其他模块只能依赖此包）
├── app/            # 应用层：Controller、应用服务、装配
├── domain/         # 领域层：实体、值对象、领域服务、仓储接口
├── infra/          # 基础设施：仓储实现、外部适配器、MQ
└── starter/        # 模块装配（Spring Boot 自动配置）
```

---

## 2. 构建与测试命令

### 2.1 后端（Java / Maven）

```bash
# 编译全部模块（根目录执行）
./mvnw clean compile -T 4

# 打包（跳过测试）
./mvnw clean package -DskipTests -T 4

# 运行全量测试
./mvnw test -T 4

# 运行单模块测试
./mvnw test -pl lingxi-platform/lingxi-iam -am

# 启动单体应用（开发环境）
./mvnw spring-boot:run -pl lingxi-server
```

> Maven Wrapper (`mvnw`) 已配置，无需本地安装 Maven。

### 2.2 前端（pnpm + Turborepo）

```bash
cd lingxi-web

# 安装依赖
pnpm install

# 开发服务器
pnpm dev

# 构建
pnpm build

# 运行测试（待配置 vitest）
pnpm test

# Lint
pnpm lint

# 类型检查
pnpm typecheck
```

### 2.3 AI（Python / uv）

```bash
cd lingxi-ai

# 安装依赖（使用 uv 管理）
uv sync

# 运行 Agent Runtime
uv run lingxi-agent-runtime

# 运行数据任务
uv run lingxi-data-jobs

# 运行测试
pytest

# 类型检查
mypy lingxi_agent_runtime
```

### 2.4 统一构建入口（Makefile）

```bash
make build     # 构建三栈（Maven + pnpm + uv）
make test      # 运行全部测试
make lint      # 代码检查
make dev       # 启动开发环境
```

---

## 3. 代码规范要点

### 3.1 后端 Java

- **Java 17 LTS**，record 用于不可变 DTO，switch 模式匹配可用
- 方法不超过 80 行，类不超过 800 行
- 禁止魔法值，必须提取常量
- 统一响应体（`lingxi-starter-core` 提供，禁止自行定义）：
  ```json
  { "code": 0, "message": "success", "messageKey": "common.success", "data": {}, "traceId": "a1b2c3d4" }
  ```
- 业务异常一律抛 `BizException(ErrorCode)`，由全局异常处理器转换
- 参数校验用 Jakarta Validation 注解（`@NotNull/@Size/@Pattern`）
- 事务边界在应用服务层（`@Transactional` 只出现在 app 层），事务内禁止调外部 HTTP/MQ
- 线程池统一通过 `ThreadPoolManager` 创建，禁止 `new Thread` 或 `Executors.newXxx`
- 分布式锁用 Redisson `@DistributedLock(key, waitTime)`，必须有超时
- 所有 DDL 走 Flyway 版本化脚本：`V{yyyyMMddHHmm}__{模块}_{描述}.sql`
- 依赖版本只在 `lingxi-dependencies` BOM 中定义，业务模块禁止写版本号

### 3.2 前端 TypeScript

- TypeScript strict 模式，禁止新增 `any`（复用第三方类型除外）
- Server Component 优先，需要交互时才标 `"use client"`
- 接口数据一律走 `@tanstack/react-query`（`lingxi-request` 封装），禁止存 Zustand 再手动同步
- 表单校验用 zod，与后端 OpenAPI 生成的类型对齐（`lingxi-types` 包）
- 图表组件 SSR 安全：`"use client"` + `next/dynamic` 动态导入 + `ssr: false`
- 禁止硬编码中文文案（注释除外），用 `next-intl`
- UI 组件统一用 shadcn/ui（Base UI 版），禁止混入 Radix UI 版
- 路由分区为 Next.js Route Groups（括号目录），每个分区有独立 `layout.tsx`

### 3.3 Python AI

- Python 3.11+，类型注解必须（mypy strict）
- LangGraph 定义智能体编排图，工具通过 MCP 协议接入
- Java 与 Python 之间仅通过 Agent 网关 API、MCP 工具、领域事件交互，**禁止 Java 内嵌 Agent 编排框架**

---

## 4. Git 分支与提交规范

### 4.1 分支命名

```
main                        # 主干，受保护，只接受 PR 合并
cursor/feat-{module}        # Cursor Agent 自动产出分支（如 cursor/feat-m4-market）
cursor/fix-{module}-{NNN}   # Cursor Agent 修复分支（如 cursor/fix-m4-001）
```

### 4.2 提交信息

```
feat({module}): 简述
fix({module}): 简述
test({module}): 简述
docs: 简述
chore: 简述
```

### 4.3 文件边界（强制）

Agent 执行任务时**只能修改任务简报中指定的文件范围**，禁止越界修改其他模块。

简报中的 `## 范围` 节会明确列出允许修改的路径。未列出的路径**不得修改**，违反者测试 Agent 将拒绝合并。

---

## 5. 任务执行流程

### 5.1 接收任务

1. 读取 `tasks/{任务文件名}.md` 任务简报
2. 读取 `contracts.md` 中对应模块节的契约
3. 阅读 `AGENTS.md`（本文件）了解构建与规范
4. 按简报 `## 输入` 节列出的文档路径阅读相关文档

### 5.2 执行开发

1. 从 `main` 创建分支 `cursor/feat-{module}` 或 `cursor/fix-{module}-{NNN}`
2. 在简报 `## 范围` 限定的路径内开发
3. 遵守 `contracts.md` 中的接口契约，不得私自变更
4. 编写单元测试，覆盖率 >= 80%
5. 运行测试确认通过

### 5.3 回传结果（强制）

完成后必须：

1. 将执行结果写入 `artifacts/{module}/result.json`，格式如下：

```json
{
  "task": "M4-backend",
  "agent": "bc-xxxx",
  "runId": "run-yyyy",
  "status": "COMPLETED",
  "prUrl": "https://github.com/Welch-Qi/LingXi/pull/12",
  "branch": "cursor/feat-m4-market",
  "summary": "实现搜索指数 API 12 个端点，含输入校验与分页",
  "changedFiles": ["lingxi-biz/lingxi-biz-market/src/...", "lingxi-server/src/main/resources/db/migration/..."],
  "tests": { "total": 48, "passed": 48, "failed": 0, "coverage": 0.86 },
  "contractChecks": { "passed": 12, "failed": 0 },
  "blockers": [],
  "nextActions": ["前端对接 /api/v1/market/search-trends"]
}
```

2. `git push` 分支并开 PR（Cloud API 模式下 `autoCreatePR: true` 自动完成）
3. PR 描述中粘贴测试输出摘要

### 5.4 修复循环

- 若测试 Agent 验证失败，会生成 `tasks/{module}-fix-{NNN}.md` 修复简报
- 修复 Agent 读取简报（含失败用例与堆栈），在 `cursor/fix-{module}-{NNN}` 分支上修复
- 修复轮次上限 **5 轮**，超限标记 BLOCKED 并通知人工

---

## 6. 跨模块通信契约（简述，详见 contracts.md）

| 场景 | 方式 | 约束 |
|------|------|------|
| 需要实时结果的读/简单写 | 同步 API（进程内 Interface/Feign，走 api 包契约） | 超时 <= 3s，写重试必须幂等 |
| 业务状态流转通知 | 领域事件（RocketMQ） | Topic: `lx.{前缀}.{实体}.{动作}` |
| 批量数据同步 | CDC/批量任务 | Debezium 抓取 PG WAL -> Kafka -> CH |

**禁止**：跨模块直连数据库/Mapper、循环依赖、同步 API 链路超 3 跳、用前端串多个写接口充当跨域事务。

---

## 7. 环境变量

| 变量 | 用途 | 存储位置 |
|------|------|---------|
| `CURSOR_API_KEY` | Cursor Cloud API 认证 | WorkBuddy 会话配置 / .env |
| `GITHUB_TOKEN` | git fetch / gh pr view / gh pr merge | WorkBuddy 会话配置 / .env |
| `REPO_URL` | 仓库地址（派发时用） | `https://github.com/Welch-Qi/LingXi.git` |
| `DATABASE_URL` | PostgreSQL 连接串 | lingxi-server 配置文件 |
| `REDIS_URL` | Redis 连接串 | lingxi-server 配置文件 |

> 敏感凭证（API Key / Token）不写入仓库，通过环境变量或 WorkBuddy 会话级密钥注入。

---

## 8. 关键文档索引

| 文档 | 路径 |
|------|------|
| 技术规约（强制） | `docs/灵犀系统技术规约1.0.md` |
| 产品规划 | `docs/灵犀系统产品规划说明书1.0.md` |
| 架构选型 | `docs/灵犀系统技术架构选型方案1.0.md` |
| 一期功能 | `docs/灵犀系统一期功能说明书.md` |
| 触点集成 | `docs/触点独立站集成规约1.0.md` |
| Agent Runtime | `docs/Agent-Runtime-LangGraph说明.md` |
| Casdoor 对接 | `docs/Casdoor-Casbin对接说明.md` |
| 移植差异 | `docs/移植差异清单.md` |
| 租户 Seed | `docs/NovaTech演示租户Seed规范.md` |
| 混合流水线方案 | `docs/灵犀系统-WorkBuddy-Cursor混合流水线方案.md` |
| 基础条件评估 | `docs/灵犀系统-多智能体协作基础条件评估.md` |
