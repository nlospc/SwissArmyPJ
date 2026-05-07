# SwissArmyPJ

SwissArmyPJ is being reset as a local-first PMBrain-centered project management system.

The new direction:

- PMBrain is the canonical local PM data kernel.
- SwissArmyPM will be rebuilt as a local web workbench over PMBrain.
- Obsidian is a human-readable projection layer.
- Open Design is used for visual exploration.
- Figma is used as the canonical design system and screen contract.
- Electron/Tauri packaging is deferred until the web and PMBrain contracts stabilize.

The previous Electron-based SwissArmyPM implementation is preserved on branch:

```bash
fit-electron-legacy
```

## Current Commands

```bash
npm run verify:workflow
npm run verify:pmbrain
npm run verify:workspace
npm run dev:pmbrain
```

## Read First

- `AGENTS.md`
- `docs/PRODUCT-STRATEGY.md`
- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT-WORKFLOW.md`
- `docs/DESIGN-SYSTEM-WORKFLOW.md`
- `workflow/active-task.yaml`
