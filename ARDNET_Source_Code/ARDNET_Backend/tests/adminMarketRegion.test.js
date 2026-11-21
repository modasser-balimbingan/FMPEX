const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const db = { query() { throw Error('Unexpected query'); } };
const published = [];
const load = Module._load;
let controller;
try {
  Module._load = function (request, parent, isMain) {
    if (request === '../config/database') return db;
    if (request === '../services/priceAlertPublisher') return { publishMatchingPriceAlerts: async row => published.push(row) };
    return load.call(this, request, parent, isMain);
  };
  controller = require('../src/controllers/marketController');
} finally { Module._load = load; }
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } });
const fields = { category_id: 1, produce_name: 'Rice', market_name: 'Pagadian Public Market', location: 'Pagadian City', price: 48, unit: 'kg', price_date: '2026-11-17', source: 'Market survey' };
const geography = { region_code: 'IX', province: 'Zamboanga del Sur', location_type: 'City' };

test('admin market create persists Region IX with province and location type', async () => {
  const saved = { market_price_id: 3, ...fields, ...geography };
  db.query = async (sql, values) => {
    assert.match(sql, /INSERT INTO public.market_prices/);
    assert.match(sql, /region_code, province, location_type/);
    assert.deepEqual(values.slice(8), ['IX', 'Zamboanga del Sur', 'City']);
    return { rows: [saved] };
  };
  const res = response(); await controller.createMarketPrice({ body: { ...fields, ...geography } }, res);
  assert.equal(res.statusCode, 201); assert.equal(res.body.region_code, 'IX'); assert.equal(published.at(-1), saved);
});

test('admin market update saves the selected region alongside its geographic fields', async () => {
  db.query = async (sql, values) => {
    assert.match(sql, /region_code = CASE WHEN \$9::boolean THEN \$10 ELSE region_code END/);
    assert.deepEqual(values.slice(8), [true, 'IX', 'Zamboanga del Sur', 'City', '3']);
    return { rows: [{ market_price_id: 3, ...fields, ...geography }] };
  };
  const res = response(); await controller.updateMarketPrice({ params: { id: '3' }, body: { ...fields, ...geography } }, res);
  assert.equal(res.statusCode, 200); assert.equal(res.body.region_code, 'IX');
});

test('unsupported regions are rejected before any database write', async () => {
  db.query = async () => assert.fail('Unsupported regions must not reach SQL');
  for (const handler of [controller.createMarketPrice, controller.updateMarketPrice]) {
    for (const code of ['X', 'NCR', '9', '']) {
      const res = response(); await handler({ params: { id: '3' }, body: { ...fields, ...geography, region_code: code } }, res);
      assert.equal(res.statusCode, 400); assert.match(res.body.error, /IX/);
    }
  }
});

test('regional records require a real city or municipality classification', async () => {
  db.query = async () => assert.fail('Incomplete geography must not reach SQL');
  const res = response(); await controller.createMarketPrice({ body: { ...fields, region_code: 'IX' } }, res);
  assert.equal(res.statusCode, 400); assert.match(res.body.error, /location_type/);
});

test('independent city records can leave province blank without inventing one', async () => {
  db.query = async (sql, values) => {
    assert.deepEqual(values.slice(8), ['IX', null, 'City']); return { rows: [{ ...fields, region_code: values[8], province: values[9], location_type: values[10] }] };
  };
  const res = response(); await controller.createMarketPrice({ body: { ...fields, ...geography, province: null } }, res);
  assert.equal(res.statusCode, 201); assert.equal(res.body.province, null);
});

test('legacy partial updates preserve geography when it is omitted', async () => {
  db.query = async (sql, values) => { assert.equal(values[8], false); return { rows: [{ market_price_id: 3, ...geography, price: 52 }] }; };
  const res = response(); await controller.updateMarketPrice({ params: { id: '3' }, body: { price: 52 } }, res);
  assert.equal(res.body.region_code, 'IX'); assert.equal(res.body.location_type, 'City');
});

test('regional retrieval normalizes the region and uses a parameterized filter', async () => {
  db.query = async (sql, values) => { assert.match(sql, /UPPER\(TRIM\(region_code\)\) = \$1/); assert.deepEqual(values, ['IX']); return { rows: [] }; };
  const res = response(); await controller.getMarketPrices({ query: { region_code: ' ix ' } }, res);
  assert.deepEqual(res.body, []);
});

test('a zero price is rejected consistently with the admin form', async () => {
  db.query = async () => assert.fail('Invalid price must not reach SQL');
  const res = response(); await controller.createMarketPrice({ body: { ...fields, ...geography, price: 0 } }, res);
  assert.equal(res.statusCode, 400);
});
