import apiClient from '../apiClient';

// All requests use the JWT from this browser tab's sessionStorage.
export const favoritesService = {
  getFavorites() { return apiClient.get('/api/favorites'); },
  addFavorite(listingId) { return apiClient.post(`/api/listings/${listingId}/favorite`, {}); },
  removeFavorite(listingId) { return apiClient.delete(`/api/listings/${listingId}/favorite`); },
};

export default favoritesService;
