import { createSelector } from '@reduxjs/toolkit';

import { generateMindmapFolderPath } from '@/utils/app/application';

import { BuilderRootState } from '../index';
import { ApplicationState } from './application.types';

const rootSelector = (state: BuilderRootState): ApplicationState => state.application;

export const selectApplication = createSelector([rootSelector], state => state.application);

export const selectMindmapFolder = createSelector(
  [rootSelector],
  state => state.application?.application_properties?.mindmap_folder ?? generateMindmapFolderPath(state.application),
);

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
