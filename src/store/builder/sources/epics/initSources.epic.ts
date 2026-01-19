import { UnknownAction } from '@reduxjs/toolkit';
import { catchError, EMPTY, filter, from, mergeMap, switchMap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { GenerationType, InternalGenerateParams } from '@/types/generate';
import { GenerationStatus, Sources, SourceStatus } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';
import { adjustSourcesStatuses } from '@/utils/app/sources';

import { ApplicationSelectors } from '../../application/application.reducer';
import { BuilderActions, BuilderSelectors } from '../../builder/builder.reducers';
import { UIActions, UISelectors } from '../../ui/ui.reducers';
import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../../utils/globalCatchUnauthorized';
import { SourcesActions } from '../sources.reducers';

function hasSeenGenerationError(reference: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const generationErrorSeen = JSON.parse(localStorage.getItem('generation-error-seen') || '{}');
    return !!generationErrorSeen[reference];
  } catch {
    return false;
  }
}

export const initSourcesEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(SourcesActions.initSources.match),
    switchMap(({ payload }) => {
      const { name } = payload;

      return fromFetch(`/api/mindmaps/${encodeURIComponent(name)}/documents`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
        mergeMap(resp => {
          if (!resp.ok) {
            return from([
              BuilderActions.setGenerationStatus(GenerationStatus.NOT_STARTED),
              SourcesActions.fetchSourcesFailure(''),
              UIActions.showErrorToast('Sorry, something went wrong. Try again later.'),
            ]);
          }
          return from(resp.json()).pipe(
            mergeMap((response: Sources) => {
              const sources = adjustSourcesStatuses(response.sources ?? []);

              const generationStatus = response.generation_status;
              const alreadySubscribed = BuilderSelectors.selectIsMindmapSubscribeActive(state$.value);

              const actions: UnknownAction[] = [
                SourcesActions.fetchSourcesSuccess({
                  sources,
                }),
                SourcesActions.setSourcesNames(response.names),
                BuilderActions.setGenerationStatus(generationStatus),
                BuilderActions.setIsGenerated(response.generated),
              ];

              const isSimpleGenerationModeAvailable = UISelectors.selectIsSimpleGenerationModeAvailable(state$.value);

              if (isSimpleGenerationModeAvailable) {
                const defaultSimpleModeModel = BuilderSelectors.selectDefaultSimpleModeModel(state$.value);
                const defaultChatModel = BuilderSelectors.selectDefaultChatModel(state$.value);
                if (response.params) {
                  actions.push(
                    BuilderActions.setGenerateParams({
                      model: response.params.model || defaultSimpleModeModel,
                      prompt: response.params.prompt,
                      chatModel:
                        response.params.chat_model ||
                        (response.params as InternalGenerateParams).chatModel ||
                        defaultChatModel,
                      chatPrompt: response.params.chat_prompt || (response.params as InternalGenerateParams).chatPrompt,
                      chatGuardrailsPrompt: response.params.chat_guardrails_prompt,
                      chatGuardrailsEnabled: response.params.chat_guardrails_enabled ?? false,
                      chatGuardrailsResponsePrompt: response.params.chat_guardrails_response_prompt,
                      type: response.params.type || GenerationType.Universal,
                    }),
                  );
                } else {
                  actions.push(
                    BuilderActions.setGenerateParams({
                      model: defaultSimpleModeModel,
                      type: GenerationType.Universal,
                      chatModel: defaultChatModel,
                    }),
                  );
                }
                actions.push(BuilderActions.fetchModels());
              }

              if (!alreadySubscribed) {
                actions.push(BuilderActions.subscribe());
              }

              const sourceStatusSubscription = sources
                .filter(s => s.status === SourceStatus.INPROGRESS && s.id && s.version)
                .map(s => SourcesActions.sourceStatusSubscribe({ sourceId: s.id!, versionId: s.version! }));

              if (sourceStatusSubscription.length) {
                actions.push(...sourceStatusSubscription);
              }

              if (generationStatus === GenerationStatus.FINISHED) {
                return from([...actions, BuilderActions.fetchGraph()]);
              }
              if (generationStatus === GenerationStatus.NOT_STARTED) {
                return from([...actions]);
              }

              const applicationReference = ApplicationSelectors.selectApplication(state$.value)?.reference;
              const skipGenerationStatusSubscribe = applicationReference
                ? hasSeenGenerationError(applicationReference)
                : false;

              if (skipGenerationStatusSubscribe) {
                if (response.generated) {
                  actions.push(BuilderActions.fetchGraph());
                }
                actions.push(
                  BuilderActions.setGenerationStatus(
                    response.generated ? GenerationStatus.FINISHED : GenerationStatus.NOT_STARTED,
                  ),
                );
                return from([...actions]);
              }

              if (generationStatus === GenerationStatus.IN_PROGRESS) {
                return from([...actions, BuilderActions.generationStatusSubscribe()]);
              }
              return EMPTY;
            }),
          );
        }),
        globalCatchUnauthorized(),
        catchError(() => {
          return from([
            SourcesActions.fetchSourcesFailure(''),
            UIActions.showErrorToast('Sorry, something went wrong. Try again later.'),
          ]);
        }),
      );
    }),
  );
