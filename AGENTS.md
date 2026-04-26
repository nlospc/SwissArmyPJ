# AGENTS.md

Repository-level engineering guide for external coding agents.
Product direction lives in `CLAUDE.md`; if there is a conflict, `CLAUDE.md` wins.

## Repo Shape

This monorepo contains two independent packages:

| Package | Directory | Purpose |
|---|---|---|
| **SwissArmyPM** | `packages/swissarmypm/` | Electron desktop PM workbench |
| **PMBrain** | `packages/pmbrain/` | Bun CLI/MCP knowledge brain |

## Canonical Root Commands

Run from repo root:

```bash
npm install
npm run dev:swissarmypm
npm run dev:pmbrain
npm run build:swissarmypm
npm run verify:swissarmypm
npm run verify:pmbrain
npm run verify:workspace
```

Root-level `verify:*` commands auto-clean temporary/build artifacts. Set `VERIFY_KEEP_ARTIFACTS=1` only when you intentionally need retained outputs.

## Where Detailed Rules Live

- Product direction: `CLAUDE.md`
- SwissArmyPM implementation rules: `packages/swissarmypm/CLAUDE.md`
- PMBrain implementation rules: `packages/pmbrain/CLAUDE.md`
- Shared workflow state:
  - `workflow/project-profile.yaml`
  - `workflow/active-task.yaml`
  - `workflow/handoff.md`

## Key Rules

1. PMBrain must not depend on SwissArmyPM.
2. SwissArmyPM must not add a package-manager-level dependency on PMBrain.
3. Follow document priority: root `CLAUDE.md` → package `CLAUDE.md` → shared docs.
4. Use parameterized SQL only.
5. Audit data changes (`audit_log` for SwissArmyPM, `ingest_log` for PMBrain).
6. Keep SwissArmyPM centered on PM Workspace, not Portfolio / My Work / Pomodoro.
