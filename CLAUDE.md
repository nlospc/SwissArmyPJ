# CLAUDE.md

This file is the canonical working brief for future coding/design sessions in this repository.

## Canonical Product Direction

**SwissArmyPM** is a **desktop workbench for project managers only**.

It is **not** a generic project collaboration suite, **not** a PMO portfolio platform, and **not** a personal productivity / pomodoro tool.

The product must help a project manager quickly **store, update, review, and trust** key project information in one place.

## Primary User

- Only user served by the product: **Project Manager**
- Product form: **independent desktop workbench**
- Operating mode: **single-user first**, local-first, evidence-aware

## MVP/Core Objects

The core data objects that must become first-class citizens are:

1. **Project Canvas**
2. **Stakeholders**
3. **Timeline Plan**
4. **Risk Register**
5. **Work Packages**
6. **Evidence** (meeting notes, emails, IM snippets, documents)

These objects are the product center. Other modules are secondary unless they directly support these objects.

## Core Job To Be Done

A project manager opens the app and can within seconds:

- find the current truth of a project
- update key facts quickly
- review timeline / risks / stakeholders / work packages
- attach or inspect source evidence
- answer questions such as “what is the committed delivery date?” with a value plus source

## Product Principles

1. **PM-first, not organization-first**
   - Optimize for the project manager's daily operating surface.
   - Do not assume broad team adoption.

2. **Independent workbench first**
   - The app should be useful even without Jira / MSP / Outlook / Feishu integrations.
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

## Current Agreed Scope

### In Scope Now

- Project workspace as the main product shell
- CRUD for project canvas, stakeholders, timeline plan, risk register, and work packages
- Evidence collection as a supporting module
- Future-ready slots for AI extraction and change proposals

### Explicitly Out of Scope as Product Center

- PMO-style portfolio governance as the main narrative
- personal task center / pomodoro as the main narrative
- broad multi-role workflows for executives / PMO / tech leads
- rebuilding a general-purpose agent from scratch

## Build Strategy

Use existing agent capabilities where needed. Do **not** rebuild an agent runtime from zero unless a very specific low-level capability is impossible to reuse.

The moat should come from the **project-management domain layer**, not from a custom agent shell.

That domain layer should eventually center on:

- project facts
- evidence provenance
- structured updates
- conflict handling
- trustworthy answers with source

## Architecture Guidance

### Preferred Product Structure

- **Project List / Home**
- **Project Workspace**
  - Canvas
  - Stakeholders
  - Timeline
  - Risks
  - Work Packages
  - Evidence

### Preferred Data Direction

Move toward these domain concepts:

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

## Important Reality Check

The repository currently contains substantial implementation and documentation for:

- portfolio dashboards
- inbox workflows
- gantt/timeline views tied to projects/work items
- my-work / todo / pomodoro flows

Those represent the **previous product direction** and should not be used as the source of truth for new planning.

## Documentation Priority Order

When documents disagree, follow this order:

1. `CLAUDE.md`
2. `docs/MEMORY.md`
3. `docs/PRD/PRD-001-Master.md`
4. `docs/overview.md`
5. other historical docs

## Documentation Hygiene Rule

When changing product direction again in the future:

- update the canonical documents above first
- explicitly mark superseded assumptions
- do not leave obsolete roadmap language as if it were current
