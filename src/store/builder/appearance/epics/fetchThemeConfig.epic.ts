import { concatMap, EMPTY, filter, from, of } from 'rxjs';

import { MindmapUrlHeaderName } from '@/constants/http';
import { ThemeConfig } from '@/types/customization';
import { HTTPMethod } from '@/types/http';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { UIActions } from '../../ui/ui.reducers';
import { handleRequestNew } from '../../utils/handleRequest';
import { AppearanceActions } from '../appearance.reducers';

export const fetchThemeConfigEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(AppearanceActions.fetchThemeConfig.match),
    concatMap(({ payload }) => {
      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);

      if (!mindmapFolder) {
        return EMPTY;
      }

      const name = ApplicationSelectors.selectApplicationName(state$.value);

      const responseProcessor = (resp: Response) =>
        from(resp.json()).pipe(
          concatMap((response: ThemeConfig) => {
            return of(AppearanceActions.setThemeConfig(response), AppearanceActions.fetchThemeConfigFinished(response));
          }),
        );

      return handleRequestNew({
        url: `/api/mindmaps/${encodeURIComponent(name)}/appearances/themes/${payload.theme}`,
        options: { method: HTTPMethod.GET, headers: { [MindmapUrlHeaderName]: mindmapFolder } },
        state$,
        responseProcessor,
        failureActions: [
          UIActions.showErrorToast(`Unable to fetch the theme. Please refresh or try again later.`),
          AppearanceActions.fetchThemeConfigFinished(undefined),
        ],
      });
    }),
  );
