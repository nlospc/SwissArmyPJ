# 组件映射文档

> 最后更新：2026-04-11
> 本文档映射 src/renderer/ 下实际存在的组件到其功能职责。

---

## 页面（`src/renderer/pages/`）

| 页面文件 | 功能 | 方向归类 |
|----------|------|----------|
| PortfolioPage.tsx | 项目组合主页（当前首页） | 🔴 旧方向 |
| DashboardPage.tsx | Portfolio 级仪表盘 | 🔴 旧方向 |
| InboxPage.tsx | 文件收件箱（拖入文件提取任务） | 🟡 可复用 |
| SearchPage.tsx | 全局搜索 | 🟢 PM Workspace |
| SettingsPage.tsx | 应用设置 | 🟢 PM Workspace |
| MyWorkPage.tsx | My Work / Todo / Pomodoro 页面 | 🔴 旧方向 |

---

## 组件（`src/renderer/components/`）

### common/ — 通用组件

| 组件 | 功能 | 方向 |
|------|------|------|
| ThemeToggle.tsx | 主题切换（亮/暗） | 🟢 通用 |

### features/ — 布局组件

| 组件 | 功能 | 方向 |
|------|------|------|
| Sidebar.tsx | 主侧边栏导航 | 🟡 需重构为 PM Workspace 导航 |

### dashboard/ — Dashboard 组件

| 组件 | 功能 | 方向 |
|------|------|------|
| PortfolioSummary.tsx | Portfolio 摘要统计 | 🔴 旧方向 |
| ProjectCards.tsx | 项目卡片列表 | 🟡 可复用 |
| ProjectTable.tsx | 项目表格视图 | 🟡 可复用 |
| ProjectDetailDrawer.tsx | 项目详情抽屉 | 🟡 可复用 |
| DashboardProjectDetailView.tsx | 项目详情视图 | 🟡 可复用 |
| RiskSummary.tsx | 风险摘要 | 🟢 PM Workspace 需要 |
| TopWidgetDrawer.tsx | 顶部小部件 | 🔴 旧方向 |
| UpcomingMilestones.tsx | 即将到来的里程碑 | 🟢 PM Workspace 需要 |
| ChangeFeed.tsx | 变更动态流 | 🟡 可复用 |

### gantt/ — 甘特图组件

| 组件 | 功能 | 方向 |
|------|------|------|
| GanttChart.tsx | 甘特图容器 | 🟡 可复用 |
| GanttBar.tsx | 甘特条 | 🟡 可复用 |
| GanttRow.tsx | 甘特行 | 🟡 可复用 |
| TimelineGrid.tsx | 时间线网格 | 🟡 可复用 |
| TimelineHeader.tsx | 时间线表头 | 🟡 可复用 |
| TimelineProvider.tsx | 时间线 Context Provider | 🟡 可复用 |
| TimelineView.tsx | 时间线视图 | 🟡 可复用 |
| VisTimelineWrapper.tsx | vis-timeline 封装 | 🟡 可复用 |
| VisTimelineExample.tsx | vis-timeline 示例 | 🟡 可复用 |
| ProjectGanttChart.tsx | 项目级甘特图 | 🟡 可复用 |
| WorkItemGanttChart.tsx | 工作项甘特图 | 🟡 可复用 |
| ExcelGanttChart.tsx | Excel 风格甘特图 | 🟡 可复用 |
| WorkItemExcelGantt.tsx | 工作项 Excel 甘特 | 🟡 可复用 |

### portfolio/ — Portfolio 组件

| 组件 | 功能 | 方向 |
|------|------|------|
| ProjectsTableView.tsx | 项目表格视图 | 🟡 可复用 |

---

## 功能模块（`src/renderer/features/`）

| 模块 | 功能 | 方向 |
|------|------|------|
| my-work/ | My Work 完整模块（页面 + 工具函数） | 🔴 旧方向 |
| my-work/utils/dateHelpers.ts | 日期工具 | 🟡 可复用 |
| my-work/utils/groupTodos.ts | Todo 分组 | 🔴 旧方向 |
| my-work/utils/pomodoroSequence.ts | 番茄钟序列 | 🔴 旧方向 |
| my-work/utils/timeFormatters.ts | 时间格式化 | 🟡 可复用 |

---

## 状态管理（`src/renderer/stores/`）

| Store | 功能 | 方向 |
|-------|------|------|
| usePortfolioStore | Portfolio 状态 | 🔴 旧方向 |
| useProjectStore | 项目 CRUD 状态 | 🟢 PM Workspace 核心 |
| useWorkItemStore | 工作项状态 | 🟡 需演进为 WorkPackage |
| useDashboardStore | Dashboard 聚合状态 | 🔴 旧方向 |
| useInboxStore | 收件箱状态 | 🟡 可复用 |
| useTodoStore | Todo 状态 | 🔴 旧方向 |
| useMyWorkStore | My Work 状态 | 🔴 旧方向 |
| useWorkspaceStore | Workspace 状态 | 🟢 PM Workspace 核心 |
| useUIStore | UI 全局状态 | 🟢 通用 |

---

## 方向归类说明

- 🟢 **PM Workspace**: 当前方向需要，直接保留/发展
- 🟡 **可复用**: 旧方向但逻辑通用，可作为基础重构
- 🔴 **旧方向遗留**: 不再作为产品中心，可保留但停止扩展

---

## PM Workspace 方向缺失的组件

当前代码库缺少以下核心模块的组件和页面：

1. **项目画布组件** — ProjectCanvas 页面和 CRUD 表单
2. **干系人管理组件** — Stakeholder 列表、详情、矩阵视图
3. **风险登记册组件** — RiskRegister 列表、详情、矩阵图
4. **时间规划组件** — TimelinePlan 页面（可基于现有 gantt/ 组件构建）
5. **工作包管理组件** — WorkPackage 页面（可基于现有 work-item 组件重构）
6. **证据管理组件** — Evidence 列表、上传、关联视图
7. **项目列表首页** — ProjectList 替代 PortfolioPage 作为首页
8. **项目工作台外壳** — ProjectWorkspace 布局组件
9. **来源追溯组件** — 从事实到证据的追溯视图
