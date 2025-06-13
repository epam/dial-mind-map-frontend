import { NodeSingular } from 'cytoscape';

import { getColorizedIconPath } from '@/utils/app/graph/icons';

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

export const getCytoscapeStyles = (mindmapFolder: string): cytoscape.StylesheetStyle[] => {
  return [
    {
      selector: 'node',
      style: {
        shape: 'round-rectangle',
        label: 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        color: '#F3F4F6',
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
      },
    },
    {
      selector: 'edge',
      style: {
        width: NormalEdgeWidth,
        'arrow-scale': 0.7,
        'line-color': '#424952',
        'target-arrow-color': '#424952',
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
        'border-color': '#424952',
        'background-color': '#141a23',
        'border-width': NormalBorderWidth,
      },
    },
    {
      selector: 'node[status = "review-required"]',
      style: {
        'border-color': '#F4CE46',
        'background-color': '#3F3D25',
        'border-width': NormalBorderWidth,
      },
    },
    {
      selector: 'node[status = "reviewed"]',
      style: {
        'border-color': '#37BABC',
        'background-color': '#1d3841',
        'border-width': NormalBorderWidth,
      },
    },
    {
      selector: 'node.root',
      style: {
        'background-color': '#7F8792',
        'border-width': NormalBorderWidth,
        'font-weight': 'bolder',
        color: RootNodeTextColor,
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
      selector: 'node:selected',
      style: {
        'border-color': '#5c8dea',
      },
    },
    {
      selector: 'node[?icon]',
      style: {
        'background-image': (node: NodeSingular) => {
          const color = node.hasClass('root') ? RootNodeTextColor : NodeTextColor;
          const iconPath = node.data('icon') as string;
          return getColorizedIconPath(iconPath, color, mindmapFolder) ?? 'none';
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
      selector: 'edge[type = "Generated"]',
      style: {
        'z-index': -1,
        'line-style': 'dashed',
        'line-color': '#222932',
      },
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#5c8dea',
        'target-arrow-color': '#5c8dea',
      },
    },

    // eh
    {
      selector: '.eh-handle',
      style: {
        'background-color': '#5c8dea',
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
        'background-color': '#5c8dea',
      },
    },

    {
      selector: '.eh-source',
      style: {
        'border-width': NormalBorderWidth,
        'border-color': '#5c8dea',
      },
    },

    {
      selector: '.eh-target',
      style: {
        'border-width': NormalBorderWidth,
        'border-color': '#5c8dea',
      },
    },

    {
      selector: '.eh-preview, .eh-ghost-edge',
      style: {
        'background-color': '#5c8dea',
        'line-color': '#5c8dea',
        'target-arrow-color': '#5c8dea',
        'source-arrow-color': '#5c8dea',
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
