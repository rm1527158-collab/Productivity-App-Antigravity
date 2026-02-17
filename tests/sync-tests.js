/**
 * Database Sync Verification Tests
 * Tests real-time data consistency between API writes and reads.
 * Proves that data persists immediately and reflects across endpoints.
 * 
 * Prerequisites: Server must be running on localhost:5000
 * Run: node tests/sync-tests.js
 */

const BASE_URL = 'http://localhost:5000/api';
const USER_ID = '507f1f77bcf86cd799439011';
const headers = { 'Content-Type': 'application/json', 'x-user-id': USER_ID };

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
  if (actual !== expected) throw new Error(`${label}: expected "${expected}", got "${actual}"`);
}

async function request(method, path, body = null) {
  const opts = { method, headers: { ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json().catch(() => null);
  return { status: res.status, data, ok: res.ok };
}

const today = new Date();
today.setUTCHours(0, 0, 0, 0);
const todayISO = today.toISOString();

// Cleanup helper — delete test data by title pattern
async function cleanupTasks(titlePattern) {
  const { data: tasks } = await request('GET', `/tasks?scope=daily&date=${todayISO}`);
  for (const t of tasks) {
    if (t.title.includes(titlePattern)) {
      await request('DELETE', `/tasks/${t._id}`);
    }
  }
}

async function cleanupHabits(titlePattern) {
  const { data: habits } = await request('GET', '/habits');
  for (const h of habits) {
    if (h.title.includes(titlePattern)) {
      await request('DELETE', `/habits/${h._id}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYNC TESTS
// ═══════════════════════════════════════════════════════════════════════════════
async function runSyncTests() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   🔄 DATABASE SYNC VERIFICATION TESTS                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  // ─── Test 1: Write → Read Consistency ───────────────────────────────────────
  console.log('\n── Write → Read Consistency ──');
  await test('1. Task created via POST appears immediately in GET', async () => {
    const { data: created } = await request('POST', '/tasks', {
      title: 'SYNC-TEST-WR-1',
      section: 'should',
      scope: 'daily',
      date: todayISO,
      priority: 'medium'
    });
    assert(created._id, 'Task created');

    // Immediately read
    const { data: tasks } = await request('GET', `/tasks?scope=daily&date=${todayISO}`);
    const found = tasks.find(t => t._id === created._id);
    assert(found, 'Created task must be found immediately in GET');
    assertEqual(found.title, 'SYNC-TEST-WR-1', 'Title must match');

    await request('DELETE', `/tasks/${created._id}`);
  });

  // ─── Test 2: Update → Read Consistency ──────────────────────────────────────
  console.log('\n── Update → Read Consistency ──');
  await test('2. Updated task reflects immediately in GET', async () => {
    const { data: created } = await request('POST', '/tasks', {
      title: 'SYNC-TEST-UR-2',
      section: 'should',
      scope: 'daily',
      date: todayISO,
      priority: 'low'
    });

    // Update
    await request('PUT', `/tasks/${created._id}`, {
      title: 'SYNC-TEST-UR-2-UPDATED',
      completed: true,
      version: 0
    });

    // Read immediately
    const { data: tasks } = await request('GET', `/tasks?scope=daily&date=${todayISO}`);
    const found = tasks.find(t => t._id === created._id);
    assert(found, 'Task must still be found');
    assertEqual(found.title, 'SYNC-TEST-UR-2-UPDATED', 'Title must be updated');
    assertEqual(found.completed, true, 'Completed must be true');

    await request('DELETE', `/tasks/${created._id}`);
  });

  // ─── Test 3: Delete → Read Consistency ──────────────────────────────────────
  console.log('\n── Delete → Read Consistency ──');
  await test('3. Deleted task disappears immediately from GET', async () => {
    const { data: created } = await request('POST', '/tasks', {
      title: 'SYNC-TEST-DR-3',
      section: 'should',
      scope: 'daily',
      date: todayISO,
      priority: 'low'
    });

    await request('DELETE', `/tasks/${created._id}`);

    // Read immediately
    const { data: tasks } = await request('GET', `/tasks?scope=daily&date=${todayISO}`);
    const found = tasks.find(t => t._id === created._id);
    assert(!found, 'Deleted task must NOT appear in GET');
  });

  // ─── Test 4: Dashboard reflects task changes ───────────────────────────────
  console.log('\n── Dashboard Sync ──');
  await test('4. Dashboard summary reflects newly created tasks', async () => {
    // Get baseline dashboard
    const { data: before } = await request('GET', '/dashboard/summary');
    const dailyBefore = before.daily.total || 0;

    // Create a task
    const { data: created } = await request('POST', '/tasks', {
      title: 'SYNC-TEST-DASH-4',
      section: 'should',
      scope: 'daily',
      date: todayISO,
      priority: 'medium'
    });

    // Get dashboard again
    const { data: after } = await request('GET', '/dashboard/summary');
    const dailyAfter = after.daily.total || 0;

    assert(dailyAfter >= dailyBefore + 1, `Dashboard daily total should increase: before=${dailyBefore}, after=${dailyAfter}`);

    await request('DELETE', `/tasks/${created._id}`);
  });

  // ─── Test 5: Cross-entity sync (habits ↔ dashboard) ────────────────────────
  console.log('\n── Cross-Entity Sync ──');
  await test('5. Marking a habit complete reflects in dashboard habitsToday', async () => {
    // Create a habit
    const { data: habit } = await request('POST', '/habits', {
      title: 'SYNC-TEST-CROSS-5',
      frequency: 'daily',
      startDate: todayISO
    });

    // Get dashboard before marking
    const { data: beforeMark } = await request('GET', '/dashboard/summary');
    const completedBefore = beforeMark.habitsToday || 0;

    // Mark habit complete
    await request('POST', `/habits/${habit._id}/mark`, {
      date: todayISO,
      completed: true
    });

    // Get dashboard after marking
    const { data: afterMark } = await request('GET', '/dashboard/summary');
    const completedAfter = afterMark.habitsToday || 0;

    assert(completedAfter >= completedBefore + 1, `Habits completed should increase: before=${completedBefore}, after=${completedAfter}`);

    // Cleanup
    await request('DELETE', `/habits/${habit._id}`);
  });

  // ─── Test 6: Settings persistence ──────────────────────────────────────────
  console.log('\n── Settings Persistence ──');
  await test('6. Profile changes persist across requests', async () => {
    const uniqueTitle = `SyncTest-${Date.now()}`;

    await request('PUT', '/settings/preferences', {
      account: { title: uniqueTitle }
    });

    // Read immediately
    const { data: prefs } = await request('GET', '/settings/preferences');
    assertEqual(prefs.account.title, uniqueTitle, 'Title must persist immediately');

    // Restore
    await request('PUT', '/settings/preferences', {
      account: { title: 'Productivity Enthusiast' }
    });
  });

  // ─── Test 7: Multi-endpoint consistency ────────────────────────────────────
  console.log('\n── Multi-endpoint Consistency ──');
  await test('7. All endpoints agree on data after changes', async () => {
    // Create 2 tasks and 1 habit
    const { data: t1 } = await request('POST', '/tasks', {
      title: 'SYNC-TEST-MULTI-7a', section: 'should', scope: 'daily', date: todayISO, priority: 'low'
    });
    const { data: t2 } = await request('POST', '/tasks', {
      title: 'SYNC-TEST-MULTI-7b', section: 'could', scope: 'daily', date: todayISO, priority: 'low'
    });
    const { data: h1 } = await request('POST', '/habits', {
      title: 'SYNC-TEST-MULTI-7h', frequency: 'daily', startDate: todayISO
    });

    // Verify GET /tasks returns both
    const { data: tasks } = await request('GET', `/tasks?scope=daily&date=${todayISO}`);
    assert(tasks.find(t => t._id === t1._id), 'Task 1 in GET /tasks');
    assert(tasks.find(t => t._id === t2._id), 'Task 2 in GET /tasks');

    // Verify GET /habits returns the habit
    const { data: habits } = await request('GET', '/habits');
    assert(habits.find(h => h._id === h1._id), 'Habit in GET /habits');

    // Verify dashboard reflects both
    const { data: dash } = await request('GET', '/dashboard/summary');
    assert(dash.daily.total >= 2, `Dashboard shows at least 2 tasks: got ${dash.daily.total}`);

    // Verify export includes all
    const { data: exported } = await request('GET', '/settings/export');
    assert(exported.tasks.find(t => t._id === t1._id), 'Task 1 in export');
    assert(exported.tasks.find(t => t._id === t2._id), 'Task 2 in export');
    assert(exported.habits.find(h => h._id === h1._id), 'Habit in export');

    // Cleanup
    await request('DELETE', `/tasks/${t1._id}`);
    await request('DELETE', `/tasks/${t2._id}`);
    await request('DELETE', `/habits/${h1._id}`);
  });

  // ─── Test 8: Rapid fire consistency ────────────────────────────────────────
  console.log('\n── Rapid Fire Consistency ──');
  await test('8. 5 items created rapidly all appear in subsequent GET', async () => {
    const ids = [];
    // Create 5 tasks as fast as possible (parallel)
    const createPromises = Array.from({ length: 5 }, (_, i) =>
      request('POST', '/tasks', {
        title: `SYNC-RAPID-8-${i}`,
        section: 'could',
        scope: 'daily',
        date: todayISO,
        priority: 'low'
      })
    );
    const createResults = await Promise.all(createPromises);
    for (const r of createResults) {
      assert(r.data._id, 'Each rapid-created task should have _id');
      ids.push(r.data._id);
    }

    // Immediately get all tasks
    const { data: tasks } = await request('GET', `/tasks?scope=daily&date=${todayISO}`);
    for (const id of ids) {
      assert(tasks.find(t => t._id === id), `Rapid task ${id} must appear`);
    }

    // Cleanup
    for (const id of ids) {
      await request('DELETE', `/tasks/${id}`);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════════
async function run() {
  try {
    await runSyncTests();
  } catch (err) {
    console.error('\n💥 Unexpected error:', err);
  }

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║               🔄 SYNC TEST RESULTS                      ║');
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
