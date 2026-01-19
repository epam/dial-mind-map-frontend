import { UnknownAction } from '@reduxjs/toolkit';
import cloneDeep from 'lodash-es/cloneDeep';
import { concat, EMPTY, filter, map, Observable, of, switchMap } from 'rxjs';

import { AI_ROBOT_ICON_NAME } from '@/constants/app';
import { AttachmentTitle, Role } from '@/types/chat';
import { NodesMIMEType } from '@/types/files';
import { Edge, Element, GraphElement, Node } from '@/types/graph';
import { ChatRootEpic } from '@/types/store';
import { getDuplicateMessageId, getNodeResponseId } from '@/utils/app/conversation';
import { replaceVisitedNode } from '@/utils/app/graph/common';
import { isEdge } from '@/utils/app/graph/typeGuards';

import { MindmapActions, MindmapSelectors } from '../../mindmap/mindmap.reducers';
import { ConversationActions, ConversationSelectors } from '../conversation.reducers';

export const updateMessageEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationActions.updateMessage.match),
    map(({ payload }) => ({
      payload,
      conversation: ConversationSelectors.selectConversation(state$.value),
      focusNodeId: MindmapSelectors.selectFocusNodeId(state$.value),
      visitedNodes: MindmapSelectors.selectVisitedNodes(state$.value),
    })),
    switchMap(({ conversation, payload, focusNodeId, visitedNodes }) => {
      if (!conversation || !conversation.messages[payload.messageIndex]) {
        return EMPTY;
      }

      const attachment = payload.values.custom_content?.attachments?.find(a => a.type === NodesMIMEType);
      const isAiGenerated =
        payload.values.custom_content?.attachments?.some(
          attachment => attachment.title === AttachmentTitle['Generated graph node'],
        ) ?? false;

      let customElements: Element<GraphElement>[] = [];
      let customNode: Node | null = null;
      let customNodeId: string | null = null;
      const customViewElements = cloneDeep(conversation.customViewState.customElements);
      const currentGraphElements = MindmapSelectors.selectGraphElements(state$.value);

      if (attachment?.data) {
        customElements = JSON.parse(attachment.data) as Element<GraphElement>[];

        customElements.forEach(el => {
          if (isEdge(el.data)) {
            if (!customViewElements.edges.some(edge => edge.data.id === el.data.id)) {
              customViewElements.edges.push(el as Element<Edge>);
            }
          } else {
            if (!customViewElements.nodes.some(node => node.data.id === el.data.id)) {
              const currentIcon = el.data.icon ? el.data.icon : isAiGenerated ? AI_ROBOT_ICON_NAME : undefined;
              const node = { ...el, data: { ...el.data, icon: currentIcon } };
              customViewElements.nodes.push(node);
            }
            customNode = el.data;
            customNodeId = customNode.id;
          }
        });
      }

      const messages = [...conversation.messages];
      messages[payload.messageIndex] = {
        ...messages[payload.messageIndex],
        ...payload.values,
      };

      if (customNodeId) {
        messages[payload.messageIndex - 1] = {
          ...messages[payload.messageIndex - 1],
        };
      }

      const newElements = customElements.filter(
        customElement => !currentGraphElements.some(el => el.data.id === customElement.data.id),
      );

      if (newElements.length === 0 && !customNode && !payload.isInitialization) {
        const isMessageRateUpdate = 'like' in payload.values;

        return concat(
          of(
            ConversationActions.updateConversation({
              values: { messages: [...messages] },
              isInitialization: payload.isInitialization,
              needToUpdateInBucket: isMessageRateUpdate,
            }),
          ),
        );
      }

      const hasNewElements =
        conversation.customViewState.customElements.nodes.length !== customViewElements.nodes.length ||
        conversation.customViewState.customElements.edges.length !== customViewElements.edges.length;

      const customViewState = {
        ...conversation.customViewState,
        customElements: customViewElements,
      };

      const isDifferentNode = Boolean(customNode) && focusNodeId !== undefined && customNode!.id !== focusNodeId;
      let filteredMessages = messages;
      let isFocusNodeNeedToUpdate = false;

      if (isDifferentNode) {
        isFocusNodeNeedToUpdate = true;
        customViewState.focusNodeId = customNode!.id;

        customViewState.visitedNodeIds = replaceVisitedNode(cloneDeep(visitedNodes), focusNodeId, customNodeId!);
        customViewState.customElements.edges = customViewState.customElements.edges.filter(
          edge => !edge.data.id.includes(focusNodeId),
        );

        const wasVisited =
          Boolean(visitedNodes[customNode!.id]) || Object.values(visitedNodes).some(value => value === customNode!.id);

        if (wasVisited || isAiGenerated) {
          const lastUserMessage =
            filteredMessages[payload.messageIndex - 1].role === Role.User
              ? filteredMessages[payload.messageIndex - 1]
              : null;
          if (customNodeId && lastUserMessage) {
            const customMessageId = wasVisited
              ? getDuplicateMessageId(filteredMessages[payload.messageIndex - 1].id ?? '', customNodeId)
              : customNodeId;

            filteredMessages[payload.messageIndex - 1] = {
              ...filteredMessages[payload.messageIndex - 1],
              id: customMessageId,
            };
            filteredMessages[payload.messageIndex] = {
              ...filteredMessages[payload.messageIndex],
              id: getNodeResponseId(customMessageId),
            };
          }
        } else {
          filteredMessages = [];
          // when the mapped node is added to the history for the first time
          messages.forEach(message => {
            if (!message.id || !message.id.includes(focusNodeId)) {
              filteredMessages.push(message);
            } else {
              const updatedMessage = cloneDeep(message);
              updatedMessage.id = message.id === focusNodeId ? customNode!.id : getNodeResponseId(customNode!.id);
              if (message.id === getNodeResponseId(focusNodeId)) {
                updatedMessage.role = Role.Assistant;
              }
              filteredMessages.push(updatedMessage);
            }
          });
        }
      } else {
        filteredMessages = [...messages];
      }

      if (customNodeId) {
        const indexes = filteredMessages.map((m, i) => (m.id === customNodeId ? i : -1)).filter(i => i !== -1);
        if (indexes.length > 1) {
          filteredMessages = filteredMessages.filter((m, i) => !indexes.includes(i) || i === indexes[0]);
        }
      }

      const actions: Observable<UnknownAction>[] = [];

      actions.push(
        of(
          ConversationActions.updateConversation({
            values: { messages: filteredMessages, customViewState },
            isInitialization: payload.isInitialization,
          }),
        ),
      );

      if (hasNewElements || isDifferentNode) {
        actions.push(of(MindmapActions.fetchGraph(customViewState)));
      }

      const previousNodeId = visitedNodes[focusNodeId];
      if (
        customNode &&
        previousNodeId !== (customNode as Node).id &&
        !customViewState.visitedNodeIds[(customNode as Node).id]
      ) {
        customViewState.visitedNodeIds[(customNode as Node).id] = previousNodeId;
      }

      if (isFocusNodeNeedToUpdate) {
        actions.push(of(MindmapActions.setFocusNodeId(customNode!.id)));
        actions.push(
          of(
            MindmapActions.setVisitedNodes({
              ...customViewState.visitedNodeIds,
            }),
          ),
        );
      }

      return concat(...actions);
    }),
  );
