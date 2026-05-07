# Architecture

## Target Shape

```text
Sources
  meeting notes / email / IM snippets / Excel / Word / PDF / manual notes

PMBrain
  SQLite source of truth
  ingest logs
  content chunks
  source links
  PM entities
  fact assertions
  change proposals
  MCP tools
  CLI operations
  Obsidian projection

SwissArmyPM Web
  local web app
  typed PMBrain client
  project workspace
  confirmation workflows
  traceability views
  export surfaces

Optional Shell
  Electron or Tauri wrapper after contracts stabilize
```

## Source Of Truth

PMBrain SQLite is authoritative for:

- entity identity
- relationships
- schema versions
- evidence metadata
- content hashes
- source links
- ingest logs
- fact assertions
- change proposals
- PM confirmation decisions

Obsidian is a projection and editing surface. Direct markdown edits must be reconciled through explicit sync or proposals, not silently treated as canonical truth.

SwissArmyPM Web should not create a second independent domain database.

## PMBrain Responsibilities

- Initialize and migrate the local database
- Import and hash evidence
- Chunk source material
- Maintain PM entities and source links
- Expose CLI and MCP tools
- Generate Obsidian projection files
- Store candidate AI outputs as proposals, not confirmed facts

## SwissArmyPM Web Responsibilities

- Render the PM Workspace
- Let the PM confirm or reject proposals
- Edit core PM entities through typed contracts
- Show source-backed answers
- Provide high-density operational screens
- Run local browser-based visual verification

## Deferred Decisions

- Whether final packaging uses Electron or Tauri
- Whether SwissArmyPM Web uses plain Vite or a local Next-style app
- Which AI adapters are first-class
- Which Figma design library is canonical
