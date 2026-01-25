# SwissArmyPM v1.0 — Gantt Implementation Constraints

> Architect deliverable: Measurable, testable constraints derived from design.md, components.md, interactions.md

## 1. Layout Constraints

### 1.1 Dual-Panel Structure
- Left panel (TaskTreePanel) width: **320px fixed**
- Right panel (TimelineCanvas) width: **remaining viewport width**
- Total height: **100vh** (full viewport)

### 1.2 Row Dimensions
- Row height: **34px fixed**
- Never auto-resizes based on content
- No dynamic height expansion
- All rows maintain exact alignment between panels

### 1.3 Vertical Synchronization
- Scroll position must be identical in both panels at all times
- One pixel of scroll in left panel = one pixel of scroll in right panel
- No drift or misalignment permitted

## 2. Time Representation Constraints

### 2.1 Time Unit
- Internal time unit: **day**
- All date math operates on day precision
- Time component (hours/minutes) is ignored for UI purposes

### 2.2 Scale Mappings

**Day Scale:**
- One day = **40px** minimum width
- Shows individual date numerals
- Grid line at each day boundary

**Week Scale:**
- One week = **120px** minimum width
- Week number or date range shown
- Grid line at week start (Monday)

**Month Scale:**
- One month = **variable width** based on days
- Month label shown
- Grid line at month start

### 2.3 Scale Switching
- Scale changes affect **display density only**
- Scale changes **must not** modify stored task dates
- Task dates remain unchanged when switching scales

## 3. Visual Hierarchy Constraints

### 3.1 Contrast Rules
- Grid lines: **max 15% opacity** against background
- Task bars: **100% opacity** solid fill
- Grid must never compete visually with task objects

### 3.2 Type Geometry

**Task:**
- Shape: Rectangle with **4px corner radius**
- Height: **18px** (centered in 34px row)
- Fill: Solid, 100% opacity

**Issue (Bug):**
- Shape: Rectangle with **4px corner radius**
- Height: **18px** (centered in 34px row)
- Fill: Transparent with **2px solid border**

**Milestone:**
- Shape: Diamond (rotated square 45deg)
- Size: **20px** width/height
- Centered in 34px row
- Fill: Solid, 100% opacity

**Phase:**
- Shape: Rectangle with **4px corner radius**
- Height: **18px** (centered in 34px row)
- Fill: Solid with 30% opacity (container visual)

### 3.3 Color Palette
- Task: Blue (#2B7FFF)
- Issue: Red/Orange (#DC2626)
- Milestone: Purple (#9333EA)
- Phase: Amber (#F59E0B)
- Grid: Gray (#E5E7EB) with 15% opacity
- Today marker: Red (#EF4444)

## 4. Header Constraints

### 4.1 TopBar Height
- Height: **56px fixed**
- Contains: Project name, scale selector, today button, add task button

### 4.2 TimeHeader Height
- Height: **40px fixed**
- Sticky during vertical scroll
- Displays date labels matching current scale

## 5. Interaction Constraints

### 5.1 Tooltip Behavior
- Delay: **200ms** before appearing
- Position: **12px offset** from cursor
- Z-index: **1000** (above all other elements)
- Must not trap cursor or block drag operations

### 5.2 Drag Feedback

**Move Task:**
- Ghost bar opacity: **50%**
- Follows cursor with **0px lag** (synchronized)
- Shows live date range tooltip

**Resize Task:**
- Resize handle width: **8px** at each edge
- Cursor changes at **4px** from edge
- Live dimension feedback shown

**Milestone Drag:**
- Horizontal movement only
- Vertical position locked to row center
- Snaps to day boundaries

### 5.3 Modified Indicators
- Visual: **3px orange dot** in top-left corner of task bar
- Appears immediately after drag/resize completes
- Persists until save operation completes
- Removed by save action, not by time

## 6. Scrolling Constraints

### 6.1 Timeline Range
- Minimum visible range: **7 days**
- Maximum visible range: **3650 days** (10 years)
- Initial range: **180 days** (90 days before today, 90 days after)

### 6.2 Scroll Behavior
- Horizontal scroll: **pixel-based**, not snapped
- Vertical scroll: **row-aligned** (scrolls by full rows)
- No momentum or inertial scrolling

## 7. Performance Constraints

### 7.1 Rendering Budget
- Target: **60fps** during drag operations
- Maximum tasks: **500** without virtual scrolling (v1.0 limit)
- Tooltip render: **<16ms** (one frame)

### 7.2 DOM Limits
- Maximum DOM nodes for task bars: **500** (one per task)
- No virtual scrolling required for v1.0
- Simple rerender on data change is acceptable

## 8. Edge Case Constraints

### 8.1 Date Boundaries
- Minimum task duration: **1 day**
- Maximum task duration: **10 years**
- End date cannot be before start date
- Milestone start equals end (no duration)

### 8.2 Drag Boundaries
- Drag beyond visible timeline: **allowed** (auto-scrolls timeline)
- Drag to zero duration: **blocked** (stops at 1 day minimum)
- Drag milestone: **single date** only

### 8.3 Empty States
- No tasks: Show centered message "No tasks to display"
- No dates: Show placeholder bar at estimated position
- Invalid date range: Show error state, prevent save

## 9. Measurement Verification

All above constraints are:
- Quantifiable (numeric values specified)
- Testable (can be verified with automated tests)
- Measurable (can be checked with dev tools)

Example verification tests:
- Row height: `document.querySelector('.task-row').offsetHeight === 34`
- Panel width: `document.querySelector('.task-tree').offsetWidth === 320`
- Tooltip delay: Set timeout to 200ms, verify tooltip visible
- Grid opacity: `getComputedStyle(gridLine).opacity === '0.15'`
