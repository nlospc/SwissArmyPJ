# PMBrain Architecture

## Core Positioning

PMBrain is a PM-domain knowledge brain.

It is designed to:
- ingest meetings, emails, calendars, voice, and artifacts
- normalize them into typed PM records
- persist them in SQLite
- project them into an Obsidian vault
- expose structured tools through MCP

## Source of Truth

`SQLite` is authoritative.

The database owns:
- entity identity
- relationships
- versions
- raw source provenance
- ingest logs
- sync state
- search metadata

## Projection Layer

`Obsidian` is the editable view layer.

The vault is used for:
- human browsing
- markdown editing
- dashboards and portfolio views
- agent compatibility via markdown when MCP is not available

## Access Layer

`MCP` exposes high-value PM operations such as:
- project status
- project initialization
- risk matrix queries
- page get/upsert
- vault sync
- search

## CLI Surface

The CLI is the operational entrypoint.

Initial commands:
- `setup`
- `doctor`
- `stats`
- `serve`
- `project-init`
- `risk-matrix`
- `vault-sync`

## Data Model

Base tables adapted from gbrain patterns:
- `pages`
- `content_chunks`
- `links`
- `tags`
- `page_tags`
- `timeline_entries`
- `page_versions`
- `raw_data`
- `ingest_log`
- `config`
- `files`
- `vault_sync_state`

Initial PM extensions:
- `projects`
- `risks`

## Build Order

1. bootstrap config + schema + setup flow
2. page CRUD + versioning + sync state
3. FTS search + chunking
4. PM tables + project workflows
5. vault export/import
6. MCP surface
7. source connectors

## Reuse Strategy

Reuse from gbrain at the pattern level:
- generic page abstraction
- chunk/search/versioning shape
- MCP mirroring of operations
- raw source preservation
- ingest logging

Rewrite for PMBrain:
- PM entity model
- vault projection contract
- inbox and source connectors
- PM-oriented command surface
