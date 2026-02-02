# My Work View - Technical Architecture Blueprint

| Document | Value |
|----------|-------|
| **Status** | Draft |
| **Date** | 2026-02-01 |
| **Related PRD** | @PRD-011-MyWork.md |

---

## 1. Architecture Overview

### 1.1 System Context

```
┌─────────────────────────────────────────────────────────────┐
│                    My Work View (React)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  Todo List     │  │  Time Tracker  │  │  Pomodoro    │  │
│  │  Component     │  │  Component     │  │  Timer       │  │
│  └───────┬────────┘  └───────┬────────┘  └──────┬───────┘  │
│          │                   │                  │          │
│          └───────────────────┴──────────────────┘          │
│                              │                             │
│                     ┌────────▼─────────┐                   │
│                     │  useMyWorkStore  │                   │
│                     │  (Zustand)       │                   │
│                     └────────┬─────────┘                   │
│                              │                             │
└──────────────────────────────┼─────────────────────────────┘
                               │ IPC
                ┌──────────────▼──────────────┐
                │   Electron Main Process     │
                │   ┌─────────────────────┐   │
                │   │  IPC Handlers       │   │
                │   ├─────────────────────┤   │
                │   │  - mywork:*         │   │
                │   │  - timelog:*        │   │
                │   │  - pomodoro:*       │   │
                │   └──────────┬──────────┘   │
                │              │              │
                │   ┌──────────▼──────────┐   │
                │   │  Database Layer     │   │
                │   │  (better-sqlite3)   │   │
                │   └──────────┬──────────┘   │
                └──────────────┼──────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  SQLite Database    │
                    │  - items            │
                    │  - time_logs        │
                    │  - pomodoro_sessions│
                    │  - user_preferences │
                    └─────────────────────┘
```

### 1.2 Data Flow Patterns

**Read Flow (Optimistic Query)**:
```
1. Component mounts
2. useMyWorkStore.fetchTodos()
3. Store checks cache (if < 30s old, use cached data)
4. If cache miss: invoke('mywork:getTodos', userId)
5. IPC handler queries SQLite
6. Response → Store updates → Component re-renders
```

**Write Flow (Optimistic Update)**:
```
1. User clicks "Mark Done" on task
2. Store updates local state immediately (UI updates)
3. invoke('mywork:markDone', { itemId, userId })
4. IPC handler validates + executes
5. On success: Store confirms
6. On error: Store rollback + show error toast
```

**Timer Flow (Active State Management)**:
```
1. User starts Pomodoro on task
2. Store creates activePomodoro state
3. invoke('timelog:start') + invoke('pomodoro:start')
4. Browser setInterval() updates countdown every second
5. On timer expiry:
   - Store triggers desktop notification
   - invoke('pomodoro:complete')
   - invoke('timelog:stop')
   - Store transitions to break state
```

---

## 2. Database Schema Design

### 2.1 Migration Script

Create migration file: `src/main/database/migrations/004_my_work.sql`

```sql
-- Migration 004: My Work - Time Tracking & Pomodoro

-- Time Logs Table
CREATE TABLE IF NOT EXISTS time_logs (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  start_time TEXT NOT NULL,                    -- ISO 8601 datetime
  end_time TEXT,                                -- NULL if in progress
  duration_minutes INTEGER,                     -- Calculated field
  log_type TEXT NOT NULL CHECK(log_type IN ('manual', 'timer', 'pomodoro')),
  pomodoro_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE INDEX idx_time_logs_item ON time_logs(item_id);
CREATE INDEX idx_time_logs_user ON time_logs(user_id);
CREATE INDEX idx_time_logs_start_time ON time_logs(start_time);
CREATE INDEX idx_time_logs_user_date ON time_logs(user_id, start_time);

-- Pomodoro Sessions Table
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id TEXT PRIMARY KEY,
  time_log_id TEXT NOT NULL,
  session_number INTEGER NOT NULL,
  session_type TEXT NOT NULL CHECK(session_type IN ('work', 'short_break', 'long_break')),
  duration_minutes INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  interrupted INTEGER DEFAULT 0,                -- Boolean: 0 or 1
  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (time_log_id) REFERENCES time_logs(id) ON DELETE CASCADE
);

CREATE INDEX idx_pomodoro_time_log ON pomodoro_sessions(time_log_id);
CREATE INDEX idx_pomodoro_started_at ON pomodoro_sessions(started_at);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,

  -- Pomodoro Settings
  pomodoro_work_duration INTEGER DEFAULT 25,
  pomodoro_short_break INTEGER DEFAULT 5,
  pomodoro_long_break INTEGER DEFAULT 15,
  pomodoro_sessions_before_long INTEGER DEFAULT 4,

  -- Time Tracking
  daily_time_target INTEGER DEFAULT 480,        -- 8 hours in minutes
  enable_desktop_notifications INTEGER DEFAULT 1,
  notification_sound INTEGER DEFAULT 1,
  auto_start_breaks INTEGER DEFAULT 0,

  -- Todo Settings
  default_group_by TEXT DEFAULT 'project',
  default_sort_by TEXT DEFAULT 'due_date',
  show_completed_tasks INTEGER DEFAULT 0,

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Extend Items Table
ALTER TABLE items ADD COLUMN estimated_minutes INTEGER;
ALTER TABLE items ADD COLUMN assigned_to TEXT;

-- Create trigger to update time_logs.updated_at
CREATE TRIGGER IF NOT EXISTS time_logs_updated_at
AFTER UPDATE ON time_logs
FOR EACH ROW
BEGIN
  UPDATE time_logs SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Audit log entries for time tracking
INSERT INTO audit_log (id, entity_type, entity_id, action, source, created_at)
SELECT
  lower(hex(randomblob(16))),
  'Migration',
  '004',
  'create',
  'system',
  datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE entity_id = '004' AND entity_type = 'Migration');
```

### 2.2 Database Indexes Strategy

**Query Patterns**:
1. **Fetch todos for user**: `WHERE assigned_to = ?` → Index on `items.assigned_to`
2. **Fetch today's logs**: `WHERE user_id = ? AND DATE(start_time) = DATE('now')` → Composite index `(user_id, start_time)`
3. **Fetch weekly summary**: `WHERE user_id = ? AND start_time BETWEEN ? AND ?` → Same composite index
4. **Active timers**: `WHERE user_id = ? AND end_time IS NULL` → Partial index

```sql
-- Additional optimizations
CREATE INDEX idx_items_assigned_to ON items(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_time_logs_active ON time_logs(user_id) WHERE end_time IS NULL;
```

### 2.3 Sample Data for Testing

```sql
-- Insert test user preferences
INSERT INTO user_preferences (user_id) VALUES ('test-user-001');

-- Insert test tasks with estimates
UPDATE items SET assigned_to = 'test-user-001', estimated_minutes = 120 WHERE id IN (
  SELECT id FROM items WHERE type = 'Task' LIMIT 10
);

-- Insert sample time logs
INSERT INTO time_logs (id, item_id, user_id, start_time, end_time, duration_minutes, log_type, pomodoro_count)
VALUES
  ('log-001', (SELECT id FROM items LIMIT 1), 'test-user-001', datetime('now', '-3 hours'), datetime('now', '-1 hours'), 120, 'pomodoro', 5),
  ('log-002', (SELECT id FROM items LIMIT 1 OFFSET 1), 'test-user-001', datetime('now', '-30 minutes'), NULL, NULL, 'timer', 0);
```

---

## 3. Frontend Architecture

### 3.1 Component Hierarchy

```
src/renderer/
├── features/
│   └── my-work/
│       ├── MyWorkPage.tsx                    # Page container
│       ├── components/
│       │   ├── QuickStats/
│       │   │   ├── StatsBar.tsx              # Top stats summary
│       │   │   └── StatCard.tsx              # Individual stat card
│       │   ├── TodoList/
│       │   │   ├── TodoListContainer.tsx     # Main todo list
│       │   │   ├── TodoFilters.tsx           # Group/sort/filter controls
│       │   │   ├── TodoGroup.tsx             # Collapsible group
│       │   │   ├── TodoItem.tsx              # Task card
│       │   │   └── QuickTaskInput.tsx        # "+ Add Quick Task"
│       │   └── TimeTracker/
│       │       ├── TrackerSidebar.tsx        # Right sidebar
│       │       ├── PomodoroTimer/
│       │       │   ├── TimerWidget.tsx       # Timer display
│       │       │   ├── TimerControls.tsx     # Buttons
│       │       │   └── SessionIndicator.tsx  # 🍅🍅🍅○ display
│       │       ├── TodayLog/
│       │       │   ├── LogSummary.tsx        # Today's entries
│       │       │   ├── LogEntry.tsx          # Single entry
│       │       │   └── ManualLogDialog.tsx   # Manual entry form
│       │       └── WeeklySummary/
│       │           ├── WeeklyChart.tsx       # Bar chart
│       │           └── TargetProgress.tsx    # Progress bar
│       ├── hooks/
│       │   ├── useMyWork.ts                  # Main data hook
│       │   ├── usePomodoroTimer.ts           # Timer logic
│       │   └── useDesktopNotifications.ts    # Notification API
│       └── utils/
│           ├── timeFormatters.ts             # "2.5h", "02:30:45"
│           ├── groupTodos.ts                 # Grouping logic
│           └── pomodoroSequence.ts           # Session sequence logic
├── stores/
│   └── useMyWorkStore.ts                     # Zustand store
└── lib/
    └── ipc/
        ├── myWorkIPC.ts                      # Typed IPC wrappers
        └── types.ts                          # Shared types
```

### 3.2 Zustand Store Implementation

**File**: `src/renderer/stores/useMyWorkStore.ts`

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { invoke } from '@/lib/ipc';

interface MyWorkState {
  // Data
  todos: Map<string, TodoItem>;
  activeLogs: Map<string, TimeLog>;
  todayLogs: TimeLog[];
  weeklyLogs: WeeklySummary | null;
  activePomodoro: PomodoroSession | null;
  stats: QuickStats | null;

  // UI State
  groupBy: GroupByOption;
  sortBy: SortByOption;
  filterStatus: FilterOption;
  loading: boolean;
  error: string | null;

  // Actions
  fetchTodos: () => Promise<void>;
  updateGrouping: (groupBy: GroupByOption) => void;
  updateSorting: (sortBy: SortByOption) => void;
  updateFilter: (filter: FilterOption) => void;
  markDone: (todoId: string) => Promise<void>;

  // Time Logging
  startTimer: (itemId: string, usePomodoro: boolean) => Promise<void>;
  stopTimer: (timeLogId: string, notes?: string) => Promise<void>;
  logManualTime: (entry: ManualTimeEntry) => Promise<void>;
  fetchTodayLogs: () => Promise<void>;
  fetchWeeklySummary: () => Promise<void>;

  // Pomodoro
  startPomodoro: (itemId: string) => Promise<void>;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  stopPomodoro: () => Promise<void>;
  skipBreak: () => void;
  _tickPomodoro: () => void;  // Internal: called by interval

  // Preferences
  fetchPreferences: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
}

export const useMyWorkStore = create<MyWorkState>()(
  immer((set, get) => ({
    // Initial State
    todos: new Map(),
    activeLogs: new Map(),
    todayLogs: [],
    weeklyLogs: null,
    activePomodoro: null,
    stats: null,
    groupBy: 'project',
    sortBy: 'due_date',
    filterStatus: 'all',
    loading: false,
    error: null,

    // Fetch Todos
    fetchTodos: async () => {
      set({ loading: true, error: null });
      try {
        const result = await invoke('mywork:getTodos', { userId: 'current-user' });
        if (result.success) {
          set((state) => {
            state.todos = new Map(result.data.map((t: TodoItem) => [t.id, t]));
            state.loading = false;
          });
          get().fetchQuickStats();
        } else {
          set({ error: result.error, loading: false });
        }
      } catch (error) {
        set({ error: error.message, loading: false });
      }
    },

    // Update Grouping
    updateGrouping: (groupBy) => {
      set({ groupBy });
    },

    // Update Sorting
    updateSorting: (sortBy) => {
      set({ sortBy });
    },

    // Update Filter
    updateFilter: (filter) => {
      set({ filterStatus: filter });
    },

    // Mark Todo Done
    markDone: async (todoId) => {
      // Optimistic update
      const todo = get().todos.get(todoId);
      if (!todo) return;

      set((state) => {
        const updated = { ...todo, status: 'done' as const };
        state.todos.set(todoId, updated);
      });

      try {
        const result = await invoke('mywork:markDone', {
          itemId: todoId,
          userId: 'current-user',
        });

        if (!result.success) {
          // Rollback
          set((state) => {
            state.todos.set(todoId, todo);
            state.error = result.error;
          });
        } else {
          get().fetchQuickStats();
        }
      } catch (error) {
        // Rollback
        set((state) => {
          state.todos.set(todoId, todo);
          state.error = error.message;
        });
      }
    },

    // Start Timer
    startTimer: async (itemId, usePomodoro) => {
      if (usePomodoro) {
        await get().startPomodoro(itemId);
      } else {
        const result = await invoke('timelog:start', {
          itemId,
          userId: 'current-user',
          logType: 'timer',
        });

        if (result.success) {
          set((state) => {
            state.activeLogs.set(result.data.logId, {
              id: result.data.logId,
              itemId,
              startTime: new Date(),
              endTime: null,
              isActive: true,
            });
          });
        }
      }
    },

    // Stop Timer
    stopTimer: async (timeLogId, notes) => {
      const result = await invoke('timelog:stop', { logId: timeLogId, notes });

      if (result.success) {
        set((state) => {
          state.activeLogs.delete(timeLogId);
        });
        await get().fetchTodayLogs();
        await get().fetchQuickStats();
      }
    },

    // Log Manual Time
    logManualTime: async (entry) => {
      const result = await invoke('timelog:logManual', entry);
      if (result.success) {
        await get().fetchTodayLogs();
        await get().fetchQuickStats();
      }
    },

    // Fetch Today's Logs
    fetchTodayLogs: async () => {
      const result = await invoke('timelog:getToday', { userId: 'current-user' });
      if (result.success) {
        set({ todayLogs: result.data });
      }
    },

    // Fetch Weekly Summary
    fetchWeeklySummary: async () => {
      const result = await invoke('timelog:getWeeklySummary', {
        userId: 'current-user',
      });
      if (result.success) {
        set({ weeklyLogs: result.data });
      }
    },

    // Start Pomodoro
    startPomodoro: async (itemId) => {
      // First create time log
      const logResult = await invoke('timelog:start', {
        itemId,
        userId: 'current-user',
        logType: 'pomodoro',
      });

      if (!logResult.success) return;

      // Then create pomodoro session
      const sessionResult = await invoke('pomodoro:start', {
        timeLogId: logResult.data.logId,
        sessionType: 'work',
        durationMinutes: 25, // TODO: Get from preferences
      });

      if (sessionResult.success) {
        const todo = get().todos.get(itemId);
        set({
          activePomodoro: {
            id: sessionResult.data.sessionId,
            timeLogId: logResult.data.logId,
            itemId,
            itemName: todo?.name || '',
            sessionNumber: 1,
            sessionType: 'work',
            durationMinutes: 25,
            remainingSeconds: 25 * 60,
            startedAt: new Date(),
            isPaused: false,
          },
        });

        // Start countdown interval
        startPomodoroInterval();
      }
    },

    // Pause Pomodoro
    pausePomodoro: () => {
      set((state) => {
        if (state.activePomodoro) {
          state.activePomodoro.isPaused = true;
        }
      });
    },

    // Resume Pomodoro
    resumePomodoro: () => {
      set((state) => {
        if (state.activePomodoro) {
          state.activePomodoro.isPaused = false;
        }
      });
    },

    // Stop Pomodoro
    stopPomodoro: async () => {
      const { activePomodoro } = get();
      if (!activePomodoro) return;

      await invoke('pomodoro:complete', {
        sessionId: activePomodoro.id,
        interrupted: true,
      });

      await invoke('timelog:stop', { logId: activePomodoro.timeLogId });

      set({ activePomodoro: null });
      stopPomodoroInterval();
      await get().fetchTodayLogs();
    },

    // Skip Break
    skipBreak: () => {
      const { activePomodoro } = get();
      if (!activePomodoro || activePomodoro.sessionType === 'work') return;

      // Mark break as interrupted and start next work session
      invoke('pomodoro:complete', {
        sessionId: activePomodoro.id,
        interrupted: true,
      });

      // Start new work session
      const nextSessionNumber = activePomodoro.sessionNumber + 1;
      get().startPomodoro(activePomodoro.itemId);
    },

    // Internal: Tick Pomodoro (called every second)
    _tickPomodoro: () => {
      set((state) => {
        if (state.activePomodoro && !state.activePomodoro.isPaused) {
          state.activePomodoro.remainingSeconds -= 1;

          // Timer expired
          if (state.activePomodoro.remainingSeconds <= 0) {
            handlePomodoroComplete(state.activePomodoro);
          }
        }
      });
    },

    // Fetch Quick Stats
    fetchQuickStats: async () => {
      // TODO: Implement stats aggregation
    },

    // Fetch Preferences
    fetchPreferences: async () => {
      // TODO: Implement
    },

    // Update Preferences
    updatePreferences: async (prefs) => {
      // TODO: Implement
    },
  }))
);

// Interval management (outside store)
let pomodoroIntervalId: number | null = null;

function startPomodoroInterval() {
  if (pomodoroIntervalId) clearInterval(pomodoroIntervalId);

  pomodoroIntervalId = window.setInterval(() => {
    useMyWorkStore.getState()._tickPomodoro();
  }, 1000);
}

function stopPomodoroInterval() {
  if (pomodoroIntervalId) {
    clearInterval(pomodoroIntervalId);
    pomodoroIntervalId = null;
  }
}

async function handlePomodoroComplete(session: PomodoroSession) {
  // Mark session complete
  await invoke('pomodoro:complete', {
    sessionId: session.id,
    interrupted: false,
  });

  // Stop time log
  await invoke('timelog:stop', { logId: session.timeLogId });

  // Show notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Pomodoro Complete! 🍅', {
      body: 'Great work! Time for a break.',
    });
  }

  // Determine next session type
  const nextType =
    session.sessionNumber % 4 === 0 ? 'long_break' : 'short_break';
  const nextDuration = nextType === 'long_break' ? 15 : 5;

  // Auto-start break (if enabled in preferences)
  // TODO: Check user preferences
  const autoStartBreak = false;

  if (autoStartBreak) {
    // Start break session
    // TODO: Implement break session logic
  } else {
    // Clear active pomodoro
    useMyWorkStore.setState({ activePomodoro: null });
    stopPomodoroInterval();
  }

  // Refresh logs
  await useMyWorkStore.getState().fetchTodayLogs();
  await useMyWorkStore.getState().fetchQuickStats();
}
```

### 3.3 Custom Hooks

**File**: `src/renderer/features/my-work/hooks/usePomodoroTimer.ts`

```typescript
import { useEffect } from 'react';
import { useMyWorkStore } from '@/stores/useMyWorkStore';

export function usePomodoroTimer() {
  const activePomodoro = useMyWorkStore((state) => state.activePomodoro);
  const pausePomodoro = useMyWorkStore((state) => state.pausePomodoro);
  const resumePomodoro = useMyWorkStore((state) => state.resumePomodoro);
  const stopPomodoro = useMyWorkStore((state) => state.stopPomodoro);
  const skipBreak = useMyWorkStore((state) => state.skipBreak);

  // Format remaining time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = activePomodoro
    ? ((activePomodoro.durationMinutes * 60 - activePomodoro.remainingSeconds) /
        (activePomodoro.durationMinutes * 60)) *
      100
    : 0;

  return {
    activePomodoro,
    formattedTime: activePomodoro
      ? formatTime(activePomodoro.remainingSeconds)
      : '00:00',
    progress,
    isPaused: activePomodoro?.isPaused || false,
    isBreak: activePomodoro?.sessionType !== 'work',
    pausePomodoro,
    resumePomodoro,
    stopPomodoro,
    skipBreak,
  };
}
```

**File**: `src/renderer/features/my-work/hooks/useDesktopNotifications.ts`

```typescript
import { useEffect } from 'react';

export function useDesktopNotifications() {
  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const showNotification = (title: string, body: string, actions?: NotificationAction[]) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon.png',
        badge: '/badge.png',
        tag: 'pomodoro-timer',
        requireInteraction: true,
      });

      // TODO: Handle action clicks
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    }
  };

  return { showNotification };
}
```

---

## 4. IPC Layer Implementation

### 4.1 Handler Registration

**File**: `src/main/ipc/myWorkHandlers.ts`

```typescript
import { ipcMain } from 'electron';
import { db } from '../database';
import { generateId } from '../utils/idGenerator';
import { auditLog } from '../database/audit';

export function registerMyWorkHandlers() {
  // Get todos for user
  ipcMain.handle('mywork:getTodos', async (event, { userId }) => {
    try {
      const todos = db
        .prepare(
          `
        SELECT
          i.id, i.name, i.status, i.priority,
          i.end_date as dueDate,
          i.estimated_minutes as estimatedMinutes,
          i.assigned_to as assignedTo,
          p.id as projectId, p.name as projectName,
          COALESCE(SUM(tl.duration_minutes), 0) as loggedMinutes,
          CASE WHEN i.end_date < DATE('now') THEN 1 ELSE 0 END as isOverdue
        FROM items i
        INNER JOIN projects p ON i.project_id = p.id
        LEFT JOIN time_logs tl ON i.id = tl.item_id
        WHERE i.assigned_to = ? AND i.status != 'Done'
        GROUP BY i.id
        ORDER BY
          CASE WHEN i.end_date < DATE('now') THEN 0 ELSE 1 END,
          i.end_date ASC NULLS LAST
      `
        )
        .all(userId);

      return { success: true, data: todos };
    } catch (error) {
      console.error('mywork:getTodos error:', error);
      return { success: false, error: error.message };
    }
  });

  // Mark task done
  ipcMain.handle('mywork:markDone', async (event, { itemId, userId }) => {
    try {
      const item = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);

      db.prepare(
        `
        UPDATE items
        SET status = 'Done', updated_at = datetime('now')
        WHERE id = ? AND assigned_to = ?
      `
      ).run(itemId, userId);

      await auditLog('update', 'Item', itemId, { status: 'Done' }, userId);

      return { success: true };
    } catch (error) {
      console.error('mywork:markDone error:', error);
      return { success: false, error: error.message };
    }
  });

  // Start timer
  ipcMain.handle('timelog:start', async (event, { itemId, userId, logType }) => {
    try {
      const logId = generateId();

      db.prepare(
        `
        INSERT INTO time_logs (id, item_id, user_id, start_time, log_type)
        VALUES (?, ?, ?, datetime('now'), ?)
      `
      ).run(logId, itemId, userId, logType);

      await auditLog('create', 'TimeLog', logId, { itemId, logType }, userId);

      return { success: true, data: { logId } };
    } catch (error) {
      console.error('timelog:start error:', error);
      return { success: false, error: error.message };
    }
  });

  // Stop timer
  ipcMain.handle('timelog:stop', async (event, { logId, notes }) => {
    try {
      db.prepare(
        `
        UPDATE time_logs
        SET
          end_time = datetime('now'),
          duration_minutes = CAST(
            (julianday(datetime('now')) - julianday(start_time)) * 1440 AS INTEGER
          ),
          notes = ?
        WHERE id = ?
      `
      ).run(notes || null, logId);

      await auditLog('update', 'TimeLog', logId, { status: 'completed' }, 'system');

      return { success: true };
    } catch (error) {
      console.error('timelog:stop error:', error);
      return { success: false, error: error.message };
    }
  });

  // Log manual time
  ipcMain.handle('timelog:logManual', async (event, entry) => {
    try {
      const logId = generateId();

      db.prepare(
        `
        INSERT INTO time_logs (
          id, item_id, user_id, start_time, end_time,
          duration_minutes, log_type, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, 'manual', ?)
      `
      ).run(
        logId,
        entry.itemId,
        entry.userId,
        entry.startTime,
        entry.endTime,
        entry.durationMinutes,
        entry.notes || null
      );

      await auditLog('create', 'TimeLog', logId, entry, entry.userId);

      return { success: true, data: { logId } };
    } catch (error) {
      console.error('timelog:logManual error:', error);
      return { success: false, error: error.message };
    }
  });

  // Get today's logs
  ipcMain.handle('timelog:getToday', async (event, { userId }) => {
    try {
      const logs = db
        .prepare(
          `
        SELECT
          tl.id, tl.item_id as itemId, i.name as itemName,
          p.name as projectName,
          tl.start_time as startTime, tl.end_time as endTime,
          tl.duration_minutes as durationMinutes,
          tl.log_type as logType,
          tl.pomodoro_count as pomodoroCount,
          tl.notes
        FROM time_logs tl
        INNER JOIN items i ON tl.item_id = i.id
        INNER JOIN projects p ON i.project_id = p.id
        WHERE tl.user_id = ? AND DATE(tl.start_time) = DATE('now')
        ORDER BY tl.start_time DESC
      `
        )
        .all(userId);

      return { success: true, data: logs };
    } catch (error) {
      console.error('timelog:getToday error:', error);
      return { success: false, error: error.message };
    }
  });

  // Get weekly summary
  ipcMain.handle('timelog:getWeeklySummary', async (event, { userId }) => {
    try {
      const days = db
        .prepare(
          `
        SELECT
          DATE(start_time) as date,
          SUM(duration_minutes) as totalMinutes,
          SUM(pomodoro_count) as pomodoroCount
        FROM time_logs
        WHERE user_id = ?
          AND start_time >= DATE('now', 'weekday 0', '-6 days')
        GROUP BY DATE(start_time)
        ORDER BY date ASC
      `
        )
        .all(userId);

      return { success: true, data: days };
    } catch (error) {
      console.error('timelog:getWeeklySummary error:', error);
      return { success: false, error: error.message };
    }
  });

  // Start pomodoro session
  ipcMain.handle(
    'pomodoro:start',
    async (event, { timeLogId, sessionType, durationMinutes }) => {
      try {
        const sessionId = generateId();

        // Get next session number
        const lastSession = db
          .prepare(
            `
          SELECT session_number
          FROM pomodoro_sessions
          WHERE time_log_id = ?
          ORDER BY session_number DESC
          LIMIT 1
        `
          )
          .get(timeLogId);

        const sessionNumber = lastSession ? lastSession.session_number + 1 : 1;

        db.prepare(
          `
          INSERT INTO pomodoro_sessions (
            id, time_log_id, session_number, session_type,
            duration_minutes, started_at
          )
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `
        ).run(sessionId, timeLogId, sessionNumber, sessionType, durationMinutes);

        return { success: true, data: { sessionId } };
      } catch (error) {
        console.error('pomodoro:start error:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Complete pomodoro session
  ipcMain.handle('pomodoro:complete', async (event, { sessionId, interrupted }) => {
    try {
      const session = db
        .prepare('SELECT * FROM pomodoro_sessions WHERE id = ?')
        .get(sessionId);

      db.prepare(
        `
        UPDATE pomodoro_sessions
        SET completed_at = datetime('now'), interrupted = ?
        WHERE id = ?
      `
      ).run(interrupted ? 1 : 0, sessionId);

      // Increment pomodoro count if work session completed successfully
      if (session.session_type === 'work' && !interrupted) {
        db.prepare(
          `
          UPDATE time_logs
          SET pomodoro_count = pomodoro_count + 1
          WHERE id = ?
        `
        ).run(session.time_log_id);
      }

      return { success: true };
    } catch (error) {
      console.error('pomodoro:complete error:', error);
      return { success: false, error: error.message };
    }
  });
}
```

---

## 5. UI Component Examples

### 5.1 Timer Widget Component

**File**: `src/renderer/features/my-work/components/TimeTracker/PomodoroTimer/TimerWidget.tsx`

```typescript
import { usePomodoroTimer } from '../../../hooks/usePomodoroTimer';
import { CircularProgress } from '@/components/ui/circular-progress';

export function TimerWidget() {
  const {
    activePomodoro,
    formattedTime,
    progress,
    isPaused,
    isBreak,
    pausePomodoro,
    resumePomodoro,
    stopPomodoro,
    skipBreak,
  } = usePomodoroTimer();

  if (!activePomodoro) {
    return (
      <div className="text-center text-slate-500 py-8">
        <p>No active timer</p>
        <p className="text-sm mt-2">Start a task to begin tracking time</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="text-center mb-4">
        <h3 className="font-semibold text-slate-900 mb-1">
          {isBreak ? '☕ Break Time' : '🍅 Focus Time'}
        </h3>
        <p className="text-sm text-slate-600">{activePomodoro.itemName}</p>
      </div>

      <div className="flex justify-center mb-6">
        <CircularProgress value={progress} size={180}>
          <div className="text-center">
            <div className="text-4xl font-bold text-slate-900">
              {formattedTime}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {isPaused ? 'Paused' : isBreak ? 'Break' : 'Working'}
            </div>
          </div>
        </CircularProgress>
      </div>

      <div className="flex gap-2">
        {isPaused ? (
          <button
            onClick={resumePomodoro}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            ▶ Resume
          </button>
        ) : (
          <button
            onClick={pausePomodoro}
            className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
          >
            ⏸ Pause
          </button>
        )}

        <button
          onClick={stopPomodoro}
          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
        >
          ⏹ Stop
        </button>
      </div>

      {isBreak && (
        <button
          onClick={skipBreak}
          className="w-full mt-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-sm"
        >
          Skip Break
        </button>
      )}
    </div>
  );
}
```

### 5.2 Todo Item Component

**File**: `src/renderer/features/my-work/components/TodoList/TodoItem.tsx`

```typescript
import { useState } from 'react';
import { useMyWorkStore } from '@/stores/useMyWorkStore';
import { TodoItem as TodoItemType } from '@/lib/ipc/types';
import { ManualLogDialog } from '../TimeTracker/TodayLog/ManualLogDialog';

interface TodoItemProps {
  todo: TodoItemType;
}

export function TodoItem({ todo }: TodoItemProps) {
  const [showLogDialog, setShowLogDialog] = useState(false);
  const markDone = useMyWorkStore((state) => state.markDone);
  const startTimer = useMyWorkStore((state) => state.startTimer);

  const handleStart = () => {
    // TODO: Show dialog to choose timer vs pomodoro
    startTimer(todo.id, true); // Start Pomodoro by default
  };

  const priorityColors = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={todo.status === 'done'}
          onChange={() => markDone(todo.id)}
          className="mt-1 w-4 h-4"
        />

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 mb-1">{todo.name}</h4>

          <div className="flex items-center gap-3 text-sm text-slate-600 mb-2">
            {todo.dueDate && (
              <span className={todo.isOverdue ? 'text-red-600 font-medium' : ''}>
                📅 {new Date(todo.dueDate).toLocaleDateString()}
              </span>
            )}

            {todo.estimatedMinutes && (
              <span>
                ⏱ Est: {Math.floor(todo.estimatedMinutes / 60)}h{' '}
                {todo.estimatedMinutes % 60}m
              </span>
            )}

            {todo.loggedMinutes > 0 && (
              <span>
                Logged: {Math.floor(todo.loggedMinutes / 60)}h{' '}
                {todo.loggedMinutes % 60}m
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                priorityColors[todo.priority]
              }`}
            >
              {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
            </span>

            {todo.isOverdue && (
              <span className="text-xs text-red-600 font-medium">⚠ Overdue</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleStart}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
        >
          ▶ Start
        </button>

        <button
          onClick={() => setShowLogDialog(true)}
          className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm rounded transition-colors"
        >
          📝 Log
        </button>
      </div>

      {showLogDialog && (
        <ManualLogDialog
          itemId={todo.id}
          itemName={todo.name}
          onClose={() => setShowLogDialog(false)}
        />
      )}
    </div>
  );
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

```typescript
// __tests__/stores/useMyWorkStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useMyWorkStore } from '@/stores/useMyWorkStore';

describe('useMyWorkStore', () => {
  it('should fetch todos and update state', async () => {
    const { result } = renderHook(() => useMyWorkStore());

    await act(async () => {
      await result.current.fetchTodos();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.todos.size).toBeGreaterThan(0);
  });

  it('should mark todo as done optimistically', async () => {
    const { result } = renderHook(() => useMyWorkStore());

    // Setup: fetch todos first
    await act(async () => {
      await result.current.fetchTodos();
    });

    const todoId = Array.from(result.current.todos.keys())[0];

    // Act: mark done
    await act(async () => {
      await result.current.markDone(todoId);
    });

    // Assert: status updated
    expect(result.current.todos.get(todoId)?.status).toBe('done');
  });
});
```

### 6.2 Integration Tests

```typescript
// __tests__/ipc/myWorkHandlers.test.ts
import { db } from '@/main/database';
import { ipcMain } from 'electron';
import { registerMyWorkHandlers } from '@/main/ipc/myWorkHandlers';

describe('My Work IPC Handlers', () => {
  beforeAll(() => {
    registerMyWorkHandlers();
  });

  it('should fetch todos for user', async () => {
    const handler = ipcMain.handle.mock.calls.find(
      ([event]) => event === 'mywork:getTodos'
    )[1];

    const result = await handler(null, { userId: 'test-user-001' });

    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(Array);
  });

  it('should mark task as done', async () => {
    // Insert test task
    const taskId = 'test-task-001';
    db.prepare(
      `INSERT INTO items (id, name, assigned_to, status) VALUES (?, ?, ?, ?)`
    ).run(taskId, 'Test Task', 'test-user-001', 'todo');

    // Call handler
    const handler = ipcMain.handle.mock.calls.find(
      ([event]) => event === 'mywork:markDone'
    )[1];

    const result = await handler(null, { itemId: taskId, userId: 'test-user-001' });

    expect(result.success).toBe(true);

    // Verify in database
    const task = db.prepare('SELECT * FROM items WHERE id = ?').get(taskId);
    expect(task.status).toBe('Done');
  });
});
```

---

## 7. Performance Optimizations

### 7.1 Query Optimization

```sql
-- Use covering index for todo list query
CREATE INDEX idx_todos_covering ON items(
  assigned_to,
  status,
  end_date,
  priority
) WHERE assigned_to IS NOT NULL;

-- Materialized view for daily stats (refresh on demand)
CREATE VIEW v_daily_stats AS
SELECT
  user_id,
  DATE(start_time) as date,
  SUM(duration_minutes) as total_minutes,
  SUM(pomodoro_count) as total_pomodoros,
  COUNT(DISTINCT item_id) as tasks_count
FROM time_logs
GROUP BY user_id, DATE(start_time);
```

### 7.2 Frontend Optimizations

```typescript
// Memoize grouped/sorted todos
import { useMemo } from 'react';

export function useTodoList() {
  const todos = useMyWorkStore((state) => state.todos);
  const groupBy = useMyWorkStore((state) => state.groupBy);
  const sortBy = useMyWorkStore((state) => state.sortBy);

  const groupedTodos = useMemo(() => {
    return groupTodosByOption(Array.from(todos.values()), groupBy, sortBy);
  }, [todos, groupBy, sortBy]);

  return groupedTodos;
}
```

---

## 8. Deployment Checklist

- [ ] Database migration 004 tested locally
- [ ] All IPC handlers registered in `src/main/index.ts`
- [ ] Zustand store integrated with devtools
- [ ] Desktop notification permissions requested on first load
- [ ] Timer interval cleanup on unmount (prevent memory leaks)
- [ ] Time zone handling for logs (store UTC, display local)
- [ ] Error boundaries around timer components
- [ ] E2E tests passing (Playwright)
- [ ] Performance profiling (React DevTools)
- [ ] Accessibility audit (keyboard navigation, ARIA labels)

---

## 9. Implementation Details: Auto-Archive Completed Tasks

### 9.1 Database Changes

```sql
-- Add completed_at timestamp
ALTER TABLE items ADD COLUMN completed_at TEXT;

-- Trigger to auto-set completed_at
CREATE TRIGGER IF NOT EXISTS items_completed_at
AFTER UPDATE OF status ON items
FOR EACH ROW
WHEN NEW.status = 'Done' AND OLD.status != 'Done'
BEGIN
  UPDATE items SET completed_at = datetime('now') WHERE id = NEW.id;
END;

-- Index for performance
CREATE INDEX idx_items_completed_at ON items(completed_at) WHERE completed_at IS NOT NULL;
```

### 9.2 Updated Todo Query (IPC Handler)

```typescript
// src/main/ipc/myWorkHandlers.ts - Update getTodos handler
ipcMain.handle('mywork:getTodos', async (event, { userId, includeArchived }) => {
  try {
    let query = `
      SELECT
        i.id, i.name, i.status, i.priority,
        i.end_date as dueDate,
        i.completed_at as completedAt,
        i.estimated_minutes as estimatedMinutes,
        p.id as projectId, p.name as projectName,
        COALESCE(SUM(tl.duration_minutes), 0) as loggedMinutes
      FROM items i
      INNER JOIN projects p ON i.project_id = p.id
      LEFT JOIN time_logs tl ON i.id = tl.item_id
      WHERE i.assigned_to = ?
    `;

    // Filter logic
    if (!includeArchived) {
      query += ` AND (
        i.status != 'Done'
        OR (i.status = 'Done' AND i.completed_at > datetime('now', '-1 day'))
      )`;
    } else {
      query += ` AND i.status = 'Done' AND i.completed_at <= datetime('now', '-1 day')`;
    }

    query += ` GROUP BY i.id ORDER BY i.status DESC, i.end_date ASC`;

    const todos = db.prepare(query).all(userId);
    return { success: true, data: todos };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

### 9.3 Frontend: Archive Banner

```typescript
// src/renderer/features/my-work/components/TodoList/TodoItem.tsx
export function TodoItem({ todo }: TodoItemProps) {
  const isCompleted = todo.status === 'done';
  const completedAt = todo.completedAt ? new Date(todo.completedAt) : null;
  const hoursUntilArchive = completedAt
    ? Math.max(0, 24 - (Date.now() - completedAt.getTime()) / (1000 * 60 * 60))
    : 0;

  return (
    <div className={isCompleted ? 'opacity-60' : ''}>
      <div className={isCompleted ? 'line-through' : ''}>
        <h4>{todo.name}</h4>
      </div>

      {isCompleted && hoursUntilArchive > 0 && (
        <div className="mt-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded text-xs text-green-700">
          ✓ Completed {formatTimeAgo(completedAt)} • Auto-archives in {hoursUntilArchive.toFixed(1)}h
        </div>
      )}
    </div>
  );
}
```

---

## 10. Implementation Details: Edit Time Logs

### 10.1 Database Schema

```sql
-- Add edit tracking
ALTER TABLE time_logs ADD COLUMN edited_at TEXT;
ALTER TABLE time_logs ADD COLUMN edited_by TEXT;
ALTER TABLE time_logs ADD COLUMN edit_count INTEGER DEFAULT 0;

-- Trigger to track edits
CREATE TRIGGER IF NOT EXISTS time_logs_track_edits
AFTER UPDATE ON time_logs
FOR EACH ROW
WHEN OLD.start_time != NEW.start_time OR OLD.end_time != NEW.end_time OR OLD.notes != NEW.notes
BEGIN
  UPDATE time_logs
  SET
    edited_at = datetime('now'),
    edited_by = NEW.user_id,
    edit_count = OLD.edit_count + 1
  WHERE id = NEW.id;
END;
```

### 10.2 IPC Handler

```typescript
// src/main/ipc/myWorkHandlers.ts
ipcMain.handle('timelog:edit', async (event, { logId, updates, userId }) => {
  try {
    // Fetch original log
    const oldLog = db.prepare('SELECT * FROM time_logs WHERE id = ?').get(logId);

    if (!oldLog) {
      return { success: false, error: 'Time log not found' };
    }

    // Validation
    const startTime = new Date(updates.startTime);
    const endTime = new Date(updates.endTime);

    if (startTime >= endTime) {
      return { success: false, error: 'Start time must be before end time' };
    }

    // Calculate duration
    const durationMinutes = Math.round((endTime - startTime) / 60000);

    // Update
    db.prepare(`
      UPDATE time_logs
      SET
        start_time = ?,
        end_time = ?,
        duration_minutes = ?,
        notes = ?,
        user_id = ?
      WHERE id = ?
    `).run(
      updates.startTime,
      updates.endTime,
      durationMinutes,
      updates.notes || null,
      userId,
      logId
    );

    // Audit trail
    await auditLog('update', 'TimeLog', logId, {
      old: {
        startTime: oldLog.start_time,
        endTime: oldLog.end_time,
        duration: oldLog.duration_minutes,
        notes: oldLog.notes
      },
      new: {
        startTime: updates.startTime,
        endTime: updates.endTime,
        duration: durationMinutes,
        notes: updates.notes
      }
    }, userId);

    return { success: true };
  } catch (error) {
    console.error('timelog:edit error:', error);
    return { success: false, error: error.message };
  }
});
```

### 10.3 Frontend Component

```typescript
// src/renderer/features/my-work/components/TimeTracker/TodayLog/EditTimeLogDialog.tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogActions } from '@/components/ui/dialog';
import { TimeInput } from '@/features/my-work/components/shared/TimeInput';
import { invoke } from '@/lib/ipc';

interface EditTimeLogDialogProps {
  log: TimeLog;
  onClose: () => void;
  onSave: () => void;
}

export function EditTimeLogDialog({ log, onClose, onSave }: EditTimeLogDialogProps) {
  const [startTime, setStartTime] = useState(log.startTime);
  const [endTime, setEndTime] = useState(log.endTime);
  const [notes, setNotes] = useState(log.notes || '');
  const [error, setError] = useState<string | null>(null);

  const calculateDuration = () => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const minutes = Math.round((end - start) / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleSave = async () => {
    setError(null);

    const result = await invoke('timelog:edit', {
      logId: log.id,
      updates: { startTime, endTime, notes },
      userId: 'current-user'
    });

    if (result.success) {
      onSave();
      onClose();
    } else {
      setError(result.error);
    }
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogContent className="max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit Time Log</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Task
            </label>
            <div className="text-sm text-slate-900">{log.itemName}</div>
            <div className="text-xs text-slate-500">{log.projectName}</div>
          </div>

          <TimeInput
            label="Start Time"
            value={startTime}
            onChange={setStartTime}
          />

          <TimeInput
            label="End Time"
            value={endTime}
            onChange={setEndTime}
          />

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-sm text-slate-600">
              Duration: <span className="font-semibold">{calculateDuration()}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="What did you work on?"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {log.editCount > 0 && (
            <div className="text-xs text-slate-500">
              Last edited {formatTimeAgo(log.editedAt)} • {log.editCount} edit(s)
            </div>
          )}
        </div>
      </DialogContent>

      <DialogActions>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Save Changes
        </button>
      </DialogActions>
    </Dialog>
  );
}
```

### 10.4 LogEntry Component with Edit Button

```typescript
// src/renderer/features/my-work/components/TimeTracker/TodayLog/LogEntry.tsx
export function LogEntry({ log }: { log: TimeLog }) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const fetchTodayLogs = useMyWorkStore((state) => state.fetchTodayLogs);

  return (
    <div className="p-3 hover:bg-slate-50 border-b border-slate-100 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-slate-900">{log.itemName}</div>
          <div className="text-xs text-slate-500">{log.projectName}</div>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
            <span>{formatDuration(log.durationMinutes)}</span>
            <span>•</span>
            <span>{formatTimeRange(log.startTime, log.endTime)}</span>
            {log.pomodoroCount > 0 && (
              <>
                <span>•</span>
                <span>{log.pomodoroCount} 🍅</span>
              </>
            )}
          </div>
          {log.notes && (
            <div className="text-xs text-slate-500 mt-1 italic">{log.notes}</div>
          )}
          {log.editCount > 0 && (
            <div className="text-xs text-slate-400 mt-1">
              Edited {log.editCount}x • Last: {formatTimeAgo(log.editedAt)}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowEditDialog(true)}
          className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-slate-600 hover:text-slate-900 transition-opacity"
        >
          ✏️ Edit
        </button>
      </div>

      {showEditDialog && (
        <EditTimeLogDialog
          log={log}
          onClose={() => setShowEditDialog(false)}
          onSave={fetchTodayLogs}
        />
      )}
    </div>
  );
}
```

---

## 11. Implementation Details: Calendar Integration (Phase 2)

### 11.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                 My Work View (Frontend)                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Calendar Widget (Sidebar)                       │   │
│  │  - Mini calendar (current month)                 │   │
│  │  - Holiday indicators                            │   │
│  │  - Upcoming events list                          │   │
│  └───────────────────┬──────────────────────────────┘   │
└────────────────────────┼────────────────────────────────┘
                         │ IPC
         ┌───────────────▼────────────────┐
         │  Calendar Service (Main)       │
         │  - OAuth2 flow                 │
         │  - Token management            │
         │  - Holiday fetcher             │
         └───────────┬────────────────────┘
                     │
      ┌──────────────┼──────────────┐
      │              │              │
┌─────▼──────┐ ┌────▼──────┐ ┌────▼──────────┐
│ Google Cal │ │Outlook API│ │ Holiday API   │
│ (OAuth2)   │ │ (Graph)   │ │ (Nager.Date)  │
└────────────┘ └───────────┘ └───────────────┘
```

### 11.2 Database Schema

```sql
-- Calendar connections
CREATE TABLE IF NOT EXISTS calendar_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('google', 'microsoft', 'ical')),
  calendar_id TEXT NOT NULL,
  calendar_name TEXT,
  access_token TEXT,                      -- Encrypted
  refresh_token TEXT,                     -- Encrypted
  token_expires_at TEXT,
  sync_enabled INTEGER DEFAULT 1,
  last_sync_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Holiday cache
CREATE TABLE IF NOT EXISTS holidays (
  id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL,
  date TEXT NOT NULL,                     -- 'YYYY-MM-DD'
  local_name TEXT NOT NULL,               -- "春节"
  english_name TEXT NOT NULL,             -- "Spring Festival"
  is_public_holiday INTEGER DEFAULT 1,
  year INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(country_code, date)
);

CREATE INDEX idx_holidays_country_year ON holidays(country_code, year);

-- Calendar events cache (read-only)
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  external_id TEXT NOT NULL,              -- Google/Outlook event ID
  summary TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  is_all_day INTEGER DEFAULT 0,
  location TEXT,
  synced_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (connection_id) REFERENCES calendar_connections(id) ON DELETE CASCADE
);

CREATE INDEX idx_calendar_events_start ON calendar_events(start_time);
```

### 11.3 Holiday Service

```typescript
// src/main/services/HolidayService.ts
import axios from 'axios';
import { db } from '../database';

export class HolidayService {
  private readonly API_URL = 'https://date.nager.at/api/v3';

  async fetchHolidays(countryCode: string, year: number): Promise<void> {
    try {
      const response = await axios.get(
        `${this.API_URL}/PublicHolidays/${year}/${countryCode}`
      );

      const holidays = response.data.map((h: any) => ({
        id: `${countryCode}-${h.date}`,
        country_code: countryCode,
        date: h.date,
        local_name: h.localName,
        english_name: h.name,
        is_public_holiday: 1,
        year
      }));

      // Bulk insert (upsert)
      const stmt = db.prepare(`
        INSERT INTO holidays (id, country_code, date, local_name, english_name, is_public_holiday, year)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(country_code, date) DO UPDATE SET
          local_name = excluded.local_name,
          english_name = excluded.english_name
      `);

      const insertMany = db.transaction((holidays) => {
        for (const h of holidays) {
          stmt.run(h.id, h.country_code, h.date, h.local_name, h.english_name, h.is_public_holiday, h.year);
        }
      });

      insertMany(holidays);

      console.log(`Fetched ${holidays.length} holidays for ${countryCode} ${year}`);
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
      throw error;
    }
  }

  getHolidays(countryCode: string, startDate: string, endDate: string) {
    return db.prepare(`
      SELECT * FROM holidays
      WHERE country_code = ?
        AND date BETWEEN ? AND ?
      ORDER BY date ASC
    `).all(countryCode, startDate, endDate);
  }

  getUpcomingHolidays(countryCode: string, limit: number = 5) {
    return db.prepare(`
      SELECT * FROM holidays
      WHERE country_code = ?
        AND date >= DATE('now')
      ORDER BY date ASC
      LIMIT ?
    `).all(countryCode, limit);
  }
}
```

### 11.4 IPC Handlers

```typescript
// src/main/ipc/calendarHandlers.ts
import { HolidayService } from '../services/HolidayService';

const holidayService = new HolidayService();

export function registerCalendarHandlers() {
  // Fetch holidays
  ipcMain.handle('calendar:fetchHolidays', async (event, { countryCode, year }) => {
    try {
      await holidayService.fetchHolidays(countryCode, year);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get holidays for date range
  ipcMain.handle('calendar:getHolidays', async (event, { countryCode, startDate, endDate }) => {
    try {
      const holidays = holidayService.getHolidays(countryCode, startDate, endDate);
      return { success: true, data: holidays };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get upcoming holidays
  ipcMain.handle('calendar:getUpcomingHolidays', async (event, { countryCode, limit }) => {
    try {
      const holidays = holidayService.getUpcomingHolidays(countryCode, limit || 5);
      return { success: true, data: holidays };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
```

### 11.5 Frontend: Calendar Widget

```typescript
// src/renderer/features/my-work/components/CalendarWidget/CalendarWidget.tsx
import { useEffect, useState } from 'react';
import { invoke } from '@/lib/ipc';
import { MiniCalendar } from './MiniCalendar';
import { UpcomingEvents } from './UpcomingEvents';

export function CalendarWidget() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [appLanguage, setAppLanguage] = useState('en'); // Get from app settings

  useEffect(() => {
    // Determine country code based on language
    const countryCode = appLanguage === 'zh' ? 'CN' : 'US';

    // Fetch current year holidays
    const year = new Date().getFullYear();
    invoke('calendar:fetchHolidays', { countryCode, year });

    // Get upcoming holidays
    loadUpcomingHolidays(countryCode);
  }, [appLanguage]);

  const loadUpcomingHolidays = async (countryCode: string) => {
    const result = await invoke('calendar:getUpcomingHolidays', {
      countryCode,
      limit: 5
    });

    if (result.success) {
      setHolidays(result.data);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
        📅 Calendar
      </h3>

      <MiniCalendar holidays={holidays} />

      <UpcomingEvents holidays={holidays} />
    </div>
  );
}
```

### 11.6 Language Detection & Country Mapping

```typescript
// src/renderer/lib/localeUtils.ts
export function getCountryCodeFromLanguage(language: string): string {
  const mapping: Record<string, string> = {
    'zh': 'CN',     // Chinese → China
    'zh-CN': 'CN',
    'zh-TW': 'TW',
    'en': 'US',     // English → United States
    'en-US': 'US',
    'en-GB': 'GB',  // English (UK) → United Kingdom
    'ja': 'JP',     // Japanese → Japan
    'ko': 'KR',     // Korean → South Korea
    'de': 'DE',     // German → Germany
    'fr': 'FR',     // French → France
    'es': 'ES',     // Spanish → Spain
  };

  return mapping[language] || 'US'; // Default to US
}
```

---

## 12. Future Requirements (Backlog)

### 12.1 Multiple Simultaneous Timers (v2)

**Status**: Documented for future implementation (not in v1)

**Use Case**: Advanced users working on multiple tasks in parallel (e.g., developer debugging while reviewing code)

**Requirements**:
- Support up to 3 active timers simultaneously
- Each timer linked to different task
- UI shows stacked timer widgets
- Total time displayed at top (sum of all active timers)
- **Constraint**: Pomodoro timer remains single-focus (only one Pomodoro session at a time)

**Database Support**: ✅ Already compatible
- `time_logs` table supports multiple rows with `end_time = NULL`
- No schema changes needed

**UI Changes Required**:
```typescript
// useMyWorkStore.ts - Change from single to array
interface MyWorkState {
  // Before (v1):
  activeLogs: Map<string, TimeLog>;

  // After (v2):
  activeTimers: TimeLog[];  // Array of active timers (max 3)
}

// Validation in startTimer action:
startTimer: async (itemId, usePomodoro) => {
  const { activeTimers } = get();

  // Enforce limits
  if (usePomodoro && activeTimers.some(t => t.logType === 'pomodoro')) {
    throw new Error('Only one Pomodoro session allowed at a time');
  }

  if (activeTimers.length >= 3) {
    throw new Error('Maximum 3 timers allowed');
  }

  // Proceed with timer creation...
}
```

**UI Mockup**:
```
┌─────────────────────────────┐
│  ⏱ ACTIVE TIMERS (3)        │
│  ───────────────────────── │
│                             │
│  🍅 API Design         24:35│
│     ERP Migration           │
│     [⏸ Pause] [⏹ Stop]     │
│  ────────────────────────── │
│  ⏱ Code Review         1:12│
│     Mobile App              │
│     [⏸ Pause] [⏹ Stop]     │
│  ────────────────────────── │
│  ⏱ Bug Fix           00:45 │
│     Cloud Infrastructure    │
│     [⏸ Pause] [⏹ Stop]     │
│  ────────────────────────── │
│  📊 Total: 26:32            │
└─────────────────────────────┘
```

**Implementation Complexity**: Medium
- Frontend: Moderate (UI refactor for multiple timers)
- Backend: Low (already supports multiple logs)
- Risk: User confusion (when to use parallel vs. sequential)

**User Feedback Needed**: Validate demand before implementing

**Priority**: Low (Nice-to-have, not critical for v1)

---

## 13. Future Enhancements (Post-MVP)

1. ✅ **Calendar Integration** (Phase 2 - detailed above)
2. **Mobile App**: React Native companion for on-the-go time tracking
3. **Team View**: See team members' time logs (with permission)
4. **Smart Estimates**: AI suggests estimated time based on historical data
5. **Focus Analytics**: Track when you're most productive (time of day heatmap)
6. **Spotify Integration**: Auto-play focus playlist when timer starts
7. ✅ **Multiple Timers** (v2 - documented above)

---

*End of Blueprint*
