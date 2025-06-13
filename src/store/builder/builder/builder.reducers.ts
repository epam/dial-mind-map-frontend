/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Edge, Element, Graph, Node, PositionedElement } from '@/types/graph';
import {
  CreateSource,
  CreateSourceVersion,
  GenerationStatus,
  RecreateSourceVersion,
  Source,
  SourcesNames,
} from '@/types/sources';

import * as BuilderSelectors from './builder.selectors';
import { BuilderState, GeneratingStatus } from './builder.types';

export { BuilderSelectors };

export const BuilderInitialState: BuilderState = {
  sources: [],
  sourcesNames: {},
  generatingStatus: {
    title: 'Graph generation',
  },
  inProgressRequestsCounter: 0,
  etag: null,
  generationComplete: false,
  isSourcesLoading: false,
  isGraphLoading: false,
  generationStatus: null,
  isGenerated: false,
  isMindmapSubscribeActive: false,
};

export const builderSlice = createSlice({
  name: 'builder',
  initialState: BuilderInitialState,
  reducers: {
    generateMindmap: (
      state,
      { payload }: PayloadAction<{ sources?: Source[]; applySources?: string[]; name: string }>,
    ) => state,
    regenerateMindmap: state => state,
    patch: (state, { payload }: PayloadAction<{ nodes: PositionedElement<Node>[]; edges: Element<Edge>[] }>) => state,
    subscribe: state => state,
    subscribeStarted: state => {
      state.isMindmapSubscribeActive = true;
    },
    unsubscribe: state => {
      state.isMindmapSubscribeActive = false;
    },
    update: (state, { payload }: PayloadAction<{ shouldSkipFetchGraph?: boolean; etag: string }>) => state,
    fetchGraph: state => {
      state.isGraphLoading = true;
    },
    fetchGraphSuccess: (state, { payload }: PayloadAction<Graph>) => {
      state.isGraphLoading = false;
    },
    fetchGraphFailure: (state, { payload }: PayloadAction<string>) => {
      state.isGraphLoading = false;
    },
    initSources: (state, { payload }: PayloadAction<{ name: string }>) => {
      state.isSourcesLoading = true;
    },
    fetchSources: state => {},
    fetchSourcesSuccess: (state, action: PayloadAction<{ sources: Source[]; isMmExist: boolean }>) => {
      state.sources = action.payload.sources;
      state.isSourcesLoading = false;
    },
    fetchSourcesFailure: (state, { payload }: PayloadAction<string>) => {
      state.isSourcesLoading = false;
    },
    setSources: (state, { payload }: PayloadAction<Source[]>) => {
      state.sources = payload;
    },
    setSourcesNames: (state, { payload }: PayloadAction<SourcesNames>) => {
      state.sourcesNames = payload;
    },
    setGeneratingStatus: (state, { payload }: PayloadAction<GeneratingStatus>) => {
      state.generatingStatus = payload;
    },
    setIsRequestInProgress: (state, { payload }: PayloadAction<boolean>) => {
      state.inProgressRequestsCounter = payload
        ? state.inProgressRequestsCounter + 1
        : state.inProgressRequestsCounter - 1;
    },
    setEtag: (state, { payload }: PayloadAction<string | null>) => {
      state.etag = payload;
    },
    updateNode: (state, { payload }: PayloadAction<Node>) => state,
    createNode: (state, { payload }: PayloadAction<PositionedElement<Node>>) => state,
    createNodeSuccess: state => state,
    deleteNode: (state, { payload }: PayloadAction<{ nodeId: string; edgesIds: string[] }>) => state,
    deleteNodeWithConnectedEdges: (state, { payload }: PayloadAction<string>) => state,
    deleteEdge: (state, { payload }: PayloadAction<string>) => state,
    createEdge: (state, { payload }: PayloadAction<Edge>) => state,
    updateEdge: (state, { payload }: PayloadAction<Edge>) => state,
    deleteSource: (state, { payload }: PayloadAction<Source>) => state,
    createSource: (
      state,
      { payload }: PayloadAction<Omit<CreateSource, 'sourceId' | 'versionId'> & { name: string }>,
    ) => state,
    createSourceVersion: (state, { payload }: PayloadAction<CreateSourceVersion>) => state,
    recreateSourceVersion: (state, { payload }: PayloadAction<RecreateSourceVersion>) => state,
    changeSourceName: (state, { payload }: PayloadAction<{ sourceId: string; name: string }>) => state,
    updateSource: (state, { payload }: PayloadAction<Source>) => state,
    setActiveSourceVersion: (state, { payload }: PayloadAction<{ sourceId: string; versionId: number }>) => state,
    downloadSource: (state, { payload }: PayloadAction<{ sourceId: string; versionId: number; name?: string }>) =>
      state,
    updateNodesPositions: (state, { payload }: PayloadAction<PositionedElement<Node>[]>) => state,
    setNodeAsRoot: (state, { payload }: PayloadAction<string>) => state,
    generateEdges: state => state,
    deleteGeneratedEdges: state => state,
    generationComplete: state => {
      state.generationComplete = true;
    },
    resetGenerationComplete: state => {
      state.generationComplete = false;
    },
    redo: state => state,
    undo: state => state,
    redoDocs: state => state,
    undoDocs: state => state,
    setIsSourcesLoading: (state, { payload }: PayloadAction<boolean>) => {
      state.isSourcesLoading = payload;
    },
    setGenerationStatus: (state, { payload }: PayloadAction<GenerationStatus>) => {
      state.generationStatus = payload;
    },
    generationStatusSubscribe: state => state,
    sourceStatusSubscribe: (state, { payload }: PayloadAction<{ sourceId: string; versionId: number }>) => state,
    setIsGenerated: (state, { payload }: PayloadAction<boolean>) => {
      state.isGenerated = payload;
    },
  },
});

export const BuilderActions = builderSlice.actions;
