import { useCallback } from 'react';

import { BuilderActions, BuilderSelectors } from '@/store/builder/builder/builder.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';

export const useGuardrailsSettings = () => {
  const dispatch = useBuilderDispatch();

  const defaultChatGuardrailsPrompt = useBuilderSelector(BuilderSelectors.selectDefaultChatGuardrailsPrompt);
  const defaultChatGuardrailsResponsePrompt = useBuilderSelector(
    BuilderSelectors.selectDefaultChatGuardrailsResponsePrompt,
  );

  const chatGuardrailsEnabled = useBuilderSelector(BuilderSelectors.selectChatGuardrailsEnabled);
  const chatGuardrailsPrompt = useBuilderSelector(BuilderSelectors.selectChatGuardrailsPrompt);
  const chatGuardrailsResponsePrompt = useBuilderSelector(BuilderSelectors.selectChatGuardrailsResponsePrompt);

  const generateParams = useBuilderSelector(BuilderSelectors.selectGenerateParams);

  const updateGuardrailsParams = useCallback(
    (params: {
      chatGuardrailsPrompt?: string;
      chatGuardrailsResponsePrompt?: string;
      chatGuardrailsEnabled?: boolean;
    }) => {
      dispatch(
        BuilderActions.updateGenerateParams({
          ...generateParams,
          chatGuardrailsEnabled: params.chatGuardrailsEnabled ?? chatGuardrailsEnabled,
          chatGuardrailsPrompt: params.chatGuardrailsPrompt ?? chatGuardrailsPrompt ?? undefined,
          chatGuardrailsResponsePrompt:
            params.chatGuardrailsResponsePrompt ?? chatGuardrailsResponsePrompt ?? undefined,
        }),
      );
    },
    [dispatch, chatGuardrailsEnabled, chatGuardrailsPrompt, chatGuardrailsResponsePrompt, generateParams],
  );

  const onSetGuardrailsPrompt = (value: string) => {
    updateGuardrailsParams({ chatGuardrailsPrompt: value });
  };

  const onSetGuardrailsEnabled = (value: boolean) => {
    updateGuardrailsParams({ chatGuardrailsEnabled: value });
  };

  const onSetChatGuardrailsResponsePrompt = (value: string) => {
    updateGuardrailsParams({ chatGuardrailsResponsePrompt: value });
  };

  return {
    chatGuardrailsEnabled,
    chatGuardrailsPrompt,
    chatGuardrailsResponsePrompt,
    defaultChatGuardrailsPrompt,
    defaultChatGuardrailsResponsePrompt,
    onSetGuardrailsEnabled,
    onSetGuardrailsPrompt,
    onSetChatGuardrailsResponsePrompt,
  };
};
