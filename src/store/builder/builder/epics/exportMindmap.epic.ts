import { saveAs } from 'file-saver';
import { from, of } from 'rxjs';
import { catchError, concatMap, filter, mergeMap } from 'rxjs/operators';

import { HTTPMethod } from '@/types/http';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { UIActions } from '../../ui/ui.reducers';
import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../../utils/globalCatchUnauthorized';
import { BuilderActions } from '../builder.reducers';

export const exportMindmapEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.exportMindmap.match),
    concatMap(() => {
      const name = ApplicationSelectors.selectApplicationName(state$.value);
      const display = ApplicationSelectors.selectApplicationDisplayName(state$.value);
      const url = `/api/mindmaps/${encodeURIComponent(name)}/sources/export`;

      return from(fetch(url, { method: HTTPMethod.GET })).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
        concatMap(async resp => {
          if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            throw new Error(text || resp.statusText);
          }

          const reader = resp.body?.getReader();
          if (!reader) throw new Error('No response body');

          const chunks: Uint8Array[] = [];

          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
            }
          }

          const size = chunks.reduce((s, c) => s + c.byteLength, 0);
          const merged = new Uint8Array(size);
          let offset = 0;
          for (const c of chunks) {
            merged.set(c, offset);
            offset += c.byteLength;
          }

          const contentType = resp.headers.get('content-type') ?? 'application/zip';
          const blob = new Blob([merged.buffer as ArrayBuffer], { type: contentType });
          saveAs(blob, `${display}.zip`);

          return BuilderActions.exportMindmapSuccess();
        }),
        globalCatchUnauthorized(),
        catchError(error => {
          console.error('exportMindmapEpic Error:', error);
          return of(UIActions.showErrorToast('Export mindmap failed'), BuilderActions.exportMindmapFailure());
        }),
      );
    }),
  );
