# SwissArmyPM v1.0 — Gantt Interactions (OpenProject-aligned)

## 1. Drawer Behavior
- Expand: open Gantt in workspace
- Collapse: close Gantt but preserve state (scale, scroll, selection)
- Fullscreen: hide sidebar chrome; keep topbar + grid + canvas

State persistence:
- remember last opened state per project

---

## 2. Task Table Interactions

### 2.1 Create Task
- “Create” button adds a new row
- New row immediately enters inline edit (Subject focused)

### 2.2 Create Child Task
Entry points:
- Row context menu: “Create new child”
- Optional: inline “+ child” button

Behavior:
- child inserted directly under parent (at top of children list)
- parent auto-expands if child created
- child inherits nothing except optional default dates (none by default)

### 2.3 Expand/Collapse Hierarchy
- Clicking caret toggles children visibility
- When collapsed:
  - child rows hidden in table
  - corresponding timeline rows hidden (no aggregation in v1.0)

### 2.4 Inline Edit
- Subject: text
- Type/Status/Priority: select
- Start/Finish: date range picker
  - click Start -> pick start -> automatically pick end -> then close

### 2.5 Column Customization
- ColumnPicker toggles visible columns
- Persist per project locally
- Column order can be fixed in v1.0 (no drag reorder required)

### 2.6 Sorting
- Click header toggles asc/desc
- Minimum sort keys: Start Date, Finish Date, ID
- Sorting must be stable (ties keep previous order)

### 2.7 Context Menu (Row or Bar)
Minimum actions:
- Open details view
- Open fullscreen view
- Duplicate
- Delete
- Create new child
- Add predecessor
- Add successor
- Show relations (optional)

---

## 3. Timeline Interactions

### 3.1 Hover Tooltip
- appears after ~200ms
- includes title/type/status/priority/start/finish/duration
- hides immediately on mouse leave
- must not block dragging

### 3.2 Drag Move (bar center)
- shift start + finish together
- duration constant
- show ghost bar + live date feedback

### 3.3 Resize (bar edges)
- left edge changes start
- right edge changes finish
- block invalid ranges (finish < start)
- show live duration feedback

### 3.4 Milestone Drag
- horizontal only
- single date

### 3.5 Modified State
- any date change or relation change sets “modified” marker
- marker persists until saved

---

## 4. Relations (FS only)

### 4.1 Create relation
- user selects “Add predecessor/successor”
- enters “relation targeting mode”
- user clicks target task row/bar to confirm
- ESC cancels targeting mode

### 4.2 Render relation
- connector line drawn from predecessor finish to successor start
- hover shows relation summary (optional)

### 4.3 Conflict detection
- if successor.start < predecessor.finish:
  - relation line highlighted
  - successor row/bar shows warning badge
- no auto-reschedule in v1.0

---

## 5. Task Details Drawer
Open via:
- context menu “Open details view”
- double-click row/bar (optional)

Linked files:
- Add file -> OS file picker
- Open -> OS default application
- Reveal in folder
- Remove link
