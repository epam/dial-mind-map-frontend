import { of } from 'rxjs';

import { MindmapUrlHeaderName } from '@/constants/http';
import { HTTPMethod } from '@/types/http';

import { ApplicationSelectors } from '../../../application/application.reducer';
import { UIActions } from '../../../ui/ui.reducers';
import { handleRequestNew } from '../../../utils/handleRequest';
import { AppearanceActions } from '../../appearance.reducers';
import { fetchThemeConfigEpic } from '../fetchThemeConfig.epic';

jest.mock('../../../application/application.reducer');
jest.mock('../../../utils/handleRequest');

describe('fetchThemeConfigEpic', () => {
  const folder = 'mf';
  const name = 'app';
  const payload = { theme: 'light' };
  const state$ = { value: {} } as any;

  beforeEach(() => {
    jest.resetAllMocks();
    (ApplicationSelectors.selectMindmapFolder as unknown as jest.Mock).mockReturnValue(folder);
    (ApplicationSelectors.selectApplicationName as unknown as jest.Mock).mockReturnValue(name);
  });

  it('emits nothing when no folder is set', done => {
    (ApplicationSelectors.selectMindmapFolder as unknown as jest.Mock).mockReturnValue(undefined);
    const actions: any[] = [];
    const action$ = of(AppearanceActions.fetchThemeConfig(payload));

    const output$ = fetchThemeConfigEpic(action$, state$);
    output$.subscribe({
      next: a => actions.push(a),
      complete: () => {
        expect(actions).toEqual([]);
        expect(handleRequestNew).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('calls handleRequestNew with correct args and emits its result', done => {
    const config: any = { color: 'blue' };
    const actionsFromHandle = [
      AppearanceActions.setThemeConfig(config),
      AppearanceActions.fetchThemeConfigFinished(config),
    ];
    (handleRequestNew as jest.Mock).mockReturnValue(of(...actionsFromHandle));

    const actions: any[] = [];
    const action$ = of(AppearanceActions.fetchThemeConfig(payload));

    const output$ = fetchThemeConfigEpic(action$, state$);
    output$.subscribe({
      next: a => actions.push(a),
      complete: () => {
        expect(handleRequestNew).toHaveBeenCalledWith({
          url: `/api/mindmaps/${encodeURIComponent(name)}/appearances/themes/${payload.theme}`,
          options: { method: HTTPMethod.GET, headers: { [MindmapUrlHeaderName]: folder } },
          state$: state$,
          responseProcessor: expect.any(Function),
          failureActions: [
            UIActions.showErrorToast('Unable to fetch the theme. Please refresh or try again later.'),
            AppearanceActions.fetchThemeConfigFinished(undefined),
          ],
        });
        expect(actions).toEqual(actionsFromHandle);
        done();
      },
    });
  });
});
