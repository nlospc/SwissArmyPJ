# IPC Handlers Domain Split Plan

最后更新：2026-04-21
状态：Design Only
范围：`packages/swissarmypm/src/main/ipc/handlers.ts`
目标：按 domain 拆分 IPC handler 入口与实现，降低混合领域带来的检索噪音；本方案只定义结构，不直接修改代码。

---

## 1. 这份方案服务什么核心对象

这次拆分服务的核心对象不是某一个页面，而是整个 PM Workspace 的后端 domain 入口稳定性。

它直接服务未来这些 PM 核心对象：
- Project
- ProjectCanvas
- Timeline / WorkItem
- Evidence（未来）
- Stakeholder（未来）
- Risk（未来）

同时它要明确把旧方向对象隔离出去：
- Portfolio
- Dashboard
- Todo
- My Work

---

## 2. 为什么现在应该拆 `handlers.ts`

不是因为它 1200 行。

而是因为它已经同时混了：
- workspace
- portfolios
- projects
- workItems
- inbox
- todos
- settings
- dashboard
- search
- project canvas 接入
- 审计日志 helper
- 旧方向与新方向并存

这已经跨了真实的 domain 边界。

对 agent/LLM 来说，现在的问题是：
- 读 Project 相关 handler 时会不断撞见 Portfolio / Inbox / Todo / Search
- 未来再加 Risk / Stakeholder / Evidence，只会继续恶化
- 修改新 PM Workspace 逻辑时，必须进入一个混合旧方向和新方向的大入口文件

所以该拆的不是 CRUD 方法，而是 domain 聚合边界。

---

## 3. 拆分原则

### 3.1 坚持 retrieval-unit-first

拆分后每个文件都应该是一个清晰检索单元。

要求：
- 打开一个 domain 文件，就能看到该 domain 的主要 IPC surface
- 同一 domain 的注册和 handler 实现尽量邻近
- 不按 create / update / delete 动词拆碎
- 不为了“整洁”制造大量薄文件

### 3.2 运行时边界不变

仍然保持：
- Electron main process
- `ipcMain.handle()` 注册方式
- request-response 格式

这次不改 runtime，不改桥接协议。

### 3.3 旧方向隔离，不强行立刻删除

Portfolio / Dashboard / Todo / My Work 仍可能保留一段时间。

策略：
- 先隔离为独立 domain/legacy 文件
- 不再让它们和 PM Workspace 新 domain 混住
- 后续再决定是否降级、冻结、或移除

---

## 4. 推荐目标结构

推荐将 `src/main/ipc/` 组织为：

```text
src/main/ipc/
├── index.ts                         # 统一注册入口（替代当前 handlers.ts 的角色）
├── shared/
│   └── auditLog.ts                  # writeAuditLog 等共享 helper
├── workspaceHandlers.ts
├── projectHandlers.ts
├── projectCanvasHandlers.ts
├── workItemHandlers.ts
├── inboxHandlers.ts
├── settingsHandlers.ts
├── searchHandlers.ts
├── legacy/
│   ├── portfolioHandlers.ts
│   ├── dashboardHandlers.ts
│   ├── todoHandlers.ts
│   └── myWorkHandlers.ts
```

说明：
- `index.ts` 只负责 orchestration：调用各 domain 的 register 函数
- 每个 `*Handlers.ts` 是一个 domain 级检索单元
- `legacy/` 明确表达旧方向，不再与新 PM Workspace 中心混排
- 不是一方法一文件，而是一 domain 一文件

---

## 5. 推荐注册模式

### 5.1 统一入口：`index.ts`

职责：
- 导入各 domain 的 `registerXHandlers()`
- 统一在 `registerIPCHandlers()` 中调用
- 不再承载具体 SQL / 业务实现

建议形态：

```ts
export function registerIPCHandlers(): void {
  registerWorkspaceHandlers();
  registerProjectHandlers();
  registerProjectCanvasHandlers();
  registerWorkItemHandlers();
  registerInboxHandlers();
  registerSettingsHandlers();
  registerSearchHandlers();

  // legacy
  registerPortfolioHandlers();
  registerDashboardHandlers();
  registerTodoHandlers();
  registerMyWorkHandlers();
}
```

### 5.2 每个 domain 文件内部

每个 domain 文件内部建议采用：
- 顶部 imports
- `registerXHandlers()`
- 紧接着该 domain 下的所有 `handleXxx()`
- 同文件保留本 domain 的 SQL 与 mapping

这样做的好处：
- 打开文件即可理解该 domain 全貌
- 注册面与实现面不分离太远
- 检索路径短

---

## 6. 具体 domain 拆分建议

### 6.1 `workspaceHandlers.ts`

保留内容：
- `workspace:get`
- `workspace:update`
- `handleGetWorkspace`
- `handleUpdateWorkspace`

理由：
- 单一 domain
- 无需再混入其他业务

### 6.2 `projectHandlers.ts`

保留内容：
- `projects:getAll`
- `projects:getById`
- `projects:getByPortfolio`
- `projects:create`
- `projects:update`
- `projects:delete`

注意：
- `Project` 相关 tags_json parse 逻辑留在这个文件里
- 不要提前抽成通用 `projectMapper.ts`，除非别处真实复用

### 6.3 `projectCanvasHandlers.ts`

保留内容：
- 当前 `ProjectCanvas` 相关 imports
- `getProjectCanvas`
- `saveProjectCanvasElement`
- 对应 IPC channel 注册（如果后续正式接入）

原因：
- 这是新 PM Workspace 中心域
- 必须从老聚合文件里独立出来

### 6.4 `workItemHandlers.ts`

保留内容：
- `workItems:getAll`
- `workItems:getByProject`
- `workItems:getByParent`
- `workItems:create`
- `workItems:update`
- `workItems:delete`
- 当前 hierarchy build
- 当前 audit log 调用

原因：
- 虽然未来 WorkItem 可能演化为 Timeline / WorkPackage / Risk 的底层来源
- 但当前 runtime 与 schema 仍然是一套 `work_items` domain
- 目前不应再细拆为多个文件

### 6.5 `inboxHandlers.ts`

保留内容：
- `inbox:getAll`
- `inbox:create`
- `inbox:markProcessed`
- `inbox:delete`

原因：
- 独立 domain
- 与 Project / WorkItem 的变更原因不同

### 6.6 `settingsHandlers.ts`

保留内容：
- `settings:get`
- `settings:set`
- `settings:export`
- `settings:import`

注意：
这里其实混了两个层次：
1. key-value settings
2. full data export/import

但当前阶段建议先留在一个文件，不再继续细拆。

触发进一步拆分的条件：
- 出现正式 backup / restore 子系统
- export/import 流程明显大于 settings CRUD

### 6.7 `searchHandlers.ts`

保留内容：
- `search:global`
- `handleGlobalSearch`

原因：
- Search 是明显的跨 domain 查询入口
- 但它本身仍是一个完整问题
- 不应再拆成按实体分布的搜索碎文件

---

## 7. 旧方向隔离策略（legacy）

### 7.1 `portfolioHandlers.ts`

从当前 `handlers.ts` 中迁出：
- `portfolios:getAll`
- `portfolios:getById`
- `portfolios:create`
- `portfolios:update`
- `portfolios:delete`
- `portfolios:addProject`
- `portfolios:removeProject`

原因：
- 这是旧产品中心
- 但当前仍有数据与页面依赖
- 适合进入 `legacy/`，停止继续作为中心扩展

### 7.2 `dashboardHandlers.ts`

保留/迁入 `legacy/`：
- `dashboard:getPortfolioSummary`

说明：
- 当前它已经是独立文件，但从产品方向上应标为 legacy
- 如果暂时不挪路径，也至少要在文档和入口组织中标成 legacy domain

### 7.3 `todoHandlers.ts`

从当前 `handlers.ts` 中迁出：
- `todos:getAll`
- `todos:getByDate`
- `todos:create`
- `todos:update`
- `todos:toggle`
- `todos:delete`

原因：
- Todo 不再是长期产品中心
- 但仍可保留能力

### 7.4 `myWorkHandlers.ts`

当前已独立存在。

建议：
- 保持独立
- 放入 `legacy/` 或至少在注册入口中作为 legacy 段统一处理
- 不再把新 PM Workspace 逻辑挂进这里

---

## 8. 审计日志 helper 的位置

当前 `writeAuditLog()` 在 `handlers.ts` 顶部。

建议迁到：
- `src/main/ipc/shared/auditLog.ts`

原因：
- 它不是单一 domain 的 handler
- 但确实服务多个 domain
- 这是一个真实的共享边界

注意：
不要把它升级成笼统的 `utils.ts`。
它是 IPC shared concern，应放在明确命名的 shared 子目录里。

---

## 9. 迁移顺序建议

这不是一次性“大重构”，建议分 4 步走。

### Phase 1：只做入口整理
- 新建 `ipc/index.ts`
- `index.ts` 统一调用已有 register 函数
- 暂时让旧 `handlers.ts` 仍可被 `registerProjectHandlers()` 类包装复用

目标：
先把“总入口”和“具体 domain 实现”分开。

### Phase 2：迁出新中心 domain
优先迁出：
- workspace
- project
- projectCanvas
- workItem
- inbox
- settings
- search

目标：
让未来 PM Workspace 继续增长时，不再进入旧聚合文件。

### Phase 3：旧方向隔离
迁出到 `legacy/`：
- portfolio
- todo
- dashboard
- myWork

目标：
在代码组织上明确“旧方向不是产品中心”。

### Phase 4：再评估是否继续细分
此时再判断：
- `settingsHandlers.ts` 是否要拆出 backup/import
- `workItemHandlers.ts` 是否要按未来 domain 重构
- `searchHandlers.ts` 是否需要接入新的 PM domain 检索

不是现在先拆。

---

## 10. 明确不建议的拆法

### 不建议 1：按 CRUD 动词拆
不要拆成：
- `createProject.ts`
- `updateProject.ts`
- `deleteProject.ts`

原因：
- 同一 domain 的核心修改路径被打碎
- agent 为了理解一个对象的完整生命周期要跨文件跳转

### 不建议 2：注册和实现完全分离太远
不要把：
- channel 注册全在一个文件
- 具体实现散落多个细碎 action 文件

除非后期形成稳定的 codegen / contract 系统，否则这会显著增加检索噪音。

### 不建议 3：现在就按未来理想模型拆 Timeline/Risk/WorkPackage
虽然产品未来会演进到更明确 domain，但当前 schema 和 IPC 仍围绕 `work_items`。

所以现在不建议强行把 `workItemHandlers.ts` 先拆成：
- timelineHandlers.ts
- riskHandlers.ts
- workPackageHandlers.ts

那会是“产品理想先行，代码现实滞后”的伪拆分。

---

## 11. Architecture Agent 最终判断

### 现在应该保留为大检索单元的
- `projectHandlers.ts`
- `projectCanvasHandlers.ts`
- `workItemHandlers.ts`
- `searchHandlers.ts`

### 现在应该拆出真实边界的
- `handlers.ts` → 统一入口 `index.ts`
- `writeAuditLog()` → `shared/auditLog.ts`
- Portfolio / Todo / Dashboard / MyWork → legacy 隔离

### 现在不该做的
- 不按行数继续碎裂 handler
- 不按 CRUD 动词拆 domain
- 不为了未来理想 domain 过早重写当前 work item 入口

---

## 12. 一句话方案

这次 `main/ipc/handlers.ts` 的正确拆法是：

按 domain 聚合拆成少量高内聚 handler 文件，
把新 PM Workspace 中心域与旧方向 legacy 域分开，
把共享审计逻辑抽到明确 shared 边界，
而不是按方法或行数把代码打碎。
