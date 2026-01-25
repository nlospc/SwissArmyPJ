# SwissArmyPM v1.0 — MULTI_AGENT_PLAN (Gantt-first)

> Scope lock: **v1.0 only**. Gantt is the primary view. Local-first, AI-optional. No dependencies/arrows, no collaboration, no dashboards.

This plan orchestrates the four sub-agents (Architect / Builder / Validator / Scribe) into a single controlled delivery pipeline using the approved design artifacts:

* `design.md`
* `components.md`
* `interactions.md`

---

## Executive Summary

SwissArmyPM v1.0 ships a professional, engineering-style Gantt experience inspired by OpenProject’s structural clarity:

* **Dual-axis layout**: Task Tree (left) + Timeline Canvas (right) with strict row alignment
* **Fast inspection**: rich hover tooltip with core attributes
* **Direct manipulation**: drag move + drag resize + milestone drag
* **Predictable edits**: modified/unsaved indicators, no auto-cascading

The delivery approach is **doc-driven** and **role-separated**:

* Architect freezes intent and constraints
* Builder implements only what is frozen
* Validator tries to break it and proves compliance
* Scribe consolidates everything into stable docs and checklists

---

## 1. Inputs (Frozen Design Artifacts)

### 1.1 Source of Truth

* `design.md` — design objective, philosophy, layout rules, non-goals, success criteria
* `components.md` — component inventory, responsibilities, constraints
* `interactions.md` — interaction semantics, states, save rules, anti-error rules

### 1.2 Immutable v1.0 Scope (Non-Goals)

* No dependency arrows
* No resources/assignees
* No collaboration
* No dashboards/reports
* No AI buttons in primary UI
* No complex filtering/search

---

## 2. High-Level Architecture Fit (Local-first / Electron)

### 2.1 Product Reality

SwissArmyPM is a desktop app (Electron). v1.0 Gantt should be:

* deterministic
* smooth at moderate scale
* structured like an instrument panel

### 2.2 Data Model (Minimum)

A v1.0 task entity (work item) MUST contain:

* `id`, `title`
* `type`: `task | issue | milestone`
* `status`: `open | in_progress | done`
* `priority`: `low | medium | high`
* `startDate` (day precision)
* `endDate` (for milestone either omitted or equals start)

Derived:

* `durationDays` (read-only, derived from dates)

---

## 3. Work Breakdown by Agent (Joint Plan)

### 3.1 Architect Agent — “Freeze the Operating Rules”

**Goal:** eliminate ambiguity that causes rework.

**Deliverables**

1. `gantt-constraints.md` (supplement) containing:

* row height (e.g. 34px) fixed
* left panel width fixed (e.g. 300px)
* time unit = day; scale mapping rules
* visual hierarchy rules (grid must be low contrast)
* type geometry rules (task bar / issue outline / milestone diamond)

2. `interaction-edge-cases.md`:

* drag beyond visible range
* resizing to zero days
* milestone behavior
* invalid date prevention rule (block vs auto-correct)

**Acceptance (for Architect stage)**

* No ambiguous wording like “nice”, “smooth”, “better” without measurable behavior
* Every interaction has a defined start condition, live feedback, and end state

---

### 3.2 Builder Agent — “Implement Exactly What’s Frozen”

**Goal:** produce working code matching the three specs (no feature invention).

**Primary Deliverables**

1. `GanttView` implementation with strict dual-panel sync
2. Core components from `components.md`:

* `TopBar`
* `TaskTreePanel`
* `TimelineCanvas`
* `TimeHeader`
* `TimeGrid`
* `TaskRow`
* `TaskBar` / `MilestoneMarker`
* `Tooltip`

3. Interaction handlers per `interactions.md`:

* hover tooltip delay ~200ms
* drag move (center)
* resize (edges)
* milestone drag
* modified markers
* save semantics

**Implementation Constraints**

* Do not add dependency arrows
* Do not add new scale levels
* Do not add new panels
* No “auto re-schedule” behavior

**Builder Output Format**

* A short `IMPLEMENTATION_NOTES.md` describing:

  * how row sync is enforced
  * how date↔pixel conversion is done
  * how scale changes affect rendering only
  * how modified state is tracked and cleared on save

---

### 3.3 Validator Agent — “Assume Builder is Wrong”

**Goal:** prevent silent drift from the specs.

**Deliverables**

1. `validation-report.md` with:

* spec compliance checklist (pass/fail)
* edge case outcomes
* UX risk flags (confusion risk, discoverability risk)

2. `test-cases.md`:

* manual test steps for each interaction
* expected results in measurable terms

**Core Validation Checklist**

* Row alignment never breaks (left vs right)
* Scale switch does not change stored dates
* Grid lines remain background (contrast low)
* Drag move keeps duration constant
* Resize updates duration and blocks invalid ranges
* Modified indicator persists until save
* Tooltip shows required fields and never blocks drag

---

### 3.4 Scribe Agent — “Make It Recoverable in 30–60 Seconds”

**Goal:** reduce cognitive load and preserve decisions.

**Deliverables**

1. `docs/GANTT_V1_SPEC.md` (consolidated) containing:

* layout
* components
* interactions
* out-of-scope

2. `docs/GANTT_TEST_CHECKLIST.md`

* short, copy-paste-able checklist for each release

3. `docs/DECISIONS.md`

* what was chosen (row height, scale behavior, type geometry)
* why it was chosen
* what alternatives were rejected

---

## 4. Phases (MVP-first, Low Risk)

### Phase 0 — Spec Freeze (Architect)

**Outputs:** `gantt-constraints.md`, `interaction-edge-cases.md`
**Gate:** Human approves constraints

### Phase 1 — Skeleton Layout (Builder)

* Dual-panel layout
* synced scrolling
* time header + grid
  **Gate:** Validator confirms alignment and scroll sync

### Phase 2 — Core Objects (Builder)

* render TaskBar/Issue/Milestone geometry
* basic tooltip
  **Gate:** Validator confirms geometry + tooltip content

### Phase 3 — Direct Manipulation (Builder)

* drag move / resize / milestone drag
* modified state
* save semantics
  **Gate:** Validator runs interaction test cases

### Phase 4 — Polish (Builder)

* contrast tuning
* focus/keyboard basics (optional, minimal)
* performance sanity (no virtual scroll required in v1.0)
  **Gate:** Human checks “30-second comprehension” criterion

---

## 5. Acceptance Criteria (v1.0 Definition of Done)

### 5.1 Product-Level

* App opens directly into Gantt view
* User can create a task and see it immediately in the grid
* User can hover any task and view: title/type/start/end/duration/priority
* User can drag tasks and confidently understand what changed

### 5.2 Interaction-Level

* Hover tooltip: appears ~200ms, disappears on mouse leave, never traps the cursor
* Drag move: updates start+end together; duration constant
* Resize: edges adjust start/end; invalid range blocked
* Milestone: diamond marker draggable horizontally only
* Modified indicator: shown after change; cleared only by save

### 5.3 Scope Compliance

* No dependencies, no collaboration, no dashboards
* No auto rescheduling
* Only day/week/month scales

---

## 6. Claude Usage Workflow (How to Run the Agents)

### 6.1 Preparation (Human)

Provide Claude with:

* `design.md`
* `components.md`
* `interactions.md`

Optionally also provide:

* repo snapshot or relevant file list (if Builder will implement code)

### 6.2 Recommended Run Order

1. **Architect prompt** → freezes constraints
2. Human approves
3. **Builder prompt** → produces implementation plan + code
4. **Validator prompt** → produces validation + test cases
5. Human approves/requests changes
6. **Scribe prompt** → consolidates docs

### 6.3 Prompt Templates

#### Architect

```
You are the Architect agent.
Using design.md, components.md, interactions.md:
1) produce gantt-constraints.md with measurable constraints
2) produce interaction-edge-cases.md with explicit edge cases
Do not introduce features outside v1.0.
```

#### Builder

```
You are the Builder agent.
Implement the v1.0 Gantt view strictly per design.md, components.md, interactions.md.
Do not invent new features.
Output:
- component code
- interaction handlers
- IMPLEMENTATION_NOTES.md explaining how constraints are enforced.
```

#### Validator

```
You are the Validator agent.
Assume the Builder output is wrong.
Check against interactions.md and design.md.
Output:
- validation-report.md (pass/fail + issues)
- test-cases.md (manual steps + expected results)
```

#### Scribe

```
You are the Scribe agent.
Consolidate approved specs and decisions into:
- docs/GANTT_V1_SPEC.md
- docs/GANTT_TEST_CHECKLIST.md
- docs/DECISIONS.md
Do not introduce new decisions.
```

---

## 7. Risk Controls (Prevent Drift)

* Any suggestion that adds dependency arrows, dashboards, or collaboration is **invalid for v1.0**.
* Any deviation from dual-panel row alignment is a **release blocker**.
* Any auto-adjustment of dates without explicit user action is **invalid for v1.0**.

---

## 8. What This Plan Enables Next (v1.1+ hooks)

Without implementing them now, this plan leaves clean extension points for:

* dependencies
* virtual scrolling
* portfolio aggregation
* AI-assisted planning

v1.0 ships a solid, auditable, predictable Gantt engine first.
