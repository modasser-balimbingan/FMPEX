'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const path = require('node:path');

// Load the REAL production event-builder but keep tests offline: stub only
// the DB connection and AMQP publisher at module import time.
const mockPool = { query() { throw new Error('Unexpected live database query in offline test'); } };
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  const from = parent?.filename || '';
  if ((from.endsWith('priceAlertReconciler.js') || from.endsWith('priceAlertPublisher.js')) && request === '../config/database') return mockPool;
  if ((from.endsWith('priceAlertReconciler.js') || from.endsWith('priceAlertPublisher.js')) && request === './rabbitmqService') {
    return { publishPriceAlertEvent() { throw new Error('Unexpected live publish'); } };
  }
  return originalLoad.call(this, request, parent, isMain);
};
let reconciler;
try { reconciler = require(path.resolve(__dirname, '../src/services/priceAlertReconciler')); }
finally { Module._load = originalLoad; }
const { reconcilePriceAlerts, startPriceAlertReconciler } = reconciler;

const quiet = { log() {}, error() {} };
const alerts = [
  { alert_id: 1, user_id: 24, produce_name: 'Rice', target_price: '50.00', condition: '<=', unit: 'kg', region_code: 'IX' },
  { alert_id: 2, user_id: 26, produce_name: 'Rice', target_price: '50.00', condition: '>=', unit: 'kg', region_code: 'IX' },
];
const markets = [
  { market_price_id: 4, produce_name: 'Rice', market_name: 'Market A', location: 'Pagadian City', province: 'Zamboanga del Sur', price: '47.00', unit: 'kg', price_date: '2026-11-07' },
  { market_price_id: 6, produce_name: 'Rice', market_name: 'Market B', location: 'Ipil', province: 'Zamboanga Sibugay', price: '49.00', unit: 'kg', price_date: '2026-11-07' },
  { market_price_id: 7, produce_name: 'Rice', market_name: 'Market C', location: 'Dipolog City', province: 'Zamboanga del Norte', price: '52.00', unit: 'kg', price_date: '2026-11-07' },
];
function dbWith({ activeAlerts = alerts, latest = markets, recordedIds = new Set(), onQuery } = {}) {
  const queries = [];
  return {
    queries,
    async query(sql, params) {
      queries.push({ sql, params });
      onQuery?.(sql, params);
      if (sql.includes('FROM public.price_alerts')) return { rows: activeAlerts };
      if (sql.includes('FROM public.market_prices')) return { rows: latest };
      if (sql.includes('FROM public.notifications')) return { rows: params[0].filter(id => recordedIds.has(id)).map(event_id => ({ event_id })) };
      if (sql.includes('current_database()')) return { rows: [{ database_name: 'ARDNET-DB_Restoration_Test' }] };
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
}

test('one combined event per qualifying alert, no per-market duplicates', async () => {
  const db = dbWith();
  const sent = [];
  const outcome = await reconcilePriceAlerts({ db, publish: async e => sent.push(e), logger: quiet });
  assert.equal(outcome.published, 2);
  assert.equal(sent.length, 2);
  assert.equal(sent[0].qualifyingMarkets.length, 2);
  assert.equal(sent[1].qualifyingMarkets.length, 1);
  assert.equal(sent[0].eventType, 'regional-price-alert');
  assert.equal(sent[1].regionCode, 'IX');
  assert.match(sent[0].eventId, /^[a-f0-9]{64}$/);
  assert.equal(db.queries.filter(q => q.sql.includes('FROM public.market_prices')).length, 1);
});

test('recorded event IDs are skipped, even if email status is failed', async () => {
  const initial = [];
  await reconcilePriceAlerts({ db: dbWith(), publish: async e => initial.push(e), logger: quiet });
  const sent = [];
  const db = dbWith({ recordedIds: new Set([initial[0].eventId]) });
  const result = await reconcilePriceAlerts({ db, publish: async e => sent.push(e), logger: quiet });
  assert.equal(result.alreadyRecorded, 1);
  assert.equal(result.published, 1);
  assert.equal(sent[0].alertId, 2);
});

test('failed publish is not cached and retries on next scan', async () => {
  const db = dbWith({ activeAlerts: alerts.slice(0, 1) });
  const cache = new Map();
  let attempts = 0;
  const publish = async () => { attempts++; if (attempts === 1) throw new Error('ECONNREFUSED'); };
  const a = await reconcilePriceAlerts({ db, publish, recentlyPublished: cache, logger: quiet });
  const b = await reconcilePriceAlerts({ db, publish, recentlyPublished: cache, logger: quiet });
  assert.equal(a.publishFailures, 1);
  assert.equal(b.published, 1);
  assert.equal(attempts, 2);
  assert.equal(cache.size, 1);
});

test('successful publish is throttled when worker offline and no notification row exists', async () => {
  const db = dbWith({ activeAlerts: alerts.slice(0, 1) });
  const cache = new Map();
  let time = 1000, publishes = 0;
  const common = { db, publish: async () => { publishes++; }, recentlyPublished: cache, logger: quiet, now: () => time, cooldownMs: 10_000 };
  await reconcilePriceAlerts(common);
  const b = await reconcilePriceAlerts(common);
  assert.equal(b.cooldownSkipped, 1);
  assert.equal(publishes, 1);
  time += 10_001;
  await reconcilePriceAlerts(common);
  assert.equal(publishes, 2);
});

test('recorded event clears recent-published cache', async () => {
  const db = dbWith({ activeAlerts: alerts.slice(0, 1) });
  const cache = new Map();
  const sent = [];
  await reconcilePriceAlerts({ db, publish: async e => sent.push(e), recentlyPublished: cache, logger: quiet });
  assert.equal(cache.size, 1);
  await reconcilePriceAlerts({ db: dbWith({ activeAlerts: alerts.slice(0, 1), recordedIds: new Set([sent[0].eventId]) }), publish: async () => { throw Error('Unexpected publish'); }, recentlyPublished: cache, logger: quiet });
  assert.equal(cache.size, 0);
});

test('no active alerts means zero DB price reads and zero publishes', async () => {
  const db = dbWith({ activeAlerts: [] });
  const result = await reconcilePriceAlerts({ db, publish: async () => { throw Error('Should not publish'); }, logger: quiet });
  assert.equal(result.published, 0);
  assert.equal(db.queries.length, 1);
});

async function withEnv(patch, operation) {
  const original = {};
  for (const [key, value] of Object.entries(patch)) {
    original[key] = process.env[key];
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  try { return await operation(); }
  finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}

test('scheduler disabled by default and never queries DB', async () => {
  await withEnv({ PRICE_ALERT_RECONCILE_ENABLED: undefined }, async () => {
    const result = await startPriceAlertReconciler({ db: { query() { throw Error('Unexpected query'); } }, logger: quiet });
    assert.equal(result.started, false);
  });
});

test('scheduler refuses preview mode and wrong database', async () => {
  await withEnv({ PRICE_ALERT_RECONCILE_ENABLED: 'true', PRICE_ALERT_PUBLISH_MODE: 'preview', PRICE_ALERT_RECONCILE_DATABASE: 'ARDNET-DB_Restoration_Test' }, async () => {
    await assert.rejects(() => startPriceAlertReconciler({ db: dbWith(), logger: quiet }), /publish/);
  });
  await withEnv({ PRICE_ALERT_RECONCILE_ENABLED: 'true', PRICE_ALERT_PUBLISH_MODE: 'publish', PRICE_ALERT_RECONCILE_DATABASE: 'Farm_to_Market_Exchange_DB' }, async () => {
    await assert.rejects(() => startPriceAlertReconciler({ db: dbWith(), logger: quiet }), /Database mismatch/);
  });
});

test('scheduler starts with explicit DB allowlist, can run and stop', async () => {
  await withEnv({ PRICE_ALERT_RECONCILE_ENABLED: 'true', PRICE_ALERT_PUBLISH_MODE: 'publish', PRICE_ALERT_RECONCILE_DATABASE: 'ARDNET-DB_Restoration_Test', PRICE_ALERT_RECONCILE_INTERVAL_MS: '60000', PRICE_ALERT_RECONCILE_COOLDOWN_MS: '600000' }, async () => {
    let scheduled, stopped = false;
    const published = [];
    const service = await startPriceAlertReconciler({
      db: dbWith({ activeAlerts: alerts.slice(0, 1) }),
      publish: async event => published.push(event),
      logger: quiet,
      setIntervalFn: (cb, ms) => { scheduled = cb; assert.equal(ms, 60000); return 42; },
      clearIntervalFn: (token) => { assert.equal(token, 42); stopped = true; },
    });
    assert.equal(service.started, true);
    // First scan may still be pending, so allow microtasks to settle.
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(published.length, 1);
    scheduled();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(published.length, 1); // throttled
    service.stop();
    assert.equal(stopped, true);
    await service.run();
    assert.equal(published.length, 1);
  });
});

test('missing database safety allowlist refuses to start', async () => {
  await withEnv({ PRICE_ALERT_RECONCILE_ENABLED: 'true', PRICE_ALERT_PUBLISH_MODE: 'publish', PRICE_ALERT_RECONCILE_DATABASE: undefined }, async () => {
    await assert.rejects(() => startPriceAlertReconciler({ db: dbWith(), logger: quiet }), /PRICE_ALERT_RECONCILE_DATABASE/);
  });
});
