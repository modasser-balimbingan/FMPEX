const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const db = { query() { throw Error('Unexpected database call'); } };
const load = Module._load;
let controller;
try {
  Module._load = function (request, parent, isMain) {
    return request === '../config/database' ? db : load.call(this, request, parent, isMain);
  };
  controller = require('../src/controllers/listingsController');
} finally { Module._load = load; }
const request = body => ({ body, user: { id: 11, role: 'farmer' }, params: { id: '23' }, query: {}, files: [] });
const response = () => ({ statusCode: 200, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } });
const fields = { category_id: 1, produce_name: 'Rice', quantity: 10, unit: 'kg', location: 'Pagadian' };

test('create persists a trimmed description and returns it with the listing', async () => {
  db.query = async (sql, values) => {
    if (sql.includes('SELECT category_id')) return { rows: [{ category_id: 1 }] };
    if (sql.includes('INSERT INTO produce_listings')) {
      assert.match(sql, /description/); assert.equal(values[3], 'Freshly harvested rice.');
      return { rows: [{ listing_id: 23, description: values[3] }] };
    }
    assert.match(sql, /FROM produce_photos/); return { rows: [] };
  };
  const res = response(); await controller.createListing(request({ ...fields, description: '  Freshly harvested rice.  ' }), res);
  assert.equal(res.statusCode, 201); assert.equal(res.body.listing.description, 'Freshly harvested rice.');
});

test('description is optional on create', async () => {
  db.query = async (sql, values) => {
    if (sql.includes('SELECT category_id')) return { rows: [{ category_id: 1 }] };
    if (sql.includes('INSERT INTO produce_listings')) { assert.equal(values[3], null); return { rows: [{ listing_id: 23, description: null }] }; }
    return { rows: [] };
  };
  const res = response(); await controller.createListing(request(fields), res);
  assert.equal(res.statusCode, 201);
});

test('update can replace or explicitly clear a description and asking price', async () => {
  for (const [input, expected] of [[' New harvest ', 'New harvest'], ['', null]]) {
    db.query = async (sql, values) => {
      if (sql.includes('SELECT user_id')) return { rows: [{ user_id: 11 }] };
      if (sql.includes('UPDATE produce_listings')) {
        assert.match(sql, /description = CASE WHEN \$11::boolean THEN \$3 ELSE description END/);
        assert.equal(values[2], expected); assert.equal(values[10], true);
        assert.equal(values[5], null); assert.equal(values[9], true);
        return { rows: [{ listing_id: 23, description: values[2], asking_price: values[5] }] };
      }
      return { rows: [] };
    };
    const res = response(); await controller.updateListing(request({ description: input, asking_price: '' }), res);
    assert.equal(res.statusCode, 200); assert.equal(res.body.listing.description, expected);
  }
});

test('status-only updates preserve an existing description and price', async () => {
  db.query = async (sql, values) => {
    if (sql.includes('SELECT user_id')) return { rows: [{ user_id: '11' }] };
    if (sql.includes('UPDATE produce_listings')) {
      assert.equal(values[10], false); assert.equal(values[9], false); assert.equal(values[7], 'Sold');
      return { rows: [{ listing_id: 23, description: 'Keep this description', asking_price: 42 }] };
    }
    return { rows: [] };
  };
  const res = response(); await controller.updateListing(request({ status: 'Sold' }), res);
  assert.equal(res.body.listing.description, 'Keep this description'); assert.equal(res.body.listing.asking_price, 42);
});

test('create and update reject oversized or non-text descriptions before any query', async () => {
  db.query = async () => assert.fail('Must not access the database');
  for (const handler of [controller.createListing, controller.updateListing]) {
    for (const description of ['x'.repeat(2001), { text: 'invalid' }, 123]) {
      const res = response(); await handler(request({ ...fields, description }), res);
      assert.equal(res.statusCode, 400); assert.match(res.body.error, /Description/);
    }
  }
});

test('another farmer cannot edit the description of an unowned listing', async () => {
  db.query = async sql => { assert.match(sql, /SELECT user_id/); return { rows: [{ user_id: 12 }] }; };
  const res = response(); await controller.updateListing(request({ description: 'Unauthorized change' }), res);
  assert.equal(res.statusCode, 403);
});

test('owner inventory fetch includes descriptions and all statuses, scoped to the user', async () => {
  db.query = async (sql, values) => {
    if (sql.includes('FROM produce_photos')) return { rows: [] };
    assert.match(sql, /pl.description/); assert.match(sql, /WHERE pl.user_id = \$1/);
    assert.doesNotMatch(sql, /status\s*=/); assert.deepEqual(values, [11]);
    return { rows: [{ listing_id: 23, description: 'Saved description', status: 'Inactive' }] };
  };
  const res = response(); await controller.getMyListings(request({}), res);
  assert.equal(res.body[0].description, 'Saved description'); assert.equal(res.body[0].status, 'Inactive');
});
