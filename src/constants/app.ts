import { NodeStatus } from '@/types/graph';

export const NodeStatusDict = {
  [NodeStatus.Draft]: 'Draft',
  [NodeStatus.ReviewRequired]: 'Review required',
  [NodeStatus.Reviewed]: 'Reviewed',
};

export const NodeEditorMinWidth = 300;
export const NodeEditorMaxWidth = 800;
export const NodeEditorDefaultWidth = 480;

export const MIN_TABLET_WIDTH_DEFAULT = 768;
export const MIN_DESKTOP_WIDTH_DEFAULT = 1280;

export const BytesInMb = 1_048_576;
export const BytesInKb = 1_024;

export enum AllowedSourceFilesTypes {
  PDF = 'application/pdf',
  PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  HTML = 'text/html',
  TXT = 'text/plain',
}

export const AllowedSourceFilesTypesList: AllowedSourceFilesTypes[] = [
  AllowedSourceFilesTypes.PPTX,
  AllowedSourceFilesTypes.HTML,
  AllowedSourceFilesTypes.PDF,
  AllowedSourceFilesTypes.TXT,
];
export const AllowedIconsTypes: string[] = ['image/*'];

export const AllowedFontsExtensions: string[] = ['.ttf', '.otf', '.woff', '.woff2'];

export const MindmapSourcesFolderName = 'sources';
export const MindmapIconsFolderName = 'icons';

export const ModelCursorSign = '▍';

export const NEW_QUESTION_LABEL = 'Thinking...';

export const AI_ROBOT_ICON_NAME = 'ai-robot';
export const ARROW_BACK_ICON_NAME = 'arrow-back';

export const SourceProcessingTimeLimitMs = 2 * 60 * 1000;

export const CustomStylesTagId = 'x-custom-styles';

export const ChatInputPlaceholder = 'Type your question';

export const DefaultGraphNodeShape = 'round-rectangle';

export const DefaultMaxNodesLimit = 19;

export const DefaultGraphNodeFontSize = 10;

export const DefaultRootNodeFontSize = 7;
export const DefaultHoveredRootNodeFontSize = 7;

export const DefaultLevel1NodeFontSize = 7;
export const DefaultHoveredLevel1NodeFontSize = 8;

export const DefaultLevel2NodeFontSize = 6;
export const DefaultHoveredLevel2NodeFontSize = 7;

export const DefaultEdgeWidth = 2.5;

export const DefaultVisitedNodeBgImageOpacity = 0.6;

export const DefaultVisitedNodeTextOpacity = 0.4;

export const DefaultGraphNodeBorderWidth = 0.5;

export const DefaultGraphNodePadding = 8;

export const DefaultFontFamily = 'Montserrat';

export const INPUT_DEBOUNCE = 500;

export const PERSISTENT_FONT_PRELOADER_ELEMENT_ID = 'font-preload-span';

export const DEFAULT_CHAT_PROMPT =
  'Describe the AI’s personality and how it should behave. Set the rules for answering questions, and specify the style, tone, and format of its responses.';

export const DEFAULT_CHAT_GUARDRAILS_PROMPT =
  'Describe the AI’s safety rules and communication limits. Specify any topics the AI must avoid and any additional restrictions it should follow.';

export const DEFAULT_CHAT_GUARDRAILS_RESPONSE_PROMPT =
  'Describe how the AI must refuse requests that break its guardrails rules. Indicate the tone of the refusal, the wording it should use, and whether it should explain why the request is denied.';

export const DEFAULT_LITE_MODE_PROMPT =
  'Describe the rules for building the mind map, set the main theme and key focus areas. Specify the style and language.';

export const DEFAULT_LITE_MODE_TOKENS_LIMIT = 100_000;

export const FEEDBACK_MESSAGE_LIMIT = 2000;
