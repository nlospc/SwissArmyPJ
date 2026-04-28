# PRD-103 - Timeline Work Items Pseudocode

| Field | Value |
|-------|-------|
| PRD ID | PRD-103 |
| Status | Draft for review |
| Module | Timeline |
| Parent | `docs/PRD/PRD-001-Master.md` |
| Last Updated | 2026-04-28 |

This document translates the human-owned Timeline intent into implementation
pseudocode. It is not final production code and should be reviewed before the
task moves to implementation.

## 1. Product Position

Timeline is a PM Workspace view for structured Work Items over time. It is not
a decorative chart and it is not a portfolio roadmap. It should help a project
manager inspect hierarchy, planned dates, actual dates, dependencies, risk, and
delay signals for project work.

The current candidate chart library is `react-calendar-timeline`, but all
business rules below must remain independent from the chart library.

## 2. Domain Model Pseudocode

```typescript
type WorkItemId = string;
type ProjectId = string;
type CalendarId = string;

type WorkItemType =
  | 'milestone'
  | 'phase'
  | 'workpackage'
  | 'subitem'
  | 'risk'
  | 'issue'
  | 'custom';

type WorkItemStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed';

type MilestoneState =
  | 'progressing'
  | 'risk'
  | 'delayed';

type DependencyType =
  | 'finish_to_start'
  | 'start_to_start'
  | 'finish_to_finish';

type DateOnly = string; // YYYY-MM-DD, stored without local time ambiguity.

interface WorkItem {
  id: WorkItemId;
  projectId: ProjectId;
  parentId: WorkItemId | null;
  sortOrder: number;

  title: string;
  description: string | null;
  type: WorkItemType;
  customTypeLabel: string | null;

  plannedStartDate: DateOnly | null;
  plannedEndDate: DateOnly | null;
  plannedWorkingDays: number | null;

  actualStartDate: DateOnly | null;
  actualEndDate: DateOnly | null;

  status: WorkItemStatus | null;
  milestoneState: MilestoneState | null;

  owner: string | null;
  dependencyNote: string | null;
  riskEvent: string | null;
  responseMeasure: string | null;

  calendarId: CalendarId | null;
  createdAt: string;
  updatedAt: string;
}

interface WorkItemDependency {
  id: string;
  projectId: ProjectId;
  predecessorId: WorkItemId;
  successorId: WorkItemId;
  type: DependencyType;
  lagWorkingDays: number;
}

interface WorkCalendar {
  id: CalendarId;
  projectId: ProjectId | null;
  locale: string;
  statutoryHolidaySource: string;
  customHolidays: DateOnly[];
  customWorkingDays: DateOnly[];
  weekendDays: number[]; // 0 Sunday through 6 Saturday.
}

interface RiskDelayState {
  isLateStartRisk: boolean;
  isLateFinishDelay: boolean;
  severity: 'none' | 'risk' | 'delay';
  reasons: string[];
}

interface ProjectRiskSignal {
  projectId: ProjectId;
  sourceType: 'milestone';
  sourceWorkItemId: WorkItemId;
  signal: 'risk' | 'delay';
  eventRequired: boolean;
  responseMeasureRequired: boolean;
}
```

## 3. Business Rule Pseudocode

### 3.1 Work Item Creation

```typescript
function createWorkItem(input, projectId, actor) {
  assertCanWriteProject(projectId, actor);

  const item = {
    id: generateId(),
    projectId,
    parentId: input.parentId ?? null,
    sortOrder: nextSortOrder(projectId, input.parentId),
    title: requireNonBlank(input.title),
    description: input.description ?? null,
    type: input.type,
    customTypeLabel: input.type === 'custom' ? requireNonBlank(input.customTypeLabel) : null,
    plannedStartDate: input.plannedStartDate ?? null,
    plannedEndDate: input.plannedEndDate ?? null,
    plannedWorkingDays: null,
    actualStartDate: null,
    actualEndDate: null,
    status: input.type === 'milestone' ? null : 'not_started',
    milestoneState: input.type === 'milestone' ? 'progressing' : null,
    owner: input.owner ?? null,
    dependencyNote: input.dependencyNote ?? null,
    riskEvent: null,
    responseMeasure: null,
    calendarId: input.calendarId ?? projectDefaultCalendar(projectId),
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  item.plannedWorkingDays = calculatePlannedWorkingDays(item, loadCalendar(item));
  validateWorkItemDates(item);

  insertWorkItem(item);
  writeAuditLog('timeline.work_item.created', actor, item.id, item);
  return item;
}
```

### 3.2 Date Range Editing

Planned dates must be edited by an explicit date range picker. The timeline
block is read-only for date mutation.

```typescript
function updatePlannedDateRange(itemId, range, actor) {
  const item = loadWorkItem(itemId);
  assertCanWriteProject(item.projectId, actor);

  const next = {
    ...item,
    plannedStartDate: range.startDate,
    plannedEndDate: range.endDate,
    updatedAt: nowIso()
  };

  validateWorkItemDates(next);
  next.plannedWorkingDays = calculatePlannedWorkingDays(next, loadCalendar(next));

  saveWorkItem(next);
  writeAuditLog('timeline.work_item.planned_dates_updated', actor, itemId, {
    before: pickPlannedDateFields(item),
    after: pickPlannedDateFields(next)
  });

  return withDerivedState(next);
}
```

### 3.3 Working Day Calculation

Custom working days override weekend and holiday rules. Custom holidays override
normal working days.

```typescript
function isWorkingDay(date, calendar) {
  if (calendar.customHolidays.includes(date)) return false;
  if (calendar.customWorkingDays.includes(date)) return true;
  if (calendar.weekendDays.includes(dayOfWeek(date))) return false;
  if (isStatutoryHoliday(date, calendar.locale, calendar.statutoryHolidaySource)) return false;
  return true;
}

function calculatePlannedWorkingDays(item, calendar) {
  if (!item.plannedStartDate || !item.plannedEndDate) return null;
  if (item.plannedEndDate < item.plannedStartDate) {
    throw ValidationError('planned_end_before_planned_start');
  }

  let days = 0;
  for (const date of eachDateInclusive(item.plannedStartDate, item.plannedEndDate)) {
    if (isWorkingDay(date, calendar)) days += 1;
  }

  return days;
}
```

Open decision: pick the first statutory holiday locale and define whether the
default calendar is project-level, workspace-level, or both.

### 3.4 Status Button Flow

```typescript
function clickStatusButton(itemId, actor, today = localToday()) {
  const item = loadWorkItem(itemId);
  assertCanWriteProject(item.projectId, actor);

  if (item.type === 'milestone') {
    throw ValidationError('milestone_status_button_not_allowed');
  }

  let next;
  if (item.status === 'not_started') {
    next = {
      ...item,
      status: 'in_progress',
      actualStartDate: item.actualStartDate ?? today,
      updatedAt: nowIso()
    };
  } else if (item.status === 'in_progress') {
    next = {
      ...item,
      status: 'completed',
      actualEndDate: item.actualEndDate ?? today,
      updatedAt: nowIso()
    };
  } else {
    throw ValidationError('completed_reopen_requires_explicit_flow');
  }

  saveWorkItem(next);
  writeAuditLog('timeline.work_item.status_changed', actor, itemId, {
    before: pickStatusFields(item),
    after: pickStatusFields(next)
  });

  return withDerivedState(next);
}
```

Open decision: define a separate explicit reopen flow if completed items should
be reopened.

### 3.5 Risk And Delay Derivation

```typescript
function deriveRiskDelayState(item) {
  const reasons = [];
  const isLateStartRisk =
    item.actualStartDate != null &&
    item.plannedStartDate != null &&
    item.actualStartDate > item.plannedStartDate;

  if (isLateStartRisk) reasons.push('actual_start_after_planned_start');

  const isLateFinishDelay =
    item.actualEndDate != null &&
    item.plannedEndDate != null &&
    item.actualEndDate > item.plannedEndDate;

  if (isLateFinishDelay) reasons.push('actual_end_after_planned_end');

  return {
    isLateStartRisk,
    isLateFinishDelay,
    severity: isLateFinishDelay ? 'delay' : isLateStartRisk ? 'risk' : 'none',
    reasons
  };
}

function withDerivedState(item) {
  return {
    ...item,
    derivedRiskDelay: deriveRiskDelayState(item)
  };
}
```

Derived risk/delay state should be recalculated from structured fields. If the
implementation stores cached flags for performance, the source date fields must
remain the audit source of truth.

### 3.6 Milestone Risk And Delay

Milestones do not use the normal status button flow.

```typescript
function updateMilestoneState(itemId, nextState, input, actor) {
  const item = loadWorkItem(itemId);
  assertCanWriteProject(item.projectId, actor);

  if (item.type !== 'milestone') {
    throw ValidationError('only_milestone_state_allowed');
  }

  if ((nextState === 'risk' || nextState === 'delayed') && !input.riskEvent) {
    throw ValidationError('milestone_risk_event_required');
  }

  if ((nextState === 'risk' || nextState === 'delayed') && !input.responseMeasure) {
    throw ValidationError('milestone_response_measure_required');
  }

  const next = {
    ...item,
    milestoneState: nextState,
    riskEvent: input.riskEvent ?? item.riskEvent,
    responseMeasure: input.responseMeasure ?? item.responseMeasure,
    updatedAt: nowIso()
  };

  saveWorkItem(next);
  writeAuditLog('timeline.milestone.state_changed', actor, itemId, {
    before: pickMilestoneFields(item),
    after: pickMilestoneFields(next)
  });

  syncProjectRiskSignalFromMilestone(next, actor);
  return next;
}

function syncProjectRiskSignalFromMilestone(milestone, actor) {
  if (milestone.milestoneState === 'progressing') {
    clearProjectRiskSignalForSource(milestone.id, actor);
    return;
  }

  upsertProjectRiskSignal({
    projectId: milestone.projectId,
    sourceType: 'milestone',
    sourceWorkItemId: milestone.id,
    signal: milestone.milestoneState === 'delayed' ? 'delay' : 'risk',
    eventRequired: true,
    responseMeasureRequired: true
  });
}
```

Open decision: decide whether milestone risk/delay also creates or links a Risk
Register item.

## 4. Timeline Adapter Pseudocode

The chart adapter receives already-derived item state and should not own domain
rules.

```typescript
function toTimelineGroups(items) {
  return visibleHierarchy(items).map(item => ({
    id: item.id,
    title: item.title,
    parentId: item.parentId,
    isCollapsed: readCollapseState(item.id),
    depth: calculateDepth(item)
  }));
}

function toTimelineItems(items) {
  return visibleHierarchy(items)
    .filter(item => item.plannedStartDate != null)
    .map(item => ({
      id: item.id,
      group: item.id,
      title: item.title,
      start_time: toTimelineDate(item.plannedStartDate),
      end_time: toTimelineDate(item.plannedEndDate ?? item.plannedStartDate),
      canMove: false,
      canResize: false,
      className: timelineClassName(item),
      itemProps: {
        'data-work-item-type': item.type,
        'data-risk-severity': item.derivedRiskDelay.severity
      }
    }));
}

function timelineClassName(item) {
  return classNames(
    `timeline-item--${item.type}`,
    item.status ? `timeline-item--${item.status}` : null,
    item.milestoneState ? `timeline-item--milestone-${item.milestoneState}` : null,
    item.derivedRiskDelay.isLateStartRisk ? 'timeline-item--risk' : null,
    item.derivedRiskDelay.isLateFinishDelay ? 'timeline-item--delay' : null
  );
}
```

## 5. Renderer Interaction Pseudocode

### 5.1 Main View

```tsx
function TimelineWorkItemsView({ projectId }) {
  const items = useTimelineStore(selectVisibleItems(projectId));
  const dependencies = useTimelineStore(selectDependencies(projectId));
  const scale = useTimelineStore(selectScale);

  return (
    <TimelineWorkspace>
      <TimelineToolbar
        scale={scale}
        onScaleChange={setScaleWithinBounds}
        onCreateItem={() => openWorkItemEditor({ mode: 'create' })}
      />
      <WorkItemTable
        items={items}
        onToggleCollapse={toggleCollapse}
        onEditItem={item => openWorkItemEditor({ mode: 'edit', itemId: item.id })}
        onClickStatus={item => timelineActions.clickStatusButton(item.id)}
      />
      <TimelineChart
        groups={toTimelineGroups(items)}
        items={toTimelineItems(items)}
        dependencies={dependencies}
        scale={scale}
        onItemMove={rejectTimelineDateMutation}
        onItemResize={rejectTimelineDateMutation}
        onCanvasScroll={setVisibleTimeWindow}
      />
      <WorkItemEditorDialog />
    </TimelineWorkspace>
  );
}
```

### 5.2 Date Range Picker

```tsx
function WorkItemEditorDialog() {
  const draft = useEditorDraft();

  return (
    <Modal>
      <TypeSelect value={draft.type} onChange={setType} />
      <DateRangePicker
        value={[draft.plannedStartDate, draft.plannedEndDate]}
        onChange={(startDate, endDate) => setPlannedDateRange(startDate, endDate)}
      />
      <ReadOnlyWorkingDays value={draft.plannedWorkingDaysPreview} />
      <SaveButton onClick={saveDraft} />
    </Modal>
  );
}
```

### 5.3 Zoom Bounds

```typescript
type TimelineScale = 'day' | 'week' | 'month';

function setScaleWithinBounds(nextScale) {
  if (!['day', 'week', 'month'].includes(nextScale)) return;
  timelineStore.setScale(nextScale);
  timelineStore.setVisibleWindow(defaultWindowForScale(nextScale));
}

function defaultWindowForScale(scale) {
  if (scale === 'day') return centeredWindow({ days: 14 });
  if (scale === 'week') return centeredWindow({ weeks: 12 });
  return centeredWindow({ months: 12 });
}
```

## 6. IPC And Store Pseudocode

```typescript
interface TimelineApi {
  listWorkItems(projectId: ProjectId): Promise<WorkItem[]>;
  createWorkItem(projectId: ProjectId, input: CreateWorkItemInput): Promise<WorkItem>;
  updateWorkItem(id: WorkItemId, patch: UpdateWorkItemInput): Promise<WorkItem>;
  updatePlannedDateRange(id: WorkItemId, range: DateRangeInput): Promise<WorkItem>;
  clickStatusButton(id: WorkItemId): Promise<WorkItem>;
  updateMilestoneState(id: WorkItemId, input: MilestoneStateInput): Promise<WorkItem>;
  deleteWorkItem(id: WorkItemId): Promise<void>;
}

const useTimelineStore = createStore((set, get) => ({
  itemsByProject: {},
  dependenciesByProject: {},
  collapsedIds: new Set(),
  scale: 'week',

  async loadProjectTimeline(projectId) {
    const items = await timelineApi.listWorkItems(projectId);
    set(projectItemsLoaded(projectId, items.map(withDerivedState)));
  },

  async savePlannedDateRange(itemId, range) {
    const item = await timelineApi.updatePlannedDateRange(itemId, range);
    set(workItemUpdated(withDerivedState(item)));
  },

  async clickStatusButton(itemId) {
    const item = await timelineApi.clickStatusButton(itemId);
    set(workItemUpdated(withDerivedState(item)));
  },

  async updateMilestoneState(itemId, input) {
    const item = await timelineApi.updateMilestoneState(itemId, input);
    set(workItemUpdated(withDerivedState(item)));
    await projectCanvasStore.refreshRiskSummary(item.projectId);
  }
}));
```

## 7. Persistence And Audit Pseudocode

All persistence must use parameterized SQL. All Timeline mutations must write an
audit record.

```typescript
function saveWorkItem(item) {
  db.prepare(`
    UPDATE timeline_work_items
    SET title = ?, type = ?, planned_start_date = ?, planned_end_date = ?,
        planned_working_days = ?, actual_start_date = ?, actual_end_date = ?,
        status = ?, milestone_state = ?, risk_event = ?, response_measure = ?,
        updated_at = ?
    WHERE id = ? AND project_id = ?
  `).run(
    item.title,
    item.type,
    item.plannedStartDate,
    item.plannedEndDate,
    item.plannedWorkingDays,
    item.actualStartDate,
    item.actualEndDate,
    item.status,
    item.milestoneState,
    item.riskEvent,
    item.responseMeasure,
    item.updatedAt,
    item.id,
    item.projectId
  );
}

function writeAuditLog(action, actor, entityId, payload) {
  db.prepare(`
    INSERT INTO audit_log (id, action, actor_id, entity_type, entity_id, payload_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(),
    action,
    actor.id,
    'timeline_work_item',
    entityId,
    JSON.stringify(payload),
    nowIso()
  );
}
```

## 8. First Implementation Slice Recommendation

Recommended first slice:

1. Add shared TypeScript contracts and pure business-rule functions.
2. Add unit tests for working-day calculation, status transitions, and
   risk/delay derivation.
3. Add IPC/main-process persistence only after contracts are stable.
4. Add renderer store and editor dialog.
5. Add read-only `react-calendar-timeline` rendering with drag/resize disabled.
6. Add milestone-to-project-risk linkage after Project Canvas and Risk Register
   boundaries are reviewed.

The first implementation should not try to solve all custom type governance,
all dependency visualization, or all statutory holiday jurisdictions at once.

## 9. Review Questions Before Implementation

- Which statutory holiday locale is the default for the first implementation?
- Is calendar configuration project-level, workspace-level, or both?
- Are custom Work Item types free-text labels or managed type records?
- Should completed Work Items be reopenable?
- Should milestone risk/delay create a Risk Register item, link to an existing
  Risk Register item, or only update Project Canvas risk summary?
- What should happen when a parent Work Item is deleted while children or
  dependencies exist?
