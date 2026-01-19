import { from, of } from 'rxjs';
import { catchError, concatMap, filter, mergeMap } from 'rxjs/operators';

import { HTTPMethod } from '@/types/http';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { UIActions } from '../../ui/ui.reducers';
import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../../utils/globalCatchUnauthorized';
import { AppearanceActions } from '../appearance.reducers';

export const importAppearancesEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(AppearanceActions.importAppearances.match),
    concatMap(({ payload }) => {
      const name = ApplicationSelectors.selectApplicationName(state$.value);

      const form = new FormData();
      form.append('file', payload.file);

      return from(
        fetch(`/api/mindmaps/${encodeURIComponent(name)}/appearances`, {
          method: HTTPMethod.POST,
          body: form,
        }),
      ).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
        concatMap(async resp => {
          if (!resp.ok) {
            const text = await resp.text();
            throw new Error(text || resp.statusText);
          }
          return AppearanceActions.importAppearancesSuccess();
        }),
        globalCatchUnauthorized(),
        catchError(err =>
          of(
            UIActions.showErrorToast('Import appearances failed'),
            AppearanceActions.importAppearancesFailure(err.message),
          ),
        ),
      );
    }),
  );
