# TASKS.md — 灵犀系统多智能体任务看板

> 本文件是协调 Agent 的任务调度看板。每次 Automation 运行时读取并更新此文件。
> 任务状态流转：`PENDING` -> `READY` -> `BRIEFED` -> `DISPATCHED` -> `RUNNING` -> `VERIFYING` -> `DONE` / `BLOCKED`

---

## 任务状态总表

| 模块 | 任务 ID | 名称 | 依赖 | 状态 | 通道 | agentId | runId | PR | 修复轮次 | 备注 |
|------|---------|------|------|------|------|---------|-------|-----|---------|------|
| P1 | P1-smoke | 冒烟测试：健康检查端点 | - | DONE | B | bc-cbe7af07 | run-748b3c27 | #2 (merged) | 0 | 254s完成，1/1测试通过 |
| M0 | M0-platform | 平台底座（starters + platform 骨架） | - | DONE | - | - | - | - | - | 已有骨架代码 + P1健康端点 |
| M1 | M1-backend | 认证与权限（Casdoor 对接 + Casbin RBAC） | M0 | DONE | B | bc-fa985d5d | run-d29a8a8c | #3 (merged) | 0 | 311s完成，31测试(26通过/5跳过/0失败)，覆盖率85% |
| M2 | M2-backend | 数据中心主数据（客户/商品/渠道/员工） | M0, M1 | DONE | B | bc-8ce549ac | run-03be0d8e | #5 (merged) | 0 | 176s，8测试全通过，新增PATCH+员工CRUD+keyword搜索 |
| M3 | M3-backend | 配置中心（行业定义 + 用户/角色/权限） | M0, M1 | DONE | B | bc-4ce778df | run-33647b54 | #6 (merged) | 0 | 179s，10测试全通过，新增用户/角色/权限CRUD+4张新表 |
| M4 | M4-backend | 市场域后端（搜索指数/热词/机会扫描） | M0, M2 | DONE | B | bc-081e6252 | run-03ae2b10 | #9 (merged) | 0 | 227s，8测试全通过，新增search-trends/hot-keywords/rising-keywords/region-heat端点 |
| M4 | M4-frontend | 市场域前端页面 | M4-backend | PENDING | - | - | - | - | - | 依赖 M4 后端 API |
| M5 | M5-backend | 销售域后端（线索/客户/商机） | M0, M2 | DONE | B | bc-3f886876 | run-f7d23b5d | #8 (merged) | 0 | 192s，11测试全通过，新增线索详情/客户创建/商机创建+advanceTo领域方法 |
| M5 | M5-frontend | 销售域前端页面 | M5-backend | PENDING | - | - | - | - | - | 依赖 M5 后端 API |
| M6 | M6-backend | 营销域后端（社媒账号/AI 内容） | M0, M2 | DONE | B | bc-5eddff8d | run-605b8928 | #7 (merged) | 0 | 161s，8测试全通过，新增社媒绑定/解绑+ai-content契约端点 |
| M6 | M6-frontend | 营销域前端页面 | M6-backend | PENDING | - | - | - | - | - | 依赖 M6 后端 API |
| M7 | M7-backend | 知识中心（模板/话术/提示词） | M0, M1 | DONE | B | bc-58dea20a | run-31a9efe4 | #4 (merged) | 0 | 146s，8测试全通过，keyword搜索+分页格式 |
| M7 | M7-frontend | 知识中心前端页面 | M7-backend | PENDING | - | - | - | - | - | 依赖 M7 后端 API |
| M8 | M8-backend | 智能决策中心（驾驶舱/问答查询） | M0, M2, M5 | DONE | B | bc-9158d07b | run-c3b19b49 | #11 (merged) | 0 | 131s，8测试全通过，/qa→/ask契约对齐+DecisionController/ServiceTest |
| M8 | M8-frontend | 决策中心前端页面 | M8-backend | PENDING | - | - | - | - | - | 依赖 M8 后端 API |
| M9 | M9-backend | AI Agent Runtime（五大智能体） | M4, M5, M6, M7 | DONE | B | bc-8ad1d87e | run-08045b72 | #10 (merged) | 0 | 129s，9测试全通过，新增POST/agent/tasks+GET/agent/tasks/{id}+POST/agent/chat三契约端点 |
| M10 | M10-backend | 工作台后端（首页/任务中心/通知） | M0, M1 | DONE | B | bc-183795d3 | run-0eee90c8 | #12 (merged) | 0 | 113s，7测试全通过，/home→/dashboard+/ack→/acknowledge+新增PATCH /tasks/{id} |
| M10 | M10-frontend | 统一工作台 + 全量前端联调 | M4~M9 全部前端 | PENDING | - | - | - | - | - | 通道C：复杂模块人工兜底 |

---

## 依赖关系图

```
M0 平台底座
├── M1 认证与权限
│   ├── M2 数据中心
│   │   ├── M4 市场域 (依赖 M2 商品主数据)
│   │   ├── M5 销售域 (依赖 M2 客户主数据)
│   │   └── M6 营销域 (依赖 M2 商品主数据)
│   ├── M3 配置中心
│   └── M7 知识中心
├── M8 智能决策 (依赖 M2 + M5)
├── M9 AI Agent Runtime (依赖 M4 + M5 + M6 + M7)
└── M10 工作台 + 前端全量 (依赖 M0 + M1，前端依赖 M4~M9 全部后端)
```

## 并行机会

- M1 完成后，M2/M3/M7 可并行
- M2 完成后，M4/M5/M6 可并行（三域互不依赖）
- M4/M5/M6 坍端完成 + M7 完成后，M9 可启动
- M10 后端（工作台）仅依赖 M0+M1，可早期并行

---

## 通道选择策略

| 场景 | 推荐通道 | 原因 |
|------|---------|------|
| M1 认证、M2/M3/M7 标准 CRUD | B Cloud API | 异步、可并行、不占本地 |
| M4/M5/M6 后端标准模块 | B Cloud API × 3 并行 | 三域互不依赖 |
| Bug 修复（<=5 轮） | A CLI | 快、同步、改完即验 |
| M10 超级工作台前端联调 | C 文件队列 + 人工 | 复杂交互，需人在 IDE 里盯 |
| 夜间批量跑标准模块 | B Cloud API × N 并行 | 8 个上限充分利用 |

---

## 状态定义

| 状态 | 含义 |
|------|------|
| PENDING | 任务已登记，等待依赖完成 |
| READY | 依赖已满足，等待简报生成 |
| BRIEFED | 简报已写入 tasks/ 并 commit，等待派发 |
| DISPATCHED | 已调用 Cursor API 派发，记录了 agentId/runId |
| RUNNING | Cursor Agent 正在执行（run 状态 RUNNING） |
| VERIFYING | Cursor 已完成，测试 Agent 正在验证 |
| DONE | PR 已合并，任务闭环 |
| BLOCKED | 修复轮次 > 5 或其他阻塞，需人工介入 |

---

## 变更日志

| 日期 | 变更 |
|------|------|
| 2026-08-20 | 初始化任务看板，M0 标记 DONE（骨架代码已存在），M1 标记 READY |
| 2026-08-20 | P1 冒烟测试通过：Cursor Cloud Agent 254s 完成 /api/v1/health 端点，PR#2 合并，全链路验证通过 |
| 2026-08-20 | cursor_client.sh 修复：API v1 格式(autoCreatePR/model/status枚举)、jq_shim 重写(数组索引+多级//)、新增 status 命令 |
| 2026-08-20 | M1 任务简报完成，状态 READY -> BRIEFED，准备派发到 Cursor Cloud |
| 2026-08-20 | M1 认证模块完成：Cursor Cloud Agent 311s 完成，PR#3 合并。31 测试(26通过/5跳过/0失败)覆盖率85%。M2/M3/M7/M10-backend 解锁为 READY |
| 2026-08-20 | M2/M3/M7 三路并行派发到 Cursor Cloud：M2(bced8ce5)+M3(bc4ce778d)+M7(bc58dea2a)，全部 RUNNING |
| 2026-08-20 | M2/M3/M7 三路并行完成并合并：M2 PR#5(176s,8测试)+M3 PR#6(179s,10测试)+M7 PR#4(146s,8测试)，共26测试全通过，新增27文件+1679行。M4/M5/M6 解锁为 READY |
| 2026-08-21 | M4/M5/M6 三路并行派发到 Cursor Cloud：M4(bc081e6252)+M5(bc3f886876)+M6(bc5eddff8d)，全部 RUNNING |
| 2026-08-21 | M4/M5/M6 三路并行完成并合并：M4 PR#9(227s,8测试)+M5 PR#8(192s,11测试)+M6 PR#7(161s,8测试)，共27测试全通过，+1297行。M8/M9 解锁为 READY。至此 M0~M7 后端全部 DONE |
| 2026-08-21 | M8/M9/M10 三路并行派发到 Cursor Cloud：M8(bc9158d07b)+M9(bc8ad1d87e)+M10(bc183795d3)，全部 RUNNING |
| 2026-08-21 | M8/M9/M10 三路并行完成并合并：M8 PR#11(131s,8测试)+M9 PR#10(129s,9测试)+M10 PR#12(113s,7测试)，共24测试全通过，+934行。**全部后端模块 M0~M10 DONE，后端开发完成** |
