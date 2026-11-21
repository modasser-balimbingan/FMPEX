import MarketOverview from '../features/market/MarketOverview';
import '../styles/public-pages.scss';

export default function MarketPage() {
  return <div className="page market-page">
    <header className="explore-heading"><div><p className="explore-kicker">YOUR LOCAL MARKET, IN PERSPECTIVE</p><h1>Good information. Better decisions.</h1><p>Explore reference prices, compare local markets, and keep an eye on the weather.</p></div></header>
    <MarketOverview />
  </div>;
}
