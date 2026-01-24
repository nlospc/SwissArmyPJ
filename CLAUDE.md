# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SwissArmyPM is a lightweight desktop project management tool with AI integration, built with Electron, React, TypeScript, and SQLite. The project is organized in three phases:
- **Phase 1**: Foundation + Gantt Chart (current - implemented)
- **Phase 2**: Members & Budget (planned - DB schema ready)
- **Phase 3**: AI Integration (planned - DB schema ready)

## Common Commands

All commands should be run from the `code/` directory:

```bash
cd code

# Development
npm run dev          # Start Electron with hot reload

# Building
npm run build        # Build for production (creates release/ directory)
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## Architecture Overview

### Electron Process Architecture

The application follows a standard Electron multi-process architecture:

**Main Process** (`src/main/`):
- Entry point: `src/main/index.ts`
- Services layer: `src/main/services/` (business logic for projects, work packages, gantt, dependencies)
- IPC handlers: `src/main/ipc/handlers.ts` (registers all IPC channels)
- Database: `src/main/db/schema.ts` (SQLite singleton)

**Renderer Process** (`src/renderer/`):
- React application with TypeScript
- Entry: `src/renderer/main.tsx`
- Main UI: `App.tsx`, `ProjectList.tsx`, `GanttChart.tsx`, `WorkPackageList.tsx`, `InboxPage.tsx`, `SearchPage.tsx`, `SettingsPage.tsx`
- Form components: `src/renderer/components/` (Modal.tsx, ProjectForm.tsx, WorkPackageForm.tsx)

**Preload Script** (`src/preload/index.ts`):
- Secure bridge using `contextBridge` to expose limited API to renderer
- Exposes `window.electronAPI` with namespaced methods (project, workPackage, dependency, gantt)
- Maintains security with `contextIsolation` enabled

### Key Architectural Pattern: Dual State Management

The renderer uses **two separate Zustand stores** for different concerns:

1. **Main Store** (`src/renderer/store.ts`):
   - Application-wide state: projects, work packages, current project selection
   - Backend CRUD operations that persist to database
   - Local state synchronization methods (e.g., `updateProjectLocal`, `addWorkPackage`)
   - Pattern: Each CRUD action has both a backend version (async IPC call) and local version (sync state update)

2. **Gantt Store** (`src/renderer/stores/useGanttStore.ts`):
   - Gantt-specific UI state: timeline navigation, task selection, hierarchy expansion
   - Zoom levels and view configuration
   - Does NOT persist to database (transient UI state only)

### Type Safety Across Process Boundaries

**Shared Types** (`src/shared/types.ts`):
- All IPC communication uses types from `@shared/types`
- Every IPC channel returns `ApiResponse<T>` wrapper with `{ success, data?, error? }`
- IPC channels are typed as `IPCChannel` union type for compile-time safety

### IPC Communication Pattern

IPC handlers are organized by domain and follow a consistent pattern:

```
domain:action        → Maps to handlers in src/main/ipc/handlers.ts
                     → Exposed via window.electronAPI.{domain}.{action}
```

Example flow:
1. Renderer calls: `await window.electronAPI.workPackage.getByProject(projectId)`
2. Preload forwards to: `ipcRenderer.invoke('workPackage:getByProject', projectId)`
3. Main process handler in `src/main/ipc/handlers.ts` executes
4. Service layer in `src/main/services/workpackage.service.ts` handles business logic
5. Response wrapped as `ApiResponse<WorkPackage[]>` returned to renderer

### Database Schema

SQLite database (better-sqlite3) stored in platform-specific user data directory.

Key tables:
- `projects` - Project records
- `work_packages` - Hierarchical tasks (parent_id for sub-tasks)
- `dependencies` - Four types: finish_to_start, start_to_start, finish_to_finish, start_to_finish
- `gantt_views` - Saved Gantt configurations with filters, grouping, sorting
- Phase 2 (planned): `members`, `assignments`
- Phase 3 (planned): `inbox_files`, `ai_proposals`, `ai_providers`

Database is initialized as singleton in `src/main/db/schema.ts`. Foreign keys enabled. Indexes on foreign keys for performance.

## Import Aliases

Path resolution configured in `vite.config.ts`:
- `@/` → `src/renderer/` (renderer process only)
- `@shared/` → `src/shared/` (both main and renderer)

## Adding New Features

When adding features that span multiple files:

1. **Update types** in `src/shared/types.ts` first
2. **Add service** in `src/main/services/{domain}.service.ts`
3. **Register IPC handler** in `src/main/ipc/handlers.ts`
4. **Expose in preload** in `src/preload/index.ts` (add to `electronAPI` object)
5. **Update renderer store** in `src/renderer/store.ts` or create domain-specific store
6. **Create/update UI components** in `src/renderer/`

## Gantt Chart Implementation

The Gantt chart is a core feature with specific implementation details:

**State Management**: Uses dedicated `useGanttStore.ts` for UI state (zoom, selection, expansion)

**Critical Path Calculation**: Computed in `gantt.service.ts` using forward/backward pass algorithm

**Task Hierarchy**: Work packages support nested structure via `parent_id` - rendered as collapsible tree in Gantt

**Drag & Drop**: Interactive date adjustment calls `gantt:updateTaskDates` IPC handler

**Dependencies**: Visualized as SVG arrows between task bars, stored in `dependencies` table

**Zoom Levels**: Four levels (day, week, month, quarter) affect timeline rendering in `GanttChart.tsx`

## Development Notes

- ESLint is configured with relaxed rules for rapid development (`no-explicit-any: off`, `no-unused-vars: off`)
- No existing Cursor rules or Copilot instructions to incorporate
- Database migrations are not implemented - schema changes require manual database deletion for now
- CSV import uses `csv-parse` library - see `workpackage.service.ts` for import logic
