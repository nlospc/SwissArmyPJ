# SwissArmyPM v1.0 — Interaction Edge Cases

## A. Hierarchy / Folding
1) Collapsing a parent hides all descendants in both table and timeline (no aggregation).
2) Creating a child under a collapsed parent auto-expands the parent.
3) Deleting a parent with children:
   - v1.0: block delete with message OR require confirm “delete all children” (choose one and document).
4) Sorting with hierarchy:
   - v1.0 recommended: sort applies within the same parent scope (siblings only), not global flatten.

## B. Date Editing / Dragging
1) Resize to invalid range (finish < start) must be blocked.
2) Dragging beyond visible timeline range:
   - timeline should auto-scroll horizontally during drag near edges (optional)
   - if not implemented, constrain drag within visible range and show hint.
3) Milestone must not display duration; if start/finish both set, treat as milestone date only.
4) Date picker range selection:
   - pick start -> immediately pick end -> auto-close
   - if user clicks only once, keep picker open and highlight that end date is pending.

## C. Relation Creation
1) Relation targeting mode must have clear UI state (cursor change or topbar hint).
2) ESC cancels targeting mode.
3) Prevent self-relation.
4) Prevent duplicate relation between same pair (show toast “already exists”).
5) If target is in collapsed subtree:
   - allow selection by clicking row after expanding; no hidden targeting.

## D. Conflict Highlighting
1) Conflict must appear in at least two places:
   - relation line highlight
   - successor row/bar warning badge
2) Conflict clears immediately when user reschedules dates to satisfy FS.

## E. Linked Local Files
1) Linking a file outside workspace root:
   - block and show warning OR copy into workspace (v1.0 recommend: block).
2) Opening missing file:
   - show error and offer “reveal folder” if path exists.
3) Renamed/moved file:
   - v1.0: show as broken link; allow user to relink.

## F. Details Drawer
1) Opening details should not reset scroll position in gantt.
2) Deleting task from details must close drawer and remove row/bar cleanly.
3) Adding file link from details updates immediately in the list.
