# CLAUDE.md — Canonical Product Brief

This is the highest-priority product brief for this repository.
If any sub-project or historical document conflicts with this file, this file wins.

## Product Definition

SwissArmyPM is a desktop workbench for **project managers only**.

It is not:
- a generic collaboration suite
- a PMO / portfolio-first platform
- a personal productivity / pomodoro tool
- a multi-role enterprise workflow system

PMBrain is a supporting knowledge brain, not the main product center.

## Core Objects

The current first-class objects are:
1. Project Canvas
2. Stakeholders
3. Timeline Plan
4. Risk Register
5. Work Packages
6. Evidence

Future extension objects may include:
- FactAssertion
- ChangeProposal

## Core Principles

1. PM-first, not organization-first
2. Structured truth before automation
3. Evidence-backed facts
4. Fast updates over heavy workflows
5. AI may suggest, but must not silently rewrite core project facts

## Core Job To Be Done

A project manager should be able to quickly:
- find the current truth of a project
- update key facts
- review timeline / risks / stakeholders / work packages
- inspect supporting evidence
- answer key questions with value + source

## In Scope Now

- Project workspace as the main shell
- CRUD for canvas, stakeholders, timeline, risks, and work packages
- Evidence as a supporting module
- Future-ready slots for AI-assisted extraction and change proposals

## Explicit Non-Goals

Do not treat these as the product center:
- Portfolio / PMO governance
- My Work / Pomodoro
- generic Todo management
- broad multi-role collaboration
- building a general-purpose agent runtime from scratch

## Agent Workflow Entry

Before implementation/debugging/review, read:
- `workflow/project-profile.yaml`
- `workflow/active-task.yaml`
- `workflow/handoff.md`

Before finishing work:
- run the verify command defined in `workflow/project-profile.yaml`
- update `workflow/handoff.md`
- update `workflow/active-task.yaml`

## Documentation Priority

When documents disagree, follow this order:
1. `/CLAUDE.md`
2. sub-project `CLAUDE.md`
3. `docs/MEMORY.md`
4. `docs/PRD/PRD-001-Master.md`
5. other current docs
6. historical docs

## Maintenance Rule

When product direction changes:
- update canonical docs first
- explicitly mark superseded assumptions
- do not leave obsolete direction text looking current
