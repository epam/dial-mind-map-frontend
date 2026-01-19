import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

import { ArrowButton } from './ArrowButton';

export const ReferenceFooter = ({
  onPrev,
  onNext,
  total,
  current,
}: {
  total: number;
  current: number;
  onPrev?: () => void;
  onNext?: () => void;
}) => {
  return (
    <div className="flex items-center self-center py-2 text-sm xl:py-3 xl:text-base">
      {onPrev && onNext && total > 1 && (
        <div className="flex items-center gap-1">
          <ArrowButton onClick={onPrev}>
            <IconChevronLeft size={24} />
          </ArrowButton>
          <span className="text-primary">
            {current + 1}/{total}
          </span>
          <ArrowButton onClick={onNext}>
            <IconChevronRight size={24} />
          </ArrowButton>
        </div>
      )}
    </div>
  );
};
