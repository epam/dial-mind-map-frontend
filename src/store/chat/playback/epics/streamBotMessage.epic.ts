import { interval } from 'rxjs';
import { endWith, filter, map, switchMap, take } from 'rxjs/operators';

import { ChatRootEpic } from '@/types/store';

import { PlaybackActions } from '../playback.reducer';

export const streamBotMessageEpic: ChatRootEpic = action$ =>
  action$.pipe(
    filter(PlaybackActions.streamBotMessage.match),
    switchMap(({ payload }) => {
      const fullText = payload.message.content || '';
      const chunks = fullText.match(/.{1,8}/g) || [];
      return interval(100).pipe(
        take(chunks.length),
        map(i => PlaybackActions.streamBotMessageChunk({ chunk: chunks[i] })),
        endWith(PlaybackActions.streamBotMessageSuccess({ availableNodes: payload.message.availableNodes || [] })),
      );
    }),
  );
