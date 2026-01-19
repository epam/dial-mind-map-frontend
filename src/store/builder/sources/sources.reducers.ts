/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { CreateSource, CreateSourceVersion, RecreateSourceVersion, Source, SourcesNames } from '@/types/sources';

import { SourcesState } from './sources.types';

export { SourcesSelectors } from './sources.selectors';

export const SourcesInitialState: SourcesState = {
  sourcesNames: {},
  sources: [],
  isSourcesLoading: false,
};

export const sourcesSlice = createSlice({
  name: 'sources',
  initialState: SourcesInitialState,
  reducers: {
    setSourcesNames: (state, { payload }: PayloadAction<SourcesNames>) => {
      state.sourcesNames = payload;
    },
    initSources: (state, { payload }: PayloadAction<{ name: string }>) => {
      state.isSourcesLoading = true;
    },
    fetchSources: state => {},
    fetchSourcesSuccess: (state, action: PayloadAction<{ sources: Source[] }>) => {
      state.sources = action.payload.sources;
      state.isSourcesLoading = false;
    },
    fetchSourcesFailure: (state, { payload }: PayloadAction<string>) => {
      state.isSourcesLoading = false;
    },
    setSources: (state, { payload }: PayloadAction<Source[]>) => {
      state.sources = payload;
    },
    setIsSourcesLoading: (state, { payload }: PayloadAction<boolean>) => {
      state.isSourcesLoading = payload;
    },
    setActiveSourceVersion: (state, { payload }: PayloadAction<{ sourceId: string; versionId: number }>) => state,
    deleteSource: (state, { payload }: PayloadAction<Source>) => state,
    changeSourceName: (state, { payload }: PayloadAction<{ sourceId: string; name: string }>) => state,
    downloadSource: (state, { payload }: PayloadAction<{ sourceId: string; versionId: number; name?: string }>) =>
      state,
    createSource: (
      state,
      { payload }: PayloadAction<Omit<CreateSource, 'sourceId' | 'versionId'> & { name: string }>,
    ) => state,
    sourceStatusSubscribe: (state, { payload }: PayloadAction<{ sourceId: string; versionId: number }>) => state,
    createSourceVersion: (state, { payload }: PayloadAction<CreateSourceVersion>) => state,
    recreateSourceVersion: (state, { payload }: PayloadAction<RecreateSourceVersion>) => state,
    updateSource: (state, { payload }: PayloadAction<Source>) => state,
    reindexSources: (state, { payload }: PayloadAction<Source[]>) => state,
    markAsApplied: (state, { payload }: PayloadAction<{ ids: string[] }>) => state,
  },
});

export const SourcesActions = sourcesSlice.actions;
