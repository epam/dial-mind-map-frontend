import { createSelector } from '@reduxjs/toolkit';

import { BuilderRootState } from '../index';
import { ApplicationState } from './application.types';

const rootSelector = (state: BuilderRootState): ApplicationState => state.application;

export const selectApplication = createSelector([rootSelector], state => state.application);

export const selectApplicationLoading = createSelector([rootSelector], state => state.isLoading);

export const selectApplicationName = createSelector(
  [rootSelector],
  state => state.application?.name ?? state.application?.application ?? '',
);

export const selectApplicationDisplayName = createSelector(
  [rootSelector],
  state => state.application?.display_name ?? state.application?.name ?? state.application?.application ?? '',
);

export const selectIsApplicationReady = createSelector([rootSelector], state => state.isApplicationReady);
