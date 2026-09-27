import { createSlice } from '@reduxjs/toolkit';
import { getStorage, removeStorage, setStorage } from '../../utils/storage';

const initialState = {
  user: getStorage('ardnet.user', null)
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action) {
      state.user = action.payload;
      setStorage('ardnet.user', action.payload);
    },
    updateProfile(state, action) {
      state.user = { ...state.user, ...action.payload };
      setStorage('ardnet.user', state.user);
    },
    logoutSuccess(state) {
      state.user = null;
      removeStorage('ardnet.user');
    }
  }
});

export const { loginSuccess, updateProfile, logoutSuccess } = authSlice.actions;
export default authSlice.reducer;
