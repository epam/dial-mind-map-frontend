import { catchError, concat, filter, from, mergeMap, of } from 'rxjs';

import { HTTPMethod } from '@/types/http';
import { GenerationStatus } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { GraphActions } from '../../graph/graph.reducers';
import { UIActions } from '../../ui/ui.reducers';
import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../../utils/globalCatchUnauthorized';
import { BuilderActions, BuilderSelectors } from '../builder.reducers';
import { handleMindmapGenerationStream } from './utils/stream';

export const regenerateMindmapEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.regenerateMindmap.match),
    mergeMap(() => {
      const applicationName = ApplicationSelectors.selectApplicationName(state$.value);
      const previousGenerationStatus = BuilderSelectors.selectGenerationStatus(state$.value);
      const controller = new AbortController();

      return concat(
        of(BuilderActions.setGenerationStatus(GenerationStatus.IN_PROGRESS)),
        of(GraphActions.setGraphReady(false)),
        from(
          fetch(`/api/mindmaps/${encodeURIComponent(applicationName)}/generate`, {
            method: HTTPMethod.POST,
            signal: controller.signal,
          }),
        ).pipe(
          mergeMap(resp => checkForUnauthorized(resp)),
          mergeMap(resp => handleMindmapGenerationStream(resp, controller)),
          globalCatchUnauthorized(),
          catchError(() =>
            concat(
              of(UIActions.showErrorToast('Failed to generate mindmap')),
              of(BuilderActions.setGenerationStatus(previousGenerationStatus ?? GenerationStatus.NOT_STARTED)),
            ),
          ),
        ),
      );
    }),
  );
