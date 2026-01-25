# SwissArmyPM v1.0 — Gantt Design Specification

## 1. Design Objective

SwissArmyPM v1.0 focuses on a single core capability:

> Enable a user to understand and adjust a project's task-time structure
> within 30 seconds using a Gantt-centric interface.

This Gantt view is the primary and default interface of the product.

---

## 2. Design Philosophy

- Engineering-first, not marketing-first
- Clarity over visual richness
- Structure before aesthetics
- Predictability over delight

The interface should feel closer to:
- OpenProject
- Microsoft Project
- Engineering planning tools

And explicitly not resemble:
- Dashboards
- Card-based SaaS UIs
- Kanban boards

---

## 3. Global Layout Rules

### 3.1 Single Main View

- No dashboard
- No overview page
- App opens directly into the Gantt view

### 3.2 Dual-Axis Gantt Model

The Gantt view consists of two strictly synchronized panels:

1. Left Panel: Task Tree (Structure Axis)
2. Right Panel: Timeline Canvas (Time Axis)

Rules:
- One task = one row across both panels
- Row height is fixed and must never auto-resize
- Vertical scrolling is synchronized

---

## 4. Visual Hierarchy

Priority of attention (highest → lowest):

1. Task bars / milestones
2. Task titles
3. Modified / unsaved indicators
4. Time grid
5. Background chrome

Time grids must always remain visually subordinate to task objects.

---

## 5. Time Representation

- Internal time unit: day
- Supported display scales:
  - Day
  - Week
  - Month
- Changing scale affects display density only, never task data

---

## 6. Task Semantics

Task types are structural concepts, not styling options:

- Task: duration-based work
- Issue: problem or blocking item
- Milestone: single-point event

These must be represented primarily by geometry, not color.

---

## 7. Explicit Non-Goals (v1.0)

The following are intentionally excluded:

- Task dependencies and arrows
- Resource or people management
- Collaboration features
- AI-assisted planning
- Dashboards or reports
- Complex filtering

---

## 8. Success Criteria

The design is considered successful if:

- A new user can estimate project end date in under 30 seconds
- Task overlaps and tight schedules are visually obvious
- Time adjustments feel safe and predictable
- No documentation is required to perform core actions
