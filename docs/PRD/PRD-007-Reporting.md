# PRD-007: Reporting & Export Specification

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-007 |
| **Parent** | @PRD-001-Master.md |
| **Status** | Draft |
| **Date** | 2026-01-30 |

---

## 1. Overview

The Reporting system generates stakeholder-ready outputs (Markdown, CSV, PDF) with full traceability to source data.

**Dependencies**: @PRD-002-DataModel.md, @PRD-005-Timeline.md, @PRD-008-Governance.md
**Dependents**: None

---

## 2. Report Types

| Report | Scope | MVP | Phase 2 | Output Formats |
|--------|-------|-----|---------|----------------|
| Weekly Status | Project | ✅ | ✅ | MD, CSV, PDF |
| Monthly Summary | Portfolio | ✅ | ✅ | MD, CSV, PDF |
| Risk Register | Project/Portfolio | ✅ | ✅ | MD, CSV, PDF |
| Milestone Tracker | Project/Portfolio | ✅ | ✅ | MD, CSV, PDF |
| Executive Summary | Portfolio | ❌ | ✅ | MD, PDF, PPTX |

---

## 3. Traceability

Every claim includes a reference: `[Task-101]`, `[Issue-201]`, `[MS-Alpha-1]`

References resolve to source items for drill-down.

---

## 4. Output Formats

| Format | MVP | Implementation |
|--------|-----|----------------|
| Markdown | ✅ | Native, GFM tables |
| CSV | ✅ | Structured data export |
| PDF | Phase 2 | Rust printpdf library |
| PPTX | Phase 3 | Template-based generation |

---

## 5. Report Configuration

```
Report Type:  [Weekly Status ▼]
Scope:        [Project ▼] [Project Alpha ▼]
Date Range:   [2026-01-23] to [2026-01-30]
Sections:     ☑ Summary ☑ Progress ☑ Milestones ☑ Risks
Output:       ☑ Markdown ☑ CSV ☐ PDF
```

---

## 6. Data Queries

### 6.1 Progress Metrics

```sql
SELECT 
  COUNT(CASE WHEN status = 'Done' THEN 1 END) as completed,
  COUNT(*) as total
FROM items WHERE project_id = ? AND type = 'Task';
```

### 6.2 Completed This Period

```sql
SELECT id, name, owner, updated_at
FROM items
WHERE project_id = ? AND status = 'Done'
  AND updated_at BETWEEN ? AND ?;
```

### 6.3 Blockers & Risks

```sql
SELECT id, name, risk_level, owner
FROM items
WHERE project_id = ?
  AND (status = 'Blocked' OR risk_level IN ('Critical', 'High'));
```

---

## 7. API Interface

```rust
fn generate_report(
    report_type: ReportType,
    scope: ReportScope,
    date_range: DateRange,
) -> Result<ReportContent, Error>;

fn export_markdown(content: &ReportContent) -> String;
fn export_csv(content: &ReportContent) -> Vec<CsvFile>;
fn export_pdf(content: &ReportContent) -> Vec<u8>; // Phase 2
```

---

## 8. Acceptance Criteria

| AC# | Criteria |
|-----|----------|
| AC-01 | Weekly report generates all sections |
| AC-02 | References link to source items |
| AC-03 | CSV export includes structured data |
| AC-04 | Report generates in < 5 seconds |

---

## 9. Related Documents

- @PRD-001-Master.md — Master PRD
- @PRD-002-DataModel.md — Item schema
- @PRD-005-Timeline.md — Timeline export
- @PRD-008-Governance.md — Audit data

---

*End of PRD-007*
