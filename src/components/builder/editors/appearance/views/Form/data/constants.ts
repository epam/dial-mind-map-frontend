import { EdgeLineStyle, GraphNodeType, NodeStylesKey } from '@/types/customization';

import { ToggleOption } from '../components/common/ToggleGroup';

export const FIELD_NAME_DIVIDER = '__';

export enum MindmapColorFields {
  BG_COLOR = 'bgColor',
  TEXT_COLOR = 'textColor',
  BORDER_COLOR = 'borderColor',
  EDGE_COLOR = 'edgeColor',
  VISITED_BG_COLOR = 'visitedBgColor',
  VISITED_TEXT_COLOR = 'visitedTextColor',
  VISITED_BORDER_COLOR = 'visitedBorderColor',
}

export enum MindmapColorFocusedNodeFields {
  BG_COLOR = 'bgColor',
  TEXT_COLOR = 'textColor',
  BORDER_COLOR = 'borderColor',
}

export const MindmapColorMandatoryFieldsList: MindmapColorFields[] = [MindmapColorFields.BG_COLOR];

export const MindmapColorFocusNodeFieldsList: MindmapColorFocusedNodeFields[] = [
  MindmapColorFocusedNodeFields.BG_COLOR,
  MindmapColorFocusedNodeFields.TEXT_COLOR,
  MindmapColorFocusedNodeFields.BORDER_COLOR,
];

export const MindmapColorDefaultFieldsList: MindmapColorFields[] = [
  MindmapColorFields.BG_COLOR,
  MindmapColorFields.TEXT_COLOR,
  MindmapColorFields.BORDER_COLOR,
  MindmapColorFields.EDGE_COLOR,
];

export const MindmapColorVisitedFieldsList: MindmapColorFields[] = [
  MindmapColorFields.VISITED_BG_COLOR,
  MindmapColorFields.VISITED_TEXT_COLOR,
  MindmapColorFields.VISITED_BORDER_COLOR,
];

export enum MindmapColorFieldNames {
  BG_COLOR = `Background`,
  TEXT_COLOR = `Text`,
  BORDER_COLOR = `Border`,
  EDGE_COLOR = `Edge`,
}

export const GraphNodeTypesToColumnNames: Record<GraphNodeType, string> = {
  [GraphNodeType.Base]: 'Base',
  [GraphNodeType.Root]: 'Root',
  [GraphNodeType.Level1]: '1st level node',
  [GraphNodeType.Level2]: '2nd level node',
};

export const NodeStylesKeysToRowNames: Record<NodeStylesKey, string> = {
  [NodeStylesKey.Width]: 'Width',
  [NodeStylesKey.Height]: 'Height',
  [NodeStylesKey.FontSize]: 'Font size',
  [NodeStylesKey.TextMarginY]: 'Text margin Y',
};

export const MindmapColorFocusNodeFieldNamesList: MindmapColorFieldNames[] = [
  MindmapColorFieldNames.BG_COLOR,
  MindmapColorFieldNames.TEXT_COLOR,
  MindmapColorFieldNames.BORDER_COLOR,
];

export const MindmapColorFieldNamesList: MindmapColorFieldNames[] = [
  MindmapColorFieldNames.BG_COLOR,
  MindmapColorFieldNames.TEXT_COLOR,
  MindmapColorFieldNames.BORDER_COLOR,
  MindmapColorFieldNames.EDGE_COLOR,
];

export const MindmapColorVisitedFieldNamesList: MindmapColorFieldNames[] = [
  MindmapColorFieldNames.BG_COLOR,
  MindmapColorFieldNames.TEXT_COLOR,
  MindmapColorFieldNames.BORDER_COLOR,
];

export enum ReferenceBadgeColorCategoriesKeys {
  BACKGROUND = 'backgroundColor',
  TEXT = 'textColor',
}

export const ReferenceBadgeColorCategoriesNames: Record<ReferenceBadgeColorCategoriesKeys, string> = {
  [ReferenceBadgeColorCategoriesKeys.BACKGROUND]: 'Background',
  [ReferenceBadgeColorCategoriesKeys.TEXT]: 'Text',
};

export enum ReferenceBadgeColorCategoriesFieldNames {
  DEFAULT = 'Default',
  HOVERED = 'Hover',
  SELECTED = 'Selected',
}

export const ReferenceBadgeColorCategoriesFieldNamesList: ReferenceBadgeColorCategoriesFieldNames[] = [
  ReferenceBadgeColorCategoriesFieldNames.DEFAULT,
  ReferenceBadgeColorCategoriesFieldNames.HOVERED,
  ReferenceBadgeColorCategoriesFieldNames.SELECTED,
];

export enum ReferenceBadgeColorCategoriesFields {
  DEFAULT = 'default',
  HOVERED = 'hovered',
  SELECTED = 'selected',
}

export const ReferenceBadgeColorCategoriesFieldsList: ReferenceBadgeColorCategoriesFields[] = [
  ReferenceBadgeColorCategoriesFields.DEFAULT,
  ReferenceBadgeColorCategoriesFields.HOVERED,
  ReferenceBadgeColorCategoriesFields.SELECTED,
];

export const EdgeLineStyleList: ToggleOption<EdgeLineStyle>[] = [
  {
    label: 'Solid',
    value: EdgeLineStyle.Solid,
    className: 'border-solid',
    buttonActiveClassName: 'border-accent-primary',
  },
  {
    label: 'Dashed',
    value: EdgeLineStyle.Dashed,
    className: 'border-dashed',
    buttonActiveClassName: 'border-accent-primary',
  },
  {
    label: 'Dotted',
    value: EdgeLineStyle.Dotted,
    className: 'border-dotted',
    buttonActiveClassName: 'border-accent-primary',
  },
];

export enum SemanticColorsCategoriesFieldNames {
  BACKGROUND = 'Background',
  ICON = 'Icon',
  Border = 'Border',
  EXAMPLE = 'Example',
}

export const SemanticColorsCategoriesFieldNamesList: Array<SemanticColorsCategoriesFieldNames | null> = [
  SemanticColorsCategoriesFieldNames.BACKGROUND,
  SemanticColorsCategoriesFieldNames.ICON,
  SemanticColorsCategoriesFieldNames.Border,
  null,
  SemanticColorsCategoriesFieldNames.EXAMPLE,
];

export enum SemanticColorsCategoriesKeys {
  ERROR = 'error',
  Info = 'info',
}

export const SemanticColorsCategoriesNames: Record<SemanticColorsCategoriesKeys, string> = {
  [SemanticColorsCategoriesKeys.ERROR]: 'Error',
  [SemanticColorsCategoriesKeys.Info]: 'Info',
};

export enum ChatSide {
  LEFT = 'left',
  RIGHT = 'right',
}

interface SideConfig {
  id: string;
  label: string;
  value: ChatSide;
}

export const sidesConfigs: SideConfig[] = [
  {
    id: 'left-side',
    label: 'Left side',
    value: ChatSide.LEFT,
  },
  {
    id: 'right-side',
    label: 'Right side',
    value: ChatSide.RIGHT,
  },
];
