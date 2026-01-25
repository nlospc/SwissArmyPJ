# SwissArmyPM v1.0 — Gantt Interaction Edge Cases

> Architect deliverable: Explicit handling for edge cases and boundary conditions

## 1. Drag Operations

### 1.1 Drag Beyond Visible Timeline

**Scenario:** User drags task beyond currently visible time range.

**Behavior:**
- Auto-scroll timeline in drag direction
- Scroll speed: **200px per second**
- Stop scrolling when mouse moves back within viewport
- Allow unlimited temporal movement (no boundary)

**Acceptance:**
- Task can be moved any distance (months/years away)
- Smooth scrolling maintains drag feedback
- No "out of bounds" blocking

### 1.2 Drag to Zero Duration

**Scenario:** User resizes task bar to zero or negative duration.

**Behavior:**
- **BLOCK** resize at 1-day minimum
- Cursor shows **not-allowed** indicator
- Resize handle stops at boundary
- No auto-correction or silent fix

**Acceptance:**
- End date cannot be before or equal to start date
- User sees clear visual feedback that operation is blocked
- No silent data corruption

### 1.3 Drag Milestone Vertically

**Scenario:** User attempts to drag milestone marker up/down to different row.

**Behavior:**
- **BLOCK** vertical movement
- Milestone locked to horizontal axis
- Cursor restricted to horizontal movement only
- No row reassignment via drag in v1.0

**Acceptance:**
- Milestone only changes date, not row position
- Dragging vertically shows no movement
- Row reassignment requires explicit edit dialog (not drag)

## 2. Date Validation

### 2.1 Start Date After End Date

**Scenario:** User edits task to set start_date > end_date.

**Behavior:**
- **BLOCK** save operation
- Show error: "Start date must be before or equal to end date"
- Highlight both date fields in red
- Keep focus on invalid field
- No auto-swap or auto-correction

**Acceptance:**
- Invalid state cannot be saved
- User must explicitly fix dates
- Clear error message explains problem

### 2.2 Milestone with Different Start/End

**Scenario:** User edits milestone to set start_date != end_date.

**Behavior:**
- **AUTO-COPY** start_date to end_date on blur
- Show info message: "Milestones have no duration, end date set to match start date"
- Visual sync shows both dates updating

**Acceptance:**
- Milestone always has start_date === end_date
- User understands constraint via message
- No error state, just automatic sync

### 2.3 Task with No Dates

**Scenario:** User creates task without setting start_date or end_date.

**Behavior:**
- Allow creation with **null** dates
- Show in list view but **not** in timeline
- Display placeholder: "No dates set" in timeline cell
- Prompt user to set dates when dragging attempted

**Acceptance:**
- Task exists but is not visible on timeline
- Attempting to drag shows dialog: "Set task dates first"
- No crash or undefined behavior

## 3. Scale Switching

### 3.1 Rapid Scale Changes

**Scenario:** User quickly clicks through Day → Week → Month → Day scales.

**Behavior:**
- Each scale change is **independent**
- No animation between scales (instant switch)
- Task positions update immediately
- Stored dates **never change**

**Acceptance:**
- Switching scales is fast and predictable
- Task appears at same temporal position, different visual density
- No data loss or date drift from rapid switches

### 3.2 Scale with Unsynchronized Dates

**Scenario:** User has unsaved modified tasks, then changes scale.

**Behavior:**
- Modified indicators **persist**
- Scale change does **not** trigger save
- Tasks render in new scale with modified dates
- User can still save or discard changes

**Acceptance:**
- Scale switch is purely view-level operation
- No implicit save on scale change
- User maintains control over save timing

## 4. Multi-Task Conflicts

### 4.1 Overlapping Task Names

**Scenario:** User creates two tasks with identical names in same project.

**Behavior:**
- **ALLOW** duplicate names
- No warning or blocking
- Tasks distinguished by ID, not name
- Visual disambiguation via position

**Acceptance:**
- No artificial naming constraints
- UI shows both tasks at their positions
- Hover tooltip shows full details for identification

### 4.2 Circular Hierarchies

**Scenario:** User attempts to set task's parent to its own descendant.

**Behavior:**
- **BLOCK** operation
- Show error: "Cannot make a task its own ancestor"
- Prevent circular parent reference
- Keep parent selection on previous valid value

**Acceptance:**
- Database constraint prevents cycles
- UI validates before sending to backend
- Clear error message

## 5. Performance Edge Cases

### 5.1 Large Task Count

**Scenario:** Project has 500 tasks (v1.0 limit).

**Behavior:**
- No virtual scrolling required
- Full DOM rendering acceptable
- Initial render target: **<2 seconds**
- Drag performance target: **60fps**

**Acceptance:**
- 500 tasks render without crash
- Drag operations remain smooth
- No "too many items" blocking

### 5.2 Rapid Sequential Edits

**Scenario:** User drags task, drags another, drags third, then saves.

**Behavior:**
- All three tasks marked as **modified**
- Single save commits all changes
- No intermediate saves
- Modified indicators on all three

**Acceptance:**
- Batch editing works smoothly
- Save commits all pending changes
- Clear visual feedback shows what's modified

## 6. Tooltip Edge Cases

### 6.1 Tooltip Near Viewport Edge

**Scenario:** User hovers task near right edge of screen, tooltip would overflow.

**Behavior:**
- Auto-position tooltip **inward** from edge
- Maintain 12px offset from viewport boundary
- Flip to left side if necessary
- Never render partially off-screen

**Acceptance:**
- Tooltip always fully visible
- No horizontal scrollbar triggered
- Smooth repositioning

### 6.2 Tooltip During Drag

**Scenario:** User hovers task, tooltip appears, then starts dragging.

**Behavior:**
- Tooltip **remains visible** during drag
- Tooltip follows cursor with 12px offset
- Tooltip does **not block** drag events
- Tooltip content updates live with new dates

**Acceptance:**
- No interruption of drag interaction
- User sees live date feedback
- Drag feels smooth and responsive

## 7. Empty State Handling

### 7.1 New Project with No Tasks

**Scenario:** User creates new project, opens Gantt view.

**Behavior:**
- Show empty state message: "No tasks yet. Create your first task to get started."
- Display "Add Task" button prominently
- Timeline grid still renders (shows date range)
- No crash or undefined rendering

**Acceptance:**
- Clear call-to-action for user
- Timeline structure is visible
- Empty state is professional, not broken

### 7.2 All Tasks Filtered Out

**Scenario:** (Future v1.1+) User applies filter that matches zero tasks.

**Behavior:**
- Show filter message: "No tasks match current filters"
- Offer "Clear filters" button
- Timeline shows empty state
- Grid still renders

**Acceptance:**
- User understands why view is empty
- Easy path to restore full view
- No appearance of data loss

## 8. Save Conflict Handling

### 8.1 Concurrent Edit Detection

**Scenario:** (Future v2.0+) Two users edit same project simultaneously.

**Behavior:**
- **NOT APPLICABLE** in v1.0 (local-first, single-user)
- No collaboration, no server sync
- No conflict resolution needed

**v1.0 Behavior:**
- Single-user desktop app
- Local database only
- No concurrent edits possible

### 8.2 Save Failure Recovery

**Scenario:** User edits tasks, clicks save, database operation fails.

**Behavior:**
- Show error toast: "Failed to save changes. Please try again."
- Modified indicators **persist** (don't clear)
- Allow user to retry save
- Offer "Discard changes" option

**Acceptance:**
- User doesn't lose work on save failure
- Clear error message
- Retry path is obvious

## 9. Boundary Condition Tests

Each edge case must have corresponding test:

```typescript
// Example test specifications
describe('Gantt Edge Cases', () => {
  test('drag beyond visible timeline auto-scrolls')
  test('resize to zero duration is blocked at 1 day')
  test('milestone cannot move vertically')
  test('start after end date is blocked on save')
  test('milestone dates are auto-synced')
  test('scale switch does not modify task dates')
  test('rapid scale switches are independent')
  test('circular parent reference is blocked')
  test('500 tasks render within 2 seconds')
  test('tooltip repositions near viewport edge')
  test('tooltip remains visible during drag')
  test('save failure preserves modified indicators')
})
```
