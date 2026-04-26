# Claude Code 工作说明

> 本文件是 Claude Code 的最小入口说明，不重复维护产品方向或实现细节。

## 先读什么

开始任何编码、debug、review 前，按需读取：
1. `../../CLAUDE.md`
2. 对应 package 的 `CLAUDE.md`
3. `../../workflow/project-profile.yaml`
4. `../../workflow/active-task.yaml`
5. `../../workflow/handoff.md`

如果任务涉及产品定义或模块设计，再补充读取：
- `../MEMORY.md`
- `../AGENT-DESIGN-BRIEF.md`
- `../PRD/PRD-001-Master.md`
- 对应模块 PRD

如果任务涉及架构拆分，再读：
- `../architecture/RETRIEVAL-UNIT-GUIDANCE.md`

## 执行原则

1. 不把本文件当作产品真相源。
2. 不重复 package `CLAUDE.md` 已有的实现规则。
3. 缺 PRD / 缺设计 / scope 不清时，先停下来确认。
4. 收工前运行 `workflow/project-profile.yaml` 中定义的 verify 命令，并更新：
   - `workflow/handoff.md`
   - `workflow/active-task.yaml`

## 文档优先级

1. `../../CLAUDE.md`
2. package 级 `CLAUDE.md`
3. `../MEMORY.md`
4. `../PRD/PRD-001-Master.md`
5. 其他当前文档
6. 历史文档
