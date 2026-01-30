# PRD-008: Governance & Audit Specification

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-008 |
| **Parent** | @PRD-001-Master.md |
| **Status** | Draft |
| **Date** | 2026-01-30 |

---

## 1. Overview

Governance features provide audit trails, field standardization, and template management for enterprise accountability.

**Dependencies**: @PRD-002-DataModel.md
**Dependents**: @PRD-006-Dashboard.md (change feed), @PRD-007-Reporting.md (audit reports)

---

## 2. Audit Log

### 2.1 Purpose

- Track all data mutations (create, update, delete)
- Support compliance and change review
- Enable rollback investigation

### 2.2 Audit Entry Schema

```sql
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL, -- create, update, delete, sync, confirm
  entity_type TEXT NOT NULL, -- Portfolio, Project, Item
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  field_name TEXT, -- For updates: which field changed
  old_value TEXT, -- JSON encoded
  new_value TEXT, -- JSON encoded
  source TEXT, -- manual, csv_import, msp_sync, inbox
  source_ref TEXT, -- File path or reference
  metadata TEXT -- JSON: additional context
);

CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_log(action);
```

### 2.3 Captured Actions

| Action | Trigger | Fields Captured |
|--------|---------|-----------------|
| `create` | New entity | All field values |
| `update` | Field change | Field name, old/new values |
| `delete` | Entity removal | Entity snapshot |
| `sync` | Rebuild engine | Source file, changes applied |
| `confirm` | User confirmation | What was confirmed |
| `conflict_resolve` | Conflict resolution | Resolution choice |

### 2.4 Audit Entry Example

```json
{
  "id": "audit-001",
  "timestamp": "2026-01-30T14:23:00Z",
  "user_id": "user-001",
  "action": "update",
  "entity_type": "Item",
  "entity_id": "task-123",
  "entity_name": "API Design Task",
  "field_name": "status",
  "old_value": "\"InProgress\"",
  "new_value": "\"Done\"",
  "source": "manual",
  "source_ref": null,
  "metadata": "{\"project_id\": \"proj-001\"}"
}
```

---

## 3. Audit Log Viewer

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Audit Log                                              [Export CSV]        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Filters:                                                                   │
│  Date: [Last 7 days ▼]  Entity: [All ▼]  Action: [All ▼]  User: [All ▼]   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Timestamp        │ User  │ Action │ Entity          │ Change             │
│  ─────────────────┼───────┼────────┼─────────────────┼────────────────────│
│  2026-01-30 14:23 │ Alice │ update │ Task: API Design│ status: Done       │
│  2026-01-30 14:20 │ System│ sync   │ 15 items        │ from project.xml   │
│  2026-01-30 13:45 │ Bob   │ create │ Issue: Risk-001 │ (new)              │
│  2026-01-30 12:00 │ Alice │ delete │ Task: Old Task  │ (removed)          │
│  ─────────────────┼───────┼────────┼─────────────────┼────────────────────│
│                                              [< Prev]  Page 1/10  [Next >] │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Field Dictionary

### 4.1 Purpose

- Standardize field values across organization
- Enforce data quality
- Enable consistent reporting

### 4.2 Dictionary Schema

```sql
CREATE TABLE field_dictionary (
  id TEXT PRIMARY KEY,
  field_name TEXT NOT NULL, -- status, priority, risk_level, etc.
  entity_type TEXT NOT NULL, -- Item, Project, Portfolio
  value TEXT NOT NULL, -- Allowed value
  display_label TEXT NOT NULL, -- Human-readable label
  color TEXT, -- Hex color for UI
  icon TEXT, -- Icon identifier
  sort_order INTEGER NOT NULL,
  is_default INTEGER DEFAULT 0,
  enabled INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_field_dict_unique 
  ON field_dictionary(field_name, entity_type, value);
```

### 4.3 Default Dictionaries

**Status (Items)**:
| Value | Label | Color | Icon |
|-------|-------|-------|------|
| NotStarted | Not Started | #808080 | ○ |
| InProgress | In Progress | #0066CC | ◐ |
| Blocked | Blocked | #CC0000 | ⊘ |
| Done | Done | #00CC00 | ● |

**Priority**:
| Value | Label | Color |
|-------|-------|-------|
| Low | Low | #808080 |
| Medium | Medium | #0066CC |
| High | High | #FF9900 |
| Critical | Critical | #CC0000 |

**Risk Level**:
| Value | Label | Color |
|-------|-------|-------|
| None | None | #808080 |
| Low | Low | #00CC00 |
| Medium | Medium | #FF9900 |
| High | High | #FF6600 |
| Critical | Critical | #CC0000 |

### 4.4 Dictionary Management UI

```
┌─────────────────────────────────────────────────────────────┐
│  Field Dictionary: Status (Items)               [+ Add]     │
├─────────────────────────────────────────────────────────────┤
│  Value       │ Label        │ Color   │ Order │ Actions    │
│  ────────────┼──────────────┼─────────┼───────┼────────────│
│  NotStarted  │ Not Started  │ ▓ Gray  │ 1     │ [Edit][↑↓] │
│  InProgress  │ In Progress  │ ▓ Blue  │ 2     │ [Edit][↑↓] │
│  Blocked     │ Blocked      │ ▓ Red   │ 3     │ [Edit][↑↓] │
│  Done        │ Done         │ ▓ Green │ 4     │ [Edit][↑↓] │
├─────────────────────────────────────────────────────────────┤
│  [Add Custom Value]                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Project Templates

### 5.1 Purpose

- Standardize project setup
- Pre-populate phases, milestones, tasks
- Enforce organizational structure

### 5.2 Template Schema

```sql
CREATE TABLE project_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- "IT", "Marketing", "General"
  structure TEXT NOT NULL, -- JSON: phases, milestones, tasks
  default_fields TEXT, -- JSON: default custom fields
  is_default INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 5.3 Template Structure Example

```json
{
  "name": "Standard IT Project",
  "phases": [
    {
      "name": "Phase 1: Planning",
      "duration_days": 14,
      "items": [
        {"name": "Requirements Gathering", "type": "Task", "duration_days": 5},
        {"name": "Technical Design", "type": "Task", "duration_days": 7},
        {"name": "Design Approved", "type": "Milestone"}
      ]
    },
    {
      "name": "Phase 2: Development",
      "duration_days": 30,
      "items": [
        {"name": "Backend Development", "type": "Task", "duration_days": 20},
        {"name": "Frontend Development", "type": "Task", "duration_days": 20},
        {"name": "Code Complete", "type": "Milestone"}
      ]
    },
    {
      "name": "Phase 3: Testing",
      "duration_days": 14,
      "items": [
        {"name": "Integration Testing", "type": "Task", "duration_days": 7},
        {"name": "UAT", "type": "Task", "duration_days": 7},
        {"name": "Go-Live", "type": "Milestone"}
      ]
    }
  ],
  "default_fields": {
    "bu": "IT",
    "region": "Global"
  }
}
```

### 5.4 Template Instantiation

```
┌─────────────────────────────────────────────────────────────┐
│  Create Project from Template                        [×]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Template:     [Standard IT Project ▼]                     │
│                                                             │
│  Project Name: [New Project                        ]       │
│  Start Date:   [2026-02-01] 📅                             │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  Preview:                                                   │
│  ─────────────────────────────────────────────────────────  │
│  ▼ Phase 1: Planning (Feb 01 - Feb 14)                     │
│      Task: Requirements Gathering                          │
│      Task: Technical Design                                │
│      ◆ Design Approved                                     │
│  ▼ Phase 2: Development (Feb 15 - Mar 16)                  │
│      Task: Backend Development                             │
│      Task: Frontend Development                            │
│      ◆ Code Complete                                       │
│  ▼ Phase 3: Testing (Mar 17 - Mar 30)                      │
│      Task: Integration Testing                             │
│      Task: UAT                                             │
│      ◆ Go-Live                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                        [Cancel]  [Create Project]          │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. API Interface

```rust
// Audit Log
fn write_audit_entry(entry: AuditEntry) -> Result<(), Error>;
fn query_audit_log(filters: AuditFilters, pagination: Pagination) -> Vec<AuditEntry>;
fn export_audit_log(filters: AuditFilters) -> CsvFile;

// Field Dictionary
fn get_field_dictionary(field_name: &str, entity_type: &str) -> Vec<DictionaryEntry>;
fn add_dictionary_value(field_name: &str, entity_type: &str, value: DictionaryValue) -> DictionaryEntry;
fn update_dictionary_value(id: Uuid, updates: DictionaryUpdate) -> DictionaryEntry;
fn delete_dictionary_value(id: Uuid) -> bool;

// Templates
fn list_templates(category: Option<&str>) -> Vec<ProjectTemplate>;
fn get_template(id: Uuid) -> Option<ProjectTemplate>;
fn create_template(template: TemplateCreate) -> ProjectTemplate;
fn update_template(id: Uuid, updates: TemplateUpdate) -> ProjectTemplate;
fn delete_template(id: Uuid) -> bool;
fn instantiate_template(template_id: Uuid, project_name: &str, start_date: NaiveDate) -> Project;
```

---

## 7. Validation Rules

### 7.1 Field Validation

When saving entities, validate against field dictionary:

```rust
fn validate_field(field_name: &str, value: &str, entity_type: &str) -> ValidationResult {
    let allowed = get_field_dictionary(field_name, entity_type);
    if allowed.iter().any(|d| d.value == value && d.enabled) {
        ValidationResult::Valid
    } else {
        ValidationResult::Invalid(format!(
            "Value '{}' not allowed for field '{}'", value, field_name
        ))
    }
}
```

### 7.2 Validation Behavior

| Scenario | Behavior |
|----------|----------|
| Value in dictionary | Allow save |
| Value not in dictionary | Show warning, allow override (with audit) |
| Dictionary disabled | Skip validation for that field |

---

## 8. Acceptance Criteria

| AC# | Criteria | Test Method |
|-----|----------|-------------|
| AC-01 | Create action writes audit entry | Unit test |
| AC-02 | Update captures old and new values | Unit test |
| AC-03 | Audit log queryable by date range | Integration test |
| AC-04 | Audit log exportable to CSV | Integration test |
| AC-05 | Field dictionary enforces values | Unit test |
| AC-06 | Custom dictionary values addable | E2E test |
| AC-07 | Template creates project with structure | Integration test |
| AC-08 | Template dates calculated from start | Unit test |
| AC-09 | Audit viewer pagination works | E2E test |
| AC-10 | 10,000 audit entries query < 1 second | Performance test |

---

## 9. Related Documents

- @PRD-001-Master.md — Master PRD
- @PRD-002-DataModel.md — Entity schema
- @PRD-004-RebuildEngine.md — Sync audit entries
- @PRD-006-Dashboard.md — Change feed from audit
- @PRD-007-Reporting.md — Audit report export

---

*End of PRD-008*
