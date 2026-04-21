#!/usr/bin/env node

/**
 * Create test data for My Work feature
 *
 * Creates:
 * - Work items assigned to 'default-user' with various properties
 * - Different priorities, due dates, and statuses
 * - Some time logs and Pomodoro sessions
 * - User preferences
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'swiss-army-pm.db');
const db = new Database(dbPath);

const userId = 'default-user';

console.log('\n🧪 Creating My Work test data...\n');

// Helper to generate UUIDs
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper to format date for SQLite
function formatDate(date) {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

try {
  db.exec('BEGIN TRANSACTION');

  // 1. Get or create test projects
  console.log('📁 Checking projects...');

  let projects = db.prepare('SELECT id, name FROM projects LIMIT 3').all();

  if (projects.length === 0) {
    console.log('   Creating test projects...');

    const projectData = [
      { uuid: generateUUID(), name: 'Website Redesign', status: 'in_progress' },
      { uuid: generateUUID(), name: 'Mobile App Development', status: 'in_progress' },
      { uuid: generateUUID(), name: 'API Integration', status: 'not_started' },
    ];

    for (const project of projectData) {
      const result = db.prepare(`
        INSERT INTO projects (uuid, name, status, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `).run(project.uuid, project.name, project.status);

      console.log(`   ✅ Created project: ${project.name}`);
    }

    projects = db.prepare('SELECT id, name FROM projects LIMIT 3').all();
  } else {
    console.log(`   ✅ Found ${projects.length} projects`);
  }

  // 2. Create work items assigned to default-user
  console.log('\n📋 Creating work items...');

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const workItems = [
    // High priority, due today
    {
      uuid: generateUUID(),
      projectId: projects[0].id,
      type: 'task',
      title: 'Fix critical bug in checkout flow',
      status: 'in_progress',
      priority: 'critical',
      dueDate: formatDate(now),
      estimatedMinutes: 120,
    },

    // High priority, overdue
    {
      uuid: generateUUID(),
      projectId: projects[0].id,
      type: 'task',
      title: 'Update payment gateway integration',
      status: 'not_started',
      priority: 'high',
      dueDate: formatDate(lastWeek),
      estimatedMinutes: 180,
    },

    // Medium priority, due tomorrow
    {
      uuid: generateUUID(),
      projectId: projects[1].id,
      type: 'task',
      title: 'Implement user profile page',
      status: 'not_started',
      priority: 'medium',
      dueDate: formatDate(tomorrow),
      estimatedMinutes: 240,
    },

    // Low priority, due next week
    {
      uuid: generateUUID(),
      projectId: projects[1].id,
      type: 'task',
      title: 'Add dark mode support',
      status: 'not_started',
      priority: 'low',
      dueDate: formatDate(nextWeek),
      estimatedMinutes: 300,
    },

    // No due date
    {
      uuid: generateUUID(),
      projectId: projects[2].id,
      type: 'task',
      title: 'Write API documentation',
      status: 'not_started',
      priority: 'medium',
      dueDate: null,
      estimatedMinutes: 180,
    },

    // Completed yesterday (should be filtered by 24h rule)
    {
      uuid: generateUUID(),
      projectId: projects[0].id,
      type: 'task',
      title: 'Deploy staging environment',
      status: 'done',
      priority: 'high',
      dueDate: formatDate(yesterday),
      estimatedMinutes: 60,
      completedAt: formatDate(yesterday),
    },

    // Completed today (should show with strikethrough)
    {
      uuid: generateUUID(),
      projectId: projects[1].id,
      type: 'task',
      title: 'Code review for authentication PR',
      status: 'done',
      priority: 'medium',
      dueDate: formatDate(now),
      estimatedMinutes: 30,
      completedAt: formatDate(now),
    },
  ];

  const createdItems = [];

  for (const item of workItems) {
    const result = db.prepare(`
      INSERT INTO work_items (
        uuid, project_id, type, title, status, priority,
        due_date, estimated_minutes, assigned_to, completed_at,
        created_at, updated_at, level
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 1)
    `).run(
      item.uuid,
      item.projectId,
      item.type,
      item.title,
      item.status,
      item.priority,
      item.dueDate,
      item.estimatedMinutes,
      userId,
      item.completedAt || null
    );

    createdItems.push({ id: result.lastInsertRowid, ...item });
    console.log(`   ✅ Created: ${item.title} (${item.status}, ${item.priority})`);
  }

  // 3. Create some time logs for today
  console.log('\n⏱️  Creating time logs...');

  const timeLogs = [
    // Completed log from this morning (2 hours)
    {
      uuid: generateUUID(),
      workItemId: createdItems[0].id, // Critical bug
      userId,
      startTime: formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0)),
      endTime: formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0)),
      durationMinutes: 120,
      logType: 'timer',
      pomodoroCount: 4,
      notes: 'Fixed authentication issue and tested on staging',
    },

    // Manual log from afternoon (1.5 hours)
    {
      uuid: generateUUID(),
      workItemId: createdItems[2].id, // User profile page
      userId,
      startTime: formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0)),
      endTime: formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30)),
      durationMinutes: 90,
      logType: 'manual',
      pomodoroCount: 0,
      notes: 'Designed UI mockups and started component implementation',
    },
  ];

  for (const log of timeLogs) {
    db.prepare(`
      INSERT INTO time_logs (
        uuid, work_item_id, user_id, start_time, end_time,
        duration_minutes, log_type, pomodoro_count, notes,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      log.uuid,
      log.workItemId,
      log.userId,
      log.startTime,
      log.endTime,
      log.durationMinutes,
      log.logType,
      log.pomodoroCount,
      log.notes
    );

    console.log(`   ✅ Created time log: ${log.durationMinutes}m (${log.logType})`);
  }

  // 4. Create user preferences
  console.log('\n⚙️  Creating user preferences...');

  // Check if preferences already exist
  const existingPrefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId);

  if (!existingPrefs) {
    db.prepare(`
      INSERT INTO user_preferences (
        user_id,
        pomodoro_work_duration, pomodoro_short_break, pomodoro_long_break, pomodoro_sessions_before_long,
        daily_time_target, enable_desktop_notifications, notification_sound, auto_start_breaks,
        default_group_by, default_sort_by, show_completed_tasks,
        created_at, updated_at
      )
      VALUES (?, 25, 5, 15, 4, 480, 1, 1, 0, 'project', 'due_date', 1, datetime('now'), datetime('now'))
    `).run(userId);

    console.log('   ✅ Created user preferences (25/5/15 Pomodoro, 8h daily target)');
  } else {
    console.log('   ℹ️  User preferences already exist');
  }

  // 5. Create some Pomodoro sessions (for the completed time log)
  console.log('\n🍅 Creating Pomodoro sessions...');

  const completedLog = timeLogs[0]; // The 2-hour log
  const completedLogId = db.prepare('SELECT id FROM time_logs WHERE uuid = ?').get(completedLog.uuid).id;

  for (let i = 1; i <= 4; i++) {
    const sessionStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, (i-1) * 30);
    const sessionEndTime = new Date(sessionStartTime.getTime() + 25 * 60 * 1000);

    db.prepare(`
      INSERT INTO pomodoro_sessions (
        uuid, time_log_id, session_number, session_type, duration_minutes,
        started_at, completed_at, interrupted,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
    `).run(
      generateUUID(),
      completedLogId,
      i,
      i % 4 === 0 ? 'long_break' : (i % 2 === 0 ? 'short_break' : 'work'),
      i % 2 === 0 ? 5 : 25,
      formatDate(sessionStartTime),
      formatDate(sessionEndTime)
    );
  }

  console.log('   ✅ Created 4 Pomodoro sessions');

  db.exec('COMMIT');

  // 6. Display summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test data created successfully!\n');

  console.log('📊 Summary:');
  const todoCount = db.prepare('SELECT COUNT(*) as count FROM work_items WHERE assigned_to = ? AND status != "done"').get(userId).count;
  const completedCount = db.prepare('SELECT COUNT(*) as count FROM work_items WHERE assigned_to = ? AND status = "done"').get(userId).count;
  const timeLogCount = db.prepare('SELECT COUNT(*) as count FROM time_logs WHERE user_id = ?').get(userId).count;
  const totalMinutes = db.prepare('SELECT SUM(duration_minutes) as total FROM time_logs WHERE user_id = ? AND DATE(start_time) = DATE("now")').get(userId).total || 0;

  console.log(`   • Active tasks: ${todoCount}`);
  console.log(`   • Completed tasks: ${completedCount}`);
  console.log(`   • Time logs today: ${timeLogCount}`);
  console.log(`   • Total time today: ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`);
  console.log(`   • Projects: ${projects.length}`);

  console.log('\n🚀 Navigate to "My Work" to see the test data!\n');
  console.log('You should now see:');
  console.log('   • 5 active tasks (1 critical, 1 overdue, 3 upcoming)');
  console.log('   • 1 completed task from today');
  console.log('   • 3.5 hours logged today');
  console.log('   • 4 Pomodoro sessions completed');
  console.log('');

} catch (error) {
  db.exec('ROLLBACK');
  console.error('\n❌ Error creating test data:', error.message);
  console.error(error);
  process.exit(1);
} finally {
  db.close();
}
