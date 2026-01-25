# SwissArmyPM v1.0 — Builder Implementation Plan (Updated Scope)

## Scope Change Summary

**Previous Phase 1 (Completed):**
- Removed ALL dependency features
- Removed conflict detection
- Removed zen mode
- Enforced 34px row height
- 320px left panel width

**New v1.0 Scope (Current):**
- ✅ Keep: 34px row height, dual-panel sync
- ❌ REVERSE: Re-add dependencies (FS only)
- ❌ CHANGE: Left panel width 320px → 520px
- ➕ NEW: Editable task table with inline editing
- ➕ NEW: Hierarchy (parent/child) with expand/collapse
- ➕ NEW: Context menu on rows/bars
- ➕ NEW: Task Details drawer with linked local files
- ➕ NEW: Column picker and sorting
- ➕ NEW: Relation targeting mode
- ➕ NEW: FS-only connector rendering
- ➕ NEW: Conflict highlighting (no auto-reschedule)

---

## Implementation Phases

### Phase 1A: Reverse & Restore (Immediate)
**Goal:** Restore dependencies with FS-only constraints

Tasks:
1. Restore `Dependency` type import
2. Restore `DependencyLines` component (simplified for FS only)
3. Restore `dependencies` from useGanttStore
4. Restore conflict detection (FS only: successor.start < predecessor.finish)
5. Restore `hasConflict` field and warning indicators
6. Update left panel width: 320px → 520px
7. Update constraints docs to reflect 520px width

**Estimated:** 2-3 hours

### Phase 1B: Editable Grid Foundation
**Goal:** Transform left panel from static list to editable grid

Tasks:
1. Add table header row with sortable columns
2. Implement inline cell editors:
   - Text: Subject
   - Select: Type/Status/Priority
   - Date: Start/Finish (range picker behavior)
3. Add column picker UI
4. Implement column visibility state (persisted)
5. Add sort functionality (Start/Finish/ID minimum)

**Estimated:** 4-6 hours

### Phase 2: Hierarchy & Tree
**Goal:** Add parent/child relationships with expand/collapse

Tasks:
1. Update data model to support `parent_id` properly
2. Add tree indentation (16px per level)
3. Add caret toggle for expand/collapse
4. Implement child row hiding when collapsed
5. Add "Create child" to context menu
6. Auto-expand parent when child created
7. Update conflict detection to work with collapsed trees

**Estimated:** 4-5 hours

### Phase 3: Context Menu & Relations
**Goal:** Add right-click menu and relation targeting

Tasks:
1. Create context menu component
2. Add menu actions:
   - Open details
   - Fullscreen
   - Duplicate
   - Delete
   - Create child
   - Add predecessor
   - Add successor
3. Implement relation targeting mode:
   - UI state (cursor change, topbar hint)
   - Click target to confirm
   - ESC to cancel
4. Prevent self-relation and duplicates
5. Restore FS-only connector rendering

**Estimated:** 5-6 hours

### Phase 4: Task Details Drawer
**Goal:** Add drawer with fields, relations, and linked files

Tasks:
1. Create TaskDetailsDrawer component
2. Add sections:
   - Basics (editable fields)
   - Relations summary
   - Linked files list
3. Implement linked files:
   - Add file (OS picker, workspace-root only)
   - Open file (OS default handler)
   - Reveal in folder
   - Remove link
   - Broken link handling
4. Add drawer open/close animations
5. Preserve Gantt scroll when drawer opens

**Estimated:** 6-8 hours

### Phase 5: Polish & Persistence
**Goal:** Finalize UX and state persistence

Tasks:
1. Implement state persistence (per project):
   - scale
   - horizontal/vertical scroll
   - column visibility
   - tree expanded state
   - last selected task
2. Add tooltip with ~200ms delay
3. Add modified indicator (orange dot)
4. Test all edge cases from interaction-edge-cases.md
5. Performance validation

**Estimated:** 3-4 hours

---

## Updated Constraints

### Geometry
- Row height: **34px** ✅ (keep)
- Left panel width: **520px** (change from 320px)
- Indentation per level: **16px**
- Caret hit area: **18px**

### Time Scales
- Day scale: 1 day = **24px** (was 40px, needs adjustment)
- Week scale: 1 day = **8px**
- Month scale: 1 day = **2px**

### Table Columns (Default v1.0)
- ID (80px)
- Type (90px)
- Subject (min 220px, flex)
- Status (100px)
- Start Date (120px)
- Finish Date (120px)
- Duration (100px)
- Priority (100px)

### Relation Rules (v1.0)
- **Only FS (Finish-to-Start)**
- No lag/lead
- No auto-reschedule
- Conflict: `successor.start < predecessor.finish`

---

## Immediate Next Steps

1. **Start Phase 1A** - Restore FS-only dependencies
2. Update left panel width to 520px
3. Update day scale pixel calculation
4. Test with existing data

---

## Notes

- Previous Phase 1 commit removed all dependencies - need to restore strategically
- Focus on FS-only implementation (simpler than the previous 4-type system)
- Keep the 34px row height enforcement from Phase 1
- The editable grid will be a significant refactor of the left panel
- Linked files feature requires IPC to main process for OS operations
