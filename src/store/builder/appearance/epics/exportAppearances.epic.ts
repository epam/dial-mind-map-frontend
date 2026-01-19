import { saveAs } from 'file-saver';
import { from, of } from 'rxjs';
import { catchError, concatMap, filter, mergeMap } from 'rxjs/operators';

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
      const name = ApplicationSelectors.selectApplicationName(state$.value);
      const applicationDisplayName = ApplicationSelectors.selectApplicationDisplayName(state$.value);

      return from(
        fetch(`/api/mindmaps/${encodeURIComponent(name)}/appearances/export`, {
          method: HTTPMethod.GET,
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
