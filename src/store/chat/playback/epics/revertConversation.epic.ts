import { EMPTY, filter, map, of, switchMap } from 'rxjs';

import { ChatRootEpic } from '@/types/store';

import { PlaybackActions, PlaybackSelectors } from '../playback.reducer';

export const revertConversationEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(PlaybackActions.revertConversation.match),
    map(() => PlaybackSelectors.selectPlaybackConversation(state$.value)),
    switchMap(playbackConversation => {
      if (!playbackConversation || playbackConversation.messages.length < 2) {
        return EMPTY;
      }

      const trimmedMessages = playbackConversation.messages.slice(0, -2);

      return of(
        PlaybackActions.setPlaybackConversation({
          ...playbackConversation,
          messages: trimmedMessages,
        }),
      );
    }),
  );
