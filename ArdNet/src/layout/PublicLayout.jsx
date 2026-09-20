import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { useDispatch } from 'react-redux';
import Brand from '../components/common/Brand';
import { logoutSuccess } from '../redux/slices/authSlice';
import { useAuth } from '../hooks/useAuth';

export default function PublicLayout() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useAuth();
  const dashboardPath = user?.role === 'admin' ? '/admin' : user?.role === 'buyer' ? '/buyer' : '/dashboard';
  const isLandingPage = pathname === '/';

  return (
    <div id="main-content" className="public-shell">
      <header className="site-header">
        <div className="container nav">
          <Brand />
          <nav className="nav-links" aria-label="Main navigation">
            <NavLink to="/market">Market Prices</NavLink>
            <NavLink to="/listings">Produce</NavLink>
            <NavLink to="/weather">Weather</NavLink>
            <NavLink to="/admin/login">Admin</NavLink>
          </nav>
          {isLandingPage && <div className="nav-actions">
            {isAuthenticated ? (
              <>
                <Link className="btn btn-outline btn-small" to={dashboardPath}>
                  <LayoutDashboard size={15} aria-hidden="true" />
                  Dashboard
                </Link>
                <button className="btn btn-primary btn-small" type="button" onClick={() => dispatch(logoutSuccess())}>
                  <LogOut size={15} aria-hidden="true" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-outline btn-small" to="/login">Sign in</Link>
                <Link className="btn btn-primary btn-small" to="/register">Register</Link>
              </>
            )}
          </div>}
        </div>
      </header>
      <Outlet />
      <footer className="footer">
        <div className="container footer-inner">
          <span>© 2026 ArdNet</span>
          <span>Farm-to-Market Price Exchange</span>
        </div>
      </footer>
    </div>
  );
}
