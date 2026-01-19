import { useCallback, useMemo } from 'react';

import { BuilderActions, BuilderSelectors } from '@/store/builder/builder/builder.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { GenerationType } from '@/types/generate';
import { Model } from '@/types/model';

export const useGraphSettings = () => {
  const dispatch = useBuilderDispatch();

  const defaultSimpleModeModel = useBuilderSelector(BuilderSelectors.selectDefaultSimpleModeModel);
  const defaultPrompt = useBuilderSelector(BuilderSelectors.selectDefaultSimpleModePrompt);
  const availableModels = useBuilderSelector(BuilderSelectors.selectAvailableSimpleModeModels);

  const allModels = useBuilderSelector(BuilderSelectors.selectModels);
  const isModelsLoading = useBuilderSelector(BuilderSelectors.selectIsModelsLoading);

  const currentParams = useBuilderSelector(BuilderSelectors.selectGenerateParams);
  const updateGenerateParams = useCallback(
    (params: { model?: string; type?: GenerationType; prompt?: string }) => {
      dispatch(
        BuilderActions.updateGenerateParams({
          ...currentParams,
          model: params.model ?? currentParams.model ?? defaultSimpleModeModel,
          type: params.type ?? currentParams.type,
          prompt: params.prompt ?? currentParams.prompt ?? undefined,
        }),
      );
    },
    [dispatch, currentParams, defaultSimpleModeModel],
  );

  const currentModelId = useBuilderSelector(BuilderSelectors.selectCurrentModelId);
  const onSetCurrentModel = (model: Model | null) => {
    updateGenerateParams({ model: model?.id });
  };

  const currentModel = useMemo(
    () => allModels.find(model => model.id === (currentModelId ?? defaultSimpleModeModel)) || null,
    [allModels, currentModelId, defaultSimpleModeModel],
  );

  const filteredModels = useMemo(
    () => (availableModels.length === 0 ? allModels : allModels.filter(m => availableModels.includes(m.id))),
    [allModels, availableModels],
  );

  const prompt = useBuilderSelector(BuilderSelectors.selectPrompt);
  const onSetPrompt = (value: string) => {
    updateGenerateParams({ prompt: value });
  };

  return {
    models: filteredModels,
    currentModelId,
    currentModel,
    onSetCurrentModel,
    prompt,
    defaultPrompt,
    onSetPrompt,
    isModelsLoading,
  };
};
