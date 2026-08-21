# M8-backend 任务简报：智能决策中心契约对齐 + 测试

## 任务概述

M8 智能决策中心代码骨架已存在（DecisionController + DecisionDashboardService + DmKpiSnapshot Entity），但存在契约路径偏差且完全没有测试。本任务目标是：**契约对齐 + 补充测试 + 编译验证**。

## 仓库信息

- 仓库：https://github.com/Welch-Qi/LingXi.git
- 基线分支：main
- 工作分支：cursor/feat-m8-backend

## 现有代码分析

### 已有文件

| 文件 | 说明 |
|------|------|
| `lingxi-decision/src/main/java/com/lingxi/decision/app/DecisionController.java` | 核心 Controller |
| `lingxi-decision/src/main/java/com/lingxi/decision/app/DecisionDashboardService.java` | 驾驶舱数据组装服务 |
| `lingxi-decision/src/main/java/com/lingxi/decision/domain/DmKpiSnapshot.java` | KPI 快照实体 |
| `lingxi-decision/src/main/java/com/lingxi/decision/infra/mapper/DmKpiSnapshotMapper.java` | MyBatis-Plus Mapper |

### 已有端点

| 方法 | 路径 | 权限码 | 契约对照 |
|------|------|--------|---------|
| GET | `/api/v1/decision/dashboard` | `dm:dashboard:view` | ✅ 已实现 |
| GET | `/api/v1/decision/kpis` | `dm:dashboard:view` | 额外端点 |
| POST | `/api/v1/decision/qa` | `dm:qa:ask` | ❌ 路径不符，契约要求 `/ask` |

### 数据库表

- `dm_kpi_snapshot`（lingxi_biz schema），已有 Flyway 脚本 `V202608171940__decision_knowledge_config.sql`

## 任务清单

### 任务 1：契约路径对齐

将 `POST /api/v1/decision/qa` 改为 `POST /api/v1/decision/ask`。

修改 `DecisionController.java`：
- 将 `@PostMapping("/qa")` 改为 `@PostMapping("/ask")`
- 方法名保持 `askQuestion` 或改为 `ask`
- 权限码保持 `dm:qa:ask`
- 请求体和响应体格式不变

### 任务 2：单元测试 — DecisionController

创建 `lingxi-decision/src/test/java/com/lingxi/decision/app/DecisionControllerTest.java`：

测试用例：
1. `testDashboardReturnsResult` — 验证 GET /api/v1/decision/dashboard 返回统一 Result，data 包含 kpiCards/heatmap/funnel/trend
2. `testAskReturnsAnswer` — 验证 POST /api/v1/decision/ask 返回统一 Result，data 包含 answer 字段
3. `testAskWithEmptyQuestion` — 验证空问题返回参数校验错误（code 非 0）
4. `testAskWithUnknownMetric` — 验证未知指标返回友好提示而非异常

使用 `@WebMvcTest(DecisionController.class)` + `@MockBean DecisionDashboardService`。

### 任务 3：单元测试 — DecisionDashboardService

创建 `lingxi-decision/src/test/java/com/lingxi/decision/app/DecisionDashboardServiceTest.java`：

测试用例：
1. `testBuildDashboardWithKpiData` — 验证 Mock Mapper 返回 KPI 数据时，buildDashboard 正确组装 kpiCards
2. `testBuildDashboardWithEmptyData` — 验证空数据时返回空列表而非 null
3. `testAskQuestionWithKnownMetric` — 验证已知 metric_code（如 "products"、"orders"）能返回对应值
4. `testAskQuestionWithUnknownMetric` — 验证未知 metric_code 返回提示信息

使用 `@ExtendWith(MockitoExtension.class)` + `@Mock DmKpiSnapshotMapper`。

### 任务 4：编译验证

确保 `mvn compile -pl lingxi-decision -am` 通过。

## 验收标准

1. `POST /api/v1/decision/ask` 端点存在且可调用
2. `POST /api/v1/decision/qa` 可保留为兼容别名（可选，非必须）
3. DecisionControllerTest 至少 4 个测试全通过
4. DecisionDashboardServiceTest 至少 4 个测试全通过
5. `mvn compile -pl lingxi-decision -am` 编译通过

## 回传协议

完成后将结果写入 `artifacts/M8-backend/result.json`，格式：

```json
{
  "taskId": "M8-backend",
  "status": "COMPLETED",
  "summary": "一句话描述完成情况",
  "tests": {
    "total": 8,
    "passed": 8,
    "failed": 0,
    "skipped": 0
  },
  "filesChanged": 10,
  "linesAdded": 200,
  "contractChecks": [
    {"endpoint": "POST /api/v1/decision/ask", "status": "PASS"},
    {"endpoint": "GET /api/v1/decision/dashboard", "status": "PASS"}
  ],
  "blockers": []
}
```

提交并推送分支 `cursor/feat-m8-backend`，确保 autoCreatePR 开启。
