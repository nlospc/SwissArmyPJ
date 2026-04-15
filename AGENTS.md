# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Repository Overview

This is a **monorepo** containing two independent but complementary packages:

| Package | Directory | Purpose |
|---------|-----------|---------|
| **SwissArmyPM** | `packages/swissarmypm/` | Electron + React + Vite desktop workbench for project managers |
| **PMBrain** | `packages/pmbrain/` | Bun + TypeScript CLI knowledge brain with SQLite, Obsidian vault, MCP |

### Workspace Setup

```bash
# From repo root
npm install              # Install all workspace dependencies
npm run dev:swissarmypm  # Start Electron app dev server
npm run dev:pmbrain      # Run PMBrain CLI
npm run build:swissarmypm
npm run build:pmbrain
```

## SwissArmyPM (`packages/swissarmypm/`)

**Tech Stack:** Electron + React 19 + TypeScript + Vite + Zustand + Ant Design + SQLite (better-sqlite3)

**Commands:**
```bash
npm run dev          # Start Vite dev server + Electron
npm run build        # Production build
npm run type-check   # TypeScript type checking
```

**Directory Structure:**
```
packages/swissarmypm/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Entry point
│   │   ├── database/      # SQLite schema + migrations
│   │   └── ipc/           # IPC command handlers
│   ├── renderer/          # React frontend
│   │   ├── components/    # UI components
│   │   ├── features/      # Feature modules
│   │   ├── stores/        # Zustand stores
│   │   ├── pages/         # Page components
│   │   └── App.tsx
│   ├── preload/           # Electron preload
│   └── shared/            # Shared types
├── design/                # UI prototypes (reference only)
├── scripts/               # Build/utility scripts
├── vite.config.ts
├── tsconfig.json
└── tsconfig.main.json
```

**Path Aliases:**
- `@/*` → `./src/renderer/*`
- `@/shared/*` → `./src/shared/*`

**IPC Pattern:**
```
React Component → Zustand store → invoke('command', args) → IPC handler → SQLite
```

**Key Principles:**
1. Local-first, always-capable (works offline)
2. Human-in-the-loop (AI suggests, humans confirm)
3. Auditable (all changes logged)
4. PM Workspace is the product center (not Portfolio/Inbox/My Work)

## PMBrain (`packages/pmbrain/`)

**Tech Stack:** Bun + TypeScript + SQLite (bun:sqlite)

**Commands:**
```bash
bun run dev -- setup          # Initialize config + schema
bun run dev -- doctor         # Health check
bun run dev -- stats          # DB counts
bun run dev -- project-init   # Create project
bun run dev -- risk-matrix    # Query risks
bun run check                 # tsc --noEmit
```

**Architecture:**
- SQLite = source of truth (pages, chunks, links, tags, versions, raw_data)
- Obsidian vault = projection layer (markdown view/edit)
- MCP = agent access layer
- CLI = operator surface

**Key Files:**
- `src/core/schema.sql` — Database schema
- `src/core/db.ts` — Database bootstrap
- `src/core/types.ts` — Type definitions
- `src/cli.ts` — CLI entrypoint
- `src/sdk/index.ts` — SDK exports for programmatic use

## Shared Documentation

Cross-project docs live in the repo root `docs/`:
- `docs/PMBOK-GBRAIN-GUIDELINE.md` — Shared product guideline
- `docs/PRD/` — Product Requirements Documents
- `docs/MEMORY.md` — Current consensus

## Key Rules

1. **PMBrain does not depend on SwissArmyPM** — dependency is strictly one-directional
2. **SwissArmyPM declares `pmbrain` as optional dependency** — no hard coupling
3. **Each package has its own `tsconfig.json`** — incompatible compiler options (React vs Bun)
4. **Follow CLAUDE.md hierarchy** — root CLAUDE.md > sub-project CLAUDE.md > docs/
5. **All SQL uses parameterized queries** — no string interpolation
6. **Audit all data changes** — audit_log for SwissArmyPM, ingest_log for PMBrain
7. **Component PascalCase, hooks camelCase with `use` prefix, stores camelCase with `use` prefix**
