'use strict';

// Read-only, Region IX market-price lookup used only by ARDNET's SOAP endpoint.
// Intentionally has no imports from the RabbitMQ publisher or other controllers.
const REGION_CODE = 'IX';
const MAX_RESULTS = 100;

// A distinct market is identified by produce + unit + market name + location + province.
// The ordering mirrors Phase 6's latest-per-market semantics.
const LATEST_PRICES_SQL = `
WITH regional_prices AS (
  SELECT market_price_id, produce_name, market_name, location, province,
         location_type, region_code, price, unit, price_date, created_at,
         ROW_NUMBER() OVER (
           PARTITION BY LOWER(TRIM(produce_name)), LOWER(TRIM(unit)),
             LOWER(TRIM(market_name)), LOWER(TRIM(location)),
             LOWER(TRIM(COALESCE(province, '')))
           ORDER BY price_date DESC, created_at DESC NULLS LAST, market_price_id DESC
         ) AS market_rank
  FROM public.market_prices
  WHERE UPPER(TRIM(region_code)) = $1
    AND price_date <= CURRENT_DATE
    AND ($2::text IS NULL OR LOWER(TRIM(produce_name)) = LOWER(TRIM($2)))
    AND ($3::text IS NULL OR LOWER(TRIM(market_name)) = LOWER(TRIM($3)))
    AND ($4::text IS NULL OR LOWER(TRIM(location)) = LOWER(TRIM($4)))
    AND ($5::text IS NULL OR LOWER(TRIM(unit)) = LOWER(TRIM($5)))
)
SELECT market_price_id, produce_name, market_name, location, province,
       location_type, region_code, price, unit,
       TO_CHAR(price_date, 'YYYY-MM-DD') AS price_date
FROM regional_prices
WHERE market_rank = 1
ORDER BY LOWER(TRIM(location)), LOWER(TRIM(market_name)),
         LOWER(TRIM(produce_name)), LOWER(TRIM(unit))
LIMIT $6
`;

function createSoapMarketPriceService(pool) {
  if (!pool || typeof pool.query !== 'function') throw new Error('PostgreSQL pool.query required');

  async function verifyDatabase(expectedDatabase) {
    if (expectedDatabase !== 'ARDNET-DB_Restoration_Test') {
      throw Object.assign(new Error('SOAP database allowlist is not configured for the test database'), { soapStatus: 503 });
    }
    const result = await pool.query('SELECT current_database() AS database_name');
    const active = result.rows?.[0]?.database_name;
    if (active !== expectedDatabase) {
      throw Object.assign(new Error('SOAP endpoint refused to use a database outside its allowlist'), { soapStatus: 503 });
    }
  }

  async function getPrices(operation, params) {
    if (!['GetRegionalMarketPrices', 'GetMarketPricesByProduce', 'GetLatestMarketPrice'].includes(operation)) {
      throw new Error('Unsupported SOAP operation');
    }
    const values = [REGION_CODE, params.produceName || null,
      operation === 'GetLatestMarketPrice' ? params.marketName : null,
      operation === 'GetLatestMarketPrice' ? params.location : null,
      params.unit || null,
      MAX_RESULTS + 1];
    const result = await pool.query(LATEST_PRICES_SQL, values);
    const rows = result.rows || [];
    if (operation === 'GetLatestMarketPrice') {
      // One requested market/location may have multiple units; unit may be provided
      // to disambiguate. The query is ordered deterministically.
      return { prices: rows.slice(0, 1), truncated: false };
    }
    return { prices: rows.slice(0, MAX_RESULTS), truncated: rows.length > MAX_RESULTS };
  }

  return { verifyDatabase, getPrices };
}

module.exports = { createSoapMarketPriceService, LATEST_PRICES_SQL, MAX_RESULTS };
