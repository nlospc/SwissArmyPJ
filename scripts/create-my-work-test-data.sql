-- Create test data for My Work feature
-- Run with: sqlite3 swiss-army-pm.db < scripts/create-my-work-test-data.sql

BEGIN TRANSACTION;

-- 1. Get or create test projects
INSERT OR IGNORE INTO projects (id, uuid, name, status, created_at, updated_at)
VALUES
  (100, 'test-project-1', 'Website Redesign', 'in_progress', datetime('now'), datetime('now')),
  (101, 'test-project-2', 'Mobile App Development', 'in_progress', datetime('now'), datetime('now')),
  (102, 'test-project-3', 'API Integration', 'not_started', datetime('now'), datetime('now'));

-- 2. Create work items assigned to 'default-user'

-- High priority, due today
INSERT INTO work_items (
  uuid, project_id, type, title, status, priority,
  due_date, estimated_minutes, assigned_to,
  created_at, updated_at, level
)
VALUES (
  'test-item-1',
  100,
  'task',
  'Fix critical bug in checkout flow',
  'in_progress',
  'critical',
  date('now'),
  120,
  'default-user',
  datetime('now'),
  datetime('now'),
  1
);

-- High priority, overdue (7 days ago)
INSERT INTO work_items (
  uuid, project_id, type, title, status, priority,
  due_date, estimated_minutes, assigned_to,
  created_at, updated_at, level
)
VALUES (
  'test-item-2',
  100,
  'task',
  'Update payment gateway integration',
  'not_started',
  'high',
  date('now', '-7 days'),
  180,
  'default-user',
  datetime('now'),
  datetime('now'),
  1
);

-- Medium priority, due tomorrow
INSERT INTO work_items (
  uuid, project_id, type, title, status, priority,
  due_date, estimated_minutes, assigned_to,
  created_at, updated_at, level
)
VALUES (
  'test-item-3',
  101,
  'task',
  'Implement user profile page',
  'not_started',
  'medium',
  date('now', '+1 day'),
  240,
  'default-user',
  datetime('now'),
  datetime('now'),
  1
);

-- Low priority, due next week
INSERT INTO work_items (
  uuid, project_id, type, title, status, priority,
  due_date, estimated_minutes, assigned_to,
  created_at, updated_at, level
)
VALUES (
  'test-item-4',
  101,
  'task',
  'Add dark mode support',
  'not_started',
  'low',
  date('now', '+7 days'),
  300,
  'default-user',
  datetime('now'),
  datetime('now'),
  1
);

-- No due date
INSERT INTO work_items (
  uuid, project_id, type, title, status, priority,
  estimated_minutes, assigned_to,
  created_at, updated_at, level
)
VALUES (
  'test-item-5',
  102,
  'task',
  'Write API documentation',
  'not_started',
  'medium',
  180,
  'default-user',
  datetime('now'),
  datetime('now'),
  1
);

-- Completed yesterday (should be filtered by 24h rule)
INSERT INTO work_items (
  uuid, project_id, type, title, status, priority,
  due_date, estimated_minutes, assigned_to, completed_at,
  created_at, updated_at, level
)
VALUES (
  'test-item-6',
  100,
  'task',
  'Deploy staging environment',
  'done',
  'high',
  date('now', '-1 day'),
  60,
  'default-user',
  datetime('now', '-1 day'),
  datetime('now'),
  datetime('now'),
  1
);

-- Completed today (should show with strikethrough)
INSERT INTO work_items (
  uuid, project_id, type, title, status, priority,
  due_date, estimated_minutes, assigned_to, completed_at,
  created_at, updated_at, level
)
VALUES (
  'test-item-7',
  101,
  'task',
  'Code review for authentication PR',
  'done',
  'medium',
  date('now'),
  30,
  'default-user',
  datetime('now'),
  datetime('now'),
  datetime('now'),
  1
);

-- 3. Create time logs for today

-- Get the work item IDs we just created
-- Completed log from this morning (2 hours) for item 'Fix critical bug'
INSERT INTO time_logs (
  uuid, work_item_id, user_id, start_time, end_time,
  duration_minutes, log_type, pomodoro_count, notes,
  created_at
)
SELECT
  'test-timelog-1',
  id,
  'default-user',
  datetime('now', 'start of day', '+9 hours'),
  datetime('now', 'start of day', '+11 hours'),
  120,
  'timer',
  4,
  'Fixed authentication issue and tested on staging',
  datetime('now')
FROM work_items WHERE uuid = 'test-item-1';

-- Manual log from afternoon (1.5 hours) for 'Implement user profile'
INSERT INTO time_logs (
  uuid, work_item_id, user_id, start_time, end_time,
  duration_minutes, log_type, pomodoro_count, notes,
  created_at
)
SELECT
  'test-timelog-2',
  id,
  'default-user',
  datetime('now', 'start of day', '+14 hours'),
  datetime('now', 'start of day', '+15 hours', '+30 minutes'),
  90,
  'manual',
  0,
  'Designed UI mockups and started component implementation',
  datetime('now')
FROM work_items WHERE uuid = 'test-item-3';

-- 4. Create user preferences
INSERT OR REPLACE INTO user_preferences (
  user_id,
  pomodoro_work_duration, pomodoro_short_break, pomodoro_long_break, pomodoro_sessions_before_long,
  daily_time_target, enable_desktop_notifications, notification_sound, auto_start_breaks,
  default_group_by, default_sort_by, show_completed_tasks,
  created_at, updated_at
)
VALUES (
  'default-user',
  25, 5, 15, 4,
  480, 1, 1, 0,
  'project', 'due_date', 1,
  datetime('now'), datetime('now')
);

-- 5. Create Pomodoro sessions for the completed time log
INSERT INTO pomodoro_sessions (
  uuid, time_log_id, session_number, session_type, duration_minutes,
  started_at, completed_at, interrupted,
  created_at
)
SELECT
  'test-pomodoro-1',
  tl.id,
  1,
  'work',
  25,
  datetime('now', 'start of day', '+9 hours'),
  datetime('now', 'start of day', '+9 hours', '+25 minutes'),
  0,
  datetime('now')
FROM time_logs tl WHERE tl.uuid = 'test-timelog-1';

INSERT INTO pomodoro_sessions (
  uuid, time_log_id, session_number, session_type, duration_minutes,
  started_at, completed_at, interrupted,
  created_at
)
SELECT
  'test-pomodoro-2',
  tl.id,
  2,
  'short_break',
  5,
  datetime('now', 'start of day', '+9 hours', '+30 minutes'),
  datetime('now', 'start of day', '+9 hours', '+35 minutes'),
  0,
  datetime('now')
FROM time_logs tl WHERE tl.uuid = 'test-timelog-1';

INSERT INTO pomodoro_sessions (
  uuid, time_log_id, session_number, session_type, duration_minutes,
  started_at, completed_at, interrupted,
  created_at
)
SELECT
  'test-pomodoro-3',
  tl.id,
  3,
  'work',
  25,
  datetime('now', 'start of day', '+10 hours'),
  datetime('now', 'start of day', '+10 hours', '+25 minutes'),
  0,
  datetime('now')
FROM time_logs tl WHERE tl.uuid = 'test-timelog-1';

INSERT INTO pomodoro_sessions (
  uuid, time_log_id, session_number, session_type, duration_minutes,
  started_at, completed_at, interrupted,
  created_at
)
SELECT
  'test-pomodoro-4',
  tl.id,
  4,
  'long_break',
  15,
  datetime('now', 'start of day', '+10 hours', '+30 minutes'),
  datetime('now', 'start of day', '+10 hours', '+45 minutes'),
  0,
  datetime('now')
FROM time_logs tl WHERE tl.uuid = 'test-timelog-1';

COMMIT;

-- Display summary
SELECT '=== Test Data Created Successfully ===' AS '';
SELECT '' AS '';
SELECT '📊 Summary:' AS '';
SELECT '   • Active tasks: ' || COUNT(*) FROM work_items WHERE assigned_to = 'default-user' AND status != 'done';
SELECT '   • Completed tasks: ' || COUNT(*) FROM work_items WHERE assigned_to = 'default-user' AND status = 'done';
SELECT '   • Time logs today: ' || COUNT(*) FROM time_logs WHERE user_id = 'default-user';
SELECT '   • Total time today: ' || COALESCE(SUM(duration_minutes), 0) || ' minutes' FROM time_logs WHERE user_id = 'default-user' AND DATE(start_time) = DATE('now');
SELECT '   • Pomodoro sessions: ' || COUNT(*) FROM pomodoro_sessions;
SELECT '' AS '';
SELECT '🚀 Navigate to "My Work" in the app to see the test data!' AS '';
SELECT 'You should see:' AS '';
SELECT '   • 5 active tasks (1 critical, 1 overdue, 3 upcoming)' AS '';
SELECT '   • 1 completed task from today' AS '';
SELECT '   • 3.5 hours logged today' AS '';
SELECT '   • 4 Pomodoro sessions completed' AS '';
