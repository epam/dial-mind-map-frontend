import { AttachmentType, Message } from '@/types/chat';

export const parseStreamMessages = (message: string): Partial<Message>[] => {
  const parsedMessage = message
    .split('\0')
    .filter(msg => !!msg)
    .map(chunk => JSON.parse(chunk));

  return parsedMessage;
};

export const mergeMessages = (source: Message, newMessages: Partial<Message>[]) => {
  const newSource = structuredClone(source);
  newMessages.forEach(newData => {
    if (newData.errorMessage) {
      newSource.errorMessage = newData.errorMessage;
    }

    if (newData.role) {
      newSource.role = newData.role;
    }

    if (newData.responseId) {
      newSource.responseId = newData.responseId;
    }

    if (newData.content) {
      if (!newSource.content) {
        newSource.content = '';
      }
      newSource.content += newData.content;
    }

    if (newData.custom_content) {
      if (!newSource.custom_content) {
        newSource.custom_content = {};
      }

      if (newData.custom_content.attachments) {
        if (!newSource.custom_content.attachments) {
          newSource.custom_content.attachments = [];
        }

        newSource.custom_content.attachments = newSource.custom_content.attachments.concat(
          newData.custom_content.attachments,
        );

        const attachmentReferences = newSource.custom_content.attachments.find(
          attachment => attachment.type === AttachmentType.References,
        );
        if (attachmentReferences) {
          if (!newSource.references) {
            newSource.references = { docs: [], nodes: [] };
          }
          const references = JSON.parse(attachmentReferences.data || '{}');
          if (references.docs) {
            newSource.references.docs = newSource.references.docs.concat(references.docs);
          }
          if (references.nodes) {
            newSource.references.nodes = newSource.references.nodes.concat(references.nodes);
          }
        }
      }

      if (newData.custom_content.state) {
        newSource.custom_content.state = newData.custom_content.state;
      }
    }
  });
  return newSource;
};
