# AGENTS.md

PMBrain is the local-first PM data kernel.

## Responsibilities

- SQLite source of truth
- CLI operations
- MCP tools
- Obsidian projection
- evidence ingest
- schema and migrations
- source links
- fact assertions
- change proposals

## Technical Rules

- Runtime: Bun
- Language: TypeScript
- Database: SQLite via `bun:sqlite`
- Keep PMBrain standalone.
- PMBrain must not import from SwissArmyPM Web or any desktop shell.
- Use parameterized SQL.
- Store timestamps as ISO 8601 text.
- Use UUID strings for durable entity IDs.

## Commands

```bash
npm run dev --workspace pmbrain
npm run check --workspace pmbrain
```

## AI Boundary

AI may propose facts and changes. Confirmed project truth requires explicit PM confirmation.
