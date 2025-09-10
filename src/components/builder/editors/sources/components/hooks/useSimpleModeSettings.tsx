import { useCallback, useMemo } from 'react';

import { BuilderActions, BuilderSelectors } from '@/store/builder/builder/builder.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { GenerationType } from '@/types/generate';
import { Model } from '@/types/model';

export const useSimpleModeSettings = () => {
  const dispatch = useBuilderDispatch();
  const defaultSimpleModeModel = useBuilderSelector(BuilderSelectors.selectDefaultSimpleModeModel);
  const defaultSimpleModePrompt = useBuilderSelector(BuilderSelectors.selectDefaultSimpleModePrompt);

  const models = useBuilderSelector(BuilderSelectors.selectModels);
  const isModelsLoading = useBuilderSelector(BuilderSelectors.selectIsModelsLoading);

  const currentParams = useBuilderSelector(BuilderSelectors.selectGenerateParams);
  const updateGenerateParams = useCallback(
    (params: { model?: string; type?: GenerationType; prompt?: string }) => {
      dispatch(
        BuilderActions.updateGenerateParams({
          model: params.model ?? currentParams.model ?? defaultSimpleModeModel,
          type: params.type ?? currentParams.type,
          prompt: params.prompt ?? currentParams.prompt ?? defaultSimpleModePrompt,
        }),
      );
    },
    [dispatch, currentParams, defaultSimpleModeModel, defaultSimpleModePrompt],
  );

  const currentModelId = useBuilderSelector(BuilderSelectors.selectCurrentModelId);
  const onSetCurrentModel = (model: Model | null) => {
    updateGenerateParams({ model: model?.id });
  };
  const currentModel = useMemo(
    () => models.find(model => model.id === (currentModelId ?? defaultSimpleModeModel)) || null,
    [models, currentModelId, defaultSimpleModeModel],
  );

  const generationType = useBuilderSelector(BuilderSelectors.selectGenerationType);
  const onSetGenerationType = (checked: boolean) => {
    updateGenerateParams({ type: checked ? GenerationType.Simple : GenerationType.Universal });
  };

  const prompt = useBuilderSelector(BuilderSelectors.selectPrompt);
  const onSetPrompt = (value: string) => {
    updateGenerateParams({ prompt: value });
  };

  return {
    generationType,
    models,
    currentModelId,
    currentModel,
    onSetCurrentModel,
    onSetGenerationType,
    prompt,
    onSetPrompt,
    isModelsLoading,
  };
};
