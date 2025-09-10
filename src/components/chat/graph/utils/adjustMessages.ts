import { Dispatch, UnknownAction } from '@reduxjs/toolkit';

import { NEW_QUESTION_LABEL } from '@/constants/app';
import { ConversationActions } from '@/store/chat/conversation/conversation.reducers';
import { Role } from '@/types/chat';
import { ColoredNode, Node, SystemNodeDataKeys } from '@/types/graph';
import { getFocusNodeResponseId } from '@/utils/app/conversation';
import { getColorizedIconPath, getColorizedStorageIconPath } from '@/utils/app/graph/icons';

import { getSystemImage, isSystemImg } from './icons/icons';

interface AdjustMessagesParams {
  cyInstance: cytoscape.Core;
  focusNode: Node;
  dispatch: Dispatch<UnknownAction>;
  mindmapAppName: string;
  mindmapFolder: string;
  theme: string;
  nodeColorMap?: Map<string, string>;
  previousNodeId?: string;
  isInitialization: boolean | null;
  defaultBgImg?: string;
  needToUpdateInBucket?: boolean;
}

const getNodeImage = ({
  img,
  customImg,
  color,
  mindmapAppName,
  theme,
  mindmapFolder,
}: {
  img: string;
  customImg?: string;
  color: string;
  mindmapAppName: string;
  mindmapFolder: string;
  theme: string;
}) => {
  let image = undefined;
  if (!isSystemImg(img)) {
    image = getColorizedIconPath(img, color, mindmapFolder);
    if (!image && customImg) {
      image = getColorizedStorageIconPath(customImg, color, mindmapAppName, theme, mindmapFolder);
    }
  } else {
    return getSystemImage({
      img,
      customImg,
      color,
      mindmapAppName,
      mindmapFolder,
      theme,
    });
  }
  return image;
};

export function adjustMessages({
  cyInstance,
  focusNode,
  dispatch,
  mindmapAppName,
  mindmapFolder,
  theme,
  nodeColorMap,
  previousNodeId,
  isInitialization,
  defaultBgImg,
  needToUpdateInBucket,
}: AdjustMessagesParams) {
  const cyFocusNode = cyInstance.getElementById(focusNode.id);

  if (cyFocusNode.data()?.label === NEW_QUESTION_LABEL) {
    return;
  }

  const neighbors = cyFocusNode
    .neighborhood()
    .filter(ele => ele.isNode() && ele.id() !== previousNodeId)
    .map(node => {
      const iconPath = node.data('icon');
      const textColor = node.data(SystemNodeDataKeys.TextColor);

      const image = getNodeImage({
        img: iconPath,
        color: textColor,
        customImg: defaultBgImg,
        mindmapAppName,
        mindmapFolder,
        theme,
      });

      return {
        id: node.id(),
        label: node.data('label'),
        color: nodeColorMap?.get(node.id()) ?? node.style('background-color'),
        textColor: node.data(SystemNodeDataKeys.TextColor),
        borderColor: node.data(SystemNodeDataKeys.BorderColor),
        branchColorIndex: node.data(SystemNodeDataKeys.BranchColorIndex),
        image,
      } as ColoredNode;
    })
    .sort((a, b) => Number(a.id) - Number(b.id));

  if (previousNodeId) {
    const previousNode = cyInstance.getElementById(previousNodeId);
    if (previousNode.id() && previousNode.id() !== focusNode.id) {
      const iconPath = previousNode.data('icon');
      const textColor = previousNode.data(SystemNodeDataKeys.TextColor);

      const image = getNodeImage({
        img: iconPath,
        color: textColor,
        customImg: defaultBgImg,
        mindmapAppName,
        mindmapFolder,
        theme,
      });

      neighbors.push({
        id: previousNode.id(),
        label: previousNode.data('label'),
        color: nodeColorMap?.get(previousNode.id()) ?? previousNode.style('background-color'),
        textColor: previousNode.data(SystemNodeDataKeys.TextColor),
        borderColor: previousNode.data(SystemNodeDataKeys.BorderColor),
        branchColorIndex: previousNode.data(SystemNodeDataKeys.BranchColorIndex),
        image,
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
        needToUpdateInBucket: needToUpdateInBucket,
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
