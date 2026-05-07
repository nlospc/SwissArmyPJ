# Product Strategy

## Product Thesis

SwissArmyPJ exists to help project managers maintain a trusted local project brain.

The product is not a generic collaboration suite, PMO dashboard, personal todo app, or autonomous agent runtime. It is a local-first project management system that turns scattered project evidence into structured, traceable project facts.

## Core Loop

```text
Capture evidence
  -> Store source material
  -> Extract candidate facts
  -> Compare with current structured truth
  -> Propose changes
  -> PM confirms or rejects
  -> Trace answers and updates back to source
```

## First-Class Domains

- Project Canvas
- Stakeholders
- Timeline Plan
- Risk Register
- Work Packages
- Evidence
- Fact Assertions
- Change Proposals
- Source Links
- Ingest Logs

## Product Boundaries

In scope:

- Local-first structured PM data
- PMBOK and agile practice translated into usable workflows
- Evidence-backed facts and answers
- AI-assisted extraction and proposal workflows
- Obsidian projection for minimum viable local usage
- A professional local web workbench for PM interaction

Out of scope:

- Portfolio-first PMO governance
- My Work, Pomodoro, or generic personal productivity
- Multi-role enterprise workflow automation
- A general-purpose autonomous agent platform
- Cloud-first data ownership

## Strategic Split

PMBrain is the durable kernel. It owns identity, relationships, provenance, schema, ingest, source links, and machine-facing tools.

SwissArmyPM Web is the PM workbench. It owns editing, confirmation, review, inspection, and export workflows.

Obsidian is the local readable projection. It gives users and agents a simple markdown surface when the workbench is not needed.
