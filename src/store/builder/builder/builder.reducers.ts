/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { GenerationType, InternalGenerateParams } from '@/types/generate';
import { Edge, Element, Graph, Node, PositionedElement } from '@/types/graph';
import { Model } from '@/types/model';
import { GenerationStatus, Source } from '@/types/sources';

import * as BuilderSelectors from './builder.selectors';
import { BuilderState, GeneratingStatus } from './builder.types';

export { BuilderSelectors };

export const BuilderInitialState: BuilderState = {
  generatingStatus: {
    title: 'Graph generation',
  },
  inProgressRequestsCounter: 0,
  etag: null,
  generationComplete: false,
  isGraphLoading: false,
  generationStatus: null,
  isGenerated: false,
  isMindmapSubscribeActive: false,
  generationType: GenerationType.Universal,
  models: [],
  isModelsLoading: false,
  currentModelId: null,
  prompt: '',
  defaultSimpleModeModel: '',
  availableSimpleModeModels: [],
  defaultSimpleModePrompt: '',
  isMindmapExportInProgress: false,
  isMindmapImportInProgress: false,
  chatPrompt: '',
  chatGuardrailsPrompt: '',
  chatGuardrailsEnabled: false,
  chatGuardrailsResponsePrompt: '',
  chatModel: '',
  availableChatModels: [],
  defaultChatModel: '',
  defaultChatPrompt: '',
  defaultChatGuardrailsPrompt: '',
  defaultChatGuardrailsResponsePrompt: '',
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
    updateNodesPositions: (
      state,
      { payload }: PayloadAction<{ positionedNodes: PositionedElement<Node>[]; historySkip?: boolean }>,
    ) => state,
    patchGraph: (
      state,
      {
        payload,
      }: PayloadAction<{
        nodes?: PositionedElement<Node>[];
        edges?: Element<Edge>[];
        historySkip?: boolean;
        edgesIdsToDelete?: string[];
      }>,
    ) => state,
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
    setGenerationStatus: (state, { payload }: PayloadAction<GenerationStatus>) => {
      state.generationStatus = payload;
    },
    generationStatusSubscribe: state => state,
    setIsGenerated: (state, { payload }: PayloadAction<boolean>) => {
      state.isGenerated = payload;
    },
    setModels: (state, { payload }: PayloadAction<Model[]>) => {
      state.models = payload;
    },
    fetchModels: state => {
      state.isModelsLoading = true;
    },
    setIsModelsLoading: (state, { payload }: PayloadAction<boolean>) => {
      state.isModelsLoading = payload;
    },
    fetchGenerateParams: state => state,
    setGenerateParams: (state, { payload }: PayloadAction<InternalGenerateParams>) => {
      state.prompt = payload.prompt || null;
      state.currentModelId = payload.model || null;
      state.generationType = payload.type || GenerationType.Universal;
      state.chatModel = payload.chatModel || null;
      state.chatPrompt = payload.chatPrompt || null;
      state.chatGuardrailsPrompt = payload.chatGuardrailsPrompt || null;
      state.chatGuardrailsEnabled = payload.chatGuardrailsEnabled ?? false;
      state.chatGuardrailsResponsePrompt = payload.chatGuardrailsResponsePrompt || null;
    },
    updateGenerateParams: (state, { payload }: PayloadAction<InternalGenerateParams>) => state,

    exportMindmap: state => {
      state.isMindmapExportInProgress = true;
    },
    exportMindmapSuccess: state => {
      state.isMindmapExportInProgress = false;
    },
    exportMindmapFailure: state => {
      state.isMindmapExportInProgress = false;
    },

    importMindmap: (state, { payload }: PayloadAction<{ file: File }>) => {
      state.isMindmapImportInProgress = true;
    },
    importMindmapSuccess: state => {
      state.isMindmapImportInProgress = false;
    },
    importMindmapFailure: (state, { payload }: PayloadAction<string>) => {
      state.isMindmapImportInProgress = false;
    },
    uploadIcon: (state, action: PayloadAction<{ file: File; name: string; nodeId: string; iconPath: string }>) => state,
  },
});

export const BuilderActions = builderSlice.actions;
