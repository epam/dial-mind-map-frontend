import { NodeSingular } from 'cytoscape';

import { getColorizedIconPath } from '@/utils/app/graph/icons';

import { readGraphCssVars } from './utils/graph/cssVar';
import { getDarkenedNodeColor, getHeight, getWidth } from './utils/styles/styles';

export const NodeTextColor = '#F3F4F6';
export const RootNodeTextColor = '#141A23';

export const GraphPadding = 5;
export const NormalEdgeWidth = 1.5;
export const NormalBorderWidth = 1;
export const NavigatedNodePadding = 400;
export const NodeNavigationDuration = 650;

export const BaseEdgeHandlerSize = 5;
export const MaxEdgeHandlerSize = 20;
export const BaseEdgeHandlerOffset = 5;

const ColorDarkenPercent = 50;

export const getCytoscapeStyles = (mindmapId: string): cytoscape.StylesheetStyle[] => {
  const vars = readGraphCssVars();

  return [
    {
      selector: 'node',
      style: {
        shape: 'round-rectangle',
        label: 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        color: vars.nodeText,
        'font-size': '8px',
        'font-weight': 'normal',
        'line-height': 1.3,
        'border-width': NormalBorderWidth,
        'border-color': 'transparent',
        padding: '7px',
        'text-wrap': 'wrap',
        'text-max-width': '60px',
        width: getWidth,
        height: getHeight,
        'text-margin-y': 0.5,
        'background-color': vars.nodeBackground,
      },
    },
    {
      selector: 'edge',
      style: {
        width: NormalEdgeWidth,
        'arrow-scale': 0.7,
        'line-color': vars.edgeColor,
        'target-arrow-color': vars.edgeColor,
        'source-arrow-color': vars.edgeColor,
        'curve-style': 'bezier',
        // 'curve-style': 'unbundled-bezier',

        'target-arrow-shape': 'triangle',
      },
    },
    {
      selector: 'node:parent',
      style: {
        // show/hide compound node
        'background-opacity': 0,
        'border-opacity': 0,
        label: '',
        events: 'no',
      },
    },
    {
      selector: 'node[status = "draft"], node[!status]',
      style: {
        'background-color': vars.nodeBackground,
        'border-color': vars.nodeBackground,
      },
    },
    {
      selector: 'node.root',
      style: {
        'background-color': vars.rootNodeBackground,
        'font-weight': 'bolder',
        color: vars.nodeText,
        'border-color': vars.rootNodeBackground,
      },
    },
    {
      selector: 'node[status = "review-required"]',
      style: {
        'border-color': vars.reviewRequiredBorder,
        'border-width': NormalBorderWidth,
      },
    },
    {
      selector: 'node[status = "reviewed"]',
      style: {
        'border-color': vars.reviewedBorder,
        'border-width': NormalBorderWidth,
      },
    },

    {
      selector: 'edge.shaded',
      style: {
        // @ts-expect-error opacity
        opacity: '0.5',
      },
    },
    {
      selector: 'node:active',
      style: {
        'overlay-opacity': 0,
      },
    },
    {
      selector: 'node[?icon]',
      style: {
        'background-image': (node: NodeSingular) => {
          const color = vars.nodeText;
          const iconPath = node.data('icon') as string;
          return getColorizedIconPath(iconPath, color, mindmapId) ?? 'none';
        },
        'background-image-opacity': 1,
        'background-width': '11px',
        'background-height': '11px',
        'background-position-x': '6px',
        // @ts-expect-error text-margin-x
        'text-margin-x': '8px',
        width: (node: NodeSingular) => getWidth(node) + 14,
      },
    },
    {
      selector: 'node.shaded',
      style: {
        'background-color': (node: NodeSingular) => getDarkenedNodeColor(node, 'background-color', ColorDarkenPercent),
        'border-color': (node: NodeSingular) => getDarkenedNodeColor(node, 'border-color', ColorDarkenPercent),
        color: (node: NodeSingular) => getDarkenedNodeColor(node, 'color', ColorDarkenPercent),
        'background-image-opacity': 0.6,
      },
    },
    {
      selector: 'node:selected',
      style: {
        'border-color': vars.focusedBorder,
      },
    },
    {
      selector: 'edge[type = "Generated"]',
      style: {
        'z-index': -1,
        'line-style': 'dashed',
        'line-color': '#222932',
      },
    },
    {
      selector: 'edge[?reverseEdge]',
      style: {
        'source-arrow-shape': 'triangle',
      },
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': vars.focusedBorder,
        'target-arrow-color': vars.focusedBorder,
        'source-arrow-color': vars.focusedBorder,
      },
    },

    // eh
    {
      selector: '.eh-handle',
      style: {
        'background-color': vars.focusedBorder,
        width: 12,
        height: 12,
        shape: 'ellipse',
        'overlay-opacity': 0,
        'border-width': 12, // makes the handle easier to hit
        'border-opacity': 0,
      },
    },

    {
      selector: '.eh-hover',
      style: {
        'background-color': vars.focusedBorder,
      },
    },

    {
      selector: '.eh-source',
      style: {
        'border-width': NormalBorderWidth,
        'border-color': vars.focusedBorder,
      },
    },

    {
      selector: '.eh-target',
      style: {
        'border-width': NormalBorderWidth,
        'border-color': vars.focusedBorder,
      },
    },

    {
      selector: '.eh-preview, .eh-ghost-edge',
      style: {
        'background-color': vars.focusedBorder,
        'line-color': vars.focusedBorder,
        'target-arrow-color': vars.focusedBorder,
        'source-arrow-color': vars.focusedBorder,
      },
    },

    {
      selector: '.eh-ghost-edge.eh-preview-active',
      style: {
        opacity: 0,
      },
    },

    {
      selector: '.ghost-edge',
      style: {
        opacity: 0,
      },
    },
  ];
};
