import cssEscape from 'css.escape';
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
import { fromFetch } from 'rxjs/fetch';

import { updatePersistentFontPreloader } from '@/components/common/PersistentFontPreloader/util/updatePersistentFontPreloader';
import { CustomStylesTagId } from '@/constants/app';
import { ThemeConfig } from '@/types/customization';
import { ChatRootEpic } from '@/types/store';
import { isWebFontLoaded } from '@/utils/app/fonts';
import { getAppearanceFileUrl } from '@/utils/app/themes';
import { isAbortError, isNetworkError } from '@/utils/common/error';
import { mapThemeConfigToStyles } from '@/utils/common/themeUtils';

import { ApplicationSelectors } from '../application/application.reducer';
import { ChatUIActions, ChatUISelectors } from '../ui/ui.reducers';
import { checkForUnauthorized } from '../utils/checkForUnauthorized';
import { globalCatchChatUnauthorized } from '../utils/globalCatchUnauthorized';
import { AppearanceActions, AppearanceSelectors } from './appearance.reducers';

const setThemeConfigEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(AppearanceActions.setThemeConfig.match),
    switchMap(({ payload }) => {
      if (payload?.colors) {
        for (const [key, value] of Object.entries(payload.colors)) {
          document.documentElement.style.setProperty(`--${cssEscape(key)}`, value);
        }
      }

      const theme = ChatUISelectors.selectThemeName(state$.value);

      const styles = mapThemeConfigToStyles(theme, payload);
      const stylesTag = document.getElementById(CustomStylesTagId);
      if (stylesTag) {
        stylesTag.innerHTML = styles;
      }

      const currentFontFamily = document.documentElement.style.getPropertyValue('--font-family');
      const newFontFamily = payload.font?.['font-family'];

      const currentGraphFontFamily = document.documentElement.style.getPropertyValue('--graph-font-family');
      const newGraphFontFamily = payload.graph.font?.['font-family'];

      if (newGraphFontFamily && newGraphFontFamily !== newFontFamily && newGraphFontFamily !== currentGraphFontFamily) {
        let fontUrl = '';
        if (payload.graph.font?.fontFileName) {
          const appName = ApplicationSelectors.selectApplicationName(state$.value);

          fontUrl = getAppearanceFileUrl(appName, theme, payload.graph.font?.fontFileName);
        } else if (!isWebFontLoaded(newGraphFontFamily)) {
          fontUrl = `https://fonts.googleapis.com/css2?family=${newGraphFontFamily}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
        }

        if (fontUrl) {
          if (payload.graph.font?.fontFileName) {
            const fontFace = new FontFace(newGraphFontFamily, `url("${fontUrl}")`);

            fontFace
              .load()
              .then(loadedFontFace => {
                document.fonts.add(loadedFontFace);
                document.documentElement.style.setProperty('--graph-font-family', newGraphFontFamily);
              })
              .catch(err => {
                console.error('Failed to load custom font:', err);
              });
          } else {
            const fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.href = fontUrl;
            document.head.appendChild(fontLink);
            document.documentElement.style.setProperty('--graph-font-family', newGraphFontFamily);
            updatePersistentFontPreloader(newGraphFontFamily, { weight: 600 });
          }
        }
      }

      if (newFontFamily && newFontFamily !== currentFontFamily) {
        let fontUrl = '';
        if (payload.font?.fontFileName) {
          const appName = ApplicationSelectors.selectApplicationName(state$.value);

          fontUrl = getAppearanceFileUrl(appName, theme, payload.font?.fontFileName);
        } else if (!isWebFontLoaded(newFontFamily)) {
          fontUrl = `https://fonts.googleapis.com/css2?family=${newFontFamily}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
        }

        if (fontUrl) {
          if (payload.font?.fontFileName) {
            const fontFace = new FontFace(newFontFamily, `url("${fontUrl}")`);

            fontFace
              .load()
              .then(loadedFontFace => {
                document.fonts.add(loadedFontFace);
                document.documentElement.style.setProperty('--font-family', newFontFamily);
                document.documentElement.style.fontFamily = newFontFamily;
              })
              .catch(err => {
                console.error('Failed to load custom font:', err);
              });
          } else {
            const fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.href = fontUrl;
            document.head.appendChild(fontLink);

            document.documentElement.style.setProperty('--font-family', newFontFamily);
            document.documentElement.style.fontFamily = newFontFamily;
          }
        }
      }

      return EMPTY;
    }),
  );

const initThemeEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(AppearanceActions.initTheme.match),
    switchMap(() => {
      const etag = ApplicationSelectors.selectEtag(state$.value);
      const config = AppearanceSelectors.selectThemeConfig(state$.value);

      if (config && Object.keys(config).length && etag) {
        return of(AppearanceActions.subscribeOnTheme());
      }

      return concat(of(AppearanceActions.fetchThemeConfig()), of(AppearanceActions.subscribeOnTheme()));
    }),
  );

const fetchThemeConfigEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(AppearanceActions.fetchThemeConfig.match),
    concatMap(() => {
      const name = ApplicationSelectors.selectApplicationName(state$.value);
      const theme = ChatUISelectors.selectThemeName(state$.value);

      return fromFetch(`/api/mindmaps/${encodeURIComponent(name)}/appearances/themes/${theme}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }).pipe(
        switchMap((response: Response) => {
          const currentTheme = AppearanceSelectors.selectThemeConfig(state$.value);

          if (!response.ok) {
            console.warn('Failed to fetch the theme');
            return EMPTY;
          }
          return from(response.json()).pipe(
            mergeMap((resp: ThemeConfig) => {
              if (isEqual(currentTheme, resp)) {
                return EMPTY;
              }
              return of(AppearanceActions.setThemeConfig(resp));
            }),
          );
        }),
        catchError(error => {
          console.error('Error downloading theme:', error);
          return of(ChatUIActions.showErrorToast('Failed to download the theme'));
        }),
      );
    }),
  );

const subscribeOnThemeEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(AppearanceActions.subscribeOnTheme.match),
    concatMap(() => {
      const appPath = ApplicationSelectors.selectEncodedApplicationPath(state$.value);
      const theme = ChatUISelectors.selectThemeName(state$.value);
      const controller = new AbortController();

      return from(
        fetch(`/api/mindmaps/${appPath}/appearances/themes/${theme}/events`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      ).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
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
                // Expected close/unsubscribe
                return EMPTY;
              }
              console.warn('SSE error:', error);
              return EMPTY;
            }),
          );
        }),
        globalCatchChatUnauthorized(),
        catchError(error => {
          console.warn('Theme subscription error:', error);
          return EMPTY;
        }),
      );
    }),
  );

export const AppearanceEpics = combineEpics(
  fetchThemeConfigEpic,
  subscribeOnThemeEpic,
  setThemeConfigEpic,
  initThemeEpic,
);
