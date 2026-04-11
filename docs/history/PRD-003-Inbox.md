> ⚠️ **已取代** — 本 PRD 已被 [PRD-001-Master.md](./PRD-001-Master.md) 取代。
> 当前产品方向为 **PM Workspace**，请以 Master PRD 为准。
> 本文档仅供历史参考。

# PRD-003: Inbox Specification

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-003 |
| **Parent** | @PRD-001-Master.md |
| **Status** | Draft |
| **Date** | 2026-01-30 |

---

## 1. Overview

The Inbox captures unstructured real-world inputs and transforms them into structured database items. It works with or without AI assistance.

**Dependencies**: @PRD-002-DataModel.md
**Dependents**: @PRD-006-Dashboard.md (change feed), @PRD-009-AIProvider.md (suggestions)

---

## 2. Input Methods

| Method | Description | MVP | Phase 2 |
|--------|-------------|-----|---------|
| Text Entry | Direct text input in UI | ✅ | ✅ |
| URL Paste | Paste link, fetch title/metadata | ✅ | ✅ |
| File Drop | Drag file into inbox area | ✅ | ✅ |
| Watched Folder | Monitor directory for new files | ✅ | ✅ |
| Screenshot Paste | Paste image from clipboard | ❌ | ✅ |
| Email Import | Parse .eml files | ❌ | ✅ |

---

## 3. Inbox Item Schema

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| status | Enum | Pending, Processing, Triaged, Discarded |
| input_type | Enum | Text, URL, File, Screenshot |
| raw_content | Text | Original input (text or file path) |
| extracted_title | String | Parsed/suggested title |
| extracted_body | Text | Parsed content |
| suggested_project_id | UUID | AI-suggested project (nullable) |
| suggested_type | Enum | AI-suggested item type |
| suggested_priority | Enum | AI-suggested priority |
| suggested_tags | JSON | AI-suggested tags array |
| rule_matches | JSON | Matched automation rules |
| created_at | Timestamp | When captured |
| triaged_at | Timestamp | When confirmed/discarded |

---

## 4. Processing Pipeline

```
┌──────────────┐
│   Input      │ (text / file / URL / screenshot)
└──────┬───────┘
       ▼
┌──────────────┐
│   Capture    │ Save raw content, generate inbox item
└──────┬───────┘
       ▼
┌──────────────┐
│ Rule Match   │ Check automation rules (no AI)
└──────┬───────┘
       ▼
┌──────────────────────────────────────┐
│         AI Enabled?                  │
│  ┌─────────┐          ┌───────────┐  │
│  │   No    │          │    Yes    │  │
│  └────┬────┘          └─────┬─────┘  │
│       │                     │        │
│       ▼                     ▼        │
│ ┌───────────┐       ┌─────────────┐  │
│ │ Manual    │       │ AI Suggest  │  │
│ │ Triage UI │       │ + Confirm   │  │
│ └───────────┘       └─────────────┘  │
└──────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│ User Confirm │ Map fields, select project, confirm
└──────┬───────┘
       ▼
┌──────────────┐     ┌──────────────┐
│ Create Item  │────▶│ Audit Log    │
│ in Database  │     │ Entry        │
└──────────────┘     └──────────────┘
```

---

## 5. Automation Rules (No AI)

Users can define rules for automatic field mapping.

### 5.1 Rule Schema

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Rule name |
| priority | Integer | Execution order (lower first) |
| enabled | Boolean | Active flag |
| conditions | JSON | Match conditions |
| actions | JSON | Field assignments |

### 5.2 Condition Types

| Type | Example | Description |
|------|---------|-------------|
| filename_contains | `*risk*` | Glob pattern on filename |
| filename_regex | `PRJ-\d+` | Regex on filename |
| content_contains | `URGENT` | Keyword in content |
| extension_equals | `.xlsx` | File extension match |
| source_folder | `/inbox/project-a/` | Source path prefix |

### 5.3 Action Types

| Action | Example | Description |
|--------|---------|-------------|
| set_project | `uuid` | Assign to project |
| set_type | `Issue` | Set item type |
| set_priority | `High` | Set priority |
| add_tag | `risk` | Add tag |
| set_custom_field | `{"bu": "IT"}` | Set custom field |

### 5.4 Rule Example

```json
{
  "name": "Risk Excel Files",
  "priority": 10,
  "enabled": true,
  "conditions": [
    {"type": "filename_contains", "value": "*risk*"},
    {"type": "extension_equals", "value": ".xlsx"}
  ],
  "actions": [
    {"type": "set_type", "value": "Issue"},
    {"type": "set_priority", "value": "High"},
    {"type": "add_tag", "value": "risk"}
  ]
}
```

---

## 6. AI Suggestions (Optional)

When AI provider is configured, the following suggestions are available:

| Suggestion | Input | Output |
|------------|-------|--------|
| Classification | Raw content | Suggested item type |
| Project Match | Content + project list | Most relevant project |
| Field Extraction | Content | Title, dates, owner, priority |
| Duplicate Detection | Content + existing items | Potential duplicates |
| Tag Suggestion | Content | Relevant tags |

### 6.1 AI Interface

```typescript
interface InboxAISuggestion {
  confidence: number; // 0.0 - 1.0
  suggested_title?: string;
  suggested_type?: 'Task' | 'Issue' | 'Milestone';
  suggested_project_id?: string;
  suggested_priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  suggested_tags?: string[];
  potential_duplicates?: Array<{item_id: string, similarity: number}>;
  extracted_dates?: {start?: string, end?: string, due?: string};
  extracted_owner?: string;
}
```

### 6.2 Confirmation Requirement

**CRITICAL**: All AI suggestions require explicit user confirmation before persisting.

```
┌─────────────────────────────────────────────────┐
│  AI Suggestion (click to accept/reject)        │
├─────────────────────────────────────────────────┤
│  Title: "Q1 Risk Assessment Review"    [✓] [✗] │
│  Type: Issue                           [✓] [✗] │
│  Project: Project Alpha (85%)          [✓] [✗] │
│  Priority: High                        [✓] [✗] │
│  Tags: risk, quarterly                 [✓] [✗] │
├─────────────────────────────────────────────────┤
│  ⚠️  Possible duplicate: "Q1 Risk Review"      │
│      Similarity: 78%  [View] [Merge] [Ignore]  │
├─────────────────────────────────────────────────┤
│           [Confirm All]  [Confirm Selected]    │
└─────────────────────────────────────────────────┘
```

---

## 7. CSV Batch Import

### 7.1 Supported Format

```csv
name,type,project_code,status,priority,start_date,end_date,owner,description
"Task A",Task,PRJ-001,NotStarted,Medium,2026-02-01,2026-02-15,Alice,"Description here"
"Risk B",Issue,PRJ-001,InProgress,High,,,Bob,"Risk description"
```

### 7.2 Import Flow

1. User selects CSV file
2. System shows column mapping preview
3. User confirms/adjusts mappings
4. System validates data (required fields, date formats, enum values)
5. User reviews validation errors
6. User confirms import
7. Items created with `source_type: CSVImport`

### 7.3 Field Mapping UI

```
┌─────────────────────────────────────────────────┐
│  CSV Column Mapping                             │
├─────────────────────────────────────────────────┤
│  CSV Column      →   SwissArmyPM Field         │
│  ─────────────────────────────────────────────  │
│  "Task Name"     →   [name ▼]                  │
│  "Type"          →   [type ▼]                  │
│  "Project ID"    →   [project_code ▼]          │
│  "Start"         →   [start_date ▼]            │
│  "End"           →   [end_date ▼]              │
│  "Assigned To"   →   [owner ▼]                 │
│  "Notes"         →   [description ▼]           │
│  "Custom1"       →   [+ Create Custom Field]   │
├─────────────────────────────────────────────────┤
│  Preview: 150 rows, 3 validation errors        │
│           [Show Errors]  [Import]              │
└─────────────────────────────────────────────────┘
```

---

## 8. Watched Folder

### 8.1 Configuration

| Setting | Type | Description |
|---------|------|-------------|
| folder_path | String | Directory to watch |
| recursive | Boolean | Include subdirectories |
| file_patterns | String[] | Glob patterns to include |
| poll_interval | Integer | Seconds between checks (fallback) |
| auto_process | Boolean | Run rules automatically |

### 8.2 Implementation

Uses Rust `notify-rs` for filesystem events. See @PRD-004-RebuildEngine.md for shared file watching infrastructure.

---

## 9. UI Components

### 9.1 Inbox List View

```
┌─────────────────────────────────────────────────────────────┐
│  Inbox (12 pending)                    [+ Add] [Import CSV] │
├─────────────────────────────────────────────────────────────┤
│  ☐ 📄 Q1 Risk Assessment.xlsx         2 min ago    [Triage] │
│  ☐ 📝 Meeting notes - standup         15 min ago   [Triage] │
│  ☐ 🔗 https://jira.company.com/...    1 hour ago   [Triage] │
│  ☐ 📄 weekly-status.csv               2 hours ago  [Triage] │
│  ─────────────────────────────────────────────────────────  │
│  ✓ Created: 45 items this week                              │
│  ✗ Discarded: 3 items                                       │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Triage Panel

```
┌─────────────────────────────────────────────────────────────┐
│  Triage: Q1 Risk Assessment.xlsx                     [×]    │
├─────────────────────────────────────────────────────────────┤
│  Source: /watched/inbox/Q1 Risk Assessment.xlsx            │
│  Captured: 2026-01-30 14:23:00                             │
│  ─────────────────────────────────────────────────────────  │
│  Title:    [Q1 Risk Assessment Review        ]             │
│  Type:     [Issue ▼]                                       │
│  Project:  [Project Alpha ▼]                               │
│  Priority: [High ▼]                                        │
│  Owner:    [                    ]                          │
│  Due Date: [2026-02-28          ] 📅                       │
│  Tags:     [risk] [quarterly] [+ add]                      │
│  ─────────────────────────────────────────────────────────  │
│  Description:                                              │
│  [                                                    ]    │
│  [                                                    ]    │
│  ─────────────────────────────────────────────────────────  │
│  Rule Matches: "Risk Excel Files" (auto-tagged)            │
├─────────────────────────────────────────────────────────────┤
│        [Discard]              [Save as Draft]  [Confirm]   │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Database Schema

```sql
-- Inbox Items
CREATE TABLE inbox_items (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'Pending',
  input_type TEXT NOT NULL,
  raw_content TEXT NOT NULL,
  file_path TEXT,
  extracted_title TEXT,
  extracted_body TEXT,
  suggested_project_id TEXT REFERENCES projects(id),
  suggested_type TEXT,
  suggested_priority TEXT,
  suggested_tags TEXT, -- JSON array
  rule_matches TEXT, -- JSON array of rule IDs
  created_at TEXT NOT NULL,
  triaged_at TEXT
);

-- Automation Rules
CREATE TABLE inbox_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  enabled INTEGER NOT NULL DEFAULT 1,
  conditions TEXT NOT NULL, -- JSON
  actions TEXT NOT NULL, -- JSON
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Watched Folders
CREATE TABLE watched_folders (
  id TEXT PRIMARY KEY,
  folder_path TEXT NOT NULL UNIQUE,
  recursive INTEGER NOT NULL DEFAULT 0,
  file_patterns TEXT, -- JSON array
  auto_process INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_inbox_status ON inbox_items(status);
CREATE INDEX idx_inbox_created ON inbox_items(created_at);
```

---

## 11. Acceptance Criteria

| AC# | Criteria | Test Method |
|-----|----------|-------------|
| AC-01 | Text input creates inbox item | Unit test |
| AC-02 | File drop captures file path and content | Integration test |
| AC-03 | URL paste extracts page title | Integration test |
| AC-04 | Automation rule matches and applies actions | Unit test |
| AC-05 | CSV import with column mapping works | Integration test |
| AC-06 | CSV validation shows errors before import | Integration test |
| AC-07 | Triage UI allows field editing | E2E test |
| AC-08 | Confirm creates item in database | Integration test |
| AC-09 | Discard marks item without creating | Unit test |
| AC-10 | AI suggestions display with confidence | Integration test |
| AC-11 | AI suggestions require confirmation | E2E test |
| AC-12 | Watched folder detects new files | Integration test |

---

## 12. Related Documents

- @PRD-001-Master.md — Master PRD
- @PRD-002-DataModel.md — Item schema
- @PRD-004-RebuildEngine.md — Shared file watching
- @PRD-009-AIProvider.md — AI suggestion interface

---

*End of PRD-003*
