import { UnknownAction } from '@reduxjs/toolkit';
import isEqual from 'lodash-es/isEqual';
import { combineEpics } from 'redux-observable';
import {
  catchError,
  concat,
  concatMap,
  EMPTY,
  filter,
  from,
  fromEvent,
  mergeMap,
  Observable,
  of,
  switchMap,
  takeUntil,
  throwError,
} from 'rxjs';

import { EtagHeaderName } from '@/constants/http';
import { ThemeConfig } from '@/types/customization';
import { HTTPMethod } from '@/types/http';
import { BuilderRootEpic } from '@/types/store';
import { extractPrefixStorageFontFileName } from '@/utils/app/file';
import { isAbortError, isNetworkError } from '@/utils/common/error';

import { ApplicationSelectors } from '../application/application.reducer';
import { BuilderActions } from '../builder/builder.reducers';
import { HistoryActions } from '../history/history.reducers';
import { UIActions, UISelectors } from '../ui/ui.reducers';
import { UploadResourceStatusActions } from '../uploadResourceStatus/uploadResourceStatus.reducers';
import { handleRequest } from '../utils/handleRequest';
import { AppearanceActions, AppearanceSelectors } from './appearance.reducers';
import { exportAppearancesEpic } from './epics/exportAppearances.epic';
import { fetchThemeConfigEpic } from './epics/fetchThemeConfig.epic';
import { importAppearancesEpic } from './epics/importAppearances.epic';
import { updateThemeConfigEpic } from './epics/updateThemeConfig.epic';

export const resetThemeConfigEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(AppearanceActions.resetThemeConfig.match),
    concatMap(({ payload }) => {
      const appName = ApplicationSelectors.selectApplicationName(state$.value);

      return handleRequest({
        url: `/api/mindmaps/${encodeURIComponent(appName)}/appearances/themes/${payload.theme}/reset`,
        options: { method: HTTPMethod.POST },
        state$,
        responseProcessor: resp =>
          from(
            Promise.all([resp.json(), of(resp.headers.get(EtagHeaderName))]).then(([config, etag]) => [config, etag]),
          ).pipe(
            concatMap(([config, etag]) =>
              of(
                AppearanceActions.setThemeConfig(config),
                BuilderActions.setEtag(etag),
                AppearanceActions.setIsResetThemeInProgress(false),
              ),
            ),
          ),
        failureActions: [
          UIActions.showErrorToast(`Unable to reset the theme. Please refresh or try again later.`),
          AppearanceActions.setIsResetThemeInProgress(false),
        ],
      });
    }),
  );

export const initThemeEpic: BuilderRootEpic = action$ =>
  action$.pipe(
    filter(AppearanceActions.initTheme.match),
    switchMap(({ payload }) => {
      return concat(of(AppearanceActions.fetchThemeConfig(payload)), of(AppearanceActions.subscribeOnTheme(payload)));
    }),
  );

const subscribeOnThemeEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(AppearanceActions.subscribeOnTheme.match),
    concatMap(() => {
      const appName = ApplicationSelectors.selectApplicationName(state$.value);
      const theme = UISelectors.selectTheme(state$.value);
      const controller = new AbortController();

      return from(
        fetch(`/api/mindmaps/${encodeURIComponent(appName)}/appearances/themes/${theme}/events`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      ).pipe(
        mergeMap(resp => {
          if (!resp.body) {
            return throwError(() => new Error('ReadableStream not supported'));
          }

          const reader = resp.body.getReader();
          const decoder = new TextDecoder('utf-8');

          const eventObservable = new Observable<string>(observer => {
            const read = async () => {
              try {
                let buffer = '';
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');

                  for (const line of lines) {
                    if (line.startsWith('data:')) {
                      observer.next(line.slice(5).trim());
                    }
                  }

                  buffer = lines[lines.length - 1];
                }
                observer.complete();
              } catch (error: any) {
                if (isAbortError(error) || isNetworkError(error)) {
                  observer.complete();
                  return;
                }
                console.error('SSE read error:', error);
                observer.error(error);
              }
            };

            read();
            return () => {
              controller.abort();
            };
          });

          return eventObservable.pipe(
            takeUntil(fromEvent(window, 'beforeunload')),
            mergeMap(data => {
              const currentThemeConfig = AppearanceSelectors.selectThemeConfig(state$.value);
              const resp = JSON.parse(data) as any;

              if (resp.error) {
                console.warn(`Failed theme config updating: ${resp.error}`);
                return EMPTY;
              }

              const newThemeConfig = resp as ThemeConfig;

              if (!Object.keys(newThemeConfig).length || isEqual(newThemeConfig, currentThemeConfig)) {
                return EMPTY;
              }

              return of(AppearanceActions.setThemeConfig(newThemeConfig));
            }),
            catchError(error => {
              if (isAbortError(error) || isNetworkError(error)) {
                return EMPTY;
              }
              console.warn('SSE error:', error);
              return EMPTY;
            }),
          );
        }),
        catchError(error => {
          console.warn('Theme subscription error:', error);
          return EMPTY;
        }),
      );
    }),
  );

export const uploadResourceEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(AppearanceActions.uploadResource.match),
    concatMap(({ payload }) => {
      const appName = ApplicationSelectors.selectApplicationName(state$.value);
      const theme = UISelectors.selectTheme(state$.value);

      const formData = new FormData();
      formData.append('file', payload.file);

      const optimisticActions: UnknownAction[] = [
        HistoryActions.setIsUndo(true),
        HistoryActions.setIsRedo(false),
        UploadResourceStatusActions.startUpload({ key: payload.type }),
      ];

      const successActions: UnknownAction[] = [UploadResourceStatusActions.uploadSuccess({ key: payload.type })];

      const failureActions: UnknownAction[] = [
        UploadResourceStatusActions.uploadFailure({
          key: payload.type,
          error: 'An unexpected error occurred during upload. Please try again.',
        }),
      ];

      return handleRequest({
        url: `/api/mindmaps/${encodeURIComponent(appName)}/appearances/themes/${theme}/storage/${encodeURIComponent(payload.fileName)}`,
        options: {
          method: HTTPMethod.POST,
          body: formData,
        },
        state$,
        skipContentType: true,
        optimisticActions,
        successActions,
        failureActions,
      });
    }),
  );

export const uploadFontEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(AppearanceActions.uploadFont.match),
    concatMap(({ payload }) => {
      const appName = ApplicationSelectors.selectApplicationName(state$.value);
      const theme = UISelectors.selectTheme(state$.value);

      const formData = new FormData();
      formData.append('file', payload.file);

      const optimisticActions: UnknownAction[] = [
        HistoryActions.setIsUndo(true),
        HistoryActions.setIsRedo(false),
        UploadResourceStatusActions.startUpload({ key: payload.type }),
      ];

      const failureActions: UnknownAction[] = [
        UploadResourceStatusActions.uploadFailure({
          key: payload.type,
          error: 'An unexpected error occurred during upload a font. Please try again.',
        }),
      ];

      const responseProcessor = (resp: Response) =>
        from(resp.json()).pipe(
          concatMap(({ fontFamily }: { fontFamily: string }) => {
            const fontFamilyName = fontFamily || extractPrefixStorageFontFileName(payload.fileName);
            return of(UploadResourceStatusActions.uploadSuccess({ key: payload.type, response: fontFamilyName }));
          }),
        );

      return handleRequest({
        url: `/api/mindmaps/${encodeURIComponent(appName)}/appearances/themes/${theme}/storage/fonts/${encodeURIComponent(payload.fileName)}`,
        options: {
          method: HTTPMethod.POST,
          body: formData,
        },
        state$,
        skipContentType: true,
        optimisticActions,
        failureActions,
        responseProcessor,
      });
    }),
  );

export const AppearanceEpics = combineEpics(
  updateThemeConfigEpic,
  fetchThemeConfigEpic,
  resetThemeConfigEpic,
  subscribeOnThemeEpic,
  initThemeEpic,
  importAppearancesEpic,
  exportAppearancesEpic,
  uploadResourceEpic,
  uploadFontEpic,
);
