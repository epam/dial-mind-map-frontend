/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  DEFAULT_CONVERSATION_NAME,
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_TEMPERATURE,
  FALLBACK_MODEL_ID,
} from '@/constants/settings';
import { Conversation, ConversationEntityModel } from '@/types/chat';
import { Element, GraphElement } from '@/types/graph';

import { constructPath } from './file';
import { isNode } from './graph/typeGuards';
import { getConversationRootId } from './id';

export const cleanConversation = (conversation: Partial<Conversation>): Conversation => {
  const model: ConversationEntityModel = conversation.model
    ? {
        id: conversation.model.id,
      }
    : { id: FALLBACK_MODEL_ID };

  const cleanConversation: Conversation = {
    id:
      conversation.id ||
      constructPath(conversation.folderId || getConversationRootId(), conversation.name || DEFAULT_CONVERSATION_NAME),
    folderId: conversation.folderId || getConversationRootId(),
    name: conversation.name || DEFAULT_CONVERSATION_NAME,
    isApplicationPreviewConversation: conversation.isApplicationPreviewConversation,
    model: model,
    prompt: conversation.prompt || DEFAULT_SYSTEM_PROMPT,
    temperature: conversation.temperature ?? DEFAULT_TEMPERATURE,
    messages:
      conversation.messages?.map(m => {
        const { custom_content, settings, ...rest } = m;
        const cleanedCustomContent = {
          attachments:
            custom_content?.attachments?.map(attachment => ({
              title: attachment.title,
              type: attachment.type,
            })) || [],
        };
        return { ...rest, custom_content: cleanedCustomContent };
      }) || [],
    lastActivityDate: conversation.lastActivityDate || 0,
    updatedAt: conversation.updatedAt || 0,
    selectedAddons: conversation.selectedAddons ?? [],
    customViewState: conversation.customViewState ?? {
      customElements: {
        edges: [],
        nodes: [],
      },
      focusNodeId: '',
      visitedNodeIds: {},
    },
    playback: conversation.playback,
  };

  return cleanConversation;
};

export const cleanGraphElementsForPlayback = (elements: Element<GraphElement>[]): Element<GraphElement>[] => {
  return elements.map(element => {
    if (isNode(element.data)) {
      return {
        data: {
          id: element.data.id,
          label: element.data.label,
          neon: element.data.neon,
          icon: element.data.icon,
        },
      };
    }

    return {
      data: {
        id: element.data.id,
        source: element.data.source,
        target: element.data.target,
      },
    };
  });
};
