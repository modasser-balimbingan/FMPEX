const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const jwt = require('jsonwebtoken');
const columns = Object.fromEntries(Object.entries({ id: 'notification_id', userId: 'user_id', title: 'title', message: 'message', status: 'status', createdAt: 'created_at', readAt: 'read_at', eventId: 'event_id', emailStatus: 'email_status', emailAttempts: 'email_attempts', emailLastError: 'email_last_error', emailSentAt: 'email_sent_at' }).map(([k, v]) => [k, `"${v}"`]));
const db = { query() { throw Error('Unexpected database call'); }, connect() { throw Error('Unexpected connection'); } };
const load = Module._load;
let auth, notifications, accounts, adminUsers;
try {
  Module._load = function (request, parent, isMain) {
    if (request.endsWith('/config/database')) return db;
    if (request.endsWith('/notificationSchema')) return { getNotificationColumns: async () => columns };
    return load.call(this, request, parent, isMain);
  };
  auth = require('../src/middleware/auth');
  notifications = require('../src/controllers/notificationsController');
  accounts = require('../src/services/accountNotifications');
  adminUsers = require('../src/controllers/adminUserController');
} finally { Module._load = load; }

function response() { return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, set() {} }; }
function request() { return { headers: { authorization: `Bearer ${jwt.sign({ id: 11, role: 'farmer' }, process.env.JWT_SECRET || 'your-secret-key')}` } }; }

test('active users can access regular dashboard routes', async () => {
  db.query = async () => ({ rows: [{ status: 'active' }] });
  const req = request(); let next = false;
  await auth.verifyToken(req, response(), () => { next = true; });
  assert.equal(next, true); assert.equal(req.accountStatus, 'active');
});

test('suspended users remain blocked from regular protected actions', async () => {
  db.query = async () => ({ rows: [{ status: 'suspended' }] });
  const res = response(); let next = false;
  await auth.verifyToken(request(), res, () => { next = true; });
  assert.equal(next, false); assert.equal(res.statusCode, 403); assert.equal(res.body.code, 'ACCOUNT_SUSPENDED');
});

test('suspended users can only use the dedicated notification middleware', async () => {
  db.query = async () => ({ rows: [{ status: 'suspended' }] });
  const req = request(); let next = false;
  await auth.verifyTokenForNotifications(req, response(), () => { next = true; });
  assert.equal(next, true); assert.equal(req.accountStatus, 'suspended'); assert.equal(req.user.id, 11);
});

test('notification exception does not admit inactive, deleted, or unauthenticated users', async () => {
  for (const rows of [[{ status: 'inactive' }], []]) {
    db.query = async () => ({ rows }); const res = response();
    await auth.verifyTokenForNotifications(request(), res, () => assert.fail('Must not authenticate'));
    assert.ok([401, 403].includes(res.statusCode));
  }
  const res = response();
  await auth.verifyTokenForNotifications({ headers: {} }, res, () => assert.fail('Token required'));
  assert.equal(res.statusCode, 401);
});

test('welcome notification is account-scoped and has a stable deduplication ID', async () => {
  const writes = []; const connection = { query: async (sql, values) => writes.push({ sql, values }) };
  await accounts.ensureWelcomeNotification(connection, 11);
  await accounts.ensureWelcomeNotification(connection, 11);
  await accounts.ensureWelcomeNotification(connection, 12);
  assert.equal(writes[0].values[0], 11);
  assert.equal(writes[0].values[3], writes[1].values[3]);
  assert.notEqual(writes[0].values[3], writes[2].values[3]);
  assert.match(writes[0].sql, /ON CONFLICT DO NOTHING/);
  assert.match(writes[0].sql, /not_applicable/);
});

test('notification history includes account status and filters by authenticated ID', async () => {
  const history = [{ notification_id: 1, title: 'Account suspended', status: 'Unread' }];
  db.query = async (sql, values) => { assert.equal(values[0], 11); return { rows: sql.startsWith('SELECT') ? history : [] }; };
  const res = response();
  await notifications.getUserNotifications({ user: { id: 11, role: 'farmer' }, accountStatus: 'suspended' }, res);
  assert.equal(res.statusCode, 200); assert.deepEqual(res.body.notifications, history); assert.equal(res.body.accountStatus, 'suspended');
});

test('marking notifications read only modifies the requesting account', async () => {
  db.query = async (sql, values) => { assert.match(sql, /WHERE "user_id" = \$1 AND "status" = 'Unread'/); assert.deepEqual(values, [11]); return { rowCount: 3 }; };
  const res = response(); await notifications.markAllRead({ user: { id: 11 } }, res);
  assert.equal(res.body.updated, 3);
});

test('suspension notification and audit commit in the same account-status transaction', async () => {
  const queries = []; let released = false;
  db.connect = async () => ({ async query(sql, values) {
    queries.push({ sql, values });
    if (sql.includes('FOR UPDATE')) return { rows: [{ user_id: 11, user_name: 'Farmer', status: 'active' }] };
    if (sql.includes('SELECT r.role_name')) return { rows: [{ role_name: 'Farmer' }] };
    if (sql.includes('UPDATE public.users')) return { rows: [{ user_id: 11, user_name: 'Farmer', role_id: 2, status: 'suspended' }] };
    if (sql.includes('SELECT role_name')) return { rows: [{ role_name: 'Farmer' }] };
    return { rows: [] };
  }, release() { released = true; } });
  const res = response();
  await adminUsers.updateUserStatus({ params: { id: '11' }, user: { id: 1 }, body: { status: 'suspended' }, ip: '127.0.0.1' }, res);
  assert.equal(res.statusCode, 200); assert.equal(released, true);
  const notificationIndex = queries.findIndex(q => q.sql.includes('INSERT INTO public.notifications'));
  const commitIndex = queries.findIndex(q => q.sql === 'COMMIT');
  assert.ok(notificationIndex > 0 && notificationIndex < commitIndex);
  assert.equal(queries[notificationIndex].values[0], 11);
  assert.equal(queries[notificationIndex].values[1], 'Account suspended');
  assert.ok(queries.some(q => q.sql.includes('INSERT INTO public.audit_logs')));
});

test('account status rolls back when persisting its notification fails', async () => {
  const sqls = [];
  db.connect = async () => ({ async query(sql) {
    sqls.push(sql);
    if (sql.includes('FOR UPDATE')) return { rows: [{ user_id: 11, user_name: 'Farmer', status: 'active' }] };
    if (sql.includes('SELECT r.role_name')) return { rows: [{ role_name: 'Farmer' }] };
    if (sql.includes('UPDATE public.users')) return { rows: [{ user_id: 11, role_id: 2 }] };
    if (sql.includes('SELECT role_name')) return { rows: [{ role_name: 'Farmer' }] };
    if (sql.includes('INSERT INTO public.notifications')) throw Error('Notification write failed');
    return { rows: [] };
  }, release() {} });
  const res = response();
  await adminUsers.updateUserStatus({ params: { id: '11' }, user: { id: 1 }, body: { status: 'suspended' } }, res);
  assert.equal(res.statusCode, 500); assert.ok(sqls.includes('ROLLBACK')); assert.ok(!sqls.includes('COMMIT'));
});
