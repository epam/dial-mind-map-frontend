import { Dispatch, UnknownAction } from '@reduxjs/toolkit';

import { NEW_QUESTION_LABEL } from '@/constants/app';
import { ConversationActions } from '@/store/chat/conversation/conversation.reducers';
import { Role } from '@/types/chat';
import { ColoredNode, Node } from '@/types/graph';
import { getFocusNodeResponseId } from '@/utils/app/conversation';

export function adjustMessages(
  cyInstance: cytoscape.Core,
  focusNode: Node,
  dispatch: Dispatch<UnknownAction>,
  nodeColorMap?: Map<string, string>,
  previousNodeId?: string,
  isInitialization?: boolean,
) {
  const cyFocusNode = cyInstance.getElementById(focusNode.id);

  if (cyFocusNode.data().label === NEW_QUESTION_LABEL) {
    return;
  }

  const neighbors = cyFocusNode
    .neighborhood()
    .filter(ele => ele.isNode() && ele.id() !== previousNodeId)
    .map(
      node =>
        ({
          id: node.id(),
          label: node.data('label'),
          color: nodeColorMap?.get(node.id()) ?? node.style('background-color'),
        }) as ColoredNode,
    )
    .sort((a, b) => Number(a.id) - Number(b.id));

  if (previousNodeId) {
    const previousNode = cyInstance.getElementById(previousNodeId);
    if (previousNode.id() && previousNode.id() !== focusNode.id) {
      neighbors.push({
        id: previousNode.id(),
        label: previousNode.data('label'),
        color: nodeColorMap?.get(previousNode.id()) ?? previousNode.style('background-color'),
      });
    }
  }

  if (cyFocusNode.id() && !cyFocusNode.data().isUserNode) {
    dispatch(
      ConversationActions.addOrUpdateMessages({
        messages: [
          {
            id: focusNode.id,
            role: Role.User,
            content: focusNode.question ?? '',
            references: focusNode.references,
          },

          {
            id: getFocusNodeResponseId(focusNode.id),
            role: Role.Assistant,
            content: focusNode.details ?? '',
            availableNodes: neighbors,
            references: focusNode.references,
          },
        ],
        isInitialization,
      }),
    );
  } else {
    dispatch(
      ConversationActions.updateResponseOfMessage({
        messageId: focusNode.id,
        values: {
          availableNodes: neighbors,
          references: focusNode.references,
        },
      }),
    );
  }
}
