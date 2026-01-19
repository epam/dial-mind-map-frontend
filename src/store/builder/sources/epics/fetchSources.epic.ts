import { catchError, EMPTY, filter, from, map, mergeMap, switchMap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { Sources } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { BuilderSelectors } from '../../builder/builder.reducers';
import { UIActions } from '../../ui/ui.reducers';
import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../../utils/globalCatchUnauthorized';
import { handleSourcesResponse } from '../../utils/handleSourcesResponse';
import { SourcesActions, SourcesSelectors } from '../sources.reducers';

export const fetchSourcesEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(SourcesActions.fetchSources.match),
    map(() => ({
      name: ApplicationSelectors.selectApplicationName(state$.value),
      prevSources: SourcesSelectors.selectSources(state$.value),
      prevGenStatus: BuilderSelectors.selectGenerationStatus(state$.value),
    })),
    switchMap(({ name, prevSources, prevGenStatus }) => {
      return fromFetch(`/api/mindmaps/${encodeURIComponent(name)}/documents`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
        mergeMap(resp => {
          if (!resp.ok) {
            return EMPTY;
          }
          return from(resp.json()).pipe(
            mergeMap((response: Sources) => handleSourcesResponse(response, prevSources, prevGenStatus)),
          );
        }),
        globalCatchUnauthorized(),
        catchError(() => {
          return from([UIActions.showErrorToast('Failed to load sources')]);
        }),
      );
    }),
  );
