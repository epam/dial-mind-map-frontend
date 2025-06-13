import { StateObservable } from 'redux-observable';
import { Subject } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { GraphEpics } from '../graph.epics';
import { GraphActions } from '../graph.reducers';

describe('GraphEpics - addOrUpdateElementsEpic', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should dispatch setElements when a new element is added', done => {
    testScheduler.run(({ hot }) => {
      const newElement = { data: { id: 'node1', label: 'New Node' } };

      const action$ = hot('-a', {
        a: GraphActions.addOrUpdateElements([newElement]),
      });

      const state$ = new StateObservable(new Subject(), {
        graph: {
          elements: [],
          focusNodeId: null,
        },
      });

      const output$ = GraphEpics(action$, state$, null as any);

      output$.subscribe({
        next: action => {
          expect(action).toEqual(
            GraphActions.setElements({
              elements: [newElement],
              skipLayout: false,
            }),
          );
          done();
        },
        error: err => done(err),
      });
    });
  });

  it('should merge data and update element if properties changed', done => {
    testScheduler.run(({ hot }) => {
      const existingElement = { data: { id: 'node1', label: 'Old Label' } };
      const incomingUpdate = { data: { id: 'node1', label: 'New Label' } };

      const action$ = hot('-a', {
        a: GraphActions.addOrUpdateElements([incomingUpdate]),
      });

      const state$ = new StateObservable(new Subject(), {
        graph: {
          elements: [existingElement],
          focusNodeId: null,
        },
      });

      const output$ = GraphEpics(action$, state$, null as any);

      output$.subscribe({
        next: action => {
          expect(action).toEqual(
            GraphActions.setElements({
              elements: [
                {
                  data: { id: 'node1', label: 'New Label' },
                },
              ],
              skipLayout: false,
            }),
          );
          done();
        },
        error: err => done(err),
      });
    });
  });
});
