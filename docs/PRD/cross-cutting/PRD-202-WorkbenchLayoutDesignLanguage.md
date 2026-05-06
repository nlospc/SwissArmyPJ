# PRD-202 Workbench Layout And Design Language

| Field | Value |
|---|---|
| PRD ID | PRD-202 |
| Status | Draft for review |
| Scope | SwissArmyPM renderer shell and Project Workspace |
| Date | 2026-04-28 |

## 1. Problem

The current Project Workspace UI has two competing navigation systems:

- the app-level left sidebar switches between product areas
- `ProjectWorkbenchPage` creates another local module rail for Canvas, Stakeholders, Timeline, Risks, Work Packages, and Evidence

This makes the screen feel crowded and creates avoidable hierarchy depth. The PM Workspace modules are first-class project areas, so repeating them inside the main page weakens the global sidebar and leaves less room for the actual work surface.

## 2. Design Goal

SwissArmyPM should feel like a desktop project workbench: stable left navigation, one clear project header, one dominant workspace surface, and optional context tools that do not compete with the main content.

The layout should make the left sidebar carry real navigation responsibility instead of duplicating a second menu inside the workbench page.

## 3. Layout Model

### 3.1 Application Shell

The app shell owns primary navigation.

Primary app areas:

- Projects
- Project Workspace
- Inbox
- Search
- Settings

When the user is in Project Workspace, the shell sidebar should expose the workspace modules as a secondary section under Project Workspace, not as a new menu card inside the page.

Workspace modules:

- Canvas
- Stakeholders
- Timeline
- Risks
- Work Packages
- Evidence

### 3.2 Project Workspace Page

The workspace page should not render a duplicate full-height module rail.

Recommended page regions:

1. Project header
2. Module toolbar or compact breadcrumb
3. Main work surface
4. Optional right inspector

The main work surface must receive the most horizontal space. Timeline, tables, and canvas-style modules should not be squeezed by a repeated navigation rail.

### 3.3 Sidebar Responsibility

The left sidebar should be used for:

- stable app navigation
- selected project context
- Project Workspace module selection
- small numeric badges where useful

The left sidebar should not be used for:

- long module descriptions
- dense project summaries
- card-like marketing copy
- controls that belong to the active module surface

### 3.4 Page-Level Controls

Page-level controls should be limited to the active module:

- Timeline scale, date range, filters, and create action belong in Timeline
- Risk filters and create action belong in Risks
- Canvas edit/save actions belong in Canvas

Do not add another generic module selector inside the page unless it is a compact tab/segmented control used only as a responsive fallback.

## 4. Information Hierarchy

Use this order on Project Workspace screens:

1. Project identity: name, status, owner, date range
2. Current module identity: Canvas, Timeline, Risks, etc.
3. Work surface: the editable or inspectable PM object
4. Context: related updates, evidence, linked risks, or selected item details
5. Secondary summaries

Avoid page structures where summaries and navigation consume more visual weight than the working module.

## 5. Design Language

### 5.1 Visual Density

SwissArmyPM is an operational desktop tool. Prefer dense but readable workbench UI over landing-page composition.

Use:

- restrained headers
- compact toolbars
- tables, grids, split panes, and inspectors
- 8px or smaller border radius unless Ant Design components require otherwise
- Ant Design theme tokens for colors, spacing, and states

Avoid:

- nested cards inside cards
- oversized section cards
- repeated descriptive text blocks
- decorative gradients or large empty hero-like areas
- module menus that repeat global navigation

### 5.2 Cards

Cards may be used for repeated records, inspectors, and bounded tools.

Cards should not be used as page layout wrappers when a borderless section or split pane is clearer.

### 5.3 Navigation Styling

Navigation items should be short and scannable.

Each item may include:

- icon
- label
- count badge
- active state

Navigation items should not include paragraph descriptions in the sidebar or page rail.

### 5.4 Headers

The project header should be informative but compact.

It should show:

- project name
- status
- owner
- date range
- one or two high-signal indicators

Detailed summaries should move to the active module or inspector.

## 6. Responsive Behavior

Desktop-first behavior:

- persistent left sidebar
- main workspace gets priority width
- right inspector may be persistent on wide screens

Narrow desktop behavior:

- keep left sidebar usable
- collapse the right inspector into a drawer
- use a compact module switcher only if the sidebar cannot show workspace modules

Do not make the primary desktop layout depend on mobile-style hidden navigation.

## 7. Implementation Direction

First implementation slice:

1. Move workspace module navigation ownership from `ProjectWorkbenchPage` into the app shell/sidebar.
2. Remove the duplicate workbench module rail from `ProjectWorkbenchPage`.
3. Replace the current three-column `240px + content + inspector` layout with a two-region workspace: main content plus optional inspector.
4. Keep `useWorkbenchStore.activeModule` as the module state source.
5. Update Timeline to receive the reclaimed horizontal space.
6. Reduce long module descriptions in navigation to tooltips or omit them.

Second implementation slice:

1. Normalize project header density.
2. Convert repeated page wrapper cards into simple bordered panes where appropriate.
3. Define shared workbench layout components only after the first slice proves the structure.

## 8. Acceptance Criteria

- The Project Workspace does not render a second full module rail inside the page.
- The left sidebar exposes Project Workspace modules when a project is selected or when the user is in the workbench.
- Canvas, Timeline, Risks, Work Packages, Stakeholders, and Evidence remain directly reachable.
- Timeline gains horizontal room compared with the current `240px + content + 300px` layout.
- The right inspector remains available but does not compete with the main work surface.
- Navigation labels are concise and do not rely on paragraph descriptions.
- The implementation keeps PM Workspace as the product center and does not expand Portfolio, My Work, or Pomodoro.
- Colors use Ant Design theme tokens or existing theme variables rather than hardcoded one-off palettes.

## 9. Non-Goals

- Redesigning every module's internal CRUD behavior.
- Changing Timeline domain rules from PRD-103.
- Introducing Portfolio, My Work, or Pomodoro as product centers.
- Replacing Ant Design or the existing React/Electron architecture.
- Adding PMBrain as a SwissArmyPM package dependency.

## 10. Open Questions

- Should workspace modules appear in the sidebar only after a project is selected, or always under Project Workspace?
- Should the selected project name appear in the sidebar, the header only, or both?
- Should module badges be limited to counts that are already cheap to compute?
- Should the right inspector default to visible on all wide workbench modules, or only on modules with meaningful selected-context data?
