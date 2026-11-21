import { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardIcon from '../../components/ui/DashboardIcon';
import { PHILIPPINES_PRODUCE_CATEGORIES } from '../../utils/constants';
import { useApp } from '../../context/AppContext';

const price = value => Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export default function AlertPanel() {
  const { isSignedIn, alerts, alertsLoading, alertsError, refreshAlerts, createPriceAlert, updatePriceAlert, deletePriceAlert, notify } = useApp();
  const [form, setForm] = useState({ produce: '', target: '', condition: 'lte', unit: 'kg' });
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState(null);
  const [filter, setFilter] = useState('all');
  const editor = useRef(null);
  const listId = useId();
  const active = alerts.filter(row => row.status === 'Active').length;
  const visible = alerts.filter(row => filter === 'all' || row.status === filter);
  function reset() { setEditing(null); setForm({ produce: '', target: '', condition: 'lte', unit: 'kg' }); }
  function change(event) { setForm(value => ({ ...value, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); if (busy || action !== null) return;
    if (!form.produce.trim() || !(Number(form.target) > 0) || !Number.isFinite(Number(form.target))) { notify('Enter a produce name and a positive target price.', 'error'); return; }
    setBusy(true);
    try {
      const payload = { produce_name: form.produce.trim(), target_price: Number(form.target), condition: form.condition, unit: form.unit, region_code: 'IX' };
      const result = editing === null ? await createPriceAlert(payload) : await updatePriceAlert(editing, payload);
      if (!result.success) throw new Error(result.error || 'Could not save your alert.');
      notify(editing === null ? 'Price alert created.' : 'Price alert updated.'); reset();
    } catch (error) { notify(error.message, 'error'); } finally { setBusy(false); }
  }
  function edit(row) { setEditing(row.alert_id); setForm({ produce: row.produce_name, target: String(row.target_price), condition: ['>=', 'gte'].includes(row.condition) ? 'gte' : 'lte', unit: row.unit }); editor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  async function mutate(row, remove = false) {
    if (remove && !window.confirm(`Delete your ${row.produce_name} price alert?`)) return;
    setAction(row.alert_id);
    try {
      const result = remove ? await deletePriceAlert(row.alert_id) : await updatePriceAlert(row.alert_id, { status: row.status === 'Active' ? 'Inactive' : 'Active' });
      if (!result.success) throw new Error(result.error || 'Could not update your alert.');
      if (remove && editing === row.alert_id) reset();
      notify(remove ? 'Price alert deleted.' : 'Price alert updated.');
    } catch (error) { notify(error.message, 'error'); } finally { setAction(null); }
  }
  if (!isSignedIn) return <section className="workspace-panel workspace-empty"><DashboardIcon name="bell" size={32} /><h2>Your market, your price target.</h2><p>Sign in to create regional price alerts and keep track of market changes.</p><Link className="member-button" to="/login">Sign in</Link></section>;
  return <div className="alerts-workspace">
    <div className="workspace-metrics"><div><span>Active alerts</span><strong>{active}</strong></div><div><span>Paused alerts</span><strong>{alerts.length - active}</strong></div><div><span>Monitoring area</span><strong>Region IX</strong></div></div>
    <div className="alerts-layout">
      <section ref={editor} className="workspace-panel alerts-editor"><div className="workspace-section-title"><span className="workspace-icon"><DashboardIcon name="bell" size={23} /></span><div><h2>{editing === null ? 'Set your next price target' : 'Edit your price alert'}</h2><p>A little market awareness goes a long way.</p></div></div>
        <form className="workspace-form" onSubmit={submit}>
          <label className="form-group">Produce<input className="input" list={listId} name="produce" value={form.produce} onChange={change} maxLength={100} placeholder="e.g. Rice" required /><datalist id={listId}>{PHILIPPINES_PRODUCE_CATEGORIES.map(item => <option value={item} key={item} />)}</datalist></label>
          <div className="workspace-form-row"><label className="form-group">Target price (₱)<input className="input" name="target" type="number" min="0.01" step="0.01" value={form.target} onChange={change} placeholder="50.00" required /></label><label className="form-group">Per unit<select className="select" name="unit" value={form.unit} onChange={change}>{['kg', 'piece', 'sack', 'bundle', 'liter'].map(item => <option key={item}>{item}</option>)}</select></label></div>
          <fieldset className="alert-comparison"><legend>Notify me when the reference price is</legend>{[['lte', 'At or below', 'A lower price to watch'], ['gte', 'At or above', 'A higher price to watch']].map(([value, label, note]) => <label key={value} className={form.condition === value ? 'is-selected' : ''}><input type="radio" name="condition" value={value} checked={form.condition === value} onChange={change} /><span><strong>{label}</strong><small>{note}</small></span></label>)}</fieldset>
          <p className="workspace-callout"><DashboardIcon name="pin" size={18} /> Monitoring Zamboanga Peninsula (Region IX). Prices are reference information; you choose your selling price.</p>
          <div className="form-actions"><button className="member-button" type="submit" disabled={busy || action !== null}>{busy ? 'Saving…' : editing === null ? 'Create price alert' : 'Save changes'}<DashboardIcon name="arrowRight" size={16} /></button>{editing !== null && <button className="member-button member-button--outline" type="button" onClick={reset} disabled={busy}>Cancel edit</button>}</div>
        </form>
      </section>
      <section className="alerts-collection"><div className="workspace-section-heading"><div><p className="member-kicker">YOUR WATCHLIST</p><h2>Price alerts</h2></div><button className="member-button member-button--outline" type="button" onClick={() => void refreshAlerts()} disabled={alertsLoading}>Refresh</button></div>
        <div className="workspace-tabs">{['all', 'Active', 'Inactive'].map(value => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'all' ? 'All alerts' : value === 'Inactive' ? 'Paused' : 'Active'}</button>)}</div>
        {alertsError && <p className="form-message error" role="alert">{alertsError}</p>}
        {alertsLoading && <p role="status" className="muted">Loading price alerts…</p>}
        {!alertsLoading && !alertsError && !visible.length && <div className="workspace-panel workspace-empty"><DashboardIcon name="chart" size={30} /><h3>{alerts.length ? 'No alerts in this view' : 'Your watchlist starts here'}</h3><p>Create a target to keep your next market opportunity in sight.</p></div>}
        <div className="alert-records">{visible.map(row => <article className="workspace-panel alert-record" key={row.alert_id}><header><span className="workspace-icon"><DashboardIcon name="leaf" size={22} /></span><div><h3>{row.produce_name}</h3><span>Region {row.region_code || 'IX'} · Reference price</span></div><span className={`workspace-status ${row.status === 'Active' ? 'is-active' : ''}`}>{row.status === 'Active' ? 'Active' : 'Paused'}</span></header><p className="alert-record__target">{['>=', 'gte'].includes(row.condition) ? 'At or above' : 'At or below'}<strong>₱{price(row.target_price)}<small>/{row.unit}</small></strong></p><footer><button type="button" onClick={() => edit(row)} disabled={busy || action !== null}><DashboardIcon name="edit" size={15} />Edit</button><button type="button" onClick={() => void mutate(row)} disabled={busy || action !== null}>{row.status === 'Active' ? 'Pause alert' : 'Activate alert'}</button><button className="workspace-danger" type="button" onClick={() => void mutate(row, true)} disabled={busy || action !== null}><DashboardIcon name="trash" size={15} />Delete</button></footer></article>)}</div>
      </section>
    </div>
  </div>;
}
