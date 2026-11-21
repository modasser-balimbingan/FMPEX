import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { peso } from '../../utils/format';
import ListingIcon from './ListingIcon';
import ListingPhotoGallery from './ListingPhotoGallery';
import ListingDiscussion from './ListingDiscussion';

/** Uses native <dialog> for accessible focus management and Escape-to-close. */
export default function ListingDetailsModal({
  listing, onClose, canFavorite = false, isFavorite = false,
  favoriteBusy = false, onFavorite,
}) {
  const dialogRef = useRef(null);
  const returnFocus = useRef(null);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // React StrictMode re-runs effects during development. Calling close() in
    // the cleanup queues a native "close" event, which may arrive after the
    // next showModal() and incorrectly dismiss the freshly opened dialog.
    // Removing the element dismisses it; avoid calling close() during cleanup.
    if (!returnFocus.current) returnFocus.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!dialog.open) dialog.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => { if (!dialog.isConnected && returnFocus.current?.isConnected) returnFocus.current.focus(); });
    };
  }, []);

  const description = listing.description || listing.details;
  const quantity = listing.quantity != null && Number.isFinite(Number(listing.quantity))
    ? Number(listing.quantity).toLocaleString('en-PH', { maximumFractionDigits: 2 }) : '—';
  function showDiscussion() {
    const heading = dialogRef.current?.querySelector('#produce-discussion-title');
    heading?.focus({ preventScroll: true });
    heading?.closest('.produce-discussion')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  return (
    <dialog ref={dialogRef} className="produce-detail-dialog" onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      aria-label={`${listing.produce || 'Produce'} listing details`}>
      <header className="produce-detail__toolbar"><span><ListingIcon name="leaf" size={18} /> Produce details</span>
        <button autoFocus className="produce-detail__close" type="button" onClick={onClose} aria-label="Close listing details">
          <ListingIcon name="close" size={20}/>
        </button>
      </header>
      <div className="produce-detail__scroll" tabIndex={0} role="region" aria-label="Produce information and discussion">
      <div className="produce-detail">
        <div className="produce-detail__gallery">
          <ListingPhotoGallery photos={listing.photos} produce={listing.produce} variant="detail" />
        </div>
        <section className="produce-detail__content">
          <span className="produce-detail__eyebrow"><ListingIcon name="leaf" size={15}/>{listing.category || 'Farm produce'}</span>
          <h2>{listing.produce || 'Produce listing'}</h2>
          <div className="produce-detail__actions">
          <span className={`produce-detail__status ${String(listing.status).toLowerCase() === 'active' ? 'is-active' : ''}`}>
            <span className="produce-card__status-dot" />{listing.status || 'Unknown'} listing
          </span>
          {canFavorite && (
            <button type="button" className={`produce-favorite-btn produce-favorite-btn--detail ${isFavorite ? 'is-saved' : ''}`}
              aria-label={isFavorite ? `Remove ${listing.produce} from favorites` : `Save ${listing.produce} to favorites`}
              aria-pressed={isFavorite} disabled={favoriteBusy}
              onClick={() => onFavorite?.(listing.id)}>
              <ListingIcon name="heart" filled={isFavorite} size={19}/>
              {isFavorite ? 'Saved' : 'Save listing'}
            </button>
          )}
          </div>
          <div className="produce-detail__price">
            <span>Asking price</span>
            <strong>{listing.price == null ? 'Price on request' : peso(listing.price)}
              {listing.price != null && listing.unit && <small> / {listing.unit}</small>}
            </strong>
          </div>
          <div className="produce-detail__facts">
            <div><ListingIcon name="package" size={20}/><span><small>Available quantity</small><strong>{quantity} {listing.unit || ''}</strong></span></div>
            <div><ListingIcon name="pin" size={20}/><span><small>Location</small><strong>{listing.location || 'Not specified'}</strong></span></div>
            <div><ListingIcon name="user" size={20}/><span><small>Posted by</small><strong>{listing.farmer || 'Farmer'}</strong></span></div>
          </div>
          {description && <div className="produce-detail__description"><h3>About this produce</h3><p>{description}</p></div>}
          <button type="button" className="produce-detail__discussion-link" onClick={showDiscussion}>
            <ListingIcon name="message" size={17} /> Questions &amp; replies <ListingIcon name="arrowRight" size={16} />
          </button>
        </section>
      </div>
      <ListingDiscussion listingId={listing.id} listingStatus={listing.status} user={user} />
      </div>
    </dialog>
  );
}
