import { UnknownAction } from '@reduxjs/toolkit';
import { catchError, concat, filter, from, mergeMap, Observable, of, switchMap, throwError } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { HTTPMethod } from '@/types/http';
import { Model } from '@/types/model';
import { BuilderRootEpic } from '@/types/store';

import { UIActions } from '../../ui/ui.reducers';
import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../../utils/globalCatchUnauthorized';
import { BuilderActions } from '../builder.reducers';

export const fetchModelsEpic: BuilderRootEpic = action$ =>
  action$.pipe(
    filter(BuilderActions.fetchModels.match),
    switchMap(() => {
      return fromFetch(`/api/models/listing`, {
        method: HTTPMethod.GET,
        headers: {
          'Content-Type': 'application/json',
        },
      }).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
        mergeMap(resp => {
          if (!resp.ok) {
            return throwError(() => resp);
          }
          return from(resp.json()).pipe(
            mergeMap((response: Model[]) => {
              const actions: Observable<UnknownAction>[] = [
                of(BuilderActions.setModels(response)),
                of(BuilderActions.setIsModelsLoading(false)),
              ];

              return concat(...actions);
            }),
          );
        }),
        globalCatchUnauthorized(),
        catchError(() => {
          return concat(
            of(UIActions.showErrorToast('Failed to fetch models. Please try again later.')),
            of(BuilderActions.setIsModelsLoading(false)),
          );
        }),
      );
    }),
  );
