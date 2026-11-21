const test = require('node:test');
const assert = require('node:assert/strict');
const controller = require('../src/controllers/weatherController');

function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

function mockFetch(t, implementation) {
  const original = global.fetch;
  global.fetch = implementation;
  t.after(() => { global.fetch = original; });
}

const forecast = {
  current: { temperature_2m: 28, relative_humidity_2m: 80, apparent_temperature: 31, precipitation: 0, weather_code: 2, wind_speed_10m: 3.5 },
  daily: { time: ['2026-11-16'], weather_code: [95], temperature_2m_max: [32], temperature_2m_min: [24], precipitation_sum: [8] },
};

test('weather endpoint returns provider data with forecast codes and bounded HTTPS requests', async t => {
  const calls = [];
  mockFetch(t, async (url, options) => {
    calls.push(String(url));
    assert.equal(url.protocol, 'https:');
    assert.ok(options.signal instanceof AbortSignal);
    return { ok: true, json: async () => calls.length === 1 ? { results: [{ name: 'Pagadian', country: 'Philippines', latitude: 7.8257, longitude: 123.437 }] } : forecast };
  });
  const res = response();
  await controller.getWeather({ query: { location: 'Pagadian' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.current.temperature, 28);
  assert.equal(res.body.forecast[0].weatherCode, 95);
  assert.equal(res.body.forecast[0].condition, 'Thunderstorm');
  assert.match(calls[1], /forecast_days=4/);
});

test('unreachable forecast returns a specific timeout response', async t => {
  let count = 0;
  mockFetch(t, async () => {
    if (++count === 1) return { ok: true, json: async () => ({ results: [{ latitude: 7.8, longitude: 123.4 }] }) };
    throw Object.assign(new Error('fetch failed'), { cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } });
  });
  const res = response();
  await controller.getWeather({ query: { location: 'Pagadian' } }, res);
  assert.equal(res.statusCode, 504);
  assert.equal(res.body.code, 'WEATHER_TIMEOUT');
});

test('certificate failures remain failures rather than disabling verification', async t => {
  mockFetch(t, async () => { throw Object.assign(new Error('fetch failed'), { cause: { code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' } }); });
  const res = response();
  await controller.getWeather({ query: { location: 'Pagadian' } }, res);
  assert.equal(res.statusCode, 502);
  assert.equal(res.body.code, 'WEATHER_TLS_ERROR');
});

test('request deadline returns 504 for coordinate forecasts too', async t => {
  mockFetch(t, async () => { throw Object.assign(new Error('Timed out'), { name: 'TimeoutError' }); });
  const res = response();
  await controller.getWeatherByCoordinates({ query: { lat: '7.8', lon: '123.4' } }, res);
  assert.equal(res.statusCode, 504);
});

test('provider HTTP errors return a safe response without its internal details', async t => {
  mockFetch(t, async () => ({ ok: false, status: 503 }));
  const res = response();
  await controller.getWeather({ query: { location: 'Pagadian' } }, res);
  assert.equal(res.statusCode, 502);
  assert.equal(res.body.code, 'WEATHER_UNAVAILABLE');
  assert.doesNotMatch(res.body.error, /503/);
});
