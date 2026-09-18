import MarketOverview from '../features/market/MarketOverview';
export default function MarketPage()
{return <div className="page">
    <div className="page-heading">
        <div><p className="eyebrow">MARKET INFORMATION</p>
        <h1>Reference prices and weather</h1>
        <p className="muted">Source, location, unit, price, and retrieval date should be shown by the backend.</p>
        </div>
        </div>
        <MarketOverview/>
    </div>
}
