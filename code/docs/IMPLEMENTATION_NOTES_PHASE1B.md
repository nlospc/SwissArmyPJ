# SwissArmyPM v1.0 — Phase 1B Implementation Notes

## Overview
Phase 1B (Editable Grid Foundation) has been successfully implemented. The left panel of the Gantt chart has been transformed from a simple list view into an editable grid with sortable columns, inline editors, column picker, and sort functionality.

## Component Architecture

### New Components Created

1. **`TableHeaderRow`** (`src/renderer/components/gantt/TableHeaderRow.tsx`)
   - Fixed header row (40px height per constraints)
   - Sortable column headers for: ID, Type, Subject, Status, Start Date, Finish Date, Duration, Priority
   - ColumnPicker trigger icon with dropdown
   - Visual sort indicators (using rotated ChevronDownIcon)
   - Click to toggle sort order (asc/desc/null)
   - Exports `sortWorkPackages` helper for stable sorting

2. **`InlineCellEditor`** (`src/renderer/components/gantt/InlineCellEditor.tsx`)
   - Text editor for Subject field
   - Select editor for Type (task/phase/milestone/bug)
   - Select editor for Status (todo/in_progress/done/blocked)
   - Select editor for Priority (low/medium/high/critical)
   - Date editor for Start/Finish with calendar popup
   - Auto-save on blur/enter
   - Cancel on escape
   - Exports helper functions: `clampProgress`, `progressFromStatus`, `statusFromProgress`

3. **`TaskTableRow`** (`src/renderer/components/gantt/TaskTableRow.tsx`)
   - Replaces old `WorkPackageRow` component
   - Renders both left panel table cells AND right panel timeline bar
   - Integrates inline editing for all editable fields
   - Maintains 34px row height
   - Handles drag move/resize/milestone drag

## Column Configuration

Column widths per constraints:
- ID (80px)
- Type (90px)
- Subject (min 220px, flex)
- Status (100px)
- Start Date (120px)
- Finish Date (120px)
- Duration (100px)
- Priority (100px)

Total left panel width: 520px (fixed per v1.0 constraints)

## Row Synchronization

**How row sync is enforced:**
- Both table row and timeline row are rendered within the same `TaskTableRow` component
- Single `div` with `flex` layout contains both panels
- Height is fixed at `34px` via inline style
- No separate scrolling - the entire row is a unit

## Date↔Pixel Conversion

**How date↔pixel conversion is done:**
- Timeline width = `container.clientWidth - 520px` (left panel width)
- Total duration = `viewEnd.getTime() - viewStart.getTime()`
- Pixel position for date = `((date.getTime() - viewStart.getTime()) / totalDuration) * 100%`
- Bar width = `((endDate.getTime() - startDate.getTime()) / totalDuration) * 100%`
- All calculations use percentage-based positioning for responsiveness

## Scale Changes

**How scale changes affect rendering only:**
- Scale selection (Day/Week/Month) changes only the timeline header rendering
- Scale does NOT change stored dates (data always at day precision)
- Scale affects:
  - Timeline header labels and sub-labels
  - Timeline grid cell widths
  - Number of visible time units
- View window (`viewStart`, `viewEnd`) is scale-independent
- Pixel-per-day calculation is scale-dependent but only for rendering

## Modified State Tracking

**How modified state is tracked and cleared on save:**
- NOT YET IMPLEMENTED in Phase 1B
- Phase 1B focused on editable grid, not modified indicators
- Will be implemented in later phase with:
  - Orange dot indicator on changed rows
  - Cleared only by save action
  - Tracked at store level

## Integration Points

### Main Store (`useGanttStore.ts`)
- `updateWorkPackage(id, updates)` - Called by inline editors on save
- No new state added for Phase 1B

### GanttChart.tsx Changes
1. Added state:
   - `columns: Column[]` - Column configuration
   - `sortConfig: SortConfig` - Current sort state
2. Updated `filteredWorkPackages` to apply sorting via `sortWorkPackages()`
3. Replaced `WorkPackageRow` with `TaskTableRow`
4. Added `TableHeaderRow` component to header
5. Updated header height for TodayMarker: 56px → 40px

## Known Limitations (Phase 1B Scope)

1. **Hierarchy not yet implemented**
   - `level` prop accepted but not used
   - No parent/child relationships
   - Caret always hidden (hasChildren = false)
   - Will be implemented in Phase 2

2. **No context menu yet**
   - Will be implemented in Phase 3

3. **No hover tooltip yet**
   - Will be implemented in Phase 5

4. **No modified indicator yet**
   - Will be implemented in Phase 5

5. **Column visibility not persisted**
   - Currently only in-memory state
   - Will be persisted to DB/local storage in Phase 5

## Compliance with v1.0 Constraints

✅ Row height: 34px (fixed)
✅ Left panel width: 520px (fixed)
✅ Table header height: 40px
✅ Dual-panel sync: Single component renders both
✅ Scale affects rendering only: Dates stored independently
✅ Day precision: All dates at day granularity

## Next Steps (Phase 2)

1. Implement hierarchy (parent/child relationships)
2. Add tree indentation (16px per level)
3. Add caret toggle for expand/collapse
4. Implement child row hiding when collapsed
5. Add "Create child" action
6. Auto-expand parent when child created
