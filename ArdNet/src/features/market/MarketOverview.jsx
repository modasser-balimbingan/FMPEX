import PriceTable from '../../components/ui/PriceTable';
import Card from '../../components/common/Card';
import { DEMO_WEATHER } from '../../utils/constants';

export default function MarketOverview() {
  return (
    <div className="market-section-grid">
      <Card className="market-table-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">REFERENCE PRICES</p>
            <h3>Latest market information</h3>
          </div>
        </div>
        <PriceTable />
      </Card>
      <Card className="weather-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">WEATHER</p>
            <h3>{DEMO_WEATHER.location}</h3>
          </div>
        </div>
        <div className="weather-box">
          <div className="weather-current">
            <div>
              <div className="weather-temp">{DEMO_WEATHER.temperature}°</div>
              <div className="weather-condition">{DEMO_WEATHER.condition}</div>
            </div>
            <div className="weather-icon">☁️</div>
          </div>
          <div className="weather-location">External weather service</div>
        </div>
      </Card>
    </div>
  );
}
