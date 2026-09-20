import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Brand from '../components/common/Brand';
import { logoutSuccess } from '../redux/slices/authSlice';
import { useAuth } from '../hooks/useAuth';

const links = {
  farmer: [
    ['/dashboard', 'Overview'],
    ['/dashboard/listings', 'My Listings'],
    ['/dashboard/market', 'Market Prices'],
    ['/dashboard/weather', 'Weather'],
    ['/dashboard/alerts', 'Price Alerts'],
    ['/dashboard/notifications', 'Notifications'],
    ['/dashboard/settings', 'Settings'],
    ['/dashboard/help', 'Help & Support'],
  ],
  buyer: [
    ['/buyer', 'Overview'],
    ['/buyer/listings', 'Browse Produce'],
    ['/buyer/market', 'Market Prices'],
    ['/buyer/weather', 'Weather'],
    ['/buyer/settings', 'Settings'],
    ['/buyer/help', 'Help & Support'],
  ],
  admin: [
    ['/admin', 'Overview'],
    ['/admin/users', 'Users'],
    ['/admin/categories', 'Categories'],
    ['/admin/listings', 'Listings'],
    ['/admin/market', 'Market Records'],
    ['/admin/alerts', 'Alerts'],
    ['/admin/notifications', 'Notifications'],
    ['/admin/audit', 'Audit Logs'],
    ['/admin/integrations', 'Integrations'],
    ['/admin/settings', 'Settings'],
    ['/admin/help', 'Help & Support'],
  ],
};

function roleName(role) {
  return role === 'farmer' ? 'Farmer' : role === 'buyer' ? 'Buyer / Vendor' : 'Administrator';
}

export default function DashboardLayout({ role }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const admin = role === 'admin';

  const logout = () => {
    dispatch(logoutSuccess());
    navigate(admin ? '/admin/login' : '/login');
  };

  const initials = (user?.name || roleName(role)).slice(0, 1).toUpperCase();

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <Brand compact={false} to={admin ? '/admin' : role === 'buyer' ? '/buyer' : '/dashboard'} />

        <div className="sidebar-role">{admin ? 'ADMINISTRATION' : `${roleName(role)} WORKSPACE`}</div>

        <div className="sidebar-profile">
          <div className="avatar">{initials}</div>
          <div>
            <strong>{user?.name || roleName(role)}</strong>
            <span>{roleName(role)}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links[role].map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/dashboard' || to === '/buyer' || to === '/admin'}>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {admin && <NavLink to="/">Public Site</NavLink>}
          <button type="button" onClick={logout}>Log out</button>
        </div>
      </aside>

      <main id="main-content" className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <strong>{admin ? 'Administrator overview' : `${roleName(role)} workspace`}</strong>
            <span aria-label="Current location">ArdNet / {admin ? 'Admin' : roleName(role)}</span>
          </div>
          <div className="dashboard-topbar-user">
            <span className="notification-dot">3</span>
            <span>{user?.name || roleName(role)}</span>
          </div>
        </header>

        <div className="dashboard-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
