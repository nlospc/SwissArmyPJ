# SwissArmyPM - Local-First Project Management

A web-based, local-first project management application built for IT project managers. All data is stored in your browser using IndexedDB - no cloud, no servers, no sign-up required.

## Product Principles

- **Local-First**: All data lives in browser storage (IndexedDB). Works completely offline.
- **AI-Optional**: Fully functional without any AI integration. AI suggestions are optional enhancements.
- **MSP-First**: Portfolio view for multi-project governance.
- **Low Cognitive Load**: Designed for 30-60 second context recovery.

## Features

### ✅ Fully Interactive
- **Inbox** - Convert raw input (text, links, files) into structured Projects or Work Items
  - 3-step wizard: Classify → Extract → Review → Commit
  - Heuristic-based auto-suggestions (no AI required)
  - Full validation and error handling
  
- **Portfolio** - Multi-project governance dashboard
  - Summary metrics across all projects
  - Status distribution charts
  - Upcoming milestones and risk tracking
  
- **Projects** - Project list and detail views
  - Hierarchical work items (2-level support)
  - Quick add work items
  - Collapsible parent/child structure
  
- **Timeline** - Visual Gantt-style schedule
  - Excel-inspired layout (table + bars)
  - Milestones as diamonds, phases as brackets
  - Today marker and zoom controls
  
- **Search** - Cross-entity search
  - Search across portfolios, projects, work items, and inbox
  - Results grouped by entity type
  - Real-time search with debouncing
  
- **Settings** - Data management and preferences
  - Export/Import data as JSON
  - Reset to sample data
  - Theme preferences (visual demo)
  - AI provider placeholders

## Data Model

All entities are stored in IndexedDB with the following schema:

- **Workspace**: `{ id, name }`
- **Portfolio**: `{ id, name, description, projectIds[] }`
- **Project**: `{ id, name, owner, status, startDate?, endDate?, portfolioId?, tags[] }`
- **WorkItem**: `{ id, projectId, type, title, status, startDate?, endDate?, parentId?, level, notes?, createdAt }`
  - Types: `task | issue | milestone | remark | clash | phase`
  - Status: `not_started | in_progress | done | blocked`
- **InboxItem**: `{ id, sourceType, rawText, createdAt, processed }`

## Sample Data

The application comes preloaded with:
- 2 Portfolios
- 4 Projects
- 20 Work Items
- 6 Inbox Items

## Running Locally

This is a standard React + TypeScript application built with Vite.

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Browser Compatibility

Works in all modern browsers that support IndexedDB:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Data Persistence

All data is stored locally in IndexedDB under the database name `SwissArmyPM`. 

**Important Notes:**
- Data persists across browser sessions
- Clearing browser data will delete all projects and work items
- Use Settings → Export to backup your data regularly
- Incognito/Private mode may not persist data

## Architecture

```
/lib
  /storage.ts         - IndexedDB abstraction layer
  /sampleData.ts      - Demo data initialization

/pages
  /InboxPage.tsx      - Inbox processing workflow (FULLY INTERACTIVE)
  /PortfolioPage.tsx  - Portfolio governance view
  /ProjectsPage.tsx   - Project list and detail
  /TimelinePage.tsx   - Visual timeline/Gantt
  /SearchPage.tsx     - Cross-entity search
  /SettingsPage.tsx   - Settings and data management

/App.tsx              - Main layout and navigation
/styles/globals.css   - Global styles (8px grid)
```

## Design System

- **Spacing**: 8px base grid (0.5rem increments via Tailwind)
- **Typography**: System font stack for maximum compatibility
- **Colors**: Neutral slate base with semantic status colors
  - Green: Success, Done, On Track
  - Blue: In Progress, Info
  - Yellow: Warning, At Risk
  - Red: Error, Blocked, Critical
- **Layout**: Left navigation + main content area (desktop-first)

## Key Implementation Details

### Inbox Workflow (Core Demo)

The Inbox feature demonstrates the complete user flow:

1. **Classify**: User selects entity type (Project or WorkItem)
2. **Extract**: Form fields auto-populate using heuristics:
   - Date detection via regex
   - Status keyword matching
   - Project name matching
3. **Review**: Summary diff showing what will be created
4. **Commit**: Write to IndexedDB and mark inbox item as processed

All fields are editable. AI suggestions are simulated via simple pattern matching.

### Storage Layer

The storage layer (`lib/storage.ts`) provides:
- Type-safe CRUD operations
- Index-based queries (e.g., get all work items by projectId)
- Schema versioning (v1)
- Export/Import as JSON
- Graceful error handling

### State Management

No external state library. Component-local state using React hooks:
- `useState` for UI state
- `useEffect` for data loading
- Props for parent-child communication

## Non-Goals (Intentionally Not Implemented)

- Authentication or user accounts
- Server-side APIs or sync
- Real-time collaboration
- Native desktop application
- Mobile responsive design (desktop-first only)
- Actual AI integration (placeholders only)

## License

Demo/Prototype - Not for production use

## Support

This is a demonstration prototype built to showcase the SwissArmyPM concept. It is not production-ready and should not be used for actual project management without further development.
