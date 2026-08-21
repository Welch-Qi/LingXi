# M10-backend 任务简报：工作台后端契约对齐 + 测试

## 任务概述

M10 工作台后端代码骨架已存在（WorkbenchController + UwTask/UwInquiryEvent Entity），但存在 3 处路径偏差和 1 个缺失端点，且完全没有测试。本任务目标是：**契约对齐 + 补缺失端点 + 测试**。

## 仓库信息

- 仓库：https://github.com/Welch-Qi/LingXi.git
- 基线分支：main
- 工作分支：cursor/feat-m10-backend

## 现有代码分析

### 已有文件

| 文件 | 说明 |
|------|------|
| `lingxi-workbench/src/main/java/com/lingxi/workbench/app/WorkbenchController.java` | 核心 Controller |
| `lingxi-workbench/src/main/java/com/lingxi/workbench/domain/UwTask.java` | 待办任务实体 |
| `lingxi-workbench/src/main/java/com/lingxi/workbench/domain/UwInquiryEvent.java` | 询盘事件实体 |
| `lingxi-workbench/src/main/java/com/lingxi/workbench/infra/mapper/UwTaskMapper.java` | BaseMapper |
| `lingxi-workbench/src/main/java/com/lingxi/workbench/infra/mapper/UwInquiryEventMapper.java` | BaseMapper |

### 已有端点

| 方法 | 路径 | 权限码 | 契约对照 |
|------|------|--------|---------|
| GET | `/api/v1/workbench/home` | `uw:home:view` | ❌ 路径不符，契约要求 `/dashboard` |
| GET | `/api/v1/workbench/tasks` | `uw:home:view` | ✅ 已实现 |
| POST | `/api/v1/workbench/tasks` | `uw:home:view` | 额外端点（创建任务） |
| POST | `/api/v1/workbench/tasks/{id}/complete` | `uw:home:view` | ✅ 已实现 |
| GET | `/api/v1/workbench/inquiries` | `uw:home:view` | ✅ 已实现 |
| POST | `/api/v1/workbench/inquiries/{id}/ack` | `uw:home:view` | ❌ 路径不符，契约要求 `/acknowledge` |

### 契约端点（contracts.md M10.2 + api-design.md 2.8）

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| GET | `/api/v1/workbench/dashboard` | 个性化工作区 | ❌ 路径不符（代码为 `/home`） |
| GET | `/api/v1/workbench/tasks` | 统一待办列表 | ✅ 已实现 |
| PATCH | `/api/v1/workbench/tasks/{id}` | 更新任务状态 | ❌ 缺失 |
| POST | `/api/v1/workbench/tasks/{id}/complete` | 完成任务 | ✅ 已实现 |
| GET | `/api/v1/workbench/inquiries` | 询盘提醒列表 | ✅ 已实现 |
| POST | `/api/v1/workbench/inquiries/{id}/acknowledge` | 确认询盘 | ❌ 路径不符（代码为 `/ack`） |

### 数据库表

- `uw_task`（lingxi_biz schema），字段：biz_code, title, task_type, status, priority, assignee_id, due_at, source_type, source_id, payload, completed_at + 审计字段
- `uw_inquiry_event`（lingxi_biz schema），字段：biz_code, title, channel, contact_name, contact_email, company_name, lead_id, status, acknowledged_by, acknowledged_at + 审计字段
- Flyway 脚本：`V202608181200__sales_follow_workbench.sql`

## 任务清单

### 任务 1：契约路径对齐 — /home → /dashboard

将 `GET /api/v1/workbench/home` 改为 `GET /api/v1/workbench/dashboard`。

修改 `WorkbenchController.java`：
- 将 `@GetMapping("/home")` 改为 `@GetMapping("/dashboard")`
- 方法名从 `home` 改为 `dashboard`
- 响应体格式不变（仍返回 KPI 概览 + 待办统计 + 询盘统计）

### 任务 2：契约路径对齐 — /ack → /acknowledge

将 `POST /api/v1/workbench/inquiries/{id}/ack` 改为 `POST /api/v1/workbench/inquiries/{id}/acknowledge`。

修改 `WorkbenchController.java`：
- 将 `@PostMapping("/inquiries/{id}/ack")` 改为 `@PostMapping("/inquiries/{id}/acknowledge")`
- 方法名从 `ackInquiry` 改为 `acknowledgeInquiry`

### 任务 3：新增 PATCH /api/v1/workbench/tasks/{id}

新增局部更新任务端点，支持更新 status/priority/assigneeId 等字段。

在 `WorkbenchController.java` 新增方法：

```java
@PatchMapping("/tasks/{id}")
@RequirePermission("uw:home:view")
public Result<TaskVO> updateTask(@PathVariable Long id, @RequestBody @Validated UpdateTaskRequest request) {
    // 局部更新：status / priority / assigneeId / dueAt
    // 使用 MyBatis-Plus 的 updateById 或自定义 update
}
```

创建 `UpdateTaskRequest` DTO：
```java
public record UpdateTaskRequest(
    String status,      // OPEN / IN_PROGRESS / DONE / CANCELLED
    Integer priority,
    Long assigneeId,
    java.time.Instant dueAt
) {}
```

行为：
- 只更新非 null 字段
- 如果 status 改为 "DONE"，自动设置 completedAt
- 返回更新后的 TaskVO

### 任务 4：单元测试 — WorkbenchController

创建 `lingxi-workbench/src/test/java/com/lingxi/workbench/app/WorkbenchControllerTest.java`：

测试用例：
1. `testDashboardReturnsResult` — 验证 GET /api/v1/workbench/dashboard 返回统一 Result
2. `testListTasks` — 验证 GET /api/v1/workbench/tasks 返回分页列表，支持 status/mineOnly 参数
3. `testCompleteTask` — 验证 POST /api/v1/workbench/tasks/{id}/complete 标记任务为 DONE
4. `testUpdateTask` — 验证 PATCH /api/v1/workbench/tasks/{id} 局部更新任务
5. `testUpdateTaskStatusToDone` — 验证 PATCH 更新 status=DONE 时自动设置 completedAt
6. `testListInquiries` — 验证 GET /api/v1/workbench/inquiries 返回分页列表
7. `testAcknowledgeInquiry` — 验证 POST /api/v1/workbench/inquiries/{id}/acknowledge 确认询盘

使用 `@WebMvcTest(WorkbenchController.class)` + `@MockBean` 依赖。

### 任务 5：编译验证

确保 `mvn compile -pl lingxi-workbench -am` 通过。

## 验收标准

1. `GET /api/v1/workbench/dashboard` 端点存在
2. `PATCH /api/v1/workbench/tasks/{id}` 端点存在且可局部更新
3. `POST /api/v1/workbench/inquiries/{id}/acknowledge` 端点存在
4. WorkbenchControllerTest 至少 7 个测试全通过
5. `mvn compile -pl lingxi-workbench -am` 编译通过

## 回传协议

完成后将结果写入 `artifacts/M10-backend/result.json`，格式：

```json
{
  "taskId": "M10-backend",
  "status": "COMPLETED",
  "summary": "一句话描述完成情况",
  "tests": {
    "total": 7,
    "passed": 7,
    "failed": 0,
    "skipped": 0
  },
  "filesChanged": 5,
  "linesAdded": 250,
  "contractChecks": [
    {"endpoint": "GET /api/v1/workbench/dashboard", "status": "PASS"},
    {"endpoint": "PATCH /api/v1/workbench/tasks/{id}", "status": "PASS"},
    {"endpoint": "POST /api/v1/workbench/inquiries/{id}/acknowledge", "status": "PASS"}
  ],
  "blockers": []
}
```

提交并推送分支 `cursor/feat-m10-backend`，确保 autoCreatePR 开启。
