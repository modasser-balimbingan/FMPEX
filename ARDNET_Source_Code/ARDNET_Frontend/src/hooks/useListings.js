import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchListings } from '../redux/slices/listingsSlice';
import { createListing, updateListing, deleteListing, normalizeListing } from '../api/ListingsApi';
import apiClient from '../api/apiClient';

export function useListings({ mine = false } = {}) {
  const publicListings = useSelector(state => state.listings);
  const token = useSelector(state => state.auth.token);
  const [owned, setOwned] = useState({ token: null, rows: [] });
  const [loading, setLoading] = useState(mine);
  const [error, setError] = useState('');
  const active = useRef(token);
  active.current = token;
  const dispatch = useDispatch();
  const refresh = useCallback(async () => {
    if (!mine) { await dispatch(fetchListings()); return; }
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiClient.get('/api/listings/my-listings');
      if (active.current !== token) return;
      if (!response.success || !Array.isArray(response.data)) throw new Error(response.error || 'Could not load your listings.');
      setOwned({ token, rows: response.data.map(normalizeListing) });
      setError('');
    } catch (err) { if (active.current === token) setError(err.message); }
    finally { if (active.current === token) setLoading(false); }
  }, [mine, token, dispatch]);
  useEffect(() => { active.current = token; void refresh(); return () => { active.current = null; }; }, [refresh, token]);
  const add = async listing => { const row = await createListing(listing, token); await refresh(); return row; };
  const update = async (id, listing) => { const row = await updateListing(id, listing, token); await refresh(); return row; };
  const remove = async id => { await deleteListing(id, token); await refresh(); };
  return { listings: mine ? owned.token === token ? owned.rows : [] : publicListings, loading, error, refresh, add, update, remove };
}
