import { Link } from 'react-router-dom';
import PriceTable from '../../components/ui/PriceTable';
import WeatherIcon from '../../components/ui/WeatherIcon';
import useWeather from '../../hooks/useWeather';
import ListingIcon from '../listings/ListingIcon';

export default function MarketOverview() {
  const { weather, loading, error } = useWeather();
  return <div className="market-overview">
    <div className="market-overview__prices"><PriceTable /></div>
    <aside className="market-aside">
      <section className="market-weather">
        <p className="explore-kicker">A GLANCE OUTSIDE</p><h2>Weather in Pagadian</h2>
        {loading ? <p role="status">Checking local conditions…</p> : error ? <p role="status">{error}</p> : <>
          <WeatherIcon code={weather.current.weatherCode} condition={weather.current.condition} />
          <div className="market-weather__temperature">{Math.round(weather.current.temperature)}<span>°C</span></div>
          <p className="market-weather__condition">{weather.current.condition}</p><p className="market-weather__source">{weather.source || 'Open-Meteo'} · Current conditions</p>
        </>}
        <Link to="/weather" className="market-aside__link">See the full forecast <ListingIcon name="arrowRight" size={16} /></Link>
      </section>
      <section className="market-note"><span className="market-note__icon"><ListingIcon name="leaf" size={23} /></span><h2>Your produce. Your price.</h2><p>These prices offer context for your next decision. Check the date, unit, and source when comparing records.</p><Link to="/listings" className="market-aside__link">Explore local produce <ListingIcon name="arrowRight" size={16} /></Link></section>
    </aside>
  </div>;
}
