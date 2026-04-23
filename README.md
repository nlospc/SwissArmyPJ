# SwissArmyPM Monorepo

This is an npm workspace monorepo containing **SwissArmyPM** (Electron + React + Vite desktop app) and **PMBrain** (Bun + TypeScript CLI knowledge brain). Both sub-projects retain independent build, dev, and release pipelines; the monorepo provides structural cohesion and future cross-package integration.

## Monorepo Structure

```
D:\code\SwissArmyPM/              ← workspace root
├── package.json                  ← workspace orchestrator (workspaces: ["packages/*"])
├── packages/
│   ├── swissarmypm/              ← Electron desktop app (React + Vite + SQLite)
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── src/                  ← main/, preload/, renderer/, shared/
│   │   └── ...
│   └── pmbrain/                  ← Bun + TypeScript CLI / knowledge brain
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/                  ← cli.ts, commands/, core/
│       └── ...
├── docs/                         ← shared documentation
├── CLAUDE.md                     ← global product guidelines
├── AGENTS.md                     ← agent instructions
└── README.md                     ← this file
```

- **`packages/swissarmypm`** — Electron desktop app (React + Vite + SQLite)
- **`packages/pmbrain`** — Bun + TypeScript CLI / knowledge brain

## Workspace Usage

Canonical local workflow starts from the workspace root and uses npm for dependency installation:

```bash
npm install
```

PMBrain runtime commands still require Bun, but root dependency installation and workspace verification are npm-first.

Run each package in dev mode:

```bash
npm run dev:swissarmypm
npm run dev:pmbrain
```

Build and verify the desktop app:

```bash
npm run build:swissarmypm
npm run verify:swissarmypm
```

For a stricter local gate that also runs TypeScript checking for SwissArmyPM:

```bash
npm run verify:swissarmypm:strict
```

Check PMBrain and verify the whole workspace:

```bash
npm run check:pmbrain
npm run verify:workspace
```

Note: `verify:swissarmypm` is the stable default local verification path. `type-check:swissarmypm` and `verify:swissarmypm:strict` remain available for ongoing TypeScript debt cleanup. All root `verify:*` commands now run inside a temporary TMPDIR and automatically clean temporary/build artifacts such as `packages/swissarmypm/dist` and `*.tsbuildinfo` when the task finishes. If you intentionally want to keep those artifacts for inspection, run with `VERIFY_KEEP_ARTIFACTS=1`.

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| **npm workspaces** | Minimal disruption to existing SwissArmyPM npm setup |
| **Independent tsconfig per package** | Incompatible compiler options (React vs Bun) |
| **Loose package coupling** | `swissarmypm` does not require a package-manager-level dependency on `pmbrain`; integration can stay at CLI/SDK boundary |
| **No shared node_modules rebuild** | Migration avoids running `npm install` during restructuring |
