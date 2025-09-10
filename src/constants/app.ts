import { NodeStatus } from '@/types/graph';

export const NodeStatusDict = {
  [NodeStatus.Draft]: 'Draft',
  [NodeStatus.ReviewRequired]: 'Review required',
  [NodeStatus.Reviewed]: 'Reviewed',
};

export const NodeEditorMinWidth = 300;
export const NodeEditorMaxWidth = 800;
export const NodeEditorDefaultWidth = 480;

export const BytesInMb = 1_048_576;
export const BytesInKb = 1_024;

export enum AllowedSourceFilesTypes {
  PDF = 'application/pdf',
  PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  HTML = 'text/html',
}

export const AllowedSourceFilesTypesList: AllowedSourceFilesTypes[] = [
  AllowedSourceFilesTypes.PPTX,
  AllowedSourceFilesTypes.HTML,
  AllowedSourceFilesTypes.PDF,
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
