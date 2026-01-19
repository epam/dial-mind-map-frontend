import { createSelector } from '@reduxjs/toolkit';

import { ChatRootState } from '..';
import { AnonymSessionState } from './anonymSession.slice';

const rootSelector = (state: ChatRootState): AnonymSessionState => state.anonymSession;

export const selectRecaptchaSiteKey = createSelector([rootSelector], state => state.recaptchaSiteKey);

export const selectIsRecaptchaRequired = createSelector([rootSelector], state => state.isRecaptchaRequired);

export const selectIsRecaptchaConfigured = createSelector([rootSelector], state => state.isRecaptchaConfigured);

export const selectAnonymSessionCsrfToken = createSelector([rootSelector], state => state.anonymCsrfToken);
