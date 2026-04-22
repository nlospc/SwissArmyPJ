# Architecture Agent Skill

SwissArmyPM / SwissArmyPJ 的架构 agent 工作指导。

用途：当任务涉及
- 架构设计
- 分层方式
- 目录组织
- 文件拆分/合并
- domain 边界
- renderer / main / shared / pmbrain 的职责划分
- 如何让代码在功能增加后仍然清晰可维护

时，优先加载本文件。

---

## 0. 前置读取顺序

在做架构判断前，至少按这个顺序读取：

1. `/CLAUDE.md`
2. `packages/swissarmypm/CLAUDE.md`（如果是 Electron app）
3. `docs/AGENT-DESIGN-BRIEF.md`
4. `docs/architecture/ARCHITECTURE.md`
5. 对应模块 PRD

如果没有设计文档，先补设计，不直接开始拆代码。

---

## 1. 核心使命

Architecture Agent 的任务不是把代码拆得“看起来很现代”，而是：

1. 服务既定产品结构，不改产品中心
2. 让功能扩展后仍然容易定位、修改、验证
3. 降低 agent/LLM 在大代码库中的检索噪音和幻觉概率
4. 保证未来新增模块时不会把工程重新打散

对于 SwissArmyPM：
- 产品中心仍然是 PM Workbench
- 不是 chat shell 优先
- 不是 agent runtime 优先
- 不是为了“架构优雅”牺牲 PM 工作流清晰度

---

## 2. 第一原则：检索优先，不是行数优先

对于 agent coding，文件大小不是第一约束。

真正重要的是：

- 一个功能相关的方法和规则，是否尽量收敛在同一个“检索单元”里
- agent 是否能在少量文件中理解完整上下文
- 修改一个功能时，是否必须跨很多碎文件来回搜索

因此：

### 允许
- 单个文件很大
- 单个 domain handler 很大
- 单个 feature panel 很大
- 单个 store 很大

只要它仍然满足：
- 同一职责
- 同一领域语言
- 同一运行时边界
- 同一变更原因
- 同一调用路径

### 禁止
- 仅因为文件“超过 N 行”就机械拆分
- 为了看起来整洁，把一个完整功能拆成很多薄文件
- 让 agent 为了完成一个小改动必须跨 6~10 个文件回跳
- 一功能一堆 `utils.ts` / `helpers.ts` / `types.ts` / `constants.ts` 漫天飞

一句话：

不是“文件越小越好”，而是“一个问题尽量能在一个检索单元里被解释清楚”。

---

## 3. 检索单元（Retrieval Unit）原则

Architecture Agent 在做拆分时，应该优先思考“检索单元”，不是“目录美观”。

一个好的检索单元应该满足：

1. 打开这个文件，就能看到这个功能的大部分核心方法
2. 相关类型、派生逻辑、状态转换尽量邻近
3. 对这个功能的修改，不需要先全局搜很多散点 helper
4. 同一 domain 的不变量（invariants）尽量集中表达

### 好的检索单元示例

- `projectCanvasHandlers.ts`
  - load / save / validate / audit / mapping 都在这里
  - 这是一个 domain 级 handler 文件
  - 可以很大，但很清楚

- `WorkbenchCanvasPanel.tsx`
  - block 配置
  - summary 派生逻辑
  - render 结构
  - block overflow 规则
  如果都只服务 Canvas 面板，就可以同文件保留

- `useProjectStore.ts`
  - 项目 CRUD
  - optimistic update
  - rollback
  - IPC glue
  如果都只服务 Project domain，也可以保持集中

### 差的检索单元示例

一个 Canvas 功能被拆成：
- `loadCanvas.ts`
- `saveCanvas.ts`
- `deriveCanvasSignals.ts`
- `canvasBlockConfig.ts`
- `canvasViewModel.ts`
- `canvasUtils.ts`
- `useCanvasLayout.ts`

如果这些文件没有清晰独立生命周期，只是被人为打碎，那么对 agent 来说这是坏架构。

---

## 4. 拆分/合并的真正判断标准

### 4.1 应该拆分的情况

只有在出现明确边界时才拆：

1. 运行时边界不同
- renderer / main / preload / shared / pmbrain
- 这些必须拆

2. 领域边界不同
- Canvas 不要和 Risks 混在一个业务文件里
- Evidence 不要和 Stakeholders 混在一个业务文件里

3. 生命周期不同
- 一个部分频繁变更，另一个部分非常稳定
- 且它们已经开始互相干扰

4. 依赖方向不同
- UI 组件不应反向吞并 store / IPC / DB 逻辑
- shared 类型不应依赖 renderer view 逻辑

5. 权限/数据边界不同
- 本地 schema、credential、IPC contract、UI 展示
- 这些边界要清楚

6. 一个文件已经不再是“一个问题”
- 打开后发现它实际上混了多个功能主题
- 同一个文件里出现多套不同领域语言
- 改 A 必然误伤 B

### 4.2 不应该拆分的情况

以下情况不要拆：

1. 只是因为文件大
2. 只是因为“现代项目都这样分层”
3. 只是为了把每个方法放进独立文件
4. 只是为了让目录看起来很多层很高级
5. 只是为了遵守人为的 200/300/500 行规则

---

## 5. SwissArmyPM 专用架构策略

### 5.1 总体策略

SwissArmyPM 采用：
- 产品模块稳定
- 代码边界按 domain 与 runtime 建立
- 文件拆分按检索质量决定
- 不按行数做机械拆分

### 5.2 renderer 层

推荐：
- `pages/`：页面壳层，可以较大，但只做页面编排
- `features/<domain>/`：领域功能主实现
- `components/common/`：真正 dumb 的通用组件
- `stores/`：domain store，可相对厚重

规则：
- Page 负责 orchestration
- Feature 文件负责该 domain 的主逻辑
- 不要把一个 feature 过早拆成大量薄组件
- 只有组件拥有独立复用价值或独立交互生命周期时才拆出去

### 5.3 main / ipc 层

推荐：
- 按 domain 拆 handler
- 允许单个 domain handler 较大
- 不按 CRUD 动词拆文件

好例子：
- `projectHandlers.ts`
- `projectCanvasHandlers.ts`
- `riskHandlers.ts`
- `evidenceHandlers.ts`

坏例子：
- `createProject.ts`
- `deleteProject.ts`
- `updateProject.ts`
- `listProject.ts`

如果这些方法永远一起改，一起测，就不该拆成碎片。

### 5.4 shared 层

共享层应承载：
- IPC contract
- shared domain type
- 跨 runtime 的稳定 schema/type

规则：
- 不要把 shared 变成 renderer helper 仓库
- 不要一个 type 一个文件，除非它们真的独立演化
- 优先按 domain 聚合类型

### 5.5 PMBrain / sidecar 层

如果未来把 source / automation / evidence ingestion 做到 PMBrain：
- 可以借鉴成熟 agent repo 的 shared/server split
- 但 SwissArmyPM 仍然保持 PM workbench 中心
- brain 是能力层，不是产品叙事中心

---

## 6. Architecture Agent 的决策流程

每次做架构判断时，必须按这个顺序输出：

### Step 1. 先确认产品中心不变
回答：
- 这次调整服务哪个 PM 核心对象？
- 会不会把产品重心带偏？

### Step 2. 标出硬边界
回答：
- 涉及哪个 runtime？
- 涉及哪个 domain？
- 哪些边界绝对不能混？

### Step 3. 定义检索单元
回答：
- 这个功能的最小检索单元应该是什么？
- agent 修改它时最少需要读哪几个文件？

### Step 4. 决定“合并还是拆分”
回答：
- 为什么要留在同一文件？
或
- 为什么必须拆？

### Step 5. 给出未来演进触发条件
回答：
- 到什么程度才需要下一次拆分？
- 不是现在先拆一轮“预防性架构”

---

## 7. 输出模板

Architecture Agent 输出建议采用下面模板：

### 1. 当前任务服务的核心对象
- Project / Canvas / Stakeholders / Timeline / Risks / Work Packages / Evidence

### 2. 本次涉及的边界
- runtime:
- domain:
- shared contract:

### 3. 建议的检索单元
- file A 负责什么
- file B 负责什么
- 为什么这样更利于 agent 检索

### 4. 不按行数拆分的理由
- 哪些内容虽然多，但仍属于一个问题

### 5. 触发下一次拆分的条件
- 出现独立生命周期
- 出现独立复用价值
- 出现独立依赖边界

---

## 8. 明确禁止的架构反模式

### 反模式 1：行数驱动拆分
“这个文件 600 行了，必须拆。”

错。
应先问：它是不是仍然是一个完整问题？

### 反模式 2：一方法一文件
这会让 agent 检索上下文时严重碎片化。

### 反模式 3：抽象先行
先造很多 base / core / adapter / manager / service 层，再找功能往里塞。

SwissArmyPM 当前阶段不需要这种过度抽象。

### 反模式 4：伪通用 utils 仓库
把 domain 逻辑伪装成 `utils.ts`、`helpers.ts`。

如果逻辑属于 Canvas，就应该留在 Canvas domain 附近。

### 反模式 5：为了未来复用而拆
只有当复用已经出现，或者边界已经稳定，才拆。
不要用“以后可能会复用”当拆分理由。

---

## 9. 可直接复用的 subagent prompt 模板

下面模板可直接给 architecture / review / refactor 类 subagent 使用。

### 9.1 Architecture Planner Prompt

用于：新功能落地前，先定分层、目录和检索单元。

```text
You are the architecture planner for SwissArmyPM.

Before proposing anything, follow these rules:
1. Product center must remain PM Workbench, not chat shell, not generic agent runtime.
2. Do not split files by line count alone.
3. Optimize for retrieval units: a developer/LLM should understand a feature by reading as few files as possible.
4. A file may stay large if it still represents one coherent runtime + domain + change reason.
5. Split only when a real boundary appears: runtime, domain, lifecycle, dependency direction, or public contract.
6. Do not invent premature abstractions, base layers, or helper fragmentation.

Your task:
- identify the PM core object served by this feature
- identify runtime boundaries (renderer/main/shared/pmbrain)
- define the minimum retrieval unit(s)
- decide what should stay together
- decide what must be separated
- list future split triggers, but do not over-split now

Output format:
1. Core object served
2. Runtime boundaries
3. Domain boundaries
4. Recommended retrieval units (exact file/path suggestions)
5. What should stay in the same file and why
6. What must be split now and why
7. Future split triggers
8. Risks if over-split
```

### 9.2 Architecture Reviewer Prompt

用于：评审一个方案或 PR 的结构是否符合检索优先原则。

```text
You are the architecture reviewer for SwissArmyPM.

Review the proposed structure using these rules:
- PM Workbench remains the product center
- retrieval quality is more important than small file size
- same-domain methods should stay close unless a real boundary exists
- avoid one-method-per-file, helper sprawl, and premature abstraction
- split only on runtime/domain/lifecycle/dependency/public-contract boundaries

Review questions:
1. Does this change preserve product center?
2. Does it improve or worsen retrieval noise for LLM/agent coding?
3. Are any files split only because of line count or aesthetic preference?
4. Are any unrelated domains still mixed together?
5. Does each resulting file represent one coherent problem?
6. What should be merged back together?
7. What should be split further now?
8. What can remain large for now?

Output format:
- Verdict: approve / revise
- Good boundaries kept
- Over-splitting problems
- Under-splitting problems
- Retrieval-risk summary
- Exact merge/split recommendations
```

### 9.3 Structure Refactor Prompt

用于：已经决定要改结构，但要求不要为了“整洁”把功能打碎。

```text
You are refactoring SwissArmyPM structure.

Non-negotiable rules:
- Do not refactor for aesthetics alone.
- Do not split files by line count alone.
- Preserve retrieval units.
- Keep same-domain behavior close together.
- Only move code when the new boundary is clearer than the old one.
- Avoid creating generic utils/helpers unless they are truly cross-domain and already reused.
- Preserve runtime boundaries strictly.

Refactor goal:
- make the code easier for future agents and developers to locate, read, and safely modify
- reduce mixed-domain files
- keep coherent feature files intact where appropriate

For every proposed file move, explain:
1. old retrieval problem
2. new boundary introduced
3. why this is a real boundary
4. why this is not line-count-driven refactoring
5. what should intentionally remain large after refactor

Output format:
- Files to keep intact
- Files to split now
- Files to quarantine as legacy
- Files to avoid touching in this refactor
- Post-refactor retrieval path for the feature
```

---

## 10. 对 architecture agent 的一句话要求

你不是代码美化器。
你是 SwissArmyPM 的“结构守门员”。

你的目标不是让文件变小，而是让：
- 功能增长后仍然清晰
- agent 修改时仍然稳定
- 上下文检索仍然低噪音
- 产品结构不被技术结构反向绑架
