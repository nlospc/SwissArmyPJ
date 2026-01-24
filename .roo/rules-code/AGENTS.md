# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Code Mode Rules (Non-Obvious Only)

- Database MUST be accessed via singleton `getDatabase()` from `src/main/db/schema.ts` - direct instantiation will fail
- Call `initDatabaseSingleton(app)` in `src/main/index.ts` before any database operations
- IPC channel naming is strict: `resource:action` (e.g., `project:getAll`, `workPackage:create`)
- Main process services MUST return `ApiResponse<T>` wrapper with `{ success, data?, error? }`
- All entities require both auto-increment ID and UUID (use `uuid` package's `v4()` function)
- Main process builds to `dist/main/` with external modules (electron, better-sqlite3, electron-store) - don't bundle them
- Renderer imports main process via `window.electronAPI` (defined in `src/preload/index.ts`), never direct imports
- Use `@/*` for renderer imports and `@shared/*` for shared types - these are path aliases defined in tsconfig
- When adding new IPC handlers: register in `src/main/ipc/handlers.ts`, expose in `src/preload/index.ts`, add type to `IPCChannel` in `src/shared/types.ts`
- Zustand stores use `create()` with state and actions in same interface - see `src/renderer/stores/useProjectStore.ts` for pattern
- Date fields store as ISO strings in SQLite, convert using `new Date().toISOString()` and `new Date(isoString)`
- Foreign key cascades are enabled in SQLite - deleting a project cascades to work packages and dependencies
- Vite dev server runs on port 5173 - main process loads this URL in development mode
