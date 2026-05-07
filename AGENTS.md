# AGENTS.md

Repository-level guide for Codex agents. This file is the highest-priority engineering and product guide in this repo.

## Product Direction

SwissArmyPJ is being reset around a PMBrain-first architecture.

The product goal is a local-first project manager workbench grounded in PMBOK and agile practice. The system helps a project manager turn scattered project evidence into structured, traceable project facts, then use those facts to manage timeline, risks, stakeholders, work packages, evidence, and project decisions.

The durable product loop is:

```text
Evidence -> Structured Facts -> PM Confirmation -> Traceable PM Workspace
```

AI may extract, compare, summarize, and propose changes. AI must not silently rewrite core project facts.

## Repository Shape

Current master intentionally keeps only the PMBrain-first foundation and design documents.

| Area | Path | Purpose |
|---|---|---|
| PMBrain | `packages/pmbrain/` | Local-first PM data kernel, CLI, MCP surface, SQLite source of truth, Obsidian projection |
| SwissArmyPM design | `docs/` | Product, architecture, schema, design, and workflow contracts for the new local web workbench |
| Workflow state | `workflow/` | Codex task state, schema validation, and handoff notes |

The previous Electron + Ant Design + SQLite SwissArmyPM implementation is preserved on branch `fit-electron-legacy`.

## Target Architecture

SwissArmyPM will be rebuilt as a local web workbench over PMBrain, not as an Electron-first app.

Target layering:

```text
PMBrain
  SQLite / ingest / schema / MCP / CLI / evidence / proposals

SwissArmyPM Web
  local web UI / typed PMBrain client / PM workspace workflows

Design System
  Open Design exploration / Figma canonical design / screenshot acceptance

Optional Desktop Shell
  Electron or Tauri only after the web and PMBrain contracts stabilize
```

## Core Rules

1. PMBrain is the canonical local PM kernel.
2. SwissArmyPM Web consumes typed PMBrain contracts instead of owning a separate domain truth.
3. Obsidian vault is a human-readable projection layer, not the only source of truth.
4. Every important project fact should be traceable to evidence when possible.
5. Agent outputs must preserve source links, uncertainty, and PM confirmation boundaries.
6. Do not rebuild the old Electron implementation on `master`.
7. Do not introduce Portfolio, My Work, Pomodoro, or generic collaboration as product centers.
8. Use parameterized SQL for all database access.
9. Keep task scope small enough for agent execution and verification.
10. Prefer repo-enforced workflow contracts over chat-only process rules.

## Canonical Commands

Run from repo root:

```bash
npm run verify:workflow
npm run verify:pmbrain
npm run verify:workspace
npm run dev:pmbrain
```

SwissArmyPM Web commands will be added only after the new app scaffold is approved.

## Workflow Contract

Before implementation, read:

- `workflow/active-task.yaml`
- `workflow/handoff.md`
- `workflow/task.schema.json`
- `docs/DEVELOPMENT-WORKFLOW.md`

Every executable slice must have:

- human-owned `intent`
- AI-authored `execution_package`
- current-slice `current_agreement`
- `schema_contract` when data changes
- `design_contract` when UI changes
- `fixture_contract` when verification requires data
- `visual_acceptance` when UI layout or styling changes

The executor must not silently rewrite intent, non-goals, invariants, or acceptance roots.

## Design Workflow

Open Design is used for fast style exploration.

Figma is the canonical design system and page-spec source when available through MCP.

The implementation path is:

```text
Open Design exploration
  -> Figma tokens/components/screens
  -> Codex implementation slice
  -> Playwright screenshot acceptance
```

Do not copy Open Design HTML directly into production code.

## Verification

For workflow-only changes:

```bash
npm run verify:workflow
```

For PMBrain changes:

```bash
npm run verify:pmbrain
```

For repo-wide completion:

```bash
npm run verify:workspace
```

If a command fails due to environment permissions, report the exact failure and distinguish it from a product/code failure.
