import { useEffect, useMemo, useRef, useState } from 'react';
import { favoritesService } from '../api/services/favoritesService';

function normalizeFavorite(item) {
  return {
    ...item,
    id: Number(item.listing_id),
    produce: item.produce_name,
    category: item.category_name,
    price: item.asking_price == null ? null : Number(item.asking_price),
    quantity: Number(item.quantity),
    farmer: item.farmer_name,
    photos: item.photos || [],
  };
}

/** Favorites are account-scoped on the server, never stored in shared localStorage. */
export function useFavorites(user) {
  const role = String(user?.role || '').toLowerCase();
  const userId = user?.id ?? user?.user_id ?? null;
  const enabled = Boolean(userId) && (role === 'farmer' || role === 'buyer');
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const [pending, setPending] = useState([]);
  const inFlight = useRef(new Set());

  useEffect(() => {
    let active = true;
    // Reset immediately when the authenticated account changes.
    setFavorites([]);
    setError('');
    if (!enabled) { setLoading(false); return () => { active = false; }; }
    setLoading(true);
    favoritesService.getFavorites().then((response) => {
      if (!active) return;
      if (!response.success || !Array.isArray(response.data)) {
        setError(response.error || 'Could not load favorites.');
      } else {
        setFavorites(response.data.map(normalizeFavorite));
      }
    }).catch((err) => {
      if (active) setError(err.message || 'Could not load favorites.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [enabled, userId]);

  const favoriteIds = useMemo(() => new Set(favorites.map((item) => Number(item.id))), [favorites]);

  async function toggleFavorite(id) {
    const listingId = Number(id);
    if (!enabled) throw new Error('Sign in as a Farmer or Buyer/Vendor to save listings.');
    if (!Number.isSafeInteger(listingId) || listingId <= 0) throw new Error('Invalid listing ID.');
    if (loading || error) throw new Error('Favorites are unavailable. Please refresh the page.');
    if (inFlight.current.has(listingId)) return null;

    const saving = !favoriteIds.has(listingId);
    inFlight.current.add(listingId);
    setPending((previous) => [...previous, listingId]);
    try {
      const response = saving
        ? await favoritesService.addFavorite(listingId)
        : await favoritesService.removeFavorite(listingId);
      if (!response.success) throw new Error(response.error || 'Could not update favorite.');
      if (saving) {
        // Re-fetch to obtain the real listing/photos for the Favorites page.
        const updated = await favoritesService.getFavorites();
        if (!updated.success || !Array.isArray(updated.data)) {
          throw new Error(updated.error || 'Saved, but could not refresh favorites.');
        }
        setFavorites(updated.data.map(normalizeFavorite));
      } else {
        setFavorites((previous) => previous.filter((item) => Number(item.id) !== listingId));
      }
      return saving;
    } finally {
      inFlight.current.delete(listingId);
      setPending((previous) => previous.filter((value) => value !== listingId));
    }
  }

  return {
    enabled, favorites, favoriteIds, loading, error, pending,
    toggleFavorite,
  };
}
