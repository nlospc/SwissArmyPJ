# 组件清单 — SwissArmyPM

最后更新：2026-04-11

> 本文件基于 `src/renderer/` 目录实际扫描结果生成。组件按所在目录分组，每个组件标注其在 PM Workspace 新方向中的归类。

---

## 图例

| 标记 | 含义 |
|------|------|
| 🟢 PM Workspace | 当前产品方向需要保留/演进的组件 |
| 🟡 可复用 | 通用基础能力，方向切换后仍需要，但内容需调整 |
| 🔴 旧方向遗留 | 属于 Portfolio / My Work 旧方向，后续应降级或移除 |

---

## 一、页面级组件（pages/）

| 文件 | 组件 | 用途 | 归类 |
|------|------|------|------|
| `DashboardPage.tsx` | DashboardPage | 仪表盘主页，展示项目概览 | 🔴 旧方向（Portfolio Dashboard），需重构为项目列表页 |
| `PortfolioPage.tsx` | PortfolioPage | Portfolio 总览页面 | 🔴 旧方向，需重构或移除 |
| `InboxPage.tsx` | InboxPage | 文件收件箱页面 | 🟡 可复用（可演化为证据录入入口） |
| `InboxPage.migrated.tsx` | InboxPage（迁移版） | Inbox 迁移中间文件 | 🔴 旧方向遗留，可清理 |
| `SearchPage.tsx` | SearchPage | 全局搜索页面 | 🟢 PM Workspace（跨对象搜索能力有用） |
| `SettingsPage.tsx` | SettingsPage | 设置页面 | 🟢 PM Workspace（通用配置页） |

---

## 二、通用组件（components/common/）

| 文件 | 组件 | 用途 | 归类 |
|------|------|------|------|
| `ThemeToggle.tsx` | ThemeToggle | 亮/暗主题切换 | 🟢 PM Workspace（通用基础组件） |

---

## 三、功能组件（components/features/）

| 文件 | 组件 | 用途 | 归类 |
|------|------|------|------|
| `Sidebar.tsx` | Sidebar | 主侧边栏导航 | 🟡 可复用（导航结构需从旧方向迁移到 PM Workspace） |

---

## 四、仪表盘组件（components/dashboard/）

| 文件 | 组件 | 用途 | 归类 |
|------|------|------|------|
| `ChangeFeed.tsx` | ChangeFeed | 变更动态流 | 🟡 可复用（可适配为项目变更日志） |
| `DashboardProjectDetailView.tsx` | DashboardProjectDetailView | 项目详情视图（42KB 大文件） | 🟡 可复用（项目详情是 PM Workspace 核心页面，需大幅重构） |
| `PortfolioSummary.tsx` | PortfolioSummary | Portfolio 级统计摘要 | 🔴 旧方向 |
| `ProjectCards.tsx` | ProjectCards | 项目卡片列表 | 🟡 可复用（项目列表展示，需简化） |
| `ProjectDetailDrawer.tsx` | ProjectDetailDrawer | 项目详情抽屉 | 🟡 可复用（可适配为项目工作台入口） |
| `ProjectTable.tsx` | ProjectTable | 项目表格视图 | 🟢 PM Workspace（项目列表核心组件） |
| `RiskSummary.tsx` | RiskSummary | 风险摘要展示 | 🟢 PM Workspace（风险登记册子组件，需扩展为完整风险表） |
| `TopWidgetDrawer.tsx` | TopWidgetDrawer | 顶部组件抽屉 | 🟡 可复用 |
| `UpcomingMilestones.tsx` | UpcomingMilestones | 即将到来的里程碑 | 🟢 PM Workspace（时间规划相关） |

---

## 五、甘特图组件（components/gantt/）

| 文件 | 组件 | 用途 | 归类 |
|------|------|------|------|
| `ExcelGanttChart.tsx` | ExcelGanttChart | Excel 风格甘特图（核心实现） | 🟢 PM Workspace（时间规划表的核心可视化组件） |
| `GanttBar.tsx` | GanttBar | 甘特条形渲染 | 🟢 PM Workspace |
| `GanttChart.tsx` | GanttChart | 基础甘特图组件 | 🟢 PM Workspace |
| `GanttRow.tsx` | GanttRow | 甘特行渲染 | 🟢 PM Workspace |
| `ProjectGanttChart.tsx` | ProjectGanttChart | 项目级甘特图 | 🟢 PM Workspace |
| `TimelineGrid.tsx` | TimelineGrid | 时间轴网格 | 🟢 PM Workspace |
| `TimelineHeader.tsx` | TimelineHeader | 时间轴表头 | 🟢 PM Workspace |
| `TimelineProvider.tsx` | TimelineProvider | 时间轴 Context Provider | 🟢 PM Workspace |
| `TimelineView.tsx` | TimelineView | 时间轴视图 | 🟢 PM Workspace |
| `VisTimelineExample.tsx` | VisTimelineExample | vis-timeline 示例/测试 | 🔴 可清理（开发测试用途） |
| `VisTimelineWrapper.tsx` | VisTimelineWrapper | vis-timeline 库的封装 | 🟢 PM Workspace（备选甘特图渲染器） |
| `WorkItemExcelGantt.tsx` | WorkItemExcelGantt | 工作项 Excel 风格甘特图 | 🟢 PM Workspace（工作包时间可视化） |
| `WorkItemGanttChart.tsx` | WorkItemGanttChart | 工作项甘特图 | 🟢 PM Workspace |

---

## 六、组合视图组件（components/portfolio/）

| 文件 | 组件 | 用途 | 归类 |
|------|------|------|------|
| `ProjectsTableView.tsx` | ProjectsTableView | 项目表格视图 | 🟡 可复用（项目列表展示，需调整） |

---

## 七、My Work 功能模块（features/my-work/）

> ⚠️ 整个 My Work 模块属于旧方向（个人效率 / Pomodoro / Todo），后续应降级或移除。

| 文件 | 组件 | 用途 | 归类 |
|------|------|------|------|
| `MyWorkPage.tsx` | MyWorkPage | My Work 模块主页面 | 🔴 旧方向 |
| `QuickStats/StatCard.tsx` | StatCard | 统计卡片 | 🟡 可复用（统计展示模式可参考） |
| `QuickStats/StatsBar.tsx` | StatsBar | 统计栏 | 🟡 可复用 |
| `Preferences/PreferencesPanel.tsx` | PreferencesPanel | 偏好设置面板 | 🟡 可复用（设置面板模式可参考） |
| `TimeTracker/TrackerSidebar.tsx` | TrackerSidebar | 时间追踪侧边栏 | 🔴 旧方向 |
| `TimeTracker/PomodoroTimer/SessionIndicator.tsx` | SessionIndicator | 番茄钟会话指示器 | 🔴 旧方向 |
| `TimeTracker/PomodoroTimer/TimerControls.tsx` | TimerControls | 番茄钟控制按钮 | 🔴 旧方向 |
| `TimeTracker/PomodoroTimer/TimerWidget.tsx` | TimerWidget | 番茄钟计时器组件 | 🔴 旧方向 |
| `TimeTracker/WeeklySummary/TargetProgress.tsx` | TargetProgress | 周目标进度 | 🔴 旧方向 |
| `TimeTracker/WeeklySummary/WeeklyChart.tsx` | WeeklyChart | 周工时图表 | 🔴 旧方向 |
| `TimeTracker/TodayLog/EditTimeLogDialog.tsx` | EditTimeLogDialog | 编辑时间记录弹窗 | 🔴 旧方向 |
| `TimeTracker/TodayLog/LogEntry.tsx` | LogEntry | 时间记录条目 | 🔴 旧方向 |
| `TimeTracker/TodayLog/LogSummary.tsx` | LogSummary | 时间记录摘要 | 🔴 旧方向 |
| `TimeTracker/TodayLog/ManualLogDialog.tsx` | ManualLogDialog | 手动录入时间弹窗 | 🔴 旧方向 |
| `TodoList/QuickTaskInput.tsx` | QuickTaskInput | 快速任务输入框 | 🔴 旧方向 |
| `TodoList/TodoFilters.tsx` | TodoFilters | Todo 筛选器 | 🔴 旧方向 |
| `TodoList/TodoGroup.tsx` | TodoGroup | Todo 分组 | 🔴 旧方向 |
| `TodoList/TodoItem.tsx` | TodoItem | Todo 条目 | 🔴 旧方向 |
| `TodoList/TodoListContainer.tsx` | TodoListContainer | Todo 列表容器 | 🔴 旧方向 |

---

## 八、状态管理（stores/）

| 文件 | Store | 用途 | 归类 |
|------|-------|------|------|
| `useDashboardStore.ts` | DashboardStore | 仪表盘状态 | 🟡 可复用（可改造为项目列表状态） |
| `usePortfolioStore.ts` | PortfolioStore | Portfolio 状态 | 🔴 旧方向 |
| `useProjectStore.ts` | ProjectStore | 项目状态 | 🟢 PM Workspace（核心 store，需扩展） |
| `useWorkItemStore.ts` | WorkItemStore | 工作项状态 | 🟢 PM Workspace（可演化为工作包 store） |
| `useWorkspaceStore.ts` | WorkspaceStore | 工作区状态 | 🟢 PM Workspace（核心 store） |
| `useInboxStore.ts` | InboxStore | 收件箱状态 | 🟡 可复用 |
| `useMyWorkStore.ts` | MyWorkStore | My Work 状态 | 🔴 旧方向 |
| `useTodoStore.ts` | TodoStore | Todo 状态 | 🔴 旧方向 |
| `useUIStore.ts` | UIStore | UI 全局状态 | 🟢 PM Workspace |

---

## 九、应用入口与根组件

| 文件 | 组件/模块 | 用途 | 归类 |
|------|-----------|------|------|
| `App.tsx` | App | 应用根组件（路由定义、全局 Provider） | 🟡 可复用（路由结构需从旧方向迁移） |
| `main.tsx` | main | 渲染进程入口 | 🟢 PM Workspace |

---

## 十、汇总

| 归类 | 数量 | 说明 |
|------|------|------|
| 🟢 PM Workspace | ~18 | 当前方向需要，优先保障 |
| 🟡 可复用 | ~12 | 通用能力可复用，内容需调整 |
| 🔴 旧方向遗留 | ~18 | Portfolio / My Work 方向，后续降级或移除 |

### PM Workspace 方向缺失的组件

以下组件为 PM Workspace 核心模块所需，当前仓库中**尚不存在**：

- [ ] 项目画布组件（ProjectCanvas）
- [ ] 干系人列表与管理组件（StakeholderTable / StakeholderDrawer）
- [ ] 干系人矩阵图（PowerInterestMatrix）
- [ ] 风险登记册完整组件（RiskRegisterTable / RiskDetailDrawer）
- [ ] 风险矩阵热力图（RiskMatrixHeatmap）
- [ ] 工作包列表与管理组件（WorkPackageTable / WorkPackageDrawer）
- [ ] 工作包看板视图（WorkPackageKanban）
- [ ] 证据管理组件（EvidenceList / EvidenceViewer）
- [ ] 证据关联/来源标注组件（SourceLink / EvidenceTag）
