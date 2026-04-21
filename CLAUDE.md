# CLAUDE.md — Global Product Guideline (Monorepo)

This file is the canonical working brief for all coding/design sessions in this repository.
If sub-project `CLAUDE.md` files conflict with this file, **this file wins**.

---

## Monorepo Overview

**SwissArmyPM** is a monorepo containing two independent but complementary sub-projects:

| Package | Location | Purpose |
|---|---|---|
| **SwissArmyPM Desktop** | `packages/swissarmypm/` | Electron + React + Vite desktop workbench for project managers |
| **PMBrain** | `packages/pmbrain/` | Bun + TypeScript CLI knowledge brain with SQLite, Obsidian vault projection, and MCP surface |

Both sub-projects retain fully independent build, dev, and release pipelines. The monorepo provides structural cohesion, shared documentation, and future cross-package integration.

### Navigation

- **Global product direction** → this file (`/CLAUDE.md`)
- **Desktop-specific guidelines** → `packages/swissarmypm/CLAUDE.md`
- **CLI/MCP/Vault guidelines** → `packages/pmbrain/CLAUDE.md`
- **Shared documentation** → `docs/` (PRDs, architecture, PMBOK guideline)
- **Agent instructions** → `AGENTS.md`

---

## Canonical Product Direction

### SwissArmyPM Desktop — PM Workbench

**SwissArmyPM** is a **desktop workbench for project managers only**.

It is **not** a generic project collaboration suite, **not** a PMO portfolio platform, and **not** a personal productivity / pomodoro tool.

The product must help a project manager quickly **store, update, review, and trust** key project information in one place.

#### Primary User

- Only user served by the product: **Project Manager**
- Product form: **independent desktop workbench**
- Operating mode: **single-user first**, local-first, evidence-aware

#### MVP/Core Objects

1. **Project Canvas**
2. **Stakeholders**
3. **Timeline Plan**
4. **Risk Register**
5. **Work Packages**
6. **Evidence** (meeting notes, emails, IM snippets, documents)

### PMBrain — Knowledge Brain

**PMBrain** is a local-first PM knowledge brain that ingests meetings, emails, and artifacts, normalizes them into typed PM records, persists them in SQLite, projects them into an Obsidian vault, and exposes structured tools via MCP.

It complements the desktop app by providing a CLI-accessible, scriptable knowledge layer that can run independently or be consumed by SwissArmyPM in the future.

---

## Shared Product Principles

These principles govern **both** sub-projects:

1. **PM-first, not organization-first**
   - Optimize for the project manager's daily operating surface.
   - Do not assume broad team adoption.

2. **Independent workbench first**
   - Each tool should be useful standalone.
   - External integrations are future accelerators, not prerequisites.

3. **Structured truth before automation**
   - Manual CRUD for core project objects comes before autonomous agent workflows.
   - AI can suggest, but must not define the data model.

4. **Evidence-backed facts**
   - Important answers should be traceable to source material.
   - Future agent workflows must write proposals, not silently mutate core project facts.

5. **Fast updates over heavy workflows**
   - Every core page should support quick add / quick edit.
   - The product should reduce PM friction, not introduce enterprise ceremony.

---

## Core Job To Be Done

A project manager opens the app and can within seconds:

- find the current truth of a project
- update key facts quickly
- review timeline / risks / stakeholders / work packages
- attach or inspect source evidence
- answer questions such as "what is the committed delivery date?" with a value plus source

---

## Current Agreed Scope

### In Scope Now

- Project workspace as the main product shell
- CRUD for project canvas, stakeholders, timeline plan, risk register, and work packages
- Evidence collection as a supporting module
- PMBrain CLI for setup, project init, risk matrix, stats, vault sync, and MCP serve
- Future-ready slots for AI extraction and change proposals

### Explicitly Out of Scope as Product Center

- PMO-style portfolio governance as the main narrative
- personal task center / pomodoro as the main narrative
- broad multi-role workflows for executives / PMO / tech leads
- rebuilding a general-purpose agent from scratch

---

## Architecture Guidance

### Monorepo Structure

```
D:\code\SwissArmyPM/
├── package.json                  ← workspace orchestrator (workspaces: ["packages/*"])
├── packages/
│   ├── swissarmypm/              ← Electron desktop app
│   │   ├── src/                  ← main/, preload/, renderer/, shared/
│   │   ├── design/               ← Living prototype & component library
│   │   ├── vite.config.ts
│   │   └── CLAUDE.md             ← desktop-specific guidelines
│   └── pmbrain/                  ← CLI + MCP knowledge brain
│       ├── src/                  ← cli.ts, commands/, core/
│       ├── docs/architecture.md
│       └── CLAUDE.md             ← CLI/MCP/Vault guidelines
├── docs/                         ← shared docs (PRDs, PMBOK guideline)
├── CLAUDE.md                     ← this file (global guideline)
├── AGENTS.md                     ← agent instructions
└── README.md
```

### Preferred Data Direction (Shared Domain)

Move toward these domain concepts across both sub-projects:

- `Project`
- `ProjectCanvas`
- `Stakeholder`
- `TimelineItem`
- `Risk`
- `WorkPackage`
- `Evidence`
- later: `FactAssertion`, `ChangeProposal`

### Avoid Reinforcing Old Center of Gravity

Do not treat these as the long-term center of the app:

- `Portfolio`
- `My Work`
- `Pomodoro`
- generic `Todo`
- portfolio dashboard as the primary homepage

They may remain temporarily in code, but they are **legacy direction**, not the target product definition.

---

## Build Strategy

Use existing agent capabilities where needed. Do **not** rebuild an agent runtime from zero unless a very specific low-level capability is impossible to reuse.

The moat should come from the **project-management domain layer**, not from a custom agent shell.

That domain layer should eventually center on:

- project facts
- evidence provenance
- structured updates
- conflict handling
- trustworthy answers with source

---

## Shared Documentation

The `docs/` directory at the repository root is the shared documentation hub for both sub-projects:

- `docs/PMBOK-GBRAIN-GUIDELINE.md` — PMBOK mindset + GBrain adoption baseline (shared product guideline)
- `docs/PRD/` — Product Requirements Documents
- `docs/architecture/` — Technical architecture docs
- `docs/MEMORY.md` — Current stable consensus
- `docs/getting-started.md` — Onboarding guide

Both sub-projects should reference shared docs via relative paths from their own `CLAUDE.md`.

---

## Documentation Priority Order

When documents disagree, follow this order:

1. `/CLAUDE.md` (this file)
2. Sub-project `CLAUDE.md` (`packages/*/CLAUDE.md`)
3. `docs/PMBOK-GBRAIN-GUIDELINE.md`
4. `docs/MEMORY.md`
5. `docs/PRD/PRD-001-Master.md`
6. `docs/overview.md`
7. other historical docs

## Documentation Hygiene Rule

When changing product direction again in the future:

- update the canonical documents above first
- explicitly mark superseded assumptions
- do not leave obsolete roadmap language as if it were current
