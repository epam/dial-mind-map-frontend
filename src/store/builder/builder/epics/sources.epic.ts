import { UnknownAction } from '@reduxjs/toolkit';
import { saveAs } from 'file-saver';
import { catchError, concat, concatMap, EMPTY, filter, from, map, mergeMap, of, switchMap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { MindmapUrlHeaderName } from '@/constants/http';
import { BuilderActions, BuilderSelectors } from '@/store/builder/builder/builder.reducers';
import { HTTPMethod } from '@/types/http';
import { GenerationStatus, Source, Sources, SourceStatus, SourceType } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';
import { adjustSourcesStatuses } from '@/utils/app/sources';
import { uuidv4 } from '@/utils/common/uuid';

import { ApplicationSelectors } from '../../application/application.reducer';
import { HistoryActions } from '../../history/history.reducers';
import { UIActions } from '../../ui/ui.reducers';
import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../../utils/globalCatchUnauthorized';
import { handleRequest } from '../../utils/handleRequest';
import { handleSourcesResponse } from '../../utils/handleSourcesResponse';
import { handleSourceDelete } from './utils/handleSourceDelete';

export const initSourcesEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.initSources.match),
    switchMap(({ payload }) => {
      const { name } = payload;
      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);

      if (!mindmapFolder) {
        return of(
          BuilderActions.setIsSourcesLoading(false),
          UIActions.showErrorToast('Mindmap folder not found'),
          BuilderActions.setGenerationStatus(GenerationStatus.NOT_STARTED),
        );
      }

      return fromFetch(`/api/mindmaps/${encodeURIComponent(name)}/documents`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', [MindmapUrlHeaderName]: mindmapFolder },
      }).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
        mergeMap(resp => {
          if (!resp.ok) {
            return from([
              BuilderActions.setGenerationStatus(GenerationStatus.NOT_STARTED),
              BuilderActions.fetchSourcesFailure(''),
              UIActions.showErrorToast('Sorry, something went wrong. Try again later.'),
            ]);
          }
          return from(resp.json()).pipe(
            mergeMap((response: Sources) => {
              const sources = adjustSourcesStatuses(response.sources ?? []);

              const generationStatus = response.generation_status;
              const alreadySubscribed = BuilderSelectors.selectIsMindmapSubscribeActive(state$.value);

              const actions: UnknownAction[] = [
                BuilderActions.fetchSourcesSuccess({
                  sources,
                  isMmExist: true,
                }),
                BuilderActions.setSourcesNames(response.names),
                BuilderActions.setGenerationStatus(generationStatus),
                BuilderActions.setIsGenerated(response.generated),
              ];

              if (!alreadySubscribed) {
                actions.push(BuilderActions.subscribe());
              }

              const sourceStatusSubscription = sources
                .filter(s => s.status === SourceStatus.INPROGRESS && s.id && s.version)
                .map(s => BuilderActions.sourceStatusSubscribe({ sourceId: s.id!, versionId: s.version! }));

              if (sourceStatusSubscription.length) {
                actions.push(...sourceStatusSubscription);
              }

              if (generationStatus === GenerationStatus.FINISHED) {
                return from([...actions, BuilderActions.fetchGraph()]);
              }
              if (generationStatus === GenerationStatus.NOT_STARTED) {
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
            BuilderActions.fetchSourcesFailure(''),
            UIActions.showErrorToast('Sorry, something went wrong. Try again later.'),
          ]);
        }),
      );
    }),
  );

export const fetchSourcesEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.fetchSources.match),
    map(() => ({
      name: ApplicationSelectors.selectApplicationName(state$.value),
      prevSources: BuilderSelectors.selectSources(state$.value),
      prevGenStatus: BuilderSelectors.selectGenerationStatus(state$.value),
    })),
    switchMap(({ name, prevSources, prevGenStatus }) => {
      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);

      return fromFetch(`/api/mindmaps/${encodeURIComponent(name)}/documents`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', [MindmapUrlHeaderName]: mindmapFolder },
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
          return EMPTY;
        }),
      );
    }),
  );

export const deleteSourceEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.deleteSource.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
      sources: BuilderSelectors.selectSources(state$.value),
    })),
    concatMap(({ payload, name }) => {
      const optimisticActions = [HistoryActions.setIsUndo(true), HistoryActions.setIsRedo(false)];
      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);

      if (!mindmapFolder) {
        return EMPTY;
      }
      const fileName = payload.type === SourceType.FILE ? payload.url.split('/').at(-1) : undefined;
      const url =
        payload.type === SourceType.FILE && fileName
          ? `/api/mindmaps/${encodeURIComponent(name)}/documents/${payload.id}?fileName=${encodeURIComponent(fileName)}`
          : `/api/mindmaps/${encodeURIComponent(name)}/documents/${payload.id}`;

      const responseProcessor = (resp: Response) =>
        from(resp.text()).pipe(
          concatMap(() => {
            const sources = BuilderSelectors.selectSources(state$.value);
            const updatedSources = handleSourceDelete(sources, payload.id!);
            return concat(of(BuilderActions.setSources(updatedSources)));
          }),
        );

      return handleRequest(
        url,
        { method: HTTPMethod.DELETE, headers: { [MindmapUrlHeaderName]: mindmapFolder } },
        state$,
        optimisticActions,
        [],
        [],
        responseProcessor,
      );
    }),
  );

export const changeSourceNameEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.changeSourceName.match),
    map(({ payload }) => ({
      payload,
      appName: ApplicationSelectors.selectApplicationName(state$.value),
    })),
    concatMap(({ payload, appName }) => {
      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);

      if (!mindmapFolder) {
        return EMPTY;
      }

      const sourcesNames = BuilderSelectors.selectSourcesNames(state$.value);
      const sources = BuilderSelectors.selectSources(state$.value);
      let realSourceStatus: SourceStatus | undefined;

      const updatedSources = sources.reduce((acc: Source[], source) => {
        if (source.id === payload.sourceId && source.active) {
          realSourceStatus = source.status;
          return [...acc, { ...source, status: SourceStatus.INPROGRESS }];
        }
        return [...acc, source];
      }, []);

      const optimisticActions: UnknownAction[] = [
        HistoryActions.setIsUndo(true),
        HistoryActions.setIsRedo(false),
        BuilderActions.setSourcesNames({ ...sourcesNames, [payload.sourceId]: payload.name }),
        BuilderActions.setSources(updatedSources),
      ];

      const responseProcessor = (resp: Response) =>
        from(resp.text()).pipe(
          concatMap(() => {
            const sources = BuilderSelectors.selectSources(state$.value);
            const updatedSources = sources.reduce((acc: Source[], source) => {
              if (source.id === payload.sourceId && source.active) {
                return [...acc, { ...source, status: realSourceStatus ?? SourceStatus.INDEXED }];
              }
              return [...acc, source];
            }, []);

            return concat(of(BuilderActions.setSources(updatedSources)));
          }),
        );

      return handleRequest(
        `/api/mindmaps/${encodeURIComponent(appName)}/documents/${payload.sourceId}`,
        {
          method: HTTPMethod.POST,
          body: JSON.stringify({ name: payload.name }),
          headers: { [MindmapUrlHeaderName]: mindmapFolder },
        },
        state$,
        optimisticActions,
        [],
        [UIActions.showErrorToast('Failed to change the source name')],
        responseProcessor,
        true,
      );
    }),
  );

export const createSourceEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.createSource.match),
    map(({ payload }) => ({
      payload,
      appName: ApplicationSelectors.selectApplicationName(state$.value),
      sources: BuilderSelectors.selectSources(state$.value),
    })),
    concatMap(({ payload, appName }) => {
      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);

      if (!mindmapFolder) {
        return EMPTY;
      }

      const optimisticActions: UnknownAction[] = [HistoryActions.setIsUndo(true), HistoryActions.setIsRedo(false)];

      const responseProcessor = (resp: Response) =>
        from(resp.json()).pipe(
          concatMap((response: Source) => {
            const sources = BuilderSelectors.selectSources(state$.value);
            const sourcesNames = BuilderSelectors.selectSourcesNames(state$.value);

            return concat(
              of(BuilderActions.setSources([...sources, response])),
              of(BuilderActions.setSourcesNames({ ...sourcesNames, [response.id!]: payload.name })),
              of(BuilderActions.sourceStatusSubscribe({ sourceId: response.id!, versionId: response.version! })),
            );
          }),
        );

      const formData = new FormData();
      if (payload.file) {
        formData.append('file', payload.file);
      } else if (payload.link) {
        formData.append('link', payload.link);
      }

      formData.append('name', payload.name);

      return handleRequest(
        `/api/mindmaps/${encodeURIComponent(appName)}/documents`,
        {
          method: HTTPMethod.POST,
          body: formData,
          headers: { [MindmapUrlHeaderName]: mindmapFolder },
        },
        state$,
        optimisticActions,
        [],
        [UIActions.showErrorToast('Failed to add source')],
        responseProcessor,
        true,
      );
    }),
  );

export const createSourceVersionEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.createSourceVersion.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
      sources: BuilderSelectors.selectSources(state$.value),
    })),
    concatMap(({ payload, name, sources }) => {
      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);

      if (!mindmapFolder) {
        return EMPTY;
      }

      const optimisticActions: UnknownAction[] = [HistoryActions.setIsUndo(true), HistoryActions.setIsRedo(false)];

      const tempId = uuidv4();

      const type = payload.file ? SourceType.FILE : SourceType.LINK;
      const url = payload.file ? payload.file.name : (payload.link ?? '');

      const updatedSources = sources.reduce((acc: Source[], source) => {
        if (source.id === payload.sourceId && source.active) {
          return [
            ...acc,
            { ...source, active: false },
            { url, type, name: url, id: tempId, active: true, status: SourceStatus.INPROGRESS },
          ];
        }
        return [...acc, source];
      }, []);
      optimisticActions.push(BuilderActions.setSources(updatedSources));

      const responseProcessor = (resp: Response) =>
        from(resp.json()).pipe(
          concatMap((response: Source) => {
            const sources = BuilderSelectors.selectSources(state$.value);
            const updated = sources.reduce((acc: Source[], source) => {
              if (source.id === tempId) {
                return [...acc, response];
              }
              return [...acc, source];
            }, []);

            return concat(
              of(BuilderActions.setSources(updated)),
              of(BuilderActions.sourceStatusSubscribe({ sourceId: response.id!, versionId: response.version! })),
            );
          }),
        );

      const formData = new FormData();
      if (payload.file) {
        formData.append('file', payload.file);
      } else if (payload.link) {
        formData.append('link', payload.link);
      }

      return handleRequest(
        `/api/mindmaps/${encodeURIComponent(name)}/documents/${payload.sourceId}/versions`,
        {
          method: HTTPMethod.POST,
          body: formData,
          headers: { [MindmapUrlHeaderName]: mindmapFolder },
        },
        state$,
        optimisticActions,
        [],
        [UIActions.showErrorToast('Failed to add source')],
        responseProcessor,
        true,
      );
    }),
  );

export const recreateSourceVersionEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.recreateSourceVersion.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
      sources: BuilderSelectors.selectSources(state$.value),
    })),
    concatMap(({ payload, name, sources }) => {
      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);

      if (!mindmapFolder) {
        return EMPTY;
      }

      const optimisticActions: UnknownAction[] = [HistoryActions.setIsUndo(true), HistoryActions.setIsRedo(false)];

      const type = payload.file ? SourceType.FILE : SourceType.LINK;
      const url = payload.file ? payload.file.name : (payload.link ?? '');

      const updatedSources = sources.reduce((acc: Source[], source) => {
        if (source.id === payload.sourceId && source.version === payload.versionId) {
          return [
            ...acc,
            {
              url,
              type,
              name: url,
              id: payload.sourceId,
              version: payload.versionId,
              active: true,
              status: SourceStatus.INPROGRESS,
            },
          ];
        }
        return [...acc, source];
      }, []);
      optimisticActions.push(BuilderActions.setSources(updatedSources));

      const responseProcessor = (resp: Response) =>
        from(resp.json()).pipe(
          concatMap((response: Source) => {
            const sources = BuilderSelectors.selectSources(state$.value);
            const updatedSources = sources.reduce((acc: Source[], source) => {
              if (source.id === payload.sourceId && source.version === payload.versionId) {
                return [...acc, response];
              }
              return [...acc, source];
            }, []);

            return concat(
              of(BuilderActions.setSources(updatedSources)),
              of(BuilderActions.sourceStatusSubscribe({ sourceId: response.id!, versionId: response.version! })),
            );
          }),
        );

      const formData = new FormData();
      if (payload.file) {
        formData.append('file', payload.file);
      } else if (payload.link) {
        formData.append('link', payload.link);
      }

      return handleRequest(
        `/api/mindmaps/${encodeURIComponent(name)}/documents/${payload.sourceId}/versions/${payload.versionId}`,
        {
          method: HTTPMethod.POST,
          body: formData,
          headers: { [MindmapUrlHeaderName]: mindmapFolder },
        },
        state$,
        optimisticActions,
        [],
        [UIActions.showErrorToast('Failed to add source')],
        responseProcessor,
        true,
      );
    }),
  );

export const updateSourceEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.updateSource.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
      sources: BuilderSelectors.selectSources(state$.value),
    })),
    concatMap(({ payload, name, sources }) => {
      const updatedSources = sources.map(s => (s.id === payload.id ? { ...payload, status: undefined } : s));

      const optimisticActions = [
        BuilderActions.setSources(updatedSources),
        HistoryActions.setIsUndo(true),
        HistoryActions.setIsRedo(false),
      ];

      const errorActions = [UIActions.showErrorToast('Failed to update source'), BuilderActions.setSources(sources)];

      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);
      if (!mindmapFolder) {
        return EMPTY;
      }

      const responseProcessor = (resp: Response) =>
        from(resp.json()).pipe(
          map((serverSource: Source) =>
            BuilderActions.setSources(sources.map(s => (s.id === serverSource.id ? serverSource : s))),
          ),
        );

      return handleRequest(
        `/api/mindmaps/${encodeURIComponent(name)}/documents/${payload.id}`,
        {
          method: HTTPMethod.PUT,
          headers: { [MindmapUrlHeaderName]: mindmapFolder },
          body: JSON.stringify({
            url: payload.url,
            type: payload.type,
          }),
        },
        state$,
        optimisticActions,
        [],
        errorActions,
        responseProcessor,
      );
    }),
  );

export const downloadSourceEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.downloadSource.match),
    mergeMap(({ payload }) => {
      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);
      if (!mindmapFolder) {
        return EMPTY;
      }

      const appName = ApplicationSelectors.selectApplicationName(state$.value);
      const { sourceId, versionId, name } = payload;

      return fromFetch(
        `/api/mindmaps/${encodeURIComponent(appName)}/documents/${sourceId}/versions/${versionId}/file`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            [MindmapUrlHeaderName]: mindmapFolder,
          },
        },
      ).pipe(
        switchMap(response => {
          if (!response.ok) {
            console.error('Failed to fetch file');
            return of(UIActions.showErrorToast('Failed to download the source'));
          }

          return from(response.blob()).pipe(
            mergeMap(blob => {
              const fileName = name?.split('/').at(-1);
              if (!fileName) {
                console.debug('Empty file name for: ', JSON.stringify(payload));
              }
              saveAs(blob, fileName);
              return EMPTY;
            }),
          );
        }),
        catchError(error => {
          console.error('Error downloading file:', error);
          return of(UIActions.showErrorToast('Failed to download the source'));
        }),
      );
    }),
  );

export const setActiveSourceVersionEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.setActiveSourceVersion.match),
    map(({ payload }) => ({
      payload,
      appName: ApplicationSelectors.selectApplicationName(state$.value),
      sources: BuilderSelectors.selectSources(state$.value),
    })),
    concatMap(({ payload, appName, sources }) => {
      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);

      if (!mindmapFolder) {
        return EMPTY;
      }

      const { sourceId, versionId } = payload;

      const optimisticActions: UnknownAction[] = [HistoryActions.setIsUndo(true), HistoryActions.setIsRedo(false)];

      let targetVersionStatus: SourceStatus | undefined;

      const updatedSources = sources.reduce((acc: Source[], source) => {
        if (source.id === payload.sourceId && source.version === payload.versionId) {
          targetVersionStatus = source.status;
          return [...acc, { ...source, status: SourceStatus.INPROGRESS }];
        }
        return [...acc, source];
      }, []);

      optimisticActions.push(BuilderActions.setSources(updatedSources));

      const responseProcessor = (resp: Response) =>
        from(resp.text()).pipe(
          concatMap(() => {
            const sources = BuilderSelectors.selectSources(state$.value);
            const updatedSources = sources.reduce((acc: Source[], source) => {
              if (source.id === payload.sourceId) {
                if (source.active) {
                  return [...acc, { ...source, active: false }];
                } else if (source.version === payload.versionId) {
                  const updatedSource = { ...source, active: true };
                  if (targetVersionStatus) {
                    updatedSource.status = targetVersionStatus;
                  }
                  return [...acc, updatedSource];
                }
              }
              return [...acc, source];
            }, []);

            return concat(of(BuilderActions.setSources(updatedSources)));
          }),
        );

      const failureActions: UnknownAction[] = [UIActions.showErrorToast('Failed to update the active source version')];

      if (targetVersionStatus) {
        const failureSourcesUpdate = sources.reduce((acc: Source[], source) => {
          if (source.id === payload.sourceId && source.version === payload.versionId) {
            return [...acc, { ...source, status: targetVersionStatus }];
          }
          return [...acc, source];
        }, []);
        failureActions.push(BuilderActions.setSources(failureSourcesUpdate));
      }

      return handleRequest(
        `/api/mindmaps/${encodeURIComponent(appName)}/documents/${sourceId}/versions/${versionId}/active`,
        {
          method: HTTPMethod.POST,
          headers: { [MindmapUrlHeaderName]: mindmapFolder },
        },
        state$,
        optimisticActions,
        [],
        failureActions,
        responseProcessor,
      );
    }),
  );
