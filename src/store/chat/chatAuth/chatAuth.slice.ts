import { createSlice } from '@reduxjs/toolkit';

import * as ChatAuthSelectors from './chatAuth.selectors';
export { ChatAuthSelectors };

export interface ChatAuthState {
  redirectToSignin: boolean;
  redirectToForbidden: boolean;
}

const initialState: ChatAuthState = {
  redirectToSignin: false,
  redirectToForbidden: false,
};

const chatAuthSlice = createSlice({
  name: 'chatAuth',
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

export const chatAuthActions = chatAuthSlice.actions;
export default chatAuthSlice.reducer;
