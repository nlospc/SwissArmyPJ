> ⚠️ **已取代** — 本 PRD 已被 [PRD-001-Master.md](./PRD-001-Master.md) 取代。
> 当前产品方向为 **PM Workspace**，请以 Master PRD 为准。
> 本文档仅供历史参考。

# PRD-002: Data Model Specification

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-002 |
| **Parent** | @PRD-001-Master.md |
| **Status** | Draft |
| **Date** | 2026-01-30 |

---

## 1. Overview

The unified data model provides the foundation for all SwissArmyPM features. It supports Portfolio → Project → Item hierarchy with flexible custom fields.

**Dependencies**: None (foundation layer)
**Dependents**: All other features

---

## 2. Entity Hierarchy

```
Portfolio (项目集)
  └── Project (项目)
        ├── Task
        │     └── Sub-Task (one level only)
        ├── Issue
        │     └── Sub-Issue (one level only)
        └── Milestone
```

---

## 3. Entity Definitions

### 3.1 Portfolio

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| name | String(255) | Yes | Portfolio name |
| description | Text | No | Portfolio description |
| status | Enum | Yes | Active, OnHold, Completed, Archived |
| owner | String(100) | No | Portfolio owner name |
| created_at | Timestamp | Yes | Auto-generated |
| updated_at | Timestamp | Yes | Auto-updated |

### 3.2 Project

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| portfolio_id | UUID | No | FK to Portfolio (nullable for standalone) |
| name | String(255) | Yes | Project name |
| code | String(50) | No | Short code (e.g., "PRJ-001") |
| description | Text | No | Project description |
| status | Enum | Yes | NotStarted, InProgress, OnHold, Completed, Cancelled |
| priority | Enum | Yes | Low, Medium, High, Critical |
| start_date | Date | No | Planned start |
| end_date | Date | No | Planned end |
| owner | String(100) | No | Project manager name |
| created_at | Timestamp | Yes | Auto-generated |
| updated_at | Timestamp | Yes | Auto-updated |

### 3.3 Item (Epic / Story / Task / Bug / Spike / Milestone)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| project_id | UUID | Yes | FK to Project |
| parent_id | UUID | No | FK to Item (for sub-items, one level) |
| type | Enum | Yes | **Epic, Story, Task, Bug, Spike, Milestone** |
| name | String(255) | Yes | Item name |
| description | Text | No | Item description |
| status | Enum | Yes | Varies by type (see §4.1) |
| priority | Enum | Yes | P0, P1, P2, P3 |
| risk_level | Enum | No | None, Low, Medium, High, Critical |
| start_date | Date | No | Planned/actual start |
| end_date | Date | No | Planned/actual end |
| due_date | Date | No | Due date (for bugs/issues) |
| owner | String(100) | No | Assignee name |
| component | String(100) | No | Component/module assignment |
| release | String(100) | No | Target release (optional) |
| **severity** | Enum | No (Bug only) | Critical, High, Medium, Low |
| **acceptance_criteria** | Text | No (Story only) | Acceptance criteria for story completion |
| **findings** | Text | No (Spike only) | Research findings/conclusions |
| **verified_by** | String(100) | No (Bug only) | QA person who verified the fix |
| source_type | Enum | Yes | Manual, CSVImport, MSPImport, Inbox |
| source_ref | String(500) | No | Original file path or reference |
| created_at | Timestamp | Yes | Auto-generated |
| updated_at | Timestamp | Yes | Auto-updated |

### 3.4 Custom Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| entity_type | Enum | Yes | Portfolio, Project, Item |
| entity_id | UUID | Yes | FK to entity |
| field_name | String(100) | Yes | Field key (e.g., "company", "bu") |
| field_value | Text | Yes | Field value |
| field_type | Enum | Yes | String, Number, Date, Boolean, Select |

### 3.5 Dependency

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| predecessor_id | UUID | Yes | FK to Item |
| successor_id | UUID | Yes | FK to Item |
| type | Enum | Yes | FinishToStart, StartToStart, FinishToFinish |
| lag_days | Integer | No | Lag in days (default 0) |

---

## 4. Status Transitions

### 4.1 Item Type Definitions

| Type | Description | Workflow |
|------|-------------|----------|
| **Epic** | Large initiative containing multiple stories | No standard workflow (aggregates children) |
| **Story** | User-facing feature交付 | Full Kanban flow |
| **Task** | Internal work item | Full Kanban flow |
| **Bug** | Defect requiring fix | Bug triage workflow |
| **Spike** | Research/investigation task | Research workflow |
| **Milestone** | Project milestone | Simple active/completed |

### 4.2 Status Workflows

#### 4.2.1 Story/Task Workflow

```
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌───────────┐    ┌──────────┐    ┌──────────┐
│ Backlog  │───▶│  Ready   │───▶│ In Progress  │───▶│ In Review │───▶│ In Test  │───▶│   Done   │
└──────────┘    └──────────┘    └───────┬──────┘    └─────┬─────┘    └─────┬────┘    └──────────┘
                                         │                 │                │
                                         │                 │                │
                                         ▼                 ▼                │
                                  ┌──────────┐      ┌──────────┐           │
                                  │ Blocked  │      │  Ready   │◀──────────┘
                                  └──────────┘      └──────────┘
```

**Valid Transitions:**

| From | To | Condition |
|------|-----|-----------|
| Backlog | Ready | Ready for pickup |
| Ready | In Progress | Assigned to owner |
| In Progress | In Review | Code/implementation complete |
| In Review | In Test | Review approved |
| In Review | In Progress | Review rejected (with feedback) |
| In Test | Done | **All acceptance criteria met** |
| In Test | In Review | Test failed (re-review needed) |
| *Any* | Blocked | Blocker identified |
| Blocked | Ready | Blocker resolved |

**Entry Requirements for Done:**
- ✅ **Story**: `acceptance_criteria` field populated AND all criteria verified
- ✅ **Task**: Work completed AND verified by owner

#### 4.2.2 Bug Workflow

```
┌────────┐    ┌─────────┐    ┌──────────┐    ┌─────────────────┐    ┌────────┐
│  New   │───▶│ Triage  │───▶│ In Fix   │───▶│ In Verification │───▶│ Closed │
└────────┘    └─────────┘    └──────────┘    └─────────────────┘    └────────┘
                                   │                                     ▲
                                   │                                     │
                                   ▼                                     │
                            ┌──────────┐                                │
                            │  New     │────────────────────────────────┘
                            └──────────┘      (Verification failed)
```

**Valid Transitions:**

| From | To | Condition |
|------|-----|-----------|
| New | Triage | Bug triaged (severity assigned) |
| Triage | In Fix | Assigned to developer |
| In Fix | In Verification | Fix submitted for testing |
| In Verification | Closed | **Verification passed** |
| In Verification | In Fix | Verification failed (re-fix needed) |
| In Verification | New | Cannot reproduce / Not a bug |
| *Any* | Closed | Duplicate / Won't fix |

**Entry Requirements for Closed:**
- ✅ **Bug**: `verified_by` field populated AND `severity` set

#### 4.2.3 Spike Workflow

```
┌───────────┐    ┌──────────────┐    ┌─────────────────┐    ┌────────┐
│ Proposed  │───▶│ In Research  │───▶│ Findings Ready  │───▶│ Closed │
└───────────┘    └──────────────┘    └─────────────────┘    └────────┘
```

**Valid Transitions:**

| From | To | Condition |
|------|-----|-----------|
| Proposed | In Research | Research started |
| In Research | Findings Ready | Research complete, findings documented |
| Findings Ready | Closed | Findings reviewed and approved |
| Findings Ready | In Research | More research needed |

**Entry Requirements for Closed:**
- ✅ **Spike**: `findings` field populated with research conclusions

#### 4.2.4 Milestone Workflow

```
┌──────────┐    ┌────────────┐
│  Active  │───▶│ Completed  │
└──────────┘    └────────────┘
```

### 4.3 Status Enums by Type

```typescript
// Story/Task
enum StoryTaskStatus {
  BACKLOG = 'Backlog',
  READY = 'Ready',
  IN_PROGRESS = 'In Progress',
  IN_REVIEW = 'In Review',
  IN_TEST = 'In Test',
  DONE = 'Done',
  BLOCKED = 'Blocked'
}

// Bug
enum BugStatus {
  NEW = 'New',
  TRIAGE = 'Triage',
  IN_FIX = 'In Fix',
  IN_VERIFICATION = 'In Verification',
  CLOSED = 'Closed'
}

// Spike
enum SpikeStatus {
  PROPOSED = 'Proposed',
  IN_RESEARCH = 'In Research',
  FINDINGS_READY = 'Findings Ready',
  CLOSED = 'Closed'
}

// Milestone
enum MilestoneStatus {
  ACTIVE = 'Active',
  COMPLETED = 'Completed'
}
```

---

## 5. Dependency Validation Rules

| Rule | Description | Action |
|------|-------------|--------|
| R1 | Successor start_date < predecessor end_date | Warning (no auto-fix) |
| R2 | Circular dependency detected | Error (block save) |
| R3 | Predecessor deleted | Warning + orphan successor |

---

## 5.1 Workflow Validation Rules

### 5.1.1 Status Transition Matrix

| Current | Backlog | Ready | In Progress | In Review | In Test | Done | Blocked |
|---------|---------|-------|-------------|-----------|---------|------|---------|
| **Backlog** | → | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Ready** | ❌ | → | ✅ | ❌ | ❌ | ❌ | ❌ |
| **In Progress** | ❌ | ❌ | → | ✅ | ❌ | ❌ | ✅ |
| **In Review** | ❌ | ✅ | ✅ | → | ✅ | ❌ | ✅ |
| **In Test** | ❌ | ❌ | ❌ | ✅ | → | ✅ | ✅ |
| **Done** | ❌ | ❌ | ❌ | ❌ | ❌ | → | ❌ |
| **Blocked** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | → |

### 5.1.2 Completion Requirements

| Item Type | Field Requirement | Validation Rule |
|-----------|-------------------|-----------------|
| **Story** | `acceptance_criteria` | Must not be empty |
| **Task** | None (owner verification) | Owner must be set |
| **Bug** | `verified_by` | Must reference QA person |
| **Bug** | `severity` | Must be set before closure |
| **Spike** | `findings` | Must document conclusions |

### 5.1.3 Validation Error Codes

| Code | Description | User Message |
|------|-------------|--------------|
| `W001` | Invalid status transition | "Cannot transition from {from} to {to} for {item_type}" |
| `W002` | Missing acceptance criteria | "Story requires acceptance criteria to complete" |
| `W003` | Bug not verified | "Bug must be verified by QA before closure" |
| `W004` | Missing severity | "Bug requires severity assignment" |
| `W005` | Missing spike findings | "Spike requires documented findings" |
| `W006` | Invalid status for item type | "Status {status} not valid for {item_type}" |

---

## 6. Database Schema (SQLite)

```sql
-- Portfolios
CREATE TABLE portfolios (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  owner TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Projects
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT REFERENCES portfolios(id),
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'NotStarted',
  priority TEXT NOT NULL DEFAULT 'Medium',
  start_date TEXT,
  end_date TEXT,
  owner TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Items (Epic, Story, Task, Bug, Spike, Milestone)
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  parent_id TEXT REFERENCES items(id),
  type TEXT NOT NULL CHECK(type IN ('Epic', 'Story', 'Task', 'Bug', 'Spike', 'Milestone')),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'P2' CHECK(priority IN ('P0', 'P1', 'P2', 'P3')),
  risk_level TEXT CHECK(risk_level IN ('None', 'Low', 'Medium', 'High', 'Critical')),
  start_date TEXT,
  end_date TEXT,
  due_date TEXT,
  owner TEXT,
  component TEXT,
  release TEXT,
  severity TEXT CHECK(severity IN ('Critical', 'High', 'Medium', 'Low')),
  acceptance_criteria TEXT,
  findings TEXT,
  verified_by TEXT,
  source_type TEXT NOT NULL DEFAULT 'Manual',
  source_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  -- Type-specific status constraints
  CHECK(
    (type IN ('Story', 'Task') AND status IN ('Backlog', 'Ready', 'In Progress', 'In Review', 'In Test', 'Done', 'Blocked')) OR
    (type = 'Bug' AND status IN ('New', 'Triage', 'In Fix', 'In Verification', 'Closed')) OR
    (type = 'Spike' AND status IN ('Proposed', 'In Research', 'Findings Ready', 'Closed')) OR
    (type = 'Milestone' AND status IN ('Active', 'Completed')) OR
    (type = 'Epic' AND status IN ('Active', 'Completed'))
  )
);

-- Item Status History (for audit trail and workflow metrics)
CREATE TABLE item_status_history (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT,
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT -- JSON: additional context (e.g., review feedback)
);

-- Custom Fields
CREATE TABLE custom_fields (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'String'
);

-- Dependencies
CREATE TABLE dependencies (
  id TEXT PRIMARY KEY,
  predecessor_id TEXT NOT NULL REFERENCES items(id),
  successor_id TEXT NOT NULL REFERENCES items(id),
  type TEXT NOT NULL DEFAULT 'FinishToStart',
  lag_days INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_projects_portfolio ON projects(portfolio_id);
CREATE INDEX idx_items_project ON items(project_id);
CREATE INDEX idx_items_parent ON items(parent_id);
CREATE INDEX idx_items_type_status ON items(type, status);
CREATE INDEX idx_items_owner ON items(owner);
CREATE INDEX idx_custom_fields_entity ON custom_fields(entity_type, entity_id);
CREATE INDEX idx_dependencies_predecessor ON dependencies(predecessor_id);
CREATE INDEX idx_dependencies_successor ON dependencies(successor_id);
CREATE INDEX idx_item_status_history_item ON item_status_history(item_id, changed_at DESC);

-- FTS5 for full-text search
CREATE VIRTUAL TABLE items_fts USING fts5(name, description, content=items);
```

---

## 7. API Interface (Rust Commands)

```rust
// ==================== Portfolio CRUD ====================
fn create_portfolio(name: String, description: Option<String>) -> Portfolio;
fn get_portfolio(id: Uuid) -> Option<Portfolio>;
fn list_portfolios() -> Vec<Portfolio>;
fn update_portfolio(id: Uuid, updates: PortfolioUpdate) -> Portfolio;
fn delete_portfolio(id: Uuid) -> bool;

// ==================== Project CRUD ====================
fn create_project(portfolio_id: Option<Uuid>, name: String, ...) -> Project;
fn get_project(id: Uuid) -> Option<Project>;
fn list_projects(portfolio_id: Option<Uuid>) -> Vec<Project>;
fn update_project(id: Uuid, updates: ProjectUpdate) -> Project;
fn delete_project(id: Uuid) -> bool;

// ==================== Item CRUD ====================
fn create_item(project_id: Uuid, item_type: ItemType, name: String, ...) -> Item;
fn get_item(id: Uuid) -> Option<Item>;
fn list_items(project_id: Uuid, filters: ItemFilters) -> Vec<Item>;
fn update_item(id: Uuid, updates: ItemUpdate) -> Item;
fn delete_item(id: Uuid) -> bool;

// ==================== Workflow Management ====================

/// Transition item to a new status with validation
fn transition_item_status(
    item_id: Uuid,
    to_status: String,
    user: String,
    metadata: Option<String>
) -> Result<Item, WorkflowError>;

/// Validate if a status transition is allowed
fn validate_status_transition(
    item_type: ItemType,
    from_status: Option<String>,
    to_status: String
) -> Result<(), ValidationError>;

/// Check if item meets requirements for Done/Closed state
fn validate_completion_requirements(item: &Item) -> Result<(), CompletionError>;

/// Get status history for an item
fn get_item_status_history(item_id: Uuid) -> Vec<StatusHistoryEntry>;

/// Get workflow metrics (for Dashboard CFD)
fn get_workflow_metrics(project_id: Uuid, days: u32) -> WorkflowMetrics;

// ==================== Dependencies ====================
fn add_dependency(predecessor_id: Uuid, successor_id: Uuid, dep_type: DepType) -> Dependency;
fn remove_dependency(id: Uuid) -> bool;
fn validate_dependencies(project_id: Uuid) -> Vec<DependencyViolation>;

// ==================== Type-Specific Enums ====================

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ItemType {
    Epic,
    Story,
    Task,
    Bug,
    Spike,
    Milestone,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ItemStatus {
    // Story/Task
    Backlog,
    Ready,
    InProgress,
    InReview,
    InTest,
    Done,
    Blocked,

    // Bug
    BugNew,
    Triage,
    InFix,
    InVerification,
    Closed,

    // Spike
    Proposed,
    InResearch,
    FindingsReady,
    SpikeClosed,

    // Milestone/Epic
    Active,
    Completed,
}

// ==================== Validation Logic ====================

impl Item {
    /// Check if item can transition to Done/Closed state
    pub fn can_complete(&self) -> Result<(), String> {
        match self.item_type {
            ItemType::Story | ItemType::Task => {
                if self.status != ItemStatus::InTest {
                    return Err("Must be in 'In Test' to complete".to_string());
                }
                if self.acceptance_criteria.is_none() || self.acceptance_criteria.unwrap().is_empty() {
                    return Err("Story must have acceptance criteria".to_string());
                }
                Ok(())
            }
            ItemType::Bug => {
                if self.status != ItemStatus::InVerification {
                    return Err("Bug must be in verification".to_string());
                }
                if self.verified_by.is_none() || self.verified_by.unwrap().is_empty() {
                    return Err("Bug must be verified by QA".to_string());
                }
                if self.severity.is_none() {
                    return Err("Bug must have severity set".to_string());
                }
                Ok(())
            }
            ItemType::Spike => {
                if self.status != ItemStatus::FindingsReady {
                    return Err("Spike findings must be ready".to_string());
                }
                if self.findings.is_none() || self.findings.unwrap().is_empty() {
                    return Err("Spike must have findings documented".to_string());
                }
                Ok(())
            }
            _ => Ok(()),
        }
    }
}
```

---

## 8. Acceptance Criteria

| AC# | Criteria | Test Method |
|-----|----------|-------------|
| AC-01 | Create Portfolio with name persists to DB | Unit test |
| AC-02 | Create Project under Portfolio links correctly | Unit test |
| AC-03 | Create Task with sub-task (one level) | Unit test |
| AC-04 | Reject sub-sub-task creation | Unit test |
| AC-05 | Custom field CRUD works | Unit test |
| AC-06 | Dependency validation catches violations | Unit test |
| AC-07 | FTS5 search returns matching items | Integration test |
| AC-08 | 1000 items query < 100ms | Performance test |
| **AC-09** | **Story cannot transition to Done without acceptance criteria** | Unit test |
| **AC-10** | **Bug cannot transition to Closed without verified_by field** | Unit test |
| **AC-11** | **Spike cannot transition to Closed without findings** | Unit test |
| **AC-12** | **Invalid status transitions are rejected** | Unit test |
| **AC-13** | **Status history is recorded for all transitions** | Integration test |
| **AC-14** | **Workflow metrics query returns correct distribution** | Integration test |
| **AC-15** | **Type-specific fields (severity, acceptance_criteria, findings) are enforced** | Unit test |

### 8.1 Workflow Test Cases

#### Test Case: Story Completion Validation
```rust
#[test]
fn story_without_acceptance_criteria_cannot_complete() {
    let mut story = create_story("Test Story");
    story.acceptance_criteria = None;
    story.status = ItemStatus::InTest;

    let result = story.can_complete();
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Story must have acceptance criteria");
}
```

#### Test Case: Bug Closure Validation
```rust
#[test]
fn bug_without_verification_cannot_close() {
    let mut bug = create_bug("Critical Bug");
    bug.severity = Some("Critical".to_string());
    bug.verified_by = None;
    bug.status = ItemStatus::InVerification;

    let result = bug.can_complete();
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Bug must be verified by QA");
}
```

#### Test Case: Invalid Status Transition
```rust
#[test]
fn reject_invalid_story_transition() {
    // Cannot jump from Backlog to In Test directly
    let result = validate_status_transition(
        ItemType::Story,
        Some(ItemStatus::Backlog),
        ItemStatus::InTest
    );
    assert!(result.is_err());
}
```

---

## 9. Related Documents

- @PRD-001-Master.md — Master PRD
- @PRD-003-Inbox.md — Uses data model for item creation
- @PRD-004-RebuildEngine.md — Uses data model for sync
- @PRD-008-Governance.md — Audit log references entities

---

*End of PRD-002*
