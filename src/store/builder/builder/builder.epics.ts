import { Action, UnknownAction } from '@reduxjs/toolkit';
import cloneDeep from 'lodash-es/cloneDeep';
import { combineEpics } from 'redux-observable';
import {
  catchError,
  concat,
  concatMap,
  EMPTY,
  filter,
  from,
  map,
  mergeMap,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { EtagHeaderName, MindmapUrlHeaderName } from '@/constants/http';
import { Graph } from '@/types/graph';
import { HTTPMethod } from '@/types/http';
import { GenerationStatus } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';
import { generateMindmapFolderPath } from '@/utils/app/application';
import { isEdge } from '@/utils/app/graph/typeGuards';

import { ApplicationSelectors } from '../application/application.reducer';
import { GraphActions, GraphInitialState, GraphSelectors } from '../graph/graph.reducers';
import { HistoryActions } from '../history/history.reducers';
import { UIActions } from '../ui/ui.reducers';
import { checkForUnauthorized } from '../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../utils/globalCatchUnauthorized';
import { handleRequest } from '../utils/handleRequest';
import { BuilderActions, BuilderSelectors } from './builder.reducers';
import {
  createEdgeEpic,
  deleteEdgeEpic,
  deleteGeneratedEdgesEpic,
  generateEdgesEpic,
  updateEdgeEpic,
} from './epics/edges.epic';
import { generateMindmapEpic } from './epics/generateMindmap.epic';
import { generationCompleteEpic, generationStatusSubscribeEpic } from './epics/generationStatusSubscribe.epic';
import {
  createNodeEpic,
  deleteNodeEpic,
  deleteNodeWithConnectedEdgesEpic,
  setNodeAsRootEpic,
  updateNodeEpic,
  updateNodesPositionsEpic,
} from './epics/nodes.epic';
import { regenerateMindmapEpic } from './epics/regenerateMindmap.epic';
import {
  changeSourceNameEpic,
  createSourceEpic,
  createSourceVersionEpic,
  deleteSourceEpic,
  downloadSourceEpic,
  fetchSourcesEpic,
  initSourcesEpic,
  recreateSourceVersionEpic,
  setActiveSourceVersionEpic,
  updateSourceEpic,
} from './epics/sources.epic';
import { sourceStatusSubscribeEpic } from './epics/sourceStatusSubscribe.epic';
import { subscribeMindmapEpic } from './epics/subscribeMindmap.epic';
import { redoEpic, undoEpic } from './epics/undoRedo.epic';

const patchEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.patch.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
      elements: GraphSelectors.selectElements(state$.value),
    })),
    concatMap(({ payload: body, name, elements }) => {
      const optimisticActions: Action[] = [
        // HistoryActions.setIsRedo(false),
        GraphActions.setElements({
          elements: elements.map(el => {
            const changedNode = body.nodes.find(node => node.data.id === el.data.id);
            if (changedNode) {
              return cloneDeep({ ...el, position: changedNode.position });
            }
            return el;
          }),
          skipLayout: true,
        }),
      ];

      const isInitialLoayout = elements
        .filter(el => !isEdge(el.data))
        .every(node => !node.position || (node.position.x === 0 && node.position.y === 0));

      if (!isInitialLoayout) {
        optimisticActions.push(HistoryActions.setIsUndo(true));
      }

      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);
      if (!mindmapFolder) {
        return throwError(() => new Error('Mindmap folder is not set'));
      }

      return handleRequest(
        `/api/mindmaps/${encodeURIComponent(name)}/graph`,
        {
          method: HTTPMethod.PATCH,
          body: JSON.stringify(body),
          headers: { [MindmapUrlHeaderName]: mindmapFolder },
        },
        state$,
        optimisticActions,
      );
    }),
  );

const fetchGraphEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.fetchGraph.match),
    map(() => ({
      name: ApplicationSelectors.selectApplicationName(state$.value),
      elements: GraphSelectors.selectElements(state$.value),
    })),
    switchMap(({ name, elements }) => {
      const application = ApplicationSelectors.selectApplication(state$.value);

      if (!application) {
        return throwError(() => new Error('Application is not set'));
      }

      return fromFetch(`/api/mindmaps/${encodeURIComponent(name)}/graph`, {
        method: HTTPMethod.GET,
        headers: {
          'Content-Type': 'application/json',
          [MindmapUrlHeaderName]:
            application.application_properties?.mindmap_folder ?? generateMindmapFolderPath(application),
        },
      }).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
        mergeMap(resp => {
          if (!resp.ok) {
            return throwError(() => resp);
          }
          return from(resp.json()).pipe(
            mergeMap((response: Graph) => {
              const etag = resp.headers.get(EtagHeaderName);
              const actions: Observable<UnknownAction>[] = [
                of(BuilderActions.setEtag(etag)),
                of(GraphActions.setRootNodeId(response.root)),
              ];

              if (elements.length === 0) {
                actions.push(
                  of(
                    GraphActions.init({
                      ...GraphInitialState,
                      elements: [...response.nodes, ...response.edges],
                      isReady: true,
                      rootNodeId: response.root,
                    }),
                  ),
                );
              } else {
                actions.push(
                  of(
                    GraphActions.setElements({
                      elements: [...response.nodes, ...response.edges],
                    }),
                  ),
                );
                const generationStatus = BuilderSelectors.selectGenerationStatus(state$.value);
                if (generationStatus !== GenerationStatus.IN_PROGRESS) {
                  actions.push(of(GraphActions.setGraphReady(true)));
                }
              }

              actions.push(of(BuilderActions.fetchGraphSuccess(response)));

              return concat(...actions);
            }),
          );
        }),
        globalCatchUnauthorized(),
        catchError(error => {
          if (error instanceof Response && error.status === 404) {
            return of(BuilderActions.fetchGraphFailure('Graph not found'));
          }
          return of(
            BuilderActions.fetchGraphFailure('Failed to fetch graph'),
            UIActions.showErrorToast('Failed to load graph'),
          );
        }),
      );
    }),
  );

const updateEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.update.match),
    map(({ payload }) => ({
      payload,
      etag: BuilderSelectors.selectEtag(state$.value),
      isRequestInProgress: BuilderSelectors.selectIsRequestInProgress(state$.value),
      generationStatus: BuilderSelectors.selectGenerationStatus(state$.value),
    })),
    mergeMap(({ payload, etag, isRequestInProgress, generationStatus }) => {
      if (etag === payload.etag || isRequestInProgress) {
        return EMPTY;
      }

      if (generationStatus === GenerationStatus.IN_PROGRESS) {
        return of(BuilderActions.setEtag(payload.etag));
      }

      if (generationStatus === GenerationStatus.NOT_STARTED || payload.shouldSkipFetchGraph) {
        return of(BuilderActions.setEtag(payload.etag)).pipe(
          concatMap(() => concat(of(BuilderActions.fetchSources()), of(HistoryActions.fetchUndoRedo()))),
        );
      }

      return of(BuilderActions.setEtag(payload.etag)).pipe(
        concatMap(() =>
          concat(
            of(BuilderActions.fetchGraph()),
            of(BuilderActions.fetchSources()),
            of(HistoryActions.fetchUndoRedo()),
          ),
        ),
      );
    }),
  );

export const BuilderEpics = combineEpics(
  patchEpic,
  fetchGraphEpic,
  createNodeEpic,
  updateNodeEpic,
  deleteNodeEpic,
  deleteEdgeEpic,
  createEdgeEpic,
  updateEdgeEpic,
  updateNodesPositionsEpic,
  subscribeMindmapEpic,
  updateEpic,
  fetchSourcesEpic,
  createSourceEpic,
  createSourceVersionEpic,
  recreateSourceVersionEpic,
  updateSourceEpic,
  deleteSourceEpic,
  initSourcesEpic,
  generateEdgesEpic,
  deleteGeneratedEdgesEpic,
  undoEpic,
  redoEpic,
  deleteNodeWithConnectedEdgesEpic,
  setNodeAsRootEpic,
  generateMindmapEpic,
  generationStatusSubscribeEpic,
  generationCompleteEpic,
  regenerateMindmapEpic,
  sourceStatusSubscribeEpic,
  downloadSourceEpic,
  setActiveSourceVersionEpic,
  changeSourceNameEpic,
);
