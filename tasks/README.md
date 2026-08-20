# tasks/ — 任务简报队列

本目录存放 WorkBuddy 协调 Agent 生成的任务简报文件，供 Cursor Agent 读取执行。

## 文件命名

```
{模块}-{类型}.md        # 首次任务（如 M1-backend.md）
{模块}-fix-{NNN}.md     # 修复任务（如 M4-fix-001.md）
```

## 简报模板

详见 `docs/灵犀系统-WorkBuddy-Cursor混合流水线方案.md` 第 4.2 节。

简报必须包含：
- `## 输入`：契约路径、API 设计、数据模型、技术规约
- `## 范围`：允许修改的文件路径（越界修改将被拒绝合并）
- `## 输出`：强制完成项 + result.json 写入
- `## 验收标准`：可勾选的检查项
- `## 完成后声明`：PR 描述中粘贴测试摘要

## 流程

1. 协调 Agent 读取 `TASKS.md`，找到 READY 任务
2. 根据 `contracts.md` 和 `docs/` 生成简报并 commit 到此目录
3. 调用 Cursor API 派发，简报路径写入 prompt.text
4. Cursor Agent 读取简报执行
5. 完成后结果写入 `artifacts/{module}/result.json`
