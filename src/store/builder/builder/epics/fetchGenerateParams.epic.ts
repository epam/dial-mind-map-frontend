import { concatMap, EMPTY, filter, from, of } from 'rxjs';

import { MindmapUrlHeaderName } from '@/constants/http';
import { GenerateParams } from '@/types/generate';
import { HTTPMethod } from '@/types/http';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { UIActions } from '../../ui/ui.reducers';
import { handleRequestNew } from '../../utils/handleRequest';
import { BuilderActions } from '../builder.reducers';

export const fetchGenerateParamsEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.fetchGenerateParams.match),
    concatMap(() => {
      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);

      if (!mindmapFolder) {
        return EMPTY;
      }

      const name = ApplicationSelectors.selectApplicationName(state$.value);

      const responseProcessor = (resp: Response) =>
        from(resp.json()).pipe(
          concatMap((response: GenerateParams) => {
            return of(BuilderActions.setGenerateParams(response));
          }),
        );

      return handleRequestNew({
        url: `/api/mindmaps/${encodeURIComponent(name)}/generate/params`,
        options: { method: HTTPMethod.GET, headers: { [MindmapUrlHeaderName]: mindmapFolder } },
        state$,
        responseProcessor,
        failureActions: [UIActions.showErrorToast(`Failed to fetch generation parameters`)],
      });
    }),
  );
