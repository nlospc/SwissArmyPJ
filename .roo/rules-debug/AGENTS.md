# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Debug Mode Rules (Non-Obvious Only)

- Main process uses `mainWindow.webContents.openDevTools()` in dev mode (see `src/main/index.ts`)
- Database singleton throws if accessed before initialization - check `initDatabaseSingleton(app)` was called
- IPC errors return `ApiResponse<T>` with `success: false` and `error` string - check response structure
- SQLite DB file location: `app.getPath('userData')/swissarmypm.db` (platform-specific user data directory)
- Vite dev server on port 5173 must be running for dev mode to work
- Main process logs to terminal, renderer logs to DevTools console
- Foreign key cascade deletes happen silently in SQLite - verify data relationships
- Preload script errors break IPC communication entirely - check `src/preload/index.ts`
- Electron main process and renderer have separate contexts - they don't share state
