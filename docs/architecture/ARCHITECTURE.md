# SwissArmyPM 架构文档

> 最后更新：2026-04-11

---

## 整体架构

```
┌─────────────────────────────────────────────┐
│              Electron 主进程                  │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐ │
│  │  SQLite DB  │  │   IPC    │  │  File    │ │
│  │  (better-   │  │ Handlers │  │  System  │ │
│  │  sqlite3)   │  │          │  │          │ │
│  └────────────┘  └────┬─────┘  └──────────┘ │
│                       │ ipcMain.handle()      │
└───────────────────────┼──────────────────────┘
                        │ Electron IPC Bridge
┌───────────────────────┼──────────────────────┐
│              Electron 渲染进程                │
│  ┌────────────┐  ┌────┴─────┐  ┌──────────┐ │
│  │  Zustand    │  │   IPC    │  │  React   │ │
│  │  Stores     │◄─┤  Bridge  │  │  Pages   │ │
│  │  (9 stores) │  │ (lib/)   │  │ + Comp   │ │
│  └────────────┘  └──────────┘  └──────────┘ │
│                                              │
│  UI: Ant Design 5 + Tailwind CSS 3           │
└──────────────────────────────────────────────┘
```

---

## 数据层

### 数据库

- **引擎**: SQLite，通过 better-sqlite3 同步访问
- **Schema 定义**: `src/main/database/schema.ts`
- **当前表结构**: workspaces, portfolios, projects, work_items, dependencies, inbox_items, settings, todos, audit_log
- **无迁移框架**: schema 变更直接在 `initializeDatabase()` 中执行 CREATE TABLE IF NOT EXISTS

### 共享类型

- **位置**: `src/shared/types/index.ts`
- 所有主进程/渲染进程共享的 TypeScript 接口定义在此
- 数据库 schema 变更时**必须同步**此文件

---

## IPC 层

### Handler 组织

| 文件 | 职责 |
|------|------|
| `handlers.ts` | 主 handler：portfolio / project / work-item / inbox / todo / settings |
| `dashboardHandlers.ts` | Dashboard 聚合查询 |
| `myWorkHandlers.ts` | My Work 功能（旧方向） |

### 通信模式

- 使用 `ipcMain.handle()` / `ipcRenderer.invoke()` 的 request-response 模式
- 所有 handler 返回 `{ success: boolean, data?: T, error?: string }` 格式
- 审计日志通过 `createAuditLog()` 辅助函数写入 audit_log 表

---

## 前端层

### 页面（`src/renderer/pages/`）

| 页面 | 说明 |
|------|------|
| PortfolioPage.tsx | 项目组合视图（旧方向核心页面） |
| DashboardPage.tsx | Dashboard 仪表盘（旧方向） |
| InboxPage.tsx | 文件收件箱 |
| SearchPage.tsx | 全局搜索 |
| SettingsPage.tsx | 应用设置 |
| MyWorkPage.tsx | My Work 页面（旧方向，在 features/ 下） |

### 状态管理（`src/renderer/stores/`）

9 个 Zustand store：
- usePortfolioStore, useProjectStore, useWorkItemStore
- useDashboardStore, useInboxStore, useTodoStore
- useMyWorkStore, useWorkspaceStore, useUIStore

### UI 组件（`src/renderer/components/`）

| 目录 | 说明 |
|------|------|
| common/ | 通用组件（ThemeToggle 等） |
| features/ | 布局组件（Sidebar 等） |
| dashboard/ | Dashboard 相关（10 个组件） |
| gantt/ | 甘特图组件（12 个组件，含 vis-timeline 封装） |
| portfolio/ | Portfolio 组件（ProjectsTableView） |

---

## 技术债务与已知问题

1. **数据模型偏向 Portfolio/My Work**: 现有表以 portfolio → project → work_item 层级为核心，缺少 Canvas / Stakeholder / Risk 等领域模型
2. **IPC handler 集中**: handlers.ts 文件过大，需要按 domain 拆分
3. **页面/组件混用旧方向**: dashboard/ 和 portfolio/ 组件全部服务于旧方向
4. **无迁移框架**: 没有 migration 版本管理，schema 变更靠 IF NOT EXISTS
5. **Store 数量多但部分重叠**: work-item 和 todo 功能边界模糊
6. **IPC Bridge 无类型安全**: renderer 调用主进程时缺少端到端类型约束

---

## PM Workspace 方向演进计划

### Phase 1: 领域模型重构

- 新增 Canvas / Stakeholder / RiskItem 等表
- 拆分 IPC handler 为 domain-specific 文件
- 建立迁移框架

### Phase 2: 前端重构

- 新增 Project Workspace 页面作为核心
- 按领域拆分组件（canvas/、stakeholders/、risks/、timeline/、work-packages/、evidence/）
- 重构 store 为 domain-aligned

### Phase 3: 下调旧模块

- Portfolio / Dashboard / My Work 降级为可选功能
- Sidebar 导航以 Project Workspace 为主

---

## 技术栈一览

| 层 | 技术 | 版本 |
|---|---|---|
| 桌面框架 | Electron | 29 |
| 前端 | React + TypeScript | React 19, TS 5.7 |
| 构建 | Vite | 6 |
| UI 组件库 | Ant Design | 5 |
| 样式 | Tailwind CSS | 3 |
| 状态管理 | Zustand | 5 |
| 数据库 | better-sqlite3 | 9 |
| 时间线可视化 | vis-timeline | 8 |
| IPC | Electron ipcMain/ipcRenderer | — |
