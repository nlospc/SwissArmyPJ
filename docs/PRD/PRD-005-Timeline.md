# PRD-005: Timeline / Gantt Specification

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-005 |
| **Parent** | @PRD-001-Master.md |
| **Status** | Draft |
| **Date** | 2026-01-30 |

---

## 1. Overview

The Timeline/Gantt view provides an Excel-like interface for viewing and editing project schedules. It prioritizes simplicity over complex auto-scheduling.

**Dependencies**: @PRD-002-DataModel.md
**Dependents**: @PRD-007-Reporting.md (timeline export)

---

## 2. Design Principles

| Principle | Description |
|-----------|-------------|
| **Excel-like** | Familiar spreadsheet feel; no steep learning curve |
| **Lightweight** | No complex CPM/PERT calculations; user controls dates |
| **Visual Clarity** | Distinct icons for Tasks, Milestones, Issues, Phases |
| **Direct Manipulation** | Drag bars to edit dates; inline cell editing |

---

## 3. View Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Timeline: Project Alpha                     [Day▼] [Filter▼] [Export CSV] │
├─────────────────────────────────────────────────────────────────────────────┤
│  LEFT PANEL (Table)              │  RIGHT PANEL (Timeline)                  │
│  ──────────────────────────────  │  ────────────────────────────────────── │
│  Name          │Start   │End     │  Jan 27 │ Jan 28 │ Jan 29 │ Jan 30 │... │
│  ──────────────┼────────┼────────┼─────────┼────────┼────────┼────────┼─── │
│  ▼ Phase 1     │01-15   │02-15   │ [══════════════════════════]            │
│    Task A      │01-20   │01-25   │         ████████                        │
│    Task B      │01-25   │02-01   │                  ████████████           │
│    ◆ MS1       │02-01   │        │                           ◆             │
│  ▼ Phase 2     │02-15   │03-15   │                              [═════════ │
│    Task C      │02-15   │02-28   │                               █████████ │
│    ⚠ Issue 1   │02-20   │        │                                   ⚠     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Visual Elements

### 4.1 Item Types

| Type | Left Panel Icon | Timeline Symbol | Color |
|------|-----------------|-----------------|-------|
| Task | (none) | Solid bar `████` | Blue |
| Sub-Task | └─ indent | Thinner bar | Light blue |
| Milestone | ◆ | Diamond `◆` | Purple |
| Phase | ▼ (collapsible) | Bracket `[═══]` | Gray |
| Issue | ⚠ | Warning icon `⚠` | Orange |
| Clash | ⛔ | Conflict icon | Red |
| Remark | 💬 | Note icon | Yellow |

### 4.2 Status Colors

| Status | Bar Color | Icon Overlay |
|--------|-----------|--------------|
| NotStarted | Gray outline | — |
| InProgress | Solid blue | — |
| Blocked | Red hatched | 🚫 |
| Done | Green | ✓ |

### 4.3 Dependency Lines (Optional)

When enabled, show connector lines between predecessor and successor:

```
  Task A  ████████────┐
                      │
  Task B              └──▶████████
```

**MVP**: Dependency lines disabled by default. Violations shown as Clash icons only.

---

## 5. Time Scale Options

| Scale | Grid Unit | Label Format | Use Case |
|-------|-----------|--------------|----------|
| Day | 1 day | "Jan 30" | Detailed sprint view |
| Week | 7 days | "W5 2026" | Sprint/iteration view |
| Month | ~30 days | "Jan 2026" | Quarterly planning |
| Quarter | ~90 days | "Q1 2026" | Annual roadmap |

---

## 6. Left Panel (Table)

### 6.1 Default Columns

| Column | Width | Editable | Sort |
|--------|-------|----------|------|
| Name | 200px | ✅ | ✅ |
| Type | 80px | ✅ (dropdown) | ✅ |
| Start | 90px | ✅ (date picker) | ✅ |
| End | 90px | ✅ (date picker) | ✅ |
| Status | 100px | ✅ (dropdown) | ✅ |
| Owner | 100px | ✅ | ✅ |
| Priority | 80px | ✅ (dropdown) | ✅ |

### 6.2 Column Customization

Users can:
- Show/hide columns
- Reorder columns (drag header)
- Resize columns (drag border)
- Add custom field columns

### 6.3 Inline Editing

- Click cell to edit
- Tab to next cell
- Enter to confirm, Esc to cancel
- Date cells open date picker

---

## 7. Right Panel (Timeline)

### 7.1 Rendering

```typescript
interface TimelineItem {
  id: string;
  name: string;
  type: 'Task' | 'Milestone' | 'Phase' | 'Issue';
  start_date: Date | null;
  end_date: Date | null;
  status: string;
  indent_level: number;
  parent_id: string | null;
}

// Bar positioning
function calculateBarPosition(item: TimelineItem, scale: TimeScale): BarPosition {
  const startX = dateToPixel(item.start_date, scale);
  const endX = dateToPixel(item.end_date || item.start_date, scale);
  const width = Math.max(endX - startX, MIN_BAR_WIDTH);
  return { x: startX, width };
}
```

### 7.2 Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Select item | Click bar/row | Highlight row + bar |
| Edit dates | Drag bar | Update start/end |
| Extend/shrink | Drag bar edge | Update end only |
| Move item | Drag bar center | Update both dates (duration preserved) |
| Zoom | Ctrl + scroll | Change time scale |
| Pan | Drag timeline bg | Scroll horizontally |
| Open detail | Double-click | Open item editor modal |

### 7.3 Drag Constraints

- Bars cannot extend before project start
- Bars cannot extend after project end (warning only)
- Milestones snap to single date
- Minimum bar width: 1 day equivalent in pixels

---

## 8. Dependency Validation

### 8.1 Constraint Types

| Type | Code | Rule |
|------|------|------|
| Finish-to-Start | FS | Successor.start >= Predecessor.end |
| Start-to-Start | SS | Successor.start >= Predecessor.start |
| Finish-to-Finish | FF | Successor.end >= Predecessor.end |

### 8.2 Violation Handling

**MVP Approach**: Validate on edit, show warning, allow save.

```
┌─────────────────────────────────────────────────┐
│  ⚠️ Dependency Warning                          │
│                                                 │
│  "Task B" starts before "Task A" ends.         │
│  This violates the Finish-to-Start constraint. │
│                                                 │
│  Predecessor: Task A (ends 2026-01-30)         │
│  Successor: Task B (starts 2026-01-28)         │
│                                                 │
│  [Save Anyway]  [Adjust Dates]  [Cancel]       │
└─────────────────────────────────────────────────┘
```

### 8.3 Clash Indicator

When saved with violation:
- Clash icon (⛔) appears on timeline
- Item row highlighted in red
- Tooltip shows violation details

---

## 9. Filtering & Grouping

### 9.1 Quick Filters

| Filter | Options |
|--------|---------|
| Status | All, Active (not Done), Done, Blocked |
| Type | All, Tasks, Milestones, Issues |
| Owner | All, (list of owners) |
| Priority | All, Critical, High, Medium, Low |
| Date Range | All, This Week, This Month, Custom |

### 9.2 Grouping

| Group By | Behavior |
|----------|----------|
| None | Flat list, sorted by start date |
| Phase | Group under parent Phase items |
| Owner | Group by assignee |
| Status | Group by status |

---

## 10. Export

### 10.1 CSV Export

Export left panel table as CSV:

```csv
Name,Type,Start,End,Status,Owner,Priority
"Phase 1",Phase,2026-01-15,2026-02-15,InProgress,,
"Task A",Task,2026-01-20,2026-01-25,Done,Alice,Medium
"Task B",Task,2026-01-25,2026-02-01,InProgress,Bob,High
"MS1",Milestone,2026-02-01,,NotStarted,,High
```

### 10.2 Image Export (Phase 2)

Export timeline view as PNG:
- Rendered server-side or via html2canvas
- Configurable date range
- Optional: include legend

---

## 11. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ↑ / ↓ | Navigate rows |
| ← / → | Navigate cells |
| Enter | Edit selected cell / Open detail |
| Esc | Cancel edit |
| Delete | Delete selected item (with confirm) |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+F | Focus filter |
| +/- | Zoom in/out |

---

## 12. Technical Implementation

### 12.1 Component Structure

```
TimelineView/
├── TimelineContainer.tsx    # Main layout, state management
├── TablePanel/
│   ├── TableHeader.tsx      # Column headers, sorting
│   ├── TableRow.tsx         # Single row with cells
│   └── CellEditor.tsx       # Inline edit components
├── GanttPanel/
│   ├── GanttHeader.tsx      # Time scale header
│   ├── GanttGrid.tsx        # Background grid lines
│   ├── GanttBar.tsx         # Individual bar/milestone
│   └── DependencyLines.tsx  # Connector lines (optional)
├── TimelineFilters.tsx      # Filter controls
└── TimelineToolbar.tsx      # Zoom, export, settings
```

### 12.2 State Management

```typescript
interface TimelineState {
  // Data
  items: TimelineItem[];
  dependencies: Dependency[];
  
  // View settings
  scale: 'day' | 'week' | 'month' | 'quarter';
  viewStart: Date;
  viewEnd: Date;
  
  // Filters
  statusFilter: string[];
  typeFilter: string[];
  ownerFilter: string[];
  
  // Selection
  selectedItemId: string | null;
  editingCellId: string | null;
  
  // Columns
  visibleColumns: string[];
  columnWidths: Record<string, number>;
}
```

### 12.3 Rendering Optimization

- Virtual scrolling for rows (react-window or similar)
- Canvas rendering for timeline bars (if > 500 items)
- Debounced re-render on filter changes
- Memoized bar position calculations

---

## 13. Database Queries

### 13.1 Load Timeline Items

```sql
SELECT 
  i.id, i.name, i.type, i.status, i.priority,
  i.start_date, i.end_date, i.owner,
  i.parent_id
FROM items i
WHERE i.project_id = ?
ORDER BY i.start_date, i.name;
```

### 13.2 Load Dependencies

```sql
SELECT 
  d.id, d.predecessor_id, d.successor_id, d.type, d.lag_days
FROM dependencies d
JOIN items i ON d.predecessor_id = i.id
WHERE i.project_id = ?;
```

---

## 14. Acceptance Criteria

| AC# | Criteria | Test Method |
|-----|----------|-------------|
| AC-01 | Table displays all project items | Integration test |
| AC-02 | Inline cell editing updates database | E2E test |
| AC-03 | Timeline bars render at correct positions | Visual test |
| AC-04 | Drag bar updates start/end dates | E2E test |
| AC-05 | Time scale switching re-renders correctly | Visual test |
| AC-06 | Dependency violation shows warning | E2E test |
| AC-07 | Filters reduce visible items correctly | Unit test |
| AC-08 | CSV export includes all visible columns | Integration test |
| AC-09 | 500 items render in < 2 seconds | Performance test |
| AC-10 | Keyboard navigation works | E2E test |

---

## 15. Related Documents

- @PRD-001-Master.md — Master PRD
- @PRD-002-DataModel.md — Item and dependency schema
- @PRD-007-Reporting.md — Timeline export for reports

---

*End of PRD-005*
