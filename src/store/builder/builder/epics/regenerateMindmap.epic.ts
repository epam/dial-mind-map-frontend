import { catchError, concat, filter, from, mergeMap, of, throwError } from 'rxjs';

import { MindmapUrlHeaderName } from '@/constants/http';
import { GenerationStatus } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';
import { generateMindmapFolderPath } from '@/utils/app/application';

import { ApplicationSelectors } from '../../application/application.reducer';
import { GraphActions } from '../../graph/graph.reducers';
import { UIActions } from '../../ui/ui.reducers';
import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../../utils/globalCatchUnauthorized';
import { BuilderActions, BuilderSelectors } from '../builder.reducers';

export const regenerateMindmapEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.regenerateMindmap.match),
    mergeMap(() => {
      const application = ApplicationSelectors.selectApplication(state$.value);
      const applicationName = ApplicationSelectors.selectApplicationName(state$.value);
      const mindmapFolder = generateMindmapFolderPath(application);
      const previousGenerationStatus = BuilderSelectors.selectGenerationStatus(state$.value);

      return concat(
        of(BuilderActions.setGenerationStatus(GenerationStatus.IN_PROGRESS)),
        of(GraphActions.setGraphReady(false)),
        from(
          fetch(`/api/mindmaps/${encodeURIComponent(applicationName)}/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              [MindmapUrlHeaderName]: mindmapFolder,
            },
          }),
        ).pipe(
          mergeMap(resp => checkForUnauthorized(resp)),
          mergeMap(resp => {
            if (resp.status === 200) {
              return of(BuilderActions.generationStatusSubscribe());
            }
            return throwError(() => new Error('Mindmap generation failed'));
          }),
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
