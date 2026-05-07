# Development Workflow

## Goal

Keep Codex-driven development stable by shrinking each slice and making the task contract explicit before code changes.

## Required Task Layers

`workflow/active-task.yaml` is the source of truth.

Every non-idle task must define:

- `intent`: human-owned goal, non-goals, invariants, constraints, success metrics, unacceptable shortcuts
- `execution_package`: AI-authored spec, acceptance, path boundaries, required outputs, edge cases, verification checklist, forbidden changes
- `current_agreement`: current-slice assumptions, boundaries, acceptance mapping, risks, split recommendation
- `schema_contract`: required for data model, migration, API, or persistence changes
- `design_contract`: required for UI or design-system changes
- `fixture_contract`: required when verification needs deterministic data
- `visual_acceptance`: required when UI layout or styling changes

## Slice Types

Use one slice type at a time:

- `docs_only`
- `schema_only`
- `pmbrain_api`
- `ui_mock`
- `ui_wired`
- `design_system`
- `visual_fix`
- `integration`

Avoid slices that change schema, API, UI, visual style, and workflow state all at once.

## Schema Gate

Before any data-changing implementation, define:

- target entities
- field names and types
- source-of-truth owner
- migration behavior
- source link behavior
- audit or ingest log behavior
- fixture data
- verification command

## Design Gate

Before any UI implementation, define:

- target Figma frame or design artifact
- layout states
- empty/loading/error states
- dense data state
- responsive expectations
- forbidden visual shortcuts
- screenshot acceptance

## Verification Gate

Every slice must end with the narrowest useful verification command.

Use:

```bash
npm run verify:workflow
npm run verify:pmbrain
npm run verify:workspace
```

SwissArmyPM Web verification commands will be added after scaffold approval.
