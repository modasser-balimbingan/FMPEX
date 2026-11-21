import { useEffect, useId, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import Brand from '../components/common/Brand';
import DashboardIcon from '../components/ui/DashboardIcon';

function LostPathIllustration() {
  const id = useId();
  return <svg className="error-page__landscape" viewBox="0 0 520 390" fill="none" aria-hidden="true" focusable="false">
    <defs><clipPath id={id}><circle cx="260" cy="185" r="167" /></clipPath></defs>
    <ellipse cx="260" cy="365" rx="158" ry="10" fill="var(--error-art-shadow)" />
    <circle cx="260" cy="185" r="178" stroke="var(--error-art-line)" strokeDasharray="3 9" />
    <g clipPath={`url(#${id})`}>
      <circle cx="260" cy="185" r="167" fill="var(--error-art-sky)" />
      <circle cx="355" cy="89" r="35" fill="var(--error-art-sun)" opacity=".35" />
      <circle cx="355" cy="89" r="22" fill="var(--error-art-sun)" />
      <g className="error-page__breeze" stroke="var(--error-art-line)" strokeWidth="3" strokeLinecap="round">
        <path d="M133 96h43c19 0 19-22 4-22m-60 40h33m169 27h54c18 0 18-20 5-20" />
      </g>
      <text x="260" y="233" textAnchor="middle" fill="var(--error-art-ink)" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="158" fontWeight="750" letterSpacing="-12">404</text>
      <g stroke="var(--error-art-leaf)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M261 187v-31" />
        <path d="M261 174c-17 0-25-8-25-20 16 0 25 7 25 20Zm0-9c0-14 8-21 22-21 0 13-7 21-22 21Z" fill="var(--error-art-leaf)" />
      </g>
      <path d="M73 275c65-52 125-43 184-12 62 33 120-38 193-17v127H73Z" fill="var(--error-art-back)" />
      <path d="M65 319c91-75 196-43 244-18 46 24 89-18 150-8v103H65Z" fill="var(--error-art-front)" />
      <path d="M295 271c-8 17-44 20-48 37-6 22 56 19 72 55h-65c-2-26-42-26-34-49 7-21 59-28 75-43Z" fill="var(--error-art-path)" />
      <path d="m111 296 15-12m-1 21 15-12m194 31 16-10m-2 21 16-10" stroke="var(--error-art-path)" strokeWidth="2" strokeLinecap="round" opacity=".5" />
    </g>
    <g transform="translate(86 246)" stroke="var(--error-art-leaf)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M0 69V6m0 43c-24 0-34-11-34-29C-12 20 0 31 0 49Zm0-24C0 7 11-4 30-4c0 19-11 29-30 29Z" fill="var(--error-art-leaf)" />
      <path d="M-14 69h28" />
    </g>
    <g transform="rotate(-8 405 283)">
      <rect x="366" y="258" width="78" height="49" rx="13" fill="var(--surface)" stroke="var(--error-border)" />
      <path d="M388 282h31m-11-10 11 10-11 10" stroke="var(--error-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <circle cx="107" cy="159" r="5" fill="var(--error-art-sun)" />
    <circle cx="429" cy="198" r="4" fill="var(--error-art-leaf)" />
  </svg>;
}

export default function NotFoundPage() {
  const user = useSelector(state => state.auth.user);
  const { pathname } = useLocation();
  const heading = useRef(null);
  const workspace = { farmer: '/dashboard', buyer: '/buyer', admin: '/admin' }[user?.role];
  const destinations = [
    { to: workspace && user.role !== 'admin' ? `${workspace}/${user.role === 'farmer' ? 'produce' : 'listings'}` : '/listings', icon: 'leaf', title: 'Browse produce', description: 'Explore listings from local farmers.' },
    { to: workspace ? `${workspace}/market` : '/market', icon: 'chart', title: 'Market prices', description: 'Find reference prices in your area.' },
    { to: workspace && user.role !== 'admin' ? `${workspace}/weather` : '/weather', icon: 'weather', title: 'Local weather', description: 'Plan your next day on the farm.' },
  ];

  useEffect(() => {
    document.title = 'Page not found | ArdNet';
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return <div className="error-page">
    <header className="error-page__header">
      <Brand />
      <div className="error-page__header-actions">
        <span className="theme-slot" data-theme-slot />
        <Link className="error-page__home-link" to="/"><DashboardIcon name="home" size={17} /><span>ArdNet home</span></Link>
      </div>
    </header>

    <main id="main-content" className="error-page__main" tabIndex={-1}>
      <section className="error-page__hero" aria-labelledby="error-page-title">
        <div className="error-page__copy">
          <p className="error-page__eyebrow"><span>404</span> PAGE NOT FOUND</p>
          <h1 id="error-page-title" ref={heading} tabIndex={-1}>A little off the<br className="error-page__line-break" /> beaten path.</h1>
          <p className="error-page__description">We couldn’t find the page you’re looking for. The link may be outdated, or the address might have a typo.</p>
          <div className="error-page__actions">
            <Link className="error-page__button error-page__button--primary" to={workspace || '/'}><DashboardIcon name={workspace ? 'categories' : 'home'} size={18} />{workspace ? 'Back to dashboard' : 'Back to home'}<DashboardIcon name="arrowRight" size={17} /></Link>
            <Link className="error-page__button error-page__button--secondary" to={destinations[0].to}>Explore produce</Link>
          </div>
          <p className="error-page__reassurance"><DashboardIcon name="leaf" size={15} />There’s still plenty to discover on ArdNet.</p>
        </div>
        <div className="error-page__art"><LostPathIllustration /><span className="error-page__art-caption"><span />A fresh route awaits</span></div>
      </section>

      <section className="error-page__destinations" aria-labelledby="error-destinations-title">
        <div className="error-page__section-heading"><h2 id="error-destinations-title">Find your next stop</h2><Link to={workspace ? `${workspace}/help` : '/login'}><DashboardIcon name="help" size={16} />{workspace ? 'Help & support' : 'Sign in for support'}</Link></div>
        <nav className="error-page__shortcuts" aria-label="Suggested pages">
          {destinations.map(({ to, icon, title, description }) => <Link className="error-page__shortcut" to={to} key={title}><span className="error-page__shortcut-icon"><DashboardIcon name={icon} size={21} /></span><span className="error-page__shortcut-copy"><strong>{title}</strong><span>{description}</span></span><DashboardIcon name="arrowRight" size={17} /></Link>)}
        </nav>
      </section>
    </main>

    <footer className="error-page__footer"><span>© {new Date().getFullYear()} ArdNet</span><span>Connecting farms. Growing possibilities.</span></footer>
  </div>;
}
