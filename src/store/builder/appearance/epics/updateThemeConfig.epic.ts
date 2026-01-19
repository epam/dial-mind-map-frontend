import { filter, from, merge, of } from 'rxjs';
import { catchError, concatMap, debounceTime, map, share } from 'rxjs/operators';

import { EtagHeaderName } from '@/constants/http';
import { HTTPMethod } from '@/types/http';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { BuilderActions } from '../../builder/builder.reducers';
import { UIActions } from '../../ui/ui.reducers';
import { handleRequest } from '../../utils/handleRequest';
import { AppearanceActions, AppearanceSelectors } from '../appearance.reducers';

export const updateThemeConfigEpic: BuilderRootEpic = (action$, state$) => {
  const updates$ = action$.pipe(filter(AppearanceActions.updateThemeConfig.match), share());

  const immediateUpdate$ = updates$.pipe(map(action => AppearanceActions.setThemeConfig(action.payload.config)));

  const serverUpdate$ = updates$.pipe(
    debounceTime(500),
    concatMap(() => {
      const appName = ApplicationSelectors.selectApplicationName(state$.value);
      const theme = state$.value.ui.theme;
      const config = AppearanceSelectors.selectThemeConfig(state$.value);

      const responseProcessor = (resp: Response) =>
        from(resp.json()).pipe(map(() => BuilderActions.setEtag(resp.headers.get(EtagHeaderName))));

      return handleRequest({
        url: `/api/mindmaps/${encodeURIComponent(appName)}/appearances/themes/${theme}`,
        options: {
          method: HTTPMethod.POST,
          body: JSON.stringify(config),
        },
        state$,
        responseProcessor,
        failureActions: [UIActions.showErrorToast(`Unable to update the theme. Please refresh or try again later.`)],
      }).pipe(catchError(err => of(UIActions.showErrorToast(`Failed to update theme: ${err.message}`))));
    }),
  );

  return merge(immediateUpdate$, serverUpdate$);
};
