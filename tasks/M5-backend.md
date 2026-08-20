# M5-backend — 销售域后端（线索/客户/商机）

## 目标
对齐 contracts.md M5.2 契约，补齐缺失端点 + 领域方法 + 测试覆盖。

## 仓库信息
- 仓库: https://github.com/Welch-Qi/LingXi
- 分支: cursor/feat-m5-backend
- 基线: main

## 契约要求（contracts.md M5.2）

| 资源 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 线索 | GET | /api/v1/sales/leads | 分页查询线索 |
| 线索 | GET | /api/v1/sales/leads/{id} | 线索详情 |
| 线索 | POST | /api/v1/sales/leads | 创建线索（多渠道归集） |
| 线索 | POST | /api/v1/sales/leads/{id}/assignment | 线索分配 |
| 线索 | POST | /api/v1/sales/leads/dedup | 查重防撞单 |
| 客户 | GET | /api/v1/sales/customers/{id} | 360 客户画像 |
| 客户 | POST | /api/v1/sales/customers | 创建客户 |
| 商机 | GET | /api/v1/sales/opportunities | 分页查询商机 |
| 商机 | GET | /api/v1/sales/opportunities/{id} | 商机详情 |
| 商机 | POST | /api/v1/sales/opportunities | 创建商机 |
| 商机 | PATCH | /api/v1/sales/opportunities/{id}/stage | 商机阶段流转 |

## 现有代码分析

已有代码在 `lingxi-biz/lingxi-biz-sales` 模块（包 `com.lingxi.sales`）：
- **LeadController.java**：已有列表/详情分页、pool、POST 创建（含 dedup 拦截）、assignment、claim、release、follows 系列。**缺 GET /leads/{id} 详情端点**
- **OpportunityController.java**：已有 GET 列表、PATCH stage。**缺 GET /{id} 详情、POST 创建商机**
- **Customer360Controller.java**：已有 GET `/customers/{id}/360`。**契约路径是 /customers/{id}，缺 POST /customers 创建客户**
- **LeadDedupService.java**：多维查重已实现 ✓
- Entity 已就位：`SalesLead.java`（sales_lead 表）、`SalesOpportunity.java`（sales_opportunity 表）、`SalesLeadFollow.java`
- 表已由 Flyway 创建：sales_lead、sales_lead_follow、sales_opportunity（V202608171910、V202608181200），种子数据在 R__novatech_demo_seed.sql
- 商机阶段现有枚举：DISCOVER/QUALIFY/PROPOSAL/QUOTE/NEGOTIATE/WON/LOST（契约写 DISCOVERY/NEED_CONFIRM/QUOTE/NEGOTIATION，**保持现有枚举不变**，与种子数据一致）
- 无测试

## 任务清单

### T1: 补齐线索详情端点
在 `LeadController.java` 新增 GET `/api/v1/sales/leads/{id}`：按 id 查 SalesLead 返回详情（含跟进记录数或最近跟进，可选）。权限码 `sal:lead:view`。注意路径优先级：`/{id}` 要放在 `/pool`、`/dedup` 等静态路径之后声明，避免路径歧义。

### T2: 补齐客户契约端点
在 `Customer360Controller.java`：
- 新增 GET `/api/v1/sales/customers/{id}`：与现有 `/customers/{id}/360` 行为一致（保留旧端点兼容），返回客户画像
- 新增 POST `/api/v1/sales/customers`：创建客户。**实现方式**：复用 `lingxi-mdata` 的 DcCustomer + DcCustomerMapper（sales 模块已依赖 lingxi-mdata），创建 dc_customer 记录，biz_code 前缀 CUS-（与数据中心对齐），需带 X-Idempotency-Key 幂等支持时标记 TODO 即可。权限码 `sal:customer:manage`（或参照现有权限码风格，如无此码则用 `sal:customer:view360` 同级新增权限码常量）

### T3: 补齐商机详情 + 创建端点 + 领域方法 advanceTo
- 新增 GET `/api/v1/sales/opportunities/{id}`：商机详情。权限码 `sal:lead:view`（与列表一致）
- 新增 POST `/api/v1/sales/opportunities`：创建商机。请求体含 name/customerId/leadId(可选)/amountMinor/currency/expectedClose/ownerUserId。自动生成 biz_code 前缀 `OPP-`（使用 lingxi-id 的 IdGenerator，参考现有线索创建代码）。权限码 `sal:opportunity:advance`（或同级新增 `sal:opportunity:create`）
- 在 `SalesOpportunity.java` Entity 中新增领域方法：
```java
/**
 * 商机阶段流转（领域方法）。状态流转必须经此方法。
 * 合法流转：DISCOVER -> QUALIFY -> PROPOSAL -> QUOTE -> NEGOTIATE -> WON/LOST
 * WON/LOST 为终态，不可再流转
 */
public void advanceTo(String stage) {
    // 校验流转合法性，非法流转抛出 IllegalArgumentException 或业务异常
}
```
- 将现有 PATCH `/{id}/stage` 端点的实现改为调用 `opportunity.advanceTo(stage)` 领域方法（先查询实体、调用领域方法、再 updateById）
- 涉及表名前缀 `sales_`（契约写 `sal_`）：**保持现有表名不变**，不做破坏性迁移

### T4: 领域事件 TODO 标记
契约 M5.4 要求 4 个领域事件（lx.sal.lead.created / lead.assigned / customer.created / opportunity.stage_changed）。当前无事件基础设施，在对应创建/分配/流转代码处添加 TODO 注释：
```java
// TODO: 待事件总线基础设施就绪后发布 lx.sal.lead.created 事件
```
不强制实现实际发布逻辑。

### T5: 单元测试
编写单元测试（放在 `lingxi-biz-sales/src/test/java/com/lingxi/sales/app/`）：
- `LeadControllerTest.java`（至少 4 个用例）：
  1. 查询线索详情（GET /{id}）返回数据
  2. 线索不存在时返回 404 或错误响应
  3. 线索分配 assignment 成功
  4. 创建线索触发查重拦截（重复线索返回冲突）
- `OpportunityControllerTest.java`（至少 5 个用例）：
  1. 创建商机成功（自动生成 OPP- 编码）
  2. 查询商机详情
  3. 商机列表分页
  4. 阶段流转成功（DISCOVER -> QUALIFY）
  5. 非法阶段流转被拒绝（如 WON -> NEGOTIATE）
- `SalesOpportunityTest.java`（纯领域测试，至少 2 个用例）：
  1. advanceTo 合法流转
  2. advanceTo 非法流转抛异常
- 测试风格参考 `lingxi-mdata` 的 `MdataControllerTest.java`（MockBean Mapper）

### T6: 编译验证 + result.json
- 运行 `./mvnw compile -pl lingxi-biz/lingxi-biz-sales -am` 确保编译通过
- 运行 `./mvnw test -pl lingxi-biz/lingxi-biz-sales` 确保测试通过
- 将结果写入 `artifacts/M5-backend/result.json`，格式：
```json
{
  "taskId": "M5-backend",
  "status": "COMPLETED",
  "summary": "补齐线索详情/客户创建/商机创建+详情/advanceTo领域方法+11个单元测试",
  "testCount": 11,
  "testPassed": 11,
  "testFailed": 0,
  "files": ["list all changed/created files"],
  "notes": "任何需要说明的事项"
}
```

## 技术参考
- 契约文件：contracts.md M5 章节
- 基类：lingxi-starter-mybatis 的 BaseEntity
- 统一响应：lingxi-starter-core 的 Result
- 权限注解：@RequirePermission（lingxi-starter-security）、@RequireDataScope
- ID 生成：lingxi-id 的 IdGenerator（参考现有线索创建代码中 LEAD- 前缀的生成方式）
- 租户上下文：TenantContext.getTenantId() / UserContext.require().getTenantId()

## 注意事项
- 不要修改已有 Entity 的 @TableName schema 和字段定义
- 保持现有商机阶段枚举（DISCOVER/QUALIFY/PROPOSAL/QUOTE/NEGOTIATE/WON/LOST），与种子数据一致
- 保持现有表名前缀 sales_（契约写 sal_，不做破坏性迁移，在 result.json notes 中说明此偏差）
- 保留现有所有端点（pool/claim/release/follows/sessions 等），只新增不删除
- GET /{id} 路由声明顺序注意与静态路径（/pool、/dedup）的冲突
