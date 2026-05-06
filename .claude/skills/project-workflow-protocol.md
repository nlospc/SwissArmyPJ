# Project Workflow Protocol

Use this skill before any coding, debugging, refactoring, or review task in this repository.

## Purpose

Keep Claude Code aligned with the same repo workflow whether it is used directly or coordinated by Hermes.
The canonical workflow state lives in repo files, not in chat history.

## Read First

Before starting work, read in this order:
1. `CLAUDE.md`
2. the relevant package `CLAUDE.md`
3. `workflow/project-profile.yaml`
4. `workflow/active-task.yaml`
5. `workflow/handoff.md`

If the task touches product or module behavior, also read:
- `docs/MEMORY.md`
- `docs/PRD/PRD-001-Master.md`
- the relevant module PRD

If the task touches architecture or file organization, also read:
- `docs/architecture/RETRIEVAL-UNIT-GUIDANCE.md`

## Entry Protocol

Before making changes:
1. Check `git status --short --branch`.
2. Confirm the current active task, role, and active writer from `workflow/active-task.yaml`.
3. Confirm scope and forbidden areas from `workflow/project-profile.yaml` and the task handoff.
4. Run `npm run verify:workflow` if `workflow/active-task.yaml` changed or if the task is not idle.
5. If PRD/design is missing, or scope is unclear, stop before implementation.

## Execution Rules

1. Treat repo workflow files as the shared source of truth.
2. Do not silently redefine goals, scope, or non-goals.
3. Stay within the currently active task.
4. Prefer reusable, extensible changes over throwaway scaffolding.
5. Do not continue Portfolio / My Work / Pomodoro drift unless explicitly requested.
6. Preserve SwissArmyPM desktop-first workbench semantics.
7. Executor work must follow `execution_package` and `current_agreement`, not free-form chat context alone.

## Planner And Evaluator Boundary

Planner and evaluator may only interpret the current task slice:
- current task assumptions
- current task boundaries
- acceptance mapping
- risk notes
- whether the task should be split smaller

Planner and evaluator must not silently modify:
- `intent.goal`
- `intent.non_goals`
- `intent.invariants`
- `intent.constraints`
- acceptance root definitions
- system-level forbidden changes

Changing those fields requires returning to human review before implementation continues.

## Exit Protocol

Before ending work:
1. Run the verify command defined in `workflow/project-profile.yaml`.
2. Update `workflow/handoff.md` with:
   - current goal
   - completed work
   - changed files
   - verify result
   - open risks / blockers
   - recommended next step
3. Update `workflow/active-task.yaml` with current status and active writer state.

Evaluator review should be reported in two passes:
1. Spec compliance: acceptance, required outputs, scope boundaries, and forbidden changes.
2. Code quality: maintainability, tests, regressions, and implementation risks.

## Escalate Instead of Guessing

Stop and escalate when:
- the relevant PRD/design is missing
- scope must expand beyond the current task
- the change crosses multiple domains or contracts unexpectedly
- you would need to modify forbidden areas

## Role Note

This is a workflow skill, not a role-specific agent persona.
It applies to implementation, debugging, review, and refactor tasks alike.
Separate reviewer/implementer agents may exist later, but they should still follow this protocol first.
