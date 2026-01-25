# SwissArmyPM v1.0 — Gantt Component Inventory

## 1. GanttView (Root)

Purpose:
- Hosts the entire Gantt experience

Contains:
- TopBar
- TaskTreePanel
- TimelineCanvas

Constraints:
- Desktop-only
- No responsive reflow
- Fixed height rows

---

## 2. TopBar

Purpose:
- Context and time scale control

Elements:
- Project name (editable text)
- Current date range label
- Scale selector: Day / Week / Month
- Today button
- Add Task button

Rules:
- No search
- No filters in v1.0

---

## 3. TaskTreePanel (Left Panel)

Purpose:
- Structural navigation and semantic anchoring

Width:
- Fixed (e.g. 280–320px)

Row Content:
- Expand / collapse icon (if parent)
- Task title
- Task type icon

Rules:
- Tree indentation represents hierarchy
- No sortable columns
- Text overflow uses ellipsis

---

## 4. TimelineCanvas (Right Panel)

Purpose:
- Visualize and manipulate task timing

Structure:
- TimeHeader
- TimeGrid
- TaskRows

Constraints:
- Horizontal scroll enabled
- Vertical scroll synced with TaskTreePanel

---

## 5. TimeHeader

Purpose:
- Display time scale and date labels

Behavior:
- Sticky on vertical scroll
- Adapts density to scale

Rules:
- Day scale shows individual days
- Week scale emphasizes week boundaries
- Month scale emphasizes month boundaries

---

## 6. TimeGrid

Purpose:
- Background temporal reference

Rules:
- Vertical grid lines only
- Low contrast
- Never compete visually with task bars

---

## 7. TaskRow

Purpose:
- One-to-one container for a task

Rules:
- Fixed height (e.g. 32–36px)
- Aligns exactly with TaskTree row
- No dynamic resizing

---

## 8. TaskBar

Purpose:
- Represent a task or issue duration

Geometry:
- Horizontal rectangle
- Minimal corner radius

Variants:
- Task: solid fill
- Issue: dashed or outlined

Interactions:
- Drag to move
- Drag edges to resize

---

## 9. MilestoneMarker

Purpose:
- Represent a milestone date

Geometry:
- Diamond (◆)

Rules:
- No duration
- Horizontally draggable only

---

## 10. Tooltip

Purpose:
- Quick inspection of task metadata

Content:
- Title
- Type
- Start date
- End date
- Duration
- Priority

Rules:
- Read-only
- Appears on hover with slight delay
