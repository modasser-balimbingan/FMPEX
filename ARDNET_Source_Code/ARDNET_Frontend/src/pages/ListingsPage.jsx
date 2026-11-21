import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation as useRouteLocation } from 'react-router-dom';
import { useListings } from '../hooks/useListings';
import { useFavorites } from '../hooks/useFavorites';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ListingFilters from '../features/listings/ListingFilters';
import ListingCard from '../features/listings/ListingCard';
import ListingDetailsModal from '../features/listings/ListingDetailsModal';
import ListingForm from '../features/listings/ListingForm';
import ListingIcon from '../features/listings/ListingIcon';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../context/AppContext';
import '../styles/listings-modern.scss';

export default function ListingsPage() {
  const routeLocation = useRouteLocation();
  const farmerOnly = routeLocation.pathname === '/dashboard/listings';
  const { listings, loading, error, refresh, add, update, remove } = useListings({ mine: farmerOnly });
  const { user } = useAuth();
  const { notify } = useApp();
  const { enabled: canFavorite, favoriteIds, loading: favoritesLoading, error: favoritesError,
    pending: favoritesPending, toggleFavorite } = useFavorites(user);
  const [inventoryStatus, setInventoryStatus] = useState('all');

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useLocalStorage('ardnet.listings.location', 'all');
  const [sort, setSort] = useState('latest');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  // Dropdown options must reflect the real backend categories and locations.
  const availableListings = useMemo(() => listings.filter((item) => (
    farmerOnly
      ? true
      : item.status === 'Active'
  )).map(item => farmerOnly ? { ...item, farmer: item.farmer || user?.name } : item), [listings, farmerOnly, user?.name]);

  const categories = useMemo(() => [...new Set(availableListings.map((item) => item.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b)), [availableListings]);
  const locations = useMemo(() => [...new Set(availableListings.map((item) => item.location).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b)), [availableListings]);

  // Earlier demo versions persisted locations not present in current DB records.
  useEffect(() => {
    if (location !== 'all' && locations.length && !locations.includes(location)) setLocation('all');
  }, [location, locations, setLocation]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = availableListings.filter((item) => (
      (!farmerOnly || inventoryStatus === 'all' || item.status === inventoryStatus) &&
      (farmerOnly || !needle || [item.produce, item.location, item.farmer].some((text) =>
        String(text || '').toLowerCase().includes(needle))) &&
      (farmerOnly || category === 'all' || item.category === category) &&
      (farmerOnly || location === 'all' || item.location === location)
    ));
    return [...result].sort((a, b) => {
      if (sort === 'price-low') return (a.price ?? Infinity) - (b.price ?? Infinity);
      if (sort === 'price-high') return (b.price ?? -Infinity) - (a.price ?? -Infinity);
      return Number(b.id) - Number(a.id);
    });
  }, [availableListings, query, category, location, sort, farmerOnly, inventoryStatus]);

  const clearFilters = () => {
    setQuery(''); setCategory('all'); setLocation('all'); setSort('latest');
  };

  const saveListing = async (listing) => {
    try {
      if (editing) {
        await update(editing.id, listing);
        notify('Listing updated successfully.', 'success');
      } else {
        await add(listing);
        notify('Listing created successfully.', 'success');
      }
      setEditing(null);
      setShowForm(false);
    } catch (error) {
      console.error('Save listing error:', error);
      notify(error.message || 'Failed to save listing.', 'error');
      throw error;
    }
  };

  const handleFavorite = async (id) => {
    try {
      const saved = await toggleFavorite(id);
      if (saved !== null) notify(saved ? 'Listing saved to favorites.' : 'Removed from favorites.', 'success');
    } catch (error) {
      notify(error.message || 'Could not update favorite.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await remove(id);
      notify('Listing deleted.', 'success');
    } catch (error) {
      console.error('Delete listing error:', error);
      notify(error.message || 'Failed to delete listing.', 'error');
    }
  };

  const changeStatus = async (listing, status) => {
    try { await update(listing.id, { status }); notify(`Listing ${status.toLowerCase()}.`); }
    catch (error) { notify(error.message || 'Could not update listing status.', 'error'); }
  };

  return (
    <div className={`page produce-marketplace${farmerOnly ? ' inventory-page' : ''}`}>
      {!farmerOnly && <ListingFilters query={query} setQuery={setQuery} category={category} setCategory={setCategory}
        location={location} setLocation={setLocation} sort={sort} setSort={setSort}
        categories={categories} locations={locations} onClear={clearFilters} />}
      <header className="produce-marketplace__hero">
        <div className="produce-marketplace__hero-copy">
          <span className="produce-marketplace__eyebrow"><ListingIcon name="leaf" size={16}/> ARDNET MARKETPLACE</span>
          <h1>{farmerOnly ? 'My produce listings' : 'Explore fresh local produce'}</h1>
          <p>{farmerOnly
            ? 'Manage your farm listings, photos, quantities, and prices in one place.'
            : 'Discover produce offered by local farmers. Browse real listings and explore every detail.'}</p>
          <div className="produce-marketplace__summary">
            <span><strong>{availableListings.length}</strong> {farmerOnly ? 'your listings' : 'available listings'}</span>
            <span className="produce-marketplace__summary-divider" aria-hidden="true" />
            <span><strong>{categories.length}</strong> categories</span>
          </div>
        </div>
        <div className="produce-marketplace__hero-actions">
          {farmerOnly ? (
            <button className="produce-marketplace__create" type="button" onClick={() => {
              setEditing(null); setShowForm(true);
            }}>+ Create listing</button>
          ) : user?.role === 'farmer' ? (
            <Link className="produce-marketplace__create" to="/dashboard">My dashboard <ListingIcon name="arrowRight" size={17}/></Link>
          ) : null}
        </div>
      </header>

      {farmerOnly && showForm && (
        <div className="card listing-editor">
          <div className="workspace-section-title"><span className="workspace-icon"><ListingIcon name="leaf" size={23} /></span><div><p className="member-kicker">FROM YOUR FARM TO THE MARKET</p><h2>{editing ? 'Edit your produce' : 'Create a fresh listing'}</h2><p>Give buyers a clear picture of what you have to offer.</p></div></div>
          <ListingForm initial={editing || undefined} onSubmit={saveListing} onCancel={() => {
            setEditing(null); setShowForm(false);
          }} />
        </div>
      )}

      <section className="produce-marketplace__browse" aria-label="Browse produce">
        {farmerOnly && <><div className="inventory-summary">{['Active', 'Inactive', 'Sold'].map(status => <div key={status}><span>{status === 'Active' ? 'Available to buyers' : status === 'Inactive' ? 'Currently unavailable' : 'Marked as sold'}</span><strong>{availableListings.filter(row => row.status === status).length}</strong></div>)}</div><div className="workspace-tabs" aria-label="Filter inventory status">{['all', 'Active', 'Inactive', 'Sold'].map(status => <button type="button" key={status} aria-pressed={inventoryStatus === status} onClick={() => setInventoryStatus(status)}>{status === 'all' ? 'All listings' : status}</button>)}</div>{error && <p className="form-message error" role="alert">{error} <button type="button" onClick={refresh}>Try again</button></p>}{loading && <p role="status" className="muted">Loading your inventory…</p>}</>}
        <div className="produce-marketplace__section-heading">
          <div>
            <span className="produce-marketplace__section-overline">BROWSE LISTINGS</span>
            <h2>{farmerOnly ? 'Your inventory' : 'Available on the market'}</h2>
          </div>
          <span className="produce-marketplace__result-count">Showing {filtered.length} of {availableListings.length}</span>
        </div>
        {canFavorite && favoritesError && (
          <p className="produce-favorites__feedback" role="alert">Favorites could not load: {favoritesError}</p>
        )}

        {filtered.length ? (
          <div className="produce-marketplace__grid">
            {filtered.map((listing) => (
              <ListingCard key={listing.id} listing={listing}
                canManage={farmerOnly && user?.role === 'farmer'}
                onViewDetails={setSelectedListing}
                canFavorite={canFavorite}
                isFavorite={favoriteIds.has(Number(listing.id))}
                favoriteBusy={favoritesLoading || Boolean(favoritesError) || favoritesPending.includes(Number(listing.id))}
                onFavorite={handleFavorite}
                onEdit={(item) => { setEditing({ ...item }); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                onSold={() => void changeStatus(listing, 'Sold')}
                onDelete={handleDelete}
                onToggle={() => void changeStatus(listing, listing.status === 'Active' ? 'Inactive' : 'Active')} />
            ))}
          </div>
        ) : (
          <div className="produce-marketplace__empty" role="status">
            <span><ListingIcon name="search" size={29}/></span>
            <h3>{farmerOnly ? availableListings.length ? 'No listings in this view' : 'Your harvest starts here' : 'No matching listings found'}</h3>
            <p>{farmerOnly ? availableListings.length ? 'Choose another status to view more of your inventory.' : 'Create your first listing to share your produce with local buyers.' : 'Try a different produce name, category, or location.'}</p>
            {farmerOnly ? availableListings.length > 0 && <button type="button" onClick={() => setInventoryStatus('all')}>Show all listings</button> : <button type="button" onClick={clearFilters}>Clear filters</button>}
          </div>
        )}
      </section>

      {selectedListing && (
        <ListingDetailsModal key={selectedListing.id} listing={selectedListing} onClose={() => setSelectedListing(null)}
          canFavorite={canFavorite} isFavorite={favoriteIds.has(Number(selectedListing.id))}
          favoriteBusy={favoritesLoading || Boolean(favoritesError) || favoritesPending.includes(Number(selectedListing.id))}
          onFavorite={handleFavorite} />
      )}
    </div>
  );
}
