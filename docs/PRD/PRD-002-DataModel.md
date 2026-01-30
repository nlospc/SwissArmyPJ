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

### 3.3 Item (Task / Issue / Milestone)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| project_id | UUID | Yes | FK to Project |
| parent_id | UUID | No | FK to Item (for sub-items, one level) |
| type | Enum | Yes | Task, Issue, Milestone |
| name | String(255) | Yes | Item name |
| description | Text | No | Item description |
| status | Enum | Yes | NotStarted, InProgress, Blocked, Done |
| priority | Enum | Yes | Low, Medium, High, Critical |
| risk_level | Enum | No | None, Low, Medium, High, Critical |
| start_date | Date | No | Planned/actual start |
| end_date | Date | No | Planned/actual end |
| due_date | Date | No | Due date (for issues) |
| owner | String(100) | No | Assignee name |
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

### 4.1 Item Status Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ NotStarted  │────▶│ InProgress  │────▶│    Done     │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │ ▲
                          ▼ │
                   ┌─────────────┐
                   │   Blocked   │
                   └─────────────┘
```

---

## 5. Dependency Validation Rules

| Rule | Description | Action |
|------|-------------|--------|
| R1 | Successor start_date < predecessor end_date | Warning (no auto-fix) |
| R2 | Circular dependency detected | Error (block save) |
| R3 | Predecessor deleted | Warning + orphan successor |

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

-- Items (Task, Issue, Milestone)
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  parent_id TEXT REFERENCES items(id),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'NotStarted',
  priority TEXT NOT NULL DEFAULT 'Medium',
  risk_level TEXT,
  start_date TEXT,
  end_date TEXT,
  due_date TEXT,
  owner TEXT,
  source_type TEXT NOT NULL DEFAULT 'Manual',
  source_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
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
CREATE INDEX idx_custom_fields_entity ON custom_fields(entity_type, entity_id);
CREATE INDEX idx_dependencies_predecessor ON dependencies(predecessor_id);
CREATE INDEX idx_dependencies_successor ON dependencies(successor_id);

-- FTS5 for full-text search
CREATE VIRTUAL TABLE items_fts USING fts5(name, description, content=items);
```

---

## 7. API Interface (Rust Commands)

```rust
// Portfolio CRUD
fn create_portfolio(name: String, description: Option<String>) -> Portfolio;
fn get_portfolio(id: Uuid) -> Option<Portfolio>;
fn list_portfolios() -> Vec<Portfolio>;
fn update_portfolio(id: Uuid, updates: PortfolioUpdate) -> Portfolio;
fn delete_portfolio(id: Uuid) -> bool;

// Project CRUD
fn create_project(portfolio_id: Option<Uuid>, name: String, ...) -> Project;
fn get_project(id: Uuid) -> Option<Project>;
fn list_projects(portfolio_id: Option<Uuid>) -> Vec<Project>;
fn update_project(id: Uuid, updates: ProjectUpdate) -> Project;
fn delete_project(id: Uuid) -> bool;

// Item CRUD
fn create_item(project_id: Uuid, item_type: ItemType, name: String, ...) -> Item;
fn get_item(id: Uuid) -> Option<Item>;
fn list_items(project_id: Uuid, filters: ItemFilters) -> Vec<Item>;
fn update_item(id: Uuid, updates: ItemUpdate) -> Item;
fn delete_item(id: Uuid) -> bool;

// Dependencies
fn add_dependency(predecessor_id: Uuid, successor_id: Uuid, dep_type: DepType) -> Dependency;
fn remove_dependency(id: Uuid) -> bool;
fn validate_dependencies(project_id: Uuid) -> Vec<DependencyViolation>;
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

---

## 9. Related Documents

- @PRD-001-Master.md — Master PRD
- @PRD-003-Inbox.md — Uses data model for item creation
- @PRD-004-RebuildEngine.md — Uses data model for sync
- @PRD-008-Governance.md — Audit log references entities

---

*End of PRD-002*
