import { useCallback, useEffect } from 'react';
import Slider from 'react-slick';

import { useTooltipContext } from '@/components/builder/common/Tooltip';
import { ReferenceHeader } from '@/components/chat/reference/components/ReferenceHeader';
import { useReferenceSlider } from '@/components/chat/reference/hooks/useReferenceSlider';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { MindmapActions } from '@/store/chat/mindmap/mindmap.reducers';
import { ChatUIActions, ChatUISelectors } from '@/store/chat/ui/ui.reducers';
import { DocsReference, NodeReference } from '@/types/graph';

interface ReferenceTooltipProps {
  references: Array<DocsReference | NodeReference>;
  referenceId?: string;
  badgeRef?: React.RefObject<HTMLSpanElement | null>;
}

export const ReferenceTooltip: React.FC<ReferenceTooltipProps> = ({ references, referenceId, badgeRef }) => {
  const dispatch = useChatDispatch();
  const isMapHidden = useChatSelector(ChatUISelectors.selectIsMapHidden);

  const { setOpen, availableHeight } = useTooltipContext();

  const toggleDisplayMode = useCallback(
    (initialSlideNumber: number) => {
      dispatch(MindmapActions.setFullscreenReferences(references));
      dispatch(MindmapActions.setFullscreenInitialSlide(initialSlideNumber));
      dispatch(MindmapActions.setActiveFullscreenReferenceId(referenceId ?? ''));
      if (isMapHidden) {
        dispatch(ChatUIActions.setIsMapHidden(false));
      }
    },
    [dispatch, references, isMapHidden, referenceId],
  );

  const { Title, current, prev, next, sliderRef, slides, settings } = useReferenceSlider({
    setOpenTooltip: setOpen,
    references,
    referenceId,
    availableHeight,
  });

  useEffect(() => {
    if (!badgeRef?.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setOpen(false);
        }
      },
      {
        root: null,
        threshold: 0,
      },
    );

    observer.observe(badgeRef.current);

    return () => {
      observer.disconnect();
    };
  }, [setOpen, badgeRef]);

  return (
    <div className="w-full">
      <ReferenceHeader
        title={Title}
        current={current}
        total={references.length}
        onToggleFullscreen={toggleDisplayMode}
        onPrev={prev}
        onNext={next}
      />

      <Slider ref={sliderRef} {...settings} className="h-full max-h-[min(280px,30dvh)] overflow-y-auto">
        {slides}
      </Slider>
    </div>
  );
};

export default ReferenceTooltip;
