import { combineEpics } from 'redux-observable';
import { catchError, concat, EMPTY, filter, from, ignoreElements, map, mergeMap, of, switchMap, take, tap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { Application } from '@/types/application';
import { BuilderRootEpic } from '@/types/store';
import { getAppPathWithEncodedAppName } from '@/utils/app/application';

import { AppearanceActions } from '../appearance/appearance.reducers';
import { HistoryActions } from '../history/history.reducers';
import { SourcesActions } from '../sources/sources.reducers';
import { UISelectors } from '../ui/ui.reducers';
import { checkForUnauthorized } from '../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../utils/globalCatchUnauthorized';
import { ApplicationActions, ApplicationSelectors } from './application.reducer';

const fetchApplicationEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ApplicationActions.fetchApplicationStart.match),
    switchMap(({ payload: applicationId }) =>
      fromFetch(`/api/${getAppPathWithEncodedAppName(applicationId)}`, { method: 'GET' }).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
        switchMap(response => {
          return response.json();
        }),
        switchMap((data: Application) => {
          const theme = UISelectors.selectTheme(state$.value);
          const needsUpdate = !data.application_properties;

          return concat(
            of(ApplicationActions.fetchApplicationSuccess(data)),
            needsUpdate
              ? concat(
                  of(ApplicationActions.updateApplication({ name: data.name ?? data.application ?? '' })),
                  action$.pipe(filter(ApplicationActions.updateApplicationSuccess.match), take(1), ignoreElements()),
                )
              : EMPTY,
            from([
              SourcesActions.initSources({ name: data.name ?? data.application ?? '' }),
              HistoryActions.fetchUndoRedo(),
              AppearanceActions.initTheme({ theme }),
            ]),
            action$.pipe(
              filter(AppearanceActions.fetchThemeConfigFinished.match),
              take(1),
              map(() => ApplicationActions.setIsApplicationReady(true)),
            ),
          );
        }),
        globalCatchUnauthorized(),
        catchError((error: Error) =>
          of(ApplicationActions.fetchApplicationFailure(error.message), ApplicationActions.setIsApplicationReady(true)),
        ),
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

      const newApplication: Application = {
        ...application,
      };

      if (!newApplication.application_properties) {
        newApplication.application_properties = {};
      }

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
            const mindmapIframeTitle = UISelectors.selectMindmapIframeTitle(state$.value);
            window?.parent.postMessage(
              {
                type: `${mindmapIframeTitle}/UPDATED_APPLICATION_SUCCESS`,
                payload: { application: newApplication },
              },
              '*',
            );
          }
        }),
        globalCatchUnauthorized(),
        catchError((error: Error) => of(ApplicationActions.updateApplicationFailure(error.message))),
      );
    }),
  );

export const ApplicationEpics = combineEpics(fetchApplicationEpic, updateApplicationEpic);
