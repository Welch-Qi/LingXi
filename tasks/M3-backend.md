# M3-backend — 配置中心（行业定义 + 用户/角色/权限管理）

## 目标
对齐 contracts.md M3.2 契约，补齐缺失的 7 个端点 + 测试覆盖。这是三个任务中差距最大的。

## 仓库信息
- 仓库: https://github.com/Welch-Qi/LingXi
- 分支: cursor/feat-m3-backend
- 基线: main

## 契约要求（contracts.md M3.2）

| 资源 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 行业定义 | GET | /api/v1/config/industries | 查询企业行业分类 |
| 行业定义 | PUT | /api/v1/config/industries | 更新企业行业（批量） |
| 用户管理 | GET | /api/v1/config/users | 分页查询用户 |
| 用户管理 | POST | /api/v1/config/users | 创建用户 |
| 用户管理 | PUT | /api/v1/config/users/{id} | 更新用户 |
| 角色管理 | GET | /api/v1/config/roles | 分页查询角色 |
| 角色管理 | POST | /api/v1/config/roles | 创建角色 |
| 功能权限 | GET | /api/v1/config/permissions | 查询权限资源树 |

## 现有代码分析

已有代码在 `lingxi-config` 模块：
- `ConfigController.java`：仅 GET /industry（单数，需改为复数 industries）+ GET/PUT /settings/{key}
- `CcIndustry.java`/`CcSetting.java`：Entity 已就位，表名 cc_industry/cc_setting，schema lingxi_platform
- 2 个 Mapper 接口已就位
- 现有 settings 端点保留不动（不在契约中但可用）

**注意**：contracts.md M3.3 写表前缀 `sys_`，但 data-model.md 2.9 节和 Flyway 脚本实际用 `cc_` 前缀（lingxi_platform schema）。以 data-model.md 和 Flyway 为准，不改表名。

## 任务清单

### T1: 修复行业定义端点路径
- 将 GET `/api/v1/config/industry` 改为 GET `/api/v1/config/industries`（复数，对齐契约）
- 新增 PUT `/api/v1/config/industries` 端点：批量更新企业行业分类
  - 请求体：`[{ "industryCode": "MFG", "industryName": "制造业" }, ...]`
  - 实现：按 tenantId 先删后插（或 upsert by industry_code）
  - 权限码 `cc:config:manage`
- 保留原有 GET 逻辑（改为复数路径即可）

### T2: 用户管理 CRUD
- 新建 `cc_user` 表 Flyway 迁移脚本：`V{yyyyMMddHHmm}__config_user_role_permission.sql`
  - 字段参考 sys_user：id/legacy_id/biz_code/tenant_id/display_name/email/phone/department/title/is_active + 审计字段
  - 唯一索引：uk_cc_user_tenant_biz (tenant_id, biz_code), uk_cc_user_tenant_email (tenant_id, email)
  - schema: lingxi_platform
- 新建 `CcUser.java` Entity（继承 BaseEntity，@TableName(value="cc_user", schema="lingxi_platform")）
- 新建 `CcUserMapper.java`
- 在 ConfigController 新增：
  - GET /api/v1/config/users（分页，pageNo/pageSize/keyword）
  - POST /api/v1/config/users（创建，自动生成 USR- 编码）
  - PUT /api/v1/config/users/{id}（更新）

### T3: 角色管理 CRUD
- 新建 `cc_role` 表 Flyway 迁移脚本（同上 SQL 文件）
  - 字段：id/legacy_id/biz_code/tenant_id/name/description/is_active + 审计字段
  - 唯一索引：uk_cc_role_tenant_biz (tenant_id, biz_code)
- 新建 `CcRole.java` Entity
- 新建 `CcRoleMapper.java`
- 新建 `cc_role_permission` 关联表：id/tenant_id/role_id/permission_code + 审计字段
- 在 ConfigController 新增：
  - GET /api/v1/config/roles（分页）
  - POST /api/v1/config/roles（创建，自动生成 ROL- 编码）

### T4: 功能权限树查询
- 新建 `cc_permission` 表 Flyway 迁移脚本
  - 字段：id/tenant_id/permission_code/name/parent_id/sort_order/is_active + 审计字段
- GET /api/v1/config/permissions：返回权限资源树（列表形式，前端自行组装树）
  - 查询当前租户所有权限码，按 sortOrder 排序
  - 返回 `List<PermissionNode>`：{ id, permissionCode, name, parentId, sortOrder }

### T5: 单元测试
为 ConfigController 编写单元测试 `ConfigControllerTest.java`：
- 参考 `lingxi-iam` 的 `IamPermissionControllerTest.java` 测试风格
- 测试用例（至少 10 个）：
  1. 查询行业列表（industries 复数路径）
  2. 批量更新行业
  3. 创建用户成功
  4. 查询用户列表分页
  5. 更新用户
  6. 创建角色成功
  7. 查询角色列表
  8. 查询权限树
  9. 创建用户缺少 email 时返回错误
  10. 创建角色缺少 name 时返回错误

### T6: 编译验证 + result.json
- 运行 `./mvnw compile -pl lingxi-config -am` 确保编译通过
- 运行测试确保通过
- 将结果写入 `artifacts/M3-backend/result.json`，格式：
```json
{
  "taskId": "M3-backend",
  "status": "COMPLETED",
  "summary": "修复行业路径+用户/角色/权限CRUD+10个单元测试",
  "testCount": 10,
  "testPassed": 10,
  "testFailed": 0,
  "files": ["list all changed/created files"],
  "notes": "任何需要说明的事项"
}
```

## 技术参考
- 契约文件：contracts.md M3 章节
- 数据模型：docs/data-model.md 2.9 节
- 基类：lingxi-starter-mybatis 的 BaseEntity
- ID 生成：lingxi-id 的 IdGenerator
- 统一响应：lingxi-starter-core 的 Result
- 权限注解：@RequirePermission
- 租户上下文：TenantContext.getTenantId() / UserContext.require().getTenantId()
- Flyway 脚本目录：lingxi-server/src/main/resources/db/migration/
- 脚本命名：V{yyyyMMddHHmm}__{模块}_{描述}.sql
- 参考 ConfigController 现有 resolveTenantId() 方法

## 注意事项
- 不要修改 cc_industry 和 cc_setting 的表定义
- 表前缀用 cc_（不是 sys_），与 data-model.md 对齐
- 新建表放在 lingxi_platform schema
- settings 端点保留不动
- 测试使用 @SpringBootTest + MockBean 风格
