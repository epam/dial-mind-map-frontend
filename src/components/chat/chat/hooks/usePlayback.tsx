import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ConversationSelectors } from '@/store/chat/conversation/conversation.reducers';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { PlaybackActions, PlaybackSelectors } from '@/store/chat/playback/playback.reducer';

export const usePlayback = () => {
  const dispatch = useChatDispatch();

  const playbackInputValue = useChatSelector(PlaybackSelectors.selectPlaybackInputText);
  const playbackStepNumber = useChatSelector(PlaybackSelectors.selectStepNumber);
  const playbackActions = useChatSelector(ConversationSelectors.selectPlaybackActions);

  const isPreviousStepDisabled = useMemo(() => playbackStepNumber <= 0, [playbackStepNumber]);
  const isNextStepDisabled = useMemo(
    () => playbackStepNumber >= (playbackActions?.length ?? 0) - 1,
    [playbackStepNumber, playbackActions],
  );

  const onNextPlaybackStep = useCallback(() => {
    dispatch(PlaybackActions.playbackNextStep());
  }, [dispatch]);

  const onPreviousPlaybackStep = useCallback(() => {
    dispatch(PlaybackActions.playbackPreviousStep());
  }, [dispatch]);

  const [value, setValue] = useState('');
  const typingRef = useRef<NodeJS.Timeout | null>(null);

  const showCursor = value.length < (playbackInputValue?.length ?? 0);

  useEffect(() => {
    if (typingRef.current) clearTimeout(typingRef.current);

    if (!playbackInputValue) {
      setValue('');
      return;
    }

    let i = 0;
    const type = () => {
      setValue(playbackInputValue.slice(0, i));
      if (i <= playbackInputValue.length) {
        typingRef.current = setTimeout(type, 14);
        i++;
      }
    };
    type();

    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
    };
  }, [playbackInputValue]);

  return {
    onNextPlaybackStep,
    onPreviousPlaybackStep,
    isPreviousStepDisabled,
    isNextStepDisabled,
    value,
    showCursor,
  };
};
