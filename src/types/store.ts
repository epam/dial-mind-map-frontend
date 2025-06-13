import { AnyAction } from '@reduxjs/toolkit';
import { StateObservable } from 'redux-observable';
import { Observable } from 'rxjs';

import { BuilderRootState } from '@/store/builder';

export type BuilderRootEpic = (
  action$: Observable<AnyAction>,
  state$: StateObservable<BuilderRootState>,
) => Observable<AnyAction>;

export type ChatRootEpic = (
  action$: Observable<AnyAction>,
  state$: StateObservable<BuilderRootState>,
) => Observable<AnyAction>;
