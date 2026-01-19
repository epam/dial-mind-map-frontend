import { createSelector } from '@reduxjs/toolkit';

import { BuilderRootState } from '../index';
import { BuilderState } from './builder.types';

const rootSelector = (state: BuilderRootState): BuilderState => state.builder;

export const selectGeneratingStatus = createSelector([rootSelector], state => state.generatingStatus);

export const selectEtag = createSelector([rootSelector], state => state.etag);

export const selectIsRequestInProgress = createSelector([rootSelector], state => state.inProgressRequestsCounter > 0);

export const selectGenerationComplete = createSelector([rootSelector], state => state.generationComplete);

export const selectIsGraphLoading = createSelector([rootSelector], state => state.isGraphLoading);

export const selectGenerationStatus = createSelector([rootSelector], state => state.generationStatus);

export const selectIsMindmapSubscribeActive = createSelector([rootSelector], state => state.isMindmapSubscribeActive);

export const selectIsGenerated = createSelector([rootSelector], state => state.isGenerated);

export const selectGenerationType = createSelector([rootSelector], state => state.generationType);

export const selectModels = createSelector([rootSelector], state => state.models);

export const selectCurrentModelId = createSelector([rootSelector], state => state.currentModelId);

export const selectPrompt = createSelector([rootSelector], state => state.prompt);

export const selectIsModelsLoading = createSelector([rootSelector], state => state.isModelsLoading);

export const selectDefaultSimpleModeModel = createSelector([rootSelector], state => state.defaultSimpleModeModel);

export const selectDefaultSimpleModePrompt = createSelector([rootSelector], state => state.defaultSimpleModePrompt);

export const selectIsMindmapExportInProgress = createSelector([rootSelector], state => state.isMindmapExportInProgress);

export const selectIsMindmapImportInProgress = createSelector([rootSelector], state => state.isMindmapImportInProgress);

export const selectGenerateParams = createSelector([rootSelector], state => ({
  model: state.currentModelId ?? state.defaultSimpleModeModel,
  type: state.generationType,
  prompt: state.prompt ?? undefined,
  chatModel: state.chatModel ?? state.defaultChatModel,
  chatPrompt: state.chatPrompt ?? undefined,
  chatGuardrailsPrompt: state.chatGuardrailsPrompt ?? undefined,
  chatGuardrailsEnabled: state.chatGuardrailsEnabled,
  chatGuardrailsResponsePrompt: state.chatGuardrailsResponsePrompt ?? undefined,
}));

export const selectDefaultChatModel = createSelector([rootSelector], state => state.defaultChatModel);

export const selectDefaultChatPrompt = createSelector([rootSelector], state => state.defaultChatPrompt);

export const selectDefaultChatGuardrailsPrompt = createSelector(
  [rootSelector],
  state => state.defaultChatGuardrailsPrompt,
);

export const selectDefaultChatGuardrailsResponsePrompt = createSelector(
  [rootSelector],
  state => state.defaultChatGuardrailsResponsePrompt,
);

export const selectChatModelId = createSelector([rootSelector], state => state.chatModel);

export const selectChatPrompt = createSelector([rootSelector], state => state.chatPrompt);

export const selectChatGuardrailsEnabled = createSelector([rootSelector], state => state.chatGuardrailsEnabled);

export const selectChatGuardrailsPrompt = createSelector([rootSelector], state => state.chatGuardrailsPrompt);

export const selectChatGuardrailsResponsePrompt = createSelector(
  [rootSelector],
  state => state.chatGuardrailsResponsePrompt,
);

export const selectAvailableChatModels = createSelector([rootSelector], state => state.availableChatModels);

export const selectAvailableSimpleModeModels = createSelector([rootSelector], state => state.availableSimpleModeModels);
