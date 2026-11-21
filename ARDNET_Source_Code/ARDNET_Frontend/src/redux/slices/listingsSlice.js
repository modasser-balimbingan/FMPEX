
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const API_BASE_URL = 'http://localhost:5000';

// Fetch real listings from the backend
export const fetchListings = createAsyncThunk(
  'listings/fetchListings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/listings`);

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          data.error || 'Failed to fetch listings'
        );
      }

      return data.map((listing) => ({
        id: listing.listing_id,
        category: listing.category_name,
        produce: listing.produce_name,
        quantity: Number(listing.quantity),
        unit: listing.unit,
        price:
          listing.asking_price === null
            ? null
            : Number(listing.asking_price),
        location: listing.location,
        description: listing.description,
        createdAt: listing.created_at,
        userId: listing.user_id,
        status: listing.status,
        farmer: listing.farmer_name,
        // Preserve the photos returned by the backend.
        photos: listing.photos || [],
      }));
    } catch (error) {
      return rejectWithValue(
        error.message || 'Unable to connect to the backend'
      );
    }
  }
);

const initialState = [];

const listingsSlice = createSlice({
  name: 'listings',
  initialState,

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchListings.fulfilled, (state, action) => {
        return action.payload;
      })

      .addCase(fetchListings.rejected, (state, action) => {
        console.error(
          'Failed to fetch listings:',
          action.payload || action.error.message
        );
      });
  },
});

export default listingsSlice.reducer;
