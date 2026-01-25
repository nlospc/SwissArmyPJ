# SwissArmyPM v1.0 — Gantt Design Specification (OpenProject-aligned)

## 0. Scope Update (Explicit)
v1.0 is revised to match OpenProject’s Gantt experience:
- Gantt behaves like a **drawer component** (expand/collapse + fullscreen)
- Left side is an **editable task table** with **hierarchy (parent/child)**
- User can **customize visible columns**, **sort**, and use **context menu**
- v1.0 includes **relations (FS only)** with connector lines + conflict highlighting (no auto-reschedule)
- v1.0 includes **Task Details drawer/page** with **linked local files** and **open in external app**

Still out of scope:
- collaboration, assignees, resource mgmt
- baselines / critical path
- complex dependency types (SS/FF) + lag/lead
- in-app file rendering/editing (markdown preview, office parsing)

---

## 1. Design Goal
Build an engineering-grade planning workspace where users can:
- Understand schedule structure within 30 seconds
- Inspect task attributes with minimal clicks
- Edit tasks inline and manipulate time directly
- Create basic predecessor/successor relations and see conflicts immediately
- Open task-related local files via OS default apps

---

## 2. Primary UX Pattern: Gantt Drawer
The Gantt is not a standalone “chart page”. It behaves like a drawer:
- Expand/collapse within the project workspace
- Fullscreen mode (focus)
- State preserved across open/close (scroll position, selection, scale)

---

## 3. Core Layout (Non-negotiable)
Dual-axis synchronized layout:
- Left: Task Table (editable grid with hierarchy)
- Right: Timeline Canvas

Rules:
- One task row on the left maps to exactly one timeline row on the right
- Fixed row height; never auto-resize
- Vertical scroll synchronized
- Horizontal scroll only affects timeline (left panel stays fixed)

---

## 4. Task Table is a Grid (Not a list)
Must support in v1.0:
- Create task (new row)
- Create child task under a parent (default collapsed)
- Inline edit for key fields
- Column picker (toggle visible fields)
- Sorting (minimum: Start, Finish, ID)
- Context menu actions (open details, fullscreen, duplicate, delete, create child, add predecessor/successor)

---

## 5. Timeline Canvas Principles
- Scales: Day / Week / Month (display only)
- Grid is low contrast background reference
- Task types are geometry-first:
  - Task: solid bar
  - Issue: outline/dashed bar
  - Milestone: diamond marker
- Today marker is visible but not dominant

---

## 6. Relations (v1.0 minimum viable)
- Only Finish-to-Start (FS)
- Create predecessor/successor from context menu
- Render connectors
- Detect violations: successor.start < predecessor.finish
- Highlight violations (line + row/bar warning)
- No auto-shift / no auto-fix in v1.0

---

## 7. Task Details (Drawer/Page)
Open details from row/bar:
- Core fields: title/type/status/priority/start/finish/duration
- Relations summary (predecessor/successor)
- Linked local files list
- Actions: open file, reveal in folder, remove link
- No in-app file preview/edit in v1.0

---

## 8. Success Criteria (Definition of Done)
- User can create/edit/sort tasks from left grid without leaving Gantt
- User can create child tasks and expand/collapse hierarchy predictably
- User can drag/move/resize bars with clear feedback and modified state
- User can add FS relation and see connector line + conflict highlight if violated
- User can link local files to a task and open them via external apps
