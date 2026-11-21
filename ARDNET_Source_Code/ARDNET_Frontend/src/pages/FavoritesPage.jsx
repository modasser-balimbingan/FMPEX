import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFavorites } from '../hooks/useFavorites';
import { useApp } from '../context/AppContext';
import ListingCard from '../features/listings/ListingCard';
import ListingDetailsModal from '../features/listings/ListingDetailsModal';
import ListingIcon from '../features/listings/ListingIcon';
import ListingFilters from '../features/listings/ListingFilters';
import '../styles/listings-modern.scss';

export default function FavoritesPage() {
  const { user } = useAuth();
  const { notify } = useApp();
  const { favorites, favoriteIds, enabled, loading, error, pending, toggleFavorite } = useFavorites(user);
  const [selectedListing, setSelectedListing] = useState(null);
  const browsePath = user?.role === 'farmer' ? '/dashboard/produce' : '/buyer/listings';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('all');
  const [sort, setSort] = useState('latest');
  const categories = useMemo(() => [...new Set(favorites.map(row => row.category).filter(Boolean))].sort(), [favorites]);
  const locations = useMemo(() => [...new Set(favorites.map(row => row.location).filter(Boolean))].sort(), [favorites]);
  const filtered = useMemo(() => favorites.filter(row =>
    (!query.trim() || [row.produce, row.farmer, row.location, row.description].some(value => String(value || '').toLowerCase().includes(query.trim().toLowerCase()))) &&
    (category === 'all' || row.category === category) && (location === 'all' || row.location === location))
    .sort((a, b) => sort === 'price-low' ? (a.price ?? Infinity) - (b.price ?? Infinity) : sort === 'price-high' ? (b.price ?? -Infinity) - (a.price ?? -Infinity) : new Date(b.favorited_at || 0) - new Date(a.favorited_at || 0)), [favorites, query, category, location, sort]);
  const clear = () => { setQuery(''); setCategory('all'); setLocation('all'); setSort('latest'); };

  async function handleFavorite(id) {
    try {
      const saved = await toggleFavorite(id);
      if (saved !== null) notify(saved ? 'Listing saved to favorites.' : 'Removed from favorites.', 'success');
      if (!saved) setSelectedListing(null);
    } catch (err) {
      notify(err.message || 'Unable to update favorites.', 'error');
    }
  }

  return (
    <div className="page produce-marketplace">
      <ListingFilters query={query} setQuery={setQuery} category={category} setCategory={setCategory} location={location} setLocation={setLocation} sort={sort} setSort={setSort} categories={categories} locations={locations} onClear={clear} />
      <header className="produce-marketplace__hero produce-marketplace__hero--favorites">
        <div className="produce-marketplace__hero-copy">
          <span className="produce-marketplace__eyebrow"><ListingIcon name="heart" size={16} /> SAVED PRODUCE</span>
          <h1>My favorites</h1>
          <p>Keep interesting produce listings in one place and revisit them whenever you like.</p>
          <div className="produce-marketplace__summary"><span><strong>{favorites.length}</strong> saved listings</span></div>
        </div>
        <div className="produce-marketplace__hero-actions">
          <Link to={browsePath} className="produce-marketplace__create">Browse produce <ListingIcon name="arrowRight" size={17}/></Link>
        </div>
      </header>
      <section className="produce-marketplace__browse" aria-label="Favorite produce listings">
        <div className="produce-marketplace__section-heading"><div>
          <span className="produce-marketplace__section-overline">YOUR COLLECTION</span>
          <h2>Saved listings</h2>
        </div></div>
        {!enabled ? (
          <p role="status">Sign in as a Farmer or Buyer/Vendor to save listings.</p>
        ) : loading ? (
          <p role="status" className="produce-favorites__feedback">Loading saved produce...</p>
        ) : error ? (
          <p role="alert" className="produce-favorites__feedback">{error}</p>
        ) : filtered.length ? (
          <div className="produce-marketplace__grid">
            {filtered.map((listing) => (
              <ListingCard key={listing.id} listing={listing} canManage={false}
                onViewDetails={setSelectedListing}
                canFavorite={enabled} isFavorite={favoriteIds.has(listing.id)}
                favoriteBusy={pending.includes(listing.id)}
                onFavorite={handleFavorite} />
            ))}
          </div>
        ) : (
          <div className="produce-marketplace__empty" role="status">
            <span><ListingIcon name="heart" size={29}/></span>
            <h3>{favorites.length ? 'No matching favorites' : 'No favorites yet'}</h3>
            <p>{favorites.length ? 'Try another produce name, category, or location.' : "Browse available listings and tap the heart to save produce you’re interested in."}</p>
            {favorites.length > 0 && <button type="button" onClick={clear}>Clear filters</button>}
            <Link to={browsePath} className="produce-card__view">Browse produce</Link>
          </div>
        )}
      </section>
      {selectedListing && (
        <ListingDetailsModal key={selectedListing.id} listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          canFavorite={enabled} isFavorite={favoriteIds.has(selectedListing.id)}
          favoriteBusy={pending.includes(selectedListing.id)} onFavorite={handleFavorite} />
      )}
    </div>
  );
}
