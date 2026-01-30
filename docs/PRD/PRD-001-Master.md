# SwissArmyPM — Master PRD

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-001 |
| **Status** | Draft |
| **Version** | 1.0.0 |
| **Date** | 2026-01-30 |

---

## 1. Vision & Problem

**Vision**: A local-first, AI-optional desktop tool that gives IT project managers complete control over their project data while enabling 30-second context recovery.

**Problem**: IT PMs face fragmented tools (MS Project, Excel, Outlook, SharePoint). This causes:
- 15–30 min daily reconstructing "where we left off"
- Data drift across tools eroding trust
- Hours of manual report assembly weekly

**Solution**: Unified local database + intelligent inbox + filesystem sync + one-click reporting.

---

## 2. Core Principles

1. **Local-First, Always-Capable** — Works offline; data in SQLite/CSV
2. **Human-in-the-Loop** — AI suggests, humans confirm
3. **30-Second Context Recovery** — Dashboard shows full status instantly
4. **Auditable & Governable** — All changes logged with traceability
5. **Interoperability Over Lock-In** — CSV/MSP import/export first-class

---

## 3. Target Users

| Persona | Role | Key Need |
|---------|------|----------|
| Alex | IT Project Manager | Single source of truth, automated reports |
| Jordan | PMO Lead | Portfolio visibility, standardized templates |
| Sam | Technical Lead | Quick Gantt view, task updates |

See @PRD-010-Personas.md for detailed profiles.

---

## 4. Feature Overview

| Feature | Priority | Phase | Detail PRD |
|---------|----------|-------|------------|
| Unified Data Model | P0 | MVP | @PRD-002-DataModel.md |
| Inbox (Capture & Triage) | P0 | MVP | @PRD-003-Inbox.md |
| Rebuild Engine (File Sync) | P0 | MVP | @PRD-004-RebuildEngine.md |
| Timeline / Gantt | P0 | MVP | @PRD-005-Timeline.md |
| Portfolio Dashboard | P0 | MVP | @PRD-006-Dashboard.md |
| Reporting / Export | P0 | MVP | @PRD-007-Reporting.md |
| Governance & Audit | P0 | MVP | @PRD-008-Governance.md |
| AI Provider Integration | P2 | Phase 2 | @PRD-009-AIProvider.md |

---

## 5. Tech Stack

| Layer | Technology |
|-------|------------|
| App Shell | Tauri v2 |
| Frontend | React + TypeScript |
| State | Zustand |
| Database | SQLite + FTS5 |
| File Watching | Rust (notify-rs) |
| Export | Markdown, CSV, PDF (Phase 2) |

---

## 6. Architecture (High-Level)

```
┌─────────────────────────────────────────────────────┐
│              PRESENTATION (React + TS)              │
│  Inbox │ Timeline │ Dashboard │ Settings            │
└────────────────────┬────────────────────────────────┘
                     │ Tauri IPC
┌────────────────────▼────────────────────────────────┐
│              APPLICATION (Rust)                     │
│  Commands │ Rebuild Engine │ Report Generator       │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│              DATA (SQLite)                          │
│  Portfolios │ Projects │ Items │ AuditLog           │
└─────────────────────────────────────────────────────┘
```

See @ARCH-001-Technical.md for detailed architecture.

---

## 7. MVP Scope (Phase 1 — 12 weeks)

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1–2 | Setup | Tauri + React scaffold, SQLite |
| 3–4 | Data Model | CRUD operations, migrations |
| 5–6 | Inbox | File drop, CSV import, triage UI |
| 7–8 | Rebuild Engine | Directory scan, diff, confirm |
| 9–10 | Timeline | Table + bar view, date editing |
| 11 | Dashboard | Health cards, change feed |
| 12 | Export + Audit | Markdown, CSV, audit log |

---

## 8. Success Metrics

| KPI | Target |
|-----|--------|
| App Launch | < 3 seconds |
| Dashboard Load | < 2 seconds (50 projects) |
| Weekly Report Generation | < 2 minutes (vs 30+ min baseline) |
| 30-Day Retention | ≥ 60% |

---

## 9. Document Index

| Document | Description |
|----------|-------------|
| @PRD-002-DataModel.md | Data model specification |
| @PRD-003-Inbox.md | Inbox feature specification |
| @PRD-004-RebuildEngine.md | Rebuild engine specification |
| @PRD-005-Timeline.md | Timeline/Gantt specification |
| @PRD-006-Dashboard.md | Portfolio dashboard specification |
| @PRD-007-Reporting.md | Reporting & export specification |
| @PRD-008-Governance.md | Governance & audit specification |
| @PRD-009-AIProvider.md | AI provider specification |
| @PRD-010-Personas.md | Detailed user personas |
| @ARCH-001-Technical.md | Technical architecture document |

---

## 10. Open Questions

| ID | Question | Status |
|----|----------|--------|
| OQ-001 | Custom Gantt vs vis-timeline? | Open |
| OQ-002 | Direct .mpp parsing in MVP? | Open |
| OQ-003 | SQLCipher for encryption? | Open |

---

*End of Master PRD — See referenced documents for details*
