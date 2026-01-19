import { useCallback, useMemo } from 'react';

import { BuilderActions, BuilderSelectors } from '@/store/builder/builder/builder.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { Model } from '@/types/model';

export const useChatSettings = () => {
  const dispatch = useBuilderDispatch();

  const defaultChatModel = useBuilderSelector(BuilderSelectors.selectDefaultChatModel);
  const defaultChatPrompt = useBuilderSelector(BuilderSelectors.selectDefaultChatPrompt);
  const availableModels = useBuilderSelector(BuilderSelectors.selectAvailableChatModels);

  const allModels = useBuilderSelector(BuilderSelectors.selectModels);
  const isModelsLoading = useBuilderSelector(BuilderSelectors.selectIsModelsLoading);

  const currentChatModelId = useBuilderSelector(BuilderSelectors.selectChatModelId);
  const chatPrompt = useBuilderSelector(BuilderSelectors.selectChatPrompt);

  const generateParams = useBuilderSelector(BuilderSelectors.selectGenerateParams);

  const updateChatParams = useCallback(
    (params: { chatModel?: string; chatPrompt?: string }) => {
      dispatch(
        BuilderActions.updateGenerateParams({
          ...generateParams,
          chatModel: params.chatModel ?? currentChatModelId ?? defaultChatModel,
          chatPrompt: params.chatPrompt ?? chatPrompt ?? undefined,
        }),
      );
    },
    [dispatch, currentChatModelId, chatPrompt, defaultChatModel, generateParams],
  );

  const onSetCurrentModel = (model: Model | null) => {
    updateChatParams({ chatModel: model?.id });
  };

  const currentModel = useMemo(
    () => allModels.find(m => m.id === (currentChatModelId ?? defaultChatModel)) || null,
    [allModels, currentChatModelId, defaultChatModel],
  );

  const filteredModels = useMemo(
    () => (availableModels.length === 0 ? allModels : allModels.filter(m => availableModels.includes(m.id))),
    [allModels, availableModels],
  );

  const onSetPrompt = (value: string) => {
    updateChatParams({ chatPrompt: value });
  };

  return {
    models: filteredModels,
    isModelsLoading,
    currentChatModelId,
    currentModel,
    chatPrompt,
    defaultChatPrompt,
    onSetCurrentModel,
    onSetPrompt,
  };
};
