import useWeather from '../hooks/useWeather';
import WeatherIcon, { weatherKind } from '../components/ui/WeatherIcon';
import ListingIcon from '../features/listings/ListingIcon';
import '../styles/public-pages.scss';

const rounded = value => Number.isFinite(Number(value)) && value != null ? Math.round(Number(value)) : '—';
const dateLabel = value => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
};

export default function WeatherPage() {
  const { weather, loading, error, refresh } = useWeather();
  const current = weather?.current;
  return (
    <div className="page weather-page">
      <header className="explore-heading">
        <div><p className="explore-kicker">A LITTLE CLARITY FOR YOUR DAY</p><h1>Weather for your next move.</h1><p>Local conditions to help you plan your day, from farm to market.</p></div>
        <button className="explore-button" onClick={refresh} disabled={loading} type="button">{loading ? 'Updating…' : 'Refresh weather'}</button>
      </header>
      {loading && <div className="weather-feedback" role="status">Checking the skies over Pagadian…</div>}
      {error && !loading && <div className="weather-feedback" role="alert"><p>{error}</p><button className="explore-button" type="button" onClick={refresh}>Try again</button></div>}
      {weather && !loading && !error && <>
        <div className="weather-overview">
          <section className={`weather-current-card weather-tone--${weatherKind(current.weatherCode, current.condition)}`} aria-label="Current weather">
            <div className="weather-current-card__top"><span className="explore-kicker">CURRENT CONDITIONS</span><span className="weather-location"><ListingIcon name="pin" size={15} /> {weather.location?.name || 'Pagadian'}</span></div>
            <div className="weather-current-card__body"><div><div className="weather-temperature">{rounded(current.temperature)}<span>°C</span></div><h2>{current.condition}</h2><p>{weather.location?.country || 'Philippines'} · Local weather</p></div><WeatherIcon code={current.weatherCode} condition={current.condition} /></div>
            <div className="weather-current-card__footer">A fresh perspective on the day ahead.</div>
          </section>
          <section className="weather-details" aria-labelledby="weather-details-title">
            <p className="explore-kicker">THE DETAILS</p><h2 id="weather-details-title">A closer look outside</h2>
            <dl className="weather-metrics">
              {[['Humidity', `${rounded(current.humidity)}%`, 'Moisture in the air'], ['Feels like', `${rounded(current.apparentTemperature)}°C`, 'Apparent temperature'], ['Wind speed', `${current.windSpeed ?? '—'} km/h`, 'At ground level'], ['Precipitation', `${current.precipitation ?? '—'} mm`, 'Current rainfall']].map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><span>{note}</span></div>)}
            </dl>
          </section>
        </div>
        <section className="weather-forecast" aria-labelledby="forecast-title">
          <div className="weather-forecast__heading"><div><p className="explore-kicker">LOOKING AHEAD</p><h2 id="forecast-title">Your 4-day forecast</h2></div><span>{weather.location?.name || 'Pagadian'}</span></div>
          <div className="weather-forecast__grid">
            {weather.forecast.slice(0, 4).map((day, index) => <article className={`weather-day weather-tone--${weatherKind(day.weatherCode, day.condition)}`} key={day.date}>
              <div className="weather-day__date"><h3>{index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : dateLabel(day.date).split(',')[0]}</h3><time dateTime={day.date}>{dateLabel(day.date)}</time></div>
              <WeatherIcon code={day.weatherCode} condition={day.condition} small />
              <div className="weather-day__temperatures"><strong>{rounded(day.maxTemperature)}°</strong><span>{rounded(day.minTemperature)}°</span></div>
              <p className="weather-day__condition">{day.condition}</p>
              <div className="weather-day__rain"><span aria-hidden="true">◌</span> {day.precipitation ?? '—'} mm <span>rainfall</span></div>
            </article>)}
          </div>
        </section>
        <p className="weather-source">Source: {weather.source || 'Open-Meteo'}. Forecasts are a guide for planning and may change.</p>
      </>}
    </div>
  );
}
