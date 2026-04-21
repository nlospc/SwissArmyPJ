/**
 * My Work IPC Handlers
 *
 * Handles all IPC communication for the My Work feature:
 * - Todo list management
 * - Time logging (manual, timer, Pomodoro)
 * - User preferences
 */

import { ipcMain } from 'electron';
import { getDatabase } from '../database/schema';
import type Database from 'better-sqlite3';

// =============================================================================
// TYPES
// =============================================================================

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

interface ManualTimeEntry {
  workItemId: number;
  userId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  notes?: string;
}

interface PomodoroSession {
  id: number;
  uuid: string;
  timeLogId: number;
  sessionNumber: number;
  sessionType: 'work' | 'short_break' | 'long_break';
  durationMinutes: number;
  startedAt: string;
  completedAt: string | null;
  interrupted: boolean;
}

interface UserPreferences {
  userId: string;
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
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate a UUID (simplified version using randomblob)
 */
function generateUUID(db: Database.Database): string {
  const result = db.prepare("SELECT lower(hex(randomblob(16))) as uuid").get() as { uuid: string };
  return result.uuid;
}

/**
 * Create audit log entry
 */
function createAuditLog(
  db: Database.Database,
  entityType: string,
  entityId: string,
  action: 'create' | 'update' | 'delete',
  userId: string,
  oldValues?: string,
  newValues?: string
): void {
  const uuid = generateUUID(db);

  db.prepare(`
    INSERT INTO audit_log (uuid, entity_type, entity_id, action, user_id, source, old_values_json, new_values_json)
    VALUES (?, ?, ?, ?, ?, 'ui', ?, ?)
  `).run(uuid, entityType, entityId, action, userId, oldValues || null, newValues || null);
}

/**
 * Calculate duration between two timestamps (in minutes)
 */
function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return Math.round((end - start) / 60000); // milliseconds to minutes
}

// =============================================================================
// TODO LIST HANDLERS
// =============================================================================

/**
 * Get all todos assigned to a user
 */
ipcMain.handle('mywork:getTodos', async (event, { userId, includeArchived = false }) => {
  try {
    const db = getDatabase();

    let query = `
      SELECT
        wi.id,
        wi.uuid,
        wi.title as name,
        wi.project_id as projectId,
        p.name as projectName,
        wi.status,
        'medium' as priority,
        wi.end_date as dueDate,
        wi.estimated_minutes as estimatedMinutes,
        wi.assigned_to as assignedTo,
        wi.completed_at as completedAt,
        COALESCE(SUM(tl.duration_minutes), 0) as loggedMinutes,
        CASE WHEN wi.end_date < date('now') AND wi.status != 'done' THEN 1 ELSE 0 END as isOverdue
      FROM work_items wi
      INNER JOIN projects p ON wi.project_id = p.id
      LEFT JOIN time_logs tl ON wi.id = tl.work_item_id
      WHERE wi.assigned_to = ?
    `;

    // Filter logic based on includeArchived
    if (!includeArchived) {
      query += ` AND (
        wi.status != 'done'
        OR (wi.status = 'done' AND wi.completed_at > datetime('now', '-1 day'))
      )`;
    } else {
      query += ` AND wi.status = 'done' AND wi.completed_at <= datetime('now', '-1 day')`;
    }

    query += `
      GROUP BY wi.id
      ORDER BY
        CASE WHEN wi.end_date < date('now') AND wi.status != 'done' THEN 0 ELSE 1 END,
        wi.end_date ASC NULLS LAST,
        wi.created_at DESC
    `;

    const todos = db.prepare(query).all(userId) as TodoItem[];

    return { success: true, data: todos };
  } catch (error) {
    console.error('mywork:getTodos error:', error);
    return { success: false, error: (error as Error).message };
  }
});

/**
 * Mark a todo as done
 */
ipcMain.handle('mywork:markDone', async (event, { itemId, userId }) => {
  try {
    const db = getDatabase();

    // Get item before update for audit
    const oldItem = db.prepare('SELECT * FROM work_items WHERE id = ?').get(itemId) as any;

    if (!oldItem) {
      return { success: false, error: 'Item not found' };
    }

    // Update status to done (trigger will set completed_at automatically)
    db.prepare(`
      UPDATE work_items
      SET status = 'done', updated_at = datetime('now')
      WHERE id = ? AND assigned_to = ?
    `).run(itemId, userId);

    // Get updated item
    const newItem = db.prepare('SELECT * FROM work_items WHERE id = ?').get(itemId) as any;

    // Create audit log
    createAuditLog(
      db,
      'WorkItem',
      newItem.uuid,
      'update',
      userId,
      `status:${oldItem.status}`,
      `status:done,completed_at:${newItem.completed_at}`
    );

    return { success: true };
  } catch (error) {
    console.error('mywork:markDone error:', error);
    return { success: false, error: (error as Error).message };
  }
});

/**
 * Add quick task
 */
ipcMain.handle('mywork:addQuickTask', async (event, { projectId, title, userId }) => {
  try {
    const db = getDatabase();
    const uuid = generateUUID(db);
    const now = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO work_items (uuid, project_id, type, title, status, assigned_to, created_at, updated_at, level)
      VALUES (?, ?, 'task', ?, 'not_started', ?, ?, ?, 1)
    `).run(uuid, projectId, title, userId, now, now);

    createAuditLog(db, 'WorkItem', uuid, 'create', userId, undefined, `title:${title},type:task`);

    return { success: true, data: { id: result.lastInsertRowid, uuid } };
  } catch (error) {
    console.error('mywork:addQuickTask error:', error);
    return { success: false, error: (error as Error).message };
  }
});

// =============================================================================
// TIME LOGGING HANDLERS
// =============================================================================

/**
 * Start a timer on a work item
 */
ipcMain.handle('timelog:start', async (event, { workItemId, userId, logType = 'timer' }) => {
  try {
    const db = getDatabase();
    const uuid = generateUUID(db);
    const now = new Date().toISOString();

    // Check if there's already an active timer for this user
    const activeTimer = db.prepare(`
      SELECT * FROM time_logs WHERE user_id = ? AND end_time IS NULL
    `).get(userId);

    if (activeTimer) {
      return { success: false, error: 'You already have an active timer. Please stop it first.' };
    }

    const result = db.prepare(`
      INSERT INTO time_logs (uuid, work_item_id, user_id, start_time, log_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuid, workItemId, userId, now, logType, now, now);

    createAuditLog(
      db,
      'TimeLog',
      uuid,
      'create',
      userId,
      undefined,
      `work_item_id:${workItemId},log_type:${logType}`
    );

    return { success: true, data: { logId: result.lastInsertRowid, uuid } };
  } catch (error) {
    console.error('timelog:start error:', error);
    return { success: false, error: (error as Error).message };
  }
});

/**
 * Stop a running timer
 */
ipcMain.handle('timelog:stop', async (event, { logId, notes }) => {
  try {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Get the time log
    const timeLog = db.prepare('SELECT * FROM time_logs WHERE id = ?').get(logId) as any;

    if (!timeLog) {
      return { success: false, error: 'Time log not found' };
    }

    if (timeLog.end_time) {
      return { success: false, error: 'Timer already stopped' };
    }

    // Calculate duration
    const duration = calculateDuration(timeLog.start_time, now);

    // Update time log
    db.prepare(`
      UPDATE time_logs
      SET
        end_time = ?,
        duration_minutes = ?,
        notes = ?,
        updated_at = ?
      WHERE id = ?
    `).run(now, duration, notes || null, now, logId);

    createAuditLog(
      db,
      'TimeLog',
      timeLog.uuid,
      'update',
      timeLog.user_id,
      `end_time:NULL`,
      `end_time:${now},duration:${duration}`
    );

    return { success: true, data: { duration } };
  } catch (error) {
    console.error('timelog:stop error:', error);
    return { success: false, error: (error as Error).message };
  }
});

/**
 * Log time manually
 */
ipcMain.handle('timelog:logManual', async (event, entry: ManualTimeEntry) => {
  try {
    const db = getDatabase();
    const uuid = generateUUID(db);
    const now = new Date().toISOString();

    // Validate times
    if (new Date(entry.startTime) >= new Date(entry.endTime)) {
      return { success: false, error: 'Start time must be before end time' };
    }

    const result = db.prepare(`
      INSERT INTO time_logs (
        uuid, work_item_id, user_id, start_time, end_time, duration_minutes,
        log_type, notes, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'manual', ?, ?, ?)
    `).run(
      uuid,
      entry.workItemId,
      entry.userId,
      entry.startTime,
      entry.endTime,
      entry.durationMinutes,
      entry.notes || null,
      now,
      now
    );

    createAuditLog(
      db,
      'TimeLog',
      uuid,
      'create',
      entry.userId,
      undefined,
      `work_item_id:${entry.workItemId},duration:${entry.durationMinutes},log_type:manual`
    );

    return { success: true, data: { logId: result.lastInsertRowid, uuid } };
  } catch (error) {
    console.error('timelog:logManual error:', error);
    return { success: false, error: (error as Error).message };
  }
});

/**
 * Edit an existing time log
 */
ipcMain.handle('timelog:edit', async (event, { logId, updates, userId }) => {
  try {
    const db = getDatabase();

    // Get original log
    const oldLog = db.prepare('SELECT * FROM time_logs WHERE id = ?').get(logId) as any;

    if (!oldLog) {
      return { success: false, error: 'Time log not found' };
    }

    // Validate times if provided
    if (updates.startTime && updates.endTime) {
      if (new Date(updates.startTime) >= new Date(updates.endTime)) {
        return { success: false, error: 'Start time must be before end time' };
      }
    }

    // Calculate new duration
    const startTime = updates.startTime || oldLog.start_time;
    const endTime = updates.endTime || oldLog.end_time;
    const durationMinutes = endTime ? calculateDuration(startTime, endTime) : null;

    // Update time log (trigger will handle edit tracking)
    db.prepare(`
      UPDATE time_logs
      SET
        start_time = ?,
        end_time = ?,
        duration_minutes = ?,
        notes = ?,
        user_id = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      startTime,
      endTime,
      durationMinutes,
      updates.notes !== undefined ? updates.notes : oldLog.notes,
      userId,
      logId
    );

    // Audit log (trigger already handles this, but add extra detail)
    createAuditLog(
      db,
      'TimeLog',
      oldLog.uuid,
      'update',
      userId,
      `start:${oldLog.start_time},end:${oldLog.end_time},duration:${oldLog.duration_minutes}`,
      `start:${startTime},end:${endTime},duration:${durationMinutes}`
    );

    return { success: true };
  } catch (error) {
    console.error('timelog:edit error:', error);
    return { success: false, error: (error as Error).message };
  }
});

/**
 * Get today's time logs for a user
 */
ipcMain.handle('timelog:getToday', async (event, { userId }) => {
  try {
    const db = getDatabase();

    const logs = db.prepare(`
      SELECT
        tl.id,
        tl.uuid,
        tl.work_item_id as workItemId,
        wi.title as itemName,
        p.name as projectName,
        tl.user_id as userId,
        tl.start_time as startTime,
        tl.end_time as endTime,
        tl.duration_minutes as durationMinutes,
        tl.log_type as logType,
        tl.pomodoro_count as pomodoroCount,
        tl.notes,
        tl.edit_count as editCount,
        tl.edited_at as editedAt
      FROM time_logs tl
      INNER JOIN work_items wi ON tl.work_item_id = wi.id
      INNER JOIN projects p ON wi.project_id = p.id
      WHERE tl.user_id = ? AND date(tl.start_time) = date('now')
      ORDER BY tl.start_time DESC
    `).all(userId) as TimeLog[];

    return { success: true, data: logs };
  } catch (error) {
    console.error('timelog:getToday error:', error);
    return { success: false, error: (error as Error).message };
  }
});

/**
 * Get weekly summary of time logs
 */
ipcMain.handle('timelog:getWeeklySummary', async (event, { userId }) => {
  try {
    const db = getDatabase();

    const days = db.prepare(`
      SELECT
        date(start_time) as date,
        SUM(duration_minutes) as totalMinutes,
        SUM(pomodoro_count) as pomodoroCount,
        COUNT(DISTINCT work_item_id) as tasksCount
      FROM time_logs
      WHERE user_id = ?
        AND start_time >= date('now', 'weekday 0', '-6 days')
      GROUP BY date(start_time)
      ORDER BY date ASC
    `).all(userId);

    return { success: true, data: days };
  } catch (error) {
    console.error('timelog:getWeeklySummary error:', error);
    return { success: false, error: (error as Error).message };
  }
});

/**
 * Get active timer for a user
 */
ipcMain.handle('timelog:getActive', async (event, { userId }) => {
  try {
    const db = getDatabase();

    const activeLog = db.prepare(`
      SELECT
        tl.id,
        tl.uuid,
        tl.work_item_id as workItemId,
        wi.title as itemName,
        p.name as projectName,
        tl.start_time as startTime,
        tl.log_type as logType
      FROM time_logs tl
      INNER JOIN work_items wi ON tl.work_item_id = wi.id
      INNER JOIN projects p ON wi.project_id = p.id
      WHERE tl.user_id = ? AND tl.end_time IS NULL
      LIMIT 1
    `).get(userId);

    return { success: true, data: activeLog || null };
  } catch (error) {
    console.error('timelog:getActive error:', error);
    return { success: false, error: (error as Error).message };
  }
});

// =============================================================================
// POMODORO HANDLERS
// =============================================================================

/**
 * Start a Pomodoro session
 */
ipcMain.handle('pomodoro:start', async (event, { timeLogId, sessionType, durationMinutes }) => {
  try {
    const db = getDatabase();
    const uuid = generateUUID(db);
    const now = new Date().toISOString();

    // Get next session number
    const lastSession = db.prepare(`
      SELECT session_number FROM pomodoro_sessions
      WHERE time_log_id = ?
      ORDER BY session_number DESC
      LIMIT 1
    `).get(timeLogId) as any;

    const sessionNumber = lastSession ? lastSession.session_number + 1 : 1;

    const result = db.prepare(`
      INSERT INTO pomodoro_sessions (
        uuid, time_log_id, session_number, session_type,
        duration_minutes, started_at, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuid, timeLogId, sessionNumber, sessionType, durationMinutes, now, now);

    return { success: true, data: { sessionId: result.lastInsertRowid, uuid, sessionNumber } };
  } catch (error) {
    console.error('pomodoro:start error:', error);
    return { success: false, error: (error as Error).message };
  }
});

/**
 * Complete a Pomodoro session
 */
ipcMain.handle('pomodoro:complete', async (event, { sessionId, interrupted = false }) => {
  try {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Get session info
    const session = db.prepare('SELECT * FROM pomodoro_sessions WHERE id = ?').get(sessionId) as any;

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Mark session as completed
    db.prepare(`
      UPDATE pomodoro_sessions
      SET completed_at = ?, interrupted = ?
      WHERE id = ?
    `).run(now, interrupted ? 1 : 0, sessionId);

    // If work session completed successfully, increment pomodoro count
    if (session.session_type === 'work' && !interrupted) {
      db.prepare(`
        UPDATE time_logs
        SET pomodoro_count = pomodoro_count + 1
        WHERE id = ?
      `).run(session.time_log_id);
    }

    return { success: true, data: { sessionType: session.session_type, sessionNumber: session.session_number } };
  } catch (error) {
    console.error('pomodoro:complete error:', error);
    return { success: false, error: (error as Error).message };
  }
});

/**
 * Get current Pomodoro session count
 */
ipcMain.handle('pomodoro:getSessionCount', async (event, { timeLogId }) => {
  try {
    const db = getDatabase();

    const result = db.prepare(`
      SELECT COUNT(*) as count
      FROM pomodoro_sessions
      WHERE time_log_id = ? AND session_type = 'work' AND interrupted = 0
    `).get(timeLogId) as any;

    return { success: true, data: { count: result.count } };
  } catch (error) {
    console.error('pomodoro:getSessionCount error:', error);
    return { success: false, error: (error as Error).message };
  }
});

// =============================================================================
// USER PREFERENCES HANDLERS
// =============================================================================

/**
 * Get user preferences
 */
ipcMain.handle('preferences:get', async (event, { userId }) => {
  try {
    const db = getDatabase();

    let prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId) as any;

    // Create default preferences if not exists
    if (!prefs) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO user_preferences (user_id, created_at, updated_at)
        VALUES (?, ?, ?)
      `).run(userId, now, now);

      prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId) as any;
    }

    // Convert to camelCase
    const preferences: UserPreferences = {
      userId: prefs.user_id,
      pomodoroWorkDuration: prefs.pomodoro_work_duration,
      pomodoroShortBreak: prefs.pomodoro_short_break,
      pomodoroLongBreak: prefs.pomodoro_long_break,
      pomodoroSessionsBeforeLong: prefs.pomodoro_sessions_before_long,
      dailyTimeTarget: prefs.daily_time_target,
      enableDesktopNotifications: Boolean(prefs.enable_desktop_notifications),
      notificationSound: Boolean(prefs.notification_sound),
      autoStartBreaks: Boolean(prefs.auto_start_breaks),
      defaultGroupBy: prefs.default_group_by,
      defaultSortBy: prefs.default_sort_by,
      showCompletedTasks: Boolean(prefs.show_completed_tasks)
    };

    return { success: true, data: preferences };
  } catch (error) {
    console.error('preferences:get error:', error);
    return { success: false, error: (error as Error).message };
  }
});

/**
 * Update user preferences
 */
ipcMain.handle('preferences:update', async (event, { userId, updates }) => {
  try {
    const db = getDatabase();

    // Build update query dynamically
    const fields: string[] = [];
    const values: any[] = [];

    const fieldMap: Record<string, string> = {
      pomodoroWorkDuration: 'pomodoro_work_duration',
      pomodoroShortBreak: 'pomodoro_short_break',
      pomodoroLongBreak: 'pomodoro_long_break',
      pomodoroSessionsBeforeLong: 'pomodoro_sessions_before_long',
      dailyTimeTarget: 'daily_time_target',
      enableDesktopNotifications: 'enable_desktop_notifications',
      notificationSound: 'notification_sound',
      autoStartBreaks: 'auto_start_breaks',
      defaultGroupBy: 'default_group_by',
      defaultSortBy: 'default_sort_by',
      showCompletedTasks: 'show_completed_tasks'
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        fields.push(`${dbField} = ?`);
        // Convert boolean to integer for SQLite
        values.push(typeof updates[key] === 'boolean' ? (updates[key] ? 1 : 0) : updates[key]);
      }
    }

    if (fields.length === 0) {
      return { success: false, error: 'No fields to update' };
    }

    // Add updated_at
    fields.push('updated_at = datetime(\'now\')');

    const query = `UPDATE user_preferences SET ${fields.join(', ')} WHERE user_id = ?`;
    values.push(userId);

    db.prepare(query).run(...values);

    return { success: true };
  } catch (error) {
    console.error('preferences:update error:', error);
    return { success: false, error: (error as Error).message };
  }
});

// =============================================================================
// STATISTICS HANDLERS
// =============================================================================

/**
 * Get quick stats for dashboard
 */
ipcMain.handle('mywork:getStats', async (event, { userId }) => {
  try {
    const db = getDatabase();

    // Today's stats
    const todayStats = db.prepare(`
      SELECT
        COUNT(DISTINCT wi.id) as todayTasks,
        COALESCE(SUM(tl.duration_minutes), 0) as todayMinutes,
        COALESCE(SUM(tl.pomodoro_count), 0) as todayPomodoros
      FROM work_items wi
      LEFT JOIN time_logs tl ON wi.id = tl.work_item_id AND date(tl.start_time) = date('now')
      WHERE wi.assigned_to = ? AND date(wi.created_at) = date('now')
    `).get(userId) as any;

    // Active projects
    const activeProjects = db.prepare(`
      SELECT COUNT(DISTINCT wi.project_id) as count
      FROM work_items wi
      WHERE wi.assigned_to = ? AND wi.status != 'done'
    `).get(userId) as any;

    // Overdue tasks
    const overdueTasks = db.prepare(`
      SELECT COUNT(*) as count
      FROM work_items
      WHERE assigned_to = ?
        AND status != 'done'
        AND end_date < date('now')
    `).get(userId) as any;

    // Get daily target from preferences
    const prefs = db.prepare('SELECT daily_time_target FROM user_preferences WHERE user_id = ?').get(userId) as any;
    const dailyTarget = prefs?.daily_time_target || 480;

    const stats = {
      todayTasks: todayStats.todayTasks,
      todayHours: (todayStats.todayMinutes / 60).toFixed(1),
      todayPomodoros: todayStats.todayPomodoros,
      activeProjects: activeProjects.count,
      overdueTasks: overdueTasks.count,
      dailyTarget: dailyTarget,
      dailyProgress: Math.round((todayStats.todayMinutes / dailyTarget) * 100)
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('mywork:getStats error:', error);
    return { success: false, error: (error as Error).message };
  }
});

// =============================================================================
// EXPORT HANDLER REGISTRATION FUNCTION
// =============================================================================

export function registerMyWorkHandlers(): void {
  console.log('✅ My Work IPC handlers registered');
}
