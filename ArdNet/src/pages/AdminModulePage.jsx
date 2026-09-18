import Card from '../components/common/Card';
import { useState } from 'react';
import { useListings } from '../hooks/useListings';
import { useApp } from '../context/AppContext';
import { PHILIPPINES_PRODUCE_CATEGORIES, ZAMBOANGA_DEL_SUR_LOCATIONS } from '../utils/constants';

const modules = {
  users: ['User Management', 'Manage registered accounts and roles.'],
  categories: ['Category Management', 'Manage the master produce category list.'],
  listings: ['Listing Management', 'Review and manage produce listings.'],
  market: ['Market Price Records', 'Manage reference price records and source information.'],
  alerts: ['Price Alerts', 'Monitor active, triggered, and queued alert events.'],
  notifications: ['Notifications', 'Monitor notification activity and read status.'],
  audit: ['Audit Logs', 'Review important administrator and system actions.'],
  integrations: ['Integrations', 'Monitor REST, SOAP/WSDL, weather, RabbitMQ, and database services.'],
};

export default function AdminModulePage({ module = 'users' }) {
  const [title, description] = modules[module] || modules.users;
  const { listings, toggleStatus, markSold } = useListings();
  const { notify } = useApp();
  const [users, setUsers] = useState([
    { name: 'Juan Dela Cruz', email: 'juan@example.com', role: 'Farmer', status: 'Active' },
    { name: 'Maria Santos', email: 'maria@example.com', role: 'Buyer / Vendor', status: 'Active' },
    { name: 'ArdNet Administrator', email: 'admin@ardnet.ph', role: 'Administrator', status: 'Active' },
  ]);
  const rows = module === 'users' ? users : module === 'categories'
    ? PHILIPPINES_PRODUCE_CATEGORIES.map((name, index) => ({ name, scope: 'Philippines produce', records: `${index + 4} listings` }))
    : module === 'listings' ? listings : module === 'market'
      ? listings.slice(0, 6).map((item) => ({ name: item.produce, location: item.location, price: `₱${item.price} / ${item.unit}`, status: 'Reference' }))
      : module === 'alerts' ? [{ name: 'Rice price threshold', owner: 'Juan Dela Cruz', status: 'Triggered' }, { name: 'Coconut price threshold', owner: 'Maria Santos', status: 'Active' }]
        : module === 'notifications' ? [{ name: 'Listing status update', recipient: 'Juan Dela Cruz', status: 'Delivered' }, { name: 'Market record update', recipient: 'All buyers', status: 'Queued' }]
          : module === 'audit' ? [{ name: 'Administrator sign-in', actor: 'admin@ardnet.ph', status: 'Success' }, { name: 'Listing status changed', actor: 'System', status: 'Recorded' }]
            : [{ name: 'REST / JSON', status: 'Operational' }, { name: 'Weather API', status: 'Operational' }, { name: 'Backup service', status: 'Ready' }, { name: 'Recovery snapshot', status: 'Available' }];

  const action = (row) => {
    if (module === 'listings') {
      if (row.status === 'Sold') markSold(row.id);
      else toggleStatus(row.id);
    }
    if (module === 'users') {
      setUsers((current) => current.map((user) => user.email === row.email
        ? { ...user, status: user.status === 'Active' ? 'Suspended' : 'Active' }
        : user));
    }
    notify(`${title} action accepted.`, 'success');
  };

  return (
    <div className="page">
      <p className="eyebrow">ADMINISTRATION</p>
      <h1>{title}</h1>
      <p className="muted">{description}</p>

      <Card style={{ padding: 24, marginTop: 20 }}>
        <div className="panel-heading">
          <div><p className="eyebrow">MODULE</p><h3>{title}</h3></div>
          <span className="status active">Protected</span>
        </div>
        <p className="muted">Demo controls are enabled for review. Production persistence should be connected to the protected API.</p>
        <div className="table-scroll"><table className="market-table"><thead><tr><th>Record</th><th>Details</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.name}-${index}`}><td><strong>{row.name || row.produce}</strong></td><td>{row.email || row.location || row.actor || row.owner || row.recipient || row.price || row.scope || row.records || ''}</td><td>{row.status || 'Managed'}</td><td>{module === 'listings' || module === 'users' ? <button className="btn btn-outline btn-small" type="button" onClick={() => action(row)}>{module === 'users' ? 'Manage access' : row.status === 'Active' ? 'Deactivate' : 'Activate'}</button> : <button className="btn btn-outline btn-small" type="button" onClick={() => notify(`${row.name} reviewed.`, 'success')}>Review</button>}</td></tr>)}</tbody></table></div>
      </Card>
    </div>
  );
}
