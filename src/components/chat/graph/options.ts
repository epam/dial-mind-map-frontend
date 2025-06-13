import { AI_ROBOT_ICON_NAME } from '@/constants/app';
import { getColorizedIconPath } from '@/utils/app/graph/icons';

import { getIcon } from './utils/icons/icons';
import { getNeonBackground } from './utils/styles/neonBackground';
import { getHeight, getWidth } from './utils/styles/styles';

export const AnimationDurationMs = 700;
export const FitDurationMs = 200;
export const HoverDurationMs = 200;
export const WidthAdjustmentDurationMs = 100;

export const DefaultGraphDepth = 2;
export const MaxVisibleNodesCount = 19;
export const ThinEdgesCountThreshold = 5;
export const NormalEdgeWidth = 2.5;
export const ThinEdgeWidth = 1.5;

export const ExtraWidthForNodesWithImages = 10;
export const ExtraFontWhileHovering = 1;

export const RootNeighborsFontSize = '10px';
export const LeafsFontSize = '8px';

export const TabletWidthPx = 768;

// numbers of colors from markup
// 9, 5, 3, 7, 8,
// 4, 6, 2, 1,
export const BranchColors = [
  '#8C1756',
  '#046280',
  '#41712B',
  '#422471',
  '#6E2573',
  '#136758',
  '#233B78',
  '#9E531D',
  '#932A2A',
] as const;

export type BranchColor = (typeof BranchColors)[number];

export const BranchColorsMap: Record<BranchColor, string> = {
  '#8C1756': '#58133B',
  '#046280': '#064054',
  '#41712B': '#2A4721',
  '#422471': '#2B1B4B',
  '#6E2573': '#461B4D',
  '#136758': '#0F433C',
  '#233B78': '#192950',
  '#9E531D': '#5B3318',
  '#932A2A': '#5C1E21',
};

export const DefaultEdgeColor = '#333942';
export const FocusNodeColor = '#DDE1E6';
export const FocusNodeTextColor = '#090D13';
export const FocusNodeBorderColor = '#F3F4F6';
export const NodeTextColor = '#F3F4F6';
export const NewNodeColor = '#02050A';
export const GraphPadding = 10;

export const LeftwardArrowSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="${NodeTextColor}" opacity="0.4"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9.586 4l-6.586 6.586a2 2 0 0 0 0 2.828l6.586 6.586a2 2 0 0 0 2.18 .434l.145 -.068a2 2 0 0 0 1.089 -1.78v-2.586h7a2 2 0 0 0 2 -2v-4l-.005 -.15a2 2 0 0 0 -1.995 -1.85l-7 -.001v-2.585a2 2 0 0 0 -3.414 -1.414z" /></svg>`;

export const InitLayoutOptions = {
  name: 'fcose',
  quality: 'proof',
  animate: true,
  initialEnergyOnIncremental: 0.8,
  nodeRepulsion: () => 70000,
  idealEdgeLength: () => 30,
  edgeElasticity: () => 0.4,
  nestingFactor: 0.5,
  gravity: 0.1,
  gravityCompound: 0.1,
  padding: GraphPadding,
  fit: true,
  animationDuration: AnimationDurationMs,
  numIter: 10000,
};

export const SecondLayoutOptions = {
  name: 'fcose',
  randomize: false,
  animationDuration: AnimationDurationMs,

  // compact graph
  nodeRepulsion: 10000,
  idealEdgeLength: 30,
  edgeElasticity: 0.8,
};
const NeonBoundsExpansion = 30;
const IconXOffset = 6;

// export const NeonPadding = 20;
// const IconXNeonOffset = 15;

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
        // 'font-family': 'var(--font-montserrat)',
        'font-size': '7px',
        'line-height': 1.3,
        'border-width': 0.5,
        'border-color': 'transparent',
        padding: '8px',
        height: 'label',
        width: getWidth,
        'text-margin-y': 0.5,
      },
    },
    {
      selector: 'node[?neon][!icon]',
      style: {
        width: getWidth,
        height: getHeight,
        'background-image': getNeonBackground,
        'border-width': 0,
        'background-image-opacity': 1,
        'bounds-expansion': NeonBoundsExpansion,
        'background-image-containment': 'over',
        'background-clip': 'none',
      },
    },
    {
      selector: 'node[?icon][!neon]',
      style: {
        padding: '8px',
        'background-image': node => {
          const iconName = node.data('icon');
          const color = node.hasClass('focused') ? FocusNodeTextColor : NodeTextColor;
          const icon =
            iconName === AI_ROBOT_ICON_NAME
              ? getIcon(AI_ROBOT_ICON_NAME, color)
              : getColorizedIconPath(iconName, color, mindmapFolder);
          return icon ?? 'none';
        },
        'background-width': '11px',
        'background-height': '11px',
        'background-position-x': IconXOffset,
        'text-margin-x': 8,
      },
    },
    {
      selector: 'node[?icon][?neon]',
      style: {
        'background-image': node => {
          const neonBackground =
            node.hasClass('previous') || node.hasClass('visited') ? 'none' : getNeonBackground(node);
          const iconPath = node.data('icon');
          const color = node.hasClass('focused') ? FocusNodeTextColor : NodeTextColor;
          const icon =
            iconPath === AI_ROBOT_ICON_NAME
              ? getIcon(AI_ROBOT_ICON_NAME, color)
              : (getColorizedIconPath(iconPath, color, mindmapFolder) ?? 'none');

          return [icon, neonBackground];
        },
        'border-width': 0,
        'background-image-opacity': [1, 1],

        'background-width': ['11px', 'auto'],
        'background-height': ['11px', 'auto'],

        'background-position-x': [IconXOffset, '50%'],
        'background-position-y': ['50%', '50%'],

        'background-clip': ['node', 'none'],
        'background-image-containment': 'over',
        'bounds-expansion': 50,

        'background-opacity': 1,

        'text-margin-x': 8,
      },
    },

    {
      selector: 'node.imaged',
      style: {
        padding: '8px',
        'background-image': node => {
          const iconName = node.data('icon');
          return getIcon(iconName, NodeTextColor);
        },
        'background-width': '11px',
        'background-height': '11px',
        'background-position-x': '6px',
        // @ts-expect-error margin
        'text-margin-x': '8px',
      },
    },
    {
      selector: 'node.focused',
      style: {
        'background-image': node => {
          const iconName = node.data('icon');
          const color = node.hasClass('focused') ? FocusNodeTextColor : NodeTextColor;
          const icon =
            iconName === AI_ROBOT_ICON_NAME
              ? getIcon(AI_ROBOT_ICON_NAME, color)
              : getColorizedIconPath(iconName, color, mindmapFolder);

          return icon ?? 'none';
        },
      },
    },
    {
      selector: 'node[!neon].visited',
      style: {
        'background-image-opacity': 0.6,
        'border-width': 0,
      },
    },
    {
      selector: 'node[?neon][!icon].visited',
      style: {
        'background-image-opacity': 0,
        'border-width': 0,
      },
    },
    {
      selector: 'node[?neon][?icon].visited',
      style: {
        'background-image-opacity': [1, 0],
        'border-width': 0,
      },
    },
    {
      selector: 'node.visited.focused',
      style: {
        'background-image-opacity': 1,
        'background-opacity': 1,
      },
    },
    {
      selector: 'node[?neon].previous',
      style: {
        'background-image': () => {
          const icon = getIcon('arrow-back', NodeTextColor);
          return [icon];
        },
        'border-width': 0,
        'background-image-opacity': [0.6],
        'background-clip': ['node', 'none'],
        'bounds-expansion': NeonBoundsExpansion,
        'background-image-containment': 'over',
        'background-width': '11px',
        'background-height': '11px',
        // @ts-expect-error margin
        'text-margin-x': '8px',
      },
    },
    {
      selector: 'node[!neon].previous',
      style: {
        'background-image': () => getIcon('arrow-back', NodeTextColor),
        'background-width': '11px',
        'background-height': '11px',
        'background-position-x': IconXOffset,
        'text-margin-x': 8,
      },
    },
    {
      selector: 'edge',
      style: {
        width: NormalEdgeWidth,
        'line-color': '#333942',
      },
    },
    {
      selector: 'node:active',
      style: {
        'overlay-opacity': 0,
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
  ];
};
