# SwissArmyPM

A lightweight desktop project management tool with AI integration. Built with Electron, React, and SQLite.

## Features

### Phase 1: Foundation + Gantt Chart (Current)
- ✅ Project management (CRUD)
- ✅ Work package management (CRUD)
- ✅ Interactive Gantt chart with drag-and-drop
- ✅ Dependency management
- ✅ Critical path calculation
- ✅ Multiple zoom levels (Day, Week, Month, Quarter)
- ✅ CSV import for work packages
- ✅ Markdown file parsing

### Phase 2: Members & Budget (Planned)
- Member management with roles and capacity
- Work package assignments
- Budget tracking per project and work package
- Resource visualization on Gantt

### Phase 3: AI Integration (Planned)
- AI provider setup (OpenAI, Anthropic, Azure, custom)
- Automatic inbox processing
- AI-generated change proposals
- Natural language task creation
- REST API for AI integration

## Tech Stack

- **Desktop**: Electron
- **UI**: React + TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Database**: SQLite (better-sqlite3)
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd SwissArmyPJ/code
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run dev
```

This will start:
- Electron main process with hot reload
- Vite dev server for React renderer
- SQLite database in user data directory

### Building for Production

```bash
npm run build
```

This will create a distributable package in the `release/` directory.

## Project Structure

```
code/
├── src/
│   ├── main/              # Electron main process
│   │   ├── db/            # Database schema and initialization
│   │   ├── services/       # Business logic (project, workpackage, gantt, etc.)
│   │   └── ipc/           # IPC handlers for renderer communication
│   ├── renderer/          # React UI
│   │   ├── components/     # React components (ProjectList, GanttChart, etc.)
│   │   ├── stores/         # Zustand state management
│   │   └── main.tsx       # React entry point
│   ├── preload/            # Preload script for secure IPC
│   └── shared/            # Shared TypeScript types
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.main.json
├── vite.config.ts
└── tailwind.config.js
```

## Development

### Adding New Features

1. **Main Process** (`src/main/`):
   - Add services in `services/` folder
   - Register IPC handlers in `ipc/handlers.ts`
   - Update types in `src/shared/types.ts`

2. **Renderer Process** (`src/renderer/`):
   - Add components in `components/` folder
   - Update state in `stores/` folder
   - Use `window.electronAPI` to call main process

### Database Schema

The SQLite database includes tables for:
- `projects` - Project information
- `work_packages` - Tasks and sub-tasks
- `dependencies` - Task dependencies
- `members` - Team members (Phase 2)
- `assignments` - Work package assignments (Phase 2)
- `inbox_files` - Imported files
- `ai_proposals` - AI change suggestions (Phase 3)
- `ai_providers` - AI provider configurations (Phase 3)

## Gantt Chart Features

- **Drag and Drop**: Click and drag task bars to change dates
- **Dependencies**: Visual arrows between dependent tasks
- **Critical Path**: Tasks on critical path are highlighted with red border
- **Zoom Levels**: Day, Week, Month, Quarter views
- **Navigation**: Navigate forward/backward in time
- **Status Colors**: 
  - Gray: To Do
  - Blue: In Progress
  - Green: Done
  - Red: Blocked

## CSV Import Format

Work packages can be imported via CSV with the following columns:

| Column | Required | Description |
|---------|-----------|-------------|
| name | Yes | Task name |
| description | No | Task description |
| start_date | No | Start date (YYYY-MM-DD) |
| end_date | No | End date (YYYY-MM-DD) |
| duration_days | No | Duration in days |
| status | No | todo, in_progress, done, blocked |
| priority | No | low, medium, high, critical |
| parent_name | No | Parent task name (for sub-tasks) |

## License

MIT

## Roadmap

- [ ] Phase 2: Members & Budget
- [ ] Phase 3: AI Integration
- [ ] Multiple project portfolio view
- [ ] Resource leveling
- [ ] Export to PDF/Excel
- [ ] Plugin system
