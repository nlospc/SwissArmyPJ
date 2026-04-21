# ARCH-001: Technical Architecture Document

| Field | Value |
|-------|-------|
| **DOC ID** | ARCH-001 |
| **Parent** | @PRD-001-Master.md |
| **Status** | Draft |
| **Date** | 2026-01-30 |

---

## 1. Overview

This document describes the technical architecture for SwissArmyPM, a local-first desktop application built with Tauri, React, and SQLite.

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| App Shell | Tauri | v2.x | Desktop app framework |
| Frontend | React | 18.x | UI components |
| Language (FE) | TypeScript | 5.x | Type safety |
| State | Zustand | 4.x | Client state management |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| Backend | Rust | 1.75+ | Business logic, data access |
| Database | SQLite | 3.x | Local persistence |
| ORM/Query | sqlx | 0.7+ | Type-safe SQL |
| File Watch | notify-rs | 6.x | Filesystem events |
| Keychain | keyring | 2.x | Secure credential storage |
| PDF | printpdf | 0.6+ | PDF generation |

---

## 3. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                USER INTERFACE                                   │
│                                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │ Inbox   │  │Timeline │  │Dashboard│  │Settings │  │ Reports │              │
│  │ View    │  │ /Gantt  │  │         │  │         │  │         │              │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘              │
│       │            │            │            │            │                    │
│  ┌────┴────────────┴────────────┴────────────┴────────────┴────┐              │
│  │                    React Components                          │              │
│  │                    (TypeScript + Tailwind)                   │              │
│  └────────────────────────────┬─────────────────────────────────┘              │
│                               │                                                 │
│  ┌────────────────────────────┴─────────────────────────────────┐              │
│  │                    Zustand State Store                        │              │
│  │   • UI State    • Cached Data    • Optimistic Updates        │              │
│  └────────────────────────────┬─────────────────────────────────┘              │
│                               │                                                 │
└───────────────────────────────┼─────────────────────────────────────────────────┘
                                │ Tauri IPC (invoke)
┌───────────────────────────────┼─────────────────────────────────────────────────┐
│                               ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    TAURI COMMAND LAYER (Rust)                           │   │
│  │                                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │ Portfolio   │  │  Project    │  │    Item     │  │   Inbox     │    │   │
│  │  │ Commands    │  │  Commands   │  │  Commands   │  │  Commands   │    │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │   │
│  │         │                │                │                │            │   │
│  │  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐    │   │
│  │  │                    Service Layer                               │    │   │
│  │  │  • PortfolioService   • ReportService   • SyncService         │    │   │
│  │  │  • ProjectService     • AuditService    • AIService           │    │   │
│  │  └────────────────────────────┬───────────────────────────────────┘    │   │
│  │                               │                                         │   │
│  │  ┌────────────────────────────┴───────────────────────────────────┐    │   │
│  │  │                    Repository Layer                            │    │   │
│  │  │  • PortfolioRepo   • ItemRepo   • AuditRepo   • FileIndexRepo │    │   │
│  │  └────────────────────────────┬───────────────────────────────────┘    │   │
│  │                               │                                         │   │
│  └───────────────────────────────┼─────────────────────────────────────────┘   │
│                                  │                                              │
│  ┌───────────────────────────────┼─────────────────────────────────────────┐   │
│  │                               ▼                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                      SQLite Database                            │   │   │
│  │  │                                                                 │   │   │
│  │  │   portfolios │ projects │ items │ audit_log │ file_index       │   │   │
│  │  │                                                                 │   │   │
│  │  │   FTS5 Virtual Tables (items_fts)                              │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │                          DATA LAYER                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      BACKGROUND SERVICES                                │   │
│  │                                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │   │
│  │  │ File Watcher│  │   Sync      │  │  Scheduler  │                     │   │
│  │  │ (notify-rs) │  │   Engine    │  │  (tokio)    │                     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                     │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│                              RUST BACKEND                                       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│  Filesystem   │      │   OS Keychain │      │  AI Providers │
│  (watched     │      │  (credentials)│      │  (optional)   │
│   folders)    │      │               │      │               │
└───────────────┘      └───────────────┘      └───────────────┘
```

---

## 4. Directory Structure

```
swissarmypm/
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs               # Tauri entry point
│   │   ├── commands/             # Tauri command handlers
│   │   │   ├── mod.rs
│   │   │   ├── portfolio.rs
│   │   │   ├── project.rs
│   │   │   ├── item.rs
│   │   │   ├── inbox.rs
│   │   │   ├── sync.rs
│   │   │   └── report.rs
│   │   ├── services/             # Business logic
│   │   │   ├── mod.rs
│   │   │   ├── portfolio_service.rs
│   │   │   ├── sync_service.rs
│   │   │   ├── report_service.rs
│   │   │   └── ai_service.rs
│   │   ├── repositories/         # Data access
│   │   │   ├── mod.rs
│   │   │   ├── portfolio_repo.rs
│   │   │   ├── item_repo.rs
│   │   │   └── audit_repo.rs
│   │   ├── models/               # Data structures
│   │   │   ├── mod.rs
│   │   │   ├── portfolio.rs
│   │   │   ├── project.rs
│   │   │   ├── item.rs
│   │   │   └── audit.rs
│   │   ├── parsers/              # File format parsers
│   │   │   ├── mod.rs
│   │   │   ├── csv_parser.rs
│   │   │   └── msp_parser.rs
│   │   ├── watcher/              # File watching
│   │   │   ├── mod.rs
│   │   │   └── file_watcher.rs
│   │   └── db/                   # Database setup
│   │       ├── mod.rs
│   │       ├── connection.rs
│   │       └── migrations/
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                          # React frontend
│   ├── main.tsx                  # React entry
│   ├── App.tsx                   # Root component
│   ├── components/               # Shared components
│   │   ├── ui/                   # Base UI components
│   │   └── common/               # Common patterns
│   ├── features/                 # Feature modules
│   │   ├── inbox/
│   │   │   ├── InboxView.tsx
│   │   │   ├── InboxItem.tsx
│   │   │   └── TriagePanel.tsx
│   │   ├── timeline/
│   │   │   ├── TimelineView.tsx
│   │   │   ├── GanttPanel.tsx
│   │   │   └── TablePanel.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardView.tsx
│   │   │   ├── ProjectCard.tsx
│   │   │   └── ChangeFeed.tsx
│   │   ├── settings/
│   │   └── reports/
│   ├── stores/                   # Zustand stores
│   │   ├── useProjectStore.ts
│   │   ├── useInboxStore.ts
│   │   └── useUIStore.ts
│   ├── hooks/                    # Custom hooks
│   │   ├── useProjects.ts
│   │   └── useItems.ts
│   ├── lib/                      # Utilities
│   │   ├── tauri.ts              # Tauri invoke wrappers
│   │   └── utils.ts
│   └── types/                    # TypeScript types
│       └── index.ts
│
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 5. Data Flow Patterns

### 5.1 Read Flow (Frontend → Backend → Database)

```
React Component
      │
      │ useQuery(getItems, projectId)
      ▼
Zustand Store (cache check)
      │
      │ invoke('get_items', { projectId })
      ▼
Tauri Command Handler
      │
      │ item_service.list_items(project_id)
      ▼
Service Layer
      │
      │ item_repo.find_by_project(project_id)
      ▼
Repository Layer
      │
      │ sqlx::query_as!(...)
      ▼
SQLite Database
```

### 5.2 Write Flow (with Optimistic Update)

```
User Action (e.g., update task status)
      │
      ▼
Zustand: Apply optimistic update (UI updates immediately)
      │
      │ invoke('update_item', { id, updates })
      ▼
Tauri Command Handler
      │
      │ Validate input
      │ item_service.update(id, updates)
      ▼
Service Layer
      │
      │ item_repo.update(id, updates)
      │ audit_repo.log(change)
      ▼
Repository Layer (transaction)
      │
      │ SQLite UPDATE + INSERT audit
      ▼
Return Result
      │
      ▼
Zustand: Confirm or rollback optimistic update
      │
      ▼
React Component: Re-render with final state
```

---

## 6. Tauri IPC Commands

### 6.1 Command Definition (Rust)

```rust
// src-tauri/src/commands/item.rs

#[tauri::command]
pub async fn get_items(
    state: State<'_, AppState>,
    project_id: String,
    filters: Option<ItemFilters>,
) -> Result<Vec<Item>, String> {
    let db = state.db.lock().await;
    let items = item_repo::find_by_project(&db, &project_id, filters)
        .await
        .map_err(|e| e.to_string())?;
    Ok(items)
}

#[tauri::command]
pub async fn update_item(
    state: State<'_, AppState>,
    id: String,
    updates: ItemUpdate,
) -> Result<Item, String> {
    let db = state.db.lock().await;
    let item = item_service::update(&db, &id, updates)
        .await
        .map_err(|e| e.to_string())?;
    Ok(item)
}
```

### 6.2 Frontend Invocation (TypeScript)

```typescript
// src/lib/tauri.ts

import { invoke } from '@tauri-apps/api/core';

export async function getItems(
  projectId: string,
  filters?: ItemFilters
): Promise<Item[]> {
  return invoke('get_items', { projectId, filters });
}

export async function updateItem(
  id: string,
  updates: ItemUpdate
): Promise<Item> {
  return invoke('update_item', { id, updates });
}
```

---

## 7. State Management

### 7.1 Zustand Store Structure

```typescript
// src/stores/useProjectStore.ts

interface ProjectState {
  // Data
  projects: Map<string, Project>;
  currentProjectId: string | null;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchProjects: () => Promise<void>;
  setCurrentProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: new Map(),
  currentProjectId: null,
  loading: false,
  error: null,
  
  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await getProjects();
      set({ 
        projects: new Map(projects.map(p => [p.id, p])),
        loading: false 
      });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },
  
  updateProject: async (id, updates) => {
    // Optimistic update
    const prev = get().projects.get(id);
    set(state => ({
      projects: new Map(state.projects).set(id, { ...prev!, ...updates })
    }));
    
    try {
      const updated = await updateProject(id, updates);
      set(state => ({
        projects: new Map(state.projects).set(id, updated)
      }));
    } catch (e) {
      // Rollback
      set(state => ({
        projects: new Map(state.projects).set(id, prev!),
        error: e.message
      }));
    }
  },
}));
```

---

## 8. Database Schema

See @PRD-002-DataModel.md for complete schema.

### 8.1 Migration Strategy

```rust
// src-tauri/src/db/migrations/001_initial.sql

CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolios (...);
CREATE TABLE IF NOT EXISTS projects (...);
CREATE TABLE IF NOT EXISTS items (...);
-- etc.
```

Migration runner on startup:

```rust
pub async fn run_migrations(db: &SqlitePool) -> Result<(), Error> {
    let current = get_current_version(db).await?;
    let migrations = load_migrations()?;
    
    for migration in migrations.iter().filter(|m| m.version > current) {
        sqlx::query(&migration.sql).execute(db).await?;
        set_version(db, migration.version).await?;
    }
    
    Ok(())
}
```

---

## 9. Background Services

### 9.1 File Watcher

```rust
// src-tauri/src/watcher/file_watcher.rs

pub struct FileWatcher {
    watcher: RecommendedWatcher,
    rx: Receiver<DebouncedEvent>,
}

impl FileWatcher {
    pub fn new(paths: Vec<PathBuf>) -> Result<Self, Error> {
        let (tx, rx) = channel();
        let mut watcher = watcher(tx, Duration::from_secs(2))?;
        
        for path in paths {
            watcher.watch(&path, RecursiveMode::Recursive)?;
        }
        
        Ok(Self { watcher, rx })
    }
    
    pub async fn run(&self, app_handle: AppHandle) {
        loop {
            match self.rx.recv() {
                Ok(event) => {
                    self.handle_event(event, &app_handle).await;
                }
                Err(_) => break,
            }
        }
    }
    
    async fn handle_event(&self, event: DebouncedEvent, app: &AppHandle) {
        match event {
            DebouncedEvent::Create(path) | 
            DebouncedEvent::Write(path) => {
                app.emit_all("file_changed", FileChangePayload { path }).ok();
            }
            _ => {}
        }
    }
}
```

---

## 10. Error Handling

### 10.1 Error Types

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("Validation error: {0}")]
    Validation(String),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Conflict: {0}")]
    Conflict(String),
    
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Parse error: {0}")]
    Parse(String),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}
```

### 10.2 Frontend Error Handling

```typescript
// src/lib/error.ts

export async function safeInvoke<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<[T | null, string | null]> {
  try {
    const result = await invoke<T>(command, args);
    return [result, null];
  } catch (error) {
    console.error(`Command ${command} failed:`, error);
    return [null, error as string];
  }
}
```

---

## 11. Performance Considerations

### 11.1 Database Optimization

- Indexes on foreign keys and frequently queried columns
- FTS5 for full-text search
- Connection pooling (single connection for SQLite)
- Prepared statements via sqlx

### 11.2 Frontend Optimization

- Virtual scrolling for large lists (react-window)
- Memoization of expensive computations
- Debounced search inputs
- Lazy loading of views

### 11.3 IPC Optimization

- Batch related queries
- Cache frequently accessed data in Zustand
- Use events for push updates (file watcher)

---

## 12. Security Considerations

- API keys stored in OS keychain, never in config files
- SQL injection prevented via parameterized queries (sqlx)
- Input validation on all command handlers
- No network calls without explicit user action
- Signed application bundle (Tauri updater)

---

## 13. Related Documents

- @PRD-001-Master.md — Master PRD
- @PRD-002-DataModel.md — Database schema details

---

*End of ARCH-001*
