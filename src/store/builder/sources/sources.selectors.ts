import { createSelector } from '@reduxjs/toolkit';

import { BuilderRootState } from '../index';
import { SourcesState } from './sources.types';

const rootSelector = (state: BuilderRootState): SourcesState => state.sources;

const selectSourcesNames = createSelector([rootSelector], state => state.sourcesNames);

const selectIsSourcesLoading = createSelector([rootSelector], state => state.isSourcesLoading);

const selectSources = createSelector([rootSelector], state => state.sources);

export const SourcesSelectors = {
  selectSourcesNames,
  selectIsSourcesLoading,
  selectSources,
};
