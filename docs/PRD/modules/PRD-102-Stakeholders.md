# PRD-102 — Stakeholders

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-102 |
| **Status** | Draft |
| **Module** | Stakeholders |
| **Parent** | `docs/PRD/PRD-001-Master.md` |
| **Last Updated** | 2026-04-12 |

---

## 1. 模块目标

Stakeholder 模块不是通讯录，而是干系人管理面板。

它的目标是帮助项目经理：

- 管理所有干系人的基本信息（跨项目共享）
- 在每个项目中为干系人分配角色和标注重要性
- 识别谁需要重点管理预期、谁的支持或阻力会放大风险
- 明确下一步应该主动推动什么沟通动作

---

## 2. 两层架构

本模块分为两层设计：

### 第一层：Stakeholder Universe

一个全局的人员信息库，跨项目共享。

**职责：**
- 维护所有干系人的基本信息
- 不绑定特定项目
- 一人只存在一条记录
- 在不同项目中被引用

**核心字段：**
- `id`
- `name`
- `organization`
- `title`
- `email`
- `phone`
- `contact_note`
- `created_at`
- `updated_at`

### 第二层：Project Stakeholder（项目关联）

一个人在一个项目中的具体角色、重要性和管理策略。

**职责：**
- 记录某人在某项目中的具体角色和关系
- 支持同一人在不同项目中拥有不同角色和不同重要性
- 为后续分析工具提供数据基础

**核心字段：**
- `id`
- `person_id`（关联到 Stakeholder Universe）
- `project_id`
- `role_in_project`（项目中的具体角色，自由填写或从预设选择）
- `role_tag`（Sponsor / Steering Committee / Core Team / User / Vendor / Regulator / Other）
- `power_level`
- `interest_level`
- `support_level`
- `engagement_current`
- `engagement_desired`
- `expectation`
- `concern`
- `relationship_status`
- `communication_note`
- `next_action`
- `last_contact_at`
- `raci_role`（R / A / C / I，可选）
- `created_at`
- `updated_at`

---

## 3. Role Tagging 说明

`role_tag` 是对干系人在项目中的角色分类，使用 PMBOK 常见分类：

| Tag | 说明 |
|-----|------|
| Sponsor | 项目发起人，提供资源与授权 |
| Steering Committee | 指导委员会成员，决策和方向把控 |
| Core Team | 核心团队成员，直接执行工作 |
| User | 产品/服务的最终用户或受益人 |
| Vendor | 外部供应商或合作方 |
| Regulator | 监管机构或合规相关方 |
| Influencer | 不直接参与但有影响力的人或组织 |
| Other | 其他 |

一个干系人在一个项目中可以有多个 tag。

---

## 4. 项目间关联设计

核心设计原则：**人是跨项目的，角色和重要性是项目级的。**

```
Stakeholder Universe
  ├── Person A
  │     ├── Project X → Core Team, Power: High, Interest: High
  │     └── Project Y → Steering Committee, Power: High, Interest: Medium
  ├── Person B
  │     └── Project X → Vendor, Power: Low, Interest: Low
  └── Person C
        ├── Project X → Sponsor, Power: High, Interest: High
        └── Project Z → User, Power: Medium, Interest: High
```

**关键区别：**
- `role_in_project`：自由文本，描述这个人在这项目中具体做什么（如"技术架构师"、"甲方接口人"）
- `role_tag`：预设分类，用于筛选和分析
- `raci_role`：PMBOK RACI 矩阵中的角色，可选填写

---

## 5. 重要性评估（MVP vs 后续）

### MVP 做法

重要性先用简化字段：
- `power_level`（High / Medium / Low）
- `interest_level`（High / Medium / Low）
- `support_level`（Supporter / Neutral / Resistor / Unknown）
- `engagement_current`（Active / Passive / Disengaged / Unknown）
- `engagement_desired`（Active / Supportive / ...）

这些字段由 PM 手动填写，基于 PM 自己的判断。

### 后续演进工具（P1/P2）

以下工具用于从输入字段生成重要性判断，不是 MVP：

| 工具 | 输入 | 输出 | 优先级 |
|------|------|------|--------|
| Power–Interest Matrix | power_level + interest_level | 四象限分类（Manage Closely / Keep Satisfied / Keep Informed / Monitor） | P1 |
| Influence–Impact Matrix | power_level + impact_level | 优先管理排序 | P1 |
| Current–Desired Engagement Matrix | engagement_current + engagement_desired | 沟通策略建议 | P2 |
| RACI Matrix | raci_role + 工作包/交付物 | 责任分配表 | P1 |

这些工具的第一版可以先不做。先把字段和基础 CRUD 做扎实，后续再叠加可视化矩阵和分析工具。

---

## 6. P0 / P1 / P2

### P0

**Stakeholder Universe：**
- 支持人员列表、创建、编辑、删除
- 支持基础信息维护：name、organization、title、contact
- 支持查看某人在哪些项目中参与

**Project Stakeholder：**
- 支持从 Universe 中选择人员关联到项目
- 支持 role_in_project、role_tag、power_level、interest_level、support_level
- 支持 expectation、concern、next_action、last_contact_at
- 支持快速筛选关键干系人（按 power、support、role_tag 过滤）

### P1

- Power–Interest Matrix 可视化
- Influence–Impact Matrix 可视化
- RACI Matrix 基础版（按工作包/交付物分配 R/A/C/I）
- 支持按 role_tag 分组查看
- 支持与 Risks / Work Packages 建立关联
- 支持展示最近沟通摘要

### P2

- Current–Desired Engagement Matrix 可视化
- 支持从 Evidence 中抽取干系人相关诉求与风险信号
- 支持生成待跟进建议
- 支持干系人沟通计划模板

---

## 7. 与其他模块关系

- 与 `Project Canvas`：Canvas 的 Sponsor 字段引用 Universe 中的人
- 与 `Risks`：高风险往往与特定干系人相关
- 与 `Work Packages`：某些推进动作需要特定干系人配合，RACI 分配
- 与 `Evidence`：会议纪要、邮件可作为诉求和关系变化来源
- 与 `Timeline`：关键里程碑的确认可能依赖特定干系人

---

## 8. 设计约束

- 必须体现"责任感地管理干系人"，不能做成静态名单
- 页面应优先帮助 PM 判断"谁最需要被主动管理"
- `next_action` 应该是核心字段，而不是附加备注
- 人是跨项目的，角色和重要性是项目级的，这两个层次不能混淆
- 重要性评估工具先不做，但字段设计要预留输入空间
