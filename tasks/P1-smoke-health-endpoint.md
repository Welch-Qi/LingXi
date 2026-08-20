# P1 冒烟测试：后端健康检查端点

## 模块
P1-smoke (冒烟验证任务，不属于正式 M0-M10 模块)

## 目标
在 lingxi-server 模块中添加一个简单的健康检查 REST 端点，验证多智能体协作流水线的真实派发→执行→回传闭环。

## 范围
1. 在 `lingxi-server` 模块中创建 `HealthController.java`
2. 端点路径：`GET /api/v1/health`
3. 返回 JSON：`{"status":"UP","timestamp":"<ISO-8601>","module":"lingxi-server"}`
4. 添加一个基本的单元测试 `HealthControllerTest.java`

## 约束
- 遵循 AGENTS.md 中的代码规范（Java 17，Spring Boot 3.2.5）
- Controller 放在 `lingxi-server/src/main/java/com/lingxi/server/web/controller/` 包下
- 测试放在 `lingxi-server/src/test/java/com/lingxi/server/web/controller/` 包下
- 使用 Spring Boot Test（`@SpringBootTest` 或 `@WebMvcTest`）
- 不需要连接数据库（纯端点测试）

## 完成标准
- `HealthController.java` 编译通过
- `HealthControllerTest.java` 测试通过
- `artifacts/P1-smoke/result.json` 写入回传结果

## 回传格式
```json
{
  "status": "COMPLETED",
  "task": "P1-smoke",
  "branch": "cursor/feat-p1-smoke",
  "tests": {
    "passed": <通过数>,
    "total": <总数>,
    "coverage": <覆盖率百分比>
  },
  "changedFiles": ["<文件路径列表>"],
  "notes": "<简要说明>"
}
```
