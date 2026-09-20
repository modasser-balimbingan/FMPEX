import { useState } from 'react';
import { Check, Eye, Image, Mail, MapPin, Package, Pencil, Phone, Power, Trash2 } from 'lucide-react';
import { peso } from '../../utils/format';
import Button from '../../components/common/Button';
import { categoryLabel } from '../../utils/constants';

export default function ListingCard({ listing, canManage, onEdit, onSold, onDelete, onToggle }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = `listing-details-${listing.id}`;

  return (
    <article className="listing-card card">
      <div className="listing-image">
        {listing.image
          ? <img src={listing.image} alt={`${listing.produce} produce`} />
          : <div className="listing-image-placeholder"><Image size={28} aria-hidden="true" /><span>No photo added</span></div>}
      </div>
      <div className="listing-top">
        <span className="listing-category">{categoryLabel(listing.category)}</span>
        <span className={`listing-status ${listing.status === 'Active' ? 'status-online' : 'status-warning'}`}>
          ● {listing.status}
        </span>
      </div>
      <h3>{listing.produce}</h3>
      <div className="listing-meta">
        <span><Package size={14} aria-hidden="true" /> {listing.quantity} {listing.unit}</span>
        <span><MapPin size={14} aria-hidden="true" /> {listing.location}</span>
        <span>Farmer: {listing.farmer}</span>
      </div>
      <div className="listing-price">
        {listing.price == null ? 'Price on request' : `${peso(listing.price)} / ${listing.unit}`}
      </div>
      <div className="listing-contact">
        {listing.farmerEmail && <a href={`mailto:${listing.farmerEmail}`}><Mail size={14} aria-hidden="true" /> {listing.farmerEmail}</a>}
        {listing.farmerContact
          ? <a href={`tel:${listing.farmerContact}`}><Phone size={14} aria-hidden="true" /> {listing.farmerContact}</a>
          : <span className="muted">Contact number unavailable</span>}
      </div>
      <div className="listing-actions">
        {!canManage && (
          <Button
            variant="outline"
            className="btn-small"
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            aria-expanded={detailsOpen}
            aria-controls={detailsId}
          >
            <Eye size={15} aria-hidden="true" /> {detailsOpen ? 'Hide details' : 'View details'}
          </Button>
        )}
        {canManage && <>
          <Button variant="outline" className="btn-small" onClick={() => onEdit(listing)}>
            <Pencil size={15} aria-hidden="true" /> Edit
          </Button>
          <Button variant="outline" className="btn-small" onClick={() => onToggle(listing.id)}>
            <Power size={15} aria-hidden="true" /> {listing.status === 'Active' ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="outline" className="btn-small" onClick={() => onSold(listing.id)}>
            <Check size={15} aria-hidden="true" /> Mark sold
          </Button>
          <Button variant="danger" className="btn-small" onClick={() => onDelete(listing.id)}>
            <Trash2 size={15} aria-hidden="true" /> Delete
          </Button>
        </>}
      </div>
      {detailsOpen && (
        <div className="listing-details" id={detailsId} role="region" aria-label={`${listing.produce} listing details`}>
          <span><strong>Available quantity:</strong> {listing.quantity} {listing.unit}</span>
          <span><strong>Location:</strong> {listing.location}</span>
          <span><strong>Seller:</strong> {listing.farmer}</span>
        </div>
      )}
    </article>
  );
}
