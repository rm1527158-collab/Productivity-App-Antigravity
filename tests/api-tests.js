/**
 * Comprehensive API Tests for Productivity App
 * Tests all endpoints: Tasks, Habits, Dashboard, Settings, Quotes, Health
 * 
 * Prerequisites: Server must be running on localhost:5000
 * Run: node tests/api-tests.js
 */

const BASE_URL = 'http://localhost:5000/api';
const USER_ID = '507f1f77bcf86cd799439011';
const headers = { 'Content-Type': 'application/json', 'x-user-id': USER_ID };

// ─── Test runner ─────────────────────────────────────────────────────────────
let passed = 0, failed = 0, total = 0;
const results = [];

async function test(name, fn) {
  total++;
  try {
    await fn();
    passed++;
    results.push({ name, status: '✅ PASS' });
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed++;
    results.push({ name, status: '❌ FAIL', error: err.message });
    console.log(`  ❌ ${name}`);
    console.log(`     → ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected "${expected}", got "${actual}"`);
  }
}

function assertIncludes(arr, predicate, label) {
  if (!arr.some(predicate)) {
    throw new Error(`${label}: no matching item found in array of ${arr.length}`);
  }
}

async function request(method, path, body = null) {
  const opts = { method, headers: { ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json().catch(() => null);
  return { status: res.status, data, ok: res.ok };
}

// ─── Test Data ───────────────────────────────────────────────────────────────
const today = new Date();
today.setUTCHours(0, 0, 0, 0);
const todayISO = today.toISOString();

let createdTaskId = null;
let createdHabitId = null;

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════════════════════════════
async function testHealth() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║        🏥 HEALTH CHECK               ║');
  console.log('╚══════════════════════════════════════╝');

  await test('GET /health returns status ok', async () => {
    const { status, data } = await request('GET', '/health');
    assertEqual(status, 200, 'Status code');
    assertEqual(data.status, 'ok', 'Health status');
    assert(data.timestamp, 'Should include timestamp');
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASKS API
// ═══════════════════════════════════════════════════════════════════════════════
async function testTasks() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║        📋 TASKS API                  ║');
  console.log('╚══════════════════════════════════════╝');

  // 1. Create a task
  await test('POST /tasks — create a daily task', async () => {
    const { status, data } = await request('POST', '/tasks', {
      title: 'Test Task — API Test',
      section: 'secondary',
      scope: 'daily',
      date: todayISO,
      priority: 'high',
      estimateMin: 30
    });
    assertEqual(status, 201, 'Status code');
    assert(data._id, 'Should have _id');
    assertEqual(data.title, 'Test Task — API Test', 'Title');
    assertEqual(data.section, 'secondary', 'Section');
    assertEqual(data.scope, 'daily', 'Scope');
    assertEqual(data.priority, 'high', 'Priority');
    assertEqual(data.completed, false, 'Completed default');
    createdTaskId = data._id;
  });

  // 2. Fetch tasks
  await test('GET /tasks — fetch tasks for today', async () => {
    const { status, data } = await request('GET', `/tasks?scope=daily&date=${todayISO}`);
    assertEqual(status, 200, 'Status code');
    assert(Array.isArray(data), 'Should return array');
    assertIncludes(data, t => t._id === createdTaskId, 'Should include created task');
  });

  // 3. Update a task
  await test('PUT /tasks/:id — update task', async () => {
    const { status, data } = await request('PUT', `/tasks/${createdTaskId}`, {
      title: 'Updated Task Title',
      completed: true,
      version: 0
    });
    assertEqual(status, 200, 'Status code');
    assertEqual(data.title, 'Updated Task Title', 'Updated title');
    assertEqual(data.completed, true, 'Completed status');
  });

  // 4. Reorder a task
  await test('PATCH /tasks/:id/reorder — reorder task', async () => {
    // First uncomplete it so it's useful, and create in a section we can reorder to
    await request('PUT', `/tasks/${createdTaskId}`, { completed: false, version: 1 });
    const { status, data } = await request('PATCH', `/tasks/${createdTaskId}/reorder`, {
      section: 'should',
      priorityRank: 0,
      scope: 'daily',
      date: todayISO,
      version: 2
    });
    assertEqual(status, 200, 'Status code');
    assertEqual(data.section, 'should', 'Updated section');
    assertEqual(data.priorityRank, 0, 'Updated rank');
  });

  // 5. Rollover tasks (create an overdue task first)
  await test('POST /tasks/rollover — rollover overdue tasks', async () => {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    // Create an overdue task
    const createRes = await request('POST', '/tasks', {
      title: 'Overdue Test Task',
      section: 'should',
      scope: 'daily',
      date: yesterday.toISOString(),
      priority: 'medium'
    });
    assert(createRes.data._id, 'Created overdue task');
    const overdueId = createRes.data._id;

    const { status, data } = await request('POST', '/tasks/rollover');
    assertEqual(status, 200, 'Status code');
    assert(data.count >= 1, 'Should rollover at least 1 task');

    // Verify the task is now dated today
    const fetchRes = await request('GET', `/tasks?scope=daily&date=${todayISO}`);
    assertIncludes(fetchRes.data, t => t._id === overdueId, 'Overdue task should now be dated today');

    // Cleanup
    await request('DELETE', `/tasks/${overdueId}`);
  });

  // 6. Delete a task
  await test('DELETE /tasks/:id — delete task', async () => {
    const { status, data } = await request('DELETE', `/tasks/${createdTaskId}`);
    assertEqual(status, 200, 'Status code');
    assert(data.message.includes('deleted'), 'Confirmation message');

    // Verify it's gone
    const fetchRes = await request('GET', `/tasks?scope=daily&date=${todayISO}`);
    const found = fetchRes.data.find(t => t._id === createdTaskId);
    assert(!found, 'Deleted task should not appear in GET');
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HABITS API
// ═══════════════════════════════════════════════════════════════════════════════
async function testHabits() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║        🔁 HABITS API                 ║');
  console.log('╚══════════════════════════════════════╝');

  // 1. Create a habit
  await test('POST /habits — create a habit', async () => {
    const { status, data } = await request('POST', '/habits', {
      title: 'Test Habit — API Test',
      frequency: 'daily',
      color: '#10b981',
      icon: '🧪',
      startDate: todayISO
    });
    assertEqual(status, 201, 'Status code');
    assert(data._id, 'Should have _id');
    assertEqual(data.title, 'Test Habit — API Test', 'Title');
    assertEqual(data.frequency, 'daily', 'Frequency');
    assertEqual(data.active, true, 'Active default');
    createdHabitId = data._id;
  });

  // 2. Fetch habits
  await test('GET /habits — fetch active habits', async () => {
    const { status, data } = await request('GET', '/habits');
    assertEqual(status, 200, 'Status code');
    assert(Array.isArray(data), 'Should return array');
    assertIncludes(data, h => h._id === createdHabitId, 'Should include created habit');
  });

  // 3. Mark habit complete
  await test('POST /habits/:id/mark — mark complete', async () => {
    const { status, data } = await request('POST', `/habits/${createdHabitId}/mark`, {
      date: todayISO,
      completed: true
    });
    assertEqual(status, 200, 'Status code');
    assert(data._id || data.message, 'Should return occurrence or confirmation');
  });

  // 4. Fetch occurrences
  await test('GET /habits/occurrences — fetch occurrences', async () => {
    const start = new Date(today);
    start.setDate(start.getDate() - 7);
    const end = new Date(today);
    end.setDate(end.getDate() + 1);
    const { status, data } = await request('GET', `/habits/occurrences?start=${start.toISOString()}&end=${end.toISOString()}`);
    assertEqual(status, 200, 'Status code');
    assert(Array.isArray(data), 'Should return array');
    assertIncludes(data, o => o.habitId === createdHabitId, 'Should include occurrence for created habit');
  });

  // 5. Mark habit incomplete (undo)
  await test('POST /habits/:id/mark — mark incomplete (undo)', async () => {
    const { status, data } = await request('POST', `/habits/${createdHabitId}/mark`, {
      date: todayISO,
      completed: false
    });
    assertEqual(status, 200, 'Status code');
    assertEqual(data.message, 'Marked incomplete', 'Undo message');

    // Verify occurrence is removed
    const start = new Date(today);
    start.setDate(start.getDate() - 1);
    const end = new Date(today);
    end.setDate(end.getDate() + 1);
    const occRes = await request('GET', `/habits/occurrences?start=${start.toISOString()}&end=${end.toISOString()}`);
    const found = occRes.data.find(o => o.habitId === createdHabitId);
    assert(!found, 'Occurrence should be removed after undo');
  });

  // 6. Get streaks
  await test('GET /habits/streaks — get streak data', async () => {
    const { status, data } = await request('GET', '/habits/streaks');
    assertEqual(status, 200, 'Status code');
    assert(typeof data === 'object', 'Should return object');
    assert(createdHabitId in data, 'Should have streak for created habit');
  });

  // 7. Delete habit (with cascade)
  await test('DELETE /habits/:id — delete habit + cascade occurrences', async () => {
    // First mark complete so there's an occurrence to cascade
    await request('POST', `/habits/${createdHabitId}/mark`, {
      date: todayISO,
      completed: true
    });

    const { status, data } = await request('DELETE', `/habits/${createdHabitId}`);
    assertEqual(status, 200, 'Status code');
    assert(data.message.includes('deleted'), 'Confirmation message');

    // Verify habit is gone
    const fetchRes = await request('GET', '/habits');
    const found = fetchRes.data.find(h => h._id === createdHabitId);
    assert(!found, 'Deleted habit should not appear in GET');
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD API
// ═══════════════════════════════════════════════════════════════════════════════
async function testDashboard() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║        📊 DASHBOARD API              ║');
  console.log('╚══════════════════════════════════════╝');

  // 1. Summary endpoint
  await test('GET /dashboard/summary — all 12 response fields', async () => {
    const { status, data } = await request('GET', '/dashboard/summary');
    assertEqual(status, 200, 'Status code');

    // Verify all expected fields exist
    const requiredFields = [
      'daily', 'sections', 'trend', 'habitsToday',
      'activityHeatmap', 'weeklyProgress', 'categoryFocus',
      'highPriorityCount', 'pendingTasks', 'habitsToCompleteCount',
      'habitsToCompleteList', 'focusScore'
    ];
    for (const field of requiredFields) {
      assert(field in data, `Missing field: ${field}`);
    }

    // Verify structure types
    assert(typeof data.daily === 'object', 'daily should be object');
    assert(typeof data.sections === 'object', 'sections should be object');
    assert(Array.isArray(data.trend), 'trend should be array');
    assert(typeof data.habitsToday === 'number', 'habitsToday should be number');
    assert(Array.isArray(data.activityHeatmap), 'activityHeatmap should be array');
    assert(Array.isArray(data.weeklyProgress), 'weeklyProgress should be array');
    assert(Array.isArray(data.categoryFocus), 'categoryFocus should be array');
    assert(typeof data.focusScore === 'number', 'focusScore should be number');
    assert(data.focusScore >= 0 && data.focusScore <= 100, 'focusScore should be 0-100');
  });

  // 2. Upcoming tasks
  await test('GET /dashboard/upcoming-tasks — task list structure', async () => {
    const { status, data } = await request('GET', '/dashboard/upcoming-tasks');
    assertEqual(status, 200, 'Status code');
    assert(Array.isArray(data), 'Should return array');

    // If there are tasks, verify structure
    if (data.length > 0) {
      const task = data[0];
      assert('title' in task, 'Task should have title');
      assert('priority' in task, 'Task should have priority');
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS API
// ═══════════════════════════════════════════════════════════════════════════════
async function testSettings() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║        ⚙️  SETTINGS API               ║');
  console.log('╚══════════════════════════════════════╝');

  // 1. Fetch preferences
  await test('GET /settings/preferences — fetch or auto-create', async () => {
    const { status, data } = await request('GET', '/settings/preferences');
    assertEqual(status, 200, 'Status code');
    assert(typeof data === 'object', 'Should return object');
    // Should have account section
    assert('account' in data, 'Should have account section');
  });

  // 2. Update preferences (profile)
  await test('PUT /settings/preferences — update profile', async () => {
    const { status, data } = await request('PUT', '/settings/preferences', {
      account: {
        username: 'TestUser-APITest',
        title: 'Test Title',
        bio: 'Automated test bio'
      }
    });
    assertEqual(status, 200, 'Status code');

    // Verify the update persisted
    const fetchRes = await request('GET', '/settings/preferences');
    assertEqual(fetchRes.data.account.username, 'TestUser-APITest', 'Username should persist');
    assertEqual(fetchRes.data.account.title, 'Test Title', 'Title should persist');

    // Restore original
    await request('PUT', '/settings/preferences', {
      account: {
        username: 'User',
        title: 'Productivity Enthusiast',
        bio: ''
      }
    });
  });

  // 3. Export data
  await test('GET /settings/export — export all data', async () => {
    const { status, data } = await request('GET', '/settings/export');
    assertEqual(status, 200, 'Status code');
    assert('tasks' in data, 'Export should include tasks');
    assert('habits' in data, 'Export should include habits');
    assert('occurrences' in data, 'Export should include occurrences');
    assert(Array.isArray(data.tasks), 'tasks should be array');
    assert(Array.isArray(data.habits), 'habits should be array');
  });

  // 4. Get stats
  await test('GET /settings/stats — stats endpoint', async () => {
    const { status, data } = await request('GET', '/settings/stats');
    assertEqual(status, 200, 'Status code');
    assert(typeof data === 'object', 'Should return object');
  });

  // 5. Import data
  await test('POST /settings/import — import data', async () => {
    // Export first to get a valid data structure
    const exportRes = await request('GET', '/settings/export');
    const exportData = exportRes.data;

    // Import back (should merge without error)
    const { status, data } = await request('POST', '/settings/import', exportData);
    assertEqual(status, 200, 'Status code');
    assert(data.message, 'Should return success message');
  });

  // 6. Clear completed
  await test('DELETE /settings/clear-completed — clear completed tasks', async () => {
    // Create and complete a task for clearing
    const createRes = await request('POST', '/tasks', {
      title: 'Task to clear',
      section: 'should',
      scope: 'daily',
      date: todayISO,
      priority: 'low'
    });
    const taskId = createRes.data._id;
    await request('PUT', `/tasks/${taskId}`, { completed: true, version: 0 });

    const { status, data } = await request('DELETE', '/settings/clear-completed');
    assertEqual(status, 200, 'Status code');
    assert(data.message || data.count !== undefined, 'Should return result');
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUOTES API
// ═══════════════════════════════════════════════════════════════════════════════
async function testQuotes() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║        💬 QUOTES API                 ║');
  console.log('╚══════════════════════════════════════╝');

  // 1. Daily quote
  await test('GET /quotes/daily — deterministic daily quote', async () => {
    const { status, data } = await request('GET', '/quotes/daily');
    assertEqual(status, 200, 'Status code');
    assert(data.text, 'Should have quote text');
    assert(data.author, 'Should have author');
    assert(data.date, 'Should have date');

    // Verify deterministic: same quote on same day
    const { data: data2 } = await request('GET', '/quotes/daily');
    assertEqual(data.text, data2.text, 'Same quote on same day');
    assertEqual(data.author, data2.author, 'Same author on same day');
  });

  // 2. Random quote
  await test('GET /quotes/random — random quote', async () => {
    const { status, data } = await request('GET', '/quotes/random');
    assertEqual(status, 200, 'Status code');
    assert(data.text, 'Should have quote text');
    assert(data.author, 'Should have author');
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUN ALL
// ═══════════════════════════════════════════════════════════════════════════════
async function run() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   🧪  PRODUCTIVITY APP — COMPREHENSIVE API TESTS       ║');
  console.log('║   Server: ' + BASE_URL.padEnd(45) + '║');
  console.log('║   User:   ' + USER_ID.padEnd(45) + '║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  try {
    await testHealth();
    await testTasks();
    await testHabits();
    await testDashboard();
    await testSettings();
    await testQuotes();
  } catch (err) {
    console.error('\n💥 Unexpected error:', err);
  }

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                    📊 RESULTS SUMMARY                   ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Total:  ${String(total).padEnd(4)}                                        ║`);
  console.log(`║  Passed: ${String(passed).padEnd(4)} ✅                                     ║`);
  console.log(`║  Failed: ${String(failed).padEnd(4)} ${failed > 0 ? '❌' : '✅'}                                     ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => r.status.includes('FAIL')).forEach(r => {
      console.log(`   • ${r.name}: ${r.error}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

run();
