# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Ask Mode Rules (Non-Obvious Only)

- All development commands must be run from `code/` directory, not project root
- Two separate TypeScript configs: `tsconfig.json` (renderer) and `tsconfig.main.json` (main process)
- Path aliases only work from `code/` directory: `@/*` → `src/renderer/*`, `@shared/*` → `src/shared/*`
- Main process code (CommonJS) and renderer code (ESNext) have different module systems
- Database is SQLite with better-sqlite3 package, not a web-based DB
- IPC is the only communication between main and renderer processes (no direct imports)
- Gantt critical path calculation uses forward/backward pass algorithm in `src/main/services/gantt.service.ts`
- State management uses Zustand with two stores: `useStore` (global) and `useProjectStore` (project data)
