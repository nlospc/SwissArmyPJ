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

Install dependencies from the workspace root:

```bash
npm run install:all
```

Run each package in dev mode:

```bash
npm run dev:swissarmypm
npm run dev:pmbrain
```

Build each package:

```bash
npm run build:swissarmypm
npm run build:pmbrain
```

Type-check each package:

```bash
npm run type-check:swissarmypm
npm run type-check:pmbrain
```

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| **npm workspaces** | Minimal disruption to existing SwissArmyPM npm setup |
| **Independent tsconfig per package** | Incompatible compiler options (React vs Bun) |
| **Optional workspace dependency** | `swissarmypm` declares `pmbrain` as optional — no hard coupling |
| **No shared node_modules rebuild** | Migration avoids running `npm install` during restructuring |
