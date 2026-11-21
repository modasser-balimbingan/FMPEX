'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createSoapMarketPriceService, LATEST_PRICES_SQL, MAX_RESULTS } = require('../src/services/soapMarketPriceService');
const { escapeXml, soapSuccess, soapFault } = require('../src/services/soapMarketPriceProtocol');

const sampleRow = {
  market_price_id: 7, produce_name: 'Rice', market_name: 'ARDNET Test Market C',
  location: 'Dipolog City', province: 'Zamboanga del Norte', location_type: 'City',
  region_code: 'IX', price: '42.00', unit: 'kg', price_date: '2026-11-03',
};

test('database allowlist accepts test database and checks actual connection', async () => {
  const calls = [];
  const service = createSoapMarketPriceService({ query: async (sql) => { calls.push(sql); return {rows:[{database_name:'ARDNET-DB_Restoration_Test'}]}; }});
  await service.verifyDatabase('ARDNET-DB_Restoration_Test');
  assert.equal(calls.length, 1);
  assert.match(calls[0], /current_database\(\)/);
});

test('database allowlist rejects original database without querying it', async () => {
  let touched = false;
  const service = createSoapMarketPriceService({ query: async () => { touched=true; return {rows:[]}; }});
  await assert.rejects(service.verifyDatabase('Farm_to_Market_Exchange_DB'), /allowlist/);
  assert.equal(touched, false);
});

test('database allowlist rejects connection to a mismatched database', async () => {
  const service = createSoapMarketPriceService({ query: async () => ({rows:[{database_name:'Farm_to_Market_Exchange_DB'}]}) });
  await assert.rejects(service.verifyDatabase('ARDNET-DB_Restoration_Test'), /outside its allowlist/);
});

test('regional lookup uses parameterized SQL and Region IX only', async () => {
  let recorded;
  const service = createSoapMarketPriceService({ query: async (sql, values) => { recorded = {sql, values}; return { rows: [sampleRow] }; }});
  const result = await service.getPrices('GetRegionalMarketPrices', { regionCode: 'IX' });
  assert.equal(result.prices.length, 1);
  assert.equal(recorded.values[0], 'IX');
  assert.deepEqual(recorded.values.slice(1,5), [null, null, null, null]);
  assert.equal(recorded.values[5], MAX_RESULTS+1);
  assert.match(recorded.sql, /ROW_NUMBER\(\)/);
  assert.match(recorded.sql, /price_date <= CURRENT_DATE/);
});

test('produce name is passed as query parameter, not embedded into SQL', async () => {
  let statement, params;
  const service = createSoapMarketPriceService({query:async (sql, values) => {statement=sql; params=values; return {rows:[]};}});
  const input = "Rice'; DROP TABLE users; --";
  await service.getPrices('GetMarketPricesByProduce', {produceName:input, regionCode:'IX', unit:'kg'});
  assert.equal(params[1], input);
  assert.equal(params[4], 'kg');
  assert.ok(!statement.includes(input));
});

test('specific latest-market lookup passes produce, market name and location', async () => {
  let params;
  const service = createSoapMarketPriceService({query:async (_sql, values) => {params=values; return {rows:[sampleRow]};}});
  const result = await service.getPrices('GetLatestMarketPrice', {
    regionCode:'IX',produceName:'Rice',marketName:'ARDNET Test Market C',location:'Dipolog City',unit:'kg',
  });
  assert.equal(result.prices.length,1);
  assert.deepEqual(params.slice(0,5), ['IX','Rice','ARDNET Test Market C','Dipolog City','kg']);
});

test('regional response is capped and truncated flag accurately set', async () => {
  const rows = Array.from({length:MAX_RESULTS+1}, (_,i)=>({...sampleRow,market_price_id:i+1}));
  const service = createSoapMarketPriceService({query:async () => ({rows})});
  const result = await service.getPrices('GetRegionalMarketPrices',{});
  assert.equal(result.prices.length,MAX_RESULTS);
  assert.equal(result.truncated,true);
});

test('XML serialization escapes HTML-like text and remains SOAP 1.1', () => {
  assert.equal(escapeXml(`A&B <test> "quoted" 'single'`), 'A&amp;B &lt;test&gt; &quot;quoted&quot; &apos;single&apos;');
  const response = soapSuccess('GetMarketPricesByProduce',{prices:[{...sampleRow,market_name:'A & B <Market>'}]});
  assert.match(response, /http:\/\/schemas.xmlsoap.org\/soap\/envelope\//);
  assert.match(response, /A &amp; B &lt;Market&gt;/);
  assert.match(response, /<m:Count>1<\/m:Count>/);
  assert.doesNotMatch(response,/<!DOCTYPE|<wsdl/i);
});

test('SOAP fault hides database internals and escapes error text', () => {
  const fault = soapFault('Invalid <regionCode>',false);
  assert.match(fault, /soap:Client/);
  assert.match(fault, /Invalid &lt;regionCode&gt;/);
});

test('unknown operation is rejected by the SQL service and XML serializer', async () => {
  const service=createSoapMarketPriceService({query: async()=>{throw new Error('query must not run');}});
  await assert.rejects(service.getPrices('DropDatabase',{}), /Unsupported SOAP operation/);
  assert.throws(()=>soapSuccess('DropDatabase',{prices:[]}), /Invalid SOAP success operation/);
});

test('SQL only selects latest non-future rows and no data modification', () => {
  assert.match(LATEST_PRICES_SQL, /market_rank = 1/);
  assert.match(LATEST_PRICES_SQL, /price_date <= CURRENT_DATE/);
  assert.doesNotMatch(LATEST_PRICES_SQL, /\b(?:INSERT|UPDATE|DELETE|DROP|TRUNCATE)\b/i);
});
