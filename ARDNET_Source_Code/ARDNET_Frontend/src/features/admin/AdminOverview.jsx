import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import apiClient from '../../api/apiClient';
import DashboardIcon from '../../components/ui/DashboardIcon';
import AdminPageHeader from './AdminPageHeader';

const shortcuts = [
  ['users', 'Manage accounts', 'Review roles and account access.', 'users'],
  ['market', 'Update market records', 'Keep regional reference prices useful.', 'chart'],
  ['listings', 'Review produce', 'Manage active marketplace listings.', 'package'],
  ['categories', 'Produce categories', 'Explore your produce category directory.', 'categories'],
];
const sources = [
  ['users', '/api/admin/users', data => data?.users],
  ['listings', '/api/listings', data => data],
  ['prices', '/api/market-prices', data => data],
  ['activity', '/api/admin/audit-logs', data => data?.auditLogs],
];

export default function AdminOverview() {
  const { supportRequests } = useApp();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState([]);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    Promise.allSettled(sources.map(async ([key, url, extract]) => {
      const response = await apiClient.get(url);
      const rows = extract(response.data);
      if (!response.success || !Array.isArray(rows)) throw Error(key);
      return [key, rows];
    })).then(results => {
      if (!live) return;
      const loaded = {}, failed = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') loaded[result.value[0]] = result.value[1];
        else failed.push(sources[index][0]);
      });
      setData(loaded); setUnavailable(failed); setLoading(false);
    });
    return () => { live = false; };
  }, [revision]);
  const metrics = [
    ['Registered accounts', data.users?.length, 'users', 'users', 'Accounts in your community'],
    ['Active produce listings', data.listings?.length, 'package', 'listings', 'Currently visible in the market'],
    ['Market price records', data.prices?.length, 'chart', 'market', 'Reference prices on record'],
  ];
  return <div className="page admin-overview">
    <AdminPageHeader title="A clear view of your community." description="A little oversight goes a long way. Manage access, keep market information useful, and follow recent activity." />
    <div className="admin-overview__heading"><div><p className="member-kicker">WORKSPACE AT A GLANCE</p><h2>Community overview</h2></div><button type="button" className="member-button member-button--outline" onClick={() => setRevision(value => value + 1)} disabled={loading}><DashboardIcon name="history" size={17} />{loading ? 'Refreshing…' : 'Refresh overview'}</button></div>
    {unavailable.length > 0 && <p role="status" className="workspace-callout">Some information could not be loaded. Refresh to try again; unavailable figures are shown as a dash.</p>}
    <div className="admin-stats">{metrics.map(([label, value, icon, route, note]) => <Link className="admin-stat" to={'/admin/' + route} key={label}><span className="workspace-icon"><DashboardIcon name={icon} size={23} /></span><span>{label}</span><strong>{loading ? '…' : value == null ? '—' : value.toLocaleString()}</strong><small>{note}</small></Link>)}</div>
    <section className="admin-region-note"><span className="workspace-icon"><DashboardIcon name="pin" size={24} /></span><div><p className="member-kicker">REGIONAL COVERAGE</p><h2>Region IX · Zamboanga Peninsula</h2><p>Add and maintain price records for Region 9. Additional Philippine regions will follow in a future update.</p></div><Link to="/admin/market" className="member-button member-button--outline">Market records<DashboardIcon name="arrowRight" size={16} /></Link></section>
    <div className="admin-overview-grid">
      <section className="workspace-panel"><div className="workspace-section-heading"><div><p className="member-kicker">MAKE YOUR NEXT MOVE</p><h2>Your admin tools</h2></div></div><div className="admin-shortcuts">{shortcuts.map(([route, title, text, icon]) => <Link to={'/admin/' + route} key={route}><span className="workspace-icon"><DashboardIcon name={icon} size={20} /></span><div><strong>{title}</strong><p>{text}</p></div><DashboardIcon name="right" size={17} /></Link>)}</div></section>
      <section className="workspace-panel admin-recent-activity"><div className="workspace-section-heading"><div><p className="member-kicker">RECENT ACTIVITY</p><h2>From the audit log</h2></div><Link className="workspace-text-link" to="/admin/audit">View all<DashboardIcon name="arrowRight" size={16} /></Link></div>
        {loading ? <p role="status">Loading recent activity…</p> : !data.activity ? <p>Recent activity is unavailable. Refresh the overview to try again.</p> : !data.activity.length ? <div className="admin-empty"><DashboardIcon name="history" size={27} /><h3>No activity recorded yet</h3><p>Administrator actions will appear here as they are logged.</p></div> : <div className="admin-audit-feed">{data.activity.slice(0, 5).map(row => <article key={row.audit_id}><span className="workspace-icon"><DashboardIcon name="history" size={18} /></span><div><h3>{row.action || 'Account activity'}</h3><p>{row.description || row.entity_name || 'Administrative action'}</p><small>{row.actor_name || row.actor_email || 'System'}{row.created_at && ' · ' + new Date(row.created_at).toLocaleString()}</small></div></article>)}</div>}
      </section>
    </div>
    <section className="workspace-panel admin-support-summary"><span className="workspace-icon"><DashboardIcon name="help" size={24} /></span><div><h2>Keep community questions close.</h2><p>{supportRequests.filter(row => row.status === 'New').length} new support request(s) saved in this browser. Requests are currently stored on this device.</p></div><Link className="member-button" to="/admin/help">Open support<DashboardIcon name="arrowRight" size={16} /></Link></section>
  </div>;
}
