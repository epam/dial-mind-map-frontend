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
import { AppearanceActions } from '../appearance.reducers';

export const exportAppearancesEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(AppearanceActions.exportAppearances.match),
    concatMap(() => {
      const folder = ApplicationSelectors.selectMindmapFolder(state$.value);
      const name = ApplicationSelectors.selectApplicationName(state$.value);
      const applicationDisplayName = ApplicationSelectors.selectApplicationDisplayName(state$.value);
      if (!folder) return EMPTY;

      return from(
        fetch(`/api/mindmaps/${encodeURIComponent(name)}/appearances/export`, {
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
          const fileName = `${applicationDisplayName}-appearances.zip`;
          saveAs(blob, fileName);
          return AppearanceActions.exportAppearancesSuccess();
        }),
        globalCatchUnauthorized(),
        catchError(err =>
          of(
            UIActions.showErrorToast('Export appearances failed'),
            AppearanceActions.exportAppearancesFailure(err.message),
          ),
        ),
      );
    }),
  );
