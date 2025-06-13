import { IconArrowsMaximize, IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';

import { ArrowButton } from './ArrowButton';

interface Props {
  title: React.ReactNode;
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onToggleFullscreen?: (initialSlideNumber: number) => void;
  onCloseFullscreen?: () => void;
  onDownload?: () => void;
}

export const ReferenceHeader: React.FC<Props> = ({
  title,
  current,
  total,
  onCloseFullscreen,
  onPrev,
  onNext,
  onToggleFullscreen,
}) => {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-secondary px-4 py-2">
      <div className="flex min-w-0 flex-1 items-center overflow-hidden text-xs text-primary">
        <span className="mr-1 shrink-0">Reference:</span>
        <div className="truncate">{title}</div>
      </div>

      <div className="flex items-center space-x-1">
        {total > 1 && (
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
          <button onClick={onCloseFullscreen} className="text-secondary hover:text-accent-primary">
            <IconX size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
