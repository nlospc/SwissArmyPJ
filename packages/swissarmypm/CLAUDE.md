# CLAUDE.md — SwissArmyPM Desktop

This file adds SwissArmyPM-specific engineering rules.
Global product direction lives in `../../CLAUDE.md`; if there is a conflict, the root file wins.

## Read First

For direct Claude Code work, load `.claude/skills/project-workflow-protocol.md` first.

Before implementation/debugging/review, read:
1. `../../CLAUDE.md`
2. `../../docs/MEMORY.md`
3. `../../docs/current-status.md`
4. `../../docs/PRD/PRD-001-Master.md`
5. relevant module PRDs under `../../docs/PRD/modules/`
6. repo workflow files:
   - `../../workflow/project-profile.yaml`
   - `../../workflow/active-task.yaml`
   - `../../workflow/handoff.md`

If the relevant module PRD is missing or the target UI is still placeholder-only, stop before implementation.

## Commands

```bash
npm run dev
npm run build
npm run type-check
```

## Runtime Shape

SwissArmyPM is a three-layer Electron app:
- `src/renderer/` — React UI + Zustand stores
- `src/main/` — Electron main process, SQLite access, IPC handlers
- `src/shared/` — shared contracts and types

Primary interaction flow:
- React Component → Zustand Store → IPC → Main Process → SQLite

## Architecture Rules

1. Optimize for retrieval quality, not arbitrary small files.
2. Split only on real boundaries: runtime, domain, lifecycle, dependency direction, or public contract.
3. Avoid one-method-per-file and premature helper sprawl.
4. Keep PM Workspace as the product center.
5. Do not continue Portfolio / My Work / Pomodoro drift unless explicitly requested.

## UI / UX Rules

1. Desktop-first workbench semantics win over mobile-style collapse.
2. Preserve center workspace clarity before secondary panels.
3. Use Ant Design theme tokens; do not hardcode colors.
4. Prefer reusable, extensible intermediate structures over throwaway scaffolding.

## Implementation Rules

- Database schema changes must update both main-process schema and shared types.
- New IPC behavior belongs in the appropriate domain handler under `src/main/ipc/`.
- Use `design/` as UI reference only, not as production logic.
- Keep Zustand domain ownership clear; avoid view-specific hacks in shared stores.

## Verification

Before finishing work:
- run the verify command defined in `../../workflow/project-profile.yaml`
- update `../../workflow/handoff.md`
- update `../../workflow/active-task.yaml`

## Useful References

- Retrieval guidance: `../../docs/architecture/RETRIEVAL-UNIT-GUIDANCE.md`
- Shared docs hub: `../../docs/`
