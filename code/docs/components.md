# SwissArmyPM v1.0 — Gantt Components (OpenProject-aligned)

## 1. GanttDrawer (Root Container)
Purpose:
- Provide expand/collapse and fullscreen behaviors
Contains:
- GanttTopBar
- SplitPane (TaskTablePanel + TimelineCanvas)
- TaskDetailsDrawer (overlay/drawer)

States:
- collapsed / expanded / fullscreen

---

## 2. GanttTopBar
Includes:
- Breadcrumb: All Projects > Project > Product Timeline
- Scale selector: Day / Week / Month
- Zoom controls: +/- (optional numeric label)
- Today button
- Create button (dropdown optional)
- Column picker entry (if not placed inside table header)
- Filter badge (optional minimal status filter)

---

## 3. SplitPane
Left:
- TaskTablePanel (fixed width)
Right:
- TimelineCanvas (flex)

Rules:
- Shared vertical scroll controller
- Left stays fixed on horizontal scroll

---

## 4. TaskTablePanel (Editable Grid + Hierarchy)
### Required subcomponents
- TableHeaderRow
  - sortable headers
  - ColumnPicker trigger icon
- TaskTableRow
  - caret + indentation area
  - cells
  - row actions (optional)
- InlineCellEditor
  - text editor (Subject)
  - select editor (Type/Status/Priority)
  - date editor (Start/Finish) with range picker behavior
- RowContextMenu
- CreateRowControl (“+ Create new work package” row)

### Minimum Columns (v1.0)
- ID
- Type
- Subject
- Status
- Start Date
- Finish Date
- Duration (derived)
- Optional: Priority (if not shown as icon/badge)

Hierarchy:
- parent rows have caret
- child rows render with indentation
- default collapsed for newly created parent (configurable)

---

## 5. TimelineCanvas
Subcomponents:
- TimeHeader (sticky)
- TimeGrid (low contrast)
- TimelineRow (aligned with TaskTableRow)
- TaskRenderer
- RelationLayer (FS connectors)
- TodayMarker

---

## 6. TaskRenderer
- TaskBar (solid)
- IssueBar (outlined/dashed)
- MilestoneMarker (diamond)

Handles:
- drag center to move
- drag edges to resize
- milestone drag horizontal only

---

## 7. RelationLayer (v1.0 FS only)
Responsibilities:
- Render connector lines between predecessor.finish -> successor.start
- Highlight conflicts
- Hover shows relation info (optional)

---

## 8. Tooltip
On hover (bar or row):
- title/type/status/priority
- start/finish/duration
- conflict badge if any

Rules:
- delay ~200ms
- must not block drag

---

## 9. TaskDetailsDrawer
Contains:
- Header: ID + Subject + quick actions
- Sections:
  1) Basics (fields)
  2) Relations summary
  3) Linked Files
- Linked Files actions:
  - Add file (OS file picker)
  - Open file (OS default handler)
  - Reveal in folder
  - Remove link
