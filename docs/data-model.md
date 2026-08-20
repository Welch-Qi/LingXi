# 灵犀系统数据模型规约

> 从《灵犀系统技术规约 1.0》第五章「数据库规约」抽取，并结合 Flyway 迁移脚本中的实际表定义。
> 权威源仍为技术规约；本文档为数据模型的独立可查阅专规。

---

## 1. 命名与基础规范

### 1.1 Schema 组织

| Schema | 用途 | 表前缀 |
|--------|------|--------|
| `lingxi_core` | 平台核心（租户、用户） | `sys_` |
| `lingxi_biz` | 业务域（销售、营销、市场、决策、工作台） | `{模块}_` |
| `lingxi_platform` | 平台服务（知识、配置、智能体） | `{模块}_` |

### 1.2 表命名

- 格式：`{模块}_{业务实体}`，小写下划线
- 示例：`sales_lead`、`sales_opportunity`、`mkt_campaign`、`kc_template`、`dc_customer`、`sys_tenant`
- 公共/系统表前缀 `sys_`

### 1.3 字段命名

- 小写下划线
- 禁用数据库保留字
- 布尔语义字段用 `is_` 前缀（`is_deleted`、`is_active`），类型用 `BOOLEAN` 或 `SMALLINT`

### 1.4 每表必备审计字段

> MyBatis-Plus 自动填充，**禁止手工赋值**。

```sql
id            BIGINT       -- 雪花ID主键
tenant_id     BIGINT       -- 租户ID（全局表/字典表除外，白名单制）
created_by    BIGINT       -- 创建人
created_at    TIMESTAMPTZ  -- 创建时间(UTC)
updated_by    BIGINT       -- 更新人
updated_at    TIMESTAMPTZ  -- 更新时间(UTC)
is_deleted    SMALLINT     -- 逻辑删除标记，默认0
version       INT          -- 乐观锁，默认0
```

### 1.5 业务编码

- 每个核心实体有 `biz_code` 作为唯一业务键，与主键 `id` 并存
- 唯一索引：`(tenant_id, biz_code)`
- 部分实体额外有 `legacy_id UUID`（兼容旧系统迁移）

### 1.6 多语言字段

- 统一用 `JSONB`：`{"zh-CN":"...","en-US":"..."}`
- 跨域 API 传输必须带明确 locale
- 查询用 `->>'{locale}'` 提取并按需建表达式索引
- 示例：`dc_product.name_i18n JSONB`

---

## 2. 实体表定义（按 Flyway 迁移顺序）

### 2.1 平台核心 (lingxi_core.sys_*)

#### sys_tenant — 租户

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `legacy_id` | UUID UNIQUE | 旧系统ID |
| `biz_code` | VARCHAR(64) | 业务编码 |
| `name` | VARCHAR(256) | 租户名称 |
| `plan_code` | VARCHAR(64) | 套餐编码 |
| `industry` | VARCHAR(128) | 行业 |
| `region` | VARCHAR(64) | 区域 |
| `timezone` | VARCHAR(64) | 时区，默认 `Asia/Shanghai` |
| `language` | VARCHAR(16) | 语言，默认 `zh-CN` |
| `status` | VARCHAR(32) | 状态，默认 `ACTIVE` |
| 审计字段 | — | 标准审计字段 |

唯一约束：`uk_sys_tenant_biz_code (biz_code)`

#### sys_user — 用户

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `legacy_id` | UUID UNIQUE | 旧系统ID |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `biz_code` | VARCHAR(64) | 工号 |
| `email` | VARCHAR(256) | 邮箱 |
| `display_name` | VARCHAR(128) | 显示名 |
| `staff_type` | VARCHAR(16) | 人员类型，默认 `HUMAN` |
| `department` | VARCHAR(128) | 部门 |
| `title` | VARCHAR(128) | 职位 |
| `phone` | VARCHAR(64) | 电话 |
| `sex` | VARCHAR(16) | 性别 |
| `is_active` | BOOLEAN | 是否启用 |
| `casdoor_name` | VARCHAR(128) | Casdoor账号名 |
| 审计字段 | — | 标准审计字段 |

唯一约束：`uk_sys_user_tenant_biz (tenant_id, biz_code)`、`uk_sys_user_tenant_email (tenant_id, email)`

---

### 2.2 主数据 (lingxi_core.dc_*)

#### dc_customer — 客户主数据

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `biz_code` | VARCHAR(64) | 客户编码 (CUS-) |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `name` | VARCHAR(256) | 客户名称 |
| `customer_type` | VARCHAR(32) | 类型，默认 `ENTERPRISE` |
| `country` | VARCHAR(64) | 国家 |
| `industry` | VARCHAR(128) | 行业 |
| `website` | VARCHAR(512) | 官网 |
| `domain` | VARCHAR(256) | 域名 |
| `credit_level` | VARCHAR(32) | 信用等级 |
| `owner_user_id` | BIGINT | 归属人 |
| `tags` | JSONB | 标签 |
| 审计字段 | — | 标准审计字段 |

唯一约束：`uk_dc_customer_biz (tenant_id, biz_code)`

#### dc_product — 商品主数据

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `biz_code` | VARCHAR(64) | 商品编码 |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `sku` | VARCHAR(128) | SKU编码 |
| `name_i18n` | JSONB | 多语言名称 |
| `brand` | VARCHAR(128) | 品牌 |
| `category` | VARCHAR(128) | 分类 |
| `hs_code` | VARCHAR(64) | HS编码 |
| `status` | VARCHAR(32) | 状态，默认 `ACTIVE` |
| 审计字段 | — | 标准审计字段 |

唯一约束：`uk_dc_product_biz (tenant_id, biz_code)`、`uk_dc_product_sku (tenant_id, sku)`

#### dc_channel — 渠道主数据

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `biz_code` | VARCHAR(64) | 渠道编码 |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `name` | VARCHAR(256) | 渠道名称 |
| `channel_type` | VARCHAR(64) | 渠道类型 |
| `cover_region` | VARCHAR(128) | 覆盖区域 |
| `status` | VARCHAR(32) | 状态，默认 `ACTIVE` |
| 审计字段 | — | 标准审计字段 |

唯一约束：`uk_dc_channel_biz (tenant_id, biz_code)`

---

### 2.3 销售域 (lingxi_biz.sales_*)

#### sales_lead — 线索

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `biz_code` | VARCHAR(64) | 线索编码 (LEAD-) |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `company_name` | VARCHAR(256) | 公司名称 |
| `contact_name` | VARCHAR(128) | 联系人 |
| `email` | VARCHAR(256) | 邮箱 |
| `phone` | VARCHAR(64) | 电话 |
| `country` | VARCHAR(64) | 国家 |
| `source_channel` | VARCHAR(64) | 来源渠道 |
| `score` | INT | 评分，默认 0 |
| `status` | VARCHAR(32) | 状态，默认 `NEW` |
| `owner_user_id` | BIGINT | 归属人 |
| `customer_id` | BIGINT | 关联客户 |
| `website` | VARCHAR(512) | 官网（追加列） |
| `domain` | VARCHAR(256) | 域名（追加列） |
| `pool_at` | TIMESTAMPTZ | 进入公海时间（追加列） |
| `claimed_at` | TIMESTAMPTZ | 认领时间（追加列） |
| `remark` | TEXT | 备注 |
| 审计字段 | — | 标准审计字段 |

索引：`idx_sales_lead_tenant_status (tenant_id, status)`、`idx_sales_lead_company (tenant_id, company_name)`、`idx_sales_lead_domain (tenant_id, domain)`、`idx_sales_lead_email (tenant_id, email)`、`idx_sales_lead_owner (tenant_id, owner_user_id)`

#### sales_lead_follow — 线索跟进记录

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `lead_id` | BIGINT NOT NULL | 线索ID |
| `follow_type` | VARCHAR(32) | 跟进类型，默认 `CALL` |
| `content` | TEXT NOT NULL | 跟进内容 |
| `next_follow_at` | TIMESTAMPTZ | 下次跟进时间 |
| `operator_id` | BIGINT | 操作人 |
| 审计字段 | — | 标准审计字段 |

索引：`idx_sales_lead_follow_lead (tenant_id, lead_id)`

#### sales_opportunity — 商机

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `biz_code` | VARCHAR(64) | 商机编码 |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `name` | VARCHAR(256) | 商机名称 |
| `customer_id` | BIGINT | 关联客户 |
| `lead_id` | BIGINT | 来源线索 |
| `stage` | VARCHAR(64) | 阶段，默认 `DISCOVER` |
| `amount_minor` | BIGINT | 金额（最小单位整数），默认 0 |
| `currency` | VARCHAR(8) | 币种，默认 `USD` |
| `owner_user_id` | BIGINT | 归属人 |
| `expected_close` | DATE | 预计成交日期 |
| `lost_reason` | VARCHAR(512) | 输单原因 |
| 审计字段 | — | 标准审计字段 |

**商机阶段状态机**：`DISCOVER` -> `REQUIREMENT` -> `QUOTE` -> `NEGOTIATION` -> `WON` / `LOST`

#### sales_reception_session — 接待会话

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `biz_code` | VARCHAR(64) | 会话编码 |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `contact_name` | VARCHAR(128) | 联系人 |
| `avatar_text` | VARCHAR(8) | 头像文字 |
| `market` | VARCHAR(64) | 市场 |
| `source` | VARCHAR(64) | 来源 |
| `intent_level` | VARCHAR(16) | 意向等级 |
| `product` | VARCHAR(256) | 产品 |
| `waiting` | VARCHAR(64) | 等待状态 |
| `unread_count` | INT | 未读消息数 |
| `last_summary` | VARCHAR(512) | 最近摘要 |
| `lead_id` | BIGINT | 关联线索 |
| `customer_id` | BIGINT | 关联客户 |
| 审计字段 | — | 标准审计字段 |

索引：`idx_sales_session_tenant (tenant_id, updated_at DESC)`

#### sales_reception_message — 接待消息

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `session_id` | BIGINT NOT NULL | 会话ID |
| `sender_type` | VARCHAR(16) | 发送者类型（CUSTOMER/AGENT/AI） |
| `body` | TEXT NOT NULL | 消息内容 |
| `sent_at` | TIMESTAMPTZ | 发送时间 |
| 审计字段 | — | 标准审计字段 |

索引：`idx_sales_msg_session (tenant_id, session_id, sent_at)`

---

### 2.4 营销域 (lingxi_biz.mkg_*)

#### mkg_social_account — 社媒账号

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `platform` | VARCHAR(64) | 平台（Facebook/Instagram/LinkedIn/TikTok） |
| `account_name` | VARCHAR(256) | 账号名 |
| `auth_status` | VARCHAR(32) | 授权状态，默认 `DISCONNECTED` |
| `external_ref` | VARCHAR(256) | 平台引用ID |
| 审计字段 | — | 标准审计字段 |

#### mkg_content_asset — 内容素材

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `biz_code` | VARCHAR(64) | 素材编码 |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `title` | VARCHAR(512) | 标题 |
| `content_type` | VARCHAR(32) | 类型，默认 `TEXT` |
| `body` | TEXT | 正文 |
| `locale` | VARCHAR(16) | 语言，默认 `zh-CN` |
| `status` | VARCHAR(32) | 状态，默认 `DRAFT` |
| `views` | INT | 浏览量（追加列） |
| `leads` | INT | 转化线索数（追加列） |
| 审计字段 | — | 标准审计字段 |

#### mkg_campaign — 营销活动

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `biz_code` | VARCHAR(64) | 活动编码 |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `name` | VARCHAR(256) | 活动名称 |
| `channels` | VARCHAR(512) | 覆盖渠道 |
| `budget` | VARCHAR(64) | 预算 |
| `spent_pct` | INT | 花费百分比 |
| `roas` | VARCHAR(32) | ROAS |
| `status` | VARCHAR(32) | 状态，默认 `ACTIVE` |
| `period_label` | VARCHAR(64) | 周期标签 |
| 审计字段 | — | 标准审计字段 |

#### mkg_publish_job — 发布任务

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `content_id` | BIGINT NOT NULL | 关联素材 |
| `channels` | JSONB | 发布渠道列表 |
| `scheduled_at` | TIMESTAMPTZ | 计划发布时间 |
| `description` | TEXT | 描述 |
| `keywords` | VARCHAR(512) | 关键词 |
| `status` | VARCHAR(32) | 状态，默认 `SCHEDULED` |
| 审计字段 | — | 标准审计字段 |

索引：`idx_mkg_publish_tenant (tenant_id, created_at DESC)`

---

### 2.5 市场域 (lingxi_biz.mkt_*)

#### mkt_hot_keyword — 热搜词

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `keyword` | VARCHAR(256) | 关键词 |
| `category` | VARCHAR(128) | 分类 |
| `region` | VARCHAR(64) | 地区 |
| `heat_score` | INT | 热度分值 |
| `trend` | VARCHAR(16) | 趋势，默认 `FLAT` |
| 审计字段 | — | 标准审计字段 |

#### mkt_search_trend — 搜索趋势

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `keyword` | VARCHAR(256) | 关键词 |
| `region` | VARCHAR(64) | 地区 |
| `metric_date` | DATE | 日期 |
| `index_value` | INT | 指数值 |
| 审计字段 | — | 标准审计字段 |

索引：`idx_mkt_trend_kw (tenant_id, keyword, region, metric_date)`

#### mkt_opportunity — 市场机会

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `biz_code` | VARCHAR(64) | 机会编码 |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `title` | VARCHAR(512) | 标题 |
| `product_hint` | VARCHAR(256) | 产品提示 |
| `target_market` | VARCHAR(128) | 目标市场 |
| `score` | INT | 评分 |
| `summary` | TEXT | 摘要 |
| `status` | VARCHAR(32) | 状态，默认 `OPEN` |
| 审计字段 | — | 标准审计字段 |

---

### 2.6 智能决策 (lingxi_biz.dm_*)

#### dm_kpi_snapshot — KPI 快照

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `metric_code` | VARCHAR(64) | 指标编码 |
| `metric_name` | VARCHAR(128) | 指标名称 |
| `metric_value` | NUMERIC(20,4) | 指标值 |
| `unit` | VARCHAR(32) | 单位 |
| `period_key` | VARCHAR(32) | 周期键（如 2026-W33） |
| `dimensions` | JSONB | 维度 |
| 审计字段 | — | 标准审计字段 |

索引：`idx_dm_kpi_period (tenant_id, period_key, metric_code)`

---

### 2.7 统一工作台 (lingxi_biz.uw_*)

#### uw_task — 统一待办

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `biz_code` | VARCHAR(64) | 任务编码 |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `title` | VARCHAR(512) | 标题 |
| `task_type` | VARCHAR(32) | 类型，默认 `GENERAL` |
| `status` | VARCHAR(32) | 状态，默认 `OPEN` |
| `priority` | INT | 优先级，默认 50 |
| `assignee_id` | BIGINT | 指派人 |
| `due_at` | TIMESTAMPTZ | 截止时间 |
| `source_type` | VARCHAR(32) | 来源类型 |
| `source_id` | BIGINT | 来源ID |
| `payload` | JSONB | 扩展数据 |
| `completed_at` | TIMESTAMPTZ | 完成时间 |
| 审计字段 | — | 标准审计字段 |

索引：`idx_uw_task_assignee (tenant_id, assignee_id, status)`、`idx_uw_task_priority (tenant_id, status, priority DESC)`

#### uw_inquiry_event — 询盘事件

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `biz_code` | VARCHAR(64) | 事件编码 |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `title` | VARCHAR(512) | 标题 |
| `channel` | VARCHAR(64) | 渠道 |
| `contact_name` | VARCHAR(128) | 联系人 |
| `contact_email` | VARCHAR(256) | 联系邮箱 |
| `company_name` | VARCHAR(256) | 公司名称 |
| `lead_id` | BIGINT | 关联线索 |
| `status` | VARCHAR(32) | 状态，默认 `NEW` |
| `acknowledged_by` | BIGINT | 确认人 |
| `acknowledged_at` | TIMESTAMPTZ | 确认时间 |
| 审计字段 | — | 标准审计字段 |

索引：`idx_uw_inquiry_status (tenant_id, status)`

---

### 2.8 知识中心 (lingxi_platform.kc_*)

#### kc_template — 模板

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `biz_code` | VARCHAR(64) | 模板编码 |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `name` | VARCHAR(256) | 模板名称 |
| `category` | VARCHAR(64) | 分类 |
| `locale` | VARCHAR(16) | 语言，默认 `zh-CN` |
| `body` | TEXT NOT NULL | 模板正文 |
| 审计字段 | — | 标准审计字段 |

#### kc_script — 话术

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `biz_code` | VARCHAR(64) | 话术编码 |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `scene` | VARCHAR(64) | 场景 |
| `locale` | VARCHAR(16) | 语言，默认 `zh-CN` |
| `body` | TEXT NOT NULL | 话术正文 |
| 审计字段 | — | 标准审计字段 |

#### kc_prompt — 提示词

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `prompt_code` | VARCHAR(128) | 提示词编码（如 `prompt.sales.followup_suggest.v2`） |
| `name` | VARCHAR(256) | 名称 |
| `agent_domain` | VARCHAR(64) | 智能体域 |
| `body` | TEXT NOT NULL | 提示词正文 |
| `version_label` | VARCHAR(32) | 版本标签，默认 `v1` |
| 审计字段 | — | 标准审计字段 |

---

### 2.9 配置中心 (lingxi_platform.cc_*)

#### cc_industry — 行业定义

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `industry_code` | VARCHAR(64) | 行业编码 |
| `industry_name` | VARCHAR(256) | 行业名称 |
| 审计字段 | — | 标准审计字段 |

#### cc_setting — 配置项

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `setting_key` | VARCHAR(64) | 配置键 |
| `setting_value` | JSONB | 配置值 |
| 审计字段 | — | 标准审计字段 |

---

### 2.10 智能体中心 (lingxi_platform.ac_*)

#### ac_agent_config — 智能体配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `agent_code` | VARCHAR(64) | 智能体编码 |
| `config_json` | JSONB | 配置JSON |
| 审计字段 | — | 标准审计字段 |

#### ac_agent_run_log — 智能体运行日志

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 雪花ID |
| `tenant_id` | BIGINT NOT NULL | 租户ID |
| `agent_code` | VARCHAR(64) | 智能体编码 |
| `action` | VARCHAR(128) | 动作 |
| `related_object` | VARCHAR(256) | 关联对象 |
| `status` | VARCHAR(64) | 状态 |
| `duration_ms` | INT | 耗时（毫秒） |
| `payload` | JSONB | 负载 |
| 审计字段 | — | 标准审计字段 |

索引：`idx_ac_agent_run_log_tenant (tenant_id, created_at DESC)`、`idx_ac_agent_run_log_agent (tenant_id, agent_code)`

---

## 3. 索引与查询规约

- 唯一索引必须带 `tenant_id` 前缀（多租户隔离）
- 高频查询条件组合建联合索引，区分度高的列在前
- 单表索引数 <=5 个
- 禁止在低区分度列（如 status）单独建索引
- 禁止 `SELECT *`；大字段（TEXT/JSONB 大对象）拆附表
- 分页禁止跨页深翻，用游标方式（`WHERE id > {lastId} ORDER BY id LIMIT 20`）；ES 场景用 `search_after`

---

## 4. 变更管理

- 所有 DDL 走 Flyway 版本化脚本（PostgreSQL 方言）
- 文件名：`V{yyyyMMddHHmm}__{模块}_{描述}.sql`
- 合并主干后**禁止修改已发布脚本**，修正用新脚本
- DDL 前向兼容三原则：只增列不删列、不修改列语义、删除列/表需两个版本周期
- 大表变更（>500 万行）必须有变更评审（锁表影响评估）
- 加列带默认值用惰性求值写法（PG 11+ `ADD COLUMN ... DEFAULT` 不重写表）
- 需要重建索引/回收空间用 `pg_repack`，**禁止**高峰期 `VACUUM FULL`（锁全表）

---

## 5. 多数据存储使用边界

| 存储 | 允许承载 | 禁止承载 |
|------|---------|---------|
| PostgreSQL | 业务事实、主数据、配置 | 行为明细流水、日志、分析聚合 |
| Redis | 缓存、会话、计数、锁、限流 | 需要持久化的业务数据 |
| Elasticsearch | 检索索引（可从 PG/事件重建） | 唯一权威数据源 |
| ClickHouse | 行为明细、分析宽表、聚合结果 | 在线事务、点查高频 OLTP |
| MinIO | 文件与素材二进制 | 结构化业务数据 |
| Milvus | 向量（知识/话术/画像 embedding） | 原文存储 |

### 缓存键规约

```
lx:{模块}:{业务}:{tenant_id}:{标识}
```

示例：`lx:sales:cust:10086:88123`

必须设置过期时间（默认 <=24h）或配套失效策略（领域事件驱动驱逐）。

---

## 6. 表清单总览（18 张表）

| # | Schema | 表名 | 模块 | 功能编号 |
|---|--------|------|------|---------|
| 1 | lingxi_core | sys_tenant | 平台 | — |
| 2 | lingxi_core | sys_user | 平台 | CC-13 |
| 3 | lingxi_core | dc_customer | 数据中心 | DC-01 |
| 4 | lingxi_core | dc_product | 数据中心 | DC-02 |
| 5 | lingxi_core | dc_channel | 数据中心 | DC-03 |
| 6 | lingxi_biz | sales_lead | 销售域 | BO-SAL-01 |
| 7 | lingxi_biz | sales_lead_follow | 销售域 | — |
| 8 | lingxi_biz | sales_opportunity | 销售域 | BO-SAL-14 |
| 9 | lingxi_biz | sales_reception_session | 销售域 | — |
| 10 | lingxi_biz | sales_reception_message | 销售域 | — |
| 11 | lingxi_biz | mkg_social_account | 营销域 | BO-MKG-01 |
| 12 | lingxi_biz | mkg_content_asset | 营销域 | BO-MKG-03 |
| 13 | lingxi_biz | mkg_campaign | 营销域 | — |
| 14 | lingxi_biz | mkg_publish_job | 营销域 | — |
| 15 | lingxi_biz | mkt_hot_keyword | 市场域 | BO-MKT-05 |
| 16 | lingxi_biz | mkt_search_trend | 市场域 | BO-MKT-01 |
| 17 | lingxi_biz | mkt_opportunity | 市场域 | BO-MKT-10 |
| 18 | lingxi_biz | dm_kpi_snapshot | 智能决策 | DM-01 |
| 19 | lingxi_biz | uw_task | 工作台 | UW-09 |
| 20 | lingxi_biz | uw_inquiry_event | 工作台 | UW-17 |
| 21 | lingxi_platform | kc_template | 知识中心 | KC-07 |
| 22 | lingxi_platform | kc_script | 知识中心 | KC-10 |
| 23 | lingxi_platform | kc_prompt | 知识中心 | KC-16 |
| 24 | lingxi_platform | cc_industry | 配置中心 | CC-01 |
| 25 | lingxi_platform | cc_setting | 配置中心 | — |
| 26 | lingxi_platform | ac_agent_config | 智能体中心 | — |
| 27 | lingxi_platform | ac_agent_run_log | 智能体中心 | — |

> Flyway 迁移文件目录：`lingxi-server/src/main/resources/db/migration/`
> 含 7 个版本化脚本（V202608171900 ~ V202608191200）+ 1 个可重复执行种子脚本（R__novatech_demo_seed.sql）

---

*本文档从《灵犀系统技术规约 1.0》第五章抽取，并结合 Flyway 迁移脚本实际表定义整理。权威源为技术规约与迁移脚本。*
