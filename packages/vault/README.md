# PMBrain Obsidian Vault

This vault replaces the temporary Notion MVP connector. PMBrain should be
maintained locally through SQLite plus Markdown projection, with Obsidian as the
human-facing editing and review workspace.

## Required Obsidian Setup

1. Open this directory in Obsidian.
2. Review `Welcome Board.md`.
3. Install the recommended community plugins listed there.
4. Keep PMBrain IDs in YAML frontmatter when syncing generated notes.

## Sync Contract

- PMBrain SQLite is the source of truth.
- Obsidian Markdown is the editable projection layer.
- Notion pages/databases created during the MVP experiment are deprecated and
  should not be used as PMBrain connectors.
- Agent sync should read/write this vault and PMBrain SQLite, then record data
  changes in PMBrain ingest/audit tables.
