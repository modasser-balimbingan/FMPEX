import { peso } from '../../utils/format';
import ListingIcon from './ListingIcon';
import ListingPhotoGallery from './ListingPhotoGallery';

export default function ListingCard({
  listing,
  canManage,
  onViewDetails,
  onEdit,
  onSold,
  onDelete,
  onToggle,
  canFavorite = false,
  isFavorite = false,
  favoriteBusy = false,
  onFavorite,
}) {
  const active = String(listing.status).toLowerCase() === 'active';
  const status = listing.status || 'Unknown';
  const quantity = listing.quantity != null && Number.isFinite(Number(listing.quantity)) ? Number(listing.quantity).toLocaleString('en-PH', { maximumFractionDigits: 2 }) : '—';

  return (
    <article className="produce-card">
      <div className="produce-card__media">
        <ListingPhotoGallery photos={listing.photos} produce={listing.produce} onOpen={() => onViewDetails(listing)} />
        {canFavorite && (
          <button type="button" className={`produce-favorite-btn produce-favorite-btn--card ${isFavorite ? 'is-saved' : ''}`}
            aria-label={isFavorite ? `Remove ${listing.produce} from favorites` : `Save ${listing.produce} to favorites`}
            aria-pressed={isFavorite} title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            disabled={favoriteBusy} onClick={() => onFavorite?.(listing.id)}>
            <ListingIcon name="heart" filled={isFavorite} size={19}/>
          </button>
        )}
        <span className={`produce-card__status ${active ? 'is-active' : ''}`}>
          <span className="produce-card__status-dot" />{status}
        </span>
      </div>

      <div className="produce-card__content">
        <span className="produce-card__category"><ListingIcon name="leaf" size={14}/>{listing.category || 'Farm produce'}</span>
        <h3 className="produce-card__title">{listing.produce || 'Untitled produce'}</h3>
        {listing.description && <p className="produce-card__description">{listing.description}</p>}
        <div className="produce-card__meta">
          <span><ListingIcon name="pin" size={16}/>{listing.location || 'Location unavailable'}</span>
          <span><ListingIcon name="package" size={16}/>{quantity} {listing.unit || ''} available</span>
          <span><ListingIcon name="user" size={16}/>{listing.farmer || 'Farmer'}</span>
        </div>
        <div className="produce-card__foot">
          <div>
            <span className="produce-card__price-label">Asking price</span>
            <div className="produce-card__price">
              {listing.price == null ? 'Price on request' : peso(listing.price)}
              {listing.price != null && listing.unit && <span> / {listing.unit}</span>}
            </div>
          </div>
          <button type="button" className="produce-card__view" onClick={() => onViewDetails(listing)}>
            View details <ListingIcon name="arrowRight" size={17} />
          </button>
        </div>
        {canManage && (
          <div className="produce-card__manage" aria-label={`Manage ${listing.produce}`}>
            <button type="button" onClick={() => onEdit(listing)}><ListingIcon name="edit" size={15}/> Edit</button>
            <button type="button" onClick={() => onToggle(listing.id)}>{active ? 'Deactivate' : 'Activate'}</button>
            <button type="button" disabled={status === 'Sold'} onClick={() => onSold(listing.id)}><ListingIcon name="check" size={15}/>Mark sold</button>
            <button type="button" className="is-danger" onClick={() => onDelete(listing.id)}>
              <ListingIcon name="trash" size={15}/> Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
