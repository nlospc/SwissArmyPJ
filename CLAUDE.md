# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SwissArmyPM** is a local-first desktop project management tool for IT project managers. The app enables 30-second context recovery with a unified dashboard, offline-capable operation, and AI-optional workflows with human-in-the-loop confirmation.

**Tech Stack:**
- **App Shell:** Electron (transitioning to Tauri v2)
- **Frontend:** React 18 + TypeScript + Zustand
- **Database:** SQLite via better-sqlite3
- **Build:** Vite
- **UI Components:** Shadcn/ui-derived library (50+ components)

## Commands

### Development
```bash
npm run dev          # Start Vite dev server + Electron
npm run build        # Production build
npm run type-check   # TypeScript type checking
```

### Build Output
- `dist/main/` - Compiled Electron main process
- `dist/renderer/` - Compiled React frontend

## Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────┐
│   PRESENTATION (React + TypeScript)     │
│   Inbox | Timeline | Dashboard          │
└──────────────┬──────────────────────────┘
               │ IPC (Tauri commands)
┌──────────────▼──────────────────────────┐
│   APPLICATION (Electron/Tauri)          │
│   Database | IPC Handlers | Services    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   DATA (SQLite)                         │
│   Portfolios | Projects | Items | Audit │
└─────────────────────────────────────────┘
```

### Directory Structure

```
SwissArmyPM/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Entry point, window creation
│   │   ├── database/      # SQLite schema and migrations
│   │   └── ipc/           # IPC command handlers
│   ├── renderer/          # React frontend (in development)
│   └── shared/            # Shared types between main & renderer
│       └── types/
├── design/                # Living prototype & component library
│   ├── components/        # UI components (Figma-generated + custom)
│   │   ├── ui/           # Base UI library (50+ Shadcn/ui components)
│   │   ├── InboxView.tsx
│   │   ├── TimelineView.tsx
│   │   └── PortfolioDashboard.tsx
│   ├── pages/            # Page-level components
│   ├── lib/              # Utilities (IndexedDB abstraction for demo)
│   └── styles/           # Global styles
├── docs/
│   ├── PRD/              # Product Requirements Documents
│   │   ├── PRD-001-Master.md
│   │   ├── PRD-002-DataModel.md
│   │   ├── PRD-003-Inbox.md
│   │   └── [more PRDs...]
│   └── architecture/     # Technical architecture docs
└── templates/            # App templates
```

### Data Model Hierarchy

```
Portfolio (1 → many)
  └── Project (1 → many)
      ├── Task (1 → many)
      │   └── Sub-Task (one level only)
      ├── Issue
      │   └── Sub-Issue
      └── Milestone

Dependencies: Predecessor → Successor (FS/SS/FF types)
```

## Key Architectural Patterns

### 1. Design System vs Production Code

**IMPORTANT:** The `design/` folder is a **living prototype and component library**, NOT the production codebase.

- **design/**: Fully functional UI demo using IndexedDB. Used for UI/UX iteration and as a reference implementation.
- **src/**: Production architecture with Electron + SQLite backend.

When implementing features:
1. Reference `design/` for UI patterns and component usage
2. Implement business logic in `src/renderer/features/`
3. Never directly copy IndexedDB logic from `design/lib/storage.ts` - it's demo-only

### 2. IPC Data Flow Pattern

**Read Flow:**
```
React Component
  → Zustand store (check cache)
    → invoke('command_name', args)
      → IPC handler in src/main/ipc/handlers.ts
        → SQLite query
          → Return result
    → Store update (cache)
      → Component re-render
```

**Write Flow (Optimistic Updates):**
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

### 3. State Management with Zustand

Zustand manages **client-side state** (UI state, caching, optimistic updates):

```typescript
// Stores are organized by domain
useProjectStore      // Project list & detail
useInboxStore        // Inbox workflow state
useDashboardStore    // Dashboard aggregates
useTimelineStore     // Timeline/Gantt state
useUIStore           // Global UI state (theme, sidebar, etc.)
```

**Pattern:**
1. Update store immediately (optimistic)
2. Call backend via IPC
3. On success: confirm update
4. On error: rollback to previous state

### 4. Component Organization (Planned for src/renderer)

```
src/renderer/
├── components/
│   ├── ui/              # Base UI library (from design/components/ui)
│   │   ├── button.tsx   # DO NOT manually edit
│   │   ├── dialog.tsx   # Generated from Figma
│   │   └── [50+ more]
│   └── common/          # Shared business components
├── features/            # Feature modules (containers + logic)
│   ├── inbox/
│   │   ├── InboxContainer.tsx
│   │   ├── useInbox.ts
│   │   └── inboxActions.ts
│   ├── timeline/
│   ├── dashboard/
│   └── [more features]
├── stores/              # Zustand stores
├── hooks/               # Custom React hooks
├── lib/                 # Utilities, IPC wrappers
└── App.tsx
```

**Rule:** Business logic goes in `features/`, not `components/ui/`.

## Core Principles (From PRD-001)

1. **Local-First, Always-Capable** - Works offline; SQLite/CSV storage
2. **Human-in-the-Loop** - AI suggests, humans confirm (never auto-apply)
3. **30-Second Context Recovery** - Dashboard shows full status instantly
4. **Auditable & Governable** - All changes logged with source tracking
5. **Interoperability Over Lock-In** - CSV/MSP import/export as first-class features

## Database Schema (SQLite)

**Current Implementation:** `src/main/database/schema.ts`

**Planned Schema (from PRD-002):**
```sql
-- Core entities
portfolios          # Portfolio container
projects            # Projects with portfolio_id FK
items               # Tasks, issues, milestones (hierarchical with parent_id)
custom_fields       # Extensible custom field storage
dependencies        # Task dependencies (FS, SS, FF types)
audit_log           # Change tracking (who, what, when, why)
file_index          # Filesystem sync metadata

-- Indexes
idx_projects_portfolio
idx_items_project
idx_items_parent
idx_custom_fields_entity
idx_dependencies_*

-- Full-text search
items_fts (FTS5)
```

## Key Integration Points

### Inbox Workflow (3-Step Process)
**Reference:** `design/pages/InboxPage.tsx`

1. **Classify:** Select entity type (Project or WorkItem)
2. **Extract:** Auto-populate fields using heuristics (regex patterns for dates, status keywords)
3. **Review:** Show diff before committing to database

**Backend Commands Needed:**
- `inbox:process` - Process inbox item
- Auto-extraction logic for dates, priorities, assignments

### Timeline/Gantt View
**Reference:** `design/components/TimelineView.tsx`

- Uses `vis-timeline` library
- Table-based task rows with date bars
- Zoom, filter, export controls
- Dependency visualization

**Backend Commands Needed:**
- `timeline:getItems` - Fetch items with date ranges
- Dependency resolution
- Critical path calculation

### Portfolio Dashboard
**Reference:** `design/components/PortfolioDashboard.tsx`

- Portfolio aggregates (status, budget, schedule health)
- Project cards with metrics
- Change feed (recent updates)

**Backend Commands Needed:**
- `dashboard:getPortfolioSummary`
- `dashboard:getChangeFeed`

## Path Alias

TypeScript path alias `@/*` maps to `./src/*`:

```typescript
import { Project } from '@/shared/types';  // ✓ Correct
import { Project } from '../../shared/types';  // Avoid
```

## Migration Path (Electron → Tauri)

**Current:** Electron + better-sqlite3 (synchronous DB)
**Future:** Tauri v2 + sqlx + tokio (async/await, type-safe SQL)

When implementing new features:
- Follow current Electron patterns for now
- Write IPC handlers in `src/main/ipc/handlers.ts`
- Use async/await for future Tauri compatibility
- Avoid Electron-specific APIs where possible

## Important Documentation

### Must-Read PRDs
- **PRD-001-Master.md** - Overall vision, core principles, target users
- **PRD-002-DataModel.md** - Database schema, entity relationships
- **PRD-003-Inbox.md** - Inbox workflow specification
- **PRD-005-Timeline.md** - Timeline/Gantt requirements
- **PRD-006-Dashboard.md** - Portfolio dashboard spec
- **PRD-008-Governance.md** - Audit trail requirements

### Architecture References
- **docs/architecture/ARCHITECTURE.md** - High-level technical architecture
- **docs/architecture/component-map.md** - Container → Store mapping
- **docs/architecture/data-model.md** - Entity relationships

## Development Guidelines

### When Adding Features

1. **Read the PRD first** - Check `docs/PRD/` for feature specifications
2. **Reference design/** - Use as UI/UX reference, not production code
3. **Update audit_log** - Log all data changes with source tracking
4. **Follow optimistic update pattern** - UI feels fast, backend confirms
5. **Use parameterized queries** - Prevent SQL injection
6. **Add TypeScript types to shared/types/** - Keep types synchronized

### IPC Handler Pattern

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

### Zustand Store Pattern

```typescript
// src/renderer/stores/useProjectStore.ts
interface ProjectState {
  projects: Map<string, Project>;
  loading: boolean;
  error: string | null;

  // Actions
  fetchProjects: () => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: new Map(),
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true });
    const result = await invoke('projects:getAll');
    if (result.success) {
      set({ projects: new Map(result.data.map(p => [p.id, p])), loading: false });
    } else {
      set({ error: result.error, loading: false });
    }
  },

  updateProject: async (id, updates) => {
    // Optimistic update
    const current = get().projects.get(id);
    const updated = { ...current, ...updates };
    set(state => {
      const newProjects = new Map(state.projects);
      newProjects.set(id, updated);
      return { projects: newProjects };
    });

    // Backend call
    const result = await invoke('projects:update', { id, updates });
    if (!result.success) {
      // Rollback on error
      set(state => {
        const newProjects = new Map(state.projects);
        newProjects.set(id, current);
        return { projects: newProjects, error: result.error };
      });
    }
  },
}));
```

## File Naming Conventions

- **Components:** PascalCase (e.g., `InboxContainer.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useInbox.ts`)
- **Stores:** camelCase with `use` prefix (e.g., `useProjectStore.ts`)
- **Utils:** camelCase (e.g., `dateUtils.ts`)
- **Types:** PascalCase for interfaces/types in `shared/types/index.ts`

## Testing

**Status:** No testing framework configured yet.

**Planned:** Vitest for unit tests, Playwright for E2E (per PRD-001).

## Security Considerations

- Context isolation enabled in Electron (no node integration)
- Parameterized SQL queries only
- No API keys in config files (use OS keychain when needed)
- Audit all data changes in `audit_log` table

## Current Project Status

**Maturity:** Early development

**Backend:** Basic SQLite schema + IPC handlers (skeleton)
**Frontend:** Design system + prototype complete (IndexedDB-based demo)
**Integration:** Not yet connected (separate build outputs)

**Next Steps:**
1. Complete SQLite schema implementation
2. Implement core IPC handlers (projects, items, dashboard)
3. Build production renderer using design/ as reference
4. Connect Zustand stores to IPC layer
5. Migrate from Electron to Tauri v2
