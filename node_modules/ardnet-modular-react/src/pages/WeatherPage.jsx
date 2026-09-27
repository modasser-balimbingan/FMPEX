import Card from '../components/common/Card';
import { DEMO_WEATHER } from '../utils/constants';

export default function WeatherPage() {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">WEATHER INFORMATION</p>
          <h1>Local Weather</h1>
          <p className="muted">Weather data is retrieved through the external weather service.</p>
        </div>
        <button className="btn btn-outline" type="button" onClick={() => window.location.reload()}>Refresh</button>
      </div>

      <div className="dashboard-sections">
        <Card style={{ padding: 26 }}>
          <p className="eyebrow">CURRENT CONDITIONS</p>
          <div className="weather-box">
            <div className="weather-current">
              <div>
                <div className="weather-temp">{DEMO_WEATHER.temperature}°</div>
                <div className="weather-condition">{DEMO_WEATHER.condition}</div>
              </div>
              <div className="weather-icon">☁️</div>
            </div>
            <div className="weather-location">{DEMO_WEATHER.location}</div>
          </div>
        </Card>

        <Card style={{ padding: 26 }}>
          <p className="eyebrow">FORECAST</p>
          <div className="forecast-list">
            {DEMO_WEATHER.forecast.map(([day, value]) => (
              <div className="forecast-item" key={day}><span>{day}</span><strong>{value}</strong></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
