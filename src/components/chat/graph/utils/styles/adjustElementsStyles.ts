import { CollectionReturnValue, Core, Css, NodeSingular } from 'cytoscape';
import omit from 'lodash-es/omit';

import {
  DefaultLevel1NodeFontSize,
  DefaultLevel2NodeFontSize,
  DefaultRootNodeFontSize,
  DefaultVisitedNodeTextOpacity,
} from '@/constants/app';
import { GraphConfig, GraphNodeType, NodeStylesKey, PaletteSettings } from '@/types/customization';
import { SystemNodeDataKeys } from '@/types/graph';
import { isNode } from '@/utils/app/graph/typeGuards';

import {
  AnimationDurationMs,
  ExtraWidthForNodesWithImages,
  FocusNodeColor,
  FocusNodeTextColor,
  WidthAdjustmentDurationMs,
} from '../../options';
import { IconsMap } from '../icons/icons';
import {
  getBgColor,
  getBorderColor,
  getEdgeColor,
  getImagedNodeDimension,
  getMergedNodeStyles,
  getTextColor,
  getVisitedBgColor,
  getVisitedBorderColor,
  getVisitedTextColor,
} from './settings';
import { getWidth, startPulsate } from './styles';

export const adjustElementsStyles = (
  cy: Core,
  focusNodeId: string,
  visitedNodesIds: string[],
  previousNodeId: string,
  graphConfig: GraphConfig,
  fontFamily?: string,
) => {
  const nodeColorMap = new Map<string, string>();
  const nodeMainColorMap = new Map<string, string>();
  const focusNode = cy.getElementById(focusNodeId);
  const paletteSettings = graphConfig.paletteSettings;

  cy.batch(() => {
    adjustStylesOfBranches(
      cy,
      focusNodeId,
      visitedNodesIds,
      paletteSettings,
      nodeColorMap,
      nodeMainColorMap,
      graphConfig,
      fontFamily,
    );
    adjustStylesOfFocusNode(focusNode, nodeColorMap, graphConfig, fontFamily, paletteSettings.focusedNodeColors);
    adjustStylesOfNeighborsOfFocusNode(focusNode, graphConfig);
    adjustStylesOfEdges(cy, focusNodeId, nodeMainColorMap, paletteSettings);
    adjustStylesOfVisitedNodes(cy, focusNodeId, previousNodeId, visitedNodesIds);
    adjustStylesOfPreviousNode(cy, focusNodeId, previousNodeId);
    adjustWidthAndStylesOfImagedNodes(
      cy,
      focusNodeId,
      previousNodeId,
      visitedNodesIds,
      graphConfig.useNodeIconAsBgImage,
    );
  });

  return nodeColorMap;
};

export function adjustNeonedNodeStyles(node: NodeSingular) {
  if (
    node.data(SystemNodeDataKeys.Pulsating) ||
    node.hasClass('focused') ||
    node.hasClass('visited') ||
    node.hasClass('previous')
  ) {
    return;
  }

  node.data(SystemNodeDataKeys.Pulsating, true);
  node.style('background-image-opacity', 1);
  const isAnimated = node.animated();
  if (isAnimated) {
    return;
  }
  startPulsate(node);
}

function adjustStylesOfBranches(
  cy: Core,
  focusNodeId: string,
  visitedNodesIds: string[],
  paletteSettings: PaletteSettings,
  nodeColorMap: Map<string, string>,
  nodeMainColorMap: Map<string, string>,
  graphConfig: GraphConfig,
  fontFamily?: string,
) {
  const parents = cy
    .nodes()
    .map(node => node.data(SystemNodeDataKeys.Parent))
    .filter((v, i, a) => a.indexOf(v) === i && !!v)
    .sort();

  const branchColors = paletteSettings.branchesColors;

  parents.forEach((parent, index) => {
    const colorIndex = index < branchColors.length ? index : index % branchColors.length;
    const currentBranchColors = branchColors[colorIndex];

    cy.nodes(`[parent="${parent}"]`).forEach(node => {
      if (!node) return;

      node.data(SystemNodeDataKeys.BranchColorIndex, colorIndex);

      if (graphConfig.useNodeIconAsBgImage) {
        const width = getImagedNodeDimension(
          GraphNodeType.Level2,
          NodeStylesKey.Width,
          graphConfig.cytoscapeStyles.node,
        );
        node.style({
          width: width,
          'text-max-width': width,
          height: getImagedNodeDimension(GraphNodeType.Level2, NodeStylesKey.Height, graphConfig.cytoscapeStyles.node),
        });
      }

      node.data(SystemNodeDataKeys.NodeType, GraphNodeType.Level2);

      let customStyles =
        getMergedNodeStyles({
          type: GraphNodeType.Level2,
          nodeStateStyles: graphConfig.cytoscapeStyles.node,
          mergeMode: 'base',
        }) ?? {};

      if (!graphConfig.useNodeIconAsBgImage) {
        customStyles = omit(customStyles, NodeStylesKey.Width, NodeStylesKey.Height, NodeStylesKey.TextMarginY);
      }

      // fallback for mindmaps that doesn't configure hover effect
      if (customStyles && !customStyles.width && !customStyles[NodeStylesKey.FontSize]) {
        customStyles[NodeStylesKey.FontSize] = DefaultLevel2NodeFontSize;
      }

      if (node.id() !== focusNodeId && visitedNodesIds.includes(node.id())) {
        node.addClass('visited');

        node.style({
          ...customStyles,
          'font-weight': 'normal',
          'font-family': fontFamily,
        });

        const color = getVisitedTextColor(currentBranchColors);
        const bgColor = getVisitedBgColor(currentBranchColors);
        const borderColor = getVisitedBorderColor(currentBranchColors);

        const hasCustomVisitedColor = !!currentBranchColors.visitedTextColor;

        node.data(SystemNodeDataKeys.BgColor, bgColor);
        node.data(SystemNodeDataKeys.TextColor, color);
        node.data(SystemNodeDataKeys.BorderColor, borderColor);

        const style: Css.Node = {
          'border-color': borderColor,
          'background-color': bgColor,
          'text-opacity': hasCustomVisitedColor ? 1 : DefaultVisitedNodeTextOpacity,
          color,
        };

        node.animate({
          queue: false,
          style,
          duration: AnimationDurationMs,
        });
        nodeColorMap.set(node.id(), bgColor);
      } else {
        const color = getTextColor(currentBranchColors);
        const bgColor = getBgColor(currentBranchColors);
        const borderColor = getBorderColor(currentBranchColors);

        node.data(SystemNodeDataKeys.BgColor, bgColor);
        node.data(SystemNodeDataKeys.TextColor, color);
        node.data(SystemNodeDataKeys.BorderColor, borderColor);

        const style = {
          'background-color': bgColor,
          'border-color': borderColor,
          'text-opacity': 1,
          color,
        };

        node.style({
          ...customStyles,
          'font-weight': 'normal',
          'font-family': fontFamily,
        });
        node.animate({
          queue: false,
          style: style,
          duration: AnimationDurationMs,
        });
        nodeColorMap.set(node.id(), currentBranchColors.bgColor);
      }
      nodeMainColorMap.set(node.id(), currentBranchColors.bgColor);
    });
  });
}

function adjustStylesOfFocusNode(
  focusNode: CollectionReturnValue,
  nodeColorMap: Map<string, string>,
  graphConfig: GraphConfig,
  fontFamily?: string,
  focusedNodeColors?: PaletteSettings['focusedNodeColors'],
) {
  const color = focusedNodeColors?.textColor || FocusNodeTextColor;
  const bgColor = focusedNodeColors?.bgColor || FocusNodeColor;
  const borderColor = focusedNodeColors?.borderColor || FocusNodeColor;

  const focusNodeStyle = {
    'border-color': borderColor,
    'background-color': bgColor,
    color,
  };

  focusNode.data(SystemNodeDataKeys.NodeType, GraphNodeType.Root);
  focusNode.data(SystemNodeDataKeys.BgColor, bgColor);
  focusNode.data(SystemNodeDataKeys.TextColor, color);
  focusNode.data(SystemNodeDataKeys.BorderColor, borderColor);

  let customStyles =
    getMergedNodeStyles({
      type: GraphNodeType.Root,
      nodeStateStyles: graphConfig.cytoscapeStyles.node,
      mergeMode: 'base',
    }) ?? {};

  if (!graphConfig.useNodeIconAsBgImage) {
    customStyles = omit(customStyles, NodeStylesKey.Width, NodeStylesKey.Height, NodeStylesKey.TextMarginY);
  }

  // fallback for mindmaps that doesn't configure hover effect
  if (customStyles && !customStyles.width && !customStyles[NodeStylesKey.FontSize]) {
    customStyles[NodeStylesKey.FontSize] = DefaultRootNodeFontSize;
  }

  focusNode.style({
    ...customStyles,
    'text-opacity': 1,
    'font-weight': 'bold',
    'font-family': fontFamily,
  });

  if (graphConfig.useNodeIconAsBgImage) {
    const width = getImagedNodeDimension(GraphNodeType.Root, NodeStylesKey.Width, graphConfig.cytoscapeStyles.node);
    focusNode.style({
      width: width,
      'text-max-width': width,
      height: getImagedNodeDimension(GraphNodeType.Root, NodeStylesKey.Height, graphConfig.cytoscapeStyles.node),
    });
  }

  focusNode.animate({
    queue: false,
    style: focusNodeStyle,
    duration: AnimationDurationMs,
  });
  nodeColorMap.set(focusNode.id(), FocusNodeColor);
}

function adjustStylesOfNeighborsOfFocusNode(focusNode: CollectionReturnValue, graphConfig: GraphConfig) {
  let customStyles =
    getMergedNodeStyles({
      type: GraphNodeType.Level1,
      nodeStateStyles: graphConfig.cytoscapeStyles.node,
      mergeMode: 'base',
    }) ?? {};

  if (!graphConfig.useNodeIconAsBgImage) {
    customStyles = omit(customStyles, NodeStylesKey.Width, NodeStylesKey.Height, NodeStylesKey.TextMarginY);
  }

  // fallback for mindmaps that doesn't configure hover effect
  if (customStyles && !customStyles.width && !customStyles[NodeStylesKey.FontSize]) {
    customStyles[NodeStylesKey.FontSize] = DefaultLevel1NodeFontSize;
  }

  focusNode.neighborhood().forEach(neighbor => {
    if (isNode(neighbor.data())) {
      neighbor.data(SystemNodeDataKeys.NodeType, GraphNodeType.Level1);

      neighbor.style(customStyles);

      if (graphConfig.useNodeIconAsBgImage) {
        const width = getImagedNodeDimension(
          GraphNodeType.Level1,
          NodeStylesKey.Width,
          graphConfig.cytoscapeStyles.node,
        );
        neighbor.style({
          width: width,
          'text-max-width': width,
          height: getImagedNodeDimension(GraphNodeType.Level1, NodeStylesKey.Height, graphConfig.cytoscapeStyles.node),
        });
      }
    }
  });
}

function adjustStylesOfEdges(
  cy: Core,
  focusNodeId: string,
  nodeMainColorMap: Map<string, string>,
  paletteSettings: PaletteSettings,
) {
  // const edgesCount = cy.edges().length;
  cy.edges().forEach(edge => {
    const node = edge
      .connectedNodes()
      .filter(edge => edge.id() !== focusNodeId)
      .first();

    const style = {
      //TODO: will be uncommented later
      // width: edgesCount <= ThinEdgesCountThreshold ? ThinEdgeWidth : NormalEdgeWidth,
      'line-color': '#333942',
      'target-arrow-color': '#333942',
    };

    const nodesColor = nodeMainColorMap.get(node.id());
    if (nodesColor) {
      const color = getEdgeColor(nodesColor, paletteSettings);

      style['line-color'] = color;
      style['target-arrow-color'] = color;
    }

    edge.animate({
      queue: false,
      style: style,
      duration: AnimationDurationMs,
    });
  });
}

function adjustStylesOfVisitedNodes(cy: Core, focusNodeId: string, previousNodeId: string, visitedNodesIds: string[]) {
  visitedNodesIds.forEach(nodeId => {
    if (nodeId !== previousNodeId || nodeId === focusNodeId) {
      const node = cy.getElementById(nodeId);
      node.removeClass('previous');
      if (!node.data('icon')) {
        node.removeClass('imaged');
      }
    }
  });
}

function adjustStylesOfPreviousNode(cy: Core, focusNodeId: string, previousNodeId: string) {
  cy.nodes('.previous').forEach(n => {
    if (n.id() !== previousNodeId) {
      n.removeClass('previous');
    }
  });

  if (previousNodeId && previousNodeId !== focusNodeId) {
    const node = cy.getElementById(previousNodeId);
    node.addClass('previous');
    if (!node.hasClass('imaged')) {
      node.addClass('imaged');
    }
  }
}

function adjustWidthAndStylesOfImagedNodes(
  cy: Core,
  focusNodeId: string,
  previousNodeId: string,
  visitedNodesIds: string[],
  useNodeIconAsBgImage?: boolean,
) {
  cy.nodes().forEach(node => {
    if (!node.data('label').startsWith('#parent-')) {
      const iconName = node.data('icon');
      const hasIcon = !!(iconName && IconsMap[iconName]);

      if (hasIcon) {
        node.addClass('imaged');
      }

      node.toggleClass('focused', node.id() === focusNodeId);

      if (!hasIcon && (node.id() !== previousNodeId || node.id() === focusNodeId) && node.hasClass('imaged')) {
        node.removeClass('imaged');
      }

      if (!visitedNodesIds.includes(node.id()) && node.hasClass('visited')) {
        node.removeClass('visited');
      }

      if (!useNodeIconAsBgImage) {
        let width = getWidth(node);
        if (node.hasClass('imaged') || node.data('icon')) {
          width += ExtraWidthForNodesWithImages;
        }

        node.animate({
          style: {
            width: width,
          },
          duration: WidthAdjustmentDurationMs,
          queue: false,
        });
      }
    }
  });
}
