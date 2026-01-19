import { saveAs } from 'file-saver';
import { of } from 'rxjs';

import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { UIActions } from '@/store/builder/ui/ui.reducers';

import { AppearanceActions } from '../../appearance.reducers';
import { exportAppearancesEpic } from '../exportAppearances.epic';
jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

jest.mock('@/store/builder/application/application.reducer');

describe('exportAppearancesEpic', () => {
  const name = 'test-app';

  beforeEach(() => {
    jest.resetAllMocks();
    (ApplicationSelectors.selectApplicationName as unknown as jest.Mock).mockReturnValue(name);
    (ApplicationSelectors.selectApplicationDisplayName as unknown as jest.Mock).mockReturnValue('test-app');
  });

  it('calls saveAs and dispatches success on 200 response', async () => {
    const fakeBlob = new Blob(['data'], { type: 'application/octet-stream' });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(fakeBlob),
      headers: {},
      statusText: 'OK',
    });

    const actions: any[] = [];
    const action$ = of(AppearanceActions.exportAppearances());
    const state$ = { value: {} } as any;
    const output$ = exportAppearancesEpic(action$, state$);

    await new Promise<void>(resolve => {
      output$.subscribe({
        next: a => actions.push(a),
        complete: () => resolve(),
      });
    });

    expect(saveAs).toHaveBeenCalledWith(fakeBlob, `${name}-appearances.zip`);
    expect(actions).toEqual([AppearanceActions.exportAppearancesSuccess()]);
  });

  it('dispatches failure and toast on non-ok response', async () => {
    const errorText = 'Server Error';
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: () => Promise.resolve(errorText),
      statusText: 'Bad Request',
      headers: {},
    });

    const actions: any[] = [];
    const action$ = of(AppearanceActions.exportAppearances());
    const state$ = { value: {} } as any;
    const output$ = exportAppearancesEpic(action$, state$);

    await new Promise<void>(resolve => {
      output$.subscribe({
        next: a => actions.push(a),
        complete: () => resolve(),
      });
    });

    expect(actions).toEqual([
      UIActions.showErrorToast('Export appearances failed'),
      AppearanceActions.exportAppearancesFailure(errorText),
    ]);
    expect(saveAs).not.toHaveBeenCalled();
  });

  it('handles fetch throwing error', async () => {
    const throwMsg = 'Network down';
    global.fetch = jest.fn().mockRejectedValue(new Error(throwMsg));

    const actions: any[] = [];
    const action$ = of(AppearanceActions.exportAppearances());
    const state$ = { value: {} } as any;
    const output$ = exportAppearancesEpic(action$, state$);

    await new Promise<void>(resolve => {
      output$.subscribe({
        next: a => actions.push(a),
        complete: () => resolve(),
      });
    });

    expect(actions).toEqual([
      UIActions.showErrorToast('Export appearances failed'),
      AppearanceActions.exportAppearancesFailure(throwMsg),
    ]);
    expect(saveAs).not.toHaveBeenCalled();
  });
});
