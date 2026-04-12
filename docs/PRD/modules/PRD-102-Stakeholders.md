# PRD-102 — Stakeholders

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-102 |
| **Status** | Draft |
| **Module** | Stakeholders |
| **Parent** | `docs/PRD/PRD-001-Master.md` |
| **Last Updated** | 2026-04-11 |

---

## 1. 模块目标

Stakeholders 模块不是通讯录，而是干系人管理面板。

它的目标是帮助项目经理识别：

- 谁影响项目结果
- 谁需要重点管理预期
- 谁的支持或阻力会放大项目风险
- 下一步应该主动推动什么沟通动作

---

## 2. 模块边界

### 本模块负责

- 记录关键干系人
- 管理影响力、支持度、诉求、顾虑与关系状态
- 记录最近沟通与下一步动作
- 支撑责任感导向的干系人管理

### 本模块不负责

- 代替 CRM
- 代替聊天工具或通讯录
- 承担完整会议纪要记录

---

## 3. 核心字段

- `name`
- `organization`
- `role`
- `influence_level`
- `support_level`
- `expectation`
- `concern`
- `relationship_status`
- `owner_note`
- `last_contact_at`
- `next_action`

---

## 4. P0 / P1 / P2

### P0

- 支持列表、创建、编辑、删除
- 支持 role、influence、support、expectation、concern、relationship status
- 支持记录 last contact 与 next action
- 支持快速筛选关键干系人

### P1

- 支持按影响力 / 支持度 / 关系状态分组
- 支持与 Risks / Work Packages / Evidence 建立关联
- 支持展示最近沟通摘要

### P2

- 支持从 Evidence 中抽取干系人相关诉求与风险信号
- 支持生成待跟进建议

---

## 5. 与其他模块关系

- 与 `Risks`：高风险往往与特定干系人相关
- 与 `Work Packages`：某些推进动作需要特定干系人配合
- 与 `Evidence`：会议纪要、邮件、IM 片段可作为诉求和关系变化来源
- 与 `Project Canvas`：可回写关键干系人摘要

---

## 6. 设计约束

- 必须体现“责任感地管理干系人”，不能做成静态名单
- 页面应优先帮助 PM 判断“谁最需要被主动管理”
- `next_action` 应该是核心字段，而不是附加备注
