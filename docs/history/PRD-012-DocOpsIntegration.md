> ⚠️ **已取代** — 本 PRD 已被 [PRD-001-Master.md](./PRD-001-Master.md) 取代。
> 当前产品方向为 **PM Workspace**，请以 Master PRD 为准。
> 本文档仅供历史参考。

# PRD-012: DocOps Integration (Dashboard Vault)

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-012 |
| **Parent** | @PRD-001-Master.md |
| **Status** | Draft |
| **Date** | 2026-02-13 |

---

## 1. Overview

The DocOps Integration connects SwissArmyPM to an external Dashboard Vault (DocOps system) so that **execution data** (tasks, timelines, time logs) and **narrative docs** (PRDs, decisions, weekly reports) can be viewed together.

SwissArmyPM remains **fully functional without Vault**. When enabled, it becomes a **DocOps-driven project platform**:

- **SwissArmyPM** = real-time execution & interaction window
- **Vault** = narrative & decision brain (long-term docs, audits)

---

## 2. Objectives & Non-Goals

### 2.1 Objectives (MVP)

1. Allow users to configure a **Vault root path** in Settings.
2. Establish a stable **Portfolio ID mapping** between SwissArmyPM projects and Vault.
3. Support **one-way export** of execution data (projects, work items) from SQLite to Vault Core CSV.
4. Provide a **DocOps panel** in project view that surfaces related Vault docs (PRDs, decisions, reports) in a **read-only** way and links out to Vault.

### 2.2 Non-Goals (MVP)

These are explicitly **out of scope** for the first version:

- Full **bi-directional syncing** with conflict resolution.
- Real-time file watching of Vault changes.
- Collaborative editing or in-app Markdown editing for Vault docs.
- Any hard dependency on Vault for SwissArmyPM core features (Inbox, My Work, Timeline, Dashboard must continue to work without Vault).

---

## 3. Key Concepts

### 3.1 Dashboard Vault (DocOps System)

- Obsidian-friendly Markdown repository.
- Contains **Core CSV** files, treated as source of truth for portfolio-level narrative and meta data:
  - `projects.csv`
  - `work_items.csv`
  - `decisions.csv`
  - `risks.csv`
  - `deliverables.csv`
  - `people.csv`
- Contains Markdown docs (e.g. `projects/PRJ-001.md`, `decisions/DEC-001.md`) that reference Core CSV rows via IDs.
- Implements an Agent-First protocol in `.agent/` (Ingest → Core → View → Query).

### 3.2 Portfolio Core (Conceptual Layer)

Portfolio Core is an **abstract schema** that aligns data across SwissArmyPM and Vault:

- `portfolio_projects`
- `portfolio_work_items`
- `portfolio_decisions`
- `portfolio_risks`
- `portfolio_deliverables`

SwissArmyPM will implement the **projects / work_items** parts of this schema in SQLite to:

- Keep a stable **Portfolio ID** for each project and work item.
- Track the corresponding Vault document path (if any).

### 3.3 Execution vs Narrative Fields

To avoid "two systems fighting for ownership" of fields, we distinguish:

- **Execution fields** (source of truth: SwissArmyPM)
  - status, start/end dates, assignee, estimates, actuals, dependencies.
- **Narrative fields** (source of truth: Vault)
  - project background, requirements text, decision rationales, weekly report content.
- **Meta fields** (glue in Portfolio Core)
  - portfolio IDs, tags, Vault doc paths, external links.

SwissArmyPM only **exports** execution and meta fields to Vault Core CSV. Narrative fields are **never overwritten** by SwissArmyPM.

---

## 4. User Stories

### 4.1 Configure Vault Path

> As a project manager, I want to connect my local Vault folder to SwissArmyPM so that I can see project docs alongside execution data.

- Settings exposes a **"DocOps / Vault"** section.
- User selects a folder as `Vault Root Path` (file picker or manual path input).
- App verifies the folder structure (e.g. presence of `.agent/` or `core/` directory and CSV templates).
- If not configured, DocOps features are hidden or marked as disabled.

### 4.2 Export Projects to Vault

> As a project manager, I want SwissArmyPM to publish my project portfolio into the Vault so that portfolio views and docs can reference the same IDs.

- From Settings or a dedicated command, user clicks **"Sync Projects to Vault"**.
- System writes/updates `projects.csv` under Vault `core/` directory, using Portfolio IDs.
- Each project row includes at minimum: `portfolio_project_id`, `local_project_id`, `name`, `status`, `start_date`, `end_date`, `owner`, `tags`.

### 4.3 Export Work Items to Vault

> As a project manager, I want work items (tasks, milestones, issues) to show up in Vault so that decision docs and reports can refer to them.

- Same sync process writes/updates `work_items.csv`.
- Each row includes: `portfolio_work_item_id`, `local_work_item_id`, `portfolio_project_id`, `type`, `status`, `priority`, `estimate`, `actuals_summary`.

### 4.4 View Related Docs for a Project

> As a user, when I'm looking at a project in SwissArmyPM, I want to quickly see its PRDs, decisions, and recent reports from Vault so I don't have to hunt for them manually.

- In the Projects view, project details panel gets a **"DocOps" tab**.
- For a project with a known `portfolio_project_id`, SwissArmyPM reads Vault CSVs (`projects.csv`, `decisions.csv`, `deliverables.csv`, etc.) and shows:
  - Linked PRD document(s)
  - Recent decisions (by date)
  - Recent reports (e.g. weekly status docs)
- Clicking an entry opens the corresponding Markdown file via OS (default editor / Obsidian).

### 4.5 Work Item → Decision / Doc Link

> As a user, when troubleshooting a blocked task, I want to see related decisions or risk docs in Vault so I can understand the context.

- In the Work Item detail view, show a list of **related decisions/docs** if Vault is configured.
- Relation can be via `portfolio_work_item_id` or tags / references in `decisions.csv`.
- Again, items open in external editor when clicked.

---

## 5. Functional Scope (MVP)

### 5.1 Vault Configuration

- New settings section:
  - `vaultRootPath: string | null`
- Validation:
  - Path must exist and be readable.
  - Optional: check for `.agent/` or a `core/` directory.
- UI states:
  - If not configured → DocOps features hidden or show a call-to-action.
  - If configured → show last sync time and a "Sync Now" button.

### 5.2 Portfolio ID Mapping Tables

Extend SQLite schema with two mapping tables:

```sql
CREATE TABLE portfolio_projects (
  portfolio_project_id TEXT PRIMARY KEY,
  local_project_id TEXT NOT NULL,
  vault_path TEXT,                -- e.g. projects/PRJ-001.md
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE portfolio_work_items (
  portfolio_work_item_id TEXT PRIMARY KEY,
  local_work_item_id TEXT NOT NULL,
  portfolio_project_id TEXT NOT NULL,
  vault_path TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_portfolio_projects_local
  ON portfolio_projects(local_project_id);

CREATE UNIQUE INDEX idx_portfolio_work_items_local
  ON portfolio_work_items(local_work_item_id);
```

Behavior:

- When a new project/work item is created in SwissArmyPM:
  - If no `portfolio_*_id` exists, generate a UUID.
- When syncing to Vault:
  - Use these IDs as stable keys in CSV.

### 5.3 Export to Vault Core CSV

Implement a `vault:sync` IPC command (exact naming TBD) that:

1. Validates `vaultRootPath`.
2. Reads all active projects and work items from SQLite.
3. Joins with `portfolio_projects` / `portfolio_work_items` tables.
4. Writes/overwrites CSV files under `vaultRootPath/core/`:

   ```text
   vaultRootPath/
     core/
       projects.csv
       work_items.csv
   ```

5. Returns summary (rows written, time, errors) to the UI.

**CSV Schema (example, may be refined):**

```csv
# projects.csv
portfolio_project_id,local_project_id,key,name,status,start_date,end_date,owner,tags
PRJ-001,local-uuid-1,PRJ-001,"ERP Migration","InProgress",2026-01-15,2026-04-30,"Alex","erp;migration"

# work_items.csv
portfolio_work_item_id,local_work_item_id,portfolio_project_id,type,status,priority,estimate_minutes,logged_minutes
WI-001,local-uuid-10,PRJ-001,"Task","InProgress","High",240,120
```

### 5.4 DocOps Tab in Project View

Add a **"DocOps" tab to project detail UI with two zones:**

- **Summary zone**
  - Show `portfolio_project_id` and Vault doc path (if known).
  - Show last sync timestamp to Vault.
- **Linked Docs zone**
  - Reads from Vault Core CSVs (via adapter) to list:
    - `PRDs` (e.g. `type = 'PRD'` in deliverables/decisions)
    - `Decisions` (
      - from `decisions.csv`, filtered by `portfolio_project_id`
    )
    - `Reports` (weekly status docs, filtered by project).
  - Each entry shows:
    - Title
    - Type (PRD / Decision / Weekly Report)
    - Date
  - Clicking an entry triggers OS-level file open using its `vault_path`.

If Vault not configured:

- Tab shows an explanation and a button to open Settings → DocOps.

### 5.5 Read-Only Nature of Narrative Fields

- SwissArmyPM does **not** provide editors for Vault narrative fields.
- Any textual content pulled from Vault is displayed as read-only summaries or links.
- UI clearly indicates where to go edit (e.g. "Edit in Vault").

---

## 6. UX & Interaction Details

### 6.1 Settings: DocOps Section

- Location: Settings → Integrations → DocOps / Vault.
- Fields:
  - Vault root path (text input + folder picker).
  - Last sync time.
  - Sync result (success/failed + short message).
- Actions:
  - `Test Connection` → validates path structure and basic write access.
  - `Sync Now` → triggers `vault:sync` IPC.

### 6.2 Project Detail: DocOps Tab

Wireframe-level behavior:

```text
[ Project: ERP Migration ]

Tabs: [Overview] [Timeline] [Risks] [DocOps]

DocOps Tab:

  Vault Status:
    - Connected to: ~/Vaults/acme-portfolio
    - Portfolio ID: PRJ-001
    - Last Sync: 2026-02-13 10:23

  Linked Docs:
    - [PRD] ERP Migration Master PRD          (2026-01-10)   [Open]
    - [Decision] Chosen Gantt Library         (2026-01-18)   [Open]
    - [Report] Week 05 Status Report          (2026-02-03)   [Open]
```

Error states:

- Vault not configured → show CTA: "Configure Vault to see related docs".
- CSV missing or invalid → show warning and option to re-sync.

### 6.3 Work Item Detail: Context Docs

- In the work item side panel (or detail modal), optionally show a small "Context Docs" section if Vault is configured:
  - `Decisions touching this item`.
  - `Risks referencing this item`.
  - `Docs mentioning this work item` (if `decisions.csv` / `risks.csv` include a `work_item_ids` field).

---

## 7. Technical Considerations

### 7.1 Offline Behavior

- Vault integration is designed for **local folders**, so offline is natural.
- If the Vault path is on a network drive / cloud sync folder, errors should surface as sync failures but should not affect SwissArmyPM core features.

### 7.2 Error Handling

- All Vault interactions are best-effort and must be isolated:
  - Sync failures must not block saving projects/tasks in SwissArmyPM.
  - Errors are reported in Settings / DocOps UI but not as blocking modals for normal flows.

### 7.3 Extensibility

- Future phases may add:
  - Import of decisions/risks into SwissArmyPM as read-only references.
  - Bi-directional field mapping with conflict resolution.
  - Hooks for `.agent/` workflows (e.g. trigger portfolio views, AI queries).

MVP implementation must keep these options open but is **not required** to support them.

---

## 8. Acceptance Criteria

| AC# | Criteria | Test Method |
|-----|----------|-------------|
| AC-01 | User can configure a valid Vault root path | Manual + integration test |
| AC-02 | `projects.csv` is generated under `vaultRootPath/core/` with expected columns | Integration test |
| AC-03 | `work_items.csv` is generated under `vaultRootPath/core/` with expected columns | Integration test |
| AC-04 | New projects/work items get stable `portfolio_*_id` values in SQLite | Unit test |
| AC-05 | Project DocOps tab lists related docs when Vault CSVs are present | Integration test |
| AC-06 | Clicking a linked doc opens the corresponding file in the OS default editor | Manual + integration test |
| AC-07 | When Vault is not configured, DocOps UI is either hidden or shows a clear CTA | E2E test |
| AC-08 | Sync errors do not prevent normal app usage | E2E test |

---

*End of PRD-012: DocOps Integration*
