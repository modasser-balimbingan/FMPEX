import Card from '../../components/common/Card';
import { useState } from 'react';
import { PHILIPPINES_PRODUCE_CATEGORIES, ZAMBOANGA_DEL_SUR_LOCATIONS } from '../../utils/constants';
import { useApp } from '../../context/AppContext';

export default function AlertPanel() {
  const { alerts, createPriceAlert, notify } = useApp();
  const [produce, setProduce] = useState('Rice');
  const [location, setLocation] = useState('Pagadian');
  const [target, setTarget] = useState('');
  const submit = (event) => {
    event.preventDefault();
    if (!target || Number(target) <= 0) {
      notify('Enter a valid target price.', 'error');
      return;
    }
    createPriceAlert({ produce, location, target: Number(target), condition: 'at-or-above' });
    setTarget('');
    notify('Price alert queued and evaluated.', 'success');
  };
  return <><form className="card form alert-form" onSubmit={submit}><h3>Create price alert</h3><div className="grid grid-3"><label className="form-group">Produce<select className="select" value={produce} onChange={(event) => setProduce(event.target.value)}>{PHILIPPINES_PRODUCE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="form-group">Location<select className="select" value={location} onChange={(event) => setLocation(event.target.value)}>{ZAMBOANGA_DEL_SUR_LOCATIONS.map((item) => <option key={item}>{item}</option>)}</select></label><label className="form-group">Target price<input className="input" type="number" min="0.01" step="0.01" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="₱30" required /></label></div><button className="btn btn-primary" type="submit">Create alert</button></form><div className="grid grid-3">{alerts.length === 0 ? <Card style={{ padding: 22 }}><p className="muted">No alerts created yet.</p></Card> : alerts.map((alert) => <Card style={{ padding: 22 }} key={alert.id}><div className="eyebrow">{alert.status.toUpperCase()}</div><h3>{alert.produce} at {alert.location}</h3><p className="muted">Target: ₱{alert.target}/kg · Queue processed</p></Card>)}</div></>;
}
