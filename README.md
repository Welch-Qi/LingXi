# 灵犀（Lingxi）

数字化决策与业务运营平台 Monorepo。一期采用**模块化单体**后端 + 单一 Next.js 前端 + 独立 Python Agent Runtime。

基线文档见 [`docs/`](./docs/)，**强制遵守** [技术规约 1.0](./docs/灵犀系统技术规约1.0.md)。

## 架构要点

- **后端**：Java 17 + Spring Boot 3.2.5，Maven 多模块；一期由 `lingxi-server` 聚合平台与业务模块启动
- **认证权限**：Casdoor（OIDC）+ Casbin（RBAC / 数据权限 / 字段权限）
- **数据**：PostgreSQL（业务）+ Redis；消息 RocketMQ；配置/注册 Nacos（占位）
- **前端**：`lingxi-web` — pnpm workspace + Turborepo，单一 Next.js 15 App Router 应用，子产品为路由分区
- **AI**：`lingxi-ai` — Python 3.11 + uv；`lingxi-agent-runtime`（LangGraph）与 `lingxi-data-jobs` 独立部署，不内嵌于 Java 业务模块

## 仓库结构（摘要）

```
lingxi/
├── docs/                 # 产品与技术基线
├── lingxi-dependencies/  # BOM
├── lingxi-starters/      # core / security / mybatis / llm
├── lingxi-platform/      # auth、iam、user、tenant…
├── lingxi-biz/           # market / marketing / sales / service
├── lingxi-knowledge/     # 知识中心
├── lingxi-open-site/     # 触点开放 API（P0）
├── lingxi-server/        # 一期启动应用
├── lingxi-web/           # 前端 monorepo
└── lingxi-ai/            # Python Agent + data-jobs
```

## 快速启动（统一入口）

> 根目录 `Makefile` 统一编排三栈构建，需安装 `make`（Windows: `choco install make`）。

```bash
# 一键安装依赖（Java mvn + 前端 pnpm + AI uv）
make install

# 一键启动开发环境（后端 :8080 + 前端 :3000）
make dev

# 一键构建（后端 jar + 前端产物 + AI wheel）
make build

# 一键测试（后端 mvn test + 前端 vitest + AI pytest）
make test

# 代码检查（后端 checkstyle + 前端 eslint + AI mypy）
make lint
```

### 分栈命令

<details>
<summary>后端（Java 17 + Spring Boot 3.2.5）</summary>

```bash
# 需 JDK 17 + Maven 3.9+（或使用 mvnw wrapper）
./mvnw -DskipTests validate
./mvnw -DskipTests package
# 启动模块化单体
./mvnw -pl lingxi-server -am spring-boot:run
```
</details>

<details>
<summary>前端（Next.js 15 + Turborepo）</summary>

```bash
cd lingxi-web
pnpm install
pnpm dev          # 开发服务器 :3000
pnpm build        # 生产构建
```
</details>

<details>
<summary>AI（Python 3.11 + LangGraph）</summary>

```bash
cd lingxi-ai
uv sync

# 运行测试
uv run --directory lingxi-agent-runtime pytest -q

# 执行协作任务（默认 Mock LLM）
uv run --directory lingxi-agent-runtime python -m lingxi_agent_runtime.main run \
  --goal "分析德国工业泵市场机会" --tenant-id 1 --user-id u_admin

# 启动 HTTP 服务（默认 :8090）
uv run --directory lingxi-agent-runtime python -m lingxi_agent_runtime.main serve
```

说明见 [docs/Agent-Runtime-LangGraph说明.md](./docs/Agent-Runtime-LangGraph说明.md)。
</details>

## 模块清单

### 后端 Maven 模块（15 个）

| 模块 | 说明 |
|------|------|
| `lingxi-dependencies` | 统一 BOM，唯一版本定义处 |
| `lingxi-starters` | 公共 Starter（core / security / mybatis / llm） |
| `lingxi-platform` | 平台公共服务（auth / iam / user / tenant / notify / file / audit / id / search） |
| `lingxi-biz` | 业务运营中心（market / marketing / sales / service） |
| `lingxi-workbench` | 统一工作台 |
| `lingxi-decision` | 智能决策中心 |
| `lingxi-marketdata` | 全球市场中心 |
| `lingxi-mdata` | 数据中心（主数据） |
| `lingxi-knowledge` | 知识中心 |
| `lingxi-agent` | 智能体中心 |
| `lingxi-config` | 配置中心 |
| `lingxi-channel` | 触达通道（email / wa / social） |
| `lingxi-llm-gateway` | LLM 网关 |
| `lingxi-open-site` | 触点开放 API |
| `lingxi-server` | 一期启动应用（聚合模块） |

### 前端（pnpm workspace + Turborepo）

- `lingxi-web/apps/lingxi-web` — 单一 Next.js 15 应用，6 路由分区 13 页面
- `lingxi-web/packages/` — 5 个共享包（ui / utils / request / i18n / types）

### AI（Python，独立部署）

- `lingxi-ai/lingxi-agent-runtime` — Agent 运行时（LangGraph + 5 智能体）
- `lingxi-ai/lingxi-data-jobs` — 全球市场数据拉取任务

## 文档索引

| 文档 | 说明 |
|------|------|
| [docs/README.md](./docs/README.md) | 文档索引与强制约定 |
| [docs/灵犀系统技术规约1.0.md](./docs/灵犀系统技术规约1.0.md) | 技术规约（唯一规范，强制遵守） |
| [docs/灵犀系统一期功能说明书.md](./docs/灵犀系统一期功能说明书.md) | 一期 33 个 P0 功能清单 |
| [docs/api-design.md](./docs/api-design.md) | API 设计规约（路径表/响应体/错误码） |
| [docs/data-model.md](./docs/data-model.md) | 数据模型规约（27 张表定义） |
| [docs/Casdoor-Casbin对接说明.md](./docs/Casdoor-Casbin对接说明.md) | 认证权限对接与本地旁路联调 |
| [docs/触点开放API-P0说明.md](./docs/触点开放API-P0说明.md) | 独立站 OpenAPI P0 骨架联调 |

## 多智能体协作开发

本仓库采用 WorkBuddy × Cursor 混合流水线进行自主式开发：

| 文件 | 说明 |
|------|------|
| [AGENTS.md](./AGENTS.md) | 仓库级 Agent 说明（构建命令/代码规范/分支命名/result.json 协议） |
| [contracts.md](./contracts.md) | 模块间接口契约（M0-M10 模块清单/API 路径/数据模型/领域事件） |
| [TASKS.md](./TASKS.md) | 任务看板（依赖排序/状态总表/并行机会） |
| [tasks/](./tasks/) | 任务简报队列（WorkBuddy 写入，Cursor Agent 读取执行） |
| [artifacts/](./artifacts/) | 结果回传区（Agent 写入 result.json） |
| [Makefile](./Makefile) | 统一构建入口（make install/dev/build/test/lint） |
| [tools/cursor_client.sh](./tools/cursor_client.sh) | Cursor API 封装脚本（dispatch/poll/fetch_result/merge_pr） |
| [.env.example](./.env.example) | 环境变量模板（CURSOR_API_KEY / GITHUB_TOKEN） |

## 认证权限（Casdoor + Casbin）

- 统一认证：Casdoor OIDC；JWT 经 JWKS 校验（`lingxi-starter-security`）
- 统一权限：Casbin（`lingxi-iam`），注解 `@RequirePermission` / `@RequireDataScope`
- 本地默认 `lingxi.security.dev-bypass=true`，用请求头 `X-User-Id` / `X-Tenant-Id` / `X-Roles` 模拟登录（**生产必须关闭**）
- 联调示例：`GET /api/v1/auth/me`、`GET /api/v1/sales/leads`、`GET /api/v1/iam/permissions/check?permCode=sal:lead:view`