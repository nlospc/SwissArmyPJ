# Portfolio Timeline / Gantt Chart Architecture Summary

本文档总结 SwissArmyPM 中 Timeline/Gantt Chart 的完整架构设计。

---

## 📐 架构概览

```
PortfolioPage (src/renderer/pages/PortfolioPage.tsx)
    │
    ├─► ProjectGanttChart (Project 维度)
    │       ├─ TimelineProvider (Context)
    │       ├─ Project List Panel (左侧表格)
    │       ├─ Timeline Panel (右侧时间轴)
    │       └─ GanttBar (单个时间条)
    │
    └─► WorkItemGanttChart (WorkItem 维度)
            ├─ TimelineProvider (Context)
            ├─ WorkItem List Panel (左侧表格)
            ├─ Timeline Panel (右侧时间轴)
            └─ GanttBar (单个时间条)
```

---

## 🗂️ 文件结构

```
src/renderer/
├── components/gantt/
│   ├── index.ts                      # 导出所有组件
│   ├── TimelineProvider.tsx          # Timeline Context Provider
│   ├── timeline-utils.ts             # 工具函数（日期转换、网格生成等）
│   ├── GanttBar.tsx                  # 单个时间条组件
│   ├── ProjectGanttChart.tsx         # Project 级别 Gantt Chart
│   ├── WorkItemGanttChart.tsx        # WorkItem 级别 Gantt Chart
│   └── TimelineGanttChart.tsx        # 第三方库集成（未来）
├── pages/
│   └── PortfolioPage.tsx             # Portfolio 页面（已更新）
└── stores/
    ├── useProjectStore.ts            # Project 状态管理
    └── useWorkItemStore.ts           # WorkItem 状态管理

docs/
├── PRD/
│   └── PRD-005-Timeline.md           # Timeline/Gantt PRD
└── gantt-library-integration.md      # 第三方库集成指南
```

---

## 🎨 核心组件说明

### 1. TimelineProvider (Context)

**文件**: `src/renderer/components/gantt/TimelineProvider.tsx`

**功能**:
- 管理全局时间轴状态
- 提供缩放、平移、跳转等操作
- 与 Ant Design v5 集成

**使用示例**:
```typescript
import { TimelineProvider, useTimeline } from '@/components/gantt';

function MyComponent() {
  const { viewStart, viewEnd, scale, zoomIn, zoomOut } = useTimeline();

  return (
    <TimelineProvider initialScale="month">
      {/* Timeline 组件 */}
    </TimelineProvider>
  );
}
```

---

### 2. Timeline Utils

**文件**: `src/renderer/components/gantt/timeline-utils.ts`

**功能**:
- 日期与像素转换
- 网格线生成
- 时间条位置计算
- 状态颜色映射

**核心函数**:
```typescript
// 日期转像素
dateToPixel(date, viewStart, columnWidth, scale): number

// 像素转日期
pixelToDate(pixel, viewStart, columnWidth, scale): Dayjs

// 计算时间条位置
calculateBarPosition(startDate, endDate, ...): BarPosition

// 生成网格线
generateGridLines(viewStart, viewEnd, scale, columnWidth): GridLine[]

// 获取状态颜色
getStatusColor(status: string): string
```

---

### 3. GanttBar

**文件**: `src/renderer/components/gantt/GanttBar.tsx`

**功能**:
- 渲染单个时间条或里程碑
- 支持拖拽调整
- Tooltip 显示详细信息
- 与 Ant Design v5 Tooltip 集成

**类型定义**:
```typescript
interface GanttBarItem {
  id: string;
  name: string;
  type: string;          // Task, Story, Bug, Spike, Milestone
  status: string;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  assignee?: string;
  progress?: number;
  isMilestone?: boolean;
}
```

---

### 4. ProjectGanttChart

**文件**: `src/renderer/components/gantt/ProjectGanttChart.tsx`

**功能**:
- 显示所有项目的时间轴
- 左侧表格：项目名称、进度、WorkItem 数量
- 右侧时间轴：项目时间条
- 支持点击项目进入 WorkItem 详情

**特性**:
- ✅ 项目时间范围自动计算
- ✅ 进度条显示
- ✅ 今日标记线
- ✅ 缩放（Day/Week/Month/Quarter）
- ✅ 拖拽调整日期
- ✅ 筛选和搜索

---

### 5. WorkItemGanttChart

**文件**: `src/renderer/components/gantt/WorkItemGanttChart.tsx`

**功能**:
- 显示单个项目的所有 WorkItem
- 左侧表格：WorkItem 名称、类型、状态、负责人
- 右侧时间轴：WorkItem 时间条
- 支持返回 Portfolio 视图

**特性**:
- ✅ 多种 WorkItem 类型（Story, Task, Bug, Spike, Milestone）
- ✅ 状态标签颜色
- ✅ 类型图标
- ✅ 筛选（按状态、按类型）
- ✅ 返回导航（Breadcrumb）

---

## 🎯 与 PRD-005 的对应关系

### PRD-005 需求 ✅ 实现状态

| 需求 | 状态 | 实现 |
|------|------|------|
| **Excel-like 界面** | ✅ | 左侧表格 + 右侧时间轴 |
| **轻量级（无复杂调度）** | ✅ | 用户直接控制日期 |
| **视觉清晰（不同类型图标）** | ✅ | Task📝, Story📖, Bug🐛, Spike🔬, Milestone◆ |
| **直接操作（拖拽编辑）** | ✅ | GanttBar 支持拖拽 |
| **时间刻度切换** | ✅ | Day/Week/Month/Quarter |
| **内联编辑** | 🔄 | 可通过 Ant Design Table 实现 |
| **依赖验证** | 📋 | PRD-009 WorkflowEngine 处理 |
| **CSV 导出** | 📋 | 可通过 Ant Design Table 实现 |
| **键盘快捷键** | 📋 | 可添加到 Toolbar |

---

## 🚀 使用方法

### 基本使用

```typescript
import { ProjectGanttChart } from '@/components/gantt';
import { useProjectStore } from '@/stores/useProjectStore';
import { useWorkItemStore } from '@/stores/useWorkItemStore';

function MyPortfolioPage() {
  const { projects } = useProjectStore();
  const { workItems } = useWorkItemStore();

  return (
    <ProjectGanttChart
      projects={projects}
      workItems={workItems}
      viewMode="month"
      onProjectClick={(project) => {
        // 导航到项目详情
        navigate(`/projects/${project.id}`);
      }}
      onWorkItemClick={(workItem) => {
        // 打开 WorkItem 详情
        console.log('WorkItem clicked:', workItem);
      }}
    />
  );
}
```

### 自定义配置

```typescript
import { TimelineProvider } from '@/components/gantt';

function CustomGanttChart() {
  return (
    <TimelineProvider
      initialScale="week"
      initialStart={dayjs().startOf('month')}
      initialEnd={dayjs().endOf('month').add(1, 'month')}
    >
      <ProjectGanttChart {...props} />
    </TimelineProvider>
  );
}
```

---

## 🎨 Ant Design v5 集成

### 主题变量

```css
/* src/renderer/styles/gantt.css */
.gantt-chart {
  --gantt-header-bg: var(--ant-colorBgContainer);
  --gantt-border-color: var(--ant-colorBorder);
  --gantt-row-bg-even: var(--ant-colorBgLayout);
  --gantt-row-bg-odd: var(--ant-colorBgContainer);
  --gantt-selected-bg: var(--ant-colorPrimaryBg);
  --gantt-text-primary: var(--ant-colorText);
  --gantt-text-secondary: var(--ant-colorTextSecondary);
}
```

### 组件集成

```typescript
import { Toolbar, Button, Select, Space, Tag } from 'antd';

function GanttToolbar() {
  return (
    <Toolbar>
      <Space>
        <Select value={scale} onChange={setScale} {...selectProps} />
        <Button icon={<ZoomInOutlined />} onClick={zoomIn} />
        <Button icon={<ZoomOutOutlined />} onClick={zoomOut} />
      </Space>
    </Toolbar>
  );
}
```

---

## 📊 性能优化策略

### 1. 虚拟化（未来）

对于大量 WorkItem（> 1000），考虑使用 `react-window`:

```typescript
import { FixedSizeList } from 'react-window';

function VirtualizedGanttList({ items, rowHeight }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={rowHeight}
      width="100%"
    >
      {({ index, style }) => (
        <GanttBar
          item={items[index]}
          index={index}
          style={style}
        />
      )}
    </FixedSizeList>
  );
}
```

### 2. 渲染优化

```typescript
// 使用 useMemo 缓存计算结果
const ganttItems = useMemo(() => {
  return projects.map(/* ... */);
}, [projects, workItems]);

// 使用 React.memo 包装组件
export const GanttBar = React.memo(GanttBarComponent);
```

### 3. 拖拽优化

```typescript
// 使用 requestAnimationFrame 优化拖拽性能
const handleDragMove = (e: MouseEvent) => {
  requestAnimationFrame(() => {
    // 更新位置
  });
};
```

---

## 🔄 与其他系统集成

### 1. WorkflowEngine (PRD-009)

```typescript
import { useWorkflowStore } from '@/stores/useWorkflowStore';

function GanttBarWithWorkflow({ item }) {
  const { transitionItemStatus } = useWorkflowStore();

  const handleStatusChange = (newStatus) => {
    transitionItemStatus(item.id, newStatus);
  };

  return <GanttBar item={item} onStatusChange={handleStatusChange} />;
}
```

### 2. Audit Log (PRD-008)

```typescript
// 拖拽完成后写入审计日志
const handleDragEnd = (item, newStartDate, newEndDate) => {
  auditLogger.write_status_transition({
    entity_id: item.id,
    from_status: item.status,
    to_status: item.status, // 状态未变，但日期变了
    metadata: {
      old_start: item.startDate,
      new_start: newStartDate,
      old_end: item.endDate,
      new_end: newEndDate,
    },
  });
};
```

### 3. Dashboard (PRD-006)

```typescript
// Dashboard 可以引用 Gantt Chart 的数据
function ProjectHealthCard({ project }) {
  const ganttData = useProjectGanttData(project.id);

  return (
    <Card>
      <Statistic title="On Track" value={calculateOnTrack(ganttData)} />
    </Card>
  );
}
```

---

## 🎯 未来增强

### Phase 2 功能

- [ ] **依赖线显示**: 使用 SVG 绘制项目间依赖关系
- [ ] **关键路径**: 基于 PRD-009 WorkflowEngine 计算关键路径
- [ ] **资源分配**: 显示人员负载
- [ ] **里程碑标记**: 特殊样式和图标
- [ ] **多选批量操作**: 支持批量调整日期
- [ ] **快照对比**: 对比不同时间点的计划

### Phase 3 功能

- [ ] **自动调度**: 基于依赖关系自动计算日期
- [ ] **冲突检测**: 检测资源冲突和日期冲突
- [ ] **基线对比**: 保存和对比计划基线
- [ ] **导出报告**: 生成 PDF/PNG 报告

---

## 📝 实现清单

- [x] PortfolioPage 重构为 Timeline 视图
- [x] TimelineProvider Context 实现
- [x] 时间轴工具函数
- [x] GanttBar 组件
- [x] ProjectGanttChart 组件
- [x] WorkItemGanttChart 组件
- [x] 与 Ant Design v5 集成
- [x] 拖拽调整日期（基础实现）
- [ ] 第三方库集成（React Calendar Timeline）
- [ ] 依赖线显示
- [ ] 内联编辑功能
- [ ] CSV 导出
- [ ] 键盘快捷键
- [ ] 性能测试（>1000 items）

---

## 🔗 相关文档

- [PRD-005: Timeline/Gantt Specification](../PRD/PRD-005-Timeline.md)
- [PRD-009: Workflow Engine](../PRD/PRD-009-WorkflowEngine.md)
- [Gantt Library Integration Guide](./gantt-library-integration.md)
- [Ant Design v5 Documentation](https://ant.design/)

---

## 💡 提示和技巧

### 1. 日期格式化

使用 `dayjs` 进行日期操作：

```typescript
import dayjs from 'dayjs';

const startDate = dayjs(project.start_date);
const endDate = dayjs(project.end_date);
const duration = endDate.diff(startDate, 'day');
```

### 2. 状态颜色映射

```typescript
const statusColors = {
  Done: '#52c41a',
  'In Progress': '#1890ff',
  Blocked: '#ff4d4f',
  Backlog: '#d9d9d9',
};
```

### 3. 响应式设计

```typescript
const [tableWidth, setTableWidth] = useState(400);

useEffect(() => {
  const handleResize = () => {
    setTableWidth(window.innerWidth * 0.3);
  };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

---

*最后更新: 2026-02-06*
