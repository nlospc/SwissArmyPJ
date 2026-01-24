# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Structure

This is a monorepo with the main application in the `code/` directory. All development commands must be run from `code/`.

## Commands

Run from `code/` directory:
- `npm run dev` - Start Electron with Vite dev server (port 5173)
- `npm run build` - Build for production (creates distributable in `release/`)
- `npm run lint` - Run ESLint on .ts/.tsx files
- `npm run type-check` - TypeScript type checking without emitting

## Architecture

**Electron Architecture:**
- Main process: `src/main/` (CommonJS, builds to `dist/main/`)
- Renderer process: `src/renderer/` (ESNext, React)
- Preload script: `src/preload/` (builds to `dist/preload/`)
- Shared types: `src/shared/types.ts`

**IPC Communication:**
- Main process exposes handlers via `ipcMain.handle()` in `src/main/ipc/handlers.ts`
- Renderer calls via `window.electronAPI.resource.action()` (exposed in preload)
- Channel naming: `resource:action` (e.g., `project:getAll`)

**Database:**
- SQLite singleton initialized in `src/main/db/schema.ts`
- Must call `initDatabaseSingleton(app)` before using `getDatabase()`
- DB file location: `app.getPath('userData')/swissarmypm.db`

**State Management:**
- Zustand stores in `src/renderer/stores/`
- `useStore` for global app state, `useProjectStore` for project data

## Path Aliases

- `@/*` → `src/renderer/*`
- `@shared/*` → `src/shared/*`

## TypeScript Configs

- `tsconfig.json` - Renderer (ESNext, react-jsx)
- `tsconfig.main.json` - Main process (CommonJS, composite)

## Service Pattern

Services in `src/main/services/` return `ApiResponse<T>` wrapper:
```typescript
{ success: boolean; data?: T; error?: string }
```

All entities use UUIDs (generated via `uuid` package) alongside auto-increment IDs.
