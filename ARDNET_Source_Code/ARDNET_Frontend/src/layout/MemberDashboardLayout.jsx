import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import useSidebarLayout from '../hooks/useSidebarLayout';
import { logoutSuccess } from '../redux/slices/authSlice';
import { useApp } from '../context/AppContext';
import DashboardIcon from '../components/ui/DashboardIcon';
import NotificationBell from '../features/notifications/NotificationBell';
import NotificationsPage from '../pages/NotificationsPage';
import { ADMIN_NAVIGATION } from '../features/admin/adminNavigation';
import ardnetLogo from '../../assets/ARDNET_LOGO.svg';
import '../styles/member-dashboard.scss';

export default function MemberDashboardLayout({ role }) {
  const { user } = useAuth();
  const { unreadNotifications, accountSuspended } = useApp();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 800px)').matches);
  const [drawer, setDrawer] = useState(false);
  const sidebar = useRef(null);
  const menu = useRef(null);
  const shell = useRef(null);
  const { mode, width, minimum, maximum, resizing, resizeHandle, setMode } = useSidebarLayout({ role, userId: user?.id ?? user?.user_id ?? user?.email, mobile, shell });
  const collapsed = mode === 'compact';
  const hidden = mode === 'hidden' && !mobile;
  const farmer = role === 'farmer';
  const admin = role === 'admin';
  const base = admin ? '/admin' : farmer ? '/dashboard' : '/buyer';
  const roleLabel = admin ? 'Administrator' : farmer ? 'Farmer' : 'Buyer / Vendor';
  const links = admin ? ADMIN_NAVIGATION : [[base, 'Overview', 'home'], [`${base}/listings`, farmer ? 'My listings' : 'Browse produce', 'package'], [`${base}/favorites`, 'Favorites', 'heart'], [`${base}/market`, 'Market prices', 'chart'], [`${base}/weather`, 'Weather', 'weather'], [`${base}/alerts`, 'Price alerts', 'bell'], [`${base}/notifications`, 'Notifications', 'message'], [`${base}/settings`, 'Settings', 'settings'], [`${base}/help`, 'Help & support', 'help']];
  if (farmer) links.splice(2, 0, [`${base}/produce`, 'Browse produce', 'leaf']);
  useEffect(() => { const media = window.matchMedia('(max-width: 800px)'); const update = () => { setMobile(media.matches); setDrawer(false); }; media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    if (!mobile || !drawer) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebar.current?.querySelector('button')?.focus();
    const trap = event => {
      if (event.key === 'Escape') { setDrawer(false); menu.current?.focus(); }
      if (event.key !== 'Tab') return;
      const items = [...sidebar.current.querySelectorAll('a,button')].filter(el => !el.disabled);
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', trap); window.requestAnimationFrame(() => menu.current?.focus()); };
  }, [mobile, drawer]);
  function logout() { dispatch(logoutSuccess()); navigate(admin ? '/admin/login' : '/login'); }
  function hideSidebar() { setMode('hidden'); window.requestAnimationFrame(() => menu.current?.focus()); }
  function openSidebar() { if (mobile) setDrawer(true); else { setMode('expanded'); window.requestAnimationFrame(() => sidebar.current?.querySelector('button')?.focus()); } }
  return <div ref={shell} style={{ '--member-sidebar-expanded-width': `${width}px` }} className={`member-shell${admin ? ' admin-shell' : ''}${collapsed ? ' is-collapsed' : ''}${hidden ? ' is-sidebar-hidden' : ''}${resizing ? ' is-sidebar-resizing' : ''}${drawer ? ' is-drawer-open' : ''}`}>
    {mobile && drawer && <button className="member-backdrop" aria-label="Close navigation" tabIndex={-1} onClick={() => { setDrawer(false); menu.current?.focus(); }} />}
    <div className="member-sidebar-frame">
    <aside id="member-sidebar" ref={sidebar} className="member-sidebar" inert={hidden || (mobile && !drawer) ? true : undefined} role={mobile && drawer ? 'dialog' : undefined} aria-modal={mobile && drawer ? true : undefined} aria-label="Workspace navigation">
      <div className="member-sidebar__brand"><Link to={base} className="member-logo" aria-label="ArdNet overview"><img className="member-logo__mark" src={ardnetLogo} width="36" height="36" alt="" aria-hidden="true" /><strong className="member-sidebar__text">ArdNet</strong></Link><div className="member-sidebar__controls"><button className="member-sidebar__collapse" type="button" aria-label={mobile ? 'Close navigation' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={mobile ? 'Close navigation' : collapsed ? 'Expand sidebar' : 'Collapse to icons'} aria-expanded={mobile ? drawer : !collapsed} onClick={() => mobile ? setDrawer(false) : setMode(collapsed ? 'expanded' : 'compact')}><DashboardIcon name={mobile ? 'close' : 'panel'} size={19} /></button>{!mobile && <button className="member-sidebar__collapse member-sidebar__hide" type="button" aria-label="Hide sidebar" title="Hide sidebar" onClick={hideSidebar}><DashboardIcon name="close" size={18} /></button>}</div></div>
      <p className="member-sidebar__caption member-sidebar__text">{admin ? 'Administration' : `${roleLabel} workspace`}</p>
      <nav className="member-sidebar__nav" aria-label="Dashboard">
        {links.map(([to, label, icon]) => <NavLink to={to} key={to} end={to === base} aria-label={label} title={collapsed && !mobile ? label : undefined} onClick={() => { if (mobile) menu.current?.focus(); }}><DashboardIcon name={icon} size={20} /><span className="member-sidebar__text">{label}</span>{to.endsWith('/notifications') && unreadNotifications > 0 && <span className="member-sidebar__count member-sidebar__text">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}</NavLink>)}
      </nav>
      <div className="member-sidebar__bottom"><Link to="/" title="Public site"><DashboardIcon name="leaf" /><span className="member-sidebar__text">Explore ArdNet</span></Link><button type="button" onClick={logout} aria-label="Log out" title="Log out"><DashboardIcon name="logout" /><span className="member-sidebar__text">Log out</span></button></div>
    </aside>
    {!mobile && !collapsed && !hidden && <><div {...resizeHandle} className="member-sidebar-resizer" role="separator" tabIndex={0} aria-label="Resize sidebar" aria-orientation="vertical" aria-controls="member-sidebar" aria-valuemin={minimum} aria-valuemax={maximum} aria-valuenow={width} aria-valuetext={`${width} pixels wide`} aria-describedby="sidebar-resize-help" title="Drag to resize. Double-click to reset."><span /></div><span id="sidebar-resize-help" className="sr-only">Drag to resize, or use the left and right arrow keys. Home and End select the minimum and maximum width. Enter or double-click resets the width. Escape cancels a drag.</span></>}
    </div>
    <main id="main-content" className="member-main" inert={mobile && drawer ? true : undefined}>
      <header className="member-topbar"><div className="member-topbar__location"><button ref={menu} type="button" className="member-icon-button member-mobile-menu" aria-label={mobile ? 'Open navigation' : 'Show sidebar'} aria-expanded={mobile ? drawer : !hidden} aria-controls="member-sidebar" onClick={openSidebar}><DashboardIcon name="menu" /></button><div><span>ArdNet / {roleLabel}</span><strong>{links.find(([to]) => to === pathname)?.[1] || 'Your workspace'}</strong></div></div><div className="member-topbar__user"><NotificationBell basePath={base} /><Link to={`${base}/settings`} className="member-profile" aria-label="Account settings"><span className="member-avatar">{(user?.name || roleLabel).slice(0, 1).toUpperCase()}</span><span><strong>{user?.name || roleLabel}</strong><small>{roleLabel}</small></span></Link></div></header>
      <div className="member-content">
        {accountSuspended ? <><section className="member-suspension" role="alert"><DashboardIcon name="shield" size={30} /><div><h1>Your account is suspended</h1><p>Dashboard actions are unavailable. You can read your notifications below. Please contact the ArdNet administrator for assistance.</p></div><button type="button" className="member-button" onClick={logout}>Sign out</button></section><NotificationsPage /></> : <Outlet />}
      </div>
    </main>
  </div>;
}
