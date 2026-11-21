import { createSlice } from '@reduxjs/toolkit';

import {
  getStorage,
  removeStorage,
  setStorage,
} from '../../utils/storage';

const initialState = {
  user: getStorage('ardnet.user', null),
  token: getStorage('ardnet.token', null),
};

/**
 * Accept both API login responses ({ user, token }) and profile/user
 * objects ({ id, name, email, role, ... }). This keeps profile refreshes
 * from accidentally replacing the authenticated user with undefined.
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    loginSuccess(state, action) {
      const payload = action.payload;

      if (!payload || typeof payload !== 'object') {
        return;
      }

      const candidateUser =
        payload.user && typeof payload.user === 'object'
          ? payload.user
          : payload;

      const isUserObject =
        candidateUser &&
        typeof candidateUser === 'object' &&
        (
          Object.prototype.hasOwnProperty.call(candidateUser, 'id') ||
          Object.prototype.hasOwnProperty.call(candidateUser, 'user_id') ||
          Object.prototype.hasOwnProperty.call(candidateUser, 'email') ||
          Object.prototype.hasOwnProperty.call(candidateUser, 'role')
        );

      if (isUserObject) {
        state.user = candidateUser;
        setStorage('ardnet.user', candidateUser);
      }

      // An explicitly supplied token (including null) means the caller
      // intends to set or clear the token. If omitted, preserve the
      // existing token for user/profile-only updates.
      if (Object.prototype.hasOwnProperty.call(payload, 'token')) {
        const token =
          typeof payload.token === 'string' && payload.token.trim()
            ? payload.token.trim()
            : null;

        state.token = token;

        if (token) {
          setStorage('ardnet.token', token);
        } else {
          removeStorage('ardnet.token');
        }
      } else if (!state.token) {
        // The API client may have stored the token before this action.
        // Support both raw JWT strings and JSON-stringified JWT values.
        const storedToken = sessionStorage.getItem('ardnet.token');

        if (storedToken) {
          try {
            const parsedToken = JSON.parse(storedToken);
            state.token =
              typeof parsedToken === 'string' ? parsedToken : storedToken;
          } catch {
            state.token = storedToken;
          }
        }
      }
    },

    updateProfile(state, action) {
      state.user = {
        ...(state.user || {}),
        ...(action.payload || {}),
      };

      setStorage('ardnet.user', state.user);
    },

    logoutSuccess(state) {
      state.user = null;
      state.token = null;

      removeStorage('ardnet.user');
      removeStorage('ardnet.token');
      removeStorage('refreshToken');
    },
  },
});

export const {
  loginSuccess,
  updateProfile,
  logoutSuccess,
} = authSlice.actions;

export default authSlice.reducer;
