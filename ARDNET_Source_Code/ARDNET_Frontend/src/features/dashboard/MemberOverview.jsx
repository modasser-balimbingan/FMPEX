import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useListings } from '../../hooks/useListings';
import { useApp } from '../../context/AppContext';
import PriceTable from '../../components/ui/PriceTable';
import DashboardIcon from '../../components/ui/DashboardIcon';
import NotificationFeed from '../notifications/NotificationFeed';

export default function MemberOverview({ role }) {
  const user = useSelector(state => state.auth.user);
  const { listings } = useListings();
  const { alerts, alertsLoading, notifications, notificationsLoading, notificationsError, unreadNotifications } = useApp();
  const farmer = role === 'farmer';
  const base = farmer ? '/dashboard' : '/buyer';
  const active = listings.filter(row => row.status === 'Active');
  const own = active.filter(row => String(row.userId) === String(user?.id ?? user?.user_id));
  const metrics = [
    [farmer ? 'My active listings' : 'Available listings', farmer ? own.length : active.length, 'package', `${base}/listings`],
    [farmer ? 'Local market locations' : 'Locations to explore', new Set(active.map(row => row.location).filter(Boolean)).size, 'pin', farmer ? `${base}/produce` : `${base}/listings`],
    ['Active price alerts', alertsLoading ? '…' : alerts.filter(row => row.status === 'Active').length, 'chart', `${base}/alerts`],
    ['Unread notifications', notificationsLoading ? '…' : unreadNotifications, 'bell', `${base}/notifications`],
  ];
  const actions = [[farmer ? 'Manage my produce' : 'Find local produce', farmer ? 'Keep your inventory up to date' : 'Discover what local farmers offer', 'package', 'listings'], ['Save your next find', 'Revisit your favorite produce listings', 'heart', 'favorites'], ['Set a price target', 'Follow market changes in Region IX', 'bell', 'alerts'], ['Check the forecast', 'Plan your day with local conditions', 'weather', 'weather']];
  return <div className="member-overview">
    <section className="member-welcome"><div><span className="member-kicker">{farmer ? 'YOUR FARMER WORKSPACE' : 'YOUR BUYER / VENDOR WORKSPACE'}</span><h1>Welcome back, {user?.name?.split(' ')[0] || 'there'}.</h1><p>{farmer ? 'A fresh look at your produce, your market, and your next opportunity.' : 'Fresh local produce and useful market information, all in one place.'}</p></div><Link className="member-button" to={`${base}/listings`}>{farmer ? 'My produce listings' : 'Browse produce'}<DashboardIcon name="arrowRight" size={17} /></Link></section>
    <div className="member-stats">{metrics.map(([label, value, icon, to]) => <Link className="member-stat" to={to} key={label}><span className="member-stat__icon"><DashboardIcon name={icon} size={21} /></span><span className="member-stat__label">{label}</span><strong>{value}</strong><span className="member-stat__detail">Take a closer look <DashboardIcon name="arrowRight" size={13} /></span></Link>)}</div>
    <div className="member-overview__market"><div><div className="member-section-heading"><div><span className="member-kicker">STAY INFORMED</span><h2>A view of your local market</h2></div><Link to={`${base}/market`}>View prices <DashboardIcon name="arrowRight" size={15} /></Link></div><PriceTable compact /></div><section className="member-quick-actions"><span className="member-kicker">MAKE YOUR NEXT MOVE</span><h2>Quick actions</h2>{actions.map(([title, text, icon, route]) => <Link to={`${base}/${route}`} key={route}><span className="member-quick-actions__icon"><DashboardIcon name={icon} /></span><span><strong>{title}</strong><small>{text}</small></span><DashboardIcon name="right" size={15} /></Link>)}</section></div>
    <div className="member-overview__activity"><section className="member-activity"><div className="member-section-heading"><div><span className="member-kicker">YOUR COMMUNITY</span><h2>Recent activity</h2></div><Link to={`${base}/notifications`}>View all <DashboardIcon name="arrowRight" size={15} /></Link></div>{notificationsError && <p role="alert" className="member-feedback">{notificationsError}</p>}{notificationsLoading && notifications.length === 0 ? <p className="member-feedback">Loading activity…</p> : notifications.length ? <NotificationFeed notifications={notifications.slice(0, 3)} compact /> : !notificationsError && <p className="member-feedback">Your welcome message, price alerts, and listing discussions will appear here.</p>}</section><section className="member-alert-summary"><span className="member-kicker">A PRICE THAT WORKS FOR YOU</span><h2>Keep your targets in sight.</h2><p>{alertsLoading ? 'Loading your price alerts…' : `You have ${alerts.filter(row => row.status === 'Active').length} active price alerts for Region IX.`}</p><p>Choose your produce, unit, and target price. We’ll keep the market context close.</p><Link className="member-button member-button--light" to={`${base}/alerts`}>Manage price alerts <DashboardIcon name="arrowRight" size={16} /></Link></section></div>
  </div>;
}
