# PRD-006: Portfolio Dashboard Specification

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-006 |
| **Parent** | @PRD-001-Master.md |
| **Status** | Draft |
| **Date** | 2026-01-30 |

---

## 1. Overview

The Portfolio Dashboard enables 30–60 second context recovery by displaying aggregate health metrics, recent changes, and drill-down navigation.

**Dependencies**: @PRD-002-DataModel.md, @PRD-008-Governance.md (audit log for change feed)
**Dependents**: None (top-level view)

---

## 2. Design Goals

| Goal | Description |
|------|-------------|
| **30-Second Context** | PM can assess portfolio status within 30 seconds |
| **At-a-Glance Health** | Visual indicators for on-track / at-risk / blocked |
| **Change Awareness** | Recent mutations surfaced prominently |
| **Drill-Down** | One click to project detail or specific item |

---

## 3. Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📊 Portfolio Dashboard                              Last refreshed: 2 min ago  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  PORTFOLIO SUMMARY                                                      │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  5 Active Projects │ 127 Tasks │ 23 Open Issues │ 8 Upcoming Milestones │   │
│  │                                                                         │   │
│  │  [████████████████████░░░░░░░░]  68% On Track  │  ⚠ 2 At Risk  │ 🚫 1   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  PROJECT HEALTH TABLE                                       [+ New Project] ││
│  │  ─────────────────────────────────────────────────────────────────────────── ││
│  │  Filters: [Search...] [Status ▼] [Portfolio ▼] [Owner ▼] [Progress] [Date] ││
│  │  ┌──────────┬──────────────┬────────┬──────────┬────────┬────────────┬──────┐ ││
│  │  │ Status   │ Project      │ Owner  │ Progress │ Tasks  │ Milestone  │ More │ ││
│  │  ├──────────┼──────────────┼────────┼──────────┼────────┼────────────┼──────┤ ││
│  │  │ 🟢       │ Project Alpha │ Alice  │ ██████░░ │ 12/15  │ MS1 (3d)   │ ⋯    │ ││
│  │  │          │              │        │ 78%      │        │ 🟢 On Track│      │ ││
│  │  ├──────────┼──────────────┼────────┼──────────┼────────┼────────────┼──────┤ ││
│  │  │ 🟡       │ Project Beta  │ Bob    │ ████░░░░ │ 7/13   │ MS2 (-2d)  │ ⋯    │ ││
│  │  │          │              │        │ 54%      │        │ 🔴 Overdue │      │ ││
│  │  ├──────────┼──────────────┼────────┼──────────┼────────┼────────────┼──────┤ ││
│  │  │ 🚫       │ Project Gamma │ Carol  │ ██░░░░░░ │ 3/13   │ MS3 (5d)   │ ⋯    │ ││
│  │  │          │              │        │ 23%      │        │ 🟡 At Risk │      │ ││
│  │  └──────────┴──────────────┴────────┴──────────┴────────┴────────────┴──────┘ ││
│  │  Showing 3 of 5 projects                                                    ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                 │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────────┐   │
│  │  CHANGE FEED                │  │  UPCOMING MILESTONES       [View All]  │   │
│  │  ─────────────────────────── │  │  ─────────────────────────────────────  │   │
│  │  🟢 Task "API Design" → Done │  │  ◆ MS1: Design Complete  │ 3 days     │   │
│  │     Project Alpha • 5 min    │  │     Project Alpha       │ 🟢 On Track │   │
│  │                             │  │                                    │   │
│  │  🟡 "Sprint 3" dates changed │  │  ◆ MS2: Beta Release     │ Overdue   │   │
│  │     Project Beta • 23 min   │  │     Project Beta         │ 🔴 Blocked │   │
│  │                             │  │                                    │   │
│  │  ⚠️ Conflict: "QA Plan"      │  │  ◆ MS3: Security Sign-off │ 5 days    │   │
│  │     Project Beta • 1 hr     │  │     Project Alpha       │ 🟡 At Risk │   │
│  │                             │  └─────────────────────────────────────────┘   │
│  │  [View All Changes]         │                                             │
│  └─────────────────────────────┘  ┌─────────────────────────────────────────┐   │
│                                    │  RISK SUMMARY                [View All]│   │
│                                    │  ─────────────────────────────────────  │   │
│                                    │  🔴 Critical: 2 │ 🟠 High: 5 │ 🟡 Med: 12│   │
│                                    └─────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Components

### 4.1 Portfolio Summary Bar

| Metric | Calculation | Display |
|--------|-------------|---------|
| Active Projects | COUNT(projects WHERE status = 'InProgress') | Number |
| Total Tasks | COUNT(items WHERE type = 'Task') | Number |
| Open Issues | COUNT(items WHERE type = 'Issue' AND status != 'Done') | Number |
| Upcoming Milestones | COUNT(items WHERE type = 'Milestone' AND end_date BETWEEN today AND today+14) | Number |
| On Track % | Projects with no overdue milestones / Total | Progress bar |
| At Risk | Projects with overdue milestones or high-risk issues | Badge |
| Blocked | Projects with blocked status | Badge |

### 4.2 Project Health Table

**Multi-Filter Capabilities:**

| Filter | Type | Options |
|--------|------|---------|
| Search | Text | Filter by project name |
| Status | Multi-select | On Track, At Risk, Critical, Blocked |
| Portfolio | Dropdown | All portfolios |
| Progress Range | Slider | 0-100% |
| Owner | Multi-select | All project owners |
| Date Range | Date picker | Start/End dates |

**Table Columns:**

| Column | Width | Description |
|--------|-------|-------------|
| Status | 80px | 🟢 On Track / 🟡 At Risk / 🔴 Critical / 🚫 Blocked |
| Project | 200px | Project name (clickable) |
| Owner | 120px | Project owner |
| Progress | 120px | Visual progress bar + percentage |
| Tasks | 100px | Done/Total tasks |
| Next Milestone | 180px | Milestone name + due date |
| Blockers | 80px | Count of blocked items |
| Risks | 80px | Count of high/critical issues |
| Portfolio | 150px | Portfolio name |
| Actions | 80px | View, Edit, Delete buttons |

**Health Status Logic:**

```typescript
function calculateProjectHealth(project: ProjectMetrics): HealthStatus {
  if (project.blockedCount > 0) return 'blocked';
  if (project.overdueMilestones > 0) return 'critical';
  if (project.criticalRisks > 0) return 'critical';
  if (project.atRiskMilestones > 0) return 'at_risk';
  if (project.highRisks > 0) return 'at_risk';
  return 'on_track';
}
```

**Sorting:**
- Click column headers to sort
- Status: Custom order (Blocked → Critical → At Risk → On Track)
- Progress: Numeric sort
- Dates: Chronological sort

### 4.3 Change Feed

Displays recent mutations from audit log (see @PRD-008-Governance.md).

| Event Type | Icon | Example |
|------------|------|---------|
| Item Created | 🟢 | New: "Security Audit" issue |
| Item Updated | 🟡 | "Sprint 3" dates changed |
| Item Completed | ✅ | Task "API Design" → Done |
| Conflict | ⚠️ | Conflict detected: "QA Plan" |
| Sync | 📁 | File sync: project-alpha.xml |
| Deleted | 🔴 | Removed: "Old Task" |

**Feed Query**:

```sql
SELECT 
  al.action, al.entity_type, al.entity_id, al.timestamp,
  al.old_values, al.new_values,
  i.name as item_name,
  p.name as project_name
FROM audit_log al
LEFT JOIN items i ON al.entity_id = i.id
LEFT JOIN projects p ON i.project_id = p.id
WHERE al.timestamp > datetime('now', '-7 days')
ORDER BY al.timestamp DESC
LIMIT 20;
```

### 4.4 Upcoming Milestones

| Column | Source |
|--------|--------|
| Name | items.name |
| Project | projects.name |
| Due Date | items.end_date |
| Status | Derived from date comparison |

**Status Logic**:
- 🟢 On Track: Due date > today + 3 days
- 🟡 At Risk: Due date within 3 days
- 🔴 Overdue: Due date < today

### 4.5 Risk Summary

Aggregates issues by risk_level:

```sql
SELECT 
  risk_level, 
  COUNT(*) as count
FROM items
WHERE type = 'Issue' AND status != 'Done' AND risk_level IS NOT NULL
GROUP BY risk_level;
```

---

## 5. Interactions

### 5.1 Navigation

| Click Target | Action |
|--------------|--------|
| Project Card | Navigate to project detail view |
| Milestone Row | Navigate to milestone detail |
| Change Feed Item | Navigate to item detail |
| Risk Badge | Open filtered issue list |

### 5.2 Refresh

- Auto-refresh every 5 minutes (configurable)
- Manual refresh button
- "Last refreshed" timestamp visible

### 5.3 Filtering

| Filter | Options |
|--------|---------|
| Portfolio | All / Specific portfolio |
| Date Range | Change feed date range |
| Change Type | Show/hide specific event types |

---

## 6. Data Aggregation Queries

### 6.1 Portfolio Metrics

```sql
-- Portfolio summary
SELECT
  (SELECT COUNT(*) FROM projects WHERE status = 'InProgress') as active_projects,
  (SELECT COUNT(*) FROM items WHERE type = 'Task') as total_tasks,
  (SELECT COUNT(*) FROM items WHERE type = 'Issue' AND status != 'Done') as open_issues,
  (SELECT COUNT(*) FROM items 
   WHERE type = 'Milestone' 
   AND end_date BETWEEN date('now') AND date('now', '+14 days')
  ) as upcoming_milestones;
```

### 6.2 Project Health

```sql
-- Per-project health metrics
SELECT 
  p.id, p.name, p.status,
  COUNT(CASE WHEN i.status = 'Done' THEN 1 END) as done_tasks,
  COUNT(CASE WHEN i.type = 'Task' THEN 1 END) as total_tasks,
  COUNT(CASE WHEN i.status = 'Blocked' THEN 1 END) as blocked_count,
  COUNT(CASE WHEN i.type = 'Issue' AND i.risk_level IN ('Critical', 'High') THEN 1 END) as high_risks,
  (SELECT MIN(end_date) FROM items 
   WHERE project_id = p.id AND type = 'Milestone' AND end_date >= date('now')
  ) as next_milestone_date
FROM projects p
LEFT JOIN items i ON p.id = i.project_id
WHERE p.status = 'InProgress'
GROUP BY p.id;
```

---

## 7. Component Architecture

```
Dashboard/
├── DashboardContainer.tsx      # Main layout, data fetching
├── PortfolioSummary/
│   ├── SummaryBar.tsx          # Top metrics bar
│   └── ProgressIndicator.tsx   # On-track percentage
├── ProjectTable/
│   ├── TableContainer.tsx      # Table with filters and sorting
│   ├── TableHeader.tsx         # Sortable column headers
│   ├── TableRow.tsx            # Individual project row
│   ├── TableFilters.tsx        # Multi-filter sidebar/popup
│   ├── HealthBadge.tsx         # Status badge component
│   └── ProgressBar.tsx         # Visual progress bar
├── ChangeFeed/
│   ├── FeedContainer.tsx       # Feed list
│   ├── FeedItem.tsx            # Individual event
│   └── FeedFilters.tsx         # Event type toggles
├── MilestoneList/
│   ├── MilestoneTable.tsx      # Milestone rows
│   └── MilestoneStatus.tsx     # Status badge
└── RiskSummary/
    ├── RiskBar.tsx             # Risk distribution
    └── RiskBadge.tsx           # Individual risk level
```

---

## 8. State Management

```typescript
interface DashboardState {
  // Data
  portfolioMetrics: PortfolioMetrics | null;
  projectHealthList: ProjectHealth[];
  changeFeed: ChangeEvent[];
  upcomingMilestones: Milestone[];
  riskSummary: RiskSummary;
  
  // UI State
  loading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
  
  // Filters
  selectedPortfolioId: string | null;
  feedDateRange: 'day' | 'week' | 'month';
  feedEventTypes: string[];
}

interface PortfolioMetrics {
  activeProjects: number;
  totalTasks: number;
  openIssues: number;
  upcomingMilestones: number;
  onTrackPercentage: number;
  atRiskCount: number;
  blockedCount: number;
}

interface ProjectHealth {
  id: string;
  name: string;
  status: 'on_track' | 'at_risk' | 'critical' | 'blocked';
  progressPercent: number;
  doneTasks: number;
  totalTasks: number;
  nextMilestone: { name: string; date: Date; status: string } | null;
  blockerCount: number;
  highRiskCount: number;
}

interface ChangeEvent {
  id: string;
  type: 'created' | 'updated' | 'completed' | 'conflict' | 'sync' | 'deleted';
  entityType: 'Item' | 'Project';
  entityId: string;
  entityName: string;
  projectName: string;
  timestamp: Date;
  details: string;
}
```

---

## 9. Performance Requirements

| Metric | Target |
|--------|--------|
| Initial Load | < 2 seconds for 50 projects |
| Refresh | < 1 second |
| Change Feed Query | < 500ms |
| Memory | < 50MB for dashboard state |

---

## 10. Acceptance Criteria

| AC# | Criteria | Test Method |
|-----|----------|-------------|
| AC-01 | Summary bar shows correct counts | Integration test |
| AC-02 | Project cards display health status | Integration test |
| AC-03 | Health status calculated correctly | Unit test |
| AC-04 | Change feed shows last 7 days | Integration test |
| AC-05 | Click project card navigates to detail | E2E test |
| AC-06 | Click milestone navigates to detail | E2E test |
| AC-07 | Auto-refresh updates data | E2E test |
| AC-08 | Dashboard loads in < 2 seconds | Performance test |
| AC-09 | Risk summary aggregates correctly | Unit test |
| AC-10 | Filter by portfolio works | E2E test |

---

## 11. Related Documents

- @PRD-001-Master.md — Master PRD
- @PRD-002-DataModel.md — Project and item schema
- @PRD-008-Governance.md — Audit log for change feed

---

*End of PRD-006*
