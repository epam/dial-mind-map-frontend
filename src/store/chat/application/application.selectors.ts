import { createSelector } from '@reduxjs/toolkit';

import { getEncodedPathFromApplication } from '@/utils/app/application';

import { ChatRootState } from '../index';
import { ApplicationState } from './application.types';

const rootSelector = (state: ChatRootState): ApplicationState => state.application;

export const selectApplication = createSelector([rootSelector], state => state.application);

export const selectHasAppProperties = createSelector(
  [selectApplication],
  app => app && 'application_properties' in app && !!app.application_properties,
);

export const selectHasAppReference = createSelector(
  [selectApplication],
  app => app && 'reference' in app && !!app.reference,
);

export const selectAppName = createSelector([selectApplication], app => app?.name);

export const selectAppReference = createSelector([selectApplication], app => app?.reference);

export const selectIsApplicationLoading = createSelector([rootSelector], state => state.isLoading);

export const selectEncodedApplicationPath = createSelector([selectApplication], application => {
  return application ? getEncodedPathFromApplication(application) : '';
});

export const selectEtag = createSelector([rootSelector], state => state.etag);

export const selectApplicationName = createSelector(
  [rootSelector],
  state => state.application?.name ?? state.application?.application ?? '',
);
