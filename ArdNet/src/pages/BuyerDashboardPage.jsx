import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import StatCard from '../components/ui/StatCard';
import PriceTable from '../components/ui/PriceTable';

export default function BuyerDashboardPage() {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">BUYER / VENDOR WORKSPACE</p>
          <h1>Find available produce</h1>
          <p className="muted">Search active listings and review related market information.</p>
        </div>
        <Link className="btn btn-primary" to="/buyer/listings">Browse Produce</Link>
      </div>

      <div className="grid grid-3">
        <StatCard label="Active listings" value="136" note="Available produce" />
        <StatCard label="Markets covered" value="12" note="Sample locations" />
        <StatCard label="Reference prices" value="28" note="Current records" />
      </div>

      <div className="dashboard-sections">
        <Card style={{ padding: 22 }}>
          <div className="panel-heading">
            <div><p className="eyebrow">MARKET</p><h3>Latest reference prices</h3></div>
            <Link className="text-button" to="/buyer/market">View all →</Link>
          </div>
          <PriceTable compact />
        </Card>

        <Card style={{ padding: 22 }}>
          <div className="panel-heading">
            <div><p className="eyebrow">SEARCH</p><h3>Browse by location</h3></div>
          </div>
          <div className="quick-actions">
            <Link className="btn btn-outline full-width" to="/buyer/listings">Pagadian</Link>
            <Link className="btn btn-outline full-width" to="/buyer/listings">Santiago</Link>
            <Link className="btn btn-outline full-width" to="/buyer/listings">Kumalarang</Link>
            <Link className="btn btn-outline full-width" to="/buyer/listings">Mahinog</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
