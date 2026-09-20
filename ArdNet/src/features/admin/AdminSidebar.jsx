import { NavLink } from 'react-router-dom';

const items = [
  ['/admin', 'Overview'],
  ['/admin/users', 'Users'],
  ['/admin/categories', 'Categories'],
  ['/admin/listings', 'Listings'],
  ['/admin/market', 'Market Prices'],
  ['/admin/alerts', 'Alerts'],
  ['/admin/notifications', 'Notifications'],
  ['/admin/audit', 'Audit Logs'],
  ['/admin/integrations', 'Integrations'],
];

export default function AdminSidebar() {
  return (
    <nav className="admin-module-nav">
      {items.map(([to, label]) => (
        <NavLink key={to} to={to} end={to === '/admin'}>{label}</NavLink>
      ))}
    </nav>
  );
}
