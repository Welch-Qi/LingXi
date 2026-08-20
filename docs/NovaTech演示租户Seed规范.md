# NovaTech 演示租户 Seed 规范

> 主仓联调 / 演示 **唯一**标准租户。源自产品代码 1.0（Lingxi Brain）NovaTech 出海事业部，已按主仓规约改写（Casdoor + Casbin + 过渡双键）。  
> 配套：[移植差异清单.md](./移植差异清单.md) §10 决议。

---

## 1. 租户固定值

| 字段 | 值 | 说明 |
|------|-----|------|
| `tenant_id` | `10086` | 与 `lingxi-server` 开放站点 demo、本地旁路一致 |
| `tenant_code` | `nova` | 业务编码 |
| `tenant_name` | `NovaTech 出海事业部` | 展示名 |
| `legacy_id` | `f0000001-1111-1111-1111-111111111101` | 源仓 `core.organizations.id` |
| 行业（CC-01） | `新能源 / 储能设备` | 企业公约行业定义种子 |
| 时区 / 语言 | `Asia/Shanghai` / `zh-CN` | 演示默认 |
| 套餐 | `Enterprise` | 仅演示标签，正式套餐模型二期 |

> 同实例另有源仓 `aurora` / `atlas` 组织：**主仓 seed 默认只灌 NovaTech**，避免干扰联调。

---

## 2. 过渡双键约定

所有从 Brain 迁入或需对账的业务表，在权威主键之外增加遗留键：

| 列 | 类型 | 约束 | 语义 |
|----|------|------|------|
| `id` | `BIGINT` | PK | 雪花 ID，**唯一权威**；对外 API、关联外键一律用此列 |
| `legacy_id` | `UUID` | `UNIQUE` WHERE NOT NULL | 源仓 UUID；新产生数据为 `NULL` |
| `biz_code` | `VARCHAR` | `(tenant_id, biz_code)` 唯一 | 业务可读编码（如 `EMP-LIN`、`CUS-…`） |

规则：

1. **写路径**：只生成 / 返回 `id`；禁止业务代码以 `legacy_id` 作为新建关联目标。  
2. **读路径（过渡期）**：查询接口可同时按 `id` 或 `legacy_id` 解析；命中后响应体只暴露 `id`（`legacy_id` 仅管理端/迁移工具可见）。  
3. **迁移**：导入脚本写入双键；完成后可用任务校验「有 legacy 无孤儿引用」。  
4. **下线**：双键保留 ≥2 个大版本；删除 `legacy_id` 须另开变更单。

可选映射表（大批量迁入时）：

```sql
-- sys_id_map（若采用独立映射而非列级 legacy_id）
-- entity_type VARCHAR, legacy_uuid UUID, id BIGINT, tenant_id BIGINT
-- UNIQUE(entity_type, legacy_uuid), UNIQUE(entity_type, id)
```

一期优先 **列级 `legacy_id`**，减少多表 join。

---

## 3. 演示登录账号（联调主路径）

演示密码统一：`Admin123!`（仅本地 / 演示环境；**禁止用于生产**）。  
正式环境账号由 **Casdoor** 托管；本地可用 `lingxi.security.dev-bypass=true` + 下表 `X-User-Id` / `X-Roles`。

| 角色码（Casbin） | 登录邮箱 | 姓名 | 用户 `id` | `legacy_id` | 岗位 | 侧栏/能力摘要 |
|------------------|----------|------|-----------|-------------|------|----------------|
| `role_admin` | `lin@novatech.com` | 林启涛 | `10086001` | `f0000011-1111-1111-1111-111111111101` | 产品战略总监 | 全部 |
| `role_product` | `product@novatech.com` | 沈拓 | `10086011` | `f000001b-1111-1111-1111-11111111110b` | 产品专家 | 工作台 / 市场·产品 / 决策 / 主数据 |
| `role_marketing` | `su@novatech.com` | 苏晓 | `10086002` | `f0000012-1111-1111-1111-111111111102` | 品牌营销总监 | 工作台 / 营销 / 主数据 |
| `role_sales` | `he@novatech.com` | 何知远 | `10086003` | `f0000013-1111-1111-1111-111111111103` | 全球销售副总裁 | 工作台 / 销售 / 决策 / 主数据 |
| `role_agent` | `sage@novatech.ai` | Sage | `10086021` | `f0000021-1111-1111-1111-111111111101` | 经营决策专家（硅基） | 工作台 / 智能体 / 主数据 |

本地旁路示例：

```http
GET /api/v1/sales/leads
X-User-Id: 10086003
X-Tenant-Id: 10086
X-Roles: role_sales
X-Data-Scope: DEPT
```

管理员：

```http
X-User-Id: 10086001
X-Tenant-Id: 10086
X-Roles: role_admin
```

---

## 4. 扩展人员（业务数据引用，非登录主路径）

灌库时可一并写入员工主数据，供线索分配 / 跟进演示：

| 邮箱 | 姓名 | 用户 `id` | `legacy_id` | 备注 |
|------|------|-----------|-------------|------|
| `zheng@novatech.com` | 郑思远 | `10086004` | `f0000014-…104` | CGO |
| `chen@novatech.com` | 陈昱 | `10086005` | `f0000015-…105` | 数据平台 |
| `li@novatech.com` | 李维 | `10086006` | `f0000016-…106` | CRM |
| `zhou@novatech.com` | 周赫 | `10086007` | `f0000017-…107` | 内容中台；角色 `role_ops`（运营） |
| `wu@novatech.com` | 吴昊 | `10086008` | `f0000018-…108` | 停用演示 |
| `linxiao@novatech.com` | 林晓 | `10086009` | `f0000019-…109` | 大客户销售 |
| `zhaolei@novatech.com` | 赵磊 | `10086010` | `f000001a-…10a` | 销售顾问 |
| `atlas@novatech.ai` | Atlas | `10086022` | `f0000022-…102` | 市场分析智能体账号 |
| `muse@novatech.ai` | Muse | `10086023` | `f0000023-…103` | 内容创意（对位社媒营销智能体） |
| `echo@novatech.ai` | Echo | `10086024` | `f0000024-…104` | 客服/接待（本期不做接待聊天，仅主数据占位） |

硅基账号 `staff_type=AGENT`（或等价枚举），不占用 Casdoor 人类登录配额时可只落员工主数据。

---

## 5. 角色 → 权限码映射（规约格式）

源 Brain 权限码 → 主仓权限码（一期 P0 相关）：

| Brain | 主仓（示例，可扩展） | 授予角色 |
|-------|----------------------|----------|
| `dashboard:view` | `uw:home:view` | admin, product, marketing, sales, agent, ops |
| `analytics:view` | `dm:dashboard:view` / `dm:qa:ask` | admin, product, sales |
| `product:view/edit` | `mkt:trend:view` / `mkt:opportunity:view` 等 | admin, product |
| `marketing:view/edit` | `mkg:social:view` / `mkg:content:generate` | admin, marketing, ops |
| `sales:view/edit` | `sal:lead:view` / `sal:lead:assign` / `sal:customer:view360` / `sal:opportunity:advance` | admin, sales |
| `data:view` | `dc:customer:manage`（只读场景可拆 view） | admin, product, marketing, sales, agent, ops |
| `agents:view/manage` | `ac:agent:view`（一期弱；B6 再补） | admin, agent |
| `config:view/manage` | `cc:user:manage` / `cc:role:manage` / `cc:perm:view` | admin |

Casbin 文件策略见 `lingxi-iam/src/main/resources/casbin/policy.csv`（租户域 `10086`）。

---

## 6. 落地位置（表结构就绪后）

| 产物 | 路径（约定） |
|------|----------------|
| 本规范 | `docs/NovaTech演示租户Seed规范.md` |
| Flyway 可重复 seed | `lingxi-server/src/main/resources/db/migration/R__novatech_demo_seed.sql`（**已提交**） |
| 版本化 DDL | `V202608171900`～`V202608171940`（core/mdata/sales/market/marketing/decision/knowledge） |
| Casbin 演示策略 | `lingxi-platform/lingxi-iam/src/main/resources/casbin/policy.csv` |
| Casdoor 导入说明 | `docs/Casdoor-Casbin对接说明.md`（追加 NovaTech 用户） |

当前 **Flyway DDL + Seed 已入库**；本地启动 `lingxi-server` 即可自动建表并灌入 NovaTech 演示数据。Casdoor 正式用户导入仍按对接说明配置。

---

## 7. 验收口径

1. 五个主路径账号可用旁路头或 Casdoor 登录，租户恒为 `10086`。  
2. `role_sales` 可访问 `GET /api/v1/sales/leads`（`sal:lead:view`）；无权限角色 403。  
3. 新建业务数据仅有 `id`，`legacy_id` 为空；导入样例可带 `legacy_id`。  
4. 开放站点 demo（`site_demo`）与租户 `10086` 绑定不冲突。
