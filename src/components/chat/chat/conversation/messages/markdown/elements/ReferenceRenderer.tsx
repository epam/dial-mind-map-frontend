import classNames from 'classnames';
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import Tooltip from '@/components/builder/common/Tooltip';
import ReferenceTooltip from '@/components/chat/reference/components/ReferenceTooltip';
import { isDocsId, isDocsReference, parseReference } from '@/components/chat/reference/components/utils/parseReference';
import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { useBuilderSelector } from '@/store/builder/hooks';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { MindmapActions, MindmapSelectors } from '@/store/chat/mindmap/mindmap.reducers';
import { ChatUIActions, ChatUISelectors } from '@/store/chat/ui/ui.reducers';
import { DocsReference, NodeReference, Reference } from '@/types/graph';
import { getReferenceName } from '@/utils/app/references';

export const ReferenceRenderer = ({ children, references }: { children?: React.ReactNode; references?: Reference }) => {
  const dispatch = useChatDispatch();
  const fullscreenReferences = useBuilderSelector(MindmapSelectors.selectFullscreenReferences);
  const isMapHidden = useChatSelector(ChatUISelectors.selectIsMapHidden);
  const rawText = children?.toString() ?? '';
  const tokens = rawText.split('||');
  const mindmapFolder = useBuilderSelector(ApplicationSelectors.selectMindmapFolder);

  const found = useMemo(() => {
    return tokens
      .map(token => {
        const ids = parseReference(token, references);

        if (!ids) return;
        return isDocsId(ids)
          ? references?.docs.find(
              document =>
                document.doc_id === ids.docId && document.chunk_id === ids.chunkId && document.version === ids.version,
            )
          : references?.nodes.find(n => n.id === ids.nodeId);
      })
      .filter((r): r is DocsReference | NodeReference => !!r);
  }, [tokens, references]);

  const containerRef = useRef<HTMLSpanElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const [wrapped, setWrapped] = useState(false);

  const first = found[0];
  const baseLabel = isDocsReference(first) ? getReferenceName(first) : first?.label;

  const badgeLabel = found?.length > 1 ? `${baseLabel} +${found?.length - 1}` : baseLabel;

  useLayoutEffect(() => {
    const container = containerRef.current;
    const badge = badgeRef.current;
    if (!container || !badge) return;

    const updateWrapped = () => {
      setWrapped(badge.getBoundingClientRect().top - container.getBoundingClientRect().top > 10);
    };

    updateWrapped();

    window.addEventListener('resize', updateWrapped);

    return () => {
      window.removeEventListener('resize', updateWrapped);
    };
  }, [rawText, badgeLabel, mindmapFolder]);

  const setFullscreenReferences = useCallback(() => {
    dispatch(MindmapActions.setFullscreenInitialSlide(0));
    dispatch(MindmapActions.setFullscreenReferences(found));
    if (isMapHidden) {
      dispatch(ChatUIActions.setIsMapHidden(false));
    }
  }, [dispatch, found, isMapHidden]);

  if (!references || !mindmapFolder || !found.length) {
    return <span className="text-secondary">{rawText}</span>;
  }

  return (
    <>
      <span ref={containerRef} className="relative inline-block h-[1em] align-middle"></span>
      {fullscreenReferences ? (
        <span className="relative inline-block max-w-full align-middle">
          <span
            ref={badgeRef}
            className={classNames(
              'whitespace-nowrap max-w-full truncate',
              'inline-block cursor-pointer rounded-full hover:bg-layer-4 px-2 align-middle text-primary bg-layer-3',
              !wrapped && 'ml-1 xl:ml-2',
              'relative top-[-2px]',
              'text-[9px] xl:text-xxs leading-[1.8] xl:leading-[2]',
            )}
            onClick={setFullscreenReferences}
          >
            {badgeLabel}
          </span>
        </span>
      ) : (
        <Tooltip
          tooltip={<ReferenceTooltip references={found} mindmapFolder={mindmapFolder} />}
          triggerClassName="inline-block align-middle max-w-full"
          contentClassName="p-0 rounded-lg xxs:w-[280px] sm:w-fit sm:max-w-[500px] overflow-hidden"
          isTriggerClickable
        >
          <span className="relative inline-block max-w-full align-middle">
            <span
              ref={badgeRef}
              className={classNames(
                'whitespace-nowrap max-w-full truncate',
                'inline-block cursor-pointer rounded-full hover:bg-layer-4 px-2 align-middle text-primary bg-layer-3 ',
                !wrapped && 'ml-1 xl:ml-2',
                'relative top-[-2px]',
                'text-[9px] xl:text-xxs leading-[1.8] xl:leading-[2]',
              )}
            >
              {badgeLabel}
            </span>
          </span>
        </Tooltip>
      )}
    </>
  );
};
