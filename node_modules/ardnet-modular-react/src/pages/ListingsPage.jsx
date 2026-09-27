import { useMemo, useState } from 'react';
import { useLocation as useRouteLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useListings } from '../hooks/useListings';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ListingFilters from '../features/listings/ListingFilters';
import ListingCard from '../features/listings/ListingCard';
import ListingForm from '../features/listings/ListingForm';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../context/AppContext';

export default function ListingsPage() {
  const { listings, add, update, remove, markSold, toggleStatus } = useListings();
  const { user } = useAuth();
  const { notify } = useApp();
  const routeLocation = useRouteLocation();
  const farmerOnly = routeLocation.pathname === '/dashboard/listings';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useLocalStorage('ardnet.listings.location', 'all');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(
    () => listings.filter(
    (item) => (farmerOnly ? item.farmer === user?.name && item.status !== 'Sold' : item.status === 'Active')
        && (query === '' || item.produce.toLowerCase().includes(query.toLowerCase()))
        && (category === 'all' || item.category === category)
        && (location === 'all' || item.location === location),
    ),
    [listings, query, category, location, farmerOnly, user?.name],
  );

  const saveListing = (listing) => {
    if (editing) update({ ...listing, id: editing.id });
    else add({ ...listing, farmer: user.name, farmerEmail: user.email, farmerContact: user.contact || 'Not provided' });
    setEditing(null);
    setShowForm(false);
    notify(editing ? 'Listing updated successfully.' : 'Listing created successfully.', 'success');
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">PUBLIC PRODUCE MARKET</p>
          <h1>{farmerOnly ? 'My produce listings' : 'Available produce'}</h1>
          <p className="muted">
            Guests and buyers/vendors can browse active listings.
            Farmers manage only their own records.
          </p>
        </div>

        {farmerOnly ? (
          <button className="btn btn-primary" type="button" onClick={() => { setEditing(null); setShowForm(true); }}>Create listing</button>
        ) : user?.role === 'farmer' && (
          <Link className="btn btn-primary" to="/dashboard">
            My dashboard
          </Link>
        )}
      </div>

      <ListingFilters
        query={query}
        setQuery={setQuery}
        category={category}
        setCategory={setCategory}
        location={location}
        setLocation={setLocation}
      />

      {farmerOnly && showForm && <div className="card listing-editor"><h2>{editing ? 'Edit produce listing' : 'Create produce listing'}</h2><ListingForm initial={editing || undefined} onSubmit={saveListing} onCancel={() => { setEditing(null); setShowForm(false); }} /></div>}

      {filtered.length > 0 ? (
        <div className="grid grid-3">
          {filtered.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              canManage={farmerOnly && user?.role === 'farmer' && user?.name === listing.farmer}
              onEdit={(item) => { setEditing({ ...item, category: item.produce }); setShowForm(true); }}
              onSold={(id) => { markSold(id); notify('Listing marked as sold.', 'success'); }}
              onDelete={(id) => { remove(id); notify('Listing deleted.', 'success'); }}
              onToggle={(id) => { toggleStatus(id); notify('Listing status updated.', 'success'); }}
            />
          ))}
        </div>
      ) : (
        <div className="card empty-state" role="status">
          <h2>No active listings found</h2>
          <p className="muted">Try changing your search or filters.</p>
        </div>
      )}
    </div>
  );
}
