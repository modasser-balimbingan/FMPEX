import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import MarketOverview from '../features/market/MarketOverview';

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">FARM-TO-MARKET PRICE EXCHANGE</p>
            <h1>Market information for better farm decisions.</h1>
            <p className="hero-description">
              ArdNet brings produce listings, market reference prices, weather information, price alerts, and notifications into one farmer-first web platform.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/listings">Browse Produce</Link>
              <Link className="btn btn-outline" to="/market">View Market Prices</Link>
            </div>
          </div>

          <Card className="market-card">
            <div className="market-top">
              <span className="market-label">TODAY'S REFERENCE</span>
              <span className="market-time">Pagadian</span>
            </div>
            <div className="market-product">
              <div className="market-product-name">Rice</div>
              <div className="market-price">₱42.00 / kg</div>
              <div className="market-change">Reference price</div>
            </div>
            <div className="chart">
              {[45, 52, 58, 63, 70, 76, 84].map((height, index) => (
                <i key={index} className="bar" style={{ height: `${height}%` }} />
              ))}
            </div>
            <p className="chart-label">Sample data for the prototype interface.</p>
          </Card>
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <div className="section-title">
            <p className="eyebrow">CORE FUNCTIONS</p>
            <h2>One workspace for the next selling decision.</h2>
            <p>Farmers manage their own records, buyers/vendors browse produce, and administrators use a separate protected workspace.</p>
          </div>
          <div className="grid grid-4">
            {[
              ['01', 'Produce Listings', 'Create and manage your own active, sold, or inactive produce listings.'],
              ['02', 'Market Prices', 'View reference price, unit, location, date, and source information.'],
              ['03', 'Weather', 'View weather conditions and forecast through a connected external service.'],
              ['04', 'Price Alerts', 'Configure price conditions and receive in-app notifications.'],
            ].map(([number, title, text]) => (
              <Card className="feature-card" key={title}>
                <strong className="feature-number">{number}</strong>
                <h3>{title}</h3>
                <p className="muted">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft" id="market-preview">
        <div className="container">
          <div className="section-title">
            <p className="eyebrow">MARKET INFORMATION</p>
            <h2>Reference prices with context.</h2>
            <p>Prices support decision-making; ArdNet does not force or define the farmer's actual selling price.</p>
          </div>
          <MarketOverview />
        </div>
      </section>
    </main>
  );
}
