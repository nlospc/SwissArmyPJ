# Technical Design — PM Swiss Army Knife (SwissArmyPM)
Version: v0.2
Last updated: 2026-01-24
Owner: (you)

## 0. Goals & Vision

### Core Vision
A lightweight desktop application where AI automatically adjusts project and work package information, and updates the Gantt chart based on input files (Markdown/CSV). The AI is the star feature that automates project management by processing inbox files (meeting minutes, project summaries, planning timelines) and intelligently updating project data.

### Goals
- **Desktop-first, local-first, single-user application**
- **Gantt chart as the primary visualization and interaction interface**
- **AI-driven automation** for project updates based on natural language inputs
- **Lightweight alternative to heavy tools like OpenProject**
- **Modular, phased development** - build foundation first, add AI later

### Non-goals (v1)
- Collaboration / accounts / permissions / notifications
- Real-time synchronization
- Complex task scheduling engines (keep it simple)
- Full-featured Office editing/export

---

## 1. High-level Architecture

### Modules
- **App Shell (Electron)**
  - UI (React) + renderer process
  - IPC bridge to main process
  - Desktop-native menu and file dialogs

- **Core Service (Main process)**
  - Workspace Manager (folder selection, project root)
  - Project Store (SQLite database for projects, work packages, members, budgets)
  - File Ingestion (MD/CSV parser for inbox files)
  - Gantt Engine (timeline computation, dependency resolution)
  - AI Bridge (REST API client for AI provider communication)

- **AI Integration (Phase 3)**
  - AI Provider Manager (OpenAI, Anthropic, Azure, custom)
  - Prompt Engine (context-aware prompt generation)
  - Change Proposal System (AI suggestions → user approval → apply)

### Data stores
- **SQLite**: Primary database for projects, work packages, members, budgets, dependencies
- **Filesystem (workspace)**: Inbox folder for input files (MD/CSV)
- **Local config**: App settings, AI provider credentials

---

## 2. Development Phases

### Phase 1: Foundation + Gantt Chart (MVP)
**Focus**: Basic project management with Gantt chart as the star feature

#### Features
- **Project Management**
  - Create/Edit/Delete projects
  - Project metadata: name, description, start date, end date, status

- **Work Package Management**
  - Create/Edit/Delete work packages (tasks)
  - Work package attributes: name, description, start date, end date, duration, progress, status
  - Parent-child relationships (work packages can have sub-tasks)

- **Gantt Chart**
  - Interactive timeline visualization
  - Drag-and-drop to adjust dates
  - Dependency visualization (arrows between tasks)
  - Zoom levels (day, week, month)
  - Critical path highlighting
  - Export as image/PDF

- **File Ingestion (Basic)**
  - Inbox folder monitoring
  - Parse CSV files for bulk work package import
  - Parse MD files for project documentation
  - Manual file import dialog

- **Basic Search & Filter**
  - Search projects and work packages
  - Filter by status, date range

#### Tech Stack (Phase 1)
- **Desktop**: Electron + React
- **Database**: SQLite (better-sqlite3)
- **Gantt Library**: React-Gantt-Chart or custom D3.js implementation
- **State Management**: Zustand or Redux Toolkit
- **UI Components**: Material-UI or Ant Design

---

### Phase 2: Members & Budget
**Focus**: Add resource and financial management

#### Features
- **Member Management**
  - Create/Edit/Delete members
  - Member attributes: name, email, role, hourly rate, capacity
  - Member availability calendar

- **Work Package Assignment**
  - Assign members to work packages
  - Assign effort (hours) per member per task
  - Workload visualization (member capacity vs. assigned work)

- **Budget Management**
  - Budget per project
  - Budget per work package
  - Cost tracking (assigned members × hours × rate)
  - Planned vs. Actual cost comparison
  - Budget alerts (threshold warnings)

- **Enhanced Gantt**
  - Resource allocation visualization on Gantt
  - Member swimlanes option
  - Workload heat map overlay

---

### Phase 3: AI Integration (Star Feature)
**Focus**: AI-driven automation - the main differentiator

#### Features
- **AI Provider Setup**
  - Configure AI providers (OpenAI, Anthropic, Azure, custom REST API)
  - API key management (encrypted local storage)
  - Provider selection per action type

- **Inbox Processing**
  - Monitor inbox folder for new files
  - Auto-parse meeting minutes, project summaries, planning documents
  - Extract project updates, new tasks, deadline changes

- **AI-Powered Updates**
  - **Project Updates**: AI analyzes inbox files and proposes changes to projects
  - **Work Package Creation**: AI extracts tasks from meeting notes and creates work packages
  - **Date Adjustments**: AI detects timeline changes and updates Gantt chart
  - **Dependency Suggestions**: AI proposes task dependencies based on content

- **Change Proposal System**
  - AI generates structured change proposals
  - 3-pane review UI:
    - Left: Source content (inbox file snippets)
    - Middle: Proposed changes (diff view)
    - Right: Preview of updated Gantt
  - User approves/rejects individual changes
  - Apply changes atomically (all or nothing)

- **AI REST API**
  - RESTful API for external AI services
  - Endpoints:
    - `POST /api/ai/analyze` - Analyze inbox file
    - `POST /api/ai/propose` - Generate change proposals
    - `POST /api/ai/apply` - Apply approved changes
  - Plugin architecture for custom AI providers

- **Smart Features**
  - Natural language task creation ("Add task 'Design review' for next Monday")
  - Automatic deadline detection from documents
  - Risk assessment based on timeline and workload
  - Progress prediction based on historical data

#### AI Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     Desktop App (Electron)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI Layer   │  │  Gantt View  │  │  Review UI   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│  ┌──────▼─────────────────▼─────────────────▼───────┐      │
│  │              Core Service (Main)                  │      │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │      │
│  │  │ Project  │  │   Gantt  │  │   Inbox      │   │      │
│  │  │  Store   │  │  Engine  │  │   Parser     │   │      │
│  │  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │      │
│  └───────┼────────────┼───────────────┼────────────┘      │
│          │            │               │                  │
│  ┌───────▼────────────▼───────────────▼───────┐          │
│  │              AI Bridge (REST Client)        │          │
│  │  ┌──────────────────────────────────────┐  │          │
│  │  │  Prompt Engine + Context Builder     │  │          │
│  │  └──────────────────────────────────────┘  │          │
│  └──────────────────────┬─────────────────────┘          │
└─────────────────────────┼─────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   AI Provider API     │
              │  (OpenAI/Anthropic/   │
              │   Custom/Local LLM)   │
              └───────────────────────┘
```

---

## 3. Data Model

### SQLite Schema

#### Projects
```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active', -- active, completed, on_hold, cancelled
  budget_planned REAL DEFAULT 0,
  budget_actual REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Work Packages
```sql
CREATE TABLE work_packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  project_id INTEGER NOT NULL,
  parent_id INTEGER, -- for sub-tasks
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  duration_days INTEGER,
  progress INTEGER DEFAULT 0, -- 0-100
  status TEXT DEFAULT 'todo', -- todo, in_progress, done, blocked
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  budget_planned REAL DEFAULT 0,
  budget_actual REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES work_packages(id) ON DELETE CASCADE
);
```

#### Dependencies
```sql
CREATE TABLE dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  predecessor_id INTEGER NOT NULL,
  successor_id INTEGER NOT NULL,
  type TEXT DEFAULT 'finish_to_start', -- finish_to_start, start_to_start, finish_to_finish, start_to_finish
  lag_days INTEGER DEFAULT 0,
  FOREIGN KEY (predecessor_id) REFERENCES work_packages(id) ON DELETE CASCADE,
  FOREIGN KEY (successor_id) REFERENCES work_packages(id) ON DELETE CASCADE,
  UNIQUE(predecessor_id, successor_id)
);
```

#### Members
```sql
CREATE TABLE members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT,
  hourly_rate REAL DEFAULT 0,
  weekly_capacity_hours INTEGER DEFAULT 40,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Assignments
```sql
CREATE TABLE assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  work_package_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  planned_hours REAL DEFAULT 0,
  actual_hours REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (work_package_id) REFERENCES work_packages(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE(work_package_id, member_id)
);
```

#### Inbox Files
```sql
CREATE TABLE inbox_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT UNIQUE NOT NULL,
  file_type TEXT NOT NULL, -- md, csv, txt
  processed_at TIMESTAMP,
  status TEXT DEFAULT 'pending', -- pending, processed, failed
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### AI Proposals
```sql
CREATE TABLE ai_proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inbox_file_id INTEGER,
  proposal_type TEXT NOT NULL, -- project_update, task_creation, date_change, dependency
  proposed_changes JSON NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inbox_file_id) REFERENCES inbox_files(id) ON DELETE SET NULL
);
```

#### AI Providers
```sql
CREATE TABLE ai_providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL, -- openai, anthropic, azure, custom
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  model_name TEXT,
  is_active BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Gantt Chart Implementation

### Core Features
- **Timeline Rendering**
  - Date-based horizontal axis with configurable zoom
  - Task bars with progress indicators
  - Milestone markers
  - Today line indicator

- **Interactions**
  - Drag task bars to change dates
  - Resize task bars to change duration
  - Click to select and edit
  - Double-click to open detail view
  - Right-click context menu

- **Dependencies**
  - Visual arrows between dependent tasks
  - Create dependencies by dragging from one task to another
  - Support for 4 dependency types:
    - Finish-to-Start (default)
    - Start-to-Start
    - Finish-to-Finish
    - Start-to-Finish
  - Lag time support

- **Critical Path**
  - Automatic critical path calculation
  - Highlight critical tasks in different color
  - Show slack/float for non-critical tasks

- **Filters & Views**
  - Filter by status, priority, assignee
  - Collapse/expand sub-tasks
  - Zoom levels: Day, Week, Month, Quarter
  - Baseline comparison (planned vs. actual)

### Gantt Engine Logic
```javascript
// Critical Path Calculation
function calculateCriticalPath(tasks, dependencies) {
  // 1. Build dependency graph
  // 2. Calculate earliest start/finish (forward pass)
  // 3. Calculate latest start/finish (backward pass)
  // 4. Calculate slack = LS - ES
  // 5. Critical tasks have slack = 0
}

// Date Propagation
function propagateDateChanges(taskId, newStartDate, newEndDate) {
  // 1. Update the task
  // 2. Find all dependent tasks
  // 3. Recursively update dependent tasks based on dependency type
  // 4. Return list of affected tasks for UI update
}
```

---

## 5. AI Integration Details

### AI Provider Interface
```typescript
interface AIProvider {
  name: string;
  type: 'openai' | 'anthropic' | 'azure' | 'custom';
  endpoint: string;
  apiKey: string;
  model: string;
}

interface AIContext {
  projects: Project[];
  workPackages: WorkPackage[];
  members: Member[];
  currentGanttState: GanttState;
}

interface AIProposal {
  type: 'project_update' | 'task_creation' | 'date_change' | 'dependency';
  source: string; // inbox file path
  changes: Change[];
  reasoning: string;
  confidence: number; // 0-1
}
```

### Prompt Engineering Strategy
```
System Prompt:
You are an AI project management assistant. Your task is to analyze project documents
(meeting minutes, summaries, plans) and propose changes to the project plan.

Context:
- Current projects: {project_summary}
- Current work packages: {wp_summary}
- Current timeline: {timeline_summary}

Input Document:
{document_content}

Instructions:
1. Extract any new tasks mentioned
2. Identify any deadline changes
3. Detect any status updates
4. Suggest dependencies based on task descriptions

Output Format (JSON):
{
  "proposals": [
    {
      "type": "task_creation",
      "changes": {...},
      "reasoning": "...",
      "confidence": 0.9
    }
  ]
}
```

### Change Proposal Flow
```
1. User drops file into Inbox folder
2. App detects new file
3. File parser extracts content
4. AI Bridge sends content + context to AI provider
5. AI returns structured proposals
6. App stores proposals in database
7. User opens Review UI
8. User reviews each proposal (approve/reject/modify)
9. Approved changes are applied to database
10. Gantt chart updates automatically
```

### AI REST API Endpoints
```
POST /api/v1/ai/analyze
  Body: { file_content, file_type, context }
  Response: { analysis, proposals }

POST /api/v1/ai/propose
  Body: { inbox_file_id, context }
  Response: { proposal_id, proposals }

POST /api/v1/ai/apply
  Body: { proposal_id, approved_changes }
  Response: { success, updated_entities }

GET /api/v1/ai/providers
  Response: { providers: [...] }

POST /api/v1/ai/providers
  Body: { name, type, endpoint, api_key, model }
  Response: { provider_id }
```

---

## 6. Tech Stack

### Desktop Framework
- **Electron**: Cross-platform desktop application
- **React**: UI framework (renderer process)
- **TypeScript**: Type safety

### State Management
- **Zustand**: Lightweight state management
- **React Query**: Server state and caching

### UI Components
- **Material-UI (MUI)**: Component library
- **React DnD**: Drag and drop for Gantt
- **D3.js**: Custom Gantt visualization (optional)

### Database
- **better-sqlite3**: Synchronous SQLite for main process
- **Prisma** or **sql.js**: ORM (optional)

### File Parsing
- **csv-parse**: CSV file parsing
- **marked**: Markdown parsing
- **mammoth**: DOCX parsing (optional)

### AI Integration
- **axios**: HTTP client for AI APIs
- **openai**: OpenAI SDK
- **@anthropic-ai/sdk**: Anthropic SDK

### Build Tools
- **Vite**: Fast build tool
- **electron-builder**: App packaging

---

## 7. File Structure

```
swissarmypm/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts
│   │   ├── db/            # Database setup and migrations
│   │   ├── services/      # Core services
│   │   │   ├── workspace.ts
│   │   │   ├── project.ts
│   │   │   ├── gantt.ts
│   │   │   ├── inbox.ts
│   │   │   └── ai-bridge.ts
│   │   └── ipc/           # IPC handlers
│   │
│   ├── renderer/          # React UI
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── GanttChart/
│   │   │   ├── ProjectList/
│   │   │   ├── WorkPackageList/
│   │   │   ├── MemberList/
│   │   │   ├── BudgetView/
│   │   │   ├── Inbox/
│   │   │   └── AIReview/
│   │   ├── pages/
│   │   ├── stores/        # Zustand stores
│   │   └── api/           # IPC client
│   │
│   └── shared/            # Shared types and utilities
│       └── types.ts
│
├── resources/             # Static assets
├── inbox/                 # Default inbox folder (in workspace)
└── package.json
```

---

## 8. Security & Privacy

### Data Protection
- **Local-first**: All data stored locally on user's machine
- **No cloud sync**: No automatic cloud synchronization
- **Encrypted storage**: API keys encrypted at rest
- **User control**: User explicitly approves AI actions

### AI Privacy
- **Opt-in**: AI features disabled by default
- **Preview before send**: Show user what data will be sent to AI
- **Snippet-only**: Send only relevant snippets, not full documents
- **Provider choice**: User chooses AI provider
- **No data retention**: Configure AI provider to not store data

### File System Access
- **Workspace-scoped**: App only accesses selected workspace folder
- **No system-wide access**: No privileged operations
- **User confirmation**: Explicit confirmation for workspace selection

---

## 9. MVP Build Plan (Engineering Milestones)

### Phase 1: Foundation + Gantt (6-8 weeks)
- Week 1-2: Project setup, database schema, basic UI shell
- Week 3-4: Project CRUD, Work Package CRUD
- Week 5-6: Gantt chart implementation (visualization + editing)
- Week 7-8: Inbox file parsing, CSV import, basic search

### Phase 2: Members & Budget (4-6 weeks)
- Week 1-2: Member management, assignment system
- Week 3-4: Budget tracking, cost calculations
- Week 5-6: Enhanced Gantt (resource view, workload visualization)

### Phase 3: AI Integration (6-8 weeks)
- Week 1-2: AI provider setup, REST API client
- Week 3-4: Prompt engine, context builder
- Week 5-6: Change proposal system, Review UI
- Week 7-8: Testing, refinement, documentation

---

## 10. Key Risks & Mitigations

### Technical Risks
- **Gantt Performance**: Large projects may cause rendering issues
  - Mitigation: Virtual scrolling, lazy loading, pagination

- **AI Reliability**: AI may make incorrect proposals
  - Mitigation: Confidence scores, user review required, rollback capability

- **File Parsing Variability**: Different file formats may be hard to parse
  - Mitigation: Standardized templates, error handling, manual fallback

### Scope Risks
- **Feature Creep**: Adding too many features too early
  - Mitigation: Strict phase boundaries, MVP focus

- **Complexity**: Gantt + AI integration is complex
  - Mitigation: Modular architecture, incremental testing

---

## 11. Success Metrics

### Phase 1 Success
- Users can create projects and work packages
- Gantt chart renders correctly and allows drag-and-drop editing
- CSV import works for bulk task creation

### Phase 2 Success
- Users can assign members to tasks
- Budget tracking shows planned vs. actual costs
- Workload visualization helps identify overallocation

### Phase 3 Success (The Star Feature)
- AI correctly extracts tasks from meeting minutes
- AI proposals are accurate and useful
- Users approve AI recommendations most of the time
- Overall project management time is reduced by 50%+

---

## 12. Future Enhancements (Post-MVP)

### Potential Features
- Multiple project portfolio view
- Resource leveling algorithms
- Risk management module
- Reporting and dashboards
- Export to MS Project, Excel, PDF
- Plugin system for custom AI providers
- Collaboration features (multi-user)
- Mobile companion app
- OCR for scanned documents
- Voice input for task creation
