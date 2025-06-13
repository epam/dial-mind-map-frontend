import { Action, UnknownAction } from 'redux';
import { catchError, concat, filter, from, mergeMap, Observable, of, race, take, throwError } from 'rxjs';

import { MindmapUrlHeaderName } from '@/constants/http';
import { GenerationStatus } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';
import { generateMindmapFolderPath } from '@/utils/app/application';

import { ApplicationActions, ApplicationSelectors } from '../../application/application.reducer';
import { FilesActions } from '../../files/files.reducers';
import { UIActions } from '../../ui/ui.reducers';
import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../../utils/globalCatchUnauthorized';
import { BuilderActions } from '../builder.reducers';

export const generateMindmapEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.generateMindmap.match),
    mergeMap(({ payload }) => {
      const waitForUpdateSuccess = action$.pipe(filter(ApplicationActions.updateApplicationSuccess.match), take(1));
      const waitForUpdateFailure = action$.pipe(filter(FilesActions.uploadFileFail.match), take(1));

      const actions: Observable<UnknownAction>[] = [
        of(ApplicationActions.updateApplication(payload)),
        of(BuilderActions.setGenerationStatus(GenerationStatus.IN_PROGRESS)),
      ];

      if (payload.sources) {
        actions.push(of(BuilderActions.setSources(payload.sources)));
      }

      return concat(
        ...actions,
        race(waitForUpdateSuccess, waitForUpdateFailure).pipe(
          mergeMap((action: Action) => {
            if (action.type === ApplicationActions.updateApplicationFailure.type) {
              return of(UIActions.showErrorToast('Failed to update application. Mindmap generation failed'));
            }

            const application = ApplicationSelectors.selectApplication(state$.value);
            const mindmapFolder = generateMindmapFolderPath(application);

            return from(
              fetch(`/api/mindmaps/${encodeURIComponent(payload.name)}/generate`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  [MindmapUrlHeaderName]: mindmapFolder,
                },
                body:
                  payload.applySources &&
                  JSON.stringify({
                    sources: payload.applySources,
                  }),
              }),
            ).pipe(
              mergeMap(resp => checkForUnauthorized(resp)),
              mergeMap(resp => {
                if (resp.status === 200) {
                  return concat(of(BuilderActions.generationStatusSubscribe()));
                }
                return throwError(() => new Error('Mindmap generation failed'));
              }),
              globalCatchUnauthorized(),
              catchError(() => {
                return of(UIActions.showErrorToast('Failed to generate mindmap'));
              }),
            );
          }),
        ),
      );
    }),
  );
