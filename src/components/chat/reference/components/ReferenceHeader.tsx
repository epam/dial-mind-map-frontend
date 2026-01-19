import { IconArrowsMaximize, IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';
import classNames from 'classnames';

import { ArrowButton } from './ArrowButton';

interface Props {
  title: React.ReactNode;
  current: number;
  total: number;
  onPrev?: () => void;
  onNext?: () => void;
  onToggleFullscreen?: (initialSlideNumber: number) => void;
  onCloseFullscreen?: () => void;
  onDownload?: () => void;
  isFullscreen?: boolean;
}

export const ReferenceHeader: React.FC<Props> = ({
  title,
  current,
  total,
  isFullscreen,
  onCloseFullscreen,
  onPrev,
  onNext,
  onToggleFullscreen,
}) => {
  return (
    <div
      className={classNames([
        'flex items-center justify-between gap-2 border-b border-secondary px-4 py-2',
        isFullscreen && 'xl:py-3',
      ])}
    >
      <div
        className={classNames([
          'flex min-w-0 flex-1 items-center overflow-hidden text-primary',
          isFullscreen ? 'text-sm xl:text-base' : 'text-xs',
        ])}
      >
        <span className="mr-1 shrink-0">Reference:</span>
        <div className="truncate">{title}</div>
      </div>

      <div className="flex items-center space-x-1">
        {!isFullscreen && onPrev && onNext && total > 1 && (
          <div className="flex items-center space-x-1">
            <ArrowButton onClick={onPrev}>
              <IconChevronLeft size={16} />
            </ArrowButton>
            <span className="text-xs text-secondary">
              {current + 1}/{total}
            </span>
            <ArrowButton onClick={onNext}>
              <IconChevronRight size={16} />
            </ArrowButton>
          </div>
        )}

        {onToggleFullscreen && (
          <button onClick={() => onToggleFullscreen(current)} className="text-secondary hover:text-accent-primary">
            <IconArrowsMaximize size={16} />
          </button>
        )}
        {onCloseFullscreen && (
          <button onClick={onCloseFullscreen} className="text-primary hover:text-accent-primary">
            <IconX size={24} />
          </button>
        )}
      </div>
    </div>
  );
};
