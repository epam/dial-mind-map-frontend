import { saveAs } from 'file-saver';
import { EMPTY, from, of } from 'rxjs';
import { catchError, concatMap, filter, mergeMap } from 'rxjs/operators';

import { MindmapUrlHeaderName } from '@/constants/http';
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
      const folder = ApplicationSelectors.selectMindmapFolder(state$.value);
      const name = ApplicationSelectors.selectApplicationName(state$.value);
      const applicationDisplayName = ApplicationSelectors.selectApplicationDisplayName(state$.value);
      if (!folder) return EMPTY;

      return from(
        fetch(`/api/mindmaps/${encodeURIComponent(name)}/sources/export`, {
          method: HTTPMethod.GET,
          headers: { [MindmapUrlHeaderName]: folder },
        }),
      ).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
        concatMap(async resp => {
          if (!resp.ok) {
            const text = await resp.text();
            throw new Error(text || resp.statusText);
          }
          const blob = await resp.blob();
          const fileName = `${applicationDisplayName}.zip`;
          saveAs(blob, fileName);
          return BuilderActions.exportMindmapSuccess();
        }),
        globalCatchUnauthorized(),
        catchError(err =>
          of(UIActions.showErrorToast('Export mindmap failed'), BuilderActions.exportMindmapFailure(err.message)),
        ),
      );
    }),
  );
