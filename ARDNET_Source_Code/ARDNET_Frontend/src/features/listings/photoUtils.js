// Resolve the photo paths already returned by ARDNET's listings API.
// The browser must request uploaded files from Express, not Vite (port 5173).
const API_BASE_URL = 'http://localhost:5000';

export function getListingPhotoUrl(photo) {
  const value = typeof photo === 'string'
    ? photo
    : photo?.photo_url ?? photo?.file_path ?? photo?.photo_path ?? photo?.image_url ?? photo?.url;

  if (typeof value !== 'string' || !value.trim()) return '';

  const path = value.trim().replace(/\\/g, '/');

  // Only render HTTP(S) URLs supplied by the server.
  if (/^https?:\/\//i.test(path)) return path;
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//')) return '';

  if (path.startsWith('/uploads/')) return `${API_BASE_URL}${path}`;
  if (path.startsWith('uploads/')) return `${API_BASE_URL}/${path}`;
  if (path.startsWith('/produce/')) return `${API_BASE_URL}/uploads${path}`;
  if (path.startsWith('produce/')) return `${API_BASE_URL}/uploads/${path}`;

  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function getListingPhotoUrls(photos) {
  if (!Array.isArray(photos)) return [];
  return [...new Set(photos.map(getListingPhotoUrl).filter(Boolean))];
}
