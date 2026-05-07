# PMBrain Vault Sync Contract

This contract defines the SQLite-to-Obsidian projection used by `pmbrain vault-sync`.
SQLite remains the authoritative store. Obsidian notes are a controlled editing surface for approved fields and manually editable body sections.

## Table to Folder Mapping

| PMBrain type | SQLite table | Vault folder | Stable path |
| --- | --- | --- | --- |
| `project` | `projects` joined to `pages` | `10_Projects` | `10_Projects/{project_code}.md` |
| `work_item` | `work_items` | `30_WorkItems` | `30_WorkItems/{work_item_id}.md` |
| `risk` | `risks` | `40_Risks` | `40_Risks/{risk_id}.md` |

Other vault folders are manually maintained or reserved until their sync contract is defined:
`00_Inbox`, `20_Timeline`, `50_Stakeholders`, `60_Evidence`, `90_Attachments`, and `99_Templates`.

## Required Frontmatter

Every generated sync note must include:

| Field | Purpose | Editable |
| --- | --- | --- |
| `pmbrain_type` | Sync type: `project`, `work_item`, or `risk` | No |
| `pmbrain_id` | SQLite record ID | No |
| `sync_status` | Sync lifecycle state such as `synced`, `imported`, `draft/new` | No, except future draft creation |
| `last_synced_at` | ISO timestamp from the last accepted sync | No |
| `sqlite_version_id` | SQLite version marker used for conflict detection | No |
| `content_hash` | Hash of editable frontmatter fields plus editable note section | No |

Do not manually edit IDs, hashes, timestamps, or version markers. `vault-sync check` treats invalid or missing required fields as malformed notes.

## Editable Fields

`project` editable fields:
`title`, `owner`, `status`, `priority`, `health`, `objective`, `start_date`, `target_date`, `end_date`, `progress_pct`, `budget_baseline`, `cost_actual`, `program_id`, `program_role`, and the `Editable Notes` section.

`work_item` editable fields:
`title`, `description`, `status`, `priority`, `severity`, `owner`, `due_date`, `resolution`, `tags`, and the `Editable Notes` section.

`risk` editable fields:
`title`, `category`, `status`, `probability`, `impact`, `mitigation`, `contingency`, `owner`, `due_date`, and the `Editable Notes` section.

All other fields in generated notes are read-only projections from SQLite.

## Commands

```bash
npm run dev:pmbrain -- vault-sync export
npm run dev:pmbrain -- vault-sync check
npm run dev:pmbrain -- vault-sync import
npm run dev:pmbrain -- vault-sync reconcile
```

`check` is read-only and reports missing records, changed notes, changed SQLite records, conflicts, duplicate IDs, and malformed notes.
`import` only accepts clean validated vault changes and writes accepted changes to `ingest_log`.
`reconcile` currently runs controlled read-only check; repair flags are reserved for `--sqlite-wins`, `--vault-wins`, `--dry-run`, `--only`, and `--allow-create`.
