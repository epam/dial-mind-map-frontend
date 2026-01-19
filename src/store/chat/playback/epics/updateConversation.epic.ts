import { concat, EMPTY, filter, from, map, of, switchMap } from 'rxjs';

import { NEW_QUESTION_LABEL } from '@/constants/app';
import { AttachmentTitle } from '@/types/chat';
import { ChatRootEpic } from '@/types/store';

import { ConversationSelectors } from '../../conversation/conversation.reducers';
import { MindmapActions } from '../../mindmap/mindmap.reducers';
import { PlaybackActions, PlaybackSelectors } from '../playback.reducer';

export const updateConversationEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(PlaybackActions.updateConversation.match),
    map(({ payload }) => ({
      conversation: ConversationSelectors.selectConversation(state$.value),
      playBackConversation: PlaybackSelectors.selectPlaybackConversation(state$.value),
      playbackAction: payload.action,
      message: payload.message,
      previousFocusNodeId: payload.previousFocusNodeId,
      previousGraphElements: payload.previousGraphElements,
    })),
    switchMap(
      ({ playBackConversation, conversation, playbackAction, message, previousFocusNodeId, previousGraphElements }) => {
        if (!playBackConversation) {
          return EMPTY;
        }

        const nextMessageNumber = playBackConversation?.messages.length ?? 0;
        let nextUserMessage = conversation.playback?.messagesStack[nextMessageNumber];
        const nextBotMessage = message ?? conversation.playback?.messagesStack[nextMessageNumber + 1];

        if (previousFocusNodeId && nextUserMessage) {
          nextUserMessage = { ...nextUserMessage, id: previousFocusNodeId };
        }

        if (!playbackAction.mindmap) {
          return EMPTY;
        }

        const {
          focusNodeId: nextFocusNodeId,
          visitedNodes: nextVisitedNodes,
          elements: nextGraphState,
          depth: nextDepth,
        } = playbackAction.mindmap;

        if (!nextUserMessage || !nextBotMessage || !nextFocusNodeId || !nextVisitedNodes || !nextGraphState) {
          return EMPTY;
        }

        const isRobotMessage = nextBotMessage.custom_content?.attachments?.some(
          attachment => attachment.title === AttachmentTitle['Generated graph node'],
        );

        if (!isRobotMessage) {
          return from([
            PlaybackActions.setPlaybackConversation({
              ...playBackConversation,
              messages: [...playBackConversation.messages, nextUserMessage, nextBotMessage],
            }),
            MindmapActions.setVisitedNodes(playbackAction.mindmap.visitedNodes || {}),
            MindmapActions.setGraphElements(previousGraphElements ?? nextGraphState),
            MindmapActions.setFocusNodeId(previousFocusNodeId ?? nextFocusNodeId),
            MindmapActions.setDepth(nextDepth || 2),
            PlaybackActions.setPlaybackInputText(null),
          ]);
        } else {
          return concat(
            of(PlaybackActions.setPlaybackInputText(null)),
            of(
              MindmapActions.addLinkedToFocusedElement({
                id: nextBotMessage.id ?? '',
                label: NEW_QUESTION_LABEL,
              }),
            ),
            of(MindmapActions.handleNavigation({ clickedNodeId: nextBotMessage.id ?? '', shouldFetchGraph: false })),
            of(
              PlaybackActions.setPlaybackConversation({
                ...playBackConversation,
                messages: [...playBackConversation.messages, nextUserMessage, { ...nextBotMessage, content: '' }],
              }),
            ),
            of(PlaybackActions.setBotStreaming({ isStreaming: true })),
            of(PlaybackActions.streamBotMessage({ message: nextBotMessage })),
            of(MindmapActions.setFocusNodeId(previousFocusNodeId ?? nextFocusNodeId)),
          );
        }
      },
    ),
  );
