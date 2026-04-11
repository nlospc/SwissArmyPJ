# MEMORY.md

最后更新：2026-04-11

这个文件记录当前已经确认的产品事实，避免未来 session 被旧文档带偏。

## 已确认事实

### 用户与产品定位

- 产品**永远只服务一个角色**：项目经理
- 产品形态是**桌面工具 / 桌面工作台**
- 第一阶段不是外部系统上的一层壳，而是**可独立使用的 PM Workspace**

### 当前核心对象

以下对象是当前产品最核心的结构化对象，必须优先成为一等公民：

1. 项目画布
2. 干系人
3. 时间规划表
4. 风险登记册
5. 工作包
6. 资料/证据

### 当前产品策略

- 先做好**快速录入、快速更新、快速查看**
- 先支持项目经理手工维护核心项目对象
- 证据模块先作为支持层存在，并逐步成为正式一等模块
- AI / Agent 后续接入时，应先做：
  - 证据抽取
  - 候选事实生成
  - 建议更新
  - 来源回溯
- 不应该一开始就让 agent 自动改写关键项目事实

### 当前管理 mindset 基线

- 管理框架以 **PMBOK 第八版** 为基础
- 当前优先落地的心法是：
  - 干系人管理要有责任感
  - 对事管理要积极主动
  - 聚焦真正影响项目价值的事实
  - 持续整合项目真相，而不是一次性记录

### 当前外部借鉴基线

- 可借鉴 `gbrain` 的核心点：
  - 证据先沉淀，再用于查询和建议更新
  - 关键回答尽量返回“答案 + 来源”
  - 证据导入具备去重、幂等、审计能力
  - 后台持续整理证据并生成候选事实
- 不照搬其“泛个人知识大脑”定位
- 不让 agent 无声改写核心项目事实
- 详细 guideline 见 `docs/PMBOK-GBRAIN-GUIDELINE.md`

### 当前核心能力目标

系统未来需要能够：

- 从零散内容中沉淀项目事实
- 回答关键问题并给出来源
- 基于证据更新已有结构化信息
- 逐步形成项目经理可信赖的“项目事实底账”

## 明确废弃的旧假设

以下方向不再作为当前产品主线：

- 以 Portfolio / PMO 视角为中心的产品定义
- 以 My Work / Todo / Pomodoro 为中心的产品定义
- 面向多角色协作的大而全平台
- 从 0 自研一个通用 agent runtime 作为核心目标

## 当前代码现状与目标的偏差

仓库当前仍明显偏向旧方向：

- 主导航仍以 Dashboard / Portfolio / Inbox / My Work 为主
- 数据模型仍以 portfolios / projects / work_items / todos 为主
- 干系人、风险登记册、项目画布、证据、工作包尚未成为一等模型
- 已经出现了 project canvas 相关引用，但配套 shared/service 文件缺失，说明方向切换未完成

## 文档优先级

当不同文档相互冲突时，按以下顺序采信：

1. `CLAUDE.md`
2. `docs/MEMORY.md`
3. `docs/PRD/PRD-001-Master.md`
4. `docs/overview.md`
5. 其他历史文档

## 后续文档维护规则

- 只要产品方向继续收敛或变化，优先更新以上四个文件
- 发现旧文档明显误导时，要么改掉，要么明确标注“已过时”
- 不允许把旧 roadmap 继续当作当前 roadmap 使用

---

## 2026-04-11 Review 偏差记录

以下为本次 review 中发现的具体偏差，供后续 session 参考避免被误导。

### 1. PRD-001-overview.md 与 Master PRD 严重不一致

- **文件**：`docs/PRD/PRD-001-overview.md`
- **问题**：该文件仍将产品描述为"lightweight desktop project management tool designed for **developers and small teams**"，目标用户列出了开发者、自由职业者、小团队等，与 `PRD-001-Master.md` 中"只服务项目经理"的定位严重冲突。
- **影响**：如果后续 session 读取此文件为首要参考，会把产品方向带偏到开发者工具方向。
- **处理**：应以 `PRD-001-Master.md` 为准。此文件应标记为"已过时"或删除。

### 2. 多个 architecture 文档内容过时

- **文件**：`docs/architecture/ARCHITECTURE.md`（575 字节，几乎为空壳）、`docs/architecture/component-map.md`（197 字节）、`docs/architecture/data-model.md`（404 字节）
- **问题**：这三个文件体积极小，内容为占位级别，不反映实际架构。
- **影响**：可能误导为"架构文档已完备"的假象。
- **处理**：需重新编写或标记为"待重写"。`ipc-handlers-reference.md` 和 `my-work-blueprint.md`（67KB）有实质内容但方向已偏。

### 3. getting-started.md 目录结构不准确（已修正）

- **文件**：`docs/getting-started.md`
- **问题**：
  - 目录树列出了 `templates/` 目录，实际不存在
  - 缺少 `src/main/database/`、`src/main/ipc/`、`src/renderer/features/`、`src/renderer/stores/` 等实际存在的关键目录
  - 技术栈说明中提及 Radix UI、Vue Plugin，与实际使用的 Ant Design + React 不符
  - 引用了不存在的 `migration-guide.md` 文档
  - VS Code 插件推荐含 Vue 相关插件
- **处理**：已在本次更新中修正。

### 4. 旧文档散落在根目录

- **文件**：根目录下的 `GANTT_CRUD_IMPROVEMENTS.md`、`GANTT_INTERACTION_IMPROVEMENTS.md`、`IMPLEMENTATION-COMPLETE.md`、`MIGRATION-004-GUIDE.md`、`MY-WORK-IMPLEMENTATION-STATUS.md`、`DARK_MODE_FIX_GUIDE.md`、`THEME_GUIDE.md`
- **问题**：这些是实现过程中产生的临时文档，散落在项目根目录。部分与旧方向（My Work、Gantt 独立功能）相关。
- **影响**：增加根目录噪音，可能误导后续开发者。
- **建议**：移入 `docs/history/` 或在文件开头标注"已归档"。

### 5. PRD-002~012 被新方向取代但未标记

- **文件**：`docs/PRD/PRD-002-DataModel.md`、`PRD-003-Inbox.md`、`PRD-005-Timeline.md`、`PRD-006-Dashboard.md`、`PRD-007-Reporting.md`、`PRD-008-Governance.md`、`PRD-009-AIProvider.md`、`PRD-009-WorkflowEngine.md`、`PRD-010-Personas.md`、`PRD-011-MyWork.md`、`PRD-011-DECISIONS.md`、`PRD-012-DocOpsIntegration.md`
- **问题**：这些 PRD 文档对应的是旧产品方向（Portfolio 视角、多角色协作、通用 agent runtime 等），与新方向（PM Workspace、只服务项目经理）不一致。特别是：
  - `PRD-010-Personas.md` 包含多角色 Persona
  - `PRD-011-MyWork.md` 是 My Work / Todo / Pomodoro 方向的详细 PRD
  - `PRD-008-Governance.md` 是 PMO 治理方向
  - `PRD-009-AIProvider.md` / `PRD-009-WorkflowEngine.md` 是通用 agent runtime 方向
- **影响**：后续 session 如果读取这些文件作为需求来源，会把产品带偏。
- **建议**：在文件开头统一添加"⚠️ 此文档对应旧产品方向，已被 PRD-001-Master.md v2.0 取代"的标注，或移入 `docs/history/`。

### 6. 代码现状与方向的差距

当前仓库组件与 PM Workspace 目标的差距总结：

- 甘特图组件群（13 个文件）相对完善，可复用于时间规划表
- My Work 模块（19 个组件文件）全部属于旧方向，占代码量较大
- 项目画布、干系人、风险登记册、工作包、证据管理等核心模块的 UI 组件**完全缺失**
- 状态管理层缺少对应新方向的 store（如 StakeholderStore、RiskStore、WorkPackageStore、EvidenceStore）
- 主导航（Sidebar）仍为旧结构（Dashboard / Portfolio / Inbox / My Work）
