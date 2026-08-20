# contracts.md — 灵犀系统模块间接口契约

> 本文件是灵犀系统所有模块间的**唯一共识契约**。Agent 开发时必须严格遵守此文件中的接口约定。
> 契约变更必须先开 issue 评审，不得由 Agent 私自修改。
> 技术规约详见 `docs/灵犀系统技术规约1.0.md`。

---

## M0. 平台底座（lingxi-platform + lingxi-starters + lingxi-dependencies）

### M0.1 统一响应体

所有 REST 接口返回统一格式（`lingxi-starter-core` 提供）：

```json
{
  "code": 0,
  "message": "success",
  "messageKey": "common.success",
  "data": {},
  "traceId": "a1b2c3d4e5f6"
}
```

- `code`: 0 = 成功；非 0 见错误码分段表
- `traceId`: 全链路追踪 ID，必须回传
- 禁止自行定义响应体

### M0.2 异常体系

- 业务异常一律抛 `BizException(ErrorCode)`
- 全局异常处理器统一转响应体
- 禁止在 Controller 捕获异常后自行拼 JSON
- 禁止吞异常（空 catch）

### M0.3 错误码分段表

| 段 | 模块 |
|----|------|
| 10000-19999 | 平台公共服务（auth/iam/user/tenant/notify/file/audit/id/search） |
| 20000-29999 | 业务运营中心（market/marketing/sales/service） |
| 30000-39999 | 智能决策中心 |
| 40000-49999 | 全球市场中心 |
| 50000-59999 | 数据中心 |
| 60000-69999 | 知识中心 |
| 70000-79999 | 智能体中心 |
| 80000-89999 | 配置中心 |
| 90000-99999 | 触点开放 API |

### M0.4 统一审计字段

每表必备（MyBatis-Plus 自动填充，禁止手工赋值）：

```sql
id            BIGINT       -- 雪花 ID 主键
tenant_id     BIGINT       -- 租户 ID（全局表/字典表除外）
created_by    BIGINT       -- 创建人
created_at    TIMESTAMP    -- 创建时间(UTC)
updated_by    BIGINT       -- 更新人
updated_at    TIMESTAMP    -- 更新时间(UTC)
is_deleted    SMALLINT     -- 逻辑删除标记，默认 0
version       INT          -- 乐观锁，默认 0
```

业务编码字段 `biz_code` 作为唯一业务键，唯一索引 `(tenant_id, biz_code)`。

### M0.5 多租户隔离

- 所有业务表带 `tenant_id`，唯一索引必须带 `tenant_id` 前缀
- 缓存键格式：`lx:{模块}:{业务}:{tenant_id}:{标识}`
- 禁止跨租户查询（除非显式声明全局表/字典表白名单）

---

## M1. 认证与权限（lingxi-platform: auth / iam / user / tenant + lingxi-starters: security）

### M1.1 认证契约

- 认证方式：Casdoor（OIDC）
- 前端登录后持 Bearer Token 访问后端
- 后端 `lingxi-starter-security` 统一校验 Token + 提取租户/用户上下文

### M1.2 权限契约

- 权限模型：Casbin RBAC
- 权限码格式：`{子产品前缀}:{资源}:{动作}`（如 `sal:lead:assign`）
- 权限码定义在 `lingxi-iam` 的 `api` 包中，其他模块引用
- 前端路由级权限：`src/middleware.ts` 校验路由绑定的权限码
- 前端按钮级权限：`<LxPermission code="sal:lead:assign">` 组件

### M1.3 对外 API（api 包提供）

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取当前用户 | GET | `/api/v1/auth/me` | 返回当前登录用户 + 租户 + 权限码列表 |
| 用户登录 | POST | `/api/v1/auth/login` | Casdoor OIDC 回调交换 Token |

### M1.4 依赖方

所有业务模块（M2-M10）依赖 `lingxi-starter-security` 的认证上下文和 `lingxi-iam` 的权限校验。

---

## M2. 数据中心（lingxi-mdata）

### M2.1 职责

管理企业核心主数据：客户、商品、渠道、员工。

### M2.2 对外 API 契约

| 资源 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 客户主数据 | GET | `/api/v1/mdata/customers` | 分页查询，参数 pageNo/pageSize/keyword |
| 客户主数据 | GET | `/api/v1/mdata/customers/{id}` | 详情 |
| 客户主数据 | POST | `/api/v1/mdata/customers` | 创建，支持幂等键 X-Idempotency-Key |
| 客户主数据 | PUT | `/api/v1/mdata/customers/{id}` | 全量更新 |
| 客户主数据 | PATCH | `/api/v1/mdata/customers/{id}` | 局部更新 |
| 商品主数据 | GET | `/api/v1/mdata/products` | 分页查询 |
| 商品主数据 | POST | `/api/v1/mdata/products` | 创建 |
| 渠道主数据 | GET | `/api/v1/mdata/channels` | 分页查询 |
| 员工主数据 | GET | `/api/v1/mdata/employees` | 分页查询 |

### M2.3 数据模型

- 表名前缀：`dc_`（如 `dc_customer`、`dc_product`、`dc_channel`、`dc_employee`）
- 多语言字段用 JSONB：`{"zh-CN":"...","en-US":"..."}`
- 客户 biz_code 前缀：`CUS-`
- 商品 biz_code 前缀：`SKU-`
- 渠道 biz_code 前缀：`CHL-`
- 员工 biz_code 前缀：`EMP-`

### M2.4 领域事件

| 事件 | Topic |
|------|-------|
| 客户创建 | `lx.dc.customer.created` |
| 客户更新 | `lx.dc.customer.updated` |
| 商品创建 | `lx.dc.product.created` |
| 商品更新 | `lx.dc.product.updated` |

### M2.5 依赖方

- M5 销售域依赖客户主数据
- M6 营销域依赖商品主数据（AI 内容生成需要商品信息）
- M4 市场域依赖商品主数据（产品机会扫描需要商品 HS 编码）

---

## M3. 配置中心（lingxi-config）

### M3.1 职责

管理企业公约（行业定义）和权限管理（用户/角色/功能权限）。

### M3.2 对外 API 契约

| 资源 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 行业定义 | GET | `/api/v1/config/industries` | 查询企业行业分类 |
| 行业定义 | PUT | `/api/v1/config/industries` | 更新企业行业 |
| 用户管理 | GET | `/api/v1/config/users` | 分页查询用户 |
| 用户管理 | POST | `/api/v1/config/users` | 创建用户 |
| 用户管理 | PUT | `/api/v1/config/users/{id}` | 更新用户 |
| 角色管理 | GET | `/api/v1/config/roles` | 分页查询角色 |
| 角色管理 | POST | `/api/v1/config/roles` | 创建角色 |
| 功能权限 | GET | `/api/v1/config/permissions` | 查询权限资源树 |

### M3.3 数据模型

- 表名前缀：`sys_`（如 `sys_user`、`sys_role`、`sys_permission`、`sys_industry`）
- 用户 biz_code 前缀：`USR-`
- 角色 biz_code 前缀：`ROL-`

### M3.4 依赖方

- M1 平台底座（权限校验引用权限码定义）
- 所有业务模块（功能权限码注册）

---

## M4. 市场域后端（lingxi-biz: market）

### M4.1 职责

市场搜索指数、热词分析、产品机会扫描。一期 P0 功能：BO-MKT-01/02/05/06/10。

### M4.2 对外 API 契约

| 资源 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 搜索趋势 | GET | `/api/v1/market/search-trends` | 按品类/地区查询搜索热度趋势 |
| 地域热度 | GET | `/api/v1/market/region-heat` | 按国家/地区展示搜索热度分布 |
| 热搜词排行 | GET | `/api/v1/market/hot-keywords` | 按行业/品类/地区展示热门关键词 |
| 上升词 | GET | `/api/v1/market/rising-keywords` | 识别搜索热度上升最快的新兴关键词 |
| 机会扫描 | GET | `/api/v1/market/opportunities` | AI 综合推荐高潜力目标产品/市场组合 |

### M4.3 数据模型

- 表名前缀：`mkt_`（如 `mkt_search_trend`、`mkt_hot_keyword`、`mkt_opportunity`）
- 搜索趋势数据来源：lingxi-marketdata（全球市场中心）
- 热词数据来源：lingxi-marketdata

### M4.4 领域事件

| 事件 | Topic |
|------|-------|
| 机会发现 | `lx.mkt.opportunity.discovered` |

### M4.5 依赖

- 依赖 M0（平台底座）
- 依赖 M2（数据中心：商品主数据 HS 编码）
- 数据源依赖 lingxi-marketdata（全球市场中心）

---

## M5. 销售域后端（lingxi-biz: sales）

### M5.1 职责

线索管理、客户管理、商机管理。一期 P0 功能：BO-SAL-01/04/06/08/09/14。

### M5.2 对外 API 契约

| 资源 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 线索 | GET | `/api/v1/sales/leads` | 分页查询线索 |
| 线索 | GET | `/api/v1/sales/leads/{id}` | 线索详情 |
| 线索 | POST | `/api/v1/sales/leads` | 创建线索（多渠道归集） |
| 线索 | POST | `/api/v1/sales/leads/{id}/assignment` | 线索分配 |
| 线索 | POST | `/api/v1/sales/leads/dedup` | 查重防撞单 |
| 客户 | GET | `/api/v1/sales/customers/{id}` | 360 客户画像 |
| 客户 | POST | `/api/v1/sales/customers` | 创建客户 |
| 商机 | GET | `/api/v1/sales/opportunities` | 分页查询商机 |
| 商机 | GET | `/api/v1/sales/opportunities/{id}` | 商机详情 |
| 商机 | POST | `/api/v1/sales/opportunities` | 创建商机 |
| 商机 | PATCH | `/api/v1/sales/opportunities/{id}/stage` | 商机阶段流转 |

### M5.3 数据模型

- 表名前缀：`sal_`（如 `sal_lead`、`sal_customer`、`sal_opportunity`）
- 线索 biz_code 前缀：`LEAD-`
- 客户 biz_code 前缀：`CUS-`（与数据中心客户主数据对齐）
- 商机 biz_code 前缀：`OPP-`
- 商机阶段枚举：DISCOVERY -> NEED_CONFIRM -> QUOTE -> NEGOTIATION -> WON / LOST
- 状态流转必须经领域方法 `opportunity.advanceTo(stage)`

### M5.4 领域事件

| 事件 | Topic |
|------|-------|
| 线索创建 | `lx.sal.lead.created` |
| 线索分配 | `lx.sal.lead.assigned` |
| 客户创建 | `lx.sal.customer.created` |
| 商机阶段变更 | `lx.sal.opportunity.stage_changed` |

### M5.5 依赖

- 依赖 M0（平台底座）
- 依赖 M2（数据中心：客户主数据同步）

---

## M6. 营销域后端（lingxi-biz: marketing）

### M6.1 职责

社媒账号管理、AI 内容生成。一期 P0 功能：BO-MKG-01/03。

### M6.2 对外 API 契约

| 资源 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 社媒账号 | GET | `/api/v1/marketing/social-accounts` | 查询社媒账号列表 |
| 社媒账号 | POST | `/api/v1/marketing/social-accounts` | 绑定社媒账号 |
| 社媒账号 | DELETE | `/api/v1/marketing/social-accounts/{id}` | 解绑 |
| AI 内容生成 | POST | `/api/v1/marketing/ai-content` | AI 生成图文/视频内容 |

### M6.3 数据模型

- 表名前缀：`mkg_`（如 `mkg_social_account`、`mkg_ai_content`）
- 社媒平台枚举：FACEBOOK / INSTAGRAM / LINKEDIN / TIKTOK
- AI 内容生成调用 lingxi-llm-gateway

### M6.4 领域事件

| 事件 | Topic |
|------|-------|
| 内容生成完成 | `lx.mkg.content.generated` |

### M6.5 依赖

- 依赖 M0（平台底座）
- 依赖 M2（数据中心：商品主数据）
- 依赖 lingxi-llm-gateway（LLM 调用）

---

## M7. 知识中心（lingxi-knowledge）

### M7.1 职责

模板库、话术库、提示词库。一期 P0 功能：KC-07/10/16。

### M7.2 对外 API 契约

| 资源 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 模板 | GET | `/api/v1/knowledge/templates` | 分页查询模板 |
| 模板 | POST | `/api/v1/knowledge/templates` | 创建模板 |
| 话术 | GET | `/api/v1/knowledge/scripts` | 分页查询话术 |
| 话术 | POST | `/api/v1/knowledge/scripts` | 创建话术 |
| 提示词 | GET | `/api/v1/knowledge/prompts` | 分页查询提示词 |
| 提示词 | POST | `/api/v1/knowledge/prompts` | 创建提示词 |

### M7.3 数据模型

- 表名前缀：`kc_`（如 `kc_template`、`kc_script`、`kc_prompt`）
- 模板类型枚举：DEVELOPMENT_LETTER / QUOTATION / CONTRACT / FOLLOWUP_EMAIL
- 多语言内容用 JSONB

### M7.4 依赖

- 依赖 M0（平台底座）
- 提示词库被 lingxi-ai（Agent Runtime）消费

---

## M8. 智能决策中心（lingxi-decision）

### M8.1 职责

全域数据洞察、问答式数据展示。一期 P0 功能：DM-01/02。

### M8.2 对外 API 契约

| 资源 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 经营驾驶舱 | GET | `/api/v1/decision/dashboard` | 核心 KPI 实时监控 |
| 问答式查询 | POST | `/api/v1/decision/ask` | 自然语言查询经营数据 |

### M8.3 数据模型

- 决策中心为只读分析，数据来源 ClickHouse 分析宽表
- 问答式查询调用 lingxi-ai（智能决策智能体）+ lingxi-llm-gateway

### M8.4 依赖

- 依赖 M0（平台底座）
- 依赖 M2（数据中心：主数据）
- 依赖 M5（销售域：销售数据用于分析）
- 依赖 lingxi-ai（Agent Runtime：智能决策智能体）

---

## M9. AI Agent Runtime（lingxi-ai）

### M9.1 职责

五大智能体编排：市场分析、社媒营销、潜客挖掘、销售转化、智能决策。

### M9.2 对外 API 契约

| 资源 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 智能体任务 | POST | `/api/v1/agent/tasks` | 创建智能体任务 |
| 智能体任务 | GET | `/api/v1/agent/tasks/{id}` | 查询任务状态与结果 |
| 智能体对话 | POST | `/api/v1/agent/chat` | 智能体对话接口 |

### M9.3 事件契约

| 事件 | Topic |
|------|-------|
| 智能体任务完成 | `lx.ac.agent.task.completed` |
| 智能体任务失败 | `lx.ac.agent.task.failed` |

### M9.4 与后端交互边界

- Java 后端通过 HTTP API 调用 Python Agent Runtime（不内嵌 LangGraph）
- Python Agent Runtime 通过 MCP 工具调用 Java 后端 API
- 双方仅通过 HTTP API + 领域事件交互

### M9.5 依赖

- 依赖 M4（市场域：市场分析智能体消费市场数据）
- 依赖 M5（销售域：销售转化智能体消费线索/客户数据）
- 依赖 M6（营销域：社媒营销智能体消费账号/内容数据）
- 依赖 M7（知识中心：提示词库）
- 依赖 lingxi-llm-gateway（LLM 调用）

---

## M10. 统一工作台 + 前端全量（lingxi-workbench + lingxi-web）

### M10.1 职责

统一工作台后端 + 前端全量页面。一期 P0 功能：UW-03/04/09/12/13/17/18 + 所有业务页面。

### M10.2 前端路由分区

| 分区 | 路由 | 说明 |
|------|------|------|
| `(workbench)/` | `/`, `/dashboard`, `/tasks` | 统一工作台 |
| `(biz)/market/` | `/market/*` | 市场域 |
| `(biz)/marketing/` | `/marketing/*` | 营销域 |
| `(biz)/sales/` | `/sales/*` | 销售域 |
| `(decision)/` | `/decision/*` | 智能决策中心 |
| `(platform)/mdata/` | `/mdata/*` | 数据中心 |
| `(platform)/knowledge/` | `/knowledge/*` | 知识中心 |
| `(platform)/agent/` | `/agent/*` | 智能体中心 |
| `(platform)/config/` | `/config/*` | 配置中心 |

### M10.3 前端共享包

| 包 | 职责 |
|----|------|
| `lingxi-ui` | 业务组件库（LxTable/LxForm/LxChart/LxPermission/LxDrawer） |
| `lingxi-utils` | 工具函数 |
| `lingxi-request` | 请求封装（TanStack Query + 统一响应体解包） |
| `lingxi-i18n` | next-intl 语言包 |
| `lingxi-types` | 前后端共享类型（OpenAPI 自动生成） |

### M10.4 依赖

- 依赖 M0-M9 全部后端模块的 API 契约
- 前端 `lingxi-types` 包由后端 OpenAPI 契约自动生成

---

## 通用约定

### 分页参数

- `pageNo`（从 1 开始）/ `pageSize`（默认 20，最大 200）
- 分页响应体：`{ list, total, pageNo, pageSize }`

### 时间格式

- 传输一律 UTC ISO8601：`2026-08-15T08:30:00Z`
- 金额传输一律最小货币单位整型或字符串（分为单位的整数），禁止浮点

### 幂等

- 所有写操作（POST 动作类）支持幂等键：请求头 `X-Idempotency-Key`（UUID）
- 服务端按 key + 租户去重，有效期 24 小时

### API 路径前缀

- 统一前缀 `/api/v1`，版本升级升路径版本（`/api/v2`），禁止 header 版本号
- 资源名用 kebab-case 复数名词
- 动作类用 `POST /{资源}/{id}/{动词名词}`（如 `/leads/{id}/assignment`）

### 领域事件信封

```json
{
  "eventId": "uuid",
  "eventType": "lx.sal.lead.created",
  "tenantId": 10086,
  "timestamp": "2026-08-15T08:30:00Z",
  "source": "lingxi-biz-sales",
  "data": {},
  "traceId": "a1b2c3d4"
}
```

### DDL 变更管理

- 所有 DDL 走 Flyway 版本化脚本（PostgreSQL 方言）
- 脚本命名：`V{yyyyMMddHHmm}__{模块}_{描述}.sql`
- 合并主干后禁止修改已发布脚本，修正用新脚本
- 前向兼容三原则：只增列不删列、不修改列语义、删除列需两个版本周期
