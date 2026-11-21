import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import listingsReducer from './slices/listingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    listings: listingsReducer
  }
});
