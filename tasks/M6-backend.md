# M6-backend — 营销域后端（社媒账号/AI 内容）

## 目标
对齐 contracts.md M6.2 契约，补齐社媒账号绑定/解绑 + AI 内容契约端点 + 测试覆盖。

## 仓库信息
- 仓库: https://github.com/Welch-Qi/LingXi
- 分支: cursor/feat-m6-backend
- 基线: main

## 契约要求（contracts.md M6.2）

| 资源 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 社媒账号 | GET | /api/v1/marketing/social-accounts | 查询社媒账号列表 |
| 社媒账号 | POST | /api/v1/marketing/social-accounts | 绑定社媒账号 |
| 社媒账号 | DELETE | /api/v1/marketing/social-accounts/{id} | 解绑 |
| AI 内容生成 | POST | /api/v1/marketing/ai-content | AI 生成图文/视频内容 |

## 现有代码分析

已有代码在 `lingxi-biz/lingxi-biz-marketing` 模块（包 `com.lingxi.marketing`）：
- `MarketingController.java`：已有 GET social-accounts（契约对齐 ✓）、contents 列表/创建、campaigns、contents/generate（Agent 生成+本地兜底）、submit-review/approve/publish 全生命周期
- **缺**：POST /social-accounts（绑定）、DELETE /social-accounts/{id}（解绑）、POST /ai-content（契约路径，现实现为 /contents/generate）
- `ContentAgentClient.java`：RestClient 调 Python Agent Runtime，失败本地兜底 ✓
- Entity 已就位：`MkgSocialAccount.java`（mkg_social_account：platform/accountName/authStatus/externalRef）、`MkgContentAsset.java`（mkg_content_asset）
- 表已由 Flyway 脚本 V202608171930 创建，种子数据在 R__novatech_demo_seed.sql
- 社媒平台枚举：FACEBOOK / INSTAGRAM / LINKEDIN / TIKTOK
- 无测试

## 任务清单

### T1: 补齐社媒账号绑定端点
在 `MarketingController.java` 新增 POST `/api/v1/marketing/social-accounts`：
- 请求体：platform（必填，FACEBOOK/INSTAGRAM/LINKEDIN/TIKTOK 枚举校验）、accountName（必填）、externalRef（可选）
- 创建 MkgSocialAccount，authStatus 初始值 PENDING（或参照种子数据的枚举值）
- 权限码 `mkg:social:manage`（与现有 mkg:social:view 同风格新增；如不确定则用 `mkg:social:view` 同级权限码）
- 参数校验失败返回统一错误响应（参考 lingxi-starter-core 的 Result 失败格式）

### T2: 补齐社媒账号解绑端点
新增 DELETE `/api/v1/marketing/social-accounts/{id}`：
- 按 id 查 MkgSocialAccount，不存在返回错误
- 存在则删除（物理删除 deleteById 或逻辑删除，参照 BaseEntity 是否有 deleted 字段）
- 权限码与 T1 一致

### T3: 补齐 AI 内容契约端点
新增 POST `/api/v1/marketing/ai-content`：
- 行为与现有 POST `/contents/generate` 一致：调用 `ContentAgentClient` 生成内容（Agent 失败时本地兜底），创建 MkgContentAsset 记录
- **保留**现有 `/contents/generate` 端点不动（前端兼容），新端点直接复用同一逻辑（提取公共私有方法或直接调用）
- 请求体：contentType（图文/视频）、topic/keywords、locale（可选）
- 权限码 `mkg:content:generate`

### T4: 领域事件 TODO 标记
契约 M6.4 要求发布 `lx.mkg.content.generated` 事件。在内容生成成功处添加 TODO 注释：
```java
// TODO: 待事件总线基础设施就绪后发布 lx.mkg.content.generated 事件
```

### T5: 单元测试
编写 `MarketingControllerTest.java`（放在 `lingxi-biz-marketing/src/test/java/com/lingxi/marketing/app/`）：
- 参考 `lingxi-mdata` 的 `MdataControllerTest.java` 测试风格（@SpringBootTest + MockBean）
- 测试用例（至少 8 个）：
  1. 查询社媒账号列表
  2. 绑定社媒账号成功（platform + accountName）
  3. 绑定时 platform 非法枚举值被拒绝
  4. 绑定时缺少 accountName 返回错误
  5. 解绑社媒账号成功
  6. 解绑不存在的账号返回错误
  7. POST /ai-content 生成内容成功（Mock ContentAgentClient 返回内容）
  8. POST /ai-content Agent 失败时本地兜底仍创建记录

### T6: 编译验证 + result.json
- 运行 `./mvnw compile -pl lingxi-biz/lingxi-biz-marketing -am` 确保编译通过
- 运行 `./mvnw test -pl lingxi-biz/lingxi-biz-marketing` 确保测试通过
- 将结果写入 `artifacts/M6-backend/result.json`，格式：
```json
{
  "taskId": "M6-backend",
  "status": "COMPLETED",
  "summary": "补齐社媒账号绑定/解绑+ai-content契约端点+8个单元测试",
  "testCount": 8,
  "testPassed": 8,
  "testFailed": 0,
  "files": ["list all changed/created files"],
  "notes": "任何需要说明的事项"
}
```

## 技术参考
- 契约文件：contracts.md M6 章节
- 基类：lingxi-starter-mybatis 的 BaseEntity
- 统一响应：lingxi-starter-core 的 Result
- 权限注解：@RequirePermission（lingxi-starter-security）
- ID 生成：lingxi-id 的 IdGenerator
- 租户上下文：TenantContext.getTenantId() / UserContext.require().getTenantId()

## 注意事项
- 不要修改已有 Entity 的 @TableName schema 和字段定义
- 保留现有全部端点（contents 系列、campaigns 等），只新增不删除
- authStatus 初始值以种子数据 R__novatech_demo_seed.sql 中 mkg_social_account 的实际值为准（先查看）
- 测试用 MockBean 隔离 ContentAgentClient 和 Mapper，不依赖真实 Agent Runtime
