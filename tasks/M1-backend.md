# M1-backend 任务简报：认证与权限模块

## 任务概述

灵犀系统 M1 认证与权限模块已有代码骨架（Casdoor OIDC 对接 + Casbin RBAC + Spring Security 过滤器链），但存在以下缺口需补齐：

1. **契约对齐**：contracts.md M1.3 要求 `POST /api/v1/auth/login`，但现有代码只有 `POST /api/v1/auth/callback`
2. **权限码列表**：contracts.md M1.3 要求 `GET /api/v1/auth/me` 返回"当前登录用户 + 租户 + 权限码列表"，但现有 `/me` 端点不返回权限码
3. **测试覆盖**：auth/iam 模块零测试，需补齐单元测试和集成测试
4. **编译验证**：需验证平台模块链编译通过

## 范围

**允许修改的路径（禁止越界）：**

```
lingxi-platform/lingxi-auth/src/main/java/com/lingxi/auth/app/AuthController.java
lingxi-platform/lingxi-auth/src/main/java/com/lingxi/auth/app/CasdoorAuthService.java  （仅如需修复编译）
lingxi-platform/lingxi-auth/src/test/                                          （新建测试）
lingxi-platform/lingxi-iam/src/main/java/com/lingxi/iam/app/CasbinPermissionDecisionService.java
lingxi-platform/lingxi-iam/src/main/java/com/lingxi/iam/app/PolicyAdminService.java  （仅如需修复编译）
lingxi-platform/lingxi-iam/src/main/java/com/lingxi/iam/app/IamPermissionController.java  （仅如需修复编译）
lingxi-platform/lingxi-iam/src/test/                                           （新建测试）
lingxi-starters/lingxi-starter-security/src/main/java/com/lingxi/starter/security/permission/PermissionDecisionClient.java
lingxi-starters/lingxi-starter-security/src/test/                               （新建测试）
lingxi-starters/lingxi-starter-core/src/test/                                    （新建测试）
lingxi-server/src/test/                                                         （集成测试）
```

**禁止修改的路径：**

- `lingxi-starters/lingxi-starter-core/src/main/` （已有 Result/ErrorCode/UserContext/TenantContext 等核心类，不得改动）
- `lingxi-starters/lingxi-starter-security/src/main/` 中除 `PermissionDecisionClient.java` 外的文件
- `lingxi-platform/lingxi-user/` 和 `lingxi-platform/lingxi-tenant/` 的 main 源码（仅可加测试）
- 任何 Flyway 迁移脚本
- `contracts.md`、`AGENTS.md`、`TASKS.md`
- Casbin `model.conf` 和 `policy.csv`

## 输入

执行前必读以下文件：

| 文件 | 用途 |
|------|------|
| `contracts.md` M1 节 | 认证与权限接口契约 |
| `AGENTS.md` | 仓库级 Agent 规范（构建命令、代码规范、文件边界） |
| `docs/api-design.md` | API 设计规约（路径规范、响应体、错误码） |
| `docs/data-model.md` | 数据模型（sys_user/sys_tenant 表结构） |

## 具体任务

### 任务 1：添加 POST /api/v1/auth/login 端点

在 `AuthController.java` 中新增：

```java
@PostMapping("/login")
public Result<Map<String, Object>> login(@Valid @RequestBody LoginRequest req) {
    // 接受 JSON body: {"code":"授权码","state":"状态值"}
    // 调用 casdoorAuthService.exchangeCode(code) 换 token
    // 返回: {accessToken, refreshToken, tokenType, expiresIn, scope, state}
}
```

`LoginRequest` DTO 定义为 record，放在 `com.lingxi.auth.app` 包下：

```java
public record LoginRequest(
    @NotBlank String code,
    String state
) {}
```

保留现有的 `POST /api/v1/auth/callback`（向后兼容），`/login` 是契约对齐的新入口。

### 任务 2：增强 GET /api/v1/auth/me 返回权限码列表

在 `PermissionDecisionClient` 接口新增方法：

```java
/**
 * 列出用户在租户下拥有的所有权限码。
 * @param subject  用户 ID
 * @param tenantId 租户 ID
 * @return 权限码列表（如 ["sal:lead:view","sal:lead:create"]），无权限返回空列表
 */
List<String> listPermissions(String subject, Long tenantId);
```

在 `CasbinPermissionDecisionService` 中实现：
- 用 `enforcer.getImplicitPermissionsForUser(subject, domain)` 获取用户通过角色继承的权限
- 同时用 `enforcer.getPermissionsForUser(subject, domain)` 获取直接权限
- 合并去重，提取 obj 字段（权限码），过滤掉 `act == "allow"` 或 `act == "*"` 的条目
- 同时处理用户通过 `g` 分组关联的角色，递归获取角色权限

在 `AuthController.me()` 中注入 `PermissionDecisionClient`，调用 `listPermissions` 将权限码列表加入响应：

```java
data.put("permissions", permissionDecisionClient.listPermissions(
    principal.getUserId(), principal.getTenantId()));
```

### 任务 3：单元测试

为以下类编写单元测试，覆盖率 >= 80%：

**lingxi-auth 模块：**
- `AuthControllerTest` — 测试 loginUrl、callback、login、me、logoutUrl 五个端点
  - 用 `@WebMvcTest(AuthController.class)` + `@MockBean CasdoorAuthService`
  - 用 `@MockBean PermissionDecisionClient`
  - 用 `UserContext.set()` 模拟登录状态（配合 `@BeforeEach`/`@AfterEach`）
- `CasdoorAuthServiceTest` — 测试 buildLoginUrl、exchangeCode（mock RestClient）、buildLogoutUrl
  - 用 `@RestClientTest(CasdoorAuthService.class)` 或手动 mock

**lingxi-iam 模块：**
- `IamPermissionControllerTest` — 测试 permissions/check（有权限/无权限）、policies
- `CasbinPermissionDecisionServiceTest` — 测试 enforce（通过/拒绝）、listPermissions（角色继承+直接权限）
- `PolicyAdminServiceTest` — 测试 addRolePermission、assignUserRole、listPolicies、listGrouping

**lingxi-starter-security 模块：**
- `PermissionAspectTest` — 测试 @RequirePermission 切面拦截（有权限通过/无权限抛 BizException）
- `CasdoorJwtAuthenticationConverterTest` — 测试 JWT claim 解析为 UserPrincipal

### 任务 4：集成测试

在 `lingxi-server/src/test/` 下创建 `AuthFlowIntegrationTest.java`：

- 使用 `@SpringBootTest` + `@AutoConfigureMockMvc`
- 配置 `lingxi.security.dev-bypass=true` 模式
- 测试流程：
  1. `GET /api/v1/auth/login-url` → 200，返回 loginUrl + state
  2. `GET /api/v1/auth/me` 带开发旁路头（X-User-Id=10086001, X-Tenant-Id=10086, X-Roles=role_admin）→ 200，返回 userId + tenantId + permissions 列表
  3. `GET /api/v1/iam/permissions/check?permCode=sal:lead:view` 带旁路头 → 200，allowed=true（role_admin 有全域权限）
  4. `GET /api/v1/iam/permissions/check?permCode=nonexistent:perm` 带旁路头 → 200，allowed=false
  5. `GET /api/v1/health` → 200（验证安全配置不影响健康端点）

### 任务 5：编译验证

```bash
./mvnw clean compile -pl lingxi-platform/lingxi-auth,lingxi-platform/lingxi-iam,lingxi-starters/lingxi-starter-security -am -T 4
./mvnw test -pl lingxi-platform/lingxi-auth,lingxi-platform/lingxi-iam,lingxi-starters/lingxi-starter-security -am -T 4
```

确保编译和测试全部通过。

## 输出

完成后必须将结果写入 `artifacts/M1-backend/result.json`：

```json
{
  "task": "M1-backend",
  "status": "COMPLETED",
  "prUrl": "<PR URL>",
  "branch": "cursor/feat-m1-backend",
  "summary": "<实现摘要>",
  "changedFiles": ["<修改的文件列表>"],
  "tests": { "total": <N>, "passed": <N>, "failed": 0, "coverage": 0.<NN> },
  "contractChecks": {
    "POST /api/v1/auth/login": "DONE",
    "GET /api/v1/auth/me returns permissions": "DONE",
    "PermissionDecisionClient.listPermissions": "DONE"
  },
  "blockers": [],
  "nextActions": ["M2/M3/M7 可并行启动"]
}
```

## 技术约束

- Java 17，record 用于 DTO
- 统一响应体 `Result<T>`（已在 `lingxi-starter-core` 提供，禁止自行定义）
- 业务异常抛 `BizException(ErrorCode)`，禁止在 Controller 捕获后拼 JSON
- 参数校验用 Jakarta Validation 注解（`@NotBlank`/`@Valid`）
- 测试框架：JUnit 5 + Spring Boot Test + Mockito
- 分支名：`cursor/feat-m1-backend`
- Casbin enforcer 的 `getImplicitPermissionsForUser` 返回 `List<List<String>>`，每条是 `[sub, dom, obj, act]`，提取 `obj` 即权限码
