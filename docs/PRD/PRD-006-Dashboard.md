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



### 4.6 Workflow Distribution (NEW)



Displays current distribution of work items across workflow states by type.



**Layout:**



```

┌─────────────────────────────────────────────────────────────────┐

│  WORKFLOW DISTRIBUTION                                          │

│  ─────────────────────────────────────────────────────────────  │

│  ┌───────────────────────────────────────────────────────────┐  │

│  │  [Stories]  [Tasks]  [Bugs]  [Spikes]                    │  │

│  └───────────────────────────────────────────────────────────┘  │

│                                                                 │

│  Backlog ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 12 │

│  Ready ━━━━━━━━━━ 5                                            │

│  In Progress ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 18        │

│  In Review ━━━━━━━━━━━━ 8                                      │

│  In Test ━━━━━━━━━━━━━━━━ 10                                   │

│  Done ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 45   │

│                                                                 │

│  [View Cumulative Flow Chart]                                  │

└─────────────────────────────────────────────────────────────────┘

```



**Click Actions:**

- Click a status bar → Filter item list by that status

- Click "View Cumulative Flow Chart" → Open CFD visualization modal



**CFD Visualization:**



```

┌─────────────────────────────────────────────────────────────────┐

│  CUMULATIVE FLOW DIAGRAM - Last 30 Days                        │

│  ─────────────────────────────────────────────────────────────  │

│  Count                                                           │

│   60 │                               ╱━━━━━━━━  Done             │

│      │                          ╱━━━━━━━                         │

│   40 │                    ╱━━━━━━━━━    In Test                  │

│      │               ╱━━━━━━━━                                     │

│   20 │          ╱━━━━━━━━━       In Review                       │

│      │     ╱━━━━━━━━                                             │

│    0 │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━▶        │

│        Jan 1    Jan 8    Jan 15   Jan 22   Jan 29                │

└─────────────────────────────────────────────────────────────────┘

```



**Metrics Calculated:**

- **Cycle Time**: Average time from "In Progress" → "Done"

- **Lead Time**: Average time from "Backlog" → "Done"

- **Work in Progress (WIP)**: Total items not in "Done"/"Closed"

- **Flow Efficiency**: (Active work time / Total lead time) × 100%



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

  // ===== PRIORITY 1: Hard Blockers =====

  if (project.blockedCount > 0) return 'blocked';



  // ===== PRIORITY 2: Critical Issues =====

  // Overdue milestones

  if (project.overdueMilestones > 0) return 'critical';



  // Critical severity bugs in "In Fix" state

  if (project.criticalBugsInFix > 0) return 'critical';



  // More than 3 high-severity bugs open

  if (project.openHighSeverityBugs > 3) return 'critical';



  // ===== PRIORITY 3: At Risk Indicators =====

  // Stalled work items (In Progress > 7 days without status change)

  if (project.stalledInProgressCount > 5) return 'at_risk';



  // High risk issues from risk assessment

  if (project.highRisks > 0) return 'at_risk';



  // Stories in In Test for > 5 days (testing bottleneck)

  if (project.stalledInTestCount > 3) return 'at_risk';



  // Milestones due within 3 days with incomplete prerequisites

  if (project.imminentMilestonesAtRisk > 0) return 'at_risk';



  // Active spikes overdue (research blocking progress)

  if (project.overdueSpikes > 0) return 'at_risk';



  // ===== PRIORITY 4: Consideration =====

  // Large backlog may indicate capacity planning issues

  if (project.backlogSize > 50) return 'needs_attention';



  // Low story completion rate (< 50% of stories in Done)

  if (project.storyCompletionRate < 0.5) return 'needs_attention';



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

## 4.x Related Documents

- [Dashboard 架构与 IPC 参考](../architecture/ipc-handlers-reference.md)

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

-- Per-project health metrics (ENHANCED FOR WORKFLOW)

SELECT

  p.id, p.name, p.status,



  -- Story metrics

  COUNT(CASE WHEN i.type = 'Story' AND i.status = 'Backlog' THEN 1 END) as stories_backlog,

  COUNT(CASE WHEN i.type = 'Story' AND i.status = 'In Progress' THEN 1 END) as stories_in_progress,

  COUNT(CASE WHEN i.type = 'Story' AND i.status = 'In Test' THEN 1 END) as stories_in_test,

  COUNT(CASE WHEN i.type = 'Story' AND i.status = 'Done' THEN 1 END) as stories_done,



  -- Bug metrics

  COUNT(CASE WHEN i.type = 'Bug' AND i.status IN ('New', 'Triage', 'In Fix') THEN 1 END) as bugs_open,

  COUNT(CASE WHEN i.type = 'Bug' AND i.status = 'In Fix' AND i.severity IN ('High', 'Critical') THEN 1 END) as critical_bugs_in_fix,

  COUNT(CASE WHEN i.type = 'Bug' AND i.severity IN ('High', 'Critical') THEN 1 END) as open_high_severity_bugs,



  -- Spike metrics

  COUNT(CASE WHEN i.type = 'Spike' AND i.status != 'Closed' THEN 1 END) as active_spikes,

  COUNT(CASE WHEN i.type = 'Spike' AND i.status != 'Closed' AND i.end_date < date('now') THEN 1 END) as overdue_spikes,



  -- General metrics

  COUNT(CASE WHEN i.status = 'Blocked' THEN 1 END) as blocked_count,

  COUNT(CASE WHEN i.type IN ('Story', 'Task') AND i.status = 'Done' THEN 1 END) as done_tasks,

  COUNT(CASE WHEN i.type IN ('Story', 'Task') THEN 1 END) as total_tasks,



  -- Stalled work items (In Progress > 7 days without update)

  COUNT(CASE

    WHEN i.status = 'In Progress'

    AND julianday('now') - julianday(i.updated_at) > 7

    THEN 1

  END) as stalled_in_progress,



  -- Testing bottlenecks (In Test > 5 days)

  COUNT(CASE

    WHEN i.status = 'In Test'

    AND julianday('now') - julianday(i.updated_at) > 5

    THEN 1

  END) as stalled_in_test,



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

├── WorkflowDistribution/       # NEW

│   ├── DistributionCard.tsx    # Tabbed distribution view

│   ├── StatusFlowChart.tsx     # Flow diagram

│   └── CumulativeFlowChart.tsx # CFD visualization

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

  workflowMetrics: WorkflowMetrics; // NEW



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



  // NEW: Workflow-specific metrics

  storiesInBacklog: number;

  storiesInProgress: number;

  storiesInReview: number;

  storiesInTest: number;

  bugsOpen: number;

  bugsInFix: number;

  activeSpikes: number;

}



interface ProjectHealth {

  id: string;

  name: string;

  status: 'on_track' | 'at_risk' | 'critical' | 'blocked' | 'needs_attention';

  progressPercent: number;

  doneTasks: number;

  totalTasks: number;

  nextMilestone: { name: string; date: Date; status: string } | null;

  blockerCount: number;

  highRiskCount: number;



  // NEW: Workflow health indicators

  storyCompletionRate: number; // Done / Total Stories

  bugFixRate: number; // Closed / (Closed + In Fix)

  stalledInProgressCount: number; // Items in In Progress > 7 days

  stalledInTestCount: number; // Stories in In Test > 5 days

  openHighSeverityBugs: number; // High + Critical severity open

  overdueSpikes: number; // Spikes past due date

  backlogSize: number; // Stories in Backlog

}



// NEW: Workflow distribution metrics (for CFD visualization)

interface WorkflowMetrics {

  byType: {

    stories: WorkflowDistribution;

    tasks: WorkflowDistribution;

    bugs: WorkflowDistribution;

    spikes: WorkflowDistribution;

  };

  history: WorkflowHistoryEntry[]; // For CFD over time

}



interface WorkflowDistribution {

  status: Record<string, number>;

  total: number;

}



interface WorkflowHistoryEntry {

  date: Date;

  byStatus: Record<string, number>;

}



interface ChangeEvent {

  id: string;

  type: 'created' | 'updated' | 'completed' | 'conflict' | 'sync' | 'deleted' | 'status_transition';

  entityType: 'Item' | 'Project';

  entityId: string;

  entityName: string;

  projectName: string;

  timestamp: Date;

  details: string;

  fromStatus?: string; // For status transitions

  toStatus?: string;   // For status transitions

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

| **AC-11** | **Health calculation includes stalled work items** | Unit test |

| **AC-12** | **Critical bugs in fix trigger 'critical' health** | Unit test |

| **AC-13** | **Workflow distribution displays correct counts** | Integration test |

| **AC-14** | **CFD shows 30-day history** | Integration test |

| **AC-15** | **Cycle time and lead time metrics calculated** | Unit test |

| **AC-16** | **WIP count displayed accurately** | Integration test |



---

## 11. Related Documents



- @PRD-001-Master.md — Master PRD

- @PRD-002-DataModel.md — Project and item schema (includes workflow definitions)

- @PRD-008-Governance.md — Audit log for change feed

- @PRD-009-WorkflowEngine.md — (FUTURE) Workflow state machine implementation



---



## 12. Workflow-Specific Considerations



### 12.1 Health Status Rules for Different Item Types



| Item Type | At-Risk Indicators | Critical Indicators |

|-----------|-------------------|---------------------|

| **Story** | In Test > 5 days | Blocked |

| **Task** | In Progress > 7 days | Blocked |

| **Bug** | High severity > 3 days open | Critical severity in In Fix |

| **Spike** | In Research > 14 days | Overdue (past end_date) |

| **Milestone** | Due within 3 days | Overdue |



### 12.2 Workflow Metrics for Dashboard



```typescript

interface WorkflowHealthMetrics {

  // Story flow health

  stories: {

    backlog: number;

    ready: number;

    inProgress: number;

    inReview: number;

    inTest: number;

    done: number;

    cycleTimeAvg: number; // days from Ready → Done

    blocked: number;

  };



  // Bug flow health

  bugs: {

    new: number;

    inTriage: number;

    inFix: number;

    inVerification: number;

    closed: number;

    fixTimeAvg: number; // days from In Fix → Closed

    criticalInFix: number; // 🔴 Critical alert

  };



  // Spike flow health

  spikes: {

    proposed: number;

    inResearch: number;

    findingsReady: number;

    closed: number;

    overdue: number; // 🔴 Alert if > 0

  };



  // Overall flow metrics

  aggregate: {

    totalWIP: number;

    avgCycleTime: number;

    avgLeadTime: number;

    flowEfficiency: number; // percentage

  };

}

```



### 12.3 Ant Design v5 Component Mapping



```typescript

// Workflow Distribution Card

import { Card, Tabs, Statistic, Progress, Row, Col } from 'antd';



const { TabPane } = Tabs;



function WorkflowDistributionCard({ data }: { data: WorkflowMetrics }) {

  return (

    <Card title="Workflow Distribution" extra={<a href="#">View CFD</a>}>

      <Tabs defaultActiveKey="stories">

        <TabPane tab="Stories" key="stories">

          <WorkflowFlow data={data.stories} flow={STORY_FLOW} />

        </TabPane>

        <TabPane tab="Bugs" key="bugs">

          <WorkflowFlow data={data.bugs} flow={BUG_FLOW} />

        </TabPane>

        <TabPane tab="Spikes" key="spikes">

          <WorkflowFlow data={data.spikes} flow={SPIKE_FLOW} />

        </TabPane>

      </Tabs>

    </Card>

  );

}



// Cumulative Flow Chart (using Ant Design charts or external library)

function CumulativeFlowChart({ history }: { history: WorkflowHistoryEntry[] }) {

  // Implementation using Recharts, ECharts, or Ant Design Charts

  return (

    <Card title="Cumulative Flow Diagram - Last 30 Days">

      <ResponsiveContainer width="100%" height={300}>

        <AreaChart data={history}>

          <XAxis dataKey="date" />

          <YAxis />

          {/* Stacked areas for each status */}

          <Area dataKey="backlog" stackId="1" fill="#8884d8" />

          <Area dataKey="inProgress" stackId="1" fill="#82ca9d" />

          {/* ... other statuses */}

        </AreaChart>

      </ResponsiveContainer>

    </Card>

  );

}

```



---

*End of PRD-006*
