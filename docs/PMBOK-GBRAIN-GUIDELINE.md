# PMBOK Mindset + GBrain 借鉴基线

最后更新：2026-04-11
状态：Active Baseline

## 1. 目的

这个文档定义 SwissArmyPM 后续产品设计与实现的共同 guideline。

它不是新增一个独立产品方向，而是在当前 **PM Workspace** 基线之上，明确：

- 我们采用什么项目管理 mindset
- 我们从 `gbrain` 里借鉴什么
- 什么应该接进来，什么不应该照搬

**使用规则：**

- 此文档不是功能清单，而是产品设计与评审时的判断框架
- 当多个方案都能实现需求时，应优先选择更符合本文原则的方案
- 未来若接入 agent，这些原则应作为领域约束来源，而不是人格设定来源

---

## 2. 管理 mindset 基线

SwissArmyPM 的管理框架以 **PMBOK 第八版** 为基础，但当前阶段只先落地与产品结构强相关、可操作的部分。

### 当前明确采用的原则

#### 2.1 干系人管理要有责任感

对人不是“登记一下联系人”就结束，而是要帮助项目经理持续判断：

- 谁真正影响项目结果
- 谁在关键节点需要被同步、被争取、被管理预期
- 谁拥有决策权、阻塞权、支持力或风险放大效应
- 当前关系状态是稳定、脆弱，还是需要主动修复

所以干系人模块不只是通讯录，而应逐步演化为：

- 角色与影响力视图
- 关注点 / 诉求 / 态度记录
- 沟通节奏与关键承诺记录
- 风险关联与行动建议

#### 2.2 对事的管理要积极主动

系统不能只是被动记录项目事实。

它要帮助项目经理形成一种操作面：

- 发现变更
- 暴露风险
- 提醒断点
- 推动更新
- 帮助形成下一步动作

也就是说，Timeline、Risk、Work Package 不只是静态台账，而是要支持：

- 快速识别偏差
- 明确 owner / due / status
- 对关键事项形成推进压力
- 让“知道问题”尽快转化为“推动动作”

#### 2.3 聚焦价值

我们现在先不把 PMBOK 中更抽象的价值判断全部产品化，
但系统必须始终围绕一个问题：

**当前维护的信息，是否能帮助项目经理更快地推动项目走向有价值的结果？**

这意味着：

- 不为了完整而完整
- 不为了建模而建模
- 优先记录真正影响交付、风险、协同、承诺的事实
- 页面设计要优先突出“重要性”和“决策相关性”

#### 2.4 持续整合

项目真相不会一次写完，而是散落在会议、聊天、邮件、文档、口头承诺中持续变化。

SwissArmyPM 必须围绕“持续整合”来设计：

- 结构化对象持续更新
- 证据持续沉淀
- 新证据持续对照旧事实
- 冲突持续暴露
- 建议更新持续积累

所以我们的产品不是一份静态文档，而是一个持续收敛项目真相的工作台。

---

## 3. 从 GBrain 借鉴什么

`gbrain` 真正值得借鉴的，不是“做一个更大的 agent 系统”，而是它对 **知识沉淀、证据组织、可追溯回答、持续记忆整理** 的处理方式。

### 3.1 借鉴点一：证据先入库，再参与回答

GBrain 的核心思路是：先把零散内容变成可检索知识，再让 agent 使用它。

这和 SwissArmyPM 很契合。

我们应直接吸收为：

- 会议纪要、邮件、IM 片段、文档摘录先进入 Evidence
- Evidence 是结构化项目对象的上游补充，不直接越权改写项目事实
- 后续问答、建议更新、冲突识别，都优先以 Evidence 为依据

### 3.2 借鉴点二：答案必须带来源

GBrain 强调 query 时给 citations，缺信息时宁可说不知道，也不要胡编。

这点对项目经理场景特别重要。

SwissArmyPM 应明确采用：

- 回答关键项目问题时，必须尽量返回“答案 + 来源”
- 没有足够证据时，允许回答“不确定 / 证据不足”
- 后续所有 AI 建议都应可回溯到具体证据

### 3.3 借鉴点三：导入要可重复、可去重、可审计

GBrain 在导入上强调 idempotent import、content hash、ingest log。

这非常值得直接接进来。

SwissArmyPM 的 Evidence 层后续建议具备：

- 内容哈希去重
- 重复导入幂等处理
- 导入来源记录
- 导入时间、项目归属、解析状态记录
- 审计日志

### 3.4 借鉴点四：结构化检索 + 语义检索混合

GBrain 强调 keyword + vector + structured 的组合查询。

这和项目管理场景天然适配。

未来 SwissArmyPM 的查询层可以逐步形成：

- 结构化查找：时间、风险等级、owner、状态、日期承诺
- 关键词查找：会议纪要、邮件、聊天片段
- 向量检索：相似问题、相近表述、隐含关联
- 最终合成：给 PM 一个可信的结果，而不是一堆搜索命中

### 3.5 借鉴点五：后台持续整理记忆

GBrain 的 dream cycle / cron consolidation 思路很有价值。

在 SwissArmyPM 里不一定照搬它的整套 agent 机制，但可以演化为：

- Evidence 后台整理
- 实体补全
- 关系补全
- 冲突候选识别
- 待确认更新建议生成

也就是：

**夜里整理，白天给 PM 一个更清晰的项目真相。**

---

## 4. 不照搬什么

### 4.1 不把产品中心变成“个人人生知识库”

GBrain 更像一个泛个人知识大脑。

SwissArmyPM 不是记录“你全部人生”的地方，
而是一个围绕 **项目事实** 的专业工作台。

所以我们只借鉴：

- 证据组织方式
- 可追溯查询
- 导入与去重机制
- 后台整理机制

不照搬：

- 个人全域生活流入
- 过宽的通用知识图谱叙事
- 以 agent 自主运行为中心的产品包装

### 4.2 不让 agent 直接统治核心事实

GBrain 的 agent-first 方式很强，但你现在的产品重点不是炫技，而是让 PM 能信任。

所以 SwissArmyPM 应坚持：

- 结构化事实由 PM 最终确认
- Agent 负责抽取、提示、建议、比对
- 不无声覆盖核心对象

### 4.3 不把 schema 设计成过度抽象的通用脑

我们不需要先发明一套泛世界知识 schema。

当前应只服务于项目管理核心对象：

- Project
- Canvas
- Stakeholder
- TimelineItem
- Risk
- WorkPackage
- Evidence
- 后续再扩展 FactAssertion / ChangeProposal / ConflictSet

---

## 5. 直接接入到 SwissArmyPM 的设计决定

下面这些不是“灵感”，而是建议直接进入后续设计与实现的 baseline。

### 5.1 Evidence 成为正式一等模块

不是附属页，不是附件仓库，而是核心模块之一。

工作台结构保持：

- Canvas
- Stakeholders
- Timeline
- Risks
- Work Packages
- Evidence

### 5.2 增加“证据 -> 候选事实 -> 确认更新”的闭环

后续核心流程建议统一为：

1. Capture：录入或导入证据
2. Parse：提取候选事实、承诺、风险、行动项
3. Compare：与已有结构化事实比对
4. Propose：生成待确认更新建议
5. Confirm：由 PM 确认是否写入核心对象
6. Trace：保留来源与审计记录

### 5.3 数据模型为后续留口子

即使 MVP 先不全部实现，也建议从现在起为以下对象预留方向：

- `Evidence`
- `EvidenceChunk`
- `FactAssertion`
- `ChangeProposal`
- `SourceLink`
- `IngestLog`

### 5.4 Query 体验以后必须是“答复 + 来源”

以后不管是搜索、问答还是状态判断，都要逐渐走向：

- 先给结论
- 再给依据
- 再给不确定性说明

这会成为产品可信度的核心差异点。

### 5.5 干系人页不能只做静态名单

因为你前面明确提了“责任感”，这页后续必须支持更强的管理视角，例如：

- influence / support / resistance
- owner relationship
- expectation / concern
- recent communication
- commitment / pending ask

### 5.6 风险与工作包要更强调主动推进

不是只记录，而是围绕：

- next action
- owner
- due date
- block / dependency
- escalation need

这样才符合你说的“对事积极主动”。

---

## 6. 当前建议的实现顺序

### 第一层：先把 guideline 固化

- 更新主 PRD 与 MEMORY
- 明确 PMBOK + Evidence-driven baseline

### 第二层：先做结构化对象 MVP

- Project Canvas
- Stakeholders
- Timeline
- Risks
- Work Packages
- Evidence（最简版）

### 第三层：再补 evidence intelligence

- 引用来源
- 候选事实
- 更新建议
- 冲突提示
- 查询回答

---

## 7. 一句话结论

**SwissArmyPM 不是 GBrain for everything。**

它应该是：

**一个以 PMBOK mindset 为骨架、以 Evidence 和可追溯问答为增强层的项目经理事实工作台。**
