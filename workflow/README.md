# Workflow

This directory stores Codex task state.

Read before implementation:

- `active-task.yaml`
- `handoff.md`
- `task.schema.json`
- `../docs/DEVELOPMENT-WORKFLOW.md`

## Layers

- `intent`: human-owned task skeleton
- `execution_package`: AI-authored work package
- `current_agreement`: current-slice agreement
- `schema_contract`: data/API/persistence contract
- `design_contract`: design and UI source contract
- `fixture_contract`: deterministic data contract
- `visual_acceptance`: screenshot and layout acceptance contract

Run this after workflow edits:

```bash
npm run verify:workflow
```
