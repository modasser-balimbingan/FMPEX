import { useState } from 'react';
import Card from '../../components/common/Card';
import DashboardIcon from '../../components/ui/DashboardIcon';
import AdminPageHeader from './AdminPageHeader';
import { MARKET_REGIONS } from './adminNavigation';
import { marketLocationLabel, marketDateLabel } from './marketRecordDisplay';

const regionCode = record => String(record.region_code || '').trim().toUpperCase();
const units = ['kg', 'sack', 'piece', 'bundle', 'liter', 'ton'];

export default function AdminMarketRecords({ title, description, marketPrices, marketCategories,
  marketForm, setMarketForm, marketLoading, marketError, marketSaving, marketDeletingId,
  editingMarketId, onSubmit, onCancel, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');
  const filtered = marketPrices.filter(record => {
    const matchesRegion = region === 'all' || (region === 'unassigned' ? !regionCode(record) : regionCode(record) === region);
    const searchable = [record.produce_name, record.market_name, record.location, record.source,
      record.unit, record.region_code, record.province].filter(Boolean).join(' ').toLowerCase();
    return matchesRegion && searchable.includes(search.trim().toLowerCase());
  });
  const change = event => setMarketForm(current => ({ ...current, [event.target.name]: event.target.value }));

  return <div className="page admin-market-page">
    <AdminPageHeader module="market" title={title} description={description} />
    <Card className="admin-panel admin-market-editor">
      <div className="panel-heading"><div><p className="eyebrow">REFERENCE PRICES</p><h2>{editingMarketId ? 'Edit market record' : 'Add a market record'}</h2></div><span className="workspace-status is-active"><DashboardIcon name="shield" size={14} /> Admin access</span></div>
      <p className="muted">Give the community reliable price information, with a clear place, date, and source.</p>
      <form className="workspace-form admin-market-form" onSubmit={onSubmit}>
        <fieldset className="admin-fieldset" disabled={marketSaving}>
          <legend><DashboardIcon name="leaf" size={19} /> Produce &amp; reference price</legend>
          <div className="admin-form-grid">
            <label className="form-group">Produce category
              <select className="input" name="category_id" value={marketForm.category_id} onChange={event => {
                const selected = marketCategories.find(category => String(category.category_id) === event.target.value);
                setMarketForm(current => ({ ...current, category_id: event.target.value, produce_name: current.produce_name || selected?.category_name || '' }));
              }} required><option value="">Select category</option>{marketCategories.map(category => <option key={category.category_id} value={category.category_id}>{category.category_name}</option>)}</select>
            </label>
            <label className="form-group">Produce name<input className="input" name="produce_name" value={marketForm.produce_name} onChange={change} placeholder="e.g. Rice" required maxLength={100} /></label>
            <label className="form-group">Reference price (₱)<input className="input" name="price" type="number" min="0.01" step="0.01" value={marketForm.price} onChange={change} placeholder="0.00" required /></label>
            <label className="form-group">Unit<select className="input" name="unit" value={marketForm.unit} onChange={change} required>
              {!units.includes(marketForm.unit) && <option value={marketForm.unit}>{marketForm.unit}</option>}
              {units.map(unit => <option key={unit} value={unit}>{unit === 'kg' ? 'Per kilogram (kg)' : 'Per ' + unit}</option>)}
            </select></label>
          </div>
        </fieldset>
        <fieldset className="admin-fieldset" disabled={marketSaving}>
          <legend><DashboardIcon name="pin" size={19} /> Market &amp; region</legend>
          <p className="admin-fieldset__hint">Region IX is currently supported. More Philippine regions will be available in a future update.</p>
          <div className="admin-form-grid">
            <label className="form-group">Region code<select className="input" name="region_code" value={marketForm.region_code} onChange={change} required>
              <option value="">Select a region</option>{MARKET_REGIONS.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
            </select></label>
            <label className="form-group">Market name<input className="input" name="market_name" value={marketForm.market_name} onChange={change} placeholder="e.g. Pagadian Public Market" required maxLength={150} /></label>
            <label className="form-group">City / municipality<input className="input" name="location" value={marketForm.location} onChange={change} placeholder="e.g. Pagadian City" required maxLength={150} /></label>
            <label className="form-group">Location type<select className="input" name="location_type" value={marketForm.location_type} onChange={change} required><option value="">Select location type</option><option value="City">City</option><option value="Municipality">Municipality</option></select></label>
            <label className="form-group admin-form-grid__full">Province <span className="workspace-field-hint">Optional for an independent city.</span><input className="input" name="province" value={marketForm.province} onChange={change} placeholder="e.g. Zamboanga del Sur" maxLength={100} /></label>
          </div>
        </fieldset>
        <fieldset className="admin-fieldset" disabled={marketSaving}>
          <legend><DashboardIcon name="calendar" size={19} /> Date &amp; source</legend>
          <div className="admin-form-grid">
            <label className="form-group">Price date<input className="input" name="price_date" type="date" value={marketForm.price_date} onChange={change} required /></label>
            <label className="form-group">Source<input className="input" name="source" value={marketForm.source} onChange={change} placeholder="e.g. Market survey / DA report" required maxLength={200} /></label>
          </div>
        </fieldset>
        {marketError && <p role="alert" className="form-message error">{marketError}</p>}
        <div className="form-actions"><button className="member-button" type="submit" disabled={marketSaving || marketCategories.length === 0}><DashboardIcon name={editingMarketId ? 'check' : 'plus'} size={17} />{marketSaving ? 'Saving…' : editingMarketId ? 'Save changes' : 'Add market record'}</button>{editingMarketId && <button className="member-button member-button--outline" type="button" onClick={onCancel} disabled={marketSaving}>Cancel edit</button>}</div>
        {!marketLoading && marketCategories.length === 0 && <p className="muted">No produce categories are available. Try refreshing this page before adding a record.</p>}
      </form>
    </Card>
    <Card className="admin-panel admin-market-records">
      <div className="panel-heading"><div><p className="eyebrow">YOUR PRICE LIBRARY</p><h2>Saved market records</h2></div><span className="workspace-status">{filtered.length} record{filtered.length === 1 ? '' : 's'}</span></div>
      <div className="admin-record-filters workspace-form">
        <label className="form-group">Search records<span className="admin-search-field"><DashboardIcon name="search" size={18} /><input className="input" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Produce, market, location, or source" /></span></label>
        <label className="form-group">Region<select className="input" value={region} onChange={event => setRegion(event.target.value)}><option value="all">All saved records</option>{MARKET_REGIONS.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}<option value="unassigned">Region not assigned</option></select></label>
      </div>
      {marketLoading ? <p className="muted" role="status">Loading market records…</p> : !filtered.length ? <div className="admin-empty"><DashboardIcon name="chart" size={27} /><h3>{marketPrices.length ? 'No matching records' : 'Your price library starts here'}</h3><p>{marketPrices.length ? 'Try another search or region filter.' : 'Add your first verified market price using the form above.'}</p></div> :
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Market price records table"><table className="market-table admin-record-table">
          <thead><tr>{['Produce', 'Market / location', 'Region', 'Reference price', 'As of', 'Source', 'Actions'].map(heading => <th scope="col" key={heading}>{heading}</th>)}</tr></thead>
          <tbody>{filtered.map(record => <tr key={record.market_price_id}>
            <td><strong>{record.produce_name}</strong><div className="muted">{marketCategories.find(category => Number(category.category_id) === Number(record.category_id))?.category_name || 'Produce'}</div></td>
            <td>{record.market_name}<div className="muted">{marketLocationLabel(record)}</div>{record.location_type && <small className="muted">{record.location_type}</small>}</td>
            <td className="admin-record-region"><span className={'workspace-status' + (regionCode(record) ? ' is-active' : '')}>{regionCode(record) ? 'Region ' + regionCode(record) : 'Not assigned'}</span></td>
            <td className="admin-record-price"><strong className="admin-price">₱{Number(record.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><span className="muted"> / {record.unit}</span></td>
            <td className="admin-record-date">{record.price_date ? <time dateTime={String(record.price_date).slice(0, 10)}>{marketDateLabel(record.price_date)}</time> : '—'}</td><td>{record.source || '—'}</td>
            <td><div className="admin-row-actions"><button className="btn btn-outline btn-small" type="button" disabled={marketSaving || marketDeletingId !== null} onClick={() => onEdit(record)}><DashboardIcon name="edit" size={15} />Edit</button><button className="btn btn-outline btn-small admin-delete" type="button" aria-label={'Delete ' + record.produce_name + ' market record'} disabled={marketSaving || marketDeletingId !== null} onClick={() => onDelete(record)}><DashboardIcon name="trash" size={15} />{marketDeletingId === record.market_price_id ? 'Deleting…' : 'Delete'}</button></div></td>
          </tr>)}</tbody>
        </table></div>}
    </Card>
  </div>;
}
