import { useEffect, useMemo, useState } from 'react';
import { ZAMBOANGA_DEL_SUR_LOCATIONS } from '../../utils/constants';
import { getCategories } from '../../api/ListingsApi';
import { getListingPhotoUrl } from './photoUtils';
import ListingIcon from './ListingIcon';

const empty = { produce: '', category: '', description: '', quantity: '', unit: 'kg', location: 'Pagadian', price: '', status: 'Active' };

export default function ListingForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => ({ ...empty, ...initial }));
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const saved = useMemo(() => (initial?.photos || []).map(photo => ({ url: getListingPhotoUrl(photo), name: photo.original_name || 'Saved produce photo' })).filter(photo => photo.url), [initial]);
  useEffect(() => { setForm({ ...empty, ...initial }); setPhotos([]); setError(''); }, [initial]);
  useEffect(() => {
    let live = true;
    getCategories().then(rows => {
      if (!live) return;
      setCategories(rows);
      setForm(value => ({ ...value, category: value.category || rows.find(row => String(row.category_id) === String(value.category_id))?.category_name || rows[0]?.category_name || '' }));
    }).catch(() => { if (live) setError('Unable to load categories. Please reopen the form to try again.'); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);
  useEffect(() => { const entries = photos.map(file => ({ url: URL.createObjectURL(file), name: file.name })); setPreviews(entries); return () => entries.forEach(photo => URL.revokeObjectURL(photo.url)); }, [photos]);
  function change(event) { setForm(value => ({ ...value, [event.target.name]: event.target.value })); }
  function choosePhotos(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) { setError('Choose JPG, PNG, or WebP photos.'); return; }
    if (files.some(file => file.size > 5 * 1024 * 1024)) { setError('Each photo must be 5 MB or smaller.'); return; }
    if (saved.length + photos.length + files.length > 5) { setError('A listing can have up to 5 photos.'); return; }
    setError(''); setPhotos(value => [...value, ...files]);
  }
  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    const category = categories.find(row => row.category_name === form.category);
    if (!category) { setError('Choose an available produce category.'); return; }
    setSaving(true); setError('');
    try { await onSubmit({ category_id: category.category_id, produce_name: form.produce.trim(), description: String(form.description || '').trim(), quantity: Number(form.quantity), unit: form.unit, location: form.location.trim(), asking_price: form.price === '' || form.price == null ? '' : Number(form.price), status: form.status, photos }); }
    catch (err) { setError(err.message || 'Unable to save your listing.'); }
    finally { setSaving(false); }
  }
  return <form className="listing-form workspace-form" onSubmit={submit}>
    <div className="workspace-form__section"><span>01</span><div><h3>The produce</h3><p>Help buyers understand what makes your produce worth a closer look.</p></div></div>
    <label className="form-group">Produce name<input className="input" name="produce" value={form.produce} onChange={change} maxLength={100} placeholder="e.g. Fresh carabao mangoes" required /></label>
    <label className="form-group">Category<select className="select" name="category" value={form.category} onChange={change} disabled={loading} required><option value="">{loading ? 'Loading categories…' : 'Choose a category'}</option>{categories.map(row => <option key={row.category_id} value={row.category_name}>{row.category_name}</option>)}</select></label>
    <label className="form-group listing-form__description">Produce description <span className="workspace-field-hint">Variety, freshness, harvest details, or pickup information.</span><textarea className="input" name="description" value={form.description || ''} onChange={change} maxLength={2000} rows={4} placeholder="Tell buyers a little more about your produce…" /><small>{(form.description || '').length}/2,000 characters</small></label>
    <div className="workspace-form__section"><span>02</span><div><h3>Availability & price</h3><p>Your quantity, your location, your asking price.</p></div></div>
    <label className="form-group">Quantity<input className="input" type="number" name="quantity" min="0.01" step="any" value={form.quantity} onChange={change} placeholder="50" required /></label>
    <label className="form-group">Unit<select className="select" name="unit" value={form.unit} onChange={change}>{['kg', 'sack', 'piece', 'bundle', 'crate', 'liter'].map(unit => <option key={unit}>{unit}</option>)}</select></label>
    <label className="form-group">Location<select className="select" name="location" value={form.location} onChange={change}>{[...new Set([form.location, ...ZAMBOANGA_DEL_SUR_LOCATIONS])].filter(Boolean).map(location => <option key={location}>{location}</option>)}</select></label>
    <label className="form-group">Availability<select className="select" name="status" value={form.status} onChange={change}><option value="Active">Available</option><option value="Inactive">Unavailable</option>{initial && <option value="Sold">Sold</option>}</select></label>
    <label className="form-group">Asking price (₱ per {form.unit})<input className="input" name="price" type="number" min="0.01" step="0.01" value={form.price ?? ''} onChange={change} placeholder="Optional · leave blank for price on request" /></label>
    <div className="workspace-form__section"><span>03</span><div><h3>A picture of your harvest</h3><p>Add up to 5 photos. JPG, PNG, or WebP, up to 5 MB each.</p></div></div>
    <label className="listing-photo-upload"><ListingIcon name="camera" size={28} /><strong>Choose produce photos</strong><span>Clear photos help buyers explore your listing.</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={choosePhotos} disabled={saving} /></label>
    {(saved.length > 0 || previews.length > 0) && <div className="listing-photo-previews">{saved.map((photo, index) => <figure key={`saved-${index}`}><img src={photo.url} alt={photo.name} /><figcaption>Saved photo</figcaption></figure>)}{previews.map((photo, index) => <figure key={photo.url}><img src={photo.url} alt={photo.name} /><button type="button" aria-label={`Remove ${photo.name}`} onClick={() => setPhotos(value => value.filter((_, i) => i !== index))}>Remove</button></figure>)}</div>}
    {error && <p className="form-message error" role="alert">{error}</p>}
    <div className="form-actions"><span className="workspace-field-hint">Your description and photos will appear in listing details.</span><button className="member-button member-button--outline" type="button" onClick={onCancel} disabled={saving}>Cancel</button><button className="member-button" type="submit" disabled={saving || loading}>{saving ? 'Saving your listing…' : initial ? 'Save changes' : 'Publish listing'}</button></div>
  </form>;
}
