import { UnknownAction } from 'redux';
import { catchError, concat, EMPTY, filter, from, mergeMap, Observable, of } from 'rxjs';

import { HTTPMethod } from '@/types/http';
import { GenerationStatus } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';

import { SourcesActions } from '../../sources/sources.reducers';
import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../../utils/globalCatchUnauthorized';
import { BuilderActions } from '../builder.reducers';
import { handleMindmapGenerationStream } from './utils/stream';

export const generateMindmapEpic: BuilderRootEpic = action$ =>
  action$.pipe(
    filter(BuilderActions.generateMindmap.match),
    mergeMap(({ payload }) => {
      const actions: Observable<UnknownAction>[] = [
        of(BuilderActions.setGenerationStatus(GenerationStatus.IN_PROGRESS)),
      ];

      if (payload.sources) {
        actions.push(of(SourcesActions.setSources(payload.sources)));
      }

      const controller = new AbortController();

      const request$ = from(
        fetch(`/api/mindmaps/${encodeURIComponent(payload.name)}/generate`, {
          method: HTTPMethod.POST,
          signal: controller.signal,
          body:
            payload.applySources &&
            JSON.stringify({
              sources: payload.applySources,
            }),
        }),
      ).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
        mergeMap(resp => handleMindmapGenerationStream(resp, controller)),
        globalCatchUnauthorized(),
        catchError(error => {
          console.warn('sourceCreationSubscribe Error:', error);
          return EMPTY;
        }),
      );

      return concat(...actions, request$);
    }),
  );
