import { createSelector } from '@reduxjs/toolkit';

import { BuilderRootState } from '..';
import { AuthState } from './auth.slice';

const rootSelector = (state: BuilderRootState): AuthState => state.auth;

export const selectRedirectToSignin = createSelector([rootSelector], state => state.redirectToSignin);

export const selectRedirectToForbidden = createSelector([rootSelector], state => state.redirectToForbidden);
