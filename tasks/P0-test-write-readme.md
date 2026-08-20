# 任务：P0 验收测试 · 完善 README

## 输入
- 仓库说明：README.md（当前仅有骨架内容）
- 技术规约：AGENTS.md
- 项目文档：docs/README.md（文档索引）

## 范围
- 仅允许修改 `README.md`
- 禁止修改其他文件

## 输出（强制）
1. 完善 README.md，包含以下内容：
   - 项目简介（灵犀系统是什么）
   - 技术栈概览（Java 17 + Spring Boot 3.2.5 / Next.js 15 + Turborepo / Python 3.11 + LangGraph）
   - 模块清单（15 个 Maven 模块 + 前端 + AI）
   - 快速启动指南（`make dev` / `make build` / `make test`）
   - 文档索引链接
   - 协作流程链接（AGENTS.md / contracts.md / TASKS.md）
2. 将执行结果写入 `artifacts/P0-test/result.json`（格式见 artifacts/README.md）
3. 提交并推送分支 `cursor/feat-p0-test-readme`

## 验收标准
- [ ] README.md 内容完整，无占位符
- [ ] result.json 已写入，status=COMPLETED
- [ ] 未越界修改其他文件
- [ ] 分支已推送，PR 已创建

## 完成后声明
- 在 PR 描述中粘贴修改摘要
