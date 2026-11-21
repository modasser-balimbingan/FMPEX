'use strict';

/**
 * ARDNET Region IX - best-effort current-snapshot reconciliation (Approach A).
 *
 * A market-price write can succeed while RabbitMQ is unavailable. This service
 * periodically regenerates the CURRENT qualifying snapshot for each active
 * Region IX alert and publishes any event not recorded in notifications.
 *
 * It deliberately does not create new tables or modify the notification worker.
 * This is not a transactional outbox and does NOT preserve overwritten snapshots.
 */
const pool = require('../config/database');
const {
  LATEST_REGIONAL_PRICES_SQL,
  createCombinedEvent,
} = require('./priceAlertPublisher');
const { publishPriceAlertEvent } = require('./rabbitmqService');

const ACTIVE_ALERTS_SQL = `
  SELECT alert_id, user_id, produce_name, target_price, condition, unit, region_code
  FROM public.price_alerts
  WHERE status = 'Active'
    AND UPPER(TRIM(region_code)) = 'IX'
    AND NULLIF(TRIM(produce_name), '') IS NOT NULL
    AND NULLIF(TRIM(unit), '') IS NOT NULL
  ORDER BY alert_id
`;

const RECORDED_EVENTS_SQL = `
  SELECT event_id FROM public.notifications
  WHERE event_id = ANY($1::varchar[])
`;

const DEFAULT_INTERVAL_MS = 60_000;
const DEFAULT_REPUBLISH_COOLDOWN_MS = 10 * 60_000;
const MAX_RECENTLY_PUBLISHED = 5_000;

function positiveMilliseconds(value, fallback, minimum) {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum) {
    throw new Error(`Expected a whole number of milliseconds >= ${minimum}, got '${value}'`);
  }
  return number;
}

function alertGroupKey(alert) {
  return [
    String(alert.produce_name).trim().toLowerCase(),
    String(alert.unit).trim().toLowerCase(),
    String(alert.region_code).trim().toUpperCase(),
  ].join('\u0000');
}

/**
 * Run one reconciliation pass. All dependencies can be injected for offline tests.
 * `recentlyPublished` lives only in this Node.js process; the database remains
 * the durable authority for already-created notification IDs.
 */
async function reconcilePriceAlerts({
  db = pool,
  publish = publishPriceAlertEvent,
  recentlyPublished = new Map(),
  now = () => Date.now(),
  cooldownMs = DEFAULT_REPUBLISH_COOLDOWN_MS,
  logger = console,
} = {}) {
  const timestamp = now();
  // Keep the short-lived suppression cache bounded even in a long-running app.
  for (const [id, lastSent] of recentlyPublished) {
    if (timestamp - lastSent >= cooldownMs) recentlyPublished.delete(id);
  }
  while (recentlyPublished.size > MAX_RECENTLY_PUBLISHED) {
    recentlyPublished.delete(recentlyPublished.keys().next().value);
  }

  const alertResult = await db.query(ACTIVE_ALERTS_SQL);
  const alerts = alertResult.rows;
  const summary = {
    alerts: alerts.length,
    qualifyingEvents: 0,
    alreadyRecorded: 0,
    cooldownSkipped: 0,
    published: 0,
    publishFailures: 0,
  };
  if (!alerts.length) return summary;

  // Fetch latest market prices once per produce/unit/region, not once per alert.
  const groups = new Map();
  for (const alert of alerts) {
    const key = alertGroupKey(alert);
    if (!groups.has(key)) groups.set(key, { example: alert, alerts: [] });
    groups.get(key).alerts.push(alert);
  }
  const candidates = [];
  for (const group of groups.values()) {
    const { produce_name, unit, region_code } = group.example;
    const latest = await db.query(LATEST_REGIONAL_PRICES_SQL, [produce_name, unit, region_code]);
    for (const alert of group.alerts) {
      const event = createCombinedEvent(alert, latest.rows);
      if (event) candidates.push(event);
    }
  }
  summary.qualifyingEvents = candidates.length;
  if (!candidates.length) return summary;

  // Query recorded event IDs in a single batch. An existing notification (even
  // 'retrying', 'failed', or 'sent') is owned by the notification worker; don't
  // restart its email retry sequence from this reconciler.
  const recorded = await db.query(RECORDED_EVENTS_SQL, [candidates.map((event) => event.eventId)]);
  const existingIds = new Set(recorded.rows.map((row) => row.event_id));

  for (const event of candidates) {
    if (existingIds.has(event.eventId)) {
      summary.alreadyRecorded += 1;
      recentlyPublished.delete(event.eventId);
      continue;
    }
    const sentAt = recentlyPublished.get(event.eventId);
    if (sentAt !== undefined && timestamp - sentAt < cooldownMs) {
      summary.cooldownSkipped += 1;
      continue;
    }
    try {
      await publish(event);
      summary.published += 1;
      recentlyPublished.delete(event.eventId);
      recentlyPublished.set(event.eventId, now());
      while (recentlyPublished.size > MAX_RECENTLY_PUBLISHED) {
        recentlyPublished.delete(recentlyPublished.keys().next().value);
      }
      logger.log(`[Price alert reconciler] Published missing snapshot ${event.eventId} for alert ${event.alertId} (${event.qualifyingMarkets.length} markets).`);
    } catch (error) {
      summary.publishFailures += 1;
      // Never cache unsuccessful publishes: the next pass must retry.
      logger.error(`[Price alert reconciler] Failed to publish alert ${event.alertId}: ${error.message}`);
    }
  }
  return summary;
}

/**
 * Called from the already-running Express server. Disabled by default.
 * Explicit DB-name allowlist prevents accidentally running on the original DB.
 */
async function startPriceAlertReconciler({
  db = pool,
  publish = publishPriceAlertEvent,
  logger = console,
  clock = () => Date.now(),
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval,
} = {}) {
  if (String(process.env.PRICE_ALERT_RECONCILE_ENABLED || '').toLowerCase() !== 'true') {
    logger.log('[Price alert reconciler] Disabled (set PRICE_ALERT_RECONCILE_ENABLED=true to enable).');
    return { started: false, stop() {} };
  }
  if (String(process.env.PRICE_ALERT_PUBLISH_MODE || 'preview').trim().toLowerCase() !== 'publish') {
    throw new Error('Reconciler requires PRICE_ALERT_PUBLISH_MODE=publish.');
  }
  const expectedDatabase = String(process.env.PRICE_ALERT_RECONCILE_DATABASE || '').trim();
  if (!expectedDatabase) {
    throw new Error('Set PRICE_ALERT_RECONCILE_DATABASE to the exact intended database name before enabling reconciliation.');
  }
  const result = await db.query('SELECT current_database() AS database_name');
  const actualDatabase = result.rows[0]?.database_name;
  if (actualDatabase !== expectedDatabase) {
    throw new Error(`Database mismatch: expected '${expectedDatabase}', connected to '${actualDatabase}'. Reconciler not started.`);
  }

  const intervalMs = positiveMilliseconds(process.env.PRICE_ALERT_RECONCILE_INTERVAL_MS, DEFAULT_INTERVAL_MS, 10_000);
  const cooldownMs = positiveMilliseconds(process.env.PRICE_ALERT_RECONCILE_COOLDOWN_MS, DEFAULT_REPUBLISH_COOLDOWN_MS, intervalMs);
  const recentlyPublished = new Map();
  let running = false;
  let stopped = false;

  const run = async () => {
    if (running || stopped) return null;
    running = true;
    try {
      const summary = await reconcilePriceAlerts({
        db, publish, recentlyPublished, now: clock, cooldownMs, logger,
      });
      // One concise line per pass. Avoid logging event payloads/recipient details.
      logger.log(`[Price alert reconciler] Scan: ${summary.alerts} active, ${summary.qualifyingEvents} qualifying, ${summary.alreadyRecorded} recorded, ${summary.cooldownSkipped} cooling down, ${summary.published} published, ${summary.publishFailures} failed.`);
      return summary;
    } catch (error) {
      logger.error(`[Price alert reconciler] Scan failed (will retry next interval): ${error.message}`);
      return null;
    } finally {
      running = false;
    }
  };

  const timer = setIntervalFn(() => { void run(); }, intervalMs);
  logger.log(`[Price alert reconciler] Enabled on '${actualDatabase}', interval ${intervalMs}ms, republish cooldown ${cooldownMs}ms.`);
  // First scan also runs on startup. Do not hold up the Express listener.
  void run();
  return {
    started: true,
    run,
    stop() {
      stopped = true;
      clearIntervalFn(timer);
    },
  };
}

module.exports = {
  reconcilePriceAlerts,
  startPriceAlertReconciler,
  ACTIVE_ALERTS_SQL,
  RECORDED_EVENTS_SQL,
};
