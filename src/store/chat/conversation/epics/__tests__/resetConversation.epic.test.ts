import { of } from 'rxjs';

import { ConversationActions, ConversationInitialState } from '../../conversation.reducers';
import { resetConversationEpic } from '../resetConversation.epic';

describe('resetConversationEpic', () => {
  it('emits updateConversation with cleared messages and initial customViewState', done => {
    const actions: any[] = [];
    const action$ = of(ConversationActions.resetConversation());

    const output$ = resetConversationEpic(action$, {} as any);
    output$.subscribe({
      next: action => actions.push(action),
      complete: () => {
        expect(actions).toHaveLength(1);
        expect(actions[0]).toEqual(
          ConversationActions.updateConversation({
            values: {
              messages: [],
              customViewState: ConversationInitialState.conversation.customViewState,
            },
          }),
        );
        done();
      },
    });
  });

  it('does not emit for other action types', done => {
    const actions: any[] = [];
    const unrelated$ = of({ type: 'OTHER_ACTION' });

    const output$ = resetConversationEpic(unrelated$, {} as any);
    output$.subscribe({
      next: action => actions.push(action),
      complete: () => {
        expect(actions).toEqual([]);
        done();
      },
    });
  });
});
