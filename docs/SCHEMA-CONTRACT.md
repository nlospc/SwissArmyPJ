# Schema Contract

## Canonical Data Owner

PMBrain owns canonical PM data.

SwissArmyPM Web must use typed PMBrain contracts instead of creating a separate domain truth.

## Core Entities

- `Project`
- `ProjectCanvas`
- `Stakeholder`
- `TimelineItem`
- `RiskItem`
- `WorkPackage`
- `Evidence`
- `EvidenceChunk`
- `SourceLink`
- `FactAssertion`
- `ChangeProposal`
- `ConflictSet`
- `IngestLog`

## Required Metadata

Important entities should carry:

- stable ID
- project ID when project-scoped
- timestamps
- status
- source links when evidence-backed
- confidence when AI-derived
- confirmation state when proposed by AI

## AI Boundary

AI output enters the system as:

- candidate fact
- change proposal
- conflict candidate
- summary
- classification

AI output does not become core project truth until a PM confirms it.

## Traceability

Important answers and updates should preserve:

- source evidence ID
- chunk or excerpt reference when possible
- extraction method
- confidence or uncertainty
- confirmation decision
- audit or ingest log entry
