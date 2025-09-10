import { createSlice } from '@reduxjs/toolkit';

import * as AuthSelectors from './auth.selectors';
export { AuthSelectors };

export interface AuthState {
  redirectToSignin: boolean;
  redirectToForbidden: boolean;
}

const initialState: AuthState = {
  redirectToSignin: false,
  redirectToForbidden: false,
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
    redirectToForbidden(state) {
      state.redirectToForbidden = true;
    },
  },
});

export const AuthActions = authSlice.actions;
export default authSlice.reducer;
