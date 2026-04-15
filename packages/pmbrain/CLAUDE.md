# CLAUDE.md — PMBrain

> Shared principles live in `/CLAUDE.md` (monorepo root). This file adds PMBrain-specific rules.

---

## What PMBrain Is

PMBrain is a **local-first PM knowledge brain**. It runs as a CLI and MCP server, using SQLite as the source of truth and Obsidian vault as the human-readable projection layer.

It does **not** depend on SwissArmyPM. It is fully usable standalone.

---

## Architecture

- **SQLite** is the authoritative data store (identity, relationships, versions, provenance, search metadata)
- **Obsidian vault** is the editable view/projection layer (markdown browsing, editing, dashboards)
- **MCP** is the agent access layer for Codex, Claude Code, and similar tools
- **CLI** is the local operator surface (`setup`, `doctor`, `ingest`, `vault-sync`, `project-init`, `risk-matrix`)

---

## Tech Stack

- Runtime: **Bun**
- Language: TypeScript (strict, ESNext modules)
- Database: SQLite (via `bun:sqlite`)
- No external framework dependencies

---

## Code Conventions

- All source in `src/`
- Commands in `src/commands/`, each command exports a single `run*` function
- Core modules in `src/core/` (db, config, schema, types)
- All entity IDs are UUID strings
- All timestamps are ISO 8601 text
- SQL schema in `src/core/schema.sql` — single file, append-only migrations

---

## CLI Surface

```
pmbrain setup            # Initialize config + SQLite schema
pmbrain doctor           # Health check
pmbrain stats            # Database counts
pmbrain project-init     # Create project records
pmbrain risk-matrix      # Query risk matrix
pmbrain ingest           # Ingest source material (planned)
pmbrain vault-sync       # Sync to Obsidian vault (planned)
pmbrain serve            # Start MCP server (planned)
```

---

## Data Model

Base tables (from gbrain patterns):
- `pages`, `content_chunks`, `links`, `tags`, `page_tags`
- `timeline_entries`, `page_versions`, `raw_data`, `ingest_log`
- `config`, `files`, `vault_sync_state`

PM extensions:
- `projects`, `risks`

---

## Build & Dev

```bash
bun install
bun run dev -- setup
bun run dev -- doctor
bun run check    # tsc --noEmit
```

---

## Integration with SwissArmyPM

When used together, SwissArmyPM calls PMBrain through its SDK exports or CLI bridge.
PMBrain never imports from SwissArmyPM. Dependency is strictly one-directional.

---

## Documentation Priority

1. `/CLAUDE.md` (monorepo root)
2. This file
3. `docs/architecture.md`
4. `/docs/PMBOK-GBRAIN-GUIDELINE.md`
