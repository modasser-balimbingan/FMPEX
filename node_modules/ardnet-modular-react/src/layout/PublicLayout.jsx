import { NavLink, Outlet, Link } from 'react-router-dom';
import Brand from '../components/common/Brand';

export default function PublicLayout() {
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
          <div className="nav-actions">
            <Link className="btn btn-outline btn-small" to="/login">Sign in</Link>
            <Link className="btn btn-primary btn-small" to="/register">Register</Link>
          </div>
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
