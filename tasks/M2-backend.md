# M2-backend — 数据中心主数据（客户/商品/渠道/员工）

## 目标
对齐 contracts.md M2.2 契约，补齐缺失功能 + 测试覆盖。

## 仓库信息
- 仓库: https://github.com/Welch-Qi/LingXi
- 分支: cursor/feat-m2-backend
- 基线: main

## 契约要求（contracts.md M2.2）

| 资源 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 客户 | GET | /api/v1/mdata/customers | 分页查询，参数 pageNo/pageSize/keyword |
| 客户 | GET | /api/v1/mdata/customers/{id} | 详情 |
| 客户 | POST | /api/v1/mdata/customers | 创建，支持幂等键 X-Idempotency-Key |
| 客户 | PUT | /api/v1/mdata/customers/{id} | 全量更新 |
| 客户 | PATCH | /api/v1/mdata/customers/{id} | 局部更新 |
| 商品 | GET | /api/v1/mdata/products | 分页查询 |
| 商品 | POST | /api/v1/mdata/products | 创建 |
| 渠道 | GET | /api/v1/mdata/channels | 分页查询 |
| 员工 | GET | /api/v1/mdata/employees | 分页查询 |

## 现有代码分析

已有代码在 `lingxi-mdata` 模块：
- `MdataController.java`：客户/商品/渠道 CRUD（GET列表/GET详情/POST创建/PUT更新/DELETE删除）
- `DcCustomer.java`/`DcProduct.java`/`DcChannel.java`：Entity 完整，与 data-model.md 对齐
- 3 个 Mapper 接口已就位
- biz_code 前缀：客户 CUS- ✓，商品 PRD-（契约写 SKU-，保持现有实现不变），渠道 CH-（契约写 CHL-，保持现有实现不变）

## 任务清单

### T1: 补齐 PATCH 局部更新端点
为 `DcCustomer` 增加 `PATCH /api/v1/mdata/customers/{id}` 端点，实现局部更新（仅更新请求体中非 null 字段）。使用 MyBatis-Plus 的 `LambdaUpdateWrapper` 或 `UpdateById` 策略。权限码 `dc:customer:manage`。

### T2: 补齐员工主数据 CRUD
- 新建 `dc_employee` 表 Flyway 迁移脚本：`V{yyyyMMddHHmm}__mdata_employee.sql`
  - 字段：id/legacy_id/biz_code/tenant_id/name/department/position/phone/email/status + 审计字段
  - biz_code 前缀 EMP-
  - schema: lingxi_core
- 新建 `DcEmployee.java` Entity（继承 BaseEntity，@TableName(value="dc_employee", schema="lingxi_core")）
- 新建 `DcEmployeeMapper.java` Mapper 接口
- 在 `MdataController.java` 新增员工端点：
  - GET /api/v1/mdata/employees（分页，参数 pageNo/pageSize/keyword）
  - POST /api/v1/mdata/employees（创建，自动生成 EMP- 编码）
  - GET /api/v1/mdata/employees/{id}（详情）
  - PUT /api/v1/mdata/employees/{id}（更新）

### T3: 补齐 keyword 分页搜索参数
在客户/商品/渠道/员工的 GET 列表端点中增加 `keyword` 参数（String，可选），用于按 name/bizCode 模糊搜索。实现方式：`LambdaQueryWrapper.like(name, keyword).or().like(bizCode, keyword)`。

### T4: 单元测试
为 MdataController 编写单元测试 `MdataControllerTest.java`：
- 参考 `lingxi-auth` 的 `AuthControllerTest.java` 测试风格
- 测试用例（至少 8 个）：
  1. 创建客户成功
  2. 查询客户列表分页
  3. 查询客户详情
  4. PATCH 局部更新客户
  5. 创建商品成功
  6. 创建员工成功
  7. keyword 搜索客户
  8. 创建员工缺少 name 时返回错误

### T5: 编译验证 + result.json
- 运行 `./mvnw compile -pl lingxi-mdata -am` 确保编译通过
- 运行测试确保通过
- 将结果写入 `artifacts/M2-backend/result.json`，格式：
```json
{
  "taskId": "M2-backend",
  "status": "COMPLETED",
  "summary": "补齐PATCH端点+员工CRUD+keyword搜索+8个单元测试",
  "testCount": 8,
  "testPassed": 8,
  "testFailed": 0,
  "files": ["list all changed/created files"],
  "notes": "任何需要说明的事项"
}
```

## 技术参考
- 契约文件：contracts.md M2 章节
- 数据模型：docs/data-model.md 2.2 节
- 基类：lingxi-starter-mybatis 的 BaseEntity
- ID 生成：lingxi-id 的 IdGenerator
- 统一响应：lingxi-starter-core 的 Result
- 权限注解：@RequirePermission（lingxi-starter-security）
- 租户上下文：TenantContext.getTenantId() / UserContext.require().getTenantId()
- Flyway 脚本目录：lingxi-server/src/main/resources/db/migration/
- 脚本命名：V{yyyyMMddHHmm}__{模块}_{描述}.sql

## 注意事项
- 不要修改已有 Entity 的 @TableName schema 和字段定义
- 保持现有 biz_code 前缀不变（CUS-/PRD-/CH-）
- 幂等键 X-Idempotency-Key 是可选实现（标记为 TODO 注释即可，不强制实现完整幂等逻辑）
- 所有 Controller 方法使用 @RequirePermission("dc:customer:manage") 权限码
- 测试使用 @SpringBootTest + MockBean 风格，参考 lingxi-auth 的测试
