# Workflow Handoff

## Current Goal
- Evaluate the implemented Project Workspace canvas-first layout slice.

## Completed This Round
- Captured the human review feedback that the current SwissArmyPM frontend
  hierarchy is too deep and crowded.
- Identified the duplicate navigation problem: the app sidebar exists, but
  `ProjectWorkbenchPage` creates a second full Project Workspace module rail.
- Added `docs/PRD/cross-cutting/PRD-202-WorkbenchLayoutDesignLanguage.md` with
  the proposed layout model, sidebar responsibility, design language,
  implementation slices, acceptance criteria, and open questions.
- Replaced the active workflow task with a Workbench layout/design-language
  review task and kept it at `awaiting_human_review`.
- Added `workflow/intent.md` as a draft template for Timeline feature design intent.
- Expanded `workflow/intent.md` with the user's Timeline intent covering
  Work Item hierarchy, item CRUD, date-range editing, calendar-aware working-day
  duration, status flow, risk/delay signals, and milestone project-level risk
  behavior.
- Mirrored the stable Timeline intent into `workflow/active-task.yaml`.
- Generated a first AI-authored execution package, acceptance list, task
  contract, edge cases, verification checklist, forbidden changes, and current
  agreement.
- Set `workflow/active-task.yaml` to `awaiting_human_review` rather than
  starting implementation.
- Added `docs/PRD/modules/PRD-103-TimelineWorkItems-Pseudocode.md` with
  domain model, business rules, renderer interaction, IPC/store, persistence,
  audit, and first-slice pseudocode.
- Updated `workflow/active-task.yaml` to `planning_slice` for the pseudocode
  planning step.
- Advanced `workflow/active-task.yaml` to `executing`, implemented the first
  runnable Timeline Work Items slice, then moved it to `evaluating`.
- Connected Project Workspace Timeline to the real Work Item CRUD timeline view.
- Added planned working-day calculation, late-start risk and late-finish delay
  markers, read-only timeline blocks, week/day/month scale controls, and status
  button flow that records actual start and actual end dates.
- Added `actual_start_date` and `actual_end_date` to shared types, main-process
  schema safety checks, IPC create/update handling, mock IPC, and optimistic
  store state.
- Ran `npm install` with elevated permissions to restore missing declared
  dependencies needed by the local workspace.
- Accepted the Workbench layout direction after human instruction to implement.
- Reworked `ProjectWorkbenchPage` into a canvas-first shell: compact project
  header, lightweight left tools panel, dominant central work surface, and
  right contextual Drawer opened only on demand.
- Removed the permanent in-page Workbench module rail and permanent right
  inspector from the Project Workspace page.
- Updated Project Canvas cards so they show scannable summaries and open
  detailed content in the contextual Drawer.
- Let the Timeline panel inherit the main work surface height instead of
  living in a fixed-height framed block.

## Changed Files
- `docs/PRD/cross-cutting/PRD-202-WorkbenchLayoutDesignLanguage.md`
- `workflow/intent.md`
- `docs/PRD/modules/PRD-103-TimelineWorkItems-Pseudocode.md`
- `packages/swissarmypm/src/shared/types/index.ts`
- `packages/swissarmypm/src/main/database/schema.ts`
- `packages/swissarmypm/src/main/ipc/workItemHandlers.ts`
- `packages/swissarmypm/src/renderer/lib/ipc.ts`
- `packages/swissarmypm/src/renderer/lib/timeline-workitems.ts`
- `packages/swissarmypm/src/renderer/stores/useWorkItemStore.ts`
- `packages/swissarmypm/src/renderer/components/gantt/timeline-adapter.ts`
- `packages/swissarmypm/src/renderer/components/gantt/WorkItemExcelGantt.tsx`
- `packages/swissarmypm/src/renderer/features/workbench/components/WorkbenchTimelinePanel.tsx`
- `packages/swissarmypm/src/renderer/features/workbench/components/WorkbenchHeader.tsx`
- `packages/swissarmypm/src/renderer/features/workbench/components/WorkbenchCanvasPanel.tsx`
- `packages/swissarmypm/src/renderer/pages/ProjectWorkbenchPage.tsx`
- `workflow/active-task.yaml`
- `workflow/handoff.md`

## Verification
- Command: `npm run verify:workflow`
- Result: Passed. `[workflow-verify] active task is valid`
- Command: `npm run verify:workflow`
- Result: Passed. `[workflow-verify] active task is valid`
- Command: `npm run type-check:swissarmypm`
- Result: Passed.
- Command: `npm run verify:swissarmypm`
- Result: Failed once under sandbox with `spawn EPERM` while loading Vite config,
  then passed when rerun with elevated permissions.
- Command: `npm run type-check:swissarmypm`
- Result: Passed after the Gantt rendering fix.
- Command: `npm run verify:swissarmypm`
- Result: Failed once under sandbox with `spawn EPERM` while loading Vite config,
  then passed when rerun with elevated permissions.
- Command: `npm run type-check:swissarmypm`
- Result: Passed after the canvas-first layout implementation.
- Command: `npm run verify:workflow`
- Result: Passed. `[workflow-verify] active task is valid`
- Command: `npm run verify:swissarmypm`
- Result: Failed once under sandbox with `spawn EPERM` while loading Vite config,
  then passed when rerun with elevated permissions.

## Open Risks / Blockers
- Default statutory holiday locale and calendar source remain unresolved.
- The implementation uses the existing `vis-timeline` stack rather than adding
  `react-calendar-timeline`; the runtime behavior now matches the current
  no-drag date mutation requirement.
- Milestone project-level risk behavior may overlap with existing Project
  Canvas and Risk Register models.
- The pseudocode intentionally leaves reopen behavior, calendar scope, custom
  type governance, and milestone-to-Risk-Register linkage as review decisions.
- Project-level yellow risk canvas prompting is not implemented in this first
  slice; milestone risk behavior still needs a dedicated follow-up slice.

## Recommended Next Step
- Run `npm run verify:swissarmypm`, then inspect the Project Workspace in the
  dev app with a selected project.

## Notes For Next Agent
- Current workflow state is `evaluating`; the first layout implementation slice
  is in code and the Gantt rendering fix passed package verification. The app
  still needs human visual inspection in the dev browser.
