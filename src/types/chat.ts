import { CaptchaToken, Entity } from './common';
import { MIMEType } from './files';
import { ColoredNode, Edge, Element, Node, Reference } from './graph';

export interface Attachment {
  index?: number;
  type: AttachmentType;
  title: AttachmentTitle;
  data?: string;
  url?: string;
  reference_type?: MIMEType;
  reference_url?: string;
}

export enum AttachmentTitle {
  'Used references' = 'Used references',
  'Generated graph node' = 'Generated graph node',
}

export enum AttachmentType {
  Graph = 'application/vnd.dial.mindmap.graph.v1+json',
  References = 'application/vnd.dial.mindmap.references.v1+json',
}

export interface MessageSettings {
  prompt: string;
  temperature: number;
}

export interface Message {
  role: Role;
  content: string;
  id?: string;
  availableNodes?: ColoredNode[];
  references?: Reference;
  custom_content?: {
    attachments?: Attachment[];
    state?: object;
  };
  errorMessage?: string;
  model?: ConversationEntityModel;
  settings?: MessageSettings;
  responseId?: string;
}

export interface CustomFields {
  configuration: {
    force_answer_generation: boolean;
    target_node_id?: string;
  };
}

export enum Role {
  Assistant = 'assistant',
  User = 'user',
  System = 'system',
}

export interface ChatBody extends CaptchaToken {
  modelId: string;
  messages: Message[];
  id: string;
  prompt?: string;
  temperature?: number;
  selectedAddons?: string[];
  assistantModelId?: string;
  custom_fields?: CustomFields;
}

export interface Conversation extends ConversationInfo {
  messages: Message[];
  prompt: string;
  temperature: number;
  // required
  selectedAddons: string[];

  customViewState: ViewState;

  isMessageStreaming?: boolean;
  isApplicationPreviewConversation?: boolean;
}

export interface ViewState {
  focusNodeId: string;
  visitedNodeIds: Record<string, string>;
  customElements: CustomElements;
}

export interface CustomElements {
  nodes: Element<Node>[];
  edges: Element<Edge>[];
}

export interface ConversationEntityModel {
  id: string;
}

export interface ConversationInfo extends Entity {
  model: ConversationEntityModel;
  lastActivityDate?: number;
  updatedAt?: number;
}

export interface PrepareNameOptions {
  forRenaming: boolean;
  replaceWithSpacesForRenaming: boolean;
  trimEndDotsRequired: boolean;
}
