import escapeRegExp from 'lodash-es/escapeRegExp';
import { substring } from 'stringz';

import { Application } from '@/types/application';
import { ConversationInfo } from '@/types/chat';
import { PartialBy } from '@/types/common';

import { getConversationApiKey, parseConversationApiKey } from '../server/api';
import { constructPath } from './file';
import { splitEntityId } from './folders';
import { getConversationRootId } from './id';

export const notAllowedSymbols = ':;,=/{}%&\\"';
export const notAllowedSymbolsRegex = new RegExp(
  `[${escapeRegExp(notAllowedSymbols)}]|(\r\n|\n|\r|\t)|[\x00-\x1F]`,
  'gm',
);

export const MAX_ENTITY_LENGTH = 160;

export const prepareEntityName = (name: string) => {
  const clearName = name.replace(notAllowedSymbolsRegex, '').trim();
  const result = clearName.length > MAX_ENTITY_LENGTH ? substring(clearName, 0, MAX_ENTITY_LENGTH) : clearName;

  const additionalCuttedResult = result.length > MAX_ENTITY_LENGTH ? result.substring(0, MAX_ENTITY_LENGTH) : result;

  return additionalCuttedResult.trim();
};

export function generateUniqueConversationName(
  userMessage: string,
  existingNames: string[],
  isAllowApiKey?: boolean,
): string {
  if (isAllowApiKey) {
    return '';
  }

  const baseName = prepareEntityName(userMessage);

  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  let counter = 1;
  let newName = `${baseName} ${counter}`;

  while (existingNames.includes(newName)) {
    counter++;
    newName = `${baseName} ${counter}`;
  }

  return newName;
}

export const getGeneratedConversationId = (conversation: Omit<ConversationInfo, 'id'>): string => {
  if (conversation.folderId) {
    return constructPath(conversation.folderId, getConversationApiKey(conversation));
  }
  return constructPath(getConversationRootId(), getConversationApiKey(conversation));
};

export const regenerateConversationId = <T extends ConversationInfo>(conversation: PartialBy<T, 'id'>): T => {
  const newId = getGeneratedConversationId(conversation);
  if (!conversation.id || newId !== conversation.id) {
    return {
      ...conversation,
      id: newId,
    } as T;
  }
  return conversation as T;
};

export const getConversationInfoFromId = (
  id: string,
): ConversationInfo & {
  bucket: string;
} => {
  const { name, bucket, apiKey, parentPath } = splitEntityId(id);

  return regenerateConversationId({
    ...parseConversationApiKey(name),
    folderId: constructPath(apiKey, bucket, parentPath),
    bucket,
  });
};

export const getLocalConversationInfo = (
  application?: Application,
): ConversationInfo & {
  bucket: string;
} => {
  return {
    id: `conversations/default-bucket/${application?.reference ?? ''}`,
    model: { id: '' },
    name: application?.name ?? '',
    bucket: 'default-bucket',
  };
};

export const getNodeResponseId = (nodeId: string) => `${nodeId}-response`;

export const getDuplicateMessageId = (uniqId: string, id: string) => `${uniqId}-${id}`;
