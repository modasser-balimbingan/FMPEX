const crypto = require('crypto');
const pool = require('../config/database');
const { publishPriceAlertEvent } = require('./rabbitmqService');

// Preview is deliberate until the combined-notification worker is installed.
// Supported: off | preview | publish. Unknown values fall back to preview.
function getPublishMode() {
  const mode = String(process.env.PRICE_ALERT_PUBLISH_MODE || 'preview').trim().toLowerCase();
  return ['off', 'preview', 'publish'].includes(mode) ? mode : 'preview';
}

function normalizeCondition(condition) {
  const value = String(condition || '').trim().toLowerCase();
  if (['>=', 'gte', 'at-or-above'].includes(value)) return 'gte';
  if (['<=', 'lte', 'at-or-below'].includes(value)) return 'lte';
  return null;
}

function isConditionMet(condition, currentPrice, targetPrice) {
  const price = Number(currentPrice);
  const target = Number(targetPrice);
  if (!Number.isFinite(price) || !Number.isFinite(target)) return false;
  const normalized = normalizeCondition(condition);
  return normalized === 'gte' ? price >= target :
    normalized === 'lte' ? price <= target : false;
}

function getQualifyingMarkets(alert, latestPrices) {
  const comparison = normalizeCondition(alert.condition);
  const qualified = latestPrices
    .filter((market) => isConditionMet(comparison, market.price, alert.target_price))
    .map((market) => ({
      marketPriceId: market.market_price_id,
      marketName: market.market_name,
      location: market.location,
      province: market.province || null,
      locationType: market.location_type || null,
      price: Number(market.price),
      unit: market.unit,
      priceDate: market.price_date, // SQL returns YYYY-MM-DD
    }));
  // Fixed ordering makes message content and event IDs deterministic.
  qualified.sort((a, b) =>
    a.location.localeCompare(b.location) || a.marketName.localeCompare(b.marketName) ||
    String(a.province || '').localeCompare(String(b.province || ''))
  );
  return qualified;
}

function createEventId(alert, markets) {
  // A stable snapshot ID prevents retries or identical market updates from
  // generating duplicate notifications. The next changed qualifying snapshot
  // creates a new ID. No timestamp or database record ID is used here.
  const identity = {
    version: 2,
    alertId: Number(alert.alert_id),
    userId: Number(alert.user_id),
    produce: String(alert.produce_name).trim().toLowerCase(),
    unit: String(alert.unit).trim().toLowerCase(),
    region: String(alert.region_code).trim().toUpperCase(),
    condition: normalizeCondition(alert.condition),
    targetPrice: Number(alert.target_price).toFixed(2),
    qualifyingMarkets: markets.map((m) => [
      String(m.marketName).trim().toLowerCase(),
      String(m.location).trim().toLowerCase(),
      String(m.province || '').trim().toLowerCase(),
      Number(m.price).toFixed(2),
      String(m.priceDate).slice(0, 10),
    ]),
  };
  return crypto.createHash('sha256').update(JSON.stringify(identity)).digest('hex');
}

function createCombinedEvent(alert, latestPrices) {
  const markets = getQualifyingMarkets(alert, latestPrices);
  if (!markets.length) return null;
  return {
    eventId: createEventId(alert, markets),
    eventType: 'regional-price-alert',
    eventVersion: 2,
    alertId: Number(alert.alert_id),
    userId: Number(alert.user_id),
    produceName: alert.produce_name,
    targetPrice: Number(alert.target_price),
    condition: normalizeCondition(alert.condition),
    unit: alert.unit,
    regionCode: String(alert.region_code).trim().toUpperCase(),
    qualifyingMarkets: markets,
    occurredAt: new Date().toISOString(),
  };
}

// Select ONE most recent, non-future price per market for a produce/unit/region.
// Distinct market identity = market name + location + province. Ordering by
// date, creation time, then ID resolves duplicates deterministically.
const LATEST_REGIONAL_PRICES_SQL = `
  SELECT market_price_id, produce_name, market_name, location, province,
         location_type, region_code, price, unit, price_date
  FROM (
    SELECT DISTINCT ON (
        LOWER(TRIM(market_name)), LOWER(TRIM(location)),
        LOWER(TRIM(COALESCE(province, '')))
      )
      market_price_id, produce_name, market_name, location, province,
      location_type, region_code, price, unit,
      TO_CHAR(price_date, 'YYYY-MM-DD') AS price_date
    FROM public.market_prices
    WHERE LOWER(TRIM(produce_name)) = LOWER(TRIM($1))
      AND LOWER(TRIM(unit)) = LOWER(TRIM($2))
      AND UPPER(TRIM(region_code)) = UPPER(TRIM($3))
      AND price_date <= CURRENT_DATE
    ORDER BY LOWER(TRIM(market_name)), LOWER(TRIM(location)),
             LOWER(TRIM(COALESCE(province, ''))),
             price_date DESC, created_at DESC, market_price_id DESC
  ) AS latest
  ORDER BY LOWER(TRIM(location)), LOWER(TRIM(market_name))
`;

async function publishMatchingPriceAlerts(updatedPrice) {
  try {
    const region = String(updatedPrice?.region_code || '').trim().toUpperCase();
    if (region !== 'IX') {
      console.log(`[Price alerts] Market price ${updatedPrice?.market_price_id || '?'} is not classified as Region IX; skipping regional alerts.`);
      return { evaluated: 0, qualifying: 0, published: 0 };
    }

    const alertResult = await pool.query(
      `SELECT alert_id, user_id, produce_name, target_price, condition, unit, region_code
       FROM public.price_alerts
       WHERE LOWER(TRIM(produce_name)) = LOWER(TRIM($1))
         AND LOWER(TRIM(unit)) = LOWER(TRIM($2))
         AND UPPER(TRIM(region_code)) = UPPER(TRIM($3))
         AND status = 'Active'`,
      [updatedPrice.produce_name, updatedPrice.unit, region]
    );
    if (!alertResult.rows.length) return { evaluated: 0, qualifying: 0, published: 0 };

    const latestResult = await pool.query(LATEST_REGIONAL_PRICES_SQL,
      [updatedPrice.produce_name, updatedPrice.unit, region]);
    const mode = getPublishMode();
    let qualifying = 0;
    let published = 0;
    for (const alert of alertResult.rows) {
      const event = createCombinedEvent(alert, latestResult.rows);
      if (!event) continue;
      qualifying += 1;
      if (mode === 'off') continue;
      if (mode === 'preview') {
        console.log('[Price alerts][PREVIEW] Combined regional event (not queued):', JSON.stringify({
          alertId: event.alertId,
          eventId: event.eventId,
          produceName: event.produceName,
          regionCode: event.regionCode,
          condition: event.condition,
          targetPrice: event.targetPrice,
          qualifyingMarkets: event.qualifyingMarkets,
        }, null, 2));
        continue;
      }
      try {
        await publishPriceAlertEvent(event);
        published += 1;
        console.log(`[Price alerts] Published combined event ${event.eventId} (${event.qualifyingMarkets.length} markets) for alert ${event.alertId}`);
      } catch (error) {
        // Database write already committed. Log, rather than falsely tell the
        // admin the market-price update failed. Failed publish is NOT queued.
        console.error(`[Price alerts] RabbitMQ publish failed for alert ${event.alertId}: ${error.message}`);
      }
    }
    return { evaluated: alertResult.rows.length, qualifying, published };
  } catch (error) {
    console.error('[Price alerts] Could not evaluate regional price alerts:', error.message);
    return { evaluated: 0, qualifying: 0, published: 0, error: error.message };
  }
}

module.exports = {
  publishMatchingPriceAlerts,
  createCombinedEvent,
  createEventId,
  isConditionMet,
  getQualifyingMarkets,
  LATEST_REGIONAL_PRICES_SQL,
};
