const pool = require('../config/database');
const { publishMatchingPriceAlerts } = require('../services/priceAlertPublisher');

// Keep the existing market-price API. Geographic fields are optional for
// legacy clients, but only verified Region IX prices participate in alerts.
const REGION_CODE = 'IX';

function validText(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

function validateGeography(body) {
  const containsGeography = ['region_code', 'province', 'location_type']
    .some((field) => Object.prototype.hasOwnProperty.call(body, field));
  if (!containsGeography) return { value: null };

  const regionCode = String(body.region_code ?? '').trim().toUpperCase();
  const locationTypeInput = String(body.location_type ?? '').trim().toLowerCase();
  if (regionCode !== REGION_CODE) {
    return { error: 'The current regional price-alert feature supports only region_code IX.' };
  }
  if (!['city', 'municipality'].includes(locationTypeInput)) {
    return { error: 'location_type must be City or Municipality when geographic data is supplied.' };
  }
  if (body.province != null && String(body.province).trim() && !validText(body.province, 100)) {
    return { error: 'province must be text with no more than 100 characters.' };
  }
  // Province can be null for an independent city; do not invent one.
  return {
    value: {
      region_code: REGION_CODE,
      province: body.province == null || String(body.province).trim() === '' ? null : body.province.trim(),
      location_type: locationTypeInput === 'city' ? 'City' : 'Municipality',
    },
  };
}

function validPositivePrice(value) {
  return value !== null && value !== undefined && String(value).trim() !== '' &&
    Number.isFinite(Number(value)) && Number(value) > 0;
}

function validateMarketFields(body, partial = false) {
  const fields = [
    ['produce_name', 100], ['market_name', 150], ['location', 255],
    ['unit', 30], ['source', 255],
  ];
  for (const [name, maxLength] of fields) {
    if ((!partial || body[name] !== undefined) && !validText(body[name], maxLength)) {
      return `${name} is required and must have at most ${maxLength} characters.`;
    }
  }
  if ((!partial || body.price !== undefined) && !validPositivePrice(body.price)) {
    return 'price must be greater than zero.';
  }
  if (!partial || body.category_id !== undefined) {
    const id = Number(body.category_id);
    if (!Number.isSafeInteger(id) || id <= 0) return 'category_id must be a positive integer.';
  }
  if ((!partial || body.price_date !== undefined) &&
      (typeof body.price_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.price_date))) {
    return 'price_date must be formatted YYYY-MM-DD.';
  }
  return null;
}

// GET /api/market-prices?produce=&location=&region_code=
exports.getMarketPrices = async (req, res) => {
  try {
    const { produce, location, region_code } = req.query;
    let query = 'SELECT * FROM public.market_prices';
    const params = [];
    const conditions = [];
    if (produce) {
      params.push(`%${produce}%`);
      conditions.push(`produce_name ILIKE $${params.length}`);
    }
    if (location) {
      params.push(`%${location}%`);
      conditions.push(`location ILIKE $${params.length}`);
    }
    if (region_code) {
      params.push(String(region_code).trim().toUpperCase());
      conditions.push(`UPPER(TRIM(region_code)) = $${params.length}`);
    }
    if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ' ORDER BY price_date DESC, created_at DESC';
    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (error) {
    console.error('Get market prices error:', error);
    return res.status(500).json({ error: 'Failed to fetch market prices' });
  }
};

// GET /api/market-prices/:produce
exports.getPricesByProduce = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM public.market_prices WHERE produce_name ILIKE $1
       ORDER BY price_date DESC, created_at DESC`,
      [`%${req.params.produce}%`]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Get prices by produce error:', error);
    return res.status(500).json({ error: 'Failed to fetch prices' });
  }
};

// POST /api/market-prices (admin)
exports.createMarketPrice = async (req, res) => {
  try {
    const body = req.body || {};
    const fieldError = validateMarketFields(body);
    if (fieldError) return res.status(400).json({ error: fieldError });
    const geographic = validateGeography(body);
    if (geographic.error) return res.status(400).json({ error: geographic.error });
    const geo = geographic.value;
    const result = await pool.query(
      `INSERT INTO public.market_prices
       (category_id, produce_name, market_name, location, price, unit,
        price_date, source, region_code, province, location_type, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING *`,
      [Number(body.category_id), body.produce_name.trim(), body.market_name.trim(),
       body.location.trim(), Number(body.price), body.unit.trim(), body.price_date,
       body.source.trim(), geo?.region_code ?? null, geo?.province ?? null,
       geo?.location_type ?? null]
    );
    // The INSERT has committed. A notification failure must never be reported
    // as a failed market-price write. Preview mode does not contact RabbitMQ.
    await publishMatchingPriceAlerts(result.rows[0]);
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create market price error:', error);
    return res.status(500).json({ error: 'Failed to create market price' });
  }
};

// PUT /api/market-prices/:id (admin)
exports.updateMarketPrice = async (req, res) => {
  try {
    const body = req.body || {};
    const fieldError = validateMarketFields(body, true);
    if (fieldError) return res.status(400).json({ error: fieldError });
    const geographic = validateGeography(body);
    if (geographic.error) return res.status(400).json({ error: geographic.error });
    const geo = geographic.value;
    const result = await pool.query(
      `UPDATE public.market_prices SET
        category_id = COALESCE($1, category_id),
        produce_name = COALESCE($2, produce_name),
        market_name = COALESCE($3, market_name),
        location = COALESCE($4, location),
        price = COALESCE($5, price),
        unit = COALESCE($6, unit),
        price_date = COALESCE($7, price_date),
        source = COALESCE($8, source),
        region_code = CASE WHEN $9::boolean THEN $10 ELSE region_code END,
        province = CASE WHEN $9::boolean THEN $11 ELSE province END,
        location_type = CASE WHEN $9::boolean THEN $12 ELSE location_type END
       WHERE market_price_id = $13 RETURNING *`,
      [body.category_id === undefined ? null : Number(body.category_id),
       body.produce_name === undefined ? null : body.produce_name.trim(),
       body.market_name === undefined ? null : body.market_name.trim(),
       body.location === undefined ? null : body.location.trim(),
       body.price === undefined ? null : Number(body.price),
       body.unit === undefined ? null : body.unit.trim(),
       body.price_date === undefined ? null : body.price_date,
       body.source === undefined ? null : body.source.trim(),
       geo !== null,
       geo?.region_code ?? null, geo?.province ?? null, geo?.location_type ?? null,
       req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Market price not found' });
    await publishMatchingPriceAlerts(result.rows[0]);
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Update market price error:', error);
    return res.status(500).json({ error: 'Failed to update market price' });
  }
};

// DELETE /api/market-prices/:id (admin) — unchanged behavior
exports.deleteMarketPrice = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM public.market_prices WHERE market_price_id = $1 RETURNING market_price_id',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Market price not found' });
    return res.json({ message: 'Market price deleted' });
  } catch (error) {
    console.error('Delete market price error:', error);
    return res.status(500).json({ error: 'Failed to delete market price' });
  }
};
