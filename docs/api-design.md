# 灵犀系统 API 设计规约

> 从《灵犀系统技术规约 1.0》第四章「接口设计规约」抽取并细化，作为 Cursor 执行 Agent 的接口契约参考。
> 权威源仍为技术规约；本文档为其可独立查阅的 API 专规。

---

## 1. URL 规范

### 1.1 路径前缀与版本

```
/api/v1/{服务}/{资源复数}
```

- 统一前缀 `/api/v1`，版本升级升路径版本（`/api/v2`），**禁止 header 版本号**。
- 资源名用 **kebab-case 复数名词**。
- 动作类（非 CRUD）用 `POST /{资源}/{id}/{动词名词}`。

### 1.2 RESTful 动词

| 方法 | 语义 | 示例 |
|------|------|------|
| `POST` | 创建 | `POST /api/v1/sales/leads` |
| `GET` | 查询（列表/详情） | `GET /api/v1/sales/leads` / `GET /api/v1/sales/leads/{id}` |
| `PUT` | 全量更新 | `PUT /api/v1/sales/leads/{id}` |
| `PATCH` | 局部更新（推荐用于状态类操作） | `PATCH /api/v1/sales/leads/{id}` |
| `DELETE` | 逻辑删除 | `DELETE /api/v1/sales/leads/{id}` |

### 1.3 动作类端点

非 CRUD 操作用动词子资源：

```
POST /api/v1/sales/leads/{id}/assignment      线索分配
POST /api/v1/mkg/campaigns/{id}/launch         营销活动发布
POST /api/v1/mkg/contents/{id}/publish         内容发布
POST /api/v1/sales/opportunities/{id}/advance  商机阶段推进
POST /api/v1/uw/tasks/{id}/complete            任务完成
POST /api/v1/uw/inquiries/{id}/acknowledge    询盘确认
```

---

## 2. 按子产品的 API 路径表

> 路径前缀中 `{服务}` 对应技术规约 1.2 命名表的服务名。

### 2.1 平台核心 (platform)

| 方法 | 路径 | 功能编号 | 说明 |
|------|------|---------|------|
| `GET` | `/api/v1/platform/tenants/{id}` | — | 租户详情 |
| `PATCH` | `/api/v1/platform/tenants/{id}` | CC-01 | 更新租户行业/区域 |
| `GET` | `/api/v1/platform/users` | CC-13 | 用户列表（分页） |
| `POST` | `/api/v1/platform/users` | CC-13 | 创建用户 |
| `PATCH` | `/api/v1/platform/users/{id}` | CC-13 | 更新用户 |
| `POST` | `/api/v1/platform/users/{id}/activate` | CC-13 | 启用 |
| `POST` | `/api/v1/platform/users/{id}/deactivate` | CC-13 | 停用 |
| `GET` | `/api/v1/platform/roles` | CC-14 | 角色列表 |
| `POST` | `/api/v1/platform/roles` | CC-14 | 创建角色 |
| `PUT` | `/api/v1/platform/roles/{id}` | CC-14 | 更新角色（含权限映射） |
| `GET` | `/api/v1/platform/permissions` | CC-15 | 功能权限码列表 |

### 2.2 数据中心 (mdata)

| 方法 | 路径 | 功能编号 | 说明 |
|------|------|---------|------|
| `GET` | `/api/v1/mdata/customers` | DC-01 | 客户列表（分页+搜索） |
| `POST` | `/api/v1/mdata/customers` | DC-01 | 创建客户 |
| `GET` | `/api/v1/mdata/customers/{id}` | DC-01 | 客户详情（360°画像聚合） |
| `PUT` | `/api/v1/mdata/customers/{id}` | DC-01 | 更新客户 |
| `GET` | `/api/v1/mdata/products` | DC-02 | 商品列表 |
| `POST` | `/api/v1/mdata/products` | DC-02 | 创建商品 |
| `GET` | `/api/v1/mdata/channels` | DC-03 | 渠道列表 |
| `POST` | `/api/v1/mdata/channels` | DC-03 | 创建渠道 |
| `GET` | `/api/v1/mdata/staff` | DC-04 | 员工列表 |
| `POST` | `/api/v1/mdata/staff` | DC-04 | 创建员工 |

### 2.3 销售域 (sales)

| 方法 | 路径 | 功能编号 | 说明 |
|------|------|---------|------|
| `POST` | `/api/v1/sales/leads` | BO-SAL-01 | 创建线索（多渠道归集） |
| `GET` | `/api/v1/sales/leads` | BO-SAL-01 | 线索列表（分页+状态筛选） |
| `GET` | `/api/v1/sales/leads/{id}` | BO-SAL-01 | 线索详情 |
| `PATCH` | `/api/v1/sales/leads/{id}` | BO-SAL-04 | 更新线索 |
| `POST` | `/api/v1/sales/leads/{id}/assignment` | BO-SAL-04 | 线索分配 |
| `POST` | `/api/v1/sales/leads/check-duplicate` | BO-SAL-06 | 查重防撞单 |
| `GET` | `/api/v1/sales/leads/{id}/follows` | — | 跟进记录列表 |
| `POST` | `/api/v1/sales/leads/{id}/follows` | — | 添加跟进记录 |
| `GET` | `/api/v1/sales/customers/{id}/profile360` | BO-SAL-08 | 360°客户画像 |
| `GET` | `/api/v1/sales/opportunities` | BO-SAL-14 | 商机列表 |
| `POST` | `/api/v1/sales/opportunities` | BO-SAL-14 | 创建商机 |
| `POST` | `/api/v1/sales/opportunities/{id}/advance` | BO-SAL-14 | 商机阶段推进 |
| `GET` | `/api/v1/sales/reception/sessions` | — | 接待会话列表 |
| `POST` | `/api/v1/sales/reception/sessions` | — | 创建接待会话 |
| `GET` | `/api/v1/sales/reception/sessions/{id}/messages` | — | 会话消息列表 |
| `POST` | `/api/v1/sales/reception/sessions/{id}/messages` | — | 发送消息 |

### 2.4 营销域 (mkg)

| 方法 | 路径 | 功能编号 | 说明 |
|------|------|---------|------|
| `GET` | `/api/v1/mkg/social-accounts` | BO-MKG-01 | 社媒账号列表 |
| `POST` | `/api/v1/mkg/social-accounts/{id}/connect` | BO-MKG-01 | 授权连接 |
| `POST` | `/api/v1/mkg/social-accounts/{id}/disconnect` | BO-MKG-01 | 断开连接 |
| `GET` | `/api/v1/mkg/contents` | BO-MKG-03 | 内容素材列表 |
| `POST` | `/api/v1/mkg/contents` | BO-MKG-03 | 创建内容素材 |
| `POST` | `/api/v1/mkg/contents/{id}/generate` | BO-MKG-03 | AI 生成内容 |
| `POST` | `/api/v1/mkg/contents/{id}/publish` | BO-MKG-03 | 发布内容 |
| `GET` | `/api/v1/mkg/campaigns` | — | 营销活动列表 |
| `POST` | `/api/v1/mkg/campaigns` | — | 创建活动 |
| `POST` | `/api/v1/mkg/campaigns/{id}/launch` | — | 启动活动 |

### 2.5 市场域 (mkt)

| 方法 | 路径 | 功能编号 | 说明 |
|------|------|---------|------|
| `GET` | `/api/v1/mkt/search-trends` | BO-MKT-01 | 搜索趋势分析 |
| `GET` | `/api/v1/mkt/search-trends/regions` | BO-MKT-02 | 地域热度分布 |
| `GET` | `/api/v1/mkt/hot-keywords` | BO-MKT-05 | 热搜词排行 |
| `GET` | `/api/v1/mkt/hot-keywords/rising` | BO-MKT-06 | 上升词发现 |
| `GET` | `/api/v1/mkt/opportunities` | BO-MKT-10 | 机会扫描 |

### 2.6 智能决策 (decision)

| 方法 | 路径 | 功能编号 | 说明 |
|------|------|---------|------|
| `GET` | `/api/v1/decision/kpi-dashboard` | DM-01 | 全局数据驾驶舱 |
| `POST` | `/api/v1/decision/qa` | DM-02 | 问答式数据查询（NL2数据） |

### 2.7 知识中心 (knowledge)

| 方法 | 路径 | 功能编号 | 说明 |
|------|------|---------|------|
| `GET` | `/api/v1/knowledge/templates` | KC-07 | 模板列表 |
| `POST` | `/api/v1/knowledge/templates` | KC-07 | 创建模板 |
| `GET` | `/api/v1/knowledge/scripts` | KC-10 | 话术列表 |
| `POST` | `/api/v1/knowledge/scripts` | KC-10 | 创建话术 |
| `GET` | `/api/v1/knowledge/prompts` | KC-16 | 提示词列表 |
| `POST` | `/api/v1/knowledge/prompts` | KC-16 | 创建提示词 |

### 2.8 统一工作台 (workbench)

| 方法 | 路径 | 功能编号 | 说明 |
|------|------|---------|------|
| `GET` | `/api/v1/workbench/dashboard` | UW-03 | 个性化工作区 |
| `GET` | `/api/v1/workbench/tasks` | UW-09 | 统一待办列表 |
| `PATCH` | `/api/v1/workbench/tasks/{id}` | UW-12 | 更新任务状态 |
| `POST` | `/api/v1/workbench/tasks/{id}/complete` | UW-12 | 完成任务 |
| `GET` | `/api/v1/workbench/inquiries` | UW-17 | 询盘提醒列表 |
| `POST` | `/api/v1/workbench/inquiries/{id}/acknowledge` | UW-17 | 确认询盘 |

### 2.9 触点开放 API (open/site)

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/v1/open/site/leads` | 站点线索回传 |
| `POST` | `/api/v1/open/site/orders` | 订单创建回传 |
| `POST` | `/api/v1/open/site/orders/{id}/paid` | 支付成功回传 |

---

## 3. 统一响应体

所有 REST 接口返回统一响应体（`lingxi-starter-core` 提供，**禁止自行定义**）：

```json
{
  "code": 0,
  "message": "success",
  "messageKey": "common.success",
  "data": { },
  "traceId": "a1b2c3d4e5f6"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | int | 0=成功；非 0 见错误码分段表 |
| `message` | string | 面向开发者的英文描述 |
| `messageKey` | string | 面向用户的 i18n 消息键 |
| `data` | object | 业务数据 |
| `traceId` | string | 全链路追踪 ID，必须回传 |

### 分页响应体

```json
{
  "code": 0,
  "data": {
    "list": [ ],
    "total": 150,
    "pageNo": 1,
    "pageSize": 20
  },
  "traceId": "..."
}
```

---

## 4. HTTP 头约定

| Header | 说明 |
|--------|------|
| `Authorization` | `Bearer {Access Token}`（Casdoor 签发 JWT） |
| `X-Tenant-Id` | 租户 ID（网关注入，业务代码从 TenantContext 读取） |
| `X-Trace-Id` | 链路追踪 ID（网关生成，全链路透传） |
| `X-Idempotency-Key` | 写操作幂等键（UUID） |
| `Accept-Language` | 用户语言 locale |
| `X-Timezone` | 用户时区（IANA 时区名） |
| `X-Site-Id` | 触点站点 ID（开放分区必填） |
| `X-Site-Channel` | 触点类型（开放分区必填） |

---

## 5. 通用约定

### 5.1 分页

- 参数：`pageNo`（从 1 开始）/ `pageSize`（默认 20，最大 200）
- 响应：`{ list, total, pageNo, pageSize }`
- 禁止深翻页（`OFFSET 100000`），用游标方式（`WHERE id > {lastId} ORDER BY id LIMIT 20`）

### 5.2 时间

- 传输一律 UTC ISO8601：`2026-08-15T08:30:00Z`
- 数据库存储 TIMESTAMPTZ（UTC）
- 禁止 `new Date()` 直接格式化入库存本地时间

### 5.3 金额

- 传输一律**最小货币单位整型或字符串**（分为单位的整数）
- 禁止浮点
- 存储：`amount_minor BIGINT` + `currency VARCHAR(8)`（ISO 4217）

### 5.4 幂等

- 所有写操作（POST 动作类）支持幂等键：请求头 `X-Idempotency-Key`（UUID）
- 服务端按 key + 租户去重，有效期 24 小时

### 5.5 限流

- 开放 API 走 APISIX 独立分区
- 租户级限流默认 100 QPS
- 响应头回传 `X-RateLimit-*`

---

## 6. 错误码分段表

错误码为 6 位整数 `AABBCC`：AA=子产品段，BB=模块段，CC=序号。

| AA 段 | 子产品 | AA 段 | 子产品 |
|-------|--------|-------|--------|
| 01 | 公共/平台级 | 30 | 智能决策中心 |
| 02 | 通道服务 | 40 | 智能决策备用 |
| 03 | 触点/独立站 | 50 | 全球市场中心 |
| 10 | 统一工作台 | 60 | 数据中心 |
| 20 | 市场 | 70 | 知识中心 |
| 21 | 营销 | 80 | 智能体中心 |
| 22 | 销售 | 90 | 配置中心 |
| 23 | 服务 | — | — |

### 平台级公共错误码

| 错误码 | 含义 |
|-------|------|
| 010001 | 未认证/Token 失效 |
| 010002 | 无功能权限 |
| 010003 | 无数据权限（越权） |
| 010004 | 参数校验失败 |
| 010005 | 资源不存在 |
| 010006 | 资源冲突（重复/并发版本冲突） |
| 010007 | 幂等冲突（重复请求） |
| 010008 | 租户配额超限 |
| 010009 | 限流 |
| 019999 | 系统内部错误 |
| 020001 | 邮件通道发送失败 |
| 020002 | WhatsApp 通道发送失败 |
| 020003 | 社媒平台 API 调用失败/授权过期 |
| 030001 | 站点未绑定/站点无效 |
| 030002 | 站点与租户不匹配 |
| 030003 | 触点签名或 M2M 凭证无效 |
| 030004 | 商品镜像版本冲突 |
| 030005 | 订单回传幂等冲突 |
| 800001 | LLM 网关调用失败（已降级） |
| 800002 | 智能体任务执行失败（已转人工） |

---

## 7. 契约管理

- **API-First**：先提交 OpenAPI 3.0 契约（`docs/contract/{模块}/{接口}.yaml`）评审通过后才能开发
- 契约变更需评审并在 CHANGELOG 注明兼容性影响
- 跨模块调用签名必须与 OpenAPI 契约一致，CI 用 Pact 做契约测试
- **向后兼容原则**：只加字段不删字段不改语义；废弃字段标记 `@Deprecated` 并保留 >=2 个版本周期；Breaking 变更必须升版本路径

---

## 8. 异常处理

- 业务异常一律抛 `BizException(ErrorCode)`，由全局异常处理器统一转响应体
- **禁止**在 Controller 捕获异常后自行拼 JSON
- **禁止**吞异常（空 catch）
- 参数校验使用 Jakarta Validation 注解（`@NotNull/@Size/@Pattern`），DTO 上声明，Controller 加 `@Validated`

---

*本文档从《灵犀系统技术规约 1.0》第四章抽取并按一期功能清单细化。权威源为技术规约。*
