# SwissArmyPM — Master PRD

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-001 |
| **Status** | Active Baseline |
| **Version** | 2.0.0 |
| **Date** | 2026-04-11 |

---

## 1. 产品定义

SwissArmyPM 是一个**只服务项目经理**的桌面工作台。

它的第一目标不是协同，而是让项目经理在一个独立工作台里快速维护、查看、校正和追溯项目关键事实，在这个基础上提升项目经理的个人效率和pmo治理水平，解放繁琐的内容，聚焦复杂的问题。

---

## 2. 核心问题

项目经理日常面对的问题并不是缺少工具，而是：

- 信息散落在会议纪要、邮件、IM、文档里
- 项目关键信息没有稳定落点
- 时间、风险、干系人、工作包经常版本不一致
- 关键承诺只能靠记忆或翻聊天记录
- 当被追问时，很难立刻给出“答案 + 来源”

---

## 3. 核心用户

| Persona | Role | Key Need |
|---------|------|----------|
| Primary User | 项目经理 | 在一个桌面工作台中维护项目关键事实，并逐步让系统基于证据辅助更新与回答 |

**说明**：当前产品不以 PMO、管理层、技术负责人为核心用户。

---

## 4. 产品目标

### 4.1 第一阶段目标

先做一个**可独立成立**的 PM Workspace，让项目经理可以快速维护以下核心对象：

- 项目画布
- 干系人
- 时间规划表
- 风险登记册
- 工作包

### 4.2 中期目标

引入资料/证据层：

- 会议纪要
- 邮件
- 工作 IM 关键对话
- 其他项目资料摘录

并支持：

- 证据归档
- 候选事实抽取
- 建议更新
- 问答返回来源

### 4.3 长期目标

成为项目经理可信赖的“项目事实工作台”：

- 既能存结构化信息
- 又能从零散证据中拼接项目真相
- 在回答问题和更新结构化信息时保持可追溯性

---

## 5. 产品原则

1. **项目经理唯一核心用户**
2. **桌面独立可用优先**
3. **手工 CRUD 优先于自主代理**
4. **证据先沉淀，再自动化**
5. **关键答案必须可追溯**
6. **快速更新优先于复杂流程**
7. **干系人管理强调责任感**
8. **对事管理强调积极主动**
9. **持续整合项目真相，而不是一次性记录**
10. **聚焦真正影响项目价值的事实**

### 5.1 设计约束

以下不是人格描述，而是产品设计约束：

- 干系人设计不应止于名单维护，而应支持影响力、诉求、关系状态与关键承诺管理
- 时间、风险、工作包设计不应止于静态记录，而应帮助项目经理主动识别偏差并推动动作
- 结构化信息设计应优先服务项目价值，而不是为了完整建模而建模
- 项目事实应通过证据持续整合、持续校正、持续收敛

### 5.2 外部借鉴原则

产品可借鉴 `gbrain` 在以下方面的思路：

- 证据先沉淀，再参与查询与建议更新
- 回答尽量返回“答案 + 来源”
- 证据导入具备去重、幂等、审计能力
- 未来形成结构化检索 + 语义检索的混合查询能力
- 后台持续整理证据，生成候选事实与待确认更新

但不照搬其“泛个人知识大脑”定位，也不让 agent 直接无声改写核心项目事实。

详细 guideline 见 `docs/PMBOK-GBRAIN-GUIDELINE.md`。

---

## 6. MVP 范围

### P0

- 项目列表
- 项目工作台
- 项目画布 CRUD
- 干系人 CRUD
- 时间规划表 CRUD
- 风险登记册 CRUD
- 工作包 CRUD

### P1

- 资料/证据录入与查看
- 关键问题查询（先支持手动来源挂接）
- 快速更新入口

### P2

- 基于证据的候选事实抽取
- 建议更新
- 来源回溯视图
- 冲突提示

---

## 7. 非目标

当前阶段不把以下内容作为产品中心：

- Portfolio / PMO 总览
- My Work / Pomodoro
- 通用 Todo 管理器
- 多角色大型协作系统
- 从 0 自研一个通用 agent runtime

---

## 8. 信息架构方向

```
Project List
  └── Project Workspace
      ├── Canvas
      ├── Stakeholders
      ├── Timeline
      ├── Risks
      ├── Work Packages
      └── Evidence
```

---

## 8.1 模块文档索引

为支持按需加载，模块细节将逐步从本文件拆分到独立文档。

### 模块 PRD

- `docs/PRD/modules/PRD-101-ProjectCanvas.md`
- `docs/PRD/modules/PRD-102-Stakeholders.md`
- `docs/PRD/modules/PRD-103-Timeline.md`（待创建）
- `docs/PRD/modules/PRD-104-Risks.md`（待创建）
- `docs/PRD/modules/PRD-105-WorkPackages.md`（待创建）
- `docs/PRD/modules/PRD-106-Evidence.md`

### 跨模块文档

- `docs/PRD/cross-cutting/PRD-201-Evidence-Traceability.md`

### 读取原则

- 本文件负责产品总纲与模块总览
- 模块字段、页面结构、交互细节优先写入独立模块 PRD
- 跨模块机制优先写入 `cross-cutting/` 文档

---

## 9. 核心对象定义

本节定义的是产品中的**一等对象**，用于统一后续数据模型、页面设计、查询能力与 agent 辅助能力。

### 9.1 `Project`

表示一个项目工作台的根对象。

**作用：**
- 作为所有核心对象的归属容器
- 提供项目基础识别信息
- 作为 Evidence、查询、建议更新的作用域边界

**MVP 建议字段：**
- `id`
- `name`
- `code`
- `status`
- `owner`
- `start_date`
- `target_end_date`
- `description(target)`
- `created_at`
- `updated_at`

### 9.2 `ProjectCanvas`

表示项目的结构化全景摘要，用于快速理解项目当前状态。

**作用：**
- 给项目经理一个“一眼看懂项目”的入口
- PMBOK的经典工具
- 是作为项目的看板存在，快速概览并能够发现项目风险的地方（项目的所有元素在一个页面）

**内容块定义：**
- 目的-Purpose 
- 目标-Objective
- 项目发起人-Project Sponsor
- 范围/需求-Scope/Requirements
- 范围/可交付物-Scope/Deliverbles
- 范围之外-Scope Exclusion
- 假设/制约-Assumption/Constraints
- 资源-Resources
- 里程碑-Milestones
- 干系人-Stakeholders
- 风险-Risks
- 项目阶段-Project Phases
- 团队-Team
- 经验总结-Lessons Learned

### 9.3 `Stakeholder`

表示一个对项目结果有影响、被项目影响、或需要被主动管理预期的人或群体。

**作用：**
- 不是通讯录，而是干系人管理对象
- 帮助 PM 识别影响力、诉求、关系状态与待管理事项

**MVP 建议字段：**
- `id`
- `project_id`
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
- `created_at`
- `updated_at`

### 9.4 `TimelineItem`

表示一个项目中的时间承诺、关键节点、交付节点或计划活动。

**作用：**
- 承载项目的计划与承诺
- 支持识别延期、变更、依赖和节奏风险

**MVP 建议字段：**
- `id`
- `project_id`
- `title`
- `type`（milestone / task / checkpoint / delivery）
- `status`
- `owner`
- `start_date`
- `end_date`
- `baseline_date`
- `actual_date`
- `dependency_note`
- `progress_note`
- `source_confidence`
- `created_at`
- `updated_at`

### 9.5 `RiskItem`

表示一个已经识别出的项目风险。

**作用：**
- 帮助 PM 及时看见风险，而不是事后复盘
- 强调影响、触发条件、应对动作和责任归属

**MVP 建议字段：**
- `id`
- `project_id`
- `title`
- `description`
- `category`
- `probability`
- `impact`
- `priority`
- `status`
- `trigger_condition`
- `mitigation_plan`
- `contingency_plan`
- `owner`
- `next_action`
- `due_date`
- `created_at`
- `updated_at`

### 9.6 `WorkPackage`

表示一个可被管理、推进、交付和跟踪的工作单元。

**作用：**
- 把复杂项目拆成可推进的责任单元
- 让 PM 能看到 owner、状态、阻塞与下一步动作

**MVP 建议字段：**
- `id`
- `project_id`
- `title`
- `description`
- `status`
- `priority`
- `owner`
- `start_date`
- `target_end_date`
- `completion_percent`
- `blocker_note`
- `dependency_note`
- `next_action`
- `deliverable_note`
- `created_at`
- `updated_at`

### 9.7 `Evidence`

表示能支撑项目判断的原始材料或摘录。

**作用：**
- 作为结构化事实的来源层
- 支持查询时返回“答案 + 来源”
- 为后续候选事实抽取和建议更新提供依据

**MVP 建议字段：**
- `id`
- `project_id`
- `title`
- `type`（meeting_note / email / im_snippet / document_excerpt / file / manual_note）
- `source_label`
- `source_uri`
- `captured_at`
- `author`
- `content`
- `summary`
- `content_hash`
- `ingest_status`
- `created_at`
- `updated_at`

### 9.8 后续扩展对象

以下对象不要求在 MVP 一次性落地，但应作为后续演进方向保留：

- `FactAssertion`：从证据中提炼出的候选事实
- `ChangeProposal`：基于证据提出的结构化更新建议
- `ConflictSet`：同一问题上互相冲突的证据或事实集合
- `SourceLink`：结构化事实与证据之间的引用关系
- `IngestLog`：导入、解析、去重、失败重试等审计记录

---

## 10. 各模块 MVP 定义

本节定义的不是最终形态，而是每个模块在 P0/P1/P2 的最小落地方式。

### 10.1 Canvas 模块

**P0：**
- 支持查看与编辑项目背景、目标、范围、关键里程碑摘要、关键风险摘要、关键依赖/约束、当前总体判断
- 支持快速编辑和保存
- 支持按项目唯一归属

**P1：**
- 支持与 Timeline / Risk / Stakeholder 的摘要联动
- 支持展示最近更新来源
- 支持历史修改记录查看

**P2：**
- 支持根据 Evidence 自动生成候选摘要
- 支持提示“当前画布信息可能已过时”

### 10.2 Stakeholders 模块

**P0：**
- 支持干系人列表、创建、编辑、删除
- 支持展示 role、influence、support、expectation、concern、relationship status
- 支持记录 last contact、next action
- 支持快速筛选关键干系人

**P1：**
- 支持按影响力 / 支持度 / 关系状态分组查看
- 支持与风险、工作包、证据建立关联
- 支持展示最近沟通摘要

**P2：**
- 支持从 Evidence 中抽取干系人相关诉求与风险信号
- 支持生成待跟进建议

### 10.3 Timeline 模块

**P0：**
- 支持时间项列表 / 看板 / 甘特视图中的至少一种主视图
- 支持创建、编辑、删除时间项
- 支持 start/end/baseline/actual 等关键日期字段
- 支持状态、owner、依赖说明维护

**P1：**
- 支持里程碑视图
- 支持计划与实际偏差对比
- 支持关键时间承诺来源挂接

**P2：**
- 支持从 Evidence 识别日期变更候选
- 支持自动提示潜在延迟或冲突承诺

### 10.4 Risks 模块

**P0：**
- 支持风险列表、创建、编辑、删除
- 支持 probability / impact / priority / owner / next action / due date
- 支持按状态和优先级查看

**P1：**
- 支持风险与 Timeline / Stakeholder / WorkPackage 的关联
- 支持显示触发条件、缓解方案、应急方案
- 支持关键风险摘要回写到 Canvas

**P2：**
- 支持从 Evidence 识别风险信号
- 支持生成待确认的新风险或风险升级建议

### 10.5 Work Packages 模块

**P0：**
- 支持工作包列表、创建、编辑、删除
- 支持 owner、status、priority、target end、blocker、next action
- 支持快速查看当前阻塞项

**P1：**
- 支持与 Timeline、Risk、Evidence 关联
- 支持按 owner / status / blocked 状态过滤
- 支持交付物说明与完成度展示

**P2：**
- 支持从 Evidence 中识别新的 action item / blocker / owner 变更
- 支持给出推进建议

### 10.6 Evidence 模块

**P0：**
- 支持手动录入证据
- 支持粘贴会议纪要、邮件、IM 片段、文档摘录
- 支持按项目归档和查看
- 支持基本元数据：type、source、captured_at、author、summary
- 支持内容哈希去重的预留设计

**P1：**
- 支持文件导入与批量导入
- 支持来源链接和导入日志
- 支持结构化对象手动挂接来源

**P2：**
- 支持证据切块、候选事实抽取、来源回溯视图
- 支持基于证据生成 Change Proposal

---

## 11. Evidence 与 Traceability 闭环

后续设计和实现应围绕以下闭环展开：

1. `Capture`：采集或导入证据
2. `Store`：按项目归档并保留元数据
3. `Link`：把证据与结构化对象建立关联
4. `Compare`：用新证据比对已有事实
5. `Propose`：生成候选事实或更新建议
6. `Confirm`：由 PM 决定是否写入核心对象
7. `Trace`：保留答案、更新与来源之间的引用关系

**设计要求：**
- 任何重要结论都应尽量能回溯到具体 Evidence
- 证据不足时允许返回“不确定”
- agent 只能提出建议，不能绕过 PM 直接确认核心事实

---

## 12. 实施判断

当前仓库已有可复用底座，但已有实现与目标之间存在偏差。

因此后续策略不是推倒重来，而是：

- 复用底层桌面与数据能力
- 调整主信息架构
- 重构领域模型
- 下调旧模块权重
- 围绕 PM Workspace 重建上层产品定义

---

## 13. 文档说明

若历史文档与本 PRD 冲突，以本文件和根目录 `CLAUDE.md` 为准。
