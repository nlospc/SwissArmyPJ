> ⚠️ **已取代** — 本 PRD 已被 [PRD-001-Master.md](./PRD-001-Master.md) 取代。
> 当前产品方向为 **PM Workspace**，请以 Master PRD 为准。
> 本文档仅供历史参考。

# PRD-011: My Work View - Personal Workspace with Time Tracking

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-011 |
| **Parent** | @PRD-001-Master.md |
| **Status** | Draft |
| **Date** | 2026-02-01 |

---

## 1. Overview

The **My Work** view is a personal workspace that enables individual contributors and project managers to manage their daily execution with todo lists, time logging, and Pomodoro timer integration.

**Design Philosophy**: While the Portfolio Dashboard (PRD-006) provides portfolio-level oversight, My Work focuses on **individual task execution** and **personal productivity**.

**Dependencies**:
- @PRD-002-DataModel.md (items, projects)
- @PRD-006-Dashboard.md (navigation from dashboard)
- @PRD-008-Governance.md (audit log for time entries)

**Dependents**: None (leaf feature)

---

## 2. Design Goals

| Goal | Description |
|------|-------------|
| **Personal Task Clarity** | See all assigned tasks in one view with flexible sorting/grouping |
| **Time Accountability** | Track actual time spent vs. estimated time per task/project |
| **Focus Mode** | Pomodoro timer integrated with time logging |
| **Cross-Project View** | Aggregate todos from all projects in portfolio |
| **Audit Trail** | All time entries logged for governance and reporting |

---

## 3. Core Features

### 3.1 Personal Todo List
- **Source**: Tasks/Issues assigned to current user across all projects
- **Grouping Options**: By Project, By Due Date, By Priority, By Status
- **Sorting Options**: Due Date, Priority, Created Date, Estimated Time
- **Quick Actions**: Mark done, Start timer, Log time, Reschedule

### 3.2 Time Logging
- **Manual Entry**: Log time after task completion
- **Timer-Based**: Auto-log time from Pomodoro timer
- **Granularity**: Track time per task with start/end timestamps
- **Aggregation**: Rollup to project-level and portfolio-level reports

### 3.3 Pomodoro Timer
- **Integration**: Start timer from any task
- **Session Tracking**: 25-min work + 5-min break (configurable)
- **Auto-Log**: Time logged to task when session completes
- **Notifications**: Desktop notifications for break/work transitions

---

## 4. Layout Design

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🎯 My Work                                    👤 John Doe │ Today: Feb 1, 2026 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  QUICK STATS                                                            │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  📋 12 Tasks Today  │  ⏱ 4.5h Logged Today  │  🍅 6 Pomodoros Complete │   │
│  │  📊 3 Projects Active  │  ⚠ 2 Overdue  │  🎯 8h Target (56% complete)  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌───────────────────────────────────┬─────────────────────────────────────┐   │
│  │  TODO LIST                        │  TIME TRACKER                       │   │
│  │  (70% width)                      │  (30% width)                        │   │
│  │  ───────────────────────────────  │  ─────────────────────────────────  │   │
│  │                                   │                                     │   │
│  │  [Group by: Project ▼] [Sort by: Due Date ▼] [Filter: All ▼]           │   │
│  │                                   │  ┌─────────────────────────────┐   │   │
│  │  ▼ ERP Migration (5 tasks)        │  │  🍅 POMODORO TIMER         │   │   │
│  │  ┌──────────────────────────────┐ │  │  ───────────────────────── │   │   │
│  │  │ ☐ Design database schema     │ │  │                            │   │   │
│  │  │   📅 Due: Today               │ │  │     ⏱ 24:35                │   │   │
│  │  │   ⏱ Est: 2h │ Logged: 1.2h   │ │  │     ────────                │   │   │
│  │  │   🔴 High Priority            │ │  │                            │   │   │
│  │  │   [▶ Start] [✓ Done] [Log]   │ │  │  Task: Design API endpoints│   │   │
│  │  └──────────────────────────────┘ │  │  Project: Mobile App       │   │   │
│  │                                   │  │                            │   │   │
│  │  ┌──────────────────────────────┐ │  │  [⏸ Pause] [⏹ Stop]        │   │   │
│  │  │ ☐ Review security audit      │ │  │  [Skip Break]              │   │   │
│  │  │   📅 Due: Tomorrow            │ │  └─────────────────────────────┘   │   │
│  │  │   ⏱ Est: 1.5h │ Logged: 0h   │ │                                     │   │
│  │  │   🟡 Medium Priority          │ │  ┌─────────────────────────────┐   │   │
│  │  │   [▶ Start] [✓ Done] [Log]   │ │  │  TODAY'S LOG                │   │   │
│  │  └──────────────────────────────┘ │  │  ───────────────────────── │   │   │
│  │                                   │  │                            │   │   │
│  │  ▼ Mobile App (3 tasks)           │  │  ✓ API Design         2.5h │   │   │
│  │  ┌──────────────────────────────┐ │  │    (3 🍅) 9:00-11:30       │   │   │
│  │  │ ☑ API endpoint design        │ │  │                            │   │   │
│  │  │   ✅ Completed 2h ago         │ │  │  ⏱ Database Schema    1.2h │   │   │
│  │  │   ⏱ Est: 2h │ Logged: 2.5h   │ │  │    (In progress)           │   │   │
│  │  │   [View Details]              │ │  │                            │   │   │
│  │  └──────────────────────────────┘ │  │  ─────────────────────────  │   │   │
│  │                                   │  │  Total: 3.7h / 8h target   │   │   │
│  │  ▼ Overdue (2 tasks)              │ │  │                            │   │   │
│  │  ┌──────────────────────────────┐ │  │  [View Full History]       │   │   │
│  │  │ ☐ Fix login bug              │ │  └─────────────────────────────┘   │   │
│  │  │   📅 Due: Jan 30 (2 days ago)│ │                                     │   │
│  │  │   ⏱ Est: 3h │ Logged: 0h     │ │  ┌─────────────────────────────┐   │   │
│  │  │   🔴 Critical                │ │  │  WEEKLY SUMMARY             │   │   │
│  │  │   [▶ Start] [✓ Done] [Log]   │ │  │  ───────────────────────── │   │   │
│  │  └──────────────────────────────┘ │  │                            │   │   │
│  │                                   │  │  Mon  ████████░░  6.5h     │   │   │
│  │  [+ Add Quick Task]              │  │  Tue  ██████░░░░  5.2h     │   │   │
│  │                                   │  │  Wed  ████████░░  7.1h     │   │   │
│  └───────────────────────────────────┤  Thu  ████░░░░░░  3.7h (so far)│   │
│                                      │  Fri  ░░░░░░░░░░  0h         │   │   │
│                                      │  │                            │   │   │
│                                      │  │  Target: 40h │ Actual: 22.5h│  │   │
│                                      │  └─────────────────────────────┘   │   │
└──────────────────────────────────────┴─────────────────────────────────────┘   │
```

---

## 5. Data Model Extensions

### 5.1 Time Log Table

```sql
CREATE TABLE time_logs (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,                    -- FK to items table
  user_id TEXT NOT NULL,                    -- Who logged the time
  start_time DATETIME NOT NULL,             -- When work started
  end_time DATETIME,                        -- When work ended (NULL if in progress)
  duration_minutes INTEGER,                 -- Calculated: end_time - start_time
  log_type TEXT NOT NULL,                   -- 'manual' | 'timer' | 'pomodoro'
  pomodoro_count INTEGER DEFAULT 0,         -- Number of pomodoros in this session
  notes TEXT,                               -- Optional notes about the work
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE INDEX idx_time_logs_item ON time_logs(item_id);
CREATE INDEX idx_time_logs_user ON time_logs(user_id);
CREATE INDEX idx_time_logs_date ON time_logs(start_time);
```

### 5.2 Pomodoro Sessions Table

```sql
CREATE TABLE pomodoro_sessions (
  id TEXT PRIMARY KEY,
  time_log_id TEXT NOT NULL,                -- FK to time_logs
  session_number INTEGER NOT NULL,          -- 1st, 2nd, 3rd pomodoro in sequence
  session_type TEXT NOT NULL,               -- 'work' | 'short_break' | 'long_break'
  duration_minutes INTEGER NOT NULL,        -- 25 for work, 5 for short, 15 for long
  started_at DATETIME NOT NULL,
  completed_at DATETIME,                    -- NULL if interrupted
  interrupted BOOLEAN DEFAULT 0,            -- User manually stopped early
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (time_log_id) REFERENCES time_logs(id) ON DELETE CASCADE
);

CREATE INDEX idx_pomodoro_time_log ON pomodoro_sessions(time_log_id);
CREATE INDEX idx_pomodoro_date ON pomodoro_sessions(started_at);
```

### 5.3 User Preferences Table (Extension)

Add Pomodoro configuration to user preferences:

```sql
CREATE TABLE user_preferences (
  user_id TEXT PRIMARY KEY,

  -- Pomodoro Settings
  pomodoro_work_duration INTEGER DEFAULT 25,      -- minutes
  pomodoro_short_break INTEGER DEFAULT 5,         -- minutes
  pomodoro_long_break INTEGER DEFAULT 15,         -- minutes
  pomodoro_sessions_before_long INTEGER DEFAULT 4, -- after 4 work sessions

  -- Time Tracking
  daily_time_target INTEGER DEFAULT 480,          -- minutes (8 hours)
  enable_desktop_notifications BOOLEAN DEFAULT 1,
  auto_start_breaks BOOLEAN DEFAULT 0,            -- Auto-start break after work session

  -- Todo Settings
  default_group_by TEXT DEFAULT 'project',        -- 'project' | 'due_date' | 'priority'
  default_sort_by TEXT DEFAULT 'due_date',        -- 'due_date' | 'priority' | 'created'
  show_completed_tasks BOOLEAN DEFAULT 0,

  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 5.4 Items Table Extension

Add time tracking fields to existing `items` table:

```sql
ALTER TABLE items ADD COLUMN estimated_minutes INTEGER;  -- Estimated time to complete
ALTER TABLE items ADD COLUMN assigned_to TEXT;           -- User ID
```

---

## 6. Component Architecture

```
MyWork/
├── MyWorkContainer.tsx             # Main layout, data orchestration
├── QuickStats/
│   ├── StatsBar.tsx                # Today's stats summary
│   └── ProgressIndicator.tsx       # Daily target progress
├── TodoList/
│   ├── TodoContainer.tsx           # List container with filters
│   ├── TodoFilters.tsx             # Group/sort/filter controls
│   ├── TodoGroup.tsx               # Collapsible group (e.g., by project)
│   ├── TodoItem.tsx                # Individual task card
│   └── QuickTaskInput.tsx          # "+ Add Quick Task" inline input
├── TimeTracker/
│   ├── TrackerSidebar.tsx          # Right sidebar container
│   ├── PomodoroTimer/
│   │   ├── TimerWidget.tsx         # Active timer display
│   │   ├── TimerControls.tsx       # Start/Pause/Stop buttons
│   │   └── SessionIndicator.tsx    # Pomodoro count (e.g., 🍅🍅🍅○)
│   ├── TodayLog/
│   │   ├── LogSummary.tsx          # Today's time entries
│   │   ├── LogEntry.tsx            # Individual entry
│   │   └── ManualLogDialog.tsx     # Dialog for manual time entry
│   └── WeeklySummary/
│       ├── WeeklyChart.tsx         # Bar chart of daily hours
│       └── TargetProgress.tsx      # Weekly target vs. actual
└── shared/
    ├── TimeInput.tsx               # Time duration input component
    └── PriorityBadge.tsx           # Priority indicator
```

---

## 7. User Workflows

### 7.1 Starting Work on a Task

```
1. User opens My Work view
2. See all assigned tasks grouped by project
3. Click [▶ Start] on "Design database schema"
4. System:
   - Creates time_log entry with start_time = now, end_time = NULL
   - Optionally prompts: "Start Pomodoro timer?" [Yes] [No, just track time]
5. If Yes:
   - Start 25-minute Pomodoro timer
   - Show timer widget in sidebar
   - Create pomodoro_session entry
6. User works...
7. Timer completes (or user clicks [⏹ Stop]):
   - Update time_log.end_time = now
   - Calculate duration_minutes
   - Mark pomodoro_session as completed
   - Prompt: "Log this time to task?" [Yes] [Edit first]
8. Time logged and visible in "Today's Log"
```

### 7.2 Manual Time Entry

```
1. User clicks [Log] button on task
2. Dialog opens: "Log Time for: Design database schema"
   - Start time: [__:__] (default: now - 1 hour)
   - End time: [__:__] (default: now)
   - Duration: 1h 0m (auto-calculated)
   - Notes: [Optional text area]
3. User edits and confirms
4. System creates time_log entry with log_type = 'manual'
5. Entry appears in Today's Log
```

### 7.3 Pomodoro Workflow with Breaks

```
Session 1:
  - Work 25 min → Short break 5 min
Session 2:
  - Work 25 min → Short break 5 min
Session 3:
  - Work 25 min → Short break 5 min
Session 4:
  - Work 25 min → Long break 15 min
[Cycle repeats]
```

**Break Behavior**:
- Desktop notification: "Work session complete! Take a 5-minute break."
- Timer widget shows break countdown
- If `auto_start_breaks = true`, break starts automatically
- User can [Skip Break] to continue working (break time not logged)

---

## 8. Zustand Store

```typescript
// src/renderer/stores/useMyWorkStore.ts

interface MyWorkState {
  // Todo List
  todos: Map<string, TodoItem>;              // All assigned tasks
  groupBy: 'project' | 'due_date' | 'priority' | 'status';
  sortBy: 'due_date' | 'priority' | 'created' | 'estimated_time';
  filterStatus: 'all' | 'active' | 'overdue' | 'today';

  // Time Tracking
  activeLogs: Map<string, TimeLog>;          // Currently running timers
  todayLogs: TimeLog[];                      // Completed logs for today
  weeklyLogs: WeeklySummary;                 // Weekly aggregates

  // Pomodoro
  activePomodoro: PomodoroSession | null;
  pomodoroSettings: PomodoroSettings;

  // Quick Stats
  stats: {
    todayTasks: number;
    todayHours: number;
    todayPomodoros: number;
    activeProjects: number;
    overdueTasks: number;
    dailyTarget: number;
    dailyProgress: number;
  };

  // Actions
  fetchTodos: () => Promise<void>;
  updateTodoGrouping: (groupBy: GroupByOption) => void;
  markTodoDone: (todoId: string) => Promise<void>;

  startTimer: (itemId: string, usePomodoro: boolean) => Promise<void>;
  stopTimer: (timeLogId: string) => Promise<void>;
  pauseTimer: (timeLogId: string) => Promise<void>;
  logManualTime: (entry: ManualTimeEntry) => Promise<void>;

  startPomodoro: (itemId: string) => Promise<void>;
  pausePomodoro: () => void;
  stopPomodoro: () => Promise<void>;
  skipBreak: () => void;

  fetchTodayLogs: () => Promise<void>;
  fetchWeeklySummary: () => Promise<void>;
}

interface TodoItem {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate: Date | null;
  estimatedMinutes: number | null;
  loggedMinutes: number;                     // Total time logged so far
  isOverdue: boolean;
  assignedTo: string;
}

interface TimeLog {
  id: string;
  itemId: string;
  itemName: string;
  projectName: string;
  userId: string;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
  logType: 'manual' | 'timer' | 'pomodoro';
  pomodoroCount: number;
  notes: string | null;
  isActive: boolean;                         // endTime === null
}

interface PomodoroSession {
  id: string;
  timeLogId: string;
  itemId: string;
  itemName: string;
  sessionNumber: number;
  sessionType: 'work' | 'short_break' | 'long_break';
  durationMinutes: number;
  remainingSeconds: number;                  // For countdown display
  startedAt: Date;
  isPaused: boolean;
}

interface PomodoroSettings {
  workDuration: number;                      // minutes
  shortBreak: number;
  longBreak: number;
  sessionsBeforeLong: number;
}

interface WeeklySummary {
  days: {
    date: string;                            // 'YYYY-MM-DD'
    totalMinutes: number;
    pomodoroCount: number;
  }[];
  weeklyTarget: number;                      // minutes
  weeklyActual: number;
}
```

---

## 9. IPC Commands

### 9.1 Todo List Commands

```typescript
// Get all todos assigned to current user
ipcMain.handle('mywork:getTodos', async (event, userId: string) => {
  const todos = await db.prepare(`
    SELECT
      i.id, i.name, i.status, i.priority, i.end_date as dueDate,
      i.estimated_minutes as estimatedMinutes,
      i.assigned_to as assignedTo,
      p.id as projectId, p.name as projectName,
      COALESCE(SUM(tl.duration_minutes), 0) as loggedMinutes
    FROM items i
    INNER JOIN projects p ON i.project_id = p.id
    LEFT JOIN time_logs tl ON i.id = tl.item_id
    WHERE i.assigned_to = ? AND i.status != 'Done'
    GROUP BY i.id
    ORDER BY i.end_date ASC
  `).all(userId);

  return { success: true, data: todos };
});

// Mark task as done
ipcMain.handle('mywork:markDone', async (event, { itemId, userId }) => {
  await db.prepare(`
    UPDATE items SET status = 'Done', updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND assigned_to = ?
  `).run(itemId, userId);

  await auditLog('update', 'Item', itemId, { status: 'Done' }, userId);
  return { success: true };
});
```

### 9.2 Time Logging Commands

```typescript
// Start timer
ipcMain.handle('timelog:start', async (event, { itemId, userId, logType }) => {
  const logId = generateId();

  await db.prepare(`
    INSERT INTO time_logs (id, item_id, user_id, start_time, log_type)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
  `).run(logId, itemId, userId, logType);

  return { success: true, data: { logId } };
});

// Stop timer
ipcMain.handle('timelog:stop', async (event, { logId, notes }) => {
  const result = await db.prepare(`
    UPDATE time_logs
    SET
      end_time = CURRENT_TIMESTAMP,
      duration_minutes = CAST((julianday(CURRENT_TIMESTAMP) - julianday(start_time)) * 1440 AS INTEGER),
      notes = ?
    WHERE id = ?
  `).run(notes, logId);

  await auditLog('update', 'TimeLog', logId, { status: 'completed' }, 'system');
  return { success: true };
});

// Manual time entry
ipcMain.handle('timelog:logManual', async (event, entry: ManualTimeEntry) => {
  const logId = generateId();

  await db.prepare(`
    INSERT INTO time_logs (id, item_id, user_id, start_time, end_time, duration_minutes, log_type, notes)
    VALUES (?, ?, ?, ?, ?, ?, 'manual', ?)
  `).run(
    logId,
    entry.itemId,
    entry.userId,
    entry.startTime,
    entry.endTime,
    entry.durationMinutes,
    entry.notes
  );

  await auditLog('create', 'TimeLog', logId, entry, entry.userId);
  return { success: true, data: { logId } };
});

// Get today's logs
ipcMain.handle('timelog:getToday', async (event, userId: string) => {
  const logs = await db.prepare(`
    SELECT
      tl.id, tl.item_id as itemId, i.name as itemName, p.name as projectName,
      tl.start_time as startTime, tl.end_time as endTime, tl.duration_minutes as durationMinutes,
      tl.log_type as logType, tl.pomodoro_count as pomodoroCount, tl.notes
    FROM time_logs tl
    INNER JOIN items i ON tl.item_id = i.id
    INNER JOIN projects p ON i.project_id = p.id
    WHERE tl.user_id = ? AND DATE(tl.start_time) = DATE('now')
    ORDER BY tl.start_time DESC
  `).all(userId);

  return { success: true, data: logs };
});

// Get weekly summary
ipcMain.handle('timelog:getWeeklySummary', async (event, userId: string) => {
  const days = await db.prepare(`
    SELECT
      DATE(start_time) as date,
      SUM(duration_minutes) as totalMinutes,
      SUM(pomodoro_count) as pomodoroCount
    FROM time_logs
    WHERE user_id = ?
      AND start_time >= DATE('now', 'weekday 0', '-6 days')  -- Monday to Sunday
    GROUP BY DATE(start_time)
    ORDER BY date ASC
  `).all(userId);

  return { success: true, data: days };
});
```

### 9.3 Pomodoro Commands

```typescript
// Start pomodoro session
ipcMain.handle('pomodoro:start', async (event, { timeLogId, sessionType, durationMinutes }) => {
  const sessionId = generateId();
  const sessionNumber = await getNextSessionNumber(timeLogId);

  await db.prepare(`
    INSERT INTO pomodoro_sessions (id, time_log_id, session_number, session_type, duration_minutes, started_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(sessionId, timeLogId, sessionNumber, sessionType, durationMinutes);

  return { success: true, data: { sessionId } };
});

// Complete pomodoro session
ipcMain.handle('pomodoro:complete', async (event, { sessionId, interrupted }) => {
  await db.prepare(`
    UPDATE pomodoro_sessions
    SET completed_at = CURRENT_TIMESTAMP, interrupted = ?
    WHERE id = ?
  `).run(interrupted ? 1 : 0, sessionId);

  // Increment pomodoro count in time_log if work session completed
  const session = await db.prepare('SELECT * FROM pomodoro_sessions WHERE id = ?').get(sessionId);
  if (session.session_type === 'work' && !interrupted) {
    await db.prepare(`
      UPDATE time_logs
      SET pomodoro_count = pomodoro_count + 1
      WHERE id = ?
    `).run(session.time_log_id);
  }

  return { success: true };
});
```

---

## 10. UI Interactions

### 10.1 Todo List Interactions

| Action | Trigger | Behavior |
|--------|---------|----------|
| Group by Project | Dropdown change | Re-render list with collapsible project groups |
| Sort by Due Date | Dropdown change | Re-order items within groups |
| Filter: Overdue | Filter dropdown | Show only items with dueDate < today |
| Click [▶ Start] | Button click | Open dialog: "Start timer" or "Start Pomodoro" |
| Click [✓ Done] | Button click | Mark task as done, move to completed section |
| Click [Log] | Button click | Open manual time entry dialog |
| Click task name | Link click | Navigate to task detail view |

### 10.2 Pomodoro Timer Interactions

| Action | Trigger | Behavior |
|--------|---------|----------|
| Timer running | Auto | Countdown display updates every second |
| Timer expires | Auto | Desktop notification + sound (optional) |
| Click [⏸ Pause] | Button click | Pause countdown, show [▶ Resume] |
| Click [⏹ Stop] | Button click | Confirm dialog: "Stop and log time?" |
| Click [Skip Break] | Button click | End break early, start next work session |
| Long break complete | Auto | Reset pomodoro sequence to session 1 |

### 10.3 Time Log Interactions

| Action | Trigger | Behavior |
|--------|---------|----------|
| Click entry in Today's Log | Link click | Navigate to task detail |
| Click [View Full History] | Button click | Open full time log modal/page |
| Hover over entry | Mouse hover | Show tooltip with notes |

---

## 11. Desktop Notifications

### 11.1 Notification Types

```typescript
// Work session complete
notification.show({
  title: 'Pomodoro Complete! 🍅',
  body: 'Great work! Time for a 5-minute break.',
  actions: [
    { action: 'start_break', title: 'Start Break' },
    { action: 'skip_break', title: 'Skip & Continue' }
  ]
});

// Break complete
notification.show({
  title: 'Break Over!',
  body: 'Ready to start your next work session?',
  actions: [
    { action: 'start_work', title: 'Start Work' },
    { action: 'dismiss', title: 'Not Yet' }
  ]
});

// Task overdue
notification.show({
  title: 'Task Overdue ⚠️',
  body: 'Fix login bug is 2 days overdue',
  actions: [
    { action: 'view_task', title: 'View Task' },
    { action: 'dismiss', title: 'Dismiss' }
  ]
});
```

### 11.2 Notification Settings

User preferences (in `user_preferences` table):
- `enable_desktop_notifications`: true/false
- `notification_sound`: true/false
- `notification_volume`: 0-100

---

## 12. Reporting & Analytics

### 12.1 Time Reports (Future Integration with PRD-007)

**Daily Summary**:
- Total hours logged today
- Hours per project
- Pomodoro count
- Target achievement percentage

**Weekly Summary**:
- Daily breakdown (bar chart)
- Weekly total vs. target
- Most productive day
- Average daily hours

**Project Time Breakdown**:
- Time logged per project in date range
- Estimated vs. actual comparison
- Export to CSV

### 12.2 Aggregation Queries

```sql
-- Daily summary
SELECT
  DATE(start_time) as date,
  SUM(duration_minutes) as total_minutes,
  SUM(pomodoro_count) as total_pomodoros,
  COUNT(DISTINCT item_id) as tasks_worked_on
FROM time_logs
WHERE user_id = ? AND DATE(start_time) = DATE('now')
GROUP BY DATE(start_time);

-- Project time breakdown
SELECT
  p.name as project_name,
  SUM(tl.duration_minutes) as total_minutes,
  COUNT(DISTINCT tl.item_id) as tasks_count,
  SUM(tl.pomodoro_count) as pomodoro_count
FROM time_logs tl
INNER JOIN items i ON tl.item_id = i.id
INNER JOIN projects p ON i.project_id = p.id
WHERE tl.user_id = ?
  AND tl.start_time BETWEEN ? AND ?
GROUP BY p.id
ORDER BY total_minutes DESC;
```

---

## 13. Performance Requirements

| Metric | Target |
|--------|--------|
| Initial Load | < 1 second for 100 todos |
| Group/Sort Change | < 200ms |
| Timer Update | 60 FPS (no lag in countdown) |
| Manual Log Save | < 300ms |
| Today's Log Query | < 100ms |
| Weekly Summary Query | < 200ms |

---

## 14. Acceptance Criteria

| AC# | Criteria | Test Method |
|-----|----------|-------------|
| AC-01 | Todo list displays all assigned tasks | Integration test |
| AC-02 | Grouping by project shows collapsible groups | E2E test |
| AC-03 | Sorting by due date orders items correctly | Unit test |
| AC-04 | Start timer creates time_log entry | Integration test |
| AC-05 | Pomodoro timer counts down from 25:00 | E2E test |
| AC-06 | Timer completion creates pomodoro_session entry | Integration test |
| AC-07 | Desktop notification shown on timer complete | E2E test |
| AC-08 | Manual time entry logs to database | Integration test |
| AC-09 | Today's log shows correct total hours | Integration test |
| AC-10 | Weekly summary aggregates correctly | Unit test |
| AC-11 | Mark done updates item status | Integration test |
| AC-12 | Pause/resume timer preserves remaining time | E2E test |
| AC-13 | Skip break starts next work session | E2E test |
| AC-14 | Long break triggers after 4 work sessions | E2E test |
| AC-15 | Quick stats update in real-time | E2E test |

---

## 15. Implementation Phases

### Phase 1: Basic Todo List (Week 1-2)
- [ ] Todo list UI with grouping/sorting
- [ ] Fetch todos from database (assigned_to current user)
- [ ] Mark done functionality
- [ ] Quick stats bar

### Phase 2: Time Logging (Week 3-4)
- [ ] Time log data model (migration)
- [ ] Manual time entry dialog
- [ ] Start/stop timer (no Pomodoro yet)
- [ ] Today's log display
- [ ] Weekly summary chart

### Phase 3: Pomodoro Timer (Week 5-6)
- [ ] Pomodoro session data model
- [ ] Timer widget UI
- [ ] Countdown logic with pause/resume
- [ ] Desktop notifications
- [ ] Break management (short/long)
- [ ] Auto-log time on session complete

### Phase 4: Polish & Integration (Week 7-8)
- [ ] User preferences (timer durations, notifications)
- [ ] Link from Portfolio Dashboard to My Work
- [ ] Export time logs to CSV
- [ ] Performance optimization
- [ ] E2E testing

---

## 16. Design Decisions (FINALIZED)

| # | Question | Decision | Implementation |
|---|----------|----------|----------------|
| Q1 | Should completed tasks stay visible (with checkbox) or auto-hide? | **Show with strikethrough for 24h, then auto-archive** | Add `completed_at` timestamp to items table; filter query excludes tasks completed > 24h ago; archived tasks moved to "Archive" view |
| Q2 | Allow editing time logs after submission? | **Yes, allow editing with audit trail** | Add "Edit" button to time log entries; update creates audit_log entry with old/new values; show "Last edited" timestamp |
| Q3 | Support multiple simultaneous timers (parallel tasks)? | **No for v1, record as future requirement** | Single active timer enforced in UI; backend supports multiple logs but UI prevents starting second timer; v2 feature request logged |
| Q4 | Integration with external calendar (Google Calendar, Outlook)? | **Phase 2 feature with holiday support** | Sync task due dates to calendar; show holidays based on app language (Chinese holidays when lang=zh); read-only calendar view in sidebar |
| Q5 | Mobile companion app for time tracking on the go? | **Post-v1 consideration** | Evaluate after desktop app reaches stable v1.0 |

---

## 17. Feature Details: Auto-Archive Completed Tasks

### 17.1 Behavior

**24-Hour Grace Period**:
- Task marked done → Status changes to "Done", `completed_at` = now
- For next 24 hours: Task visible in todo list with strikethrough styling
- After 24 hours: Task automatically filtered out of default view
- Archived tasks accessible via "View Archive" button or filter

### 17.2 Database Schema Change

```sql
-- Add completed_at timestamp to items table
ALTER TABLE items ADD COLUMN completed_at TEXT;

-- Create trigger to set completed_at when status changes to Done
CREATE TRIGGER IF NOT EXISTS items_completed_at
AFTER UPDATE OF status ON items
FOR EACH ROW
WHEN NEW.status = 'Done' AND OLD.status != 'Done'
BEGIN
  UPDATE items SET completed_at = datetime('now') WHERE id = NEW.id;
END;

-- Create index for archive queries
CREATE INDEX idx_items_completed_at ON items(completed_at) WHERE completed_at IS NOT NULL;
```

### 17.3 Query Logic

```sql
-- Fetch active todos (excludes tasks completed > 24h ago)
SELECT * FROM items
WHERE assigned_to = ?
  AND (
    status != 'Done'
    OR (status = 'Done' AND completed_at > datetime('now', '-1 day'))
  )
ORDER BY status DESC, end_date ASC;

-- Fetch archived todos (completed > 24h ago)
SELECT * FROM items
WHERE assigned_to = ?
  AND status = 'Done'
  AND completed_at <= datetime('now', '-1 day')
ORDER BY completed_at DESC;
```

### 17.4 UI Styling

```typescript
// TodoItem.tsx - Conditional styling
const itemClasses = todo.status === 'done'
  ? 'opacity-60 line-through'
  : '';

const showArchiveBadge = todo.status === 'done' &&
  (Date.now() - new Date(todo.completedAt).getTime()) < 24 * 60 * 60 * 1000;

return (
  <div className={itemClasses}>
    <h4>{todo.name}</h4>
    {showArchiveBadge && (
      <span className="text-xs text-green-600">
        ✓ Completed {formatTimeAgo(todo.completedAt)} • Auto-archives in {timeUntilArchive}
      </span>
    )}
  </div>
);
```

---

## 18. Feature Details: Edit Time Logs

### 18.1 User Workflow

```
1. User clicks time log entry in "Today's Log"
2. Dialog opens with pre-filled form:
   - Start time: [editable]
   - End time: [editable]
   - Duration: [auto-calculated, read-only]
   - Notes: [editable]
3. User edits values and saves
4. System validates (start < end, no overlaps)
5. Update time_logs table
6. Create audit_log entry with old/new values
7. Show "Last edited" indicator on entry
```

### 18.2 Database Schema Change

```sql
-- Add edited tracking to time_logs
ALTER TABLE time_logs ADD COLUMN edited_at TEXT;
ALTER TABLE time_logs ADD COLUMN edited_by TEXT;

-- Trigger to track edits
CREATE TRIGGER IF NOT EXISTS time_logs_edited
AFTER UPDATE ON time_logs
FOR EACH ROW
WHEN OLD.start_time != NEW.start_time OR OLD.end_time != NEW.end_time OR OLD.notes != NEW.notes
BEGIN
  UPDATE time_logs SET edited_at = datetime('now'), edited_by = NEW.user_id WHERE id = NEW.id;
END;
```

### 18.3 IPC Command

```typescript
ipcMain.handle('timelog:edit', async (event, { logId, updates, userId }) => {
  const oldLog = db.prepare('SELECT * FROM time_logs WHERE id = ?').get(logId);

  // Validate: start_time < end_time
  if (new Date(updates.startTime) >= new Date(updates.endTime)) {
    return { success: false, error: 'Start time must be before end time' };
  }

  // Calculate new duration
  const duration = Math.round(
    (new Date(updates.endTime) - new Date(updates.startTime)) / 60000
  );

  db.prepare(`
    UPDATE time_logs
    SET start_time = ?, end_time = ?, duration_minutes = ?, notes = ?
    WHERE id = ?
  `).run(updates.startTime, updates.endTime, duration, updates.notes, logId);

  // Audit trail
  await auditLog('update', 'TimeLog', logId, {
    old: { startTime: oldLog.start_time, endTime: oldLog.end_time, notes: oldLog.notes },
    new: { startTime: updates.startTime, endTime: updates.endTime, notes: updates.notes }
  }, userId);

  return { success: true };
});
```

### 18.4 UI Component

```typescript
// EditTimeLogDialog.tsx
export function EditTimeLogDialog({ log, onClose, onSave }) {
  const [startTime, setStartTime] = useState(log.startTime);
  const [endTime, setEndTime] = useState(log.endTime);
  const [notes, setNotes] = useState(log.notes || '');

  const duration = calculateDuration(startTime, endTime);

  const handleSave = async () => {
    await invoke('timelog:edit', {
      logId: log.id,
      updates: { startTime, endTime, notes },
      userId: 'current-user'
    });
    onSave();
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Edit Time Log</DialogTitle>
      <DialogContent>
        <div className="space-y-4">
          <TimeInput label="Start Time" value={startTime} onChange={setStartTime} />
          <TimeInput label="End Time" value={endTime} onChange={setEndTime} />
          <div className="text-sm text-slate-600">
            Duration: {formatDuration(duration)}
          </div>
          <Textarea label="Notes" value={notes} onChange={setNotes} />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="primary">Save Changes</Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

## 19. Feature Details: Calendar Integration (Phase 2)

### 19.1 Scope

**Calendar Sources**:
- Google Calendar (OAuth2 integration)
- Microsoft Outlook (Microsoft Graph API)
- iCal/CalDAV (generic support)

**Read-Only Sync**:
- Show task due dates on calendar
- Display project milestones
- Show Pomodoro sessions as time blocks
- **Holiday Support**: Fetch holiday calendar based on app language

**Holiday Calendars**:
- `en`: US Federal Holidays, UK Bank Holidays
- `zh`: Chinese National Holidays (春节, 国庆节, etc.)
- Auto-switch when app language changes

### 19.2 Holiday Calendar API

**Public Holiday APIs**:
- [Calendarific API](https://calendarific.com/) - Supports 200+ countries
- [Nager.Date API](https://date.nager.at/) - Open-source, free
- Fallback: Embed static JSON file for offline support

**Example API Call**:
```typescript
// Fetch Chinese holidays for 2026
const response = await fetch(
  `https://date.nager.at/api/v3/PublicHolidays/2026/CN`
);

// Returns:
[
  {
    "date": "2026-01-01",
    "localName": "元旦",
    "name": "New Year's Day",
    "countryCode": "CN",
    "fixed": true
  },
  {
    "date": "2026-02-17",
    "localName": "春节",
    "name": "Spring Festival",
    "countryCode": "CN",
    "fixed": false
  }
  // ... more holidays
]
```

### 19.3 Database Schema

```sql
-- Calendar sync configuration
CREATE TABLE IF NOT EXISTS calendar_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('google', 'microsoft', 'ical')),
  calendar_id TEXT NOT NULL,              -- External calendar ID
  access_token TEXT,                      -- OAuth token (encrypted)
  refresh_token TEXT,
  token_expires_at TEXT,
  sync_enabled INTEGER DEFAULT 1,
  last_sync_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Holiday cache
CREATE TABLE IF NOT EXISTS holidays (
  id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL,             -- 'US', 'CN', 'UK', etc.
  date TEXT NOT NULL,                     -- ISO date 'YYYY-MM-DD'
  local_name TEXT NOT NULL,               -- "春节", "Thanksgiving"
  english_name TEXT NOT NULL,             -- "Spring Festival", "Thanksgiving"
  is_public_holiday INTEGER DEFAULT 1,
  year INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),

  UNIQUE(country_code, date)
);

CREATE INDEX idx_holidays_country_year ON holidays(country_code, year);
```

### 19.4 UI: Calendar Widget (Sidebar)

```
┌─────────────────────────────┐
│  📅 CALENDAR                │
│  ───────────────────────── │
│                             │
│  February 2026              │
│  ┌─┬─┬─┬─┬─┬─┬─┐            │
│  │S│M│T│W│T│F│S│            │
│  ├─┼─┼─┼─┼─┼─┼─┤            │
│  │1│2│3│4│5│6│7│            │
│  │8│9│⚫│⚫│⚫│⚫│⚫│         │
│  │ │ │10 11 12 13 14│       │
│  │  Today's tasks (3)       │
│  └─────────────────────────┘│
│                             │
│  🏮 春节 (Spring Festival)  │
│     Feb 17 • Public Holiday │
│                             │
│  📌 Upcoming                │
│  • Task: API Design (Today) │
│  • Milestone: Beta (Feb 15) │
│  • 🏮 春节 (Feb 17)         │
│                             │
│  [Sync with Google Calendar]│
└─────────────────────────────┘
```

### 19.5 Implementation Phases

**Phase 2.1: Holiday Display** (Week 1-2)
- Fetch holidays from public API
- Cache in SQLite database
- Display in calendar widget
- Auto-refresh yearly

**Phase 2.2: Google Calendar Sync** (Week 3-4)
- OAuth2 integration
- Fetch events from user's calendar
- Display in sidebar (read-only)
- Show task due dates on calendar

**Phase 2.3: Outlook Sync** (Week 5-6)
- Microsoft Graph API integration
- Same read-only display

**Phase 2.4: Two-Way Sync** (Future)
- Create calendar events from tasks
- Update task due dates from calendar changes
- Conflict resolution UI

---

## 20. Future Requirements (Backlog)

### 20.1 Multiple Simultaneous Timers (v2)

**Use Case**: Developer working on bug fix while also reviewing code in parallel

**Requirements**:
- Support up to 3 active timers simultaneously
- Each timer linked to different task
- UI shows stacked timer widgets
- Total time displayed at top (sum of all active timers)
- Pomodoro timer remains single-focus (only one Pomodoro at a time)

**Database Support**: Already compatible (time_logs table supports multiple rows with `end_time = NULL`)

**UI Mockup**:
```
┌─────────────────────────────┐
│  ⏱ ACTIVE TIMERS (3)        │
│  ───────────────────────── │
│  🍅 API Design         24:35│
│     (Pomodoro - paused)     │
│  [⏸][⏹]                     │
│                             │
│  ⏱ Code Review         1:12│
│     (Simple timer)          │
│  [⏸][⏹]                     │
│                             │
│  ⏱ Bug Fix           00:45 │
│     (Simple timer)          │
│  [⏸][⏹]                     │
│                             │
│  Total: 26:32               │
└─────────────────────────────┘
```

**Complexity**: Medium (UI changes, validation to prevent timer conflicts)

**Priority**: Nice-to-have (review after v1 user feedback)

---

## 21. Related Documents

- @PRD-001-Master.md — Master PRD
- @PRD-002-DataModel.md — Database schema
- @PRD-006-Dashboard.md — Portfolio dashboard (navigation source)
- @PRD-007-Reporting.md — Time reports integration
- @PRD-008-Governance.md — Audit logging

---

*End of PRD-011*
