> ⚠️ **已取代** — 本 PRD 已被 [PRD-001-Master.md](./PRD-001-Master.md) 取代。
> 当前产品方向为 **PM Workspace**，请以 Master PRD 为准。
> 本文档仅供历史参考。

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
  action TEXT NOT NULL, -- create, update, delete, sync, confirm, status_transition
  entity_type TEXT NOT NULL, -- Portfolio, Project, Item
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  field_name TEXT, -- For updates: which field changed
  old_value TEXT, -- JSON encoded
  new_value TEXT, -- JSON encoded
  -- NEW: Workflow transition fields
  from_status TEXT, -- Previous status (for status_transition)
  to_status TEXT, -- New status (for status_transition)
  item_type TEXT, -- Item type (Story, Bug, Spike, etc.) for context
  transition_reason TEXT, -- Optional: why transition occurred
  source TEXT, -- manual, csv_import, msp_sync, inbox
  source_ref TEXT, -- File path or reference
  metadata TEXT -- JSON: additional context
);

CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_status_transition ON audit_log(action, entity_id, timestamp); -- For CFD queries
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
| `status_transition` | **Workflow state change** | **from_status, to_status, item_type** |

### 2.4 Audit Entry Example

#### Standard Update Example

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

#### Status Transition Example (NEW)

```json
{
  "id": "audit-002",
  "timestamp": "2026-02-06T10:30:00Z",
  "user_id": "alice",
  "action": "status_transition",
  "entity_type": "Item",
  "entity_id": "story-456",
  "entity_name": "User Authentication Story",
  "field_name": null,
  "old_value": null,
  "new_value": null,
  "from_status": "In Test",
  "to_status": "Done",
  "item_type": "Story",
  "transition_reason": "All acceptance criteria met",
  "source": "manual",
  "source_ref": null,
  "metadata": "{\"project_id\": \"proj-001\", \"reviewer\": \"bob\", \"verified_at\": \"2026-02-06T10:28:00Z\"}"
}
```

#### Bug Status Transition Example

```json
{
  "id": "audit-003",
  "timestamp": "2026-02-06T11:15:00Z",
  "user_id": "qa_team",
  "action": "status_transition",
  "entity_type": "Item",
  "entity_id": "bug-789",
  "entity_name": "Critical: Login fails on Safari",
  "field_name": null,
  "old_value": null,
  "new_value": null,
  "from_status": "In Verification",
  "to_status": "Closed",
  "item_type": "Bug",
  "transition_reason": "Verified on Safari 17.2 - fix working correctly",
  "source": "manual",
  "source_ref": null,
  "metadata": "{\"severity\": \"Critical\", \"verified_by\": \"qa_team\", \"fix_version\": \"v2.3.1\"}"
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

#### Status (Story/Task) - 7 States

| Value | Label | Color | Icon |
|-------|-------|-------|------|
| Backlog | Backlog | #808080 | 📋 |
| Ready | Ready for Pickup | #4A90E2 | ▶ |
| In Progress | In Progress | #0066CC | ◐ |
| In Review | In Review | #9B59B6 | 👁 |
| In Test | In Testing | #F39C12 | 🧪 |
| Done | Done | #00CC00 | ✅ |
| Blocked | Blocked | #CC0000 | 🚫 |

#### Status (Bug) - 5 States

| Value | Label | Color | Icon |
|-------|-------|-------|------|
| New | New Bug | #E74C3C | 🐛 |
| Triage | In Triage | #F39C12 | 🔍 |
| In Fix | In Fix | #3498DB | 🔧 |
| In Verification | In Verification | #9B59B6 | ✔ |
| Closed | Closed | #00CC00 | ✅ |

#### Status (Spike) - 4 States

| Value | Label | Color | Icon |
|-------|-------|-------|------|
| Proposed | Proposed | #95A5A6 | 💡 |
| In Research | In Research | #3498DB | 🔬 |
| Findings Ready | Findings Ready | #F39C12 | 📄 |
| Closed | Closed | #00CC00 | ✅ |

#### Status (Legacy - for backward compatibility)

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

#### Example 1: Standard IT Project (with Stories and Tasks)

```json
{
  "name": "Standard IT Project",
  "phases": [
    {
      "name": "Phase 1: Planning",
      "duration_days": 14,
      "items": [
        {"name": "Spike: Technology Feasibility Study", "type": "Spike", "duration_days": 5},
        {"name": "Story: User Authentication Requirements", "type": "Story", "duration_days": 3},
        {"name": "Story: Data Model Design", "type": "Story", "duration_days": 4},
        {"name": "Task: Technical Design Document", "type": "Task", "duration_days": 7},
        {"name": "Milestone: Design Approved", "type": "Milestone"}
      ]
    },
    {
      "name": "Phase 2: Development",
      "duration_days": 30,
      "items": [
        {"name": "Story: REST API Implementation", "type": "Story", "duration_days": 10},
        {"name": "Story: User Interface Design", "type": "Story", "duration_days": 12},
        {"name": "Task: Database Setup", "type": "Task", "duration_days": 5},
        {"name": "Task: CI/CD Pipeline Configuration", "type": "Task", "duration_days": 3},
        {"name": "Milestone: Code Complete", "type": "Milestone"}
      ]
    },
    {
      "name": "Phase 3: Testing & Bug Fixing",
      "duration_days": 14,
      "items": [
        {"name": "Task: Integration Testing", "type": "Task", "duration_days": 7},
        {"name": "Task: UAT Execution", "type": "Task", "duration_days": 5},
        {"name": "Bug: Critical Issues Found", "type": "Bug", "severity": "High"},
        {"name": "Milestone: Go-Live", "type": "Milestone"}
      ]
    }
  ],
  "default_fields": {
    "bu": "IT",
    "region": "Global"
  }
}
```

#### Example 2: Bug Fix Sprint Template

```json
{
  "name": "Bug Fix Sprint",
  "description": "2-week sprint focused on resolving reported bugs",
  "phases": [
    {
      "name": "Triage Week",
      "duration_days": 7,
      "items": [
        {"name": "Bug: Review all reported issues", "type": "Bug", "severity": "Medium"},
        {"name": "Task: Prioritize bugs by severity", "type": "Task", "duration_days": 1},
        {"name": "Bug: Critical Security Issue", "type": "Bug", "severity": "Critical"},
        {"name": "Bug: High Priority Performance Issue", "type": "Bug", "severity": "High"},
        {"name": "Milestone: Triage Complete", "type": "Milestone"}
      ]
    },
    {
      "name": "Fix & Verify Week",
      "duration_days": 7,
      "items": [
        {"name": "Bug: Apply security patches", "type": "Bug", "severity": "Critical"},
        {"name": "Task: Code review all fixes", "type": "Task", "duration_days": 2},
        {"name": "Task: QA verification", "type": "Task", "duration_days": 3},
        {"name": "Task: Deploy hotfix to production", "type": "Task", "duration_days": 1},
        {"name": "Milestone: All Bugs Closed", "type": "Milestone"}
      ]
    }
  ],
  "default_fields": {
    "sprint_type": "bug_fix",
    "duration_weeks": 2
  }
}
```

#### Example 3: Research Spike Template

```json
{
  "name": "Research Investigation",
  "description": "Template for technical research and feasibility studies",
  "phases": [
    {
      "name": "Research Phase",
      "duration_days": 10,
      "items": [
        {"name": "Spike: Architecture Options Evaluation", "type": "Spike", "duration_days": 5},
        {"name": "Spike: Performance Benchmarking", "type": "Spike", "duration_days": 5},
        {"name": "Task: Compile Research Findings", "type": "Task", "duration_days": 2},
        {"name": "Milestone: Research Complete", "type": "Milestone"}
      ]
    },
    {
      "name": "Decision Phase",
      "duration_days": 5,
      "items": [
        {"name": "Story: Present Findings to Stakeholders", "type": "Story", "duration_days": 2},
        {"name": "Story: Document Recommended Approach", "type": "Story", "duration_days": 2},
        {"name": "Milestone: Decision Made", "type": "Milestone"}
      ]
    }
  ],
  "default_fields": {
    "project_type": "research",
    "requires_findings_doc": true
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

### 7.3 Status Transition Validation (NEW)

When changing item status, validate transition is allowed:

```rust
fn validate_status_transition(
    item_type: &ItemType,
    from_status: Option<&str>,
    to_status: &str
) -> ValidationResult {
    // Define allowed transitions per item type
    let allowed_transitions = get_allowed_transitions(item_type);

    // Check if transition is valid
    if from_status.is_none() {
        // New item - check initial status is valid
        if is_valid_initial_status(item_type, to_status) {
            ValidationResult::Valid
        } else {
            ValidationResult::Invalid(format!(
                "Status '{}' is not a valid initial status for type '{}'",
                to_status, item_type
            ))
        }
    } else {
        // Existing item - check transition is allowed
        let from = from_status.unwrap();
        if allowed_transitions.iter().any(|(f, t)| f == from && t == to_status) {
            ValidationResult::Valid
        } else {
            ValidationResult::Invalid(format!(
                "Cannot transition from '{}' to '{}' for type '{}'",
                from, to_status, item_type
            ))
        }
    }
}

fn validate_completion_requirements(item: &Item) -> ValidationResult {
    match item.item_type {
        ItemType::Story => {
            if item.acceptance_criteria.is_none() || item.acceptance_criteria.unwrap().is_empty() {
                return ValidationResult::Invalid(
                    "Story requires acceptance criteria to move to Done".to_string()
                );
            }
            ValidationResult::Valid
        }
        ItemType::Bug => {
            if item.verified_by.is_none() || item.verified_by.unwrap().is_empty() {
                return ValidationResult::Invalid(
                    "Bug must be verified by QA to close".to_string()
                );
            }
            if item.severity.is_none() {
                return ValidationResult::Invalid(
                    "Bug must have severity assigned".to_string()
                );
            }
            ValidationResult::Valid
        }
        ItemType::Spike => {
            if item.findings.is_none() || item.findings.unwrap().is_empty() {
                return ValidationResult::Invalid(
                    "Spike requires documented findings to close".to_string()
                );
            }
            ValidationResult::Valid
        }
        _ => ValidationResult::Valid,
    }
}
```

**Status Transition Rules**:

| Item Type | Allowed Transitions (from → to) |
|-----------|-------------------------------|
| **Story/Task** | Backlog → Ready → In Progress → In Review → In Test → Done<br>Review/Test can return to previous state<br>Any state → Blocked |
| **Bug** | New → Triage → In Fix → In Verification → Closed<br>Verification → In Fix (if failed) |
| **Spike** | Proposed → In Research → Findings Ready → Closed |

**Completion Requirements**:

| Item Type | Requirement | Validation |
|-----------|-------------|------------|
| **Story** | Acceptance criteria | `acceptance_criteria` must be populated |
| **Bug** | QA verification | `verified_by` must reference QA person |
| **Bug** | Severity assignment | `severity` must be set |
| **Spike** | Research findings | `findings` must document conclusions |

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
| **AC-11** | **Status transition writes audit entry with from/to** | Unit test |
| **AC-12** | **Invalid status transitions are rejected** | Unit test |
| **AC-13** | **Story cannot complete without acceptance criteria** | Unit test |
| **AC-14** | **Bug cannot close without verification** | Unit test |
| **AC-15** | **Spike cannot close without findings** | Unit test |
| **AC-16** | **Field dictionary includes all workflow states** | Integration test |
| **AC-17** | **Templates support Story, Bug, Spike types** | Integration test |
| **AC-18** | **Audit log query supports CFD data retrieval** | Integration test |

---

## 9. Workflow Audit & Analytics (NEW)

### 9.1 Cumulative Flow Diagram (CFD) Data Support

The audit log provides the historical data needed for CFD visualization in the Dashboard:

```sql
-- Query CFD data for a project over the last 30 days
WITH status_snapshots AS (
  SELECT
    DATE(timestamp) as snapshot_date,
    entity_id,
    to_status as status,
    -- Count cumulative items in each status at each point in time
    COUNT(*) OVER (
      PARTITION BY DATE(timestamp), to_status
      ORDER BY timestamp
    ) as cumulative_count
  FROM audit_log
  WHERE action = 'status_transition'
    AND entity_type = 'Item'
    AND entity_id IN (
      SELECT id FROM items WHERE project_id = ?
    )
    AND timestamp >= date('now', '-30 days')
)
SELECT
  snapshot_date,
  status,
  MAX(cumulative_count) as count
FROM status_snapshots
GROUP BY snapshot_date, status
ORDER BY snapshot_date, status;
```

**CFD Metrics Calculated from Audit Log**:

| Metric | Calculation | Description |
|--------|-------------|-------------|
| **Cycle Time** | AVG(timestamp where to_status='Done' - timestamp where to_status='In Progress') | Average time from start to completion |
| **Lead Time** | AVG(timestamp where to_status='Done' - timestamp where action='create') | Average time from creation to completion |
| **Flow Efficiency** | (SUM(active_work_time) / SUM(lead_time)) × 100 | Percentage of time spent actively working |
| **WIP Trends** | Daily count of items not in Done/Closed | Track work in progress over time |

### 9.2 Workflow State Transition Matrix (Audit Report)

Generate a transition frequency matrix for process optimization:

```sql
-- Transition frequency analysis
SELECT
  from_status,
  to_status,
  item_type,
  COUNT(*) as transition_count,
  AVG(
    julianday(timestamp) -
    (SELECT MIN(timestamp) FROM audit_log al2
     WHERE al2.entity_id = audit_log.entity_id
     AND al2.to_status = audit_log.from_status
     AND al2.timestamp < audit_log.timestamp)
  ) as avg_days_in_status
FROM audit_log
WHERE action = 'status_transition'
  AND entity_type = 'Item'
  AND timestamp >= date('now', '-30 days')
GROUP BY from_status, to_status, item_type
ORDER BY item_type, from_status, to_status;
```

**Sample Output**:

```
Story: Backlog → Ready: 45 transitions, avg 2.3 days in Backlog
Story: Ready → In Progress: 42 transitions, avg 0.5 days in Ready
Story: In Progress → In Review: 38 transitions, avg 5.2 days in In Progress
Story: In Review → In Test: 35 transitions, avg 1.8 days in Review
Story: In Test → Done: 32 transitions, avg 3.1 days in Test
Story: In Review → In Progress: 3 transitions (rejections), avg 4.1 days
```

### 9.3 Bottleneck Detection

Identify workflow bottlenecks using audit data:

```rust
fn detect_bottlenecks(project_id: Uuid, days: u32) -> Vec<BottleneckReport> {
    let transitions = query_status_transitions(project_id, days);

    let mut reports = Vec::new();

    for (status, avg_days) in calculate_avg_time_in_status(&transitions) {
        // Thresholds for bottleneck detection
        let is_bottleneck = match status.as_str() {
            "Ready" => avg_days > 1.0,           // Should pick up quickly
            "In Progress" => avg_days > 7.0,     // Shouldn't stagnate
            "In Review" => avg_days > 3.0,       // Review should be fast
            "In Test" => avg_days > 5.0,         // Testing shouldn't linger
            _ => false,
        };

        if is_bottleneck {
            reports.push(BottleneckReport {
                status,
                avg_days_in_status: avg_days,
                items_stuck: count_items_currently_in_status(project_id, &status),
                severity: if avg_days > 10.0 { "Critical" } else { "Warning" },
            });
        }
    }

    reports
}
```

### 9.4 Workflow Compliance Reporting

Generate reports for workflow compliance:

```sql
-- Compliance: Check if items followed proper workflow
SELECT
  i.id,
  i.name,
  i.type,
  COUNT(CASE WHEN al.action = 'status_transition' THEN 1 END) as transition_count,
  -- Check if Story went through proper states
  SUM(CASE WHEN al.to_status = 'Done' AND
      NOT EXISTS (
        SELECT 1 FROM audit_log al2
        WHERE al2.entity_id = al.entity_id
        AND al2.to_status IN ('In Test', 'In Review')
      ) THEN 1 ELSE 0 END
  ) as skipped_required_states,
  -- Check if Bug was verified before closing
  SUM(CASE WHEN al.to_status = 'Closed' AND i.type = 'Bug' AND
      i.verified_by IS NULL THEN 1 ELSE 0 END
  ) as closed_without_verification
FROM items i
LEFT JOIN audit_log al ON al.entity_id = i.id
WHERE i.project_id = ?
GROUP BY i.id
HAVING skipped_required_states > 0 OR closed_without_verification > 0;
```

---

## 10. Related Documents

- @PRD-001-Master.md — Master PRD
- @PRD-002-DataModel.md — Entity schema
- @PRD-004-RebuildEngine.md — Sync audit entries
- @PRD-006-Dashboard.md — Change feed from audit
- @PRD-007-Reporting.md — Audit report export

---

*End of PRD-008*
