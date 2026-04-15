# PMBrain

PMBrain is a local-first project management brain.

It is built around four layers:
- `SQLite` as the source of truth for structured records, provenance, sync state, and search metadata
- `Obsidian vault` as the human-readable projection layer
- `MCP` as the agent access layer for Codex, Claude Code, OpenClaw, Hermes, and similar tools
- `CLI` as the local operator surface for setup, ingest, sync, and PM workflows

## Status

This repository currently contains the first working backend skeleton:
- TypeScript CLI entrypoint
- executable SQLite bootstrap
- core config helpers
- real command wiring for `setup`, `doctor`, `stats`, `project-init`, and `risk-matrix`
- stub command wiring for `serve` and `vault-sync`
- architecture documentation

## Planned Capabilities

- ingest meeting notes, emails, calendars, voice memos, and project artifacts
- store canonical PM entities in SQLite
- support keyword, vector, and hybrid search with citations
- dual-write structured pages into an Obsidian vault
- expose structured PM tools through MCP

## Architecture

- `src/cli.ts` wires top-level commands
- `src/core/schema.sql` defines the first database schema
- `src/core/db.ts` bootstraps and queries the local SQLite database
- `src/commands/` contains command handlers
- `docs/architecture.md` captures the system design

## Development

```bash
bun install
bun run dev -- setup
bun run dev -- doctor
bun run dev -- project-init PMBRAIN "First Project"
bun run dev -- risk-matrix
```

## Notes

This repository root is the real PMBrain system root.
The current milestone is database bootstrap plus first write/read command flow.
