import {
  DEFAULT_CONVERSATION_NAME,
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_TEMPERATURE,
  FALLBACK_MODEL_ID,
} from '@/constants/settings';
import { AttachmentTitle, AttachmentType, Conversation, Message, Role } from '@/types/chat';

import { cleanConversation } from '../clean';
import { constructPath } from '../file';

jest.mock('../file', () => ({
  constructPath: jest.fn().mockReturnValue('mocked/path'),
}));

jest.mock('../id', () => ({
  getConversationRootId: jest.fn().mockReturnValue('root-id'),
}));

describe('cleanConversation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns defaults when no fields are provided', () => {
    const result = cleanConversation({});
    expect(result.id).toBe('mocked/path');
    expect(result.folderId).toBe('root-id');
    expect(result.name).toBe(DEFAULT_CONVERSATION_NAME);
    expect(result.prompt).toBe(DEFAULT_SYSTEM_PROMPT);
    expect(result.temperature).toBe(DEFAULT_TEMPERATURE);
    expect(result.model).toEqual({ id: FALLBACK_MODEL_ID });
    expect(result.messages).toEqual([]);
    expect(result.lastActivityDate).toBe(0);
    expect(result.updatedAt).toBe(0);
    expect(result.selectedAddons).toEqual([]);
    expect(result.customViewState).toEqual({
      customElements: { edges: [], nodes: [] },
      focusNodeId: '',
      visitedNodeIds: {},
    });
  });

  it('uses existing id and folderId if provided', () => {
    const result = cleanConversation({ id: 'custom-id', folderId: 'folder-1' });
    expect(result.id).toBe('custom-id');
    expect(result.folderId).toBe('folder-1');
    expect(constructPath).not.toHaveBeenCalled();
  });

  it('constructs id with constructPath when id is missing', () => {
    const result = cleanConversation({ name: 'Conversation Name' });
    expect(constructPath).toHaveBeenCalledWith('root-id', 'Conversation Name');
    expect(result.id).toBe('mocked/path');
  });

  it('cleans messages by removing unwanted fields and keeping attachments (title, type)', () => {
    const conversation = {
      messages: [
        {
          id: 'msg-1',
          role: Role.User,
          content: 'Hello',
          custom_content: {
            attachments: [
              {
                title: AttachmentTitle['Used references'],
                type: AttachmentType.References,
                url: 'https://example.com/file',
                extra: 'remove-me', // should be removed
              } as any,
            ],
            state: { ignoredField: true },
          },
          settings: { prompt: 'test', temperature: 0.5 },
        } as Message,
      ],
    } as Partial<Conversation>;

    const result = cleanConversation(conversation);

    expect(result.messages[0]).toEqual({
      id: 'msg-1',
      role: Role.User,
      content: 'Hello',
      custom_content: {
        attachments: [
          {
            title: AttachmentTitle['Used references'],
            type: AttachmentType.References,
          },
        ],
      },
    });
  });

  it('sets empty attachments when custom_content is missing', () => {
    const conversation = {
      messages: [{ id: 'msg-1', role: Role.User, content: 'No attachments' }],
    } as Partial<Conversation>;

    const result = cleanConversation(conversation);
    expect(result.messages[0].custom_content?.attachments).toEqual([]);
  });

  it('keeps customViewState and selectedAddons if provided', () => {
    const customViewState = {
      customElements: { edges: [{ id: 'e1' } as any], nodes: [{ id: 'n1' } as any] },
      focusNodeId: 'n1',
      visitedNodeIds: { n1: 'yes' },
    };

    const result = cleanConversation({
      customViewState,
      selectedAddons: ['addon1', 'addon2'],
    });

    expect(result.customViewState).toEqual(customViewState);
    expect(result.selectedAddons).toEqual(['addon1', 'addon2']);
  });

  it('keeps provided model id', () => {
    const result = cleanConversation({ model: { id: 'custom-model' } });
    expect(result.model.id).toBe('custom-model');
  });
});
