import { UnknownAction } from '@reduxjs/toolkit';
import isEqual from 'lodash-es/isEqual';
import uniqBy from 'lodash-es/uniqBy';
import xorWith from 'lodash-es/xorWith';
import { concat, concatMap, filter, from, map, Observable, of } from 'rxjs';

import { Graph } from '@/types/graph';
import { HTTPMethod } from '@/types/http';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { GraphActions, GraphSelectors } from '../../graph/graph.reducers';
import { UIActions } from '../../ui/ui.reducers';
import { handleRequest } from '../../utils/handleRequest';
import { BuilderActions, BuilderSelectors } from '../builder.reducers';

const createUndoRedoEpic =
  (actionType: any, selector: any, urlPath: string): BuilderRootEpic =>
  (action$, state$) =>
    action$.pipe(
      filter(actionType.match),
      map(() => ({
        name: ApplicationSelectors.selectApplicationName(state$.value),
        etag: BuilderSelectors.selectEtag(state$.value),
        elements: GraphSelectors.selectElements(state$.value),
        isAvailable: selector(state$.value),
      })),
      filter(({ isAvailable }) => isAvailable),
      concatMap(({ name, elements }) => {
        const responseProcessor = (resp: Response) => {
          return from(resp.json()).pipe(
            concatMap((response: Graph) => {
              const actions: Observable<UnknownAction>[] = [
                // of(UIActions.setIsUndoAvailable(!!response.undo)),
                // of(UIActions.setIsRedoAvailable(!!response.redo)),
              ];

              const currentNodes = elements.filter(el => !('source' in el.data));
              const currentEdges = elements.filter(el => 'source' in el.data);

              const nodesDiff = uniqBy(
                xorWith(response.nodes, currentNodes, (a, b) => isEqual(a.data, b.data)),
                'data.id',
              );
              const edgesDiff = uniqBy(xorWith(response.edges, currentEdges, isEqual), 'data.id');

              if (nodesDiff.length === 1) {
                const newNode = response.nodes.find(n => n.data.id === nodesDiff[0].data.id);

                if (newNode) {
                  actions.push(of(UIActions.setIsNodeEditorOpen(true)));
                  actions.push(of(GraphActions.setFocusNodeId(newNode.data.id)));
                } else {
                  actions.push(of(UIActions.setIsNodeEditorOpen(false)));
                  actions.push(of(GraphActions.setFocusNodeId('')));
                }
              }

              if (edgesDiff.length === 1) {
                const newEdge = response.edges.find(n => n.data.id === edgesDiff[0].data.id);

                if (newEdge) {
                  actions.push(of(GraphActions.setFocusEdgeId(newEdge.data.id)));
                } else {
                  actions.push(of(GraphActions.setFocusEdgeId('')));
                }
              }

              actions.push(
                of(
                  GraphActions.setElements({
                    elements: [...response.nodes, ...response.edges],
                  }),
                ),
              );

              return concat(...actions);
            }),
          );
        };

        return handleRequest({
          url: `/api/mindmaps/${encodeURIComponent(name)}/graph/${urlPath}`,
          options: { method: HTTPMethod.POST },
          state$,
          responseProcessor,
        });
      }),
    );

export const undoEpic: BuilderRootEpic = createUndoRedoEpic(
  BuilderActions.undo,
  'temporary_removing_in_progress',
  'undo',
);

export const redoEpic: BuilderRootEpic = createUndoRedoEpic(
  BuilderActions.redo,
  'temporary_removing_in_progress',
  'redo',
);
