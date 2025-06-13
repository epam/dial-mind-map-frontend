import { createSlice } from '@reduxjs/toolkit';

import * as AuthSelectors from './auth.selectors';
export { AuthSelectors };

export interface AuthState {
  redirectToSignin: boolean;
}

const initialState: AuthState = {
  redirectToSignin: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    redirectToSignin(state) {
      state.redirectToSignin = true;
    },
    resetRedirect(state) {
      state.redirectToSignin = false;
    },
  },
});

export const AuthActions = authSlice.actions;
export default authSlice.reducer;
