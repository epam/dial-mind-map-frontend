import { saveAs } from 'file-saver';
import { combineEpics } from 'redux-observable';
import { catchError, EMPTY, filter, from, mergeMap, of, switchMap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { ChatRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../application/application.reducer';
import { ChatUIActions } from '../ui/ui.reducers';
import { ReferenceActions } from './reference.reducers';

const downloadReferenceEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ReferenceActions.downloadSource.match),
    mergeMap(({ payload }) => {
      const appName = ApplicationSelectors.selectApplicationName(state$.value);
      const { sourceId, versionId, name } = payload;

      return fromFetch(
        `/api/mindmaps/${encodeURIComponent(appName)}/documents/${sourceId}/versions/${versionId}/file`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ).pipe(
        switchMap(response => {
          if (!response.ok) {
            console.error('Failed to fetch file');
            return of(ChatUIActions.showErrorToast('Failed to download the source'));
          }

          return from(response.blob()).pipe(
            mergeMap(blob => {
              const fileName = name?.split('/').at(-1);
              saveAs(blob, fileName);
              return EMPTY;
            }),
          );
        }),
        catchError(error => {
          console.error('Error downloading file:', error);
          return of(ChatUIActions.showErrorToast('Failed to download the source'));
        }),
      );
    }),
  );

export const ReferenceEpics = combineEpics(downloadReferenceEpic);
