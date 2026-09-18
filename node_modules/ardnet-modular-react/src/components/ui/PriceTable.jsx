import { DEMO_PRICES } from '../../utils/constants';
import { peso } from '../../utils/format';
import Card from '../common/Card';

export default function PriceTable({ compact = false }) {
  const prices = DEMO_PRICES.slice(0, compact ? 3 : DEMO_PRICES.length);

  return (
    <Card className="table-panel">
      <div className="panel-heading">
        <div>
          <h3>Market reference prices</h3>
          <p>Reference information, not mandatory selling prices</p>
        </div>
      </div>
      <div className="table-scroll">
        <table className="market-table">
          <thead>
            <tr>
              <th>Produce</th>
              <th>Location</th>
              <th>Price</th>
              <th>Trend</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((price) => (
              <tr key={`${price.produce}-${price.location}`}>
                <td><strong>{price.produce}</strong></td>
                <td>{price.location}</td>
                <td>{peso(price.price)} / {price.unit}</td>
                <td className={price.trend >= 0 ? 'price-up' : 'price-down'}>
                  {price.trend >= 0 ? '+' : ''}{price.trend}%
                </td>
                <td>{price.source}<br /><small>{price.date}</small></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
