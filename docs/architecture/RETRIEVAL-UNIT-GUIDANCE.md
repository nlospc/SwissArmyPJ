# SwissArmyPM Retrieval-Unit Architecture Guidance

最后更新：2026-04-21
状态：Active
用途：基于当前代码实况，给 architecture agent / implementation agent 提供 repo 级文件组织建议。

---

## 1. 这份文档解决什么问题

SwissArmyPM 正在从旧方向（Portfolio / Dashboard / My Work）迁移到 PM Workspace。

当前代码库里已经同时存在：
- 旧方向的大文件
- 新工作台的大文件
- 按 runtime 分层的结构
- 但尚未按 PM domain 完整重构的 IPC / store / shared 层

因此，这份文档不讨论“理想架构”，只回答：

1. 哪些文件现在可以继续保持较大，不要为了整洁乱拆
2. 哪些文件现在已经跨了真实边界，应该优先拆
3. 哪些大文件属于旧方向，应停止扩张并逐步隔离
4. 接下来做 PM Workspace 时，应该怎样让 agent 检索路径更短、更稳

---

## 2. 当前大文件实况（按代码行数）

基于 `packages/swissarmypm/src/` 的实际统计：

### main / ipc
- `main/ipc/handlers.ts` — 1201 行
- `main/ipc/myWorkHandlers.ts` — 813 行
- `main/ipc/dashboardHandlers.ts` — 338 行

### renderer / page / feature / store
- `renderer/pages/ProjectWorkbenchPage.tsx` — 532 行
- `renderer/pages/InboxPage.tsx` — 523 行
- `renderer/features/workbench/components/WorkbenchCanvasPanel.tsx` — 472 行
- `renderer/stores/useMyWorkStore.ts` — 915 行
- `renderer/stores/useWorkItemStore.ts` — 297 行
- `renderer/lib/ipc.ts` — 477 行

### 旧方向 UI
- `renderer/components/dashboard/DashboardProjectDetailView.tsx` — 1031 行
- `renderer/components/gantt/WorkItemExcelGantt.tsx` — 742 行
- `renderer/components/dashboard/ProjectTable.tsx` — 456 行

这些数字本身不是问题。
问题在于：它们是否仍然代表一个“清晰的检索单元”。

---

## 3. 应该继续允许较大的文件

下面这些文件即使偏大，当前也不应仅因行数而拆分。

### 3.1 `renderer/pages/ProjectWorkbenchPage.tsx`

当前判断：可以继续保持较大。

理由：
- 它是 Project Workspace 的页面壳层
- 当前承担的是单一问题：工作台编排
- 内容包括：
  - 项目装载
  - snapshot 派生
  - module 切换
  - inspector 打开方式
  - 页面级 copy
  - 页面级 orchestration
- 对 agent 来说，打开一个文件就能看到工作台壳层全貌

不要为了“减少行数”过早拆成：
- `buildSnapshot.ts`
- `workbenchModules.ts`
- `projectWorkbenchCopy.ts`
- `useProjectWorkbenchData.ts`
- `renderWorkbenchModule.tsx`

除非出现这些触发条件：
1. 工作台 shell 被多个页面复用
2. module registry 变成独立机制
3. snapshot 逻辑开始被多个模块共用
4. inspector 策略变成独立系统

### 3.2 `renderer/features/workbench/components/WorkbenchCanvasPanel.tsx`

当前判断：可以继续保持较大。

理由：
- 它当前仍然是一个完整问题：Canvas 面板展示与派生
- block 配置、摘要规则、布局规则、溢出策略都属于同一 PM Canvas 问题
- 对 agent 来说，把这些逻辑收敛在一个检索单元里，比拆成 6 个文件更稳定

不要过早拆成：
- `canvasBlockDefinitions.ts`
- `canvasSummaryRules.ts`
- `canvasToneRules.ts`
- `canvasGridConfig.ts`
- `canvasEmptyState.ts`

只有在这些条件出现时才考虑拆：
1. 进入可编辑状态，出现 view / edit 两套独立生命周期
2. block schema 被别处复用
3. Canvas 派生逻辑需要在 main/shared 复用
4. block renderer 形成稳定扩展接口

### 3.3 `renderer/stores/useWorkItemStore.ts`

当前判断：可以保持为单个 domain store。

理由：
- 目前它仍然是“work item 的 optimistic CRUD store”这个单一问题
- load / create / update / delete / rollback 放在一起，检索路径短
- 这类 store 最忌讳被拆成很多 action 文件，因为 agent 很容易丢掉状态转换全貌

只有在以下条件出现时再拆：
1. WorkItem 正式分裂成 TimelineItem / WorkPackage / Risk 等独立 domain store
2. 当前 store 同时承载多个彼此独立的业务语言
3. optimistic transaction 逻辑需要提取成统一机制

### 3.4 `renderer/lib/ipc.ts`

当前判断：暂时允许较大。

理由：
- 它天然是 renderer 到 main 的集中桥接层
- 只要它仍然是“IPC API surface”，就可以集中
- 对 agent 而言，集中桥接比碎片化桥接更容易定位

但要注意：
- 它不能开始承载 view model、业务派生、页面判断
- 一旦混入太多 domain 特化逻辑，就该回退到 domain 附近

---

## 4. 已经跨真实边界、应该优先拆分的文件

这些不是“因为太大”，而是因为它们已经同时混了多个 domain / direction / contract。

### 4.1 `main/ipc/handlers.ts`

当前判断：应该优先按 domain 拆分。

原因不是 1201 行，而是：
- 同时混了 workspace / portfolios / projects / workItems / inbox / todos / settings / dashboard / search
- 同时承载旧方向和新方向
- 已经出现 Project Canvas service 接入
- runtime 虽然同属 main/ipc，但 domain 边界已经明显存在

建议目标：
- `workspaceHandlers.ts`
- `projectHandlers.ts`
- `projectCanvasHandlers.ts`
- `workItemHandlers.ts`
- `inboxHandlers.ts`
- `settingsHandlers.ts`
- `searchHandlers.ts`

注意：
- 是按 domain 拆，不是按 `get/create/update/delete` 动词拆
- 每个 domain handler 文件可以仍然较大

### 4.2 `shared/types/index.ts`

当前判断：暂时可用，但进入 PM domain 扩展后应按 domain 聚合拆分。

原因：
- 现在仍偏旧 schema 中心
- 一旦正式加入 `ProjectCanvas` / `Stakeholder` / `Risk` / `Evidence` / 新 IPC DTO，会快速变成混合类型仓库

建议不是一 type 一文件，而是按 domain 聚合：
- `shared/types/project.ts`
- `shared/types/work-item.ts`
- `shared/types/project-canvas.ts`
- `shared/types/risk.ts`
- `shared/types/stakeholder.ts`
- `shared/types/common.ts`
- `shared/types/index.ts` 只做 barrel export

### 4.3 旧方向聚合文件

以下文件不一定要马上拆，但必须停止继续扩张：
- `renderer/stores/useMyWorkStore.ts`
- `main/ipc/myWorkHandlers.ts`
- `renderer/components/dashboard/DashboardProjectDetailView.tsx`

原因：
- 它们属于旧产品中心
- 再继续在这些文件上叠新逻辑，会污染 PM Workspace 的未来结构

策略：
- 不积极重构它们
- 不继续往里塞新 PM Workspace 逻辑
- 需要保留则视为 legacy island
- 新功能不再依赖它们做中心扩展

---

## 5. 应隔离但不急着大拆的区域

### 5.1 `renderer/components/dashboard/*`

建议：
- 视为旧方向组件区
- 可复用的组件单独提炼
- 不把新工作台主逻辑继续压进 dashboard 目录

### 5.2 `renderer/components/gantt/*`

建议：
- 当前仍可作为 Timeline 的能力底座
- 不要为了“统一风格”立刻全拆
- 应先明确哪些是 Timeline domain 真实会继续使用的组件
- 再决定是保留原目录、迁移、还是包一层 feature adapter

### 5.3 `renderer/pages/archive/*`

建议：
- 已经 archive 的页面继续 archive
- 不要从 archive 页面里回拷新实现
- 只把确实可复用的局部能力提炼出来

---

## 6. 未来 PM Workspace 的推荐检索路径

Architecture Agent 在设计新模块时，应尽量让 agent 修改路径接近下面这种结构：

### Project Canvas
- page shell：`renderer/pages/ProjectWorkbenchPage.tsx`
- feature panel：`renderer/features/workbench/components/WorkbenchCanvasPanel.tsx`
- store / load logic：相关 domain store
- IPC：`main/ipc/projectCanvasHandlers.ts`
- shared type：`shared/types/project-canvas.ts`

### Risks
- page shell：`ProjectWorkbenchPage.tsx`
- feature panel：`WorkbenchRiskPanel.tsx`
- domain store：`useRiskStore.ts`（未来）
- IPC：`riskHandlers.ts`
- shared type：`risk.ts`

### Timeline
- page shell：`ProjectWorkbenchPage.tsx`
- feature panel：`WorkbenchTimelinePanel.tsx`
- timeline capability：`components/gantt/*` 或 feature adapter
- IPC：timeline/work item domain handlers

目标是：
一个功能问题最好在 3~5 个文件内被完整解释，而不是分散在 10+ 个碎文件。

---

## 7. Architecture Agent 对当前仓库的明确判断

### 现在不该做的

1. 不要为了追求“现代分层”把新 workbench 文件打散
2. 不要给每个 block / selector / mapper 建独立小文件
3. 不要把 PM Workspace 逻辑继续塞进 dashboard / my-work / portfolio 旧文件
4. 不要把 `main/ipc/handlers.ts` 继续当全项目垃圾桶

### 现在应该做的

1. 新 PM Workspace 功能继续按 domain 写在 `features/workbench` 附近
2. page / feature / store / IPC / shared type 保持 runtime 和 domain 清晰
3. 优先拆 `main/ipc/handlers.ts`，因为它已经跨了真实 domain 边界
4. 旧方向大文件停止扩张，逐步隔离
5. 新 shared type 按 domain 聚合，而不是继续无限堆进 `shared/types/index.ts`

---

## 8. 一句话执行规则

当前 SwissArmyPM 的结构策略是：

- 新 PM Workspace：允许大文件，但要求高内聚、高检索质量
- 旧方向遗留：不再扩张，逐步隔离
- 真正优先拆分的对象：跨 domain 的聚合入口文件，而不是单一功能的大文件
