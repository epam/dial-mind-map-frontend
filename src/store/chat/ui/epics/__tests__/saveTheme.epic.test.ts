import { of } from 'rxjs';

import { ChatUIActions } from '../../ui.reducers';
import { saveThemeEpic } from '../saveTheme.epic';

describe('saveThemeEpic', () => {
  const DEFAULT_STATE = {} as any;
  const html = document.documentElement;

  beforeEach(() => {
    html.className = '';
  });

  it('sets document className to payload plus theme suffix (dark)', done => {
    const action = ChatUIActions.setThemeName('dark-mode');

    saveThemeEpic(of(action), DEFAULT_STATE).subscribe({
      complete: () => {
        expect(html.className).toBe('dark-mode dark');
        done();
      },
      error: err => done(err as Error),
    });
  });

  it('sets document className for light variant', done => {
    const action = ChatUIActions.setThemeName('light-mode-beta');

    saveThemeEpic(of(action), DEFAULT_STATE).subscribe({
      complete: () => {
        expect(html.className).toBe('light-mode-beta light');
        done();
      },
      error: err => done(err as Error),
    });
  });

  it('does not emit any actions (ignoreElements)', done => {
    const action = ChatUIActions.setThemeName('darkish');
    const emitted: any[] = [];

    saveThemeEpic(of(action), DEFAULT_STATE).subscribe({
      next: x => emitted.push(x),
      complete: () => {
        expect(emitted).toHaveLength(0);
        done();
      },
      error: err => done(err as Error),
    });
  });
});
