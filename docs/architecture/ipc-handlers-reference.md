# My Work IPC Handlers Reference

**File**: `src/main/ipc/myWorkHandlers.ts`
**Registered**: Automatically in `src/main/ipc/handlers.ts`
**Date**: 2026-02-01

---

## 📋 Todo List Handlers

### `mywork:getTodos`
Fetch all todos assigned to a user with 24h auto-archive support.

**Parameters**:
```typescript
{
  userId: string;
  includeArchived?: boolean; // default: false
}
```

**Returns**:
```typescript
{
  success: boolean;
  data?: TodoItem[];
  error?: string;
}

interface TodoItem {
  id: number;
  uuid: string;
  name: string;
  projectId: number;
  projectName: string;
  status: string;
  priority: string;
  dueDate: string | null;
  estimatedMinutes: number | null;
  loggedMinutes: number;
  assignedTo: string;
  completedAt: string | null;
  isOverdue: boolean;
}
```

**Example**:
```typescript
const result = await invoke('mywork:getTodos', { userId: 'current-user' });
if (result.success) {
  console.log(`Found ${result.data.length} todos`);
}
```

---

### `mywork:markDone`
Mark a work item as done (trigger auto-sets `completed_at`).

**Parameters**:
```typescript
{
  itemId: number;
  userId: string;
}
```

**Returns**:
```typescript
{ success: boolean; error?: string }
```

**Example**:
```typescript
await invoke('mywork:markDone', { itemId: 123, userId: 'current-user' });
```

---

### `mywork:addQuickTask`
Create a quick task from the todo list.

**Parameters**:
```typescript
{
  projectId: number;
  title: string;
  userId: string;
}
```

**Returns**:
```typescript
{
  success: boolean;
  data?: { id: number; uuid: string };
  error?: string;
}
```

**Example**:
```typescript
const result = await invoke('mywork:addQuickTask', {
  projectId: 1,
  title: 'Review PR #42',
  userId: 'current-user'
});
```

---

## ⏱ Time Logging Handlers

### `timelog:start`
Start a timer on a work item.

**Parameters**:
```typescript
{
  workItemId: number;
  userId: string;
  logType?: 'manual' | 'timer' | 'pomodoro'; // default: 'timer'
}
```

**Returns**:
```typescript
{
  success: boolean;
  data?: { logId: number; uuid: string };
  error?: string;
}
```

**Validation**:
- Only one active timer per user allowed
- Returns error if user already has active timer

**Example**:
```typescript
const result = await invoke('timelog:start', {
  workItemId: 456,
  userId: 'current-user',
  logType: 'pomodoro'
});
// result.data.logId => use this to stop timer later
```

---

### `timelog:stop`
Stop a running timer.

**Parameters**:
```typescript
{
  logId: number;
  notes?: string;
}
```

**Returns**:
```typescript
{
  success: boolean;
  data?: { duration: number }; // duration in minutes
  error?: string;
}
```

**Example**:
```typescript
const result = await invoke('timelog:stop', {
  logId: 789,
  notes: 'Fixed authentication bug'
});
console.log(`Worked for ${result.data.duration} minutes`);
```

---

### `timelog:logManual`
Manually log time for a completed task.

**Parameters**:
```typescript
{
  workItemId: number;
  userId: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  durationMinutes: number;
  notes?: string;
}
```

**Returns**:
```typescript
{
  success: boolean;
  data?: { logId: number; uuid: string };
  error?: string;
}
```

**Validation**:
- `startTime` must be before `endTime`

**Example**:
```typescript
const result = await invoke('timelog:logManual', {
  workItemId: 123,
  userId: 'current-user',
  startTime: '2026-02-01T09:00:00Z',
  endTime: '2026-02-01T11:30:00Z',
  durationMinutes: 150,
  notes: 'Code review session'
});
```

---

### `timelog:edit`
Edit an existing time log (implements edit tracking).

**Parameters**:
```typescript
{
  logId: number;
  updates: {
    startTime?: string;
    endTime?: string;
    notes?: string;
  };
  userId: string;
}
```

**Returns**:
```typescript
{ success: boolean; error?: string }
```

**Side Effects**:
- Triggers `time_logs_track_edits` trigger
- Increments `edit_count`
- Sets `edited_at` and `edited_by`
- Creates audit log entry

**Validation**:
- `startTime` must be before `endTime`

**Example**:
```typescript
await invoke('timelog:edit', {
  logId: 789,
  updates: {
    startTime: '2026-02-01T10:00:00Z',
    endTime: '2026-02-01T12:00:00Z',
    notes: 'Updated notes'
  },
  userId: 'current-user'
});
```

---

### `timelog:getToday`
Get all time logs for today.

**Parameters**:
```typescript
{ userId: string }
```

**Returns**:
```typescript
{
  success: boolean;
  data?: TimeLog[];
  error?: string;
}

interface TimeLog {
  id: number;
  uuid: string;
  workItemId: number;
  itemName: string;
  projectName: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  logType: 'manual' | 'timer' | 'pomodoro';
  pomodoroCount: number;
  notes: string | null;
  editCount: number;
  editedAt: string | null;
}
```

**Example**:
```typescript
const result = await invoke('timelog:getToday', { userId: 'current-user' });
const totalMinutes = result.data.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
console.log(`Worked ${totalMinutes / 60}h today`);
```

---

### `timelog:getWeeklySummary`
Get weekly aggregated time logs (Monday-Sunday).

**Parameters**:
```typescript
{ userId: string }
```

**Returns**:
```typescript
{
  success: boolean;
  data?: Array<{
    date: string; // 'YYYY-MM-DD'
    totalMinutes: number;
    pomodoroCount: number;
    tasksCount: number;
  }>;
  error?: string;
}
```

**Example**:
```typescript
const result = await invoke('timelog:getWeeklySummary', { userId: 'current-user' });
result.data.forEach(day => {
  console.log(`${day.date}: ${day.totalMinutes / 60}h (${day.pomodoroCount} 🍅)`);
});
```

---

### `timelog:getActive`
Get currently active timer for a user.

**Parameters**:
```typescript
{ userId: string }
```

**Returns**:
```typescript
{
  success: boolean;
  data?: {
    id: number;
    uuid: string;
    workItemId: number;
    itemName: string;
    projectName: string;
    startTime: string;
    logType: string;
  } | null;
  error?: string;
}
```

**Example**:
```typescript
const result = await invoke('timelog:getActive', { userId: 'current-user' });
if (result.data) {
  console.log(`Active timer: ${result.data.itemName}`);
}
```

---

## 🍅 Pomodoro Handlers

### `pomodoro:start`
Start a Pomodoro session (work/short_break/long_break).

**Parameters**:
```typescript
{
  timeLogId: number;
  sessionType: 'work' | 'short_break' | 'long_break';
  durationMinutes: number;
}
```

**Returns**:
```typescript
{
  success: boolean;
  data?: {
    sessionId: number;
    uuid: string;
    sessionNumber: number;
  };
  error?: string;
}
```

**Example**:
```typescript
const result = await invoke('pomodoro:start', {
  timeLogId: 123,
  sessionType: 'work',
  durationMinutes: 25
});
// result.data.sessionNumber => 1, 2, 3, etc.
```

---

### `pomodoro:complete`
Mark a Pomodoro session as completed.

**Parameters**:
```typescript
{
  sessionId: number;
  interrupted?: boolean; // default: false
}
```

**Returns**:
```typescript
{
  success: boolean;
  data?: {
    sessionType: string;
    sessionNumber: number;
  };
  error?: string;
}
```

**Side Effects**:
- If `sessionType === 'work'` and not interrupted:
  - Increments `time_logs.pomodoro_count`

**Example**:
```typescript
await invoke('pomodoro:complete', {
  sessionId: 456,
  interrupted: false
});
```

---

### `pomodoro:getSessionCount`
Get completed Pomodoro count for a time log.

**Parameters**:
```typescript
{ timeLogId: number }
```

**Returns**:
```typescript
{
  success: boolean;
  data?: { count: number };
  error?: string;
}
```

**Example**:
```typescript
const result = await invoke('pomodoro:getSessionCount', { timeLogId: 123 });
console.log(`Completed ${result.data.count} pomodoros`);
```

---

## ⚙️ User Preferences Handlers

### `preferences:get`
Get user preferences (creates defaults if not exists).

**Parameters**:
```typescript
{ userId: string }
```

**Returns**:
```typescript
{
  success: boolean;
  data?: UserPreferences;
  error?: string;
}

interface UserPreferences {
  userId: string;
  pomodoroWorkDuration: number;       // default: 25
  pomodoroShortBreak: number;         // default: 5
  pomodoroLongBreak: number;          // default: 15
  pomodoroSessionsBeforeLong: number; // default: 4
  dailyTimeTarget: number;            // default: 480 (8h)
  enableDesktopNotifications: boolean; // default: true
  notificationSound: boolean;         // default: true
  autoStartBreaks: boolean;           // default: false
  defaultGroupBy: string;             // default: 'project'
  defaultSortBy: string;              // default: 'due_date'
  showCompletedTasks: boolean;        // default: false
}
```

**Example**:
```typescript
const result = await invoke('preferences:get', { userId: 'current-user' });
console.log(`Pomodoro: ${result.data.pomodoroWorkDuration}min`);
```

---

### `preferences:update`
Update user preferences.

**Parameters**:
```typescript
{
  userId: string;
  updates: Partial<{
    pomodoroWorkDuration: number;
    pomodoroShortBreak: number;
    pomodoroLongBreak: number;
    pomodoroSessionsBeforeLong: number;
    dailyTimeTarget: number;
    enableDesktopNotifications: boolean;
    notificationSound: boolean;
    autoStartBreaks: boolean;
    defaultGroupBy: string;
    defaultSortBy: string;
    showCompletedTasks: boolean;
  }>;
}
```

**Returns**:
```typescript
{ success: boolean; error?: string }
```

**Example**:
```typescript
await invoke('preferences:update', {
  userId: 'current-user',
  updates: {
    pomodoroWorkDuration: 30,
    dailyTimeTarget: 360 // 6h
  }
});
```

---

## 📊 Statistics Handler

### `mywork:getStats`
Get quick stats for dashboard display.

**Parameters**:
```typescript
{ userId: string }
```

**Returns**:
```typescript
{
  success: boolean;
  data?: {
    todayTasks: number;
    todayHours: string;         // formatted as "4.5"
    todayPomodoros: number;
    activeProjects: number;
    overdueTasks: number;
    dailyTarget: number;        // in minutes
    dailyProgress: number;      // percentage (0-100)
  };
  error?: string;
}
```

**Example**:
```typescript
const result = await invoke('mywork:getStats', { userId: 'current-user' });
console.log(`Progress: ${result.data.dailyProgress}% of daily target`);
```

---

## 🔍 Error Handling

All handlers return a consistent response structure:

```typescript
interface IPCResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

**Best Practice**:
```typescript
const result = await invoke('timelog:start', params);

if (result.success) {
  // Handle success
  console.log('Timer started:', result.data);
} else {
  // Handle error
  console.error('Failed to start timer:', result.error);
  showToast(result.error);
}
```

---

## 🗂️ Database Tables Used

| Handler Group | Tables |
|---------------|--------|
| Todo List | `work_items`, `projects`, `time_logs` |
| Time Logging | `time_logs`, `work_items`, `projects`, `audit_log` |
| Pomodoro | `pomodoro_sessions`, `time_logs` |
| Preferences | `user_preferences` |
| Stats | `work_items`, `time_logs`, `user_preferences` |

---

## 🔐 Audit Trail

The following handlers create audit log entries:

- `mywork:markDone` - Logs status change to 'done'
- `mywork:addQuickTask` - Logs task creation
- `timelog:start` - Logs timer start
- `timelog:stop` - Logs timer completion
- `timelog:logManual` - Logs manual entry
- `timelog:edit` - Logs edit with old/new values

All audit entries include:
- `entity_type`: 'WorkItem' or 'TimeLog'
- `entity_id`: UUID of the entity
- `action`: 'create', 'update', or 'delete'
- `user_id`: Who performed the action
- `old_values_json` / `new_values_json`: Change details

---

## 📝 Usage Examples

### Complete Pomodoro Workflow

```typescript
// 1. Start timer on task
const startResult = await invoke('timelog:start', {
  workItemId: 123,
  userId: 'current-user',
  logType: 'pomodoro'
});

const timeLogId = startResult.data.logId;

// 2. Start Pomodoro session
const sessionResult = await invoke('pomodoro:start', {
  timeLogId,
  sessionType: 'work',
  durationMinutes: 25
});

const sessionId = sessionResult.data.sessionId;

// 3. After 25 minutes, complete session
await invoke('pomodoro:complete', {
  sessionId,
  interrupted: false
});

// 4. Stop timer
await invoke('timelog:stop', {
  logId: timeLogId,
  notes: 'Completed feature implementation'
});

// 5. Check stats
const stats = await invoke('mywork:getStats', { userId: 'current-user' });
console.log(`Completed ${stats.data.todayPomodoros} pomodoros today`);
```

### Edit Time Log Workflow

```typescript
// 1. Get today's logs
const logsResult = await invoke('timelog:getToday', { userId: 'current-user' });

// 2. Find log to edit
const logToEdit = logsResult.data.find(log => log.id === 456);

// 3. Edit the log
await invoke('timelog:edit', {
  logId: logToEdit.id,
  updates: {
    startTime: '2026-02-01T10:00:00Z',
    endTime: '2026-02-01T12:30:00Z',
    notes: 'Updated after review'
  },
  userId: 'current-user'
});

// Note: edit_count is automatically incremented by trigger
```

---

## 🧪 Testing

Test all handlers using Electron's IPC:

```typescript
// In renderer process (React component or test)
import { invoke } from '@/lib/ipc';

const testTodos = async () => {
  const result = await invoke('mywork:getTodos', {
    userId: 'test-user',
    includeArchived: false
  });

  console.assert(result.success, 'getTodos should succeed');
  console.assert(Array.isArray(result.data), 'data should be an array');
};
```

---

## 📚 Related Documentation

- [PRD-011: My Work View](../PRD/PRD-011-MyWork.md) - Feature specification
- [My Work Blueprint](./my-work-blueprint.md) - Technical architecture
- [Migration 004 Guide](../../MIGRATION-004-GUIDE.md) - Database schema

---

*Last updated: 2026-02-01*
