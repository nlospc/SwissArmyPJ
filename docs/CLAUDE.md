# CLAUDE.md

This document mirrors the root `CLAUDE.md` and exists so future sessions reading under `docs/` do not inherit stale direction.

## Canonical Direction Summary

**SwissArmyPM is a desktop workbench for project managers only.**

The product is meant to help a PM independently maintain and query key project information:

- Project Canvas
- Stakeholders
- Timeline Plan
- Risk Register
- Work Packages
- Evidence

## What The Product Is Not

It is not primarily:

- a portfolio governance suite
- a PMO reporting platform
- a personal productivity / pomodoro app
- a generic collaboration system
- a ground-up custom agent runtime

## Current Planning Baseline

1. The product must first stand alone as a PM workbench.
2. Manual CRUD for core project objects comes before heavy automation.
3. Evidence is a supporting pillar so future AI can propose updates with traceability.
4. Existing code for portfolio / my-work / inbox should be treated as legacy implementation context, not current product truth.

## Documentation Precedence

If docs conflict, prefer:

1. `CLAUDE.md`
2. `docs/MEMORY.md`
3. `docs/PRD/PRD-001-Master.md`
4. `docs/overview.md`

## Notes For Future Sessions

- Do not continue expanding `My Work` as the main product.
- Do not let `Portfolio Dashboard` remain the primary mental model.
- Do not design around multi-role enterprise workflows unless product direction changes explicitly.
- New design and implementation work should align with the PM workspace model.
