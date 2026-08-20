# Casdoor / Casbin 对接说明

基线见 [技术规约](../docs/灵犀系统技术规约1.0.md) 第七、九章。

## 组件职责

| 组件 | 模块 | 职责 |
|------|------|------|
| Casdoor | 外部 IdP + `lingxi-auth` | OIDC 登录、JWT 签发、SSO |
| JWT 校验 | `lingxi-starter-security` | JWKS 验签、写入 `UserContext` / `TenantContext` |
| Casbin | `lingxi-iam` | RBAC + 租户域权限决策 |
| 注解 | `@RequirePermission` / `@RequireDataScope` | 业务接口声明式鉴权 |
| 前端 | `lingxi-web` | `/auth/callback` 换票；`Authorization: Bearer` |

## 两种本地模式

| 模式 | 前端 | 后端 | 适用 |
|------|------|------|------|
| **Dev Bypass（默认）** | `NEXT_PUBLIC_AUTH_MODE=bypass`（或不设） | `lingxi.security.dev-bypass: true` | 无 Casdoor 快速联调 |
| **Casdoor OIDC** | `NEXT_PUBLIC_AUTH_MODE=casdoor` | `--spring.profiles.active=casdoor`（`dev-bypass: false`） | 真实登录 |

---

## A. Dev Bypass（无 Casdoor）

`application.yml` 默认 `dev-bypass: true`。请求头模拟登录：

```http
GET /api/v1/sales/leads
X-User-Id: 10086001
X-Tenant-Id: 10086
X-Roles: role_admin
X-Username: linqitao
```

NovaTech 演示账号见 [NovaTech演示租户Seed规范.md](./NovaTech演示租户Seed规范.md)。

---

## B. 对接真实 Casdoor（推荐步骤）

### 1. 启动 Casdoor

```bash
cd deploy
docker compose -f docker-compose.casdoor.yml up -d
```

- 控制台：http://localhost:8000 （内置 `admin` / `123`）
- 种子：`deploy/casdoor/conf/init_data.json`（组织 `lingxi`、应用 `lingxi-web`、演示用户）
- 若种子未进库：`docker compose -f docker-compose.casdoor.yml down -v && up -d`

演示用户（密码均为 `Admin123!`）：

| 用户名 | 邮箱 | 角色 | userId | tenantId |
|--------|------|------|--------|----------|
| linqitao | lin@novatech.com | role_admin | 10086001 | 10086 |
| he | he@novatech.com | role_sales | 10086003 | 10086 |
| su | su@novatech.com | role_marketing | 10086002 | 10086 |

### 2. 启动后端（关闭旁路）

```bash
# 示例：在已有 SPRING_DATASOURCE_* 环境下
java -jar lingxi-server/target/lingxi-server-1.0.0-SNAPSHOT.jar --spring.profiles.active=casdoor
```

Profile 文件：`lingxi-server/src/main/resources/application-casdoor.yml`。

确认 JWKS 可达：http://localhost:8000/.well-known/jwks

### 3. 启动前端（Casdoor 模式）

`lingxi-web/apps/lingxi-web/.env.local`：

```env
NEXT_PUBLIC_API_BASE=/api/v1
LINGXI_API_ORIGIN=http://127.0.0.1:8080
NEXT_PUBLIC_AUTH_MODE=casdoor
```

```bash
pnpm --filter @lingxi/web dev
```

### 4. 登录流

1. 打开 http://localhost:3000/ →「Casdoor 登录并进入」
2. `GET /api/v1/auth/login-url` → 跳转 Casdoor
3. 回调 http://localhost:3000/auth/callback?code=…&state=…
4. 前端 `POST /api/v1/auth/callback?code=` 换票，写入 `localStorage.lingxi.accessToken`
5. 后续 API：`Authorization: Bearer <access_token>`
6. JWT claim 映射：`properties.userId` / `properties.tenantId` / `tag|roles` → `UserContext`

### 5. 配置核对清单

| 项 | 期望值 |
|----|--------|
| Redirect URI | `http://localhost:3000/auth/callback` |
| Client ID | `lingxi-web` |
| Client Secret | `lingxi-secret` |
| Organization | `lingxi` |
| Application | `lingxi-web` |
| Token format | JWT（RS256，cert-built-in） |

---

## 业务使用

```java
@GetMapping
@RequirePermission("sal:lead:view")
@RequireDataScope
public Result<?> list() { ... }
```

权限码格式：`{子产品}:{模块}:{资源}:{动作}`。预置策略见 `lingxi-iam/src/main/resources/casbin/policy.csv`。

---

## 故障排查

| 现象 | 排查 |
|------|------|
| 换票失败 | Casdoor 是否启动；redirect_uri 是否与应用配置完全一致 |
| 401 Unauthorized | 后端是否 `casdoor` profile；Bearer 是否带上；JWKS 是否通 |
| 有 Token 但无权限 | JWT 是否含 `properties.tenantId=10086`、`tag=role_admin`（或 roles） |
| 仍走旁路头 | 前端 `NEXT_PUBLIC_AUTH_MODE` 是否为 `casdoor`；是否已清掉旧 Token |
