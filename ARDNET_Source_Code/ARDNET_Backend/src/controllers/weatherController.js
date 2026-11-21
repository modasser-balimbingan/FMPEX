const { getWeatherJson, weatherFailure } = require('../services/weatherHttp');

const OPEN_METEO_GEOCODING_URL =
  'https://geocoding-api.open-meteo.com/v1/search';

const OPEN_METEO_FORECAST_URL =
  'https://api.open-meteo.com/v1/forecast';

async function getCoordinates(location) {
  const url = new URL(OPEN_METEO_GEOCODING_URL);

  url.searchParams.set('name', location);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  url.searchParams.set('countryCode', 'PH');

  const data = await getWeatherJson(url);

  if (!data.results || data.results.length === 0) {
    throw new Error(
      `Location "${location}" was not found`
    );
  }

  return data.results[0];
}

async function getWeatherData(latitude, longitude) {
  const url = new URL(OPEN_METEO_FORECAST_URL);

  url.searchParams.set('latitude', latitude);
  url.searchParams.set('longitude', longitude);

  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'weather_code',
      'wind_speed_10m'
    ].join(',')
  );

  url.searchParams.set(
    'daily',
    [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum'
    ].join(',')
  );

  url.searchParams.set('forecast_days', '4');

  url.searchParams.set(
    'timezone',
    'Asia/Manila'
  );

  return getWeatherJson(url);
}

function getWeatherCondition(weatherCode) {
  const codes = {
    0: 'Clear sky',

    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',

    45: 'Fog',
    48: 'Depositing rime fog',

    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',

    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',

    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',

    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',

    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };

  return codes[weatherCode] || 'Unknown';
}

exports.getWeather = async (req, res) => {
  try {
    const { location } = req.query;

    if (!location) {
      return res.status(400).json({
        error: 'Location is required'
      });
    }

    const coordinates = await getCoordinates(
      location
    );

    const weather = await getWeatherData(
      coordinates.latitude,
      coordinates.longitude
    );

    const current = weather.current;
    const daily = weather.daily;

    const forecast = daily.time.map(
      (date, index) => ({
        date,
        weatherCode: daily.weather_code[index],
        condition: getWeatherCondition(
          daily.weather_code[index]
        ),
        maxTemperature:
          daily.temperature_2m_max[index],
        minTemperature:
          daily.temperature_2m_min[index],
        precipitation:
          daily.precipitation_sum[index]
      })
    );

    res.json({
      source: 'Open-Meteo',

      location: {
        name: coordinates.name,
        country: coordinates.country,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      },

      current: {
        temperature:
          current.temperature_2m,

        humidity:
          current.relative_humidity_2m,

        apparentTemperature:
          current.apparent_temperature,

        precipitation:
          current.precipitation,

        windSpeed:
          current.wind_speed_10m,

        weatherCode:
          current.weather_code,

        condition:
          getWeatherCondition(
            current.weather_code
          )
      },

      forecast
    });

  } catch (error) {
    return weatherFailure(error, res);
  }
};

exports.getWeatherByCoordinates = async (
  req,
  res
) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error:
          'Latitude and longitude are required'
      });
    }

    const weather = await getWeatherData(
      lat,
      lon
    );

    const current = weather.current;
    const daily = weather.daily;

    const forecast = daily.time.map(
      (date, index) => ({
        date,
        weatherCode: daily.weather_code[index],
        condition: getWeatherCondition(
          daily.weather_code[index]
        ),
        maxTemperature:
          daily.temperature_2m_max[index],
        minTemperature:
          daily.temperature_2m_min[index],
        precipitation:
          daily.precipitation_sum[index]
      })
    );

    res.json({
      source: 'Open-Meteo',

      location: {
        latitude: Number(lat),
        longitude: Number(lon)
      },

      current: {
        temperature:
          current.temperature_2m,

        humidity:
          current.relative_humidity_2m,

        apparentTemperature:
          current.apparent_temperature,

        precipitation:
          current.precipitation,

        windSpeed:
          current.wind_speed_10m,

        weatherCode:
          current.weather_code,

        condition:
          getWeatherCondition(
            current.weather_code
          )
      },

      forecast
    });

  } catch (error) {
    return weatherFailure(error, res);
  }
};
