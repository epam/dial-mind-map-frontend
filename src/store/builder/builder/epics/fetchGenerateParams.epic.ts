import { concatMap, filter, from, of } from 'rxjs';

import { GenerateParams } from '@/types/generate';
import { HTTPMethod } from '@/types/http';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { UIActions } from '../../ui/ui.reducers';
import { handleRequest } from '../../utils/handleRequest';
import { BuilderActions } from '../builder.reducers';

export const fetchGenerateParamsEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.fetchGenerateParams.match),
    concatMap(() => {
      const name = ApplicationSelectors.selectApplicationName(state$.value);

      const responseProcessor = (resp: Response) =>
        from(resp.json()).pipe(
          concatMap((response: GenerateParams) => {
            return of(
              BuilderActions.setGenerateParams({
                type: response.type,
                model: response.model,
                prompt: response.prompt,
                chatModel: response.chat_model,
                chatPrompt: response.chat_prompt,
                chatGuardrailsPrompt: response.chat_guardrails_prompt,
                chatGuardrailsEnabled: response.chat_guardrails_enabled,
                chatGuardrailsResponsePrompt: response.chat_guardrails_response_prompt,
              }),
            );
          }),
        );

      return handleRequest({
        url: `/api/mindmaps/${encodeURIComponent(name)}/generate/params`,
        options: { method: HTTPMethod.GET },
        state$,
        responseProcessor,
        failureActions: [UIActions.showErrorToast(`Failed to fetch generation parameters`)],
      });
    }),
  );
