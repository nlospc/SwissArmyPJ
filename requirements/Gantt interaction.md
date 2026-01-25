# SwissArmyPM v1.0 — Gantt Interaction Specification

## 1. Hover Behavior

- Hovering over TaskBar or Milestone shows tooltip
- Tooltip appears after ~200ms
- Tooltip does not block dragging

---

## 2. Drag: Move Task

Trigger:
- Dragging the center of a TaskBar

Effect:
- Start and end dates shift together
- Duration remains constant

During Drag:
- Ghost bar shown
- Live date feedback displayed

---

## 3. Drag: Resize Task

Trigger:
- Dragging left or right edge of TaskBar

Effect:
- Left edge → modifies start date
- Right edge → modifies end date
- Duration recalculated live

Constraints:
- End date cannot be before start date

---

## 4. Drag: Milestone

Trigger:
- Dragging MilestoneMarker

Effect:
- Single date shifts
- No duration involved

---

## 5. Post-Modification State

After any drag or resize:
- Task is marked as "modified"
- Visual indicator (e.g. dot or highlight) shown
- Indicator persists until saved

---

## 6. Save Semantics

- Multiple task edits can accumulate
- Save action clears all modified indicators
- No auto-cascading changes in v1.0

---

## 7. Error Prevention

- Invalid date ranges are blocked at interaction level
- No silent corrections without visual feedback

---

## 8. Animation Rules

- No decorative animations
- Only minimal positional transitions
- Movement must feel mechanical and precise
