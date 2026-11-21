import { useEffect, useId, useState } from 'react';
import Card from '../common/Card';
import ListingIcon from '../../features/listings/ListingIcon';
import '../../styles/price-table.scss';

const API_BASE_URL = 'http://localhost:5000';

const priceFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency', currency: 'PHP', minimumFractionDigits: 2,
});
const dateFormatter = new Intl.DateTimeFormat('en-PH', {
  month: 'short', day: 'numeric', year: 'numeric',
});

function formatPriceDate(value) {
  if (!value) return 'Not provided';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? 'Not provided' : dateFormatter.format(date);
}

export default function PriceTable({ compact = false }) {
  const headingId = useId();
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchMarketPrices() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${API_BASE_URL}/api/market-prices`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch market prices');
        }

        const data = await response.json();
        setPrices(data);
      } catch (error) {
        console.error('Market price fetch error:', error);
        setError('Unable to load market prices.');
      } finally {
        setLoading(false);
      }
    }

    fetchMarketPrices();
  }, []);

  const displayedPrices = prices.slice(
    0,
    compact ? 3 : prices.length
  );

  return (
    <Card className="reference-prices">
      <div className="reference-prices__heading">
        <span className="reference-prices__icon"><ListingIcon name="leaf" size={21} /></span>
        <div className="reference-prices__intro">
          <h3 id={headingId}>Available market prices</h3>
          <p>Local market information, with the context that matters.</p>
        </div>
        <span className="reference-prices__badge">Reference only</span>
      </div>

      {loading ? (
          <p className="reference-prices__state" role="status">Loading market prices…</p>
        ) : error ? (
          <p className="reference-prices__state reference-prices__state--error" role="alert">{error} Please try again later.</p>
        ) : displayedPrices.length === 0 ? (
          <p className="reference-prices__state" role="status">No market prices available yet. Check back for new records.</p>
        ) : (
          <div className="reference-prices__scroll" role="region" aria-labelledby={headingId} tabIndex={0}>
          <table className="reference-prices__table" aria-labelledby={headingId} role="table">
            <thead role="rowgroup">
              <tr role="row">
                <th scope="col" role="columnheader">Produce</th>
                <th scope="col" role="columnheader">Market & location</th>
                <th scope="col" role="columnheader" className="reference-prices__amount-column">Reference price</th>
                <th scope="col" role="columnheader">As of</th>
                <th scope="col" role="columnheader">Source</th>
              </tr>
            </thead>

            <tbody role="rowgroup">
              {displayedPrices.map((price) => (
                <tr key={price.market_price_id} role="row">
                  <th scope="row" role="rowheader"><span className="reference-prices__produce">{price.produce_name}</span></th>

                  <td role="cell">
                    <span className="reference-prices__market">{price.market_name || price.location || 'Not provided'}</span>
                    {price.market_name && price.location && <span className="reference-prices__location">{price.location}</span>}
                  </td>

                  <td className="reference-prices__amount-column" role="cell">
                    <span className="reference-prices__amount">{priceFormatter.format(Number(price.price))}</span>
                    <span className="reference-prices__unit">/ {price.unit}</span>
                  </td>

                  <td className="reference-prices__date" data-label="As of" role="cell">{formatPriceDate(price.price_date)}</td>
                  <td data-label="Source" role="cell">
                    <span className="reference-prices__source">{price.source || 'Not provided'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      <div className="reference-prices__footer">
        <p>Reference prices guide your decisions. Farmers set their own selling prices.</p>
        {!loading && !error && displayedPrices.length > 0 && <span>{displayedPrices.length} record{displayedPrices.length === 1 ? '' : 's'} shown</span>}
      </div>
    </Card>
  );
}
