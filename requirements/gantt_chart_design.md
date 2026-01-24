# Gantt Chart (Timeline) — Full Functional Description (UI + Behaviors)

> Mental model: **a Work Package table on the left + a time-scaled timeline on the right**, kept in sync.
> You plan by editing rows (attributes) and by manipulating bars (dates/duration) and lines (dependencies).

---

## 1) What the Gantt chart is “made of”

### 1.1 Left side: Work package table (the “structured list”)
- A grid of **work packages** (tasks, phases, milestones, bugs… whatever your project types are).
- You can:
  - **Create new work packages** directly from the table (a “create new work package” row/link at the bottom).
  - **Edit fields inline** (subject, type, status, dates, etc. depending on configured columns).
  - **Filter / sort / group** the list (same general “table view” mechanics as work packages).
  - **Save views** (private/public), and mark some as favorites.

### 1.2 Right side: Timeline canvas (the “time geometry”)
- A horizontal time axis (zoomable).
- Each work package can appear as:
  - **Bar** (for items with start+finish / duration, e.g., phases/tasks)
  - **Point marker** (for milestones — a fixed date “dot/diamond-like” concept)
- Supports:
  - Dragging bars to shift dates
  - Resizing bars to change duration
  - Dependency lines between items (predecessor/follower)
  - Visual indicators like “today” line

### 1.3 One dataset, two lenses
- The **table and timeline are the same objects** shown differently.
- Selecting/expanding/collapsing in the table affects what’s visible on the timeline.

---

## 2) Getting into the Gantt chart

### 2.1 Project-level Gantt charts module
- Inside a specific project, you open the **Gantt charts** module from the project menu.
- Typical use: planning and tracking *within one project*.

### 2.2 Global (cross-project) Gantt charts module
- From “Global modules” you can open **Gantt charts** across projects.
- Typical use: portfolio-ish views, multi-project milestone oversight, “what’s happening where”.

---

## 3) Views: how you browse different Gantt setups

### 3.1 Built-in / default views (typical)
- “All open” view: shows work packages with an “open” status.
- “Milestones” view: shows items of type “Milestone” (or types configured to be treated as milestones).

### 3.2 Saved views (your real power tool)
- Views can be:
  - **Favorite** (quick access)
  - **Public** (shareable to others)
  - **Private** (personal)
- A view is essentially a remembered combination of:
  - Filters
  - Grouping
  - Sorting
  - Columns (table)
  - Possibly chart configuration options (labels/zoom behaviors)

---

## 4) Core interactions: editing schedule directly on the chart

### 4.1 Setting start/finish dates (and duration)
- You can set dates in:
  - The table (by editing date fields)
  - The timeline (drag + resize)
- Drag behaviors (conceptually):
  - **Drag the bar** → shift both start and finish together
  - **Drag bar edges** → change duration by moving start or finish

### 4.2 Milestones behave differently
- Milestones are a **single date** (displayed as a point in time, not a bar length).
- Their date can be influenced by relations unless you intentionally keep them independent.

---

## 5) Dependencies (relations) in the Gantt chart

### 5.1 What is displayed (and what is not)
Displayed in the Gantt chart:
- **Predecessor / Successor** (a “timing” relation: follows / precedes)
- **Parent / Child** hierarchy (structural relation)

Not displayed in the Gantt chart (even if they exist):
- “related to”, “blocked by”, “duplicates”, “includes”, etc.

### 5.2 Creating dependencies in the Gantt view
- You can add **dependencies (predecessor/successor)** directly within the Gantt chart UI.
- Dependencies are rendered as connecting lines between bars/milestones.

### 5.3 Lag (buffer) between linked items
- You can insert a **lag** (e.g., “start 2 weeks after predecessor finishes”).
- This is how you build buffers without manually eyeballing empty space.

---

## 6) Scheduling modes: manual vs automatic (per work package)

### 6.1 Manual scheduling (default mindset: “I decide dates”)
- You freely set start/finish dates.
- Even if relations exist, **moving a predecessor does NOT automatically move the successor**.
- Useful when:
  - Deadlines are fixed externally
  - You want top-down planning stability
  - You don’t want chain-reactions

### 6.2 Automatic scheduling (constraint mindset: “dates are derived”)
- You cannot arbitrarily set a manual start date the same way; dates are derived based on:
  - Predecessors (dependency constraints)
  - Children (hierarchy constraints)
- A work package can only switch to automatic mode if it has **predecessors or children**.
- Useful when:
  - You want bottom-up realism
  - You want dependencies to behave like “physics”
  - You want schedule propagation

### 6.3 Mixing modes is allowed
- Scheduling mode is **per work package**, so you can blend:
  - Manually-fixed key milestones/phases
  - Automatically-derived sub-tasks

---

## 7) Hierarchy: parent/child phases and rollups

### 7.1 Indentation and structure
- Work packages can be arranged in **parent/child** relationships.
- The Gantt chart reflects this hierarchy (expand/collapse).

### 7.2 Parent range vs children range (why you see clamps/brackets)
- The chart can visualize differences between:
  - Parent’s own dates
  - Children’s earliest start / latest finish range
- If children extend beyond parent (or fit inside), the chart shows bracket/clamp-like indicators
  to highlight mismatch (a “parent doesn’t cover its children” smell).

---

## 8) Visual language in the chart (colors/lines/symbols)

### 8.1 Dependency line
- A **blue line** connects predecessor and follower (dependency).

### 8.2 “Today” marker
- A **vertical red dotted line** indicates today’s date.

### 8.3 Aggregation clamp (children span)
- A **black clamp/bracket** can indicate the duration from:
  - earliest-starting child → latest-ending child
  (useful to see real span even if parent dates differ)

---

## 9) Navigation and focus tools (because timelines are big beasts)

### 9.1 Zoom in/out
- Buttons (plus/minus) to change time scale granularity.
- Used to go from “year view” down to “week/day-ish view” depending on the dataset.

### 9.2 Auto-zoom
- Auto-zoom fits the visible items into a “best view” window.
- Sometimes auto-zoom can be locked/controlled by the view’s configuration.

### 9.3 Zen mode (focus)
- A “Zen mode” exists to reduce UI noise and focus on planning (conceptually: more canvas, less chrome).

---

## 10) Context menu (right click): fast actions without leaving the view
- Right-clicking a work package row in Gantt view opens a quick context menu.
- The exact options can differ slightly compared to the Work Packages module table view,
  but the intent is:
  - quick creation / management actions
  - structural operations
  - copy/move-like actions (depending on permissions/config)

---

## 11) Multi-project / portfolio-like planning

### 11.1 Cross-project timelines
- You can create timelines spanning multiple projects via:
  - Global Gantt charts module, or
  - Filters like “Include projects” (including sub-projects)

### 11.2 Aggregation by project (high-level milestone overview)
- You can group by **Project** and then collapse to get a high-level view.
- Collapsing projects can still leave key milestone rows visible in an aggregated way,
  enabling “executive scanning” across projects.

---

## 12) Export and sharing

### 12.1 Gantt PDF export (often Enterprise add-on)
- You can export the Gantt chart to PDF.
- Export parameters typically include:
  - zoom level/time scale
  - column width
  - paper size
- Intended for stakeholder sharing and printing.

### 12.2 Shareable via views
- Public views + consistent filters = “here’s the live plan link”.
- More reliable than screenshots, because it stays current.

---

## 13) Practical “workflow loops” this design supports

### 13.1 Planning loop (top-down)
1) Create phases and milestones
2) Add tasks under phases (children)
3) Manually set high-level dates
4) Optionally switch lower-level tasks to automatic scheduling so dependencies behave

### 13.2 Tracking loop (daily/weekly)
1) Filter to “open” items
2) Zoom to current month/quarter
3) Drag/reschedule what moved
4) Inspect dependency chains for knock-on risk
5) Export PDF for reporting when needed

### 13.3 Portfolio loop (multi-project)
1) Open global Gantt view
2) Group by project
3) Collapse to see only key items/milestones
4) Use filters to build “program slices” (by customer, BU, product line, etc. via fields)

---

## 14) Boundaries (important “what it doesn’t do” in the Gantt)
- It does **not** show every relation type visually — only predecessor/successor and parent/child are chart-native.
- Baseline-style comparisons are generally a *separate capability* (often table/baseline features rather than a pure “two bars: planned vs actual” MS Project style overlay).

---
