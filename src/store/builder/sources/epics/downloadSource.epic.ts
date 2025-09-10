import { saveAs } from 'file-saver';
import { catchError, EMPTY, filter, from, mergeMap, of, switchMap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { MindmapUrlHeaderName } from '@/constants/http';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { UIActions } from '../../ui/ui.reducers';
import { SourcesActions } from '../sources.reducers';

export const downloadSourceEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(SourcesActions.downloadSource.match),
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
