# Timeline Intent Draft

> Owner: human
> Status: drafting
> Last updated: 2026-04-28

This file is the human-owned intent draft for the next Timeline design slice.
After the content is finalized, mirror the stable parts into
`workflow/active-task.yaml` under `intent`.

Do not use this file as an execution package. Implementation should only start
after `active-task.yaml` has a reviewed `execution_package` and
`current_agreement`.

## 1. Goal

Timeline is one of the core project components in SwissArmyPM.
Its goal is to help project managers track Work Packages and Subitems
through time, while also making key project-management moments visible:
milestones, kickoff, UAT, phases, issues, risks, and other user-defined
work item types.

This feature should be understood less as a simple chronological chart and
more as a time-based presentation of structured work items. The Timeline
should let a PM inspect hierarchical project work, understand date ranges,
see dependencies across the time axis, and spot risk or delay signals without
turning the product into a generic task manager.


## 2. User Context

The primary user is a project manager working inside the PM Workspace.
They use Timeline while planning, reviewing, and updating the project:

- checking whether Work Packages and Subitems are on track
- reviewing project phases, iterations, or other custom groupings
- tracking milestones such as kickoff and UAT
- seeing issues and risks in the same project-time context as delivery work
- updating structured work item facts quickly during project follow-up

The Timeline should support projects with different levels of complexity.
Simple projects may only need milestones and work packages. More complex
projects may also need phases, risks, issues, or other custom work item types.


## 3. Current Pain

The current intent to resolve:

- Timeline needs to represent project work as structured, inspectable project
  truth, not just a visual schedule.
- PMs need a hierarchical view of work items by project phase, iteration, or
  another user-defined grouping.
- PMs need a clear way to manage planned start and end dates without directly
  manipulating blocks on the chart.
- PMs need risk and delay signals at both item level and, for milestones,
  project level.
- PMs need working-day duration calculations that account for local holidays
  and user-customized calendars.


## 4. Desired Timeline Behavior

### 4.1 Timeline Model

Timeline should present Work Items along a time axis. Work Items may include:

- milestone
- phase
- workpackage
- subitem
- risk
- issue
- etc / user-defined types

Work Items should support hierarchical grouping and folding. The default mental
model is that users can group and collapse work by iteration, project phase, or
another user-defined project structure.

The visual timeline should show dependencies between work items in the time
dimension where those dependencies are defined.

### 4.2 Timeline Interaction

The implementation candidate is `react-calendar-timeline`.

Users must not directly edit item dates through timeline block interactions.
Disallowed direct chart interactions include:

- dragging a timeline block to change dates
- resizing a timeline block to change start or end dates
- changing item timing through freeform chart manipulation

The timeline itself should allow horizontal navigation through a draggable
scroll control / scroll bar.

The default time scale is week. Users may zoom in to day-level display and zoom
out to month-level display. Month is the minimum zoom granularity.

### 4.3 Work Item CRUD

Users should be able to create, read, update, and delete Work Items from this
part of the product.

Each Work Item should allow the user to define its `type`, such as milestone,
phase, workpackage, subitem, risk, issue, or another supported/custom type.

Planned dates should be edited through date pickers, not direct timeline block
manipulation.

The planned start date and planned end date should be selected in one date
picker popover/dialog that supports picking both dates together. The UI should
not force users through two separate single-date picker popups.

### 4.4 Planned Duration And Calendars

By default, required duration should be calculated from planned start date and
planned end date as a number of working days.

Working-day calculation must subtract local holidays. The product should support
user-customized calendars where the user can define holidays and working days.
The default calendar should include statutory holidays for the relevant locale.

Open design detail: define how locale is chosen and how statutory holiday data
is sourced, stored, updated, and overridden.

### 4.5 Work Item Status Flow

Newly created non-milestone tasks default to `not_started`.

For normal Work Items, status changes are driven by a status button:

- first click changes `not_started` to `in_progress`
- when changed to `in_progress`, the system records the current date as the
  actual start date
- second click changes `in_progress` to `completed`
- when changed to `completed`, the system records the current date as the
  actual end date

Open design detail: define whether a completed item can be reopened, and how
actual dates are handled if it is reopened.

### 4.6 Risk And Delay Signaling

If actual start date is later than planned start date, the item should be
flagged as at risk. The Work Item row and its timeline block should show a
distinct risk marker.

If actual end date is later than planned end date, the item should be flagged as
delayed. The Work Item row and its timeline block should show a distinct delay
marker.

The design should preserve both item-level risk/delay state and enough
structured data to explain why the marker appears.

### 4.7 Milestone Behavior

For `milestone` items, planned start date and planned end date are usually the
same day.

Milestone status should not use the normal click-to-toggle status flow.
Milestone state should only represent progressing / risk / delay.

When a milestone is marked as risk or delay:

- the same signal must be visible at the project level
- the Project Canvas risk area should be marked yellow
- the user should be prompted to enter the concrete event and response measure

Open design detail: define the exact relationship between milestone risk/delay,
Project Canvas risk display, and Risk Register entries.


## 5. Non-Goals

<!--
List what this slice must not solve.
Examples:
- portfolio-level roadmap planning
- team member personal task management
- automatic rescheduling engine
- AI silently rewriting project dates
-->

- Direct drag/drop or resize editing of Timeline item dates.
- Portfolio-level roadmap planning.
- Personal task management or My Work flows.
- Automatic rescheduling engine.
- AI silently rewriting project dates, statuses, risks, or delay facts.
- Replacing the Risk Register with timeline-only risk markers.

## 6. Invariants

<!--
Facts that must remain true regardless of implementation.
These will become active-task.yaml intent.invariants.
-->

- PM Workspace remains the product center.
- Timeline facts must be inspectable and editable as structured project truth.
- AI may suggest changes but must not silently rewrite core Timeline facts.
- Timeline design must preserve Evidence as a supporting source layer.
- Timeline is a structured Work Item presentation, not a decorative chart.
- Date changes must go through explicit structured editing controls.
- Risk and delay markers must be derived from auditable item facts.
- Milestone risk/delay must be able to surface at project level.

## 7. Constraints

<!--
Product, architecture, and implementation constraints.
These will become active-task.yaml intent.constraints.
-->

- Follow document priority: root `CLAUDE.md` -> package `CLAUDE.md` -> shared workflow docs.
- Scope is `packages/swissarmypm` unless explicitly changed.
- PMBrain must not depend on SwissArmyPM.
- SwissArmyPM must not add a package-manager-level dependency on PMBrain.
- Use parameterized SQL for data access.
- Audit Timeline data changes.
- Do not expand Portfolio / My Work / Pomodoro as the product center.
- Candidate timeline library: `react-calendar-timeline`.
- Default time scale is week; zoom may expand to day and contract to month.
- Planned start and planned end must be selectable together in a single date
  range picker interaction.
- Working-day calculations must support local holidays and user-customized
  working calendars.

## 8. Success Metrics

<!--
What must be true for the design slice to be accepted?
Make these testable where possible.
-->

- A PM can view work items grouped hierarchically by phase, iteration, or a
  user-defined structure.
- A PM can CRUD Work Items and assign supported/custom item types.
- A PM can set planned start and end dates through one date-range picker.
- Timeline blocks cannot be dragged or resized to mutate dates.
- Week is the default timeline scale, with day and month zoom bounds available.
- Planned duration is calculated in working days and excludes configured
  holidays/non-working days.
- Status button flow records actual start and actual end dates for normal Work
  Items.
- Late start and late finish are visibly marked on both Work Item rows and
  timeline blocks.
- Milestone risk/delay creates a corresponding project-level signal and prompts
  for event and response-measure input.

## 9. Unacceptable Shortcuts

<!--
Choices that may look fast but would violate product direction or create bad debt.
These will become active-task.yaml intent.unacceptable_shortcuts.
-->

- Building Timeline as a generic portfolio roadmap.
- Treating Timeline as a decorative chart without structured editable data.
- Adding AI automation that changes dates without explicit user review.
- Bypassing audit logging for Timeline mutations.
- Hardcoding mock-only behavior as production behavior.
- Using direct drag/resize interactions as the primary date editing mechanism.
- Calculating duration by raw calendar days while labeling it as working days.
- Ignoring holidays or user calendar overrides in duration calculations.
- Treating milestones exactly like normal tasks when their risk/delay behavior
  must affect project-level signals.
- Showing risk/delay colors without storing the underlying structured facts.

## 10. Open Questions

<!--
Questions to resolve before producing the execution package.
-->

- What locale should be used for the default statutory holiday calendar?
- Should holiday/calendar customization be project-level, workspace-level, or
  both?
- Which Work Item types are built-in for the first slice, and how should
  user-defined types be stored?
- What dependency types are required for the first Timeline slice?
- Can completed items be reopened, and if so how should actual dates and audit
  history behave?
- Should milestone risk/delay automatically create or link a Risk Register item?
- What exact Project Canvas risk-area behavior is expected when multiple
  milestone risks/delays exist?
- What permissions or confirmation, if any, are required before deleting Work
  Items?

## 11. Notes / References

<!--
Relevant docs, sketches, examples, or decisions.
-->

- `CLAUDE.md`
- `packages/swissarmypm/CLAUDE.md`
- `workflow/project-profile.yaml`
- `workflow/active-task.yaml`
- `docs/PRD/PRD-001-Master.md`
- `docs/history/PRD-005-Timeline.md`
- Candidate library: `react-calendar-timeline`
