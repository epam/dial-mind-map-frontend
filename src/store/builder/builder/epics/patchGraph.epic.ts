import { Action } from '@reduxjs/toolkit';
import cloneDeep from 'lodash-es/cloneDeep';
import { concatMap, filter, map } from 'rxjs';

import { HTTPMethod } from '@/types/http';
import { BuilderRootEpic } from '@/types/store';
import { isNode } from '@/utils/app/graph/typeGuards';

import { ApplicationSelectors } from '../../application/application.reducer';
import { GraphActions, GraphSelectors } from '../../graph/graph.reducers';
import { handleRequest } from '../../utils/handleRequest';
import { BuilderActions } from '../builder.reducers';

export const patchGraphEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.patchGraph.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
      elements: GraphSelectors.selectElements(state$.value),
    })),
    concatMap(({ payload, name, elements }) => {
      const { nodes, edges, historySkip, edgesIdsToDelete } = payload;

      const body = {
        history_skip: historySkip,
        nodes,
        edges,
        edges_to_delete: edgesIdsToDelete,
      };

      const optimisticActions: Action[] = [
        GraphActions.setElements({
          elements: elements
            .filter(el => !edgesIdsToDelete?.includes(el.data.id))
            .map(el => {
              if (isNode(el.data)) {
                const changedNode = nodes?.find(node => node.data.id === el.data.id);
                if (changedNode) {
                  return cloneDeep({
                    ...el,
                    position: changedNode.position,
                    data: { ...el.data, status: el.data.status ?? changedNode.data.status },
                  });
                }
              } else {
                const changedEdge = edges?.find(edge => edge.data.id === el.data.id);
                if (changedEdge) {
                  return cloneDeep({ ...el, ...changedEdge, data: { ...el.data, ...changedEdge.data } });
                }
              }
              return el;
            }),
          skipLayout: true,
        }),
      ];

      return handleRequest({
        url: `/api/mindmaps/${encodeURIComponent(name)}/graph`,
        options: {
          method: HTTPMethod.PATCH,
          body: JSON.stringify(body),
        },
        state$,
        optimisticActions,
      });
    }),
  );
