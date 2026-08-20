# 灵犀系统文档

本目录存放产品与技术基线文档，**所有开发必须以技术规约为准**。

## 文档清单

| 文档 | 用途 |
|------|------|
| [灵犀系统产品规划说明书1.0.md](./灵犀系统产品规划说明书1.0.md) | 产品愿景、范围与演进路线 |
| [灵犀系统技术架构选型方案1.0.md](./灵犀系统技术架构选型方案1.0.md) | 技术选型、架构边界与部署形态 |
| [灵犀系统技术规约1.0.md](./灵犀系统技术规约1.0.md) | **强制遵守**的工程规约（仓库结构、分层、API、数据、前端等） |
| [触点独立站集成规约1.0.md](./触点独立站集成规约1.0.md) | 独立站/触点与灵犀中台边界、OpenAPI、事件、分期（如 SmartEva） |
| [触点开放API-P0说明.md](./触点开放API-P0说明.md) | P0 `/api/v1/open/site/**` 联调与骨架说明 |
| [灵犀系统一期功能说明书.md](./灵犀系统一期功能说明书.md) | 一期功能范围与验收基线 |
| [Casdoor-Casbin对接说明.md](./Casdoor-Casbin对接说明.md) | Casdoor/Casbin 落地与本地旁路联调 |
| [Agent-Runtime-LangGraph说明.md](./Agent-Runtime-LangGraph说明.md) | 五大智能体 LangGraph 协作总线与 API |
| [移植差异清单.md](./移植差异清单.md) | 产品代码 1.0（Lingxi Brain）→ 主仓移植差异、修复意见与已确认决议 |
| [NovaTech演示租户Seed规范.md](./NovaTech演示租户Seed规范.md) | 演示租户 10086、双键约定、账号角色与 Casbin 映射 |

## 强制要求

1. 依赖版本只在 `lingxi-dependencies` BOM 中定义，业务模块禁止自行写版本号。
2. 模块内部分层：`api | app | domain | infra | config`；跨模块只依赖对方 `api`。
3. 一期后端为**模块化单体**（`lingxi-server`），通道服务与 LLM 网关、Python Agent Runtime 可独立部署。
4. 统一认证 Casdoor（OIDC）、统一权限 Casbin、业务库 PostgreSQL；Python 仅用于 `lingxi-ai`。
5. 变更架构或规约前须先更新本目录对应文档并评审。