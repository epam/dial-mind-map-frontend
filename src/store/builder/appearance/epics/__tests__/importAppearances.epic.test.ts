jest.mock('@/store/builder/application/application.reducer', () => ({
  ApplicationSelectors: {
    selectMindmapFolder: jest.fn(),
    selectApplicationName: jest.fn(),
  },
}));

import { of } from 'rxjs';

import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { UIActions } from '@/store/builder/ui/ui.reducers';

import { AppearanceActions } from '../../appearance.reducers';
import { importAppearancesEpic } from '../importAppearances.epic';

describe('importAppearancesEpic', () => {
  let originalFetch: typeof fetch;

  beforeAll(() => {
    // Preserve original fetch implementation
    originalFetch = global.fetch;
  });

  afterAll(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.resetAllMocks();
    (ApplicationSelectors.selectMindmapFolder as unknown as jest.Mock).mockReturnValue('test-folder');
    (ApplicationSelectors.selectApplicationName as unknown as jest.Mock).mockReturnValue('test-app');
  });

  it('does nothing if no folder is set', done => {
    (ApplicationSelectors.selectMindmapFolder as unknown as jest.Mock).mockReturnValue(undefined);
    const action$ = of(AppearanceActions.importAppearances({ file: new File([], 'dummy.txt') }));
    const state$ = { value: {} } as any;
    const output: any[] = [];

    importAppearancesEpic(action$, state$).subscribe({
      next: action => output.push(action),
      complete: () => {
        expect(output).toEqual([]);
        done();
      },
    });
  });

  it('dispatches success when fetch responds ok', done => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => '', statusText: '' });
    const action$ = of(AppearanceActions.importAppearances({ file: new File([], 'dummy.txt') }));
    const state$ = { value: {} } as any;
    const output: any[] = [];

    importAppearancesEpic(action$, state$).subscribe({
      next: action => output.push(action),
      complete: () => {
        expect(output).toEqual([AppearanceActions.importAppearancesSuccess()]);
        done();
      },
    });
  });

  it('dispatches error toast and failure action when fetch responds with error', done => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, text: async () => 'Upload failed', statusText: 'Bad Request' });
    const action$ = of(AppearanceActions.importAppearances({ file: new File([], 'dummy.txt') }));
    const state$ = { value: {} } as any;
    const output: any[] = [];

    importAppearancesEpic(action$, state$).subscribe({
      next: action => output.push(action),
      complete: () => {
        expect(output).toEqual([
          UIActions.showErrorToast('Import appearances failed'),
          AppearanceActions.importAppearancesFailure('Upload failed'),
        ]);
        done();
      },
    });
  });
});
