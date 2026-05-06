# Workflow

This directory stores the repo-level workflow handoff state shared by Hermes, Claude Code, and future agents.

Start here before implementation/debugging/review:
- `project-profile.yaml`
- `active-task.yaml`
- `handoff.md`
- `task.schema.json`

Rules:
- Treat these files as the shared workflow state.
- Keep `active-task.yaml` current when taking or releasing the active writer role.
- Update `handoff.md` before ending a work session.
- Use the verify command defined in `project-profile.yaml`.
- Run `npm run verify:workflow` before execution when `active-task.yaml` changes.

## Structured Task Layers

`active-task.yaml` is the source of truth for the current task. It is intentionally split into layers:

1. `intent`
   - Human-owned task skeleton.
   - Must define goal, non-goals, invariants, constraints, success metrics, and unacceptable shortcuts.
   - Planner, evaluator, and executor must not silently rewrite this layer.

2. `execution_package`
   - AI-generated, human-reviewed work package.
   - Must define spec, acceptance, task contract, edge cases, verification checklist, and forbidden changes.
   - Acceptance entries are the root definition of done for the task.

3. `current_agreement`
   - Planner/evaluator agreement for the current slice only.
   - May define assumptions, boundaries, acceptance mapping, risks, and whether the task should be split.
   - Must not change intent, non-goals, system constraints, or acceptance root definitions.

4. Executor input
   - Executor consumes `execution_package` plus `current_agreement`.
   - Executor should not rely on free-form chat as the primary task contract.

5. Evaluator review
   - First review spec compliance: acceptance, scope boundaries, required outputs, and forbidden changes.
   - Then review code quality: maintainability, tests, regression risk, and implementation clarity.

## Validation

`workflow/task.schema.json` defines the required structure. `scripts/verify-workflow-task.mjs` enforces:

- required fields and legal enum values
- complete task structure even when idle
- non-empty intent and execution fields when status is not `idle`
- explicit forbidden changes
- verification checklist presence
- `current_agreement.acceptance_mapping` references only declared acceptance IDs
