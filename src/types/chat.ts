import { CaptchaToken, Entity } from './common';
import { MIMEType } from './files';
import { ColoredNode, Edge, Element, GraphElement, Node, Reference } from './graph';

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
  'Founded graph node' = 'Founded graph node',
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
  like?: LikeState;
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

export interface RateBody {
  responseId: string;
  value: boolean;
  comment?: string;
}

export enum LikeState {
  Disliked = -1,
  Liked = 1,
  NoState = 0,
}

export interface Playback {
  isPlayback?: boolean;
  messagesStack: Message[];
  activePlaybackIndex: number;
  customViewState: ViewState;
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

  playback?: Playback;
}

export enum PlaybackActionType {
  Init = 'init',
  UpdateConversation = 'updateConversation',
  ChangeFocusNode = 'changeFocusNode',
  FillInput = 'fillInput',
  ChangeDepth = 'changeDepth',
  AIGenerateMessage = 'AIGenerateMessage',
}

export interface PlaybackAction {
  type: PlaybackActionType;
  mindmap: {
    elements: Element<GraphElement>[];
    focusNodeId: string;
    visitedNodes: Record<string, string>;
    depth: 1 | 2;
  };
  chat?: {
    userMessage?: string;
    previousMessage?: Message;
  };
}

export interface ViewState {
  focusNodeId: string;
  visitedNodeIds: Record<string, string>;
  customElements: CustomElements;
  playbackActions?: PlaybackAction[];
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
