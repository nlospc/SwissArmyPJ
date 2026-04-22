# CLAUDE.md — SwissArmyPM Desktop

This file provides desktop-specific guidelines for the **SwissArmyPM Electron app**.

**Global product direction** is defined in the root [`../../CLAUDE.md`](../../CLAUDE.md).
If this file conflicts with the root, the root wins.

---

## Overview

SwissArmyPM Desktop is an **Electron + React + Vite** desktop workbench for project managers.
It provides a local-first, offline-capable UI for managing projects, stakeholders, timelines, risks, work packages, and evidence.

- **Runtime:** Electron 29+
- **Frontend:** React 19 + TypeScript + Zustand + Ant Design v5
- **Build:** Vite 6 with `vite-plugin-electron`
- **Database:** SQLite via `better-sqlite3` (synchronous, in main process)
- **Styling:** Tailwind CSS + Ant Design

---

## Commands

```bash
npm run dev          # Start Vite dev server + Electron
npm run build        # Production build
npm run type-check   # TypeScript type checking (tsc -b -f)
```

---

## Architecture

### Three-Layer Architecture

```
┌─────────────────────────────────────────┐
│   RENDERER (React + TypeScript)         │
│   UI components, Zustand stores         │
└──────────────┬──────────────────────────┘
               │ IPC (contextBridge)
┌──────────────▼──────────────────────────┐
│   MAIN PROCESS (Electron)               │
│   Database | IPC Handlers | Services    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   DATA (SQLite via better-sqlite3)      │
│   Projects | Work Items | Audit Log     │
└─────────────────────────────────────────┘
```

### Agent-Oriented Architecture Rule

When doing architecture or file-organization work, load `.claude/skills/architecture-agent.md` first.

SwissArmyPM follows a retrieval-oriented architecture rule for agent coding:

- Do not split files by line count alone
- Prefer keeping methods of the same domain problem in the same retrieval unit
- A file may be large if it still represents one coherent runtime + domain + change reason
- Split only when a real boundary appears: runtime, domain, lifecycle, dependency direction, or public contract
- Avoid one-method-per-file and premature helper fragmentation

In short: optimize for low-noise retrieval and stable modification, not for visually small files.

### Directory Structure

```
packages/swissarmypm/
├── src/
│   ├── main/                # Electron main process
│   │   ├── index.ts         # Entry point, window creation
│   │   ├── database/        # SQLite schema and migrations
│   │   └── ipc/             # IPC command handlers
│   ├── preload/             # Preload scripts (contextBridge)
│   ├── renderer/            # React frontend
│   │   ├── components/      # UI components (gantt, portfolio, etc.)
│   │   ├── features/        # Feature modules (my-work, inbox, etc.)
│   │   ├── stores/          # Zustand state management
│   │   ├── config/          # Theme and configuration
│   │   └── App.tsx          # Root React component
│   └── shared/              # Shared types between main & renderer
│       └── types/
├── design/                  # Living prototype & component library (UI reference only)
├── scripts/                 # DB migration utilities
├── vite.config.ts
├── tsconfig.json            # Renderer config (react-jsx, bundler)
├── tsconfig.main.json       # Main process config
├── index.html               # HTML entry pointing to /src/renderer/main.tsx
├── tailwind.config.js
└── postcss.config.js
```

---

## Vite Configuration

The `vite.config.ts` configures three build targets:

```typescript
// Electron entries configured via vite-plugin-electron:
// 1. Main process:  src/main/index.ts    → dist/main/
// 2. Preload:       src/preload/index.ts → dist/preload/
// 3. Renderer:      Vite default (index.html → dist/renderer/)
```

### Path Aliases

```typescript
// Configured in vite.config.ts resolve.alias:
'@/shared'  →  ./src/shared     // Shared types
'@'         →  ./src/renderer   // Renderer source
```

**Usage:**
```typescript
import { Project } from '@/shared/types';   // ✓ Correct
import { Project } from '../../shared/types'; // Avoid
```

### External Dependencies

The main process build externals:
- `better-sqlite3` — native module, cannot be bundled
- `electron-devtools-installer`

---

## IPC Patterns

### Handler Pattern (Main Process)

```typescript
// src/main/ipc/handlers.ts
ipcMain.handle('command:name', async (event, args) => {
  try {
    // Validate input
    // Execute business logic
    // Return result
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

### Renderer → Main Flow

```
React Component
  → Zustand store (check cache)
    → window.electronAPI.invoke('command_name', args)
      → IPC handler in src/main/ipc/
        → SQLite query
          → Return result
    → Store update (cache)
      → Component re-render
```

### Optimistic Update Pattern

```
User Action
  → Zustand: apply optimistic update (immediate UI)
    → invoke('update_command', args)
      → IPC handler (validate + execute)
        → SQLite transaction + audit log
          → Success/Error
    → Zustand: confirm or rollback
      → Component re-render with final state
```

---

## State Management (Zustand)

Stores are organized by domain in `src/renderer/stores/`:

```typescript
useProjectStore      // Project list & detail
useInboxStore        // Inbox workflow state
useDashboardStore    // Dashboard aggregates
useTimelineStore     // Timeline/Gantt state
useMyWorkStore       // My Work & time tracking
useUIStore           // Global UI state (theme, sidebar, etc.)
```

**Pattern:**
1. Update store immediately (optimistic)
2. Call backend via IPC
3. On success: confirm update
4. On error: rollback to previous state

---

## Design System

The `design/` folder is a **living prototype and component library**, NOT production code.

- **`design/`**: Fully functional UI demo using IndexedDB. Used for UI/UX iteration and reference.
- **`src/`**: Production architecture with Electron + SQLite backend.

When implementing features:
1. Reference `design/` for UI patterns and component usage
2. Implement business logic in `src/renderer/features/`
3. Never directly copy IndexedDB logic from `design/lib/storage.ts` — it's demo-only

---

## Database (SQLite)

- **Schema:** `src/main/database/schema.ts`
- **Migrations:** `src/main/database/migrationRunner.ts`
- **Engine:** `better-sqlite3` (synchronous, in main process)

Key tables: `portfolios`, `projects`, `work_items`, `inbox_items`, `todos`, `time_logs`, `pomodoro_sessions`, `user_preferences`, `audit_log`, `settings`

### Migration Scripts

```bash
npm run migrate           # Run pending migrations
npm run migrate:status    # Check migration status
npm run migrate:rollback  # Rollback last migration
```

---

## File Naming Conventions

- **Components:** PascalCase (e.g., `InboxContainer.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useInbox.ts`)
- **Stores:** camelCase with `use` prefix (e.g., `useProjectStore.ts`)
- **Utils:** camelCase (e.g., `dateUtils.ts`)
- **Types:** PascalCase for interfaces/types in `shared/types/index.ts`

---

## Security

- Context isolation enabled in Electron (no node integration)
- Parameterized SQL queries only
- No API keys in config files (use OS keychain when needed)
- Audit all data changes in `audit_log` table

---

## Shared Documentation

Cross-project documentation lives in the shared `docs/` directory at the monorepo root:

- **PMBOK + GBrain guideline:** `../../docs/PMBOK-GBRAIN-GUIDELINE.md`
- **PRDs:** `../../docs/PRD/`
- **Architecture:** `../../docs/architecture/`
- **Memory/consensus:** `../../docs/MEMORY.md`
