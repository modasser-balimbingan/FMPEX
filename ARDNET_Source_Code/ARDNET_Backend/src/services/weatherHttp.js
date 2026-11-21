require('../config/systemCertificates')();

async function getWeatherJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(7500) });
  if (!response.ok) {
    const error = new Error(`Weather provider returned HTTP ${response.status}`);
    error.code = 'WEATHER_UPSTREAM_ERROR';
    throw error;
  }
  return response.json();
}

function weatherFailure(error, res) {
  const code = error.cause?.code || error.code;
  const timedOut = error.name === 'TimeoutError' || code === 'UND_ERR_CONNECT_TIMEOUT' || code === 'ETIMEDOUT';
  const certificateError = /CERT|SIGNATURE|ISSUER/.test(code || '');
  console.error('[Weather provider]', code || error.name, error.message);
  return res.status(timedOut ? 504 : 502).json({
    code: timedOut ? 'WEATHER_TIMEOUT' : certificateError ? 'WEATHER_TLS_ERROR' : 'WEATHER_UNAVAILABLE',
    error: timedOut
      ? 'The weather provider took too long to respond. Please try again shortly.'
      : certificateError
        ? 'The server could not verify the weather provider connection. Please contact the administrator.'
        : 'Unable to reach the weather provider right now. Please try again shortly.',
  });
}

module.exports = { getWeatherJson, weatherFailure };
