import { createSlice } from '@reduxjs/toolkit';
import { getStorage, setStorage } from '../../utils/storage';
import { DEMO_PRODUCE } from '../../utils/constants';

const seed = DEMO_PRODUCE.map((listing, index) => ({
  ...listing,
  farmer: ['Juan Dela Cruz', 'Maria Santos', 'Abdul Rahman', 'Fatima Ali'][index % 4],
  status: 'Active',
}));

const storedListings = getStorage('ardnet.listings', null);
const initialState = storedListings
  ? [...seed.filter((sample) => !storedListings.some((listing) => listing.id === sample.id)), ...storedListings.map((listing, index) => ({
      ...listing,
      farmerEmail: listing.farmerEmail || seed[index % seed.length].farmerEmail,
      farmerContact: listing.farmerContact || seed[index % seed.length].farmerContact,
    }))]
  : seed;

function persist(state) {
  setStorage('ardnet.listings', state);
}

const listingsSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {
    addListing(state, action) {
      state.unshift({ id: Date.now(), ...action.payload, status: 'Active' });
      persist(state);
    },
    updateListing(state, action) {
      const index = state.findIndex((listing) => listing.id === action.payload.id);
      if (index >= 0) state[index] = { ...state[index], ...action.payload };
      persist(state);
    },
    deleteListing(state, action) {
      const next = state.filter((listing) => listing.id !== action.payload);
      state.splice(0, state.length, ...next);
      persist(state);
    },
    markListingSold(state, action) {
      const listing = state.find((item) => item.id === action.payload);
      if (listing) listing.status = 'Sold';
      persist(state);
    },
    toggleListingStatus(state, action) {
      const listing = state.find((item) => item.id === action.payload);
      if (listing) listing.status = listing.status === 'Active' ? 'Inactive' : 'Active';
      persist(state);
    },
    syncFarmerContact(state, action) {
      state.forEach((listing) => {
        if (listing.farmer === action.payload.farmer) {
          listing.farmerContact = action.payload.contact;
          if (action.payload.email) listing.farmerEmail = action.payload.email;
        }
      });
      persist(state);
    }
  }
});

export const {
  addListing,
  updateListing,
  deleteListing,
  markListingSold,
  toggleListingStatus,
  syncFarmerContact,
} = listingsSlice.actions;
export default listingsSlice.reducer;
