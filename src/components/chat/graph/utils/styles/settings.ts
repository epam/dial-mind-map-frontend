import { colord } from 'colord';
import merge from 'lodash-es/merge';
import omit from 'lodash-es/omit';

import { DefaultCytoscapeImagedNodeStatesStyles } from '@/constants/appearances/defaultConfig';
import {
  BranchColors,
  CytoscapeNodeStyles,
  CytoscapeNodeStylesWithStates,
  CytoscapeNodeTypesStyles,
  GraphNodeState,
  GraphNodeType,
  NodeStylesKey,
  PaletteSettings,
} from '@/types/customization';

import { NodeTextColor } from '../../options';

export const getVisitedBgColor = (colors: BranchColors) =>
  colors.visitedBgColor ? colors.visitedBgColor : colord(colors.bgColor).darken(0.05).toHex();

export const getVisitedTextColor = (colors: BranchColors) =>
  colors.visitedTextColor ? colors.visitedTextColor : getTextColor(colors);

export const getVisitedBorderColor = (colors: BranchColors) =>
  colors.visitedBorderColor ? colors.visitedBorderColor : colors.borderColor || getVisitedBgColor(colors);

export const getBgColor = (colors: BranchColors) => colors.bgColor;

export const getTextColor = (colors: BranchColors) => colors.textColor || NodeTextColor;

export const getBorderColor = (colors: BranchColors) => colors.borderColor || getBgColor(colors);

export const getEdgeColor = (nodeBgColor: string, settings: PaletteSettings) => {
  const currentBranchSettings = settings.branchesColors.find(bc => bc.bgColor === nodeBgColor);

  if (currentBranchSettings?.edgeColor) {
    return currentBranchSettings?.edgeColor;
  }

  const calculated = colord(nodeBgColor).darken(0.05).toHex();

  return calculated;
};

export const getImagedNodeDimension = (
  type: GraphNodeType,
  dimension: NodeStylesKey.Width | NodeStylesKey.Height,
  nodeStateStyles: CytoscapeNodeTypesStyles,
): number => nodeStateStyles?.[type]?.[dimension] ?? DefaultCytoscapeImagedNodeStatesStyles?.[type]?.[dimension] ?? 0;

const getNodeStyles = ({
  type,
  state,
  nodeStateStyles,
}: {
  type: GraphNodeType;
  state?: GraphNodeState;
  nodeStateStyles: CytoscapeNodeTypesStyles;
}): CytoscapeNodeStyles | undefined => {
  const baseStyles = nodeStateStyles?.[GraphNodeType.Base] as CytoscapeNodeStylesWithStates | undefined;
  const typeStyles = nodeStateStyles?.[type] as CytoscapeNodeStylesWithStates | undefined;

  if (type === GraphNodeType.Base || (!state && !typeStyles)) {
    return baseStyles ? omit(baseStyles, 'states') : undefined;
  }

  if (state) {
    return typeStyles?.states?.[state] ?? baseStyles?.states?.[state];
  }

  return typeStyles ? omit(typeStyles, 'states') : baseStyles ? omit(baseStyles, 'states') : undefined;
};

export const getMergedNodeStyles = ({
  type,
  state,
  nodeStateStyles,
  mergeMode = 'none',
}: {
  type: GraphNodeType;
  state?: GraphNodeState;
  nodeStateStyles: CytoscapeNodeTypesStyles;
  mergeMode?: 'none' | 'base' | 'type';
}): CytoscapeNodeStyles | undefined => {
  const baseStyles = getNodeStyles({ type: GraphNodeType.Base, nodeStateStyles });
  const typeStyles = getNodeStyles({ type, nodeStateStyles });
  const stateStyles = getNodeStyles({ type, state, nodeStateStyles });

  if (mergeMode === 'base') {
    return merge({}, baseStyles, typeStyles, stateStyles);
  }

  if (mergeMode === 'type') {
    return merge({}, typeStyles, stateStyles);
  }

  return stateStyles;
};
