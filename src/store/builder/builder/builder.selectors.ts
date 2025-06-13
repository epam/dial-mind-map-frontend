import { createSelector } from '@reduxjs/toolkit';

import { BuilderRootState } from '../index';
import { BuilderState } from './builder.types';

const rootSelector = (state: BuilderRootState): BuilderState => state.builder;

export const selectGeneratingStatus = createSelector([rootSelector], state => state.generatingStatus);

export const selectEtag = createSelector([rootSelector], state => state.etag);

export const selectSources = createSelector([rootSelector], state => state.sources);

export const selectSourcesNames = createSelector([rootSelector], state => state.sourcesNames);

export const selectIsRequestInProgress = createSelector([rootSelector], state => state.inProgressRequestsCounter > 0);

export const selectGenerationComplete = createSelector([rootSelector], state => state.generationComplete);

export const selectIsSourcesLoading = createSelector([rootSelector], state => state.isSourcesLoading);

export const selectIsGraphLoading = createSelector([rootSelector], state => state.isGraphLoading);

export const selectGenerationStatus = createSelector([rootSelector], state => state.generationStatus);

export const selectIsMindmapSubscribeActive = createSelector([rootSelector], state => state.isMindmapSubscribeActive);

export const selectIsGenerated = createSelector([rootSelector], state => state.isGenerated);
