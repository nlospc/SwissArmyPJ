#!/usr/bin/env node

/**
 * Test My Work IPC Handlers
 *
 * Simple test to verify IPC handlers work correctly.
 * Run with: node scripts/test-ipc-handlers.js
 */

const Database = require('better-sqlite3');
const path = require('path');

// Mock ipcMain for testing
const mockHandlers = {};
const ipcMain = {
  handle: (channel, handler) => {
    mockHandlers[channel] = handler;
  }
};

// Mock getDatabase
const dbPath = path.join(process.cwd(), 'swiss-army-pm.db');
const db = new Database(dbPath);
const getDatabase = () => db;

// Load handlers
global.ipcMain = ipcMain;
global.getDatabase = getDatabase;

console.log('\n🧪 Testing My Work IPC Handlers\n');
console.log('━'.repeat(60));

async function runTests() {
  // Create test project and work item first
  const testProjectId = createTestData();

  const tests = [
    testGetTodos,
    testMarkDone,
    testStartTimer,
    testStopTimer,
    testManualTimeLog,
    testPreferences,
    testStats
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test(testProjectId);
      console.log(`✅ ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      failed++;
    }
  }

  // Cleanup
  cleanupTestData(testProjectId);

  console.log('\n' + '━'.repeat(60));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  return failed === 0;
}

function createTestData() {
  // Create test project
  const projectResult = db.prepare(`
    INSERT INTO projects (uuid, name, status, created_at, updated_at)
    VALUES (?, 'Test Project', 'in_progress', datetime('now'), datetime('now'))
  `).run('test-project-uuid');

  const projectId = projectResult.lastInsertRowid;

  // Create test work item
  db.prepare(`
    INSERT INTO work_items (
      uuid, project_id, type, title, status, assigned_to,
      created_at, updated_at, level
    )
    VALUES (?, ?, 'task', 'Test Task', 'not_started', 'test-user', datetime('now'), datetime('now'), 1)
  `).run('test-item-uuid', projectId);

  return projectId;
}

function cleanupTestData(projectId) {
  db.prepare('DELETE FROM time_logs WHERE user_id = ?').run('test-user');
  db.prepare('DELETE FROM work_items WHERE project_id = ?').run(projectId);
  db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
  db.prepare('DELETE FROM user_preferences WHERE user_id = ?').run('test-user');
}

// Test Functions

async function testGetTodos() {
  const handler = mockHandlers['mywork:getTodos'];
  const result = await handler(null, { userId: 'test-user', includeArchived: false });

  if (!result.success) throw new Error(result.error);
  if (!Array.isArray(result.data)) throw new Error('Expected array');
  if (result.data.length === 0) throw new Error('Expected at least one todo');
}

async function testMarkDone() {
  const getTodos = mockHandlers['mywork:getTodos'];
  const markDone = mockHandlers['mywork:markDone'];

  const todos = await getTodos(null, { userId: 'test-user' });
  const todoId = todos.data[0].id;

  const result = await markDone(null, { itemId: todoId, userId: 'test-user' });

  if (!result.success) throw new Error(result.error);

  // Verify status changed
  const item = db.prepare('SELECT status, completed_at FROM work_items WHERE id = ?').get(todoId);
  if (item.status !== 'done') throw new Error('Status not updated');
  if (!item.completed_at) throw new Error('completed_at not set');
}

async function testStartTimer() {
  const getTodos = mockHandlers['mywork:getTodos'];
  const startTimer = mockHandlers['timelog:start'];

  const todos = await getTodos(null, { userId: 'test-user' });
  const workItemId = todos.data[0].id;

  const result = await startTimer(null, {
    workItemId,
    userId: 'test-user',
    logType: 'timer'
  });

  if (!result.success) throw new Error(result.error);
  if (!result.data.logId) throw new Error('Expected logId');

  // Store for next test
  global.testLogId = result.data.logId;
}

async function testStopTimer() {
  const stopTimer = mockHandlers['timelog:stop'];

  if (!global.testLogId) throw new Error('No active timer from previous test');

  const result = await stopTimer(null, {
    logId: global.testLogId,
    notes: 'Test notes'
  });

  if (!result.success) throw new Error(result.error);
  if (!result.data.duration) throw new Error('Expected duration');
}

async function testManualTimeLog() {
  const getTodos = mockHandlers['mywork:getTodos'];
  const logManual = mockHandlers['timelog:logManual'];

  const todos = await getTodos(null, { userId: 'test-user' });
  const workItemId = todos.data[0].id;

  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 hour

  const result = await logManual(null, {
    workItemId,
    userId: 'test-user',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    durationMinutes: 60,
    notes: 'Manual test entry'
  });

  if (!result.success) throw new Error(result.error);
  if (!result.data.logId) throw new Error('Expected logId');
}

async function testPreferences() {
  const getPrefs = mockHandlers['preferences:get'];
  const updatePrefs = mockHandlers['preferences:update'];

  // Get (should create defaults)
  const getResult = await getPrefs(null, { userId: 'test-user' });

  if (!getResult.success) throw new Error(getResult.error);
  if (getResult.data.pomodoroWorkDuration !== 25) throw new Error('Unexpected default');

  // Update
  const updateResult = await updatePrefs(null, {
    userId: 'test-user',
    updates: {
      pomodoroWorkDuration: 30,
      dailyTimeTarget: 360
    }
  });

  if (!updateResult.success) throw new Error(updateResult.error);

  // Verify update
  const verifyResult = await getPrefs(null, { userId: 'test-user' });
  if (verifyResult.data.pomodoroWorkDuration !== 30) throw new Error('Update failed');
}

async function testStats() {
  const getStats = mockHandlers['mywork:getStats'];

  const result = await getStats(null, { userId: 'test-user' });

  if (!result.success) throw new Error(result.error);
  if (typeof result.data.todayTasks !== 'number') throw new Error('Expected todayTasks number');
  if (typeof result.data.dailyProgress !== 'number') throw new Error('Expected dailyProgress number');
}

// Run tests
runTests()
  .then(success => {
    db.close();
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    db.close();
    process.exit(1);
  });
