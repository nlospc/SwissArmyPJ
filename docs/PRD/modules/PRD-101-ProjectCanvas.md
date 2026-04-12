# PRD-101 — Project Canvas

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-101 |
| **Status** | Draft |
| **Module** | Project Canvas |
| **Parent** | `docs/PRD/PRD-001-Master.md` |
| **Last Updated** | 2026-04-11 |

---

## 1. 模块目标

Project Canvas 是项目的结构化全景摘要。

它的目标不是代替详细台账，而是让项目经理在一个页面里快速理解：

- 项目为什么存在
- 项目要达成什么
- 范围在哪里
- 当前最大的风险和约束是什么
- 当前项目总体状态如何

---

## 2. 模块边界

### 本模块负责

- 承载项目级摘要信息
- 形成“一眼看懂项目”的概览页
- 汇总关键范围、里程碑、风险、干系人与项目阶段
- 作为 PM 进行总体判断的主入口

### 本模块不负责

- 替代 Timeline 的详细计划管理
- 替代 Risks 的详细风险记录
- 替代 Stakeholders 的详细干系人管理
- 替代 Work Packages 的责任推进台账

---

## 3. 内容块定义

- Purpose
- Objective
- Project Sponsor
- Scope / Requirements
- Scope / Deliverables
- Scope Exclusion
- Assumptions / Constraints
- Resources
- Milestones
- Stakeholders
- Risks
- Project Phases
- Team
- Lessons Learned

---

## 4. P0 / P1 / P2

### P0

- 支持上述内容块的查看与编辑
- 支持项目唯一归属
- 支持快速保存与快速修改
- 允许部分内容块手工填写摘要，而不是强制结构化拆得很细

### P1

- 支持与 Timeline / Risks / Stakeholders 的摘要联动
- 支持显示最近更新来源
- 支持查看修改历史

### P2

- 支持根据 Evidence 生成候选摘要
- 支持提示某些内容块可能过时或与新证据冲突

---

## 5. 与其他模块关系

- 与 `Timeline`：引用关键里程碑摘要
- 与 `Risks`：引用关键风险摘要
- 与 `Stakeholders`：引用关键干系人摘要
- 与 `Evidence`：未来支持来源挂接与摘要生成

---

## 6. 设计约束

- 必须保持“全景摘要”定位，不应膨胀成另一套详细台账
- 应优先帮助 PM 快速判断项目状态，而不是追求字段完备
- 内容块应支持逐步结构化，不要一开始做得太重
