import { IconPlayerPlay } from '@tabler/icons-react';
import classNames from 'classnames';
import { useEffect, useRef } from 'react';

import { BlinkingCursor } from '@/components/common/BlinkingCursor';
import { ChatInputPlaceholder } from '@/constants/app';
import { AppearanceSelectors } from '@/store/chat/appearance/appearance.reducers';
import { useChatSelector } from '@/store/chat/hooks';

import { usePlayback } from './hooks/usePlayback';

export const PlaybackInput = () => {
  const { onNextPlaybackStep, onPreviousPlaybackStep, value, isPreviousStepDisabled, isNextStepDisabled, showCursor } =
    usePlayback();
  const placeholder = useChatSelector(AppearanceSelectors.selectChatConfig)?.placeholder ?? ChatInputPlaceholder;

  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollLeft = textRef.current.scrollWidth;
    }
  }, [value]);

  return (
    <div className={classNames('flex items-center w-full rounded-[3px] bg-layer-3 h-11 md:h-[48px] px-1')}>
      <button
        type="button"
        onClick={onPreviousPlaybackStep}
        className={classNames(
          'flex size-8 items-center justify-center rounded transition-colors duration-200 hover:text-accent-primary',
          {
            'text-controls-disable pointer-events-none': isPreviousStepDisabled,
          },
        )}
        tabIndex={0}
        disabled={isPreviousStepDisabled}
      >
        <IconPlayerPlay size={24} className="rotate-180" />
      </button>

      <div
        className={classNames(
          'flex-1 px-3 py-[6px] text-base font-normal bg-transparent outline-none select-text cursor-default whitespace-pre',
          'overflow-x-auto [scrollbar-width:none] [ms-overflow-style:none] [::-webkit-scrollbar:hidden]',
          !value && 'text-controls-disable',
        )}
        aria-readonly="true"
        tabIndex={-1}
        ref={textRef}
      >
        <span>{value || placeholder}</span>
        <BlinkingCursor isShowing={showCursor} />
      </div>

      <button
        type="button"
        onClick={onNextPlaybackStep}
        className={classNames(
          'flex size-8 items-center justify-center rounded transition-colors duration-200 hover:text-accent-primary',
          {
            'text-controls-disable pointer-events-none': isNextStepDisabled,
          },
        )}
        tabIndex={0}
        disabled={isNextStepDisabled}
      >
        <IconPlayerPlay size={24} />
      </button>
    </div>
  );
};
