import { UnknownAction } from '@reduxjs/toolkit';
import cloneDeep from 'lodash-es/cloneDeep';
import { concat, EMPTY, filter, map, Observable, of, switchMap } from 'rxjs';

import { AI_ROBOT_ICON_NAME } from '@/constants/app';
import { AttachmentTitle } from '@/types/chat';
import { NodesMIMEType } from '@/types/files';
import { Edge, Element, GraphElement, Node } from '@/types/graph';
import { ChatRootEpic } from '@/types/store';
import { adjustVisitedNodes } from '@/utils/app/graph/common';
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
      const customViewElements = cloneDeep(conversation.customViewState.customElements);
      const elements = MindmapSelectors.selectGraphElements(state$.value);

      if (attachment?.data) {
        customElements = JSON.parse(attachment.data) as Element<GraphElement>[];

        customElements.forEach(el => {
          if (isEdge(el.data)) {
            if (!customViewElements.edges.some(e => e.data.id === el.data.id)) {
              customViewElements.edges.push(el as Element<Edge>);
            }
          } else {
            if (!customViewElements.nodes.some(n => n.data.id === el.data.id)) {
              const currentIcon = (el.data as Node).icon
                ? (el.data as Node).icon
                : isAiGenerated
                  ? AI_ROBOT_ICON_NAME
                  : undefined;
              const node = { ...el, data: { ...el.data, icon: currentIcon } } as Element<Node>;
              customViewElements.nodes.push(node);
            }
            customNode = el.data as Node;
          }
        });
      }

      const messages = [...conversation.messages];
      messages[payload.messageIndex] = {
        ...messages[payload.messageIndex],
        ...payload.values,
      };

      const newElements = customElements.filter(e => !elements.some(el => el.data.id === e.data.id));

      if (newElements.length === 0 && !customNode && !payload.isInitialization) {
        return concat(
          of(
            ConversationActions.updateConversation({
              values: { messages: [...messages] },
              isInitialization: payload.isInitialization,
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
      let filteredMessages: typeof messages = messages;
      let isFocusNodeNeedToUpdate = false;

      if (isDifferentNode) {
        isFocusNodeNeedToUpdate = true;
        customViewState.focusNodeId = customNode!.id;
        customViewState.visitedNodeIds = adjustVisitedNodes(
          cloneDeep(conversation.customViewState.visitedNodeIds),
          focusNodeId,
        );
        customViewState.customElements.edges = customViewState.customElements.edges.filter(
          edge => !edge.data.id.includes(focusNodeId),
        );

        const wasVisited = Boolean(visitedNodes[customNode!.id]);
        if (wasVisited) {
          filteredMessages = messages.filter(m => !m.id || !m.id.includes(focusNodeId));
        } else {
          filteredMessages = [...messages];
        }
      } else {
        filteredMessages = [...messages];
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

      if (hasNewElements || isFocusNodeNeedToUpdate) {
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
