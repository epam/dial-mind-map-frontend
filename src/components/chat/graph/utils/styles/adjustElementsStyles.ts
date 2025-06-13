import { CollectionReturnValue, Core, NodeSingular } from 'cytoscape';

import {
  AnimationDurationMs,
  BranchColor,
  BranchColors,
  BranchColorsMap,
  ExtraWidthForNodesWithImages,
  FocusNodeColor,
  FocusNodeTextColor,
  LeafsFontSize,
  NodeTextColor,
  RootNeighborsFontSize,
  WidthAdjustmentDurationMs,
} from '../../options';
import { IconsMap } from '../icons/icons';
import { getWidth, startPulsate } from './styles';

export const adjustElementsStyles = (
  cy: Core,
  focusNodeId: string,
  visitedNodesIds: string[],
  previousNodeId: string,
) => {
  const nodeColorMap = new Map<string, string>();
  const nodeMainColorMap = new Map<string, string>();
  const focusNode = cy.getElementById(focusNodeId);

  cy.batch(() => {
    adjustStylesOfBranches(cy, focusNodeId, visitedNodesIds, nodeColorMap, nodeMainColorMap);
    adjustStylesOfFocusNode(focusNode, nodeColorMap);
    adjustStylesOfNeighborsOfFocusNode(focusNode);
    adjustStylesOfEdges(cy, focusNodeId, nodeMainColorMap);
    adjustStylesOfVisitedNodes(cy, focusNodeId, previousNodeId, visitedNodesIds);
    adjustStylesOfPreviousNode(cy, focusNodeId, previousNodeId);
    adjustStylesOfImagedNodes(cy, focusNodeId, previousNodeId, visitedNodesIds);
  });

  return nodeColorMap;
};

export function adjustNeonedNodeStyles(node: NodeSingular) {
  if (node.data('pulsating') || node.hasClass('focused') || node.hasClass('visited') || node.hasClass('previous')) {
    return;
  }
  node.data('pulsating', true);
  node.style('background-image-opacity', 1);
  startPulsate(node);
}

function adjustStylesOfBranches(
  cy: Core,
  focusNodeId: string,
  visitedNodesIds: string[],
  nodeColorMap: Map<string, string>,
  nodeMainColorMap: Map<string, string>,
) {
  const parents = cy
    .nodes()
    .map(node => node.data('parent'))
    .filter((v, i, a) => a.indexOf(v) === i && !!v)
    .sort();

  parents.forEach((parent, index) => {
    const colorIndex = index < BranchColors.length ? index : index % BranchColors.length;

    cy.nodes(`[parent="${parent}"]`).forEach(node => {
      if (!node) return;

      if (node.id() !== focusNodeId && visitedNodesIds.includes(node.id())) {
        node.addClass('visited');
        node.style({
          'font-weight': 'normal',
          'font-size': LeafsFontSize,
        });

        const color = BranchColorsMap[BranchColors[colorIndex]];
        node.data('bg-color', color);
        node.animate({
          queue: false,
          style: {
            'border-color': color,
            'background-color': color,
            'text-opacity': 0.4,
            color: NodeTextColor,
          },
          duration: AnimationDurationMs,
        });
        nodeColorMap.set(node.id(), color);
      } else {
        const style = {
          'background-color': BranchColors[colorIndex],
          'border-color': BranchColors[colorIndex],
          'text-opacity': 1,
          color: NodeTextColor,
        };
        const color = BranchColors[colorIndex];
        node.data('bg-color', color);
        node.style({
          'font-weight': 'normal',
          'font-size': LeafsFontSize,
        });
        node.animate({
          queue: false,
          style: style,
          duration: AnimationDurationMs,
        });
        nodeColorMap.set(node.id(), BranchColors[colorIndex]);
      }
      nodeMainColorMap.set(node.id(), BranchColors[colorIndex]);
    });
  });
}

function adjustStylesOfFocusNode(focusNode: CollectionReturnValue, nodeColorMap: Map<string, string>) {
  const focusNodeStyle = {
    'border-color': FocusNodeColor,
    'background-color': FocusNodeColor,
    color: FocusNodeTextColor,
  };
  focusNode.style({
    'text-opacity': 1,
    'font-size': RootNeighborsFontSize,
    'font-weight': 'bold',
  });

  focusNode.animate({
    queue: false,
    style: focusNodeStyle,
    duration: AnimationDurationMs,
  });
  nodeColorMap.set(focusNode.id(), FocusNodeColor);
}

function adjustStylesOfNeighborsOfFocusNode(focusNode: CollectionReturnValue) {
  focusNode.neighborhood().forEach(neighbor => {
    neighbor.style({
      'font-size': RootNeighborsFontSize,
    });
  });
}

function adjustStylesOfEdges(cy: Core, focusNodeId: string, nodeMainColorMap: Map<string, string>) {
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

    const nodesColor = nodeMainColorMap.get(node.id()) as BranchColor;
    if (nodesColor) {
      style['line-color'] = BranchColorsMap[nodesColor];
      style['target-arrow-color'] = BranchColorsMap[nodesColor];
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
  if (previousNodeId && previousNodeId !== focusNodeId) {
    const node = cy.getElementById(previousNodeId);
    node.addClass('previous');
    if (!node.hasClass('imaged')) {
      node.addClass('imaged');
    }
  }
}

function adjustStylesOfImagedNodes(cy: Core, focusNodeId: string, previousNodeId: string, visitedNodesIds: string[]) {
  cy.nodes().forEach(node => {
    const iconName = node.data('icon');
    const hasIcon = !!(iconName && IconsMap[iconName]);

    if (hasIcon) {
      node.addClass('imaged');
    }

    node.toggleClass('focused', node.id() === focusNodeId);

    if (!hasIcon && (node.id() !== previousNodeId || node.id() === focusNodeId) && node.hasClass('imaged')) {
      node.removeClass('imaged');
    }

    let width = getWidth(node);
    if (node.hasClass('imaged') || node.data('icon')) {
      width += ExtraWidthForNodesWithImages;
    }

    if (!visitedNodesIds.includes(node.id()) && node.hasClass('visited')) {
      node.removeClass('visited');
    }

    node.animate({
      style: {
        width: width,
      },
      duration: WidthAdjustmentDurationMs,
      queue: false,
    });
  });
}
