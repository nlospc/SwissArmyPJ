# SwissArmyPM v1.0 — Gantt Constraints (Hard Rules)

## 1. Geometry & Alignment
- Row height: 34px (fixed)
- Table header height: 40px
- Timeline header height: 56px (2-tier header allowed)
- Left panel width: 520px (fixed for v1.0)
- Indentation per level: 16px
- Caret hit area: 18px wide (clickable)

Non-negotiable:
- Left row Y must equal timeline row Y always (strict sync)

## 2. Time & Pixel Conversion
- Storage precision: day
- Base unit (Day scale): 1 day = 24px
- Week scale: 1 day = 8px
- Month scale: 1 day = 2px
- Snap behavior:
  - dragging snaps to day boundaries
  - resizing snaps to day boundaries

## 3. Grid Visual Weight
- Grid vertical lines must be low contrast (background only)
- Month boundaries slightly stronger than day lines
- Today line: red, 1px, always visible

## 4. Table Column Defaults (v1.0)
Default visible columns and widths:
- ID (80)
- Type (90)
- Subject (min 220, flex)
- Status (100)
- Start Date (120)
- Finish Date (120)
- Duration (100)
- Priority (100)

ColumnPicker:
- toggles visibility
- persists per project in local storage/DB

## 5. Hierarchy Rules
- Parent row shows caret if it has children OR can accept children
- Default state:
  - existing parents: collapsed
  - when creating a child: parent auto-expands

## 6. Relation Constraints (v1.0)
- Only FS relations allowed
- No lag/lead
- No auto-reschedule
- Conflict rule: successor.start < predecessor.finish

## 7. Local File Links
- Only allow linking files under workspace root (recommended safety)
- Open behavior uses OS default handler
- Missing file must show a clear error state (no silent failure)

## 8. Persistence (per project)
Persist:
- scale (Day/Week/Month)
- horizontal scroll position (timeline)
- vertical scroll position
- column visibility set
- expanded/collapsed tree state
- last selected task
