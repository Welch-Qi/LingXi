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

## 构建

### 后端

```bash
# 需 JDK 17 + Maven 3.9+
mvn -DskipTests validate
mvn -DskipTests package
# 启动模块化单体
mvn -pl lingxi-server -am spring-boot:run
```

### 前端

```bash
cd lingxi-web
pnpm install
pnpm dev
```

### AI

```bash
cd lingxi-ai
uv sync

# Windows 若 uv run --package 因编码报错，可用：
#   .venv\Scripts\python.exe -m ...
# 并设置 PYTHONPATH=lingxi-agent-runtime\src

# 执行一次协作任务（默认 Mock LLM）
uv run --directory lingxi-agent-runtime pytest -q
uv run --directory lingxi-agent-runtime python -m lingxi_agent_runtime.main run \
  --goal "分析德国工业泵市场机会" --tenant-id 1 --user-id u_admin

# 启动 HTTP 服务（默认 :8090）
uv run --directory lingxi-agent-runtime python -m lingxi_agent_runtime.main serve
```

说明见 [docs/Agent-Runtime-LangGraph说明.md](./docs/Agent-Runtime-LangGraph说明.md)。

## 文档

| 文档 | 说明 |
|------|------|
| [docs/README.md](./docs/README.md) | 文档索引与强制约定 |
| [docs/Casdoor-Casbin对接说明.md](./docs/Casdoor-Casbin对接说明.md) | 认证权限对接与本地旁路联调 |
| [docs/触点开放API-P0说明.md](./docs/触点开放API-P0说明.md) | 独立站 OpenAPI P0 骨架联调 |
| 产品规划 / 架构选型 / 技术规约 / 一期功能说明书 | 均在 `docs/` |

## 认证权限（Casdoor + Casbin）

- 统一认证：Casdoor OIDC；JWT 经 JWKS 校验（`lingxi-starter-security`）
- 统一权限：Casbin（`lingxi-iam`），注解 `@RequirePermission` / `@RequireDataScope`
- 本地默认 `lingxi.security.dev-bypass=true`，用请求头 `X-User-Id` / `X-Tenant-Id` / `X-Roles` 模拟登录（**生产必须关闭**）
- 联调示例：`GET /api/v1/auth/me`、`GET /api/v1/sales/leads`、`GET /api/v1/iam/permissions/check?permCode=sal:lead:view`