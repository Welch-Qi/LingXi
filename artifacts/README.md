# artifacts/ — 结果回传区

本目录存放 Cursor Agent 执行完成后回传的结构化结果文件。

## 目录结构

```
artifacts/
├── M1/
│   └── result.json       # M1 后端任务结果
├── M4/
│   ├── result.json       # M4 后端任务结果
│   └── test-report.xml   # 测试报告
└── M4-fix-001/
    └── result.json       # M4 修复任务结果
```

## result.json 格式

```json
{
  "task": "M4-backend",
  "agent": "bc-xxxx",
  "runId": "run-yyyy",
  "status": "COMPLETED",
  "prUrl": "https://github.com/Welch-Qi/LingXi/pull/12",
  "branch": "cursor/feat-m4-market",
  "summary": "实现搜索指数 API 12 个端点",
  "changedFiles": ["lingxi-biz/lingxi-biz-market/src/..."],
  "tests": { "total": 48, "passed": 48, "failed": 0, "coverage": 0.86 },
  "contractChecks": { "passed": 12, "failed": 0 },
  "blockers": [],
  "nextActions": ["前端对接 /api/v1/market/search-trends"]
}
```

## WorkBuddy 侧验证流程

1. 轮询 run 状态 -> COMPLETED 后 `git fetch` 对应分支
2. 读取 `artifacts/{module}/result.json`
3. 测试 Agent checkout 分支 -> 跑契约测试 + E2E -> 出 test-report.xml
4. 全部通过 -> 合并 PR -> 更新 TASKS.md 为 DONE
5. 有失败 -> 生成 `tasks/{module}-fix-{NNN}.md` 修复简报
