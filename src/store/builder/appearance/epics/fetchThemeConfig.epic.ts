import { concatMap, filter, from, of } from 'rxjs';

import { ThemeConfig } from '@/types/customization';
import { HTTPMethod } from '@/types/http';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { UIActions } from '../../ui/ui.reducers';
import { handleRequest } from '../../utils/handleRequest';
import { AppearanceActions } from '../appearance.reducers';

export const fetchThemeConfigEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(AppearanceActions.fetchThemeConfig.match),
    concatMap(({ payload }) => {
      const name = ApplicationSelectors.selectApplicationName(state$.value);

      const responseProcessor = (resp: Response) =>
        from(resp.json()).pipe(
          concatMap((response: ThemeConfig) => {
            return of(AppearanceActions.setThemeConfig(response), AppearanceActions.fetchThemeConfigFinished(response));
          }),
        );

      return handleRequest({
        url: `/api/mindmaps/${encodeURIComponent(name)}/appearances/themes/${payload.theme}`,
        options: { method: HTTPMethod.GET },
        state$,
        responseProcessor,
        failureActions: [
          UIActions.showErrorToast(`Unable to fetch the theme. Please refresh or try again later.`),
          AppearanceActions.fetchThemeConfigFinished(undefined),
        ],
      });
    }),
  );
