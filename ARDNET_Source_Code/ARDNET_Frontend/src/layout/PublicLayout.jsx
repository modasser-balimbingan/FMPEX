import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import Brand from '../components/common/Brand';
import '../styles/landing-page.scss';
import '../styles/public-pages.scss';

export default function PublicLayout() {
  const { pathname } = useLocation();

  return (
    <div id="main-content" className="public-shell landing-shell">
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
            <span className="theme-slot" data-theme-slot />
            <Link className="btn btn-outline btn-small" to="/login">Sign in</Link>
            <Link className="btn btn-primary btn-small" to="/register">Register</Link>
          </div>
        </div>
      </header>
      <div className={pathname === '/' ? undefined : 'public-content--spaced'}><Outlet /></div>
      <footer className="footer">
        <div className="container footer-inner">
          <Brand compact />
          <span>© {new Date().getFullYear()} ArdNet · Farm-to-Market Price Exchange</span>
        </div>
      </footer>
    </div>
  );
}
