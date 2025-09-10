import { EMPTY, filter, from, merge, of } from 'rxjs';
import { catchError, concatMap, debounceTime, map, share } from 'rxjs/operators';

import { EtagHeaderName, MindmapUrlHeaderName } from '@/constants/http';
import { HTTPMethod } from '@/types/http';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { BuilderActions, BuilderSelectors } from '../../builder/builder.reducers';
import { UIActions } from '../../ui/ui.reducers';
import { handleRequestNew } from '../../utils/handleRequest';

export const updateGenerateParamsEpic: BuilderRootEpic = (action$, state$) => {
  const updates$ = action$.pipe(filter(BuilderActions.updateGenerateParams.match), share());

  const immediateUpdate$ = updates$.pipe(map(action => BuilderActions.setGenerateParams(action.payload)));

  const serverUpdate$ = updates$.pipe(
    debounceTime(500),
    concatMap(() => {
      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);
      if (!mindmapFolder) return EMPTY;

      const appName = ApplicationSelectors.selectApplicationName(state$.value);
      const config = BuilderSelectors.selectGenerateParams(state$.value);

      const responseProcessor = (resp: Response) =>
        from(resp.json()).pipe(map(() => BuilderActions.setEtag(resp.headers.get(EtagHeaderName))));

      return handleRequestNew({
        url: `/api/mindmaps/${encodeURIComponent(appName)}/generate/params`,
        options: {
          method: HTTPMethod.POST,
          headers: { [MindmapUrlHeaderName]: mindmapFolder },
          body: JSON.stringify(config),
        },
        state$,
        responseProcessor,
        failureActions: [UIActions.showErrorToast(`Failed to update generation parameters`)],
      }).pipe(
        catchError(err => of(UIActions.showErrorToast(`Failed to update generation parameters: ${err.message}`))),
      );
    }),
  );

  return merge(immediateUpdate$, serverUpdate$);
};
