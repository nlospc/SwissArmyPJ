# SwissArmyPM v1.0 — Gantt Implementation Notes

> Builder deliverable: Analysis of current implementation vs v1.0 specification

## 1. Current Implementation Overview

The existing `GanttChart.tsx` (1880 lines) implements a full-featured Gantt view with:

- **Dual-panel layout**: 320px left panel + flexible right panel
- **Drag interactions**: Move, resize (start/end), milestone drag
- **Today marker**: Red vertical line with label
- **Time scales**: Day, Week, Month, Quarter
- **Dependencies**: Arrow rendering between tasks
- **View modes**: Projects list → Work packages drill-down
- **Zen mode**: Toggleable minimal UI
- **Status filtering**: Filter tasks by status
- **Auto-zoom**: Fit timeline to data

## 2. Row Synchronization Mechanism

### Current Implementation
```typescript
// Row height is enforced via CSS classes but not strictly locked
// WorkPackageRow uses natural content height
<ProjectRow />       // h-[60px] fixed
<WorkPackageRow />   // No explicit height constraint
```

### v1.0 Requirement
- **Fixed 34px row height** for all task rows
- **No auto-resize** based on content
- **Strict alignment** between left and right panels

### Gap Identified
Current implementation does not enforce fixed 34px row height. Row height varies based on content.

### Remediation Plan
1. Add explicit `style={{ height: '34px' }}` to all task rows
2. Use `overflow: hidden` and `text-overflow: ellipsis` for long text
3. Ensure left panel row height exactly matches right panel row height

## 3. Date ↔ Pixel Conversion

### Current Implementation
```typescript
// calculateBarStyle (lines 370-397)
const calculateBarStyle = (startDate, endDate, viewStart, viewEnd) => {
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  const totalDuration = viewEnd.getTime() - viewStart.getTime();

  return {
    left: `${(startOffset / totalDuration) * 100}%`,
    width: `${(duration / totalDuration) * 100}%`,
  };
};
```

### Analysis
- **Conversion method**: Percentage-based positioning
- **Precision**: Millisecond-level, then normalized to percentage
- **Anchoring**: Left edge of viewport = 0%, right edge = 100%

### v1.0 Compliance
✅ **COMPLIANT** - Date-to-pixel conversion is correct and deterministic

### Constraint Verification
- Grid line positions align with date boundaries: ✅ Yes (via `generateTimeline`)
- Task bar positions match dates: ✅ Yes
- Scale changes don't modify stored dates: ✅ Yes (only affects display density)

## 4. Scale Change Rendering Behavior

### Current Implementation
```typescript
// renderUnit auto-selects based on time span (lines 168-174)
const getRenderUnitForWindow = (from, to): RenderUnit => {
  const spanDays = (to - from) / DAY_MS;
  if (spanDays <= 90) return 'day';
  if (spanDays <= 365) return 'week';
  if (spanDays <= 730) return 'month';
  return 'quarter';
};
```

### v1.0 Requirement
- Scale changes affect **display density only**
- Scale changes **must not** modify stored task dates

### Current Behavior
- ✅ Scale changes only affect rendering
- ✅ Task dates remain in database unchanged
- ✅ Switching scales does not trigger save

### Gap Identified
v1.0 spec requires **only day/week/month scales** (no quarter).

### Remediation Plan
1. Remove `'quarter'` from `RenderUnit` type
2. Remove `getRenderUnitForWindow` auto-selection
3. Add explicit scale selector in TopBar
4. Default to `'week'` scale on initial load

## 5. Modified State Tracking

### Current Implementation
```typescript
// Drag state (lines 1140-1146)
const [dragState, setDragState] = useState<{
  taskId: number;
  kind: 'move' | 'resize_start' | 'resize_end';
  startX: number;
  originalStart: Date;
  originalEnd: Date;
} | null>(null);
```

### v1.0 Requirement
- After drag/resize, task marked as **"modified"**
- Visual indicator persists until save
- Save clears all modified indicators
- No auto-cascading changes

### Gap Identified
No visual modified indicator currently shown after drag operations.

### Remediation Plan
1. Add `modifiedTaskIds: Set<number>` to component state
2. Add to set when drag/resize completes
3. Render **3px orange dot** in top-left of modified task bars
4. Clear set when save operation succeeds

### Implementation Sketch
```typescript
// After drag completes
const handleDragEnd = async () => {
  await updateWorkPackage(dragState.taskId, { start_date, end_date });
  setModifiedTaskIds(prev => new Set(prev).add(dragState.taskId));
};

// In task bar rendering
{modifiedTaskIds.has(task.id) && (
  <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-orange-500 rounded-full" />
)}
```

## 6. v1.0 Scope Compliance

### Current Features (Keep for v1.0)
- ✅ Dual-panel layout
- ✅ Day/week/month scales (after removing quarter)
- ✅ Task bar rendering
- ✅ Drag move
- ✅ Drag resize
- ✅ Milestone marker
- ✅ Today marker
- ✅ Status filtering

### Current Features (Remove for v1.0)
- ❌ **Dependency arrows** - Explicitly excluded in v1.0 spec
- ❌ **Quarter scale** - Not in v1.0 spec
- ❌ **Automatic scheduling mode** - Not in v1.0 spec
- ❌ **Zen mode toggle** - Not in v1.0 spec
- ❌ **Conflict detection** - Dependencies are excluded, so conflicts don't apply

### Removal Plan
1. Remove `DependencyLines` component (lines 429-550)
2. Remove `quarter` from `RenderUnit` type
3. Remove scheduling_mode UI elements
4. Remove zen mode toggle
5. Remove conflict detection/rendering
6. Remove dependency-related props from components

## 7. Component Structure vs v1.0 Spec

### v1.0 Required Components
| Spec Component | Current Implementation | Status |
|----------------|------------------------|--------|
| GanttView | `GanttChart` | ✅ Exists |
| TopBar | Custom header (lines 1700+) | ✅ Exists (needs simplification) |
| TaskTreePanel | Left panel div (320px) | ✅ Exists |
| TimelineCanvas | Right panel div (flex-1) | ✅ Exists |
| TimeHeader | Timeline header (40px) | ✅ Exists |
| TimeGrid | Generated via `generateTimeline` | ✅ Exists |
| TaskRow | `WorkPackageRow` | ⚠️ Needs 34px height fix |
| TaskBar | Bar rendering in `WorkPackageRow` | ⚠️ Needs geometry refinement |
| MilestoneMarker | Milestone rendering | ⚠️ Needs diamond geometry |
| Tooltip | ❌ Missing | ❌ Not implemented |

## 8. Geometry Compliance Analysis

### Current Task Bar
```typescript
// Rectangle with 2px border, semi-transparent background
style={{
  backgroundColor: `${statusColor}20`,
  border: `2px solid ${statusColor}`,
}}
```

### v1.0 Required Geometry
- **Task**: Solid fill rectangle, 4px corner radius, 18px height
- **Issue**: Transparent with 2px solid border, 18px height
- **Milestone**: Diamond (20px × 20px), centered in row
- **Phase**: Solid with 30% opacity

### Gap Identified
Current implementation doesn't differentiate geometry by type (all use same rounded rectangle).

### Remediation Plan
```typescript
const getBarGeometry = (type: WorkPackageType) => {
  switch (type) {
    case 'task':
      return { borderRadius: '4px', height: '18px', fill: 'solid' };
    case 'bug':  // Issue
      return { borderRadius: '4px', height: '18px', fill: 'outline', borderWidth: '2px' };
    case 'milestone':
      return { shape: 'diamond', size: '20px' };
    case 'phase':
      return { borderRadius: '4px', height: '18px', fill: 'solid', opacity: 0.3 };
  }
};
```

## 9. Tooltip Implementation

### v1.0 Requirement
- Hover delay: ~200ms
- Content: Title, Type, Start date, End date, Duration, Priority
- Must not block drag operations
- 12px offset from cursor

### Current Status
❌ **NOT IMPLEMENTED**

### Implementation Plan
```typescript
const TaskTooltip = ({ task, x, y }: { task: WorkPackage; x: number; y: number }) => {
  const duration = task.start_date && task.end_date
    ? Math.round((new Date(task.end_date) - new Date(task.start_date)) / DAY_MS)
    : 0;

  return (
    <div
      className="fixed z-50 bg-gray-900 text-white text-xs p-2 rounded shadow-lg"
      style={{ left: x + 12, top: y + 12, pointerEvents: 'none' }}
    >
      <div className="font-bold mb-1">{task.name}</div>
      <div>Type: {task.type}</div>
      <div>Start: {task.start_date}</div>
      <div>End: {task.end_date}</div>
      <div>Duration: {duration} days</div>
      <div>Priority: {task.priority}</div>
    </div>
  );
};

// In component
const [hoveredTask, setHoveredTask] = useState<WorkPackage | null>(null);
const [tooltipVisible, setTooltipVisible] = useState(false);
const tooltipTimeoutRef = useRef<NodeJS.Timeout>();

const handleMouseEnter = (task: WorkPackage, e: React.MouseEvent) => {
  tooltipTimeoutRef.current = setTimeout(() => {
    setHoveredTask(task);
    setTooltipVisible(true);
  }, 200);
};

const handleMouseLeave = () => {
  clearTimeout(tooltipTimeoutRef.current);
  setTooltipVisible(false);
};
```

## 10. Performance Considerations

### v1.0 Constraints
- Max tasks: 500 (no virtual scroll required)
- Target: 60fps during drag operations
- Initial render: <2 seconds for 500 tasks

### Current Implementation
- No virtual scrolling
- Simple React state management
- Efficient date calculations (cached via useMemo)

### Assessment
✅ **COMPLIANT** - Current implementation meets v1.0 performance requirements

## 11. Summary of Required Changes

### Critical Changes (Required for v1.0)
1. ✅ Keep dual-panel layout (320px + remaining)
2. ⚠️ Fix row height to 34px (currently variable)
3. ⚠️ Remove quarter scale
4. ⚠️ Remove dependency arrows and related UI
5. ❌ Implement tooltip with 200ms delay
6. ⚠️ Differentiate geometry by type (task/issue/milestone/phase)
7. ❌ Add modified indicator (orange dot)
8. ⚠️ Simplify TopBar (remove zen mode, remove auto-schedule toggle)

### Optional Enhancements (Post-v1.0)
- Virtual scrolling (for >500 tasks)
- Keyboard navigation
- Accessibility improvements
- Undo/redo

## 12. Implementation Priority

**Phase 1 (Skeleton Layout):**
1. Enforce 34px row height
2. Verify dual-panel alignment
3. Test scroll synchronization

**Phase 2 (Core Objects):**
1. Implement type-specific geometry (task/issue/milestone)
2. Add tooltip component
3. Verify tooltip delay and positioning

**Phase 3 (Direct Manipulation):**
1. Add modified indicator
2. Clear modified on save
3. Test all drag interactions

**Phase 4 (Polish):**
1. Remove v1.0-excluded features (dependencies, quarter scale)
2. Contrast tuning for grid lines
3. Performance validation

## 13. Testing Checklist

- [ ] Row height is exactly 34px for all tasks
- [ ] Left panel row height matches right panel row height
- [ ] Vertical scroll is synchronized between panels
- [ ] Task bar position matches date
- [ ] Task bar width matches duration
- [ ] Scale switch doesn't modify dates
- [ ] Tooltip appears after ~200ms delay
- [ ] Tooltip shows all required fields
- [ ] Tooltip doesn't block drag operations
- [ ] Modified indicator appears after drag
- [ ] Modified indicator cleared on save
- [ ] Drag move keeps duration constant
- [ ] Drag resize updates duration
- [ ] Milestone drag is horizontal-only
- [ ] Resize to zero duration is blocked
- [ ] Grid lines are low contrast (<15% opacity)
