# PMBrain Welcome Board

PMBrain now uses this Obsidian vault as the human-readable project workspace.
SQLite remains the source of truth; this vault is the editable projection layer
for notes, project canvases, timelines, decisions, risks, evidence, and reviews.

## Start Here

- Open this folder as an Obsidian vault: `packages/vault`.
- Run `npm run dev:pmbrain -- setup` from the repo root to initialize PMBrain.
- Run `npm run dev:pmbrain -- vault-sync export` to generate project, work item, and risk notes.
- Run `npm run dev:pmbrain -- vault-sync check` before importing Obsidian edits.
- Run `npm run dev:pmbrain -- vault-sync import` only after check reports a clean vault.
- Run `npm run dev:pmbrain -- vault-sync reconcile` for a read-only repair preview; repair flags are reserved for later.
- Do not use the old Notion MVP workspace as a PMBrain connector. It is deprecated for this project.

## Recommended Plugins

- Dataview: query project records and build dashboards from frontmatter.
- Tasks: manage action items and due dates in Markdown.
- Kanban: maintain project boards from Markdown files.
- Chinese Calendar: Chinese lunar calendar, public holidays, adjusted workdays, and date navigation for the main user group.
- Templater: create repeatable project, meeting, and risk note templates.
- Metadata Menu: edit frontmatter fields with a structured UI.
- QuickAdd: capture new work items and evidence quickly.
- Advanced Tables: edit Markdown tables safely.
- Obsidian Git: optional later; not enabled in this fresh package.

Optional calendar plugins:

- Use Obsidian core Daily Notes first for PMBrain daily reports.
- If plugin search cannot find Calendar or Periodic Notes, skip them for now.
- Later alternatives to evaluate: Daily Note Calendar, Full Calendar, or Periodic Notes Calendar.

## Recommended Settings

- Files and Links: use Markdown links and keep new attachments under `90_Attachments`.
- Community plugins: disable Restricted Mode only after reviewing the plugins above.
- Core plugins: enable Daily Notes.
- Daily notes folder: `00_Inbox/Daily`.
- Template folder: `99_Templates`.
- Default new note location: `00_Inbox`.
- Chinese Calendar: keep QuickAdd integration disabled until PMBrain capture choices are defined.
- Obsidian Sync: disabled by default; PMBrain is local-first.

## Workspace Map

- `00_Inbox`: raw capture, daily reports, unsorted notes.
- `10_Projects`: project pages and project canvases.
- `20_Timeline`: milestones, status events, and timeline notes.
- `30_WorkItems`: actions, issues, decisions, and follow-ups.
- `40_Risks`: risks, assumptions, blockers, and mitigations.
- `50_Stakeholders`: people, organizations, and communication context.
- `60_Evidence`: meeting notes, source references, files, and audit evidence.
- `90_Attachments`: linked files and exports.
- `99_Templates`: Markdown templates used by PMBrain and Obsidian.

## Sync Safety Rules

- Generated folders: `10_Projects`, `30_WorkItems`, and `40_Risks`.
- Manually maintained or reserved folders: `00_Inbox`, `20_Timeline`, `50_Stakeholders`, `60_Evidence`, `90_Attachments`, and `99_Templates`.
- You may edit approved frontmatter fields and the `Editable Notes` section in generated notes.
- Do not manually edit `pmbrain_type`, `pmbrain_id`, `sqlite_version_id`, `content_hash`, or `last_synced_at`.
- Notes with changed IDs, invalid folders, duplicate IDs, malformed dates, or missing required frontmatter are rejected by `vault-sync check`.
