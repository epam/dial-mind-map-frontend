import { filter, from, merge, of } from 'rxjs';
import { catchError, concatMap, debounceTime, map, share } from 'rxjs/operators';

import { EtagHeaderName } from '@/constants/http';
import { GenerationType } from '@/types/generate';
import { HTTPMethod } from '@/types/http';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { BuilderActions, BuilderSelectors } from '../../builder/builder.reducers';
import { UIActions } from '../../ui/ui.reducers';
import { handleRequest } from '../../utils/handleRequest';

export const updateGenerateParamsEpic: BuilderRootEpic = (action$, state$) => {
  const updates$ = action$.pipe(filter(BuilderActions.updateGenerateParams.match), share());

  const immediateUpdate$ = updates$.pipe(map(action => BuilderActions.setGenerateParams(action.payload)));

  const serverUpdate$ = updates$.pipe(
    debounceTime(500),
    concatMap(() => {
      const appName = ApplicationSelectors.selectApplicationName(state$.value);
      const config = BuilderSelectors.selectGenerateParams(state$.value);

      const defaultSimpleModeModel = BuilderSelectors.selectDefaultSimpleModeModel(state$.value);
      const defaultChatModel = BuilderSelectors.selectDefaultChatModel(state$.value);

      const responseProcessor = (resp: Response) =>
        from(resp.json()).pipe(map(() => BuilderActions.setEtag(resp.headers.get(EtagHeaderName))));

      return handleRequest({
        url: `/api/mindmaps/${encodeURIComponent(appName)}/generate/params`,
        options: {
          method: HTTPMethod.POST,
          body: JSON.stringify({
            model: config.model || defaultSimpleModeModel,
            prompt: config.prompt ?? '',
            chat_model: config.chatModel || defaultChatModel,
            chat_prompt: config.chatPrompt ?? '',
            chat_guardrails_prompt: config.chatGuardrailsPrompt ?? '',
            chat_guardrails_enabled: config.chatGuardrailsEnabled,
            chat_guardrails_response_prompt: config.chatGuardrailsResponsePrompt ?? '',
            type: config.type || GenerationType.Universal,
          }),
        },
        state$,
        responseProcessor,
        failureActions: [UIActions.showErrorToast(`Failed to update generation parameters`)],
      }).pipe(
        catchError(err => of(UIActions.showErrorToast(`Failed to update generation parameters: ${err.message}`))),
      );
    }),
  );

  return merge(immediateUpdate$, serverUpdate$);
};
