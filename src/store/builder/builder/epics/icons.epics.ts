import { UnknownAction } from '@reduxjs/toolkit';
import cloneDeep from 'lodash-es/cloneDeep';
import { catchError, concat, concatMap, EMPTY, filter, from, map, mergeMap, of } from 'rxjs';

import { Node } from '@/types/graph';
import { HTTPMethod } from '@/types/http';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { GraphSelectors } from '../../graph/graph.reducers';
import { HistoryActions } from '../../history/history.reducers';
import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../../utils/globalCatchUnauthorized';
import { BuilderActions } from '../builder.reducers';

export const uploadIconEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.uploadIcon.match),
    map(({ payload }) => ({
      payload,
      appName: ApplicationSelectors.selectApplicationName(state$.value),
    })),
    concatMap(({ payload, appName }) => {
      const optimisticActions: UnknownAction[] = [HistoryActions.setIsUndo(true), HistoryActions.setIsRedo(false)];

      const formData = new FormData();
      formData.append('file', payload.file);

      return concat(
        of(...optimisticActions),
        from(
          fetch(
            `/api/mindmaps/${encodeURIComponent(appName)}/icons/${payload.nodeId}/${encodeURIComponent(payload.name)}`,
            {
              method: HTTPMethod.PUT,
              body: formData,
            },
          ),
        ).pipe(
          mergeMap(resp => checkForUnauthorized(resp)),
          mergeMap(async resp => {
            await resp.body?.cancel?.(); // close connection immediately
            return of(resp);
          }),
          mergeMap(() => {
            const elements = GraphSelectors.selectElements(state$.value);
            const targetNode = elements.find(el => el.data.id === payload.nodeId)?.data as Node;
            if (!targetNode) {
              return EMPTY;
            }

            const updatedNode = cloneDeep(targetNode);
            updatedNode.icon = payload.iconPath;

            return of(BuilderActions.updateNode(updatedNode));
          }),
          globalCatchUnauthorized(),
          catchError(error => {
            console.warn('file uploading subscription error:', error);
            return EMPTY;
          }),
        ),
      );
    }),
  );
