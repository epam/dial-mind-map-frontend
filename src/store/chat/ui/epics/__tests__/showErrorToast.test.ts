import { of } from 'rxjs';

import { ToastType } from '@/types/toasts';

import { ChatUIActions } from '../../ui.reducers';
import { showErrorToastEpic } from '../showErrorToast.epic';

describe('showErrorToastEpic', () => {
  it('should map showErrorToast action to showToast with Error type', done => {
    const errorMessage = 'Something went wrong';
    const action$ = of(ChatUIActions.showErrorToast(errorMessage));

    const output$ = showErrorToastEpic(action$, {} as any);
    const emitted: any[] = [];

    output$.subscribe({
      next: action => emitted.push(action),
      complete: () => {
        expect(emitted).toEqual([ChatUIActions.showToast({ message: errorMessage, type: ToastType.Error })]);
        done();
      },
    });
  });

  it('should ignore unrelated actions', done => {
    const action$ = of({ type: 'UNRELATED_ACTION' } as any);
    const output$ = showErrorToastEpic(action$, {} as any);
    const emitted: any[] = [];

    output$.subscribe({
      next: () => emitted.push(true),
      complete: () => {
        expect(emitted).toEqual([]);
        done();
      },
    });
  });
});
