import classNames from 'classnames';
import { colord } from 'colord';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Slider, { Settings } from 'react-slick';

import { AppearanceSelectors } from '@/store/chat/appearance/appearance.reducers';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { MindmapActions } from '@/store/chat/mindmap/mindmap.reducers';
import { ReferenceActions } from '@/store/chat/reference/reference.reducers';
import { ChatNodeType } from '@/types/customization';
import { DocsReference, NodeReference } from '@/types/graph';
import { SourceType } from '@/types/sources';

import { Node } from '../../chat/conversation/messages/Node';
import { ImageContent } from '../components/ImageContent';
import { MarkdownContent } from '../components/MarkdownContent';
import { NodeContent } from '../components/NodeContent';
import { PdfContent } from '../components/PdfContent';
import { isDocsReference, isNodeReference } from '../components/utils/parseReference';

const makeSettings = (
  onAfterChange: (i: number) => void,
  count: number,
  containerRef?: React.RefObject<HTMLDivElement>,
): Settings => ({
  dots: false,
  arrows: false,
  infinite: count > 1,
  speed: 200,
  slidesToShow: 1,
  slidesToScroll: 1,
  draggable: false,
  swipe: true,
  touchMove: true,
  touchThreshold: 100,
  waitForAnimate: true,
  afterChange: (i: number) => {
    onAfterChange(i);
    if (containerRef?.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  adaptiveHeight: false,
});

const getSlideContent = (
  reference: DocsReference | NodeReference,
  mindmapFolder: string,
  isFullscreen?: boolean,
  availableHeight?: number | null,
) => {
  if (isDocsReference(reference)) {
    if (reference.doc_content_type === 'application/pdf' && isFullscreen) {
      return {
        content: (
          <PdfContent reference={reference} folderPath={mindmapFolder} initialPage={Number(reference.chunk_id) - 1} />
        ),
        contentType: 'pdf',
      };
    }
    return reference.content_type === 'image/jpeg'
      ? ({
          content: (
            <ImageContent
              reference={reference}
              folderPath={mindmapFolder}
              isFullscreenReference={isFullscreen}
              availableHeight={availableHeight}
            />
          ),
          contentType: 'image',
        } as const)
      : ({
          content: <MarkdownContent reference={reference} isFullscreenReference={isFullscreen} />,
          contentType: 'markdown',
        } as const);
  }
  if (isNodeReference(reference)) {
    return { content: <NodeContent reference={reference} isFullscreenReference={isFullscreen} />, contentType: 'node' };
  }
  return null;
};

export const useReferenceSlider = ({
  setOpenTooltip,
  references,
  mindmapFolder,
  isFullscreen = false,
  containerRef,
  initialSlideNumber = 0,
  referenceId,
  availableHeight = null,
}: {
  setOpenTooltip?: (state: boolean) => void;
  references: Array<DocsReference | NodeReference>;
  mindmapFolder: string;
  isFullscreen?: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
  initialSlideNumber?: number;
  referenceId?: string;
  availableHeight?: number | null;
}) => {
  const [current, setCurrent] = useState(initialSlideNumber);
  const sliderRef = useRef<Slider>(null);
  const themeConfig = useChatSelector(AppearanceSelectors.selectThemeConfig);

  const dispatch = useChatDispatch();

  const settings = useMemo(
    () => makeSettings(setCurrent, references.length, containerRef),
    [containerRef, references.length],
  );

  const currentReference = useMemo(() => {
    const currentReference = references[current];
    return currentReference;
  }, [references, current]);

  useEffect(() => {
    setCurrent(initialSlideNumber);
    sliderRef.current?.slickGoTo(initialSlideNumber);
  }, [references, initialSlideNumber]);

  const Title = useMemo(() => {
    if (isDocsReference(currentReference)) {
      const name =
        currentReference.source_name ||
        currentReference.doc_name.split('/').at(-1) ||
        currentReference.doc_name.split('/').at(-2);
      if (currentReference.doc_type === SourceType.LINK) {
        return (
          <a
            href={currentReference.doc_url}
            target="_blank"
            rel="noopener noreferrer text-accent-primary"
            className="truncate text-accent-primary"
          >
            {name}
          </a>
        );
      }
      if (currentReference.doc_content_type === 'text/html') {
        return <span className="truncate text-primary">{name}</span>;
      }
      return (
        <button
          onClick={() => {
            dispatch(
              ReferenceActions.downloadSource({
                versionId: currentReference.version,
                sourceId: currentReference.doc_id,
                name: name,
              }),
            );
          }}
          className="truncate text-accent-primary"
        >
          {name}
        </button>
      );
    }
    if (isNodeReference(currentReference)) {
      return (
        <Node
          size="small"
          isVisited={false}
          id={currentReference.id}
          label={currentReference.label}
          isPrevious={false}
          color={
            themeConfig?.graph.paletteSettings.branchesColors.at(0)?.bgColor ?? colord('#046280').darken(0.05).toHex()
          }
          textColor={
            themeConfig?.graph.paletteSettings.branchesColors.at(0)?.textColor ?? colord('#046280').darken(0.5).toHex()
          }
          borderColor={
            themeConfig?.graph.paletteSettings.branchesColors.at(0)?.borderColor ??
            colord('#046280').darken(0.5).toHex()
          }
          type={themeConfig?.chat?.chatNode?.availableNodeType ?? ChatNodeType.Filled}
          closeTooltip={() => setOpenTooltip && setOpenTooltip(false)}
        />
      );
    }
    return null;
  }, [
    currentReference,
    setOpenTooltip,
    dispatch,
    themeConfig?.graph.paletteSettings.branchesColors,
    themeConfig?.chat?.chatNode?.availableNodeType,
  ]);

  const slides = useMemo(
    () =>
      references.map((reference, index) => {
        const key = isDocsReference(reference) ? reference.doc_name : reference.id;
        const slide = getSlideContent(reference, mindmapFolder, isFullscreen, availableHeight);
        if (!slide) return null;
        const { content, contentType } = slide;
        return (
          <div key={key} className="flex h-full flex-col">
            <div
              className={classNames(
                'h-full max-h-full',
                contentType !== 'pdf' && 'px-4 py-2',
                !isFullscreen && (contentType === 'pdf' || contentType === 'image') && 'cursor-zoom-in',
              )}
              onClick={() => {
                if (!isFullscreen && (contentType === 'pdf' || contentType === 'image')) {
                  if (setOpenTooltip) {
                    setOpenTooltip(false);
                  }
                  dispatch(MindmapActions.setFullscreenReferences(references));
                  dispatch(MindmapActions.setFullscreenInitialSlide(index));
                  dispatch(MindmapActions.setActiveFullscreenReferenceId(referenceId ?? ''));
                }
              }}
            >
              {content}
            </div>
          </div>
        );
      }),
    [references, mindmapFolder, isFullscreen, setOpenTooltip, dispatch, referenceId, availableHeight],
  );

  const prev = useCallback(() => {
    sliderRef.current?.slickPrev();
  }, []);

  const next = useCallback(() => {
    sliderRef.current?.slickNext();
  }, []);

  return {
    current,
    setCurrent,
    next,
    prev,
    slides,
    sliderRef,
    Title,
    settings,
  };
};
