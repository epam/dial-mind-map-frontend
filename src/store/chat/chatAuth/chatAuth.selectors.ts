import { createSelector } from '@reduxjs/toolkit';

import { ChatRootState } from '..';
import { ChatAuthState } from './chatAuth.slice';

const rootSelector = (state: ChatRootState): ChatAuthState => state.chatAuth;

export const selectRedirectToSignin = createSelector([rootSelector], state => state.redirectToSignin);
