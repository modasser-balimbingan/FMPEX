
const API_BASE_URL = 'http://localhost:5000';

export async function getCategories() {
  const response = await fetch(`${API_BASE_URL}/api/categories`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch categories');
  }

  return data;
}

export async function getListings() {
  const response = await fetch(`${API_BASE_URL}/api/listings`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch listings');
  }

  return data.map(normalizeListing);
}

// Normalize the listing data to a consistent format for the frontend.
export function normalizeListing(item) {
  return {
    ...item,
    id: item.id ?? item.listing_id,
    produce: item.produce ?? item.produce_name,
    category: item.category ?? item.category_name,
    price: item.price ?? item.asking_price,
    farmer: item.farmer ?? item.farmer_name,
    userId: item.userId ?? item.user_id,
    createdAt: item.createdAt ?? item.created_at,
    photos: Array.isArray(item.photos) ? item.photos : [],
  };
}

// Convert listing fields and photo files into multipart FormData.
function createListingFormData(listing) {
  const formData = new FormData();

  Object.entries(listing).forEach(([key, value]) => {
    // Upload actual File objects separately.
    if (key === 'photos') {
      return;
    }

    // Don't send nested objects or undefined values as strings.
    if (value === undefined || value === null) {
      return;
    }

    if (typeof value === 'object') {
      return;
    }

    formData.append(key, String(value));
  });

  // Append each selected image as a separate "photos" field.
  (listing.photos || []).forEach((photo) => {
    if (photo instanceof File) {
      formData.append('photos', photo);
    }
  });

  return formData;
}

export async function createListing(listing, token) {
  const response = await fetch(`${API_BASE_URL}/api/listings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: createListingFormData(listing),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create listing');
  }

  return normalizeListing(data.listing);
}

export async function updateListing(id, listing, token) {
  const response = await fetch(`${API_BASE_URL}/api/listings/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: createListingFormData(listing),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update listing');
  }

  return normalizeListing(data.listing);
}

export async function deleteListing(id, token) {
  const response = await fetch(`${API_BASE_URL}/api/listings/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete listing');
  }

  return data;
}
