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

export const AllowedSourceFilesTypes: string[] = [
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/html',
  'application/pdf',
];
export const AllowedIconsTypes: string[] = ['image/*'];

export const MindmapSourcesFolderName = 'sources';
export const MindmapIconsFolderName = 'icons';

export const ModelCursorSign = '▍';

export const NEW_QUESTION_LABEL = 'Thinking...';

export const AI_ROBOT_ICON_NAME = 'ai-robot';

export const SourceProcessingTimeLimitMs = 2 * 60 * 1000;
