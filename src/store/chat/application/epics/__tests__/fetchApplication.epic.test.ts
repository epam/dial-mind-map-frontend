import { StateObservable } from 'redux-observable';
import { Subject } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { TestScheduler } from 'rxjs/testing';

import { ApplicationActions } from '../../application.reducer';
import { fetchApplicationEpic } from '../fetchApplication.epic';

jest.mock('rxjs/fetch', () => ({
  fromFetch: jest.fn(),
}));

const mockedFromFetch = fromFetch as jest.Mock;

describe('fetchApplicationEpic', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should dispatch fetchApplicationSuccess on successful fetch', done => {
    testScheduler.run(({ hot, cold }) => {
      const applicationId = '123';
      const mockResponse = {
        id: applicationId,
        name: 'Test App',
        reference: 'test',
        application_properties: { mindmap_folder: 'test-folder' },
      };

      mockedFromFetch.mockReturnValueOnce(cold('--a', { a: { ok: true, json: async () => mockResponse } }));

      const action$ = hot('-a', { a: ApplicationActions.fetchApplicationStart(applicationId) });
      const state$ = new StateObservable(new Subject(), {});

      const output$ = fetchApplicationEpic(action$, state$);

      output$.subscribe({
        next: action => {
          expect(action.type).toBe('application/fetchApplicationSuccess');
          expect(action.payload.id).toBe(applicationId);
          done();
        },
        error: err => done(err),
      });
    });
  });

  it('should dispatch fetchApplicationFailure on fetch error', () => {
    testScheduler.run(({ hot, cold, expectObservable }) => {
      const applicationId = '123';
      const errorMessage = 'Failed to fetch';

      mockedFromFetch.mockReturnValueOnce(cold('--#', {}, new Error(errorMessage)));

      const action$ = hot('-a', { a: ApplicationActions.fetchApplicationStart(applicationId) });
      const state$ = new StateObservable(new Subject(), {});

      const output$ = fetchApplicationEpic(action$, state$);

      expectObservable(output$).toBe('---b', {
        b: ApplicationActions.fetchApplicationFailure(errorMessage),
      });
    });
  });
});
