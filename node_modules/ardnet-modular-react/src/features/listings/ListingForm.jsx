import { useEffect, useState } from 'react';
import Button from '../../components/common/Button';
import { PHILIPPINES_PRODUCE_CATEGORIES, ZAMBOANGA_DEL_SUR_LOCATIONS } from '../../utils/constants';

const empty = { produce: '', category: 'Rice', quantity: '', unit: 'kg', location: 'Pagadian', price: '', status: 'Active' };

export default function ListingForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || empty);
  useEffect(() => setForm(initial || empty), [initial]);
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      category: form.category.toLowerCase().replace(' ', '-'),
      quantity: Number(form.quantity),
      price: form.price === '' ? null : Number(form.price),
    });
  };
  return <form className="listing-form" onSubmit={submit}>
    <label className="form-group">Produce<input className="input" name="produce" value={form.produce} onChange={change} required /></label>
    <label className="form-group">Category<select className="select" name="category" value={form.category} onChange={change}>{PHILIPPINES_PRODUCE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="form-group">Quantity<input className="input" name="quantity" type="number" min="1" value={form.quantity} onChange={change} required /></label>
    <label className="form-group">Unit<select className="select" name="unit" value={form.unit} onChange={change}><option>kg</option><option>sack</option><option>piece</option><option>bundle</option><option>crate</option></select></label>
    <label className="form-group">Location<select className="select" name="location" value={form.location} onChange={change}>{ZAMBOANGA_DEL_SUR_LOCATIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="form-group">Availability<select className="select" name="status" value={form.status} onChange={change}><option value="Active">Available</option><option value="Inactive">Unavailable</option></select></label>
    <label className="form-group">Asking price (optional)<input className="input" name="price" type="number" min="0" step="0.01" value={form.price ?? ''} onChange={change} /></label>
    <div className="form-actions"><Button variant="outline" type="button" onClick={onCancel}>Cancel</Button><Button type="submit">Save Listing</Button></div>
  </form>;
}
