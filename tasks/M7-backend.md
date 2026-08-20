# M7-backend — 知识中心（模板/话术/提示词）

## 目标
M7 契约端点已全部对齐，本任务重点是补充测试覆盖 + 少量增强。

## 仓库信息
- 仓库: https://github.com/Welch-Qi/LingXi
- 分支: cursor/feat-m7-backend
- 基线: main

## 契约要求（contracts.md M7.2）

| 资源 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 模板 | GET | /api/v1/knowledge/templates | 分页查询模板 |
| 模板 | POST | /api/v1/knowledge/templates | 创建模板 |
| 话术 | GET | /api/v1/knowledge/scripts | 分页查询话术 |
| 话术 | POST | /api/v1/knowledge/scripts | 创建话术 |
| 提示词 | GET | /api/v1/knowledge/prompts | 分页查询提示词 |
| 提示词 | POST | /api/v1/knowledge/prompts | 创建提示词 |

## 现有代码分析

已有代码在 `lingxi-knowledge` 模块：
- `KnowledgeController.java`：模板/话术/提示词 CRUD（GET列表/POST创建/PUT更新/DELETE删除），6 个契约端点全部实现 ✓
- `KcTemplate.java`/`KcScript.java`/`KcPrompt.java`：Entity 完整，与 data-model.md 2.8 节对齐
- 3 个 Mapper 接口已就位
- biz_code 前缀：模板 TPL-，话术 SCR-，提示词 prompt.xxx.v1

## 任务清单

### T1: 补充分页查询的 keyword 搜索
在 GET 列表端点增加 keyword 参数（String，可选）：
- 模板列表：按 name 模糊搜索
- 话术列表：按 scene 模糊搜索
- 提示词列表：按 name 模糊搜索

### T2: 补充分页响应体格式
确保 GET 列表返回统一分页格式：
```json
{
  "list": [...],
  "total": 150,
  "pageNo": 1,
  "pageSize": 20
}
```
如果当前实现返回的是纯 List，改为 `PageResult` 或在 Result.data 中包装为 `{list, total, pageNo, pageSize}` 格式。

### T3: 单元测试
为 KnowledgeController 编写单元测试 `KnowledgeControllerTest.java`：
- 参考 `lingxi-iam` 的测试风格
- 测试用例（至少 8 个）：
  1. 创建模板成功
  2. 查询模板列表分页
  3. 更新模板
  4. keyword 搜索模板
  5. 创建话术成功
  6. 创建提示词成功（验证 promptCode 自动生成）
  7. 创建模板缺少 name 时返回错误
  8. 查询提示词列表

### T4: 编译验证 + result.json
- 运行 `./mvnw compile -pl lingxi-knowledge -am` 确保编译通过
- 运行测试确保通过
- 将结果写入 `artifacts/M7-backend/result.json`，格式：
```json
{
  "taskId": "M7-backend",
  "status": "COMPLETED",
  "summary": "补齐keyword搜索+分页格式+8个单元测试",
  "testCount": 8,
  "testPassed": 8,
  "testFailed": 0,
  "files": ["list all changed/created files"],
  "notes": "任何需要说明的事项"
}
```

## 技术参考
- 契约文件：contracts.md M7 章节
- 数据模型：docs/data-model.md 2.8 节
- 基类：lingxi-starter-mybatis 的 BaseEntity
- ID 生成：lingxi-id 的 IdGenerator
- 统一响应：lingxi-starter-core 的 Result
- 权限注解：@RequirePermission("kc:knowledge:manage")
- 租户上下文：TenantContext.getTenantId() / UserContext.require().getTenantId()
- 参考 KnowledgeController 现有 resolveTenantId() 方法

## 注意事项
- 不修改已有 Entity 和 Mapper
- 不修改 Flyway 脚本（kc_* 表已建好）
- 测试使用 @SpringBootTest + MockBean 风格
- 保持现有 promptCode 自动生成逻辑不变
