import { useEffect, useState } from 'react';
import Button from '../../components/common/Button';
import { PRODUCE_CATEGORY_GROUPS, ZAMBOANGA_DEL_SUR_LOCATIONS, categorySlug } from '../../utils/constants';

const empty = { produce: '', category: 'rice', quantity: '', unit: 'kg', location: 'Pagadian', price: '', status: 'Active', image: '' };

export default function ListingForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || empty);
  const [imageError, setImageError] = useState('');
  useEffect(() => setForm(initial || empty), [initial]);
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const uploadImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Choose a JPG, PNG, WEBP, or other image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be 5 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, image: reader.result }));
      setImageError('');
    };
    reader.onerror = () => setImageError('The image could not be read. Please try another file.');
    reader.readAsDataURL(file);
  };
  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      category: categorySlug(form.category),
      quantity: Number(form.quantity),
      price: form.price === '' ? null : Number(form.price),
    });
  };
  return <form className="listing-form" onSubmit={submit}>
    <label className="form-group">Produce<input className="input" name="produce" value={form.produce} onChange={change} required /></label>
    <label className="form-group">Category<select className="select" name="category" value={form.category} onChange={change}>{PRODUCE_CATEGORY_GROUPS.map((group) => <optgroup key={group.label} label={group.label}>{group.items.map((item) => <option key={item} value={categorySlug(item)}>{item}</option>)}</optgroup>)}</select></label>
    <label className="form-group">Quantity<input className="input" name="quantity" type="number" min="1" value={form.quantity} onChange={change} required /></label>
    <label className="form-group">Unit<select className="select" name="unit" value={form.unit} onChange={change}><option>kg</option><option>sack</option><option>piece</option><option>bundle</option><option>crate</option></select></label>
    <label className="form-group">Location<select className="select" name="location" value={form.location} onChange={change}>{ZAMBOANGA_DEL_SUR_LOCATIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="form-group">Availability<select className="select" name="status" value={form.status} onChange={change}><option value="Active">Available</option><option value="Inactive">Unavailable</option></select></label>
    <label className="form-group">Asking price (optional)<input className="input" name="price" type="number" min="0" step="0.01" value={form.price ?? ''} onChange={change} /></label>
    <div className="form-group image-field">
      <span>Produce photo <small className="muted">Optional · up to 5 MB</small></span>
      <input className="input file-input" name="image" type="file" accept="image/*" onChange={uploadImage} />
      {imageError && <span className="form-message error">{imageError}</span>}
      {form.image && <div className="image-preview"><img src={form.image} alt="Selected produce preview" /><button className="text-button" type="button" onClick={() => setForm((current) => ({ ...current, image: '' }))}>Remove photo</button></div>}
    </div>
    <div className="form-actions"><Button variant="outline" type="button" onClick={onCancel}>Cancel</Button><Button type="submit">Save Listing</Button></div>
  </form>;
}
