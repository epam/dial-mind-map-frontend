import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as AnonymSessionSelectors from './anonymSession.selectors';
export { AnonymSessionSelectors };

export interface AnonymSessionState {
  recaptchaSiteKey: string;
  isRecaptchaRequired: boolean;
  isRecaptchaConfigured: boolean;
  anonymCsrfToken: string;
}

const initialState: AnonymSessionState = {
  recaptchaSiteKey: '',
  isRecaptchaRequired: false,
  isRecaptchaConfigured: false,
  anonymCsrfToken: '',
};

const anonymSessionSlice = createSlice({
  name: 'anonymSession',
  initialState,
  reducers: {
    setIsRecaptchaRequired: (state, { payload }: PayloadAction<boolean>) => {
      state.isRecaptchaRequired = payload;
    },
    setAnonymCsrfToken: (state, { payload }: PayloadAction<string>) => {
      state.anonymCsrfToken = payload;
    },
  },
});

export const anonymSessionActions = anonymSessionSlice.actions;
export default anonymSessionSlice.reducer;
