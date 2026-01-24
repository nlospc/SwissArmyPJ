# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Architect Mode Rules (Non-Obvious Only)

- Electron main process uses CommonJS (tsconfig.main.json), renderer uses ESNext (tsconfig.json) - cannot share modules directly
- Main process builds to `dist/main/` with external modules: electron, better-sqlite3, electron-store (bundling will fail)
- Database is a singleton pattern - must initialize before any DB operations, cannot create multiple instances
- IPC is the only bridge between main and renderer - all main process functionality must be exposed via handlers
- Foreign key cascades in SQLite mean deleting a project auto-deletes all related work packages and dependencies
- Vite dev server (port 5173) must be running for Electron dev mode - main process loads this URL
- Gantt critical path algorithm runs entirely in main process service, renderer only displays results
- Two Zustand stores: `useStore` for global app state, `useProjectStore` for project-specific state
