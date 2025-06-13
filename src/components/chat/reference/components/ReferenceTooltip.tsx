import { useCallback } from 'react';
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
  mindmapFolder: string;
}

export const ReferenceTooltip: React.FC<ReferenceTooltipProps> = ({ references, mindmapFolder }) => {
  const dispatch = useChatDispatch();
  const isMapHidden = useChatSelector(ChatUISelectors.selectIsMapHidden);

  const { setOpen } = useTooltipContext();

  const toggleDisplayMode = useCallback(
    (initialSlideNumber: number) => {
      dispatch(MindmapActions.setFullscreenReferences(references));
      dispatch(MindmapActions.setFullscreenInitialSlide(initialSlideNumber));
      if (isMapHidden) {
        dispatch(ChatUIActions.setIsMapHidden(false));
      }
    },
    [dispatch, references, isMapHidden],
  );

  const { Title, current, prev, next, sliderRef, slides, settings } = useReferenceSlider({
    setOpenTooltip: setOpen,
    references,
    mindmapFolder,
  });

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

      <Slider ref={sliderRef} {...settings} className="h-full">
        {slides}
      </Slider>
    </div>
  );
};

export default ReferenceTooltip;
