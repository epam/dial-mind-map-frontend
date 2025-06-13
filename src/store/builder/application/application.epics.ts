import { UnknownAction } from '@reduxjs/toolkit';
import { combineEpics } from 'redux-observable';
import { catchError, filter, from, map, mergeMap, of, switchMap, tap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { Application } from '@/types/application';
import { BuilderRootEpic } from '@/types/store';
import { generateMindmapFolderPath } from '@/utils/app/application';

import { BuilderActions } from '../builder/builder.reducers';
import { HistoryActions } from '../history/history.reducers';
import { UISelectors } from '../ui/ui.reducers';
import { checkForUnauthorized } from '../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../utils/globalCatchUnauthorized';
import { ApplicationActions, ApplicationSelectors } from './application.reducer';

const fetchApplicationEpic: BuilderRootEpic = action$ =>
  action$.pipe(
    filter(ApplicationActions.fetchApplicationStart.match),
    switchMap(({ payload: applicationId }) =>
      fromFetch(`/api/${applicationId}`, { method: 'GET' }).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
        switchMap(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch application: ${response.status}`);
          }
          return response.json();
        }),
        mergeMap((data: Application) => {
          const actions: UnknownAction[] = [
            ApplicationActions.fetchApplicationSuccess(data),
            BuilderActions.initSources({ name: data.name ?? data.application ?? '' }),
            HistoryActions.fetchUndoRedo(),
          ];

          // If mindmap_folder is not set, trigger an update
          if (!data.application_properties?.mindmap_folder) {
            actions.push(ApplicationActions.updateApplication({ name: data.name ?? '' }));
          }

          return from(actions);
        }),
        globalCatchUnauthorized(),
        catchError((error: Error) => of(ApplicationActions.fetchApplicationFailure(error.message))),
      ),
    ),
  );

const updateApplicationEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ApplicationActions.updateApplication.match),
    map(() => ({
      application: ApplicationSelectors.selectApplication(state$.value),
    })),
    switchMap(({ application }) => {
      if (!application) {
        return of(ApplicationActions.updateApplicationFailure('No application found'));
      }

      const mindmapFolderPath = generateMindmapFolderPath(application);
      const newApplication: Application = {
        ...application,
        application_properties: {
          mindmap_folder: mindmapFolderPath,
        },
      };

      return fromFetch(`/api/${newApplication.name}`, {
        method: 'PUT',
        body: JSON.stringify(newApplication),
      }).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
        switchMap(response => {
          if (!response.ok) {
            throw new Error(`Failed to update application: ${response.status}`);
          }
          return response.json();
        }),
        mergeMap(() => {
          return of(ApplicationActions.updateApplicationSuccess(newApplication));
        }),
        tap(action => {
          if (action.type === ApplicationActions.updateApplicationSuccess.type) {
            const dialHost = UISelectors.selectDialChatHost(state$.value);
            const mindmapIframeTitle = UISelectors.selectMindmapIframeTitle(state$.value);
            window?.parent.postMessage(
              {
                type: `${mindmapIframeTitle}/UPDATED_APPLICATION_SUCCESS`,
                payload: { application: newApplication },
              },
              dialHost,
            );
          }
        }),
        globalCatchUnauthorized(),
        catchError((error: Error) => of(ApplicationActions.updateApplicationFailure(error.message))),
      );
    }),
  );

export const ApplicationEpics = combineEpics(fetchApplicationEpic, updateApplicationEpic);
