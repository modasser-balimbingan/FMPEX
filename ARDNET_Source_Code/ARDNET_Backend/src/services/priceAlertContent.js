/**
 * Shared formatter for Region IX combined price-alert events.
 * Pure functions: no PostgreSQL, RabbitMQ, or Brevo connection.
 */
function invalid(reason) {
  const error = new Error(`Invalid regional price-alert message payload: ${reason}`);
  error.invalidEvent = true;
  return error;
}

function validateCombinedEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) throw invalid('missing event object');
  if (event.eventType !== 'regional-price-alert' || event.eventVersion !== 2) throw invalid('unsupported event version');
  if (!/^[a-f0-9]{64}$/i.test(String(event.eventId || ''))) throw invalid('missing/invalid event ID');
  if (!Number.isSafeInteger(Number(event.alertId)) || Number(event.alertId) <= 0) throw invalid('invalid alert ID');
  if (!Number.isSafeInteger(Number(event.userId)) || Number(event.userId) <= 0) throw invalid('invalid user ID');
  if (!String(event.produceName || '').trim() || !String(event.unit || '').trim()) throw invalid('missing produce or unit');
  if (event.regionCode !== 'IX') throw invalid('unsupported region');
  if (!['gte', 'lte'].includes(event.condition)) throw invalid('unsupported condition');
  if (!(Number(event.targetPrice) > 0) || !Number.isFinite(Number(event.targetPrice))) throw invalid('invalid target price');
  if (!Array.isArray(event.qualifyingMarkets) || !event.qualifyingMarkets.length) throw invalid('no qualifying markets');
  for (const market of event.qualifyingMarkets) {
    if (!market || !String(market.marketName || '').trim() || !String(market.location || '').trim()) {
      throw invalid('market name/location missing');
    }
    if (!(Number(market.price) > 0) || !Number.isFinite(Number(market.price))) throw invalid('invalid market price');
    if (String(market.unit).trim().toLowerCase() !== String(event.unit).trim().toLowerCase()) {
      throw invalid('market unit does not match alert unit');
    }
  }
  return event;
}

function formatPrice(price, unit) {
  return `₱${Number(price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/${unit}`;
}

function buildCombinedPriceAlertContent(event) {
  validateCombinedEvent(event);
  const comparison = event.condition === 'gte' ? 'at or above' : 'at or below';
  const count = event.qualifyingMarkets.length;
  const summary = `${event.produceName} reference prices meet your target ${comparison} ${formatPrice(event.targetPrice, event.unit)} in ${count} ${count === 1 ? 'market' : 'markets'} across Region IX.`;
  const lines = event.qualifyingMarkets.map((market) => {
    const place = [market.location, market.province].filter(Boolean).join(', ');
    const date = market.priceDate ? ` (as of ${String(market.priceDate).slice(0, 10)})` : '';
    return `${market.marketName} — ${place}: ${formatPrice(market.price, event.unit)}${date}`;
  });
  return {
    title: `Price Alert: ${event.produceName}`.slice(0, 255),
    summary,
    lines,
    message: [summary, ...lines.map((line) => `• ${line}`)].join('\n'),
  };
}

module.exports = { validateCombinedEvent, buildCombinedPriceAlertContent, formatPrice };
