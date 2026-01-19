import { concatMap, filter, from, map, of } from 'rxjs';

import { Edge, Element } from '@/types/graph';
import { HTTPMethod } from '@/types/http';
import { BuilderRootEpic } from '@/types/store';
import { isEdge } from '@/utils/app/graph/typeGuards';

import { ApplicationSelectors } from '../../application/application.reducer';
import { GraphActions, GraphSelectors } from '../../graph/graph.reducers';
import { HistoryActions } from '../../history/history.reducers';
import { UIActions } from '../../ui/ui.reducers';
import { handleRequest } from '../../utils/handleRequest';
import { BuilderActions } from '../builder.reducers';

export const createEdgeEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.createEdge.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
    })),
    concatMap(({ payload: edge, name }) => {
      const optimisticActions = [
        HistoryActions.setIsUndo(true),
        HistoryActions.setIsRedo(false),
        GraphActions.addOrUpdateElements([{ data: edge }]),
      ];

      return handleRequest({
        url: `/api/mindmaps/${encodeURIComponent(name)}/graph/edges`,
        options: {
          method: HTTPMethod.POST,
          body: JSON.stringify({ data: edge }),
        },
        state$,
        optimisticActions,
      });
    }),
  );

export const deleteEdgeEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.deleteEdge.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
    })),
    concatMap(({ payload: edgeId, name }) => {
      const optimisticActions = [
        HistoryActions.setIsUndo(true),
        HistoryActions.setIsRedo(false),
        GraphActions.deleteElements([edgeId]),
      ];

      return handleRequest({
        url: `/api/mindmaps/${encodeURIComponent(name)}/graph/edges/${edgeId}`,
        options: { method: HTTPMethod.DELETE },
        state$,
        optimisticActions,
      });
    }),
  );

export const deleteGeneratedEdgesEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.deleteGeneratedEdges.match),
    map(() => ({
      name: ApplicationSelectors.selectApplicationName(state$.value),
      elements: GraphSelectors.selectElements(state$.value),
    })),
    concatMap(({ name, elements }) => {
      const idsToDelete = elements
        .filter(el => isEdge(el.data) && (el.data as Edge).type === 'Generated')
        .map(e => e.data.id);

      const optimisticActions = [
        HistoryActions.setIsUndo(true),
        HistoryActions.setIsRedo(false),
        GraphActions.deleteElements(idsToDelete),
        UIActions.setIsGenEdgesDelLoaderModalOpen(true),
      ];

      const successActions = [UIActions.setIsGenEdgesDelLoaderModalOpen(false)];

      return handleRequest({
        url: `/api/mindmaps/${encodeURIComponent(name)}/graph/edges/auto`,
        options: { method: HTTPMethod.DELETE },
        state$,
        optimisticActions,
        successActions,
        failureActions: [UIActions.setIsGenEdgesDelLoaderModalOpen(false)],
      });
    }),
  );

export const updateEdgeEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.updateEdge.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
    })),
    concatMap(({ payload: edge, name }) => {
      const optimisticActions = [
        HistoryActions.setIsUndo(true),
        HistoryActions.setIsRedo(false),
        GraphActions.updateElements([{ data: edge }]),
      ];

      return handleRequest({
        url: `/api/mindmaps/${encodeURIComponent(name)}/graph/edges/${edge.id}`,
        options: {
          method: HTTPMethod.PUT,
          body: JSON.stringify({ data: edge }),
        },
        state$,
        optimisticActions,
      });
    }),
  );

export const generateEdgesEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.generateEdges.match),
    map(() => ({
      name: ApplicationSelectors.selectApplicationName(state$.value),
      elements: GraphSelectors.selectElements(state$.value),
    })),
    concatMap(({ name, elements }) => {
      const optimisticActions = [
        HistoryActions.setIsUndo(true),
        HistoryActions.setIsRedo(false),
        UIActions.setIsGenEdgesLoaderModalOpen(true),
      ];

      const successActions = [
        UIActions.setAreGeneretedEdgesShowen({ value: true }),
        UIActions.setIsGenEdgesLoaderModalOpen(false),
      ];

      const failureActions = [UIActions.setIsGenEdgesLoaderModalOpen(false)];

      const responseProcessor = (resp: Response) => {
        return from(resp.json()).pipe(
          concatMap((response: Element<Edge>[]) => {
            const filteredElements = elements.filter(
              el => !(el.data as Edge).source || (el.data as Edge).type !== 'Generated',
            );

            return of(
              GraphActions.setElements({
                elements: [...filteredElements, ...response],
              }),
            );
          }),
        );
      };

      return handleRequest({
        url: `/api/mindmaps/${encodeURIComponent(name)}/graph/edges/auto`,
        options: { method: HTTPMethod.POST },
        state$,
        optimisticActions,
        successActions,
        failureActions,
        responseProcessor,
      });
    }),
  );
