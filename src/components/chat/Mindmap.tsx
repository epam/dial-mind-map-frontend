'use client';

import classNames from 'classnames';
import { useCallback, useMemo, useRef } from 'react';

import { ApplicationSelectors } from '@/store/chat/application/application.reducer';
import { ConversationActions } from '@/store/chat/conversation/conversation.reducers';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { MindmapActions, MindmapSelectors } from '@/store/chat/mindmap/mindmap.reducers';
import { ChatUISelectors, DeviceType } from '@/store/chat/ui/ui.reducers';
import { Node } from '@/types/graph';

import { DesktopChat } from './chat/DesktopChat';
import { DraggableChat } from './chat/DraggableChat';
import GraphComponent from './graph/GraphComponent';
import { GraphError } from './GraphError';
import { LevelSwitcher } from './LevelSwitcher';
import { ReferenceFullscreenView } from './reference/ReferenceFullscreenView';

export const Mindmap = () => {
  const dispatch = useChatDispatch();
  const fullscreenReferences = useChatSelector(MindmapSelectors.selectFullscreenReferences);
  const mindmapFolder = useChatSelector(ApplicationSelectors.selectMindmapFolder);
  const elements = useChatSelector(MindmapSelectors.selectGraphElements);
  const isReady = useChatSelector(MindmapSelectors.selectIsReady);
  const focusNodeId = useChatSelector(MindmapSelectors.selectFocusNodeId);
  const visitedNodes = useChatSelector(MindmapSelectors.selectVisitedNodes);
  const updateSignal = useChatSelector(MindmapSelectors.selectUpdateSignal);
  const isMapHidden = useChatSelector(ChatUISelectors.selectIsMapHidden);
  const isChatHidden = useChatSelector(ChatUISelectors.selectIsChatHidden);
  const deviceType = useChatSelector(ChatUISelectors.selectDeviceType);
  const hasAppReference = useChatSelector(ApplicationSelectors.selectHasAppReference);
  const hasAppProperties = useChatSelector(ApplicationSelectors.selectHasAppProperties);
  const viewRef = useRef(null);
  const isNotFound = useChatSelector(MindmapSelectors.selectIsNotFound);
  const isRootNodeNotFound = useChatSelector(MindmapSelectors.selectIsRootNodeNotFound);

  const errorTittle = useMemo(() => {
    if (isRootNodeNotFound) {
      return 'Root node not set.';
    }
    return 'Mindmap is not available.';
  }, [isRootNodeNotFound]);

  const errorDescription = useMemo(() => {
    if (isRootNodeNotFound) {
      return 'Please configure a root node for your mindmap.';
    }
    return 'Please generate the graph.';
  }, [isRootNodeNotFound]);

  const focusNodeIdHandler = useCallback(
    (node: Node) => {
      dispatch(MindmapActions.handleNavigation({ clickedNodeId: node.id, shouldFetchGraph: true }));
      dispatch(ConversationActions.setMessageSending({ isMessageSending: false }));
    },
    [dispatch],
  );

  return (
    <div
      className={classNames([
        'relative h-full w-full flex flex-col  gap-2',
        !isMapHidden && 'xl:flex-row',
        isMapHidden && 'justify-center items-center',
      ])}
      ref={viewRef}
    >
      <div
        className={classNames([
          'relative w-full xl:flex-1 xl:h-full xl:w-2/3',
          isMapHidden && '!w-0 !h-0 overflow-hidden',
          isChatHidden && fullscreenReferences && 'h-[calc(87%-8px)]',
          deviceType !== DeviceType.Desktop && isChatHidden && fullscreenReferences && 'max-h-[calc(100%-121px)]',
          !isChatHidden && fullscreenReferences && !isMapHidden && 'h-[calc(50%-8px)]',
          isChatHidden && !fullscreenReferences && 'h-full',
          !isChatHidden && !fullscreenReferences && !isMapHidden && 'h-1/2',
        ])}
      >
        {fullscreenReferences && (
          <ReferenceFullscreenView references={fullscreenReferences} mindmapFolder={mindmapFolder} />
        )}
        {!hasAppReference ? null : hasAppProperties && !isNotFound && !isRootNodeNotFound ? (
          <>
            <GraphComponent
              isReady={isReady}
              elements={elements}
              focusNodeId={focusNodeId}
              isChatHidden={isChatHidden}
              visitedNodes={visitedNodes}
              updateSignal={updateSignal}
              onFocusNodeChange={focusNodeIdHandler}
            />
            {deviceType !== DeviceType.Mobile && (
              <LevelSwitcher
                classes={classNames(['absolute bottom-2 lg:bottom-4 xl:bottom-0', isChatHidden && 'bottom-[130px]'])}
              />
            )}
          </>
        ) : (
          <GraphError title={errorTittle} description={errorDescription} />
        )}
      </div>
      {deviceType === DeviceType.Unknown ? null : deviceType === DeviceType.Desktop ? (
        <DesktopChat />
      ) : (
        <DraggableChat parentRef={viewRef} />
      )}
    </div>
  );
};
