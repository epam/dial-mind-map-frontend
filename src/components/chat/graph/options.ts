import { NodeSingular, StylesheetStyle } from 'cytoscape';

import {
  ARROW_BACK_ICON_NAME,
  DefaultEdgeWidth,
  DefaultGraphNodeBorderWidth,
  DefaultGraphNodePadding,
  DefaultRootNodeFontSize,
  DefaultVisitedNodeBgImageOpacity,
} from '@/constants/app';
import { DefaultCytoscapeLayoutSettings } from '@/constants/appearances/defaultConfig';
import {
  CytoscapeLayoutSettings,
  GraphConfig,
  GraphImgResourceKey,
  GraphNodeType,
  NodeStylesKey,
} from '@/types/customization';
import { SystemNodeDataKeys } from '@/types/graph';
import { getColorizedIconPath, getColorizedStorageIconPath } from '@/utils/app/graph/icons';

import { getSystemImage, isSystemImg } from './utils/icons/icons';
import { getNeonBackground } from './utils/styles/neonBackground';
import { getMergedNodeStyles } from './utils/styles/settings';
import { getSingleImageBgOpacity, getWidth } from './utils/styles/styles';

export const AnimationDurationMs = 700;
export const FitDurationMs = 200;
export const HoverDurationMs = 200;
export const WidthAdjustmentDurationMs = 100;

export const DefaultGraphDepth = 2;
export const MaxVisibleNodesCount = 19;
export const ThinEdgesCountThreshold = 5;

const IconSize = 10;
const IconNodeTextMarginX = 8;
export const ExtraWidthForNodesWithImages = IconSize + IconNodeTextMarginX / 2;
export const ExtraFontWhileHovering = 1;

export const TabletWidthPx = 768;

export const FocusNodeColor = '#DDE1E6';
export const FocusNodeTextColor = '#090D13';
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

export const getSecondLayoutOptions = (settings?: CytoscapeLayoutSettings) => {
  const defaultSettings = {
    name: 'fcose',
    randomize: false,
    animationDuration: AnimationDurationMs,
    ...DefaultCytoscapeLayoutSettings,
  };

  if (!settings) return defaultSettings;

  return {
    ...defaultSettings,
    ...settings,
  };
};

const NeonBoundsExpansion = 30;

// export const NeonPadding = 20;
// const IconXNeonOffset = 15;

interface StyleContext {
  mindmapAppName: string;
  theme: string;
  config?: GraphConfig;
  fontFamily?: string;
  robotStorageIcon?: string;
  arrowBackStorageIcon?: string;
  padding: string | number;
  useNodeIconAsBgImage: boolean;
  maskImg?: string;
  defaultBgImg?: string;
}

export const getCytoscapeStyles = (
  mindmapAppName: string,
  theme: string,
  config?: GraphConfig,
  fontFamily?: string,
  robotStorageIcon?: string,
  arrowBackStorageIcon?: string,
): cytoscape.StylesheetStyle[] => {
  const padding = config?.cytoscapeStyles.node?.base?.padding ?? DefaultGraphNodePadding;
  const useNodeIconAsBgImage = config?.useNodeIconAsBgImage ?? false;
  const maskImg = config?.images?.[GraphImgResourceKey.BorderImg];
  const defaultBgImg = config?.images?.[GraphImgResourceKey.DefaultBgImg];

  const context: StyleContext = {
    mindmapAppName,
    theme,
    config,
    fontFamily,
    robotStorageIcon,
    arrowBackStorageIcon,
    padding,
    useNodeIconAsBgImage,
    maskImg,
    defaultBgImg,
  };

  const styles: StylesheetStyle[] = [buildBaseNodeStyle(context)];

  if (useNodeIconAsBgImage) {
    styles.push(buildUnimagedStyles(context));
  }

  styles.push(
    ...buildImagedStyles(context),
    ...buildNeonedStyles(context),
    ...buildVisitedAndPreviousNodeStyles(context),
  );

  styles.push(buildEdgeStyle(context), buildActiveNodeStyle(), buildCompoundNodeStyle());

  return styles;
};

function buildBaseNodeStyle(ctx: StyleContext): cytoscape.StylesheetStyle {
  return {
    selector: 'node',
    style: {
      shape: 'round-rectangle',
      label: 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      color: '#F3F4F6',
      width: getWidth,
      height: 'label',
      'font-family': ctx.fontFamily,
      'font-size': DefaultRootNodeFontSize,
      'line-height': 1.3,
      'border-width': DefaultGraphNodeBorderWidth,
      'border-color': 'transparent',
      padding: ctx.padding,
      ...(!ctx.useNodeIconAsBgImage && { height: 'label' }),
      ...ctx.config?.cytoscapeStyles.node?.base,
    } as cytoscape.Css.Node,
  };
}

function buildImagedStyles(ctx: StyleContext): cytoscape.StylesheetStyle[] {
  return [
    {
      selector: 'node[?icon][!neon]',
      style: {
        'background-image': node => {
          const iconPath = node.data('icon');
          const color = node.data(SystemNodeDataKeys.TextColor);

          let icon;
          const isSystemIcon = isSystemImg(iconPath);
          if (ctx.useNodeIconAsBgImage && isSystemIcon) {
            if (ctx.defaultBgImg) {
              icon = getColorizedStorageIconPath(ctx.defaultBgImg, color, ctx.mindmapAppName, ctx.theme);
            }
          } else if (isSystemIcon) {
            icon = getSystemImage({
              img: iconPath,
              customImg: ctx.robotStorageIcon,
              color,
              mindmapAppName: ctx.mindmapAppName,
              theme: ctx.theme,
            });
          } else {
            icon = getColorizedIconPath(iconPath, color, ctx.mindmapAppName);
          }

          if (ctx.useNodeIconAsBgImage && ctx.maskImg) {
            const maskImg = getColorizedStorageIconPath(ctx.maskImg, color, ctx.mindmapAppName, ctx.theme);

            return [icon ?? 'none', maskImg ?? 'none'];
          } else {
            return [icon ?? 'none'];
          }
        },
        ...(ctx.useNodeIconAsBgImage
          ? {
              // 100.5% is a workaround to ensure the border is always slightly larger than the main image, preventing the floating '1px border' issue.
              'background-width': ['100%', '100.5%'],
              'background-height': ['100%', '100.5%'],
              'background-clip': ['node', 'none'],
              'background-repeat': ['no-repeat', 'no-repeat'],
              'background-position-x': ['50%', '50%'],
              'background-position-y': ['50%', '50%'],
            }
          : {
              'text-margin-x': IconNodeTextMarginX,
              'background-width': IconSize,
              'background-height': IconSize,
              'background-position-x': ctx.padding,
              'background-image-containment': 'over',
              'background-clip': 'none',
            }),
      },
    },
  ];
}

function buildUnimagedStyles(ctx: StyleContext): cytoscape.StylesheetStyle {
  return {
    selector: 'node[!icon]',
    style: {
      'background-image': (node: NodeSingular) => {
        let bgImg;
        let maskImg;
        const color = node.data(SystemNodeDataKeys.TextColor);

        if (ctx.defaultBgImg) {
          bgImg = getColorizedStorageIconPath(ctx.defaultBgImg, color, ctx.mindmapAppName, ctx.theme);
        }

        if (ctx.maskImg) {
          maskImg = getColorizedStorageIconPath(ctx.maskImg, color, ctx.mindmapAppName, ctx.theme);
        }

        return [bgImg ?? 'none', maskImg ?? 'none'];
      },
      // 100.5% is a workaround to ensure the border is always slightly larger than the main image, preventing the floating '1px border' issue.
      'background-width': ['100%', '100.5%'],
      'background-height': ['100%', '100.5%'],
      'background-clip': ['node', 'none'],
      'background-repeat': ['no-repeat', 'no-repeat'],
      'background-position-x': ['50%', '50%'],
      'background-position-y': ['50%', '50%'],
    },
  };
}

function buildNeonedStyles(ctx: StyleContext): cytoscape.StylesheetStyle[] {
  return [
    {
      selector: 'node[?neon][!icon]',
      style: {
        'background-image': node => {
          const type = node.data(SystemNodeDataKeys.NodeType) as GraphNodeType;
          const customStyles = getMergedNodeStyles({ type, nodeStateStyles: ctx.config?.cytoscapeStyles.node });
          const neonBackground =
            node.hasClass('previous') || node.hasClass('visited') || node.hasClass('focused')
              ? 'none'
              : getNeonBackground(node, customStyles?.[NodeStylesKey.FontSize]);
          return neonBackground;
        },
        'background-image-opacity': 1,
        'bounds-expansion': NeonBoundsExpansion,
        'background-image-containment': 'over',
        'background-clip': 'none',
      },
    },
    {
      selector: 'node[?icon][?neon]',
      style: {
        'background-image': node => {
          const type = node.data(SystemNodeDataKeys.NodeType) as GraphNodeType;
          const customStyles = getMergedNodeStyles({ type, nodeStateStyles: ctx.config?.cytoscapeStyles.node });
          const neonBackground =
            node.hasClass('previous') || node.hasClass('visited') || node.hasClass('focused')
              ? 'none'
              : getNeonBackground(node, customStyles?.[NodeStylesKey.FontSize]);
          const iconPath = node.data('icon');
          const color = node.data(SystemNodeDataKeys.TextColor);

          let icon;
          if (isSystemImg(iconPath)) {
            icon = getSystemImage({
              img: iconPath,
              customImg: ctx.robotStorageIcon,
              color,
              mindmapAppName: ctx.mindmapAppName,
              theme: ctx.theme,
            });
          } else {
            icon = getColorizedIconPath(iconPath, color, ctx.mindmapAppName);
          }

          return [icon ?? 'none', neonBackground];
        },
        'background-image-opacity': [1, 1],
        'background-width': [IconSize, 'auto'],
        'background-height': [IconSize, 'auto'],
        'background-position-x': [ctx.padding, '50%'],
        'background-position-y': ['50%', '50%'],
        'background-clip': ['none', 'none'],
        'background-image-containment': 'over',
        'bounds-expansion': 50,
        'background-opacity': 1,
        'text-margin-x': IconNodeTextMarginX,
      },
    },
    { selector: 'node[?neon][!icon].visited', style: { 'background-image-opacity': 0 } },
    { selector: 'node[?neon][?icon].visited', style: { 'background-image-opacity': [1, 0] } },
    {
      selector: 'node[?neon].previous',
      style: {
        'background-image': node => {
          const icon =
            getSystemImage({
              img: ARROW_BACK_ICON_NAME,
              customImg: ctx.arrowBackStorageIcon,
              color: node.data(SystemNodeDataKeys.TextColor),
              mindmapAppName: ctx.mindmapAppName,
              theme: ctx.theme,
            }) ?? 'none';
          return [icon];
        },
        'background-image-opacity': [DefaultVisitedNodeBgImageOpacity],
        'background-clip': ['none', 'none'],
        'bounds-expansion': NeonBoundsExpansion,
        'background-image-containment': 'over',
        'background-width': IconSize,
        'background-height': IconSize,
        'text-margin-x': IconNodeTextMarginX,
      },
    },
  ];
}

function buildVisitedAndPreviousNodeStyles(ctx: StyleContext): cytoscape.StylesheetStyle[] {
  return [
    {
      selector: 'node[!neon].visited',
      style: {
        'background-image-opacity': (node: NodeSingular) => getSingleImageBgOpacity(node, ctx.config?.paletteSettings),
      },
    },
    { selector: 'node.visited.focused', style: { 'background-image-opacity': 1, 'background-opacity': 1 } },
    {
      selector: 'node[?icon].previous',
      style: {
        'background-image': (node: NodeSingular) => {
          const color = node.data(SystemNodeDataKeys.TextColor);
          const iconPath = node.data('icon') as string;

          let icon;
          const isSystemIcon = isSystemImg(iconPath);
          if (ctx.useNodeIconAsBgImage && isSystemIcon) {
            if (ctx.defaultBgImg) {
              icon = getColorizedStorageIconPath(ctx.defaultBgImg, color, ctx.mindmapAppName, ctx.theme);
            }
          } else if (isSystemIcon) {
            icon = getSystemImage({
              img: iconPath,
              customImg: ctx.robotStorageIcon,
              color,
              mindmapAppName: ctx.mindmapAppName,
              theme: ctx.theme,
            });
          } else {
            icon = getColorizedIconPath(iconPath, color, ctx.mindmapAppName);
          }
          icon = icon ?? 'none';

          let maskImg;
          if (ctx.maskImg) {
            maskImg = getColorizedStorageIconPath(ctx.maskImg, color, ctx.mindmapAppName, ctx.theme);
          }

          const arrowBackIcon =
            getSystemImage({
              img: ARROW_BACK_ICON_NAME,
              customImg: !ctx.useNodeIconAsBgImage ? ctx.arrowBackStorageIcon : undefined,
              color,
              mindmapAppName: ctx.mindmapAppName,
              theme: ctx.theme,
            }) ?? 'none';

          return ctx.useNodeIconAsBgImage ? [icon, maskImg ?? 'none', arrowBackIcon] : [arrowBackIcon];
        },
        ...(ctx.useNodeIconAsBgImage
          ? {
              'background-image-opacity': [DefaultVisitedNodeBgImageOpacity, 1, DefaultVisitedNodeBgImageOpacity],
              // 100.5% is a workaround to ensure the border is always slightly larger than the main image, preventing the floating '1px border' issue.
              'background-width': ['100%', '100.5%', 'auto'],
              'background-height': ['100%', '100.5%', 'auto'],
              'background-clip': ['node', 'none', 'none'],
              'background-repeat': ['no-repeat', 'no-repeat', 'no-repeat'],
              'background-position-x': ['50%', '50%', '6px'],
              'background-position-y': ['50%', '50%', '50%'],
            }
          : {
              'background-position-x': '6px',
              'background-fit': 'none',
              'background-image-opacity': (node: NodeSingular) =>
                getSingleImageBgOpacity(node, ctx.config?.paletteSettings),
            }),
      },
    },
    {
      selector: 'node[!icon].previous',
      style: {
        'background-image': (node: NodeSingular) => {
          const color = node.data(SystemNodeDataKeys.TextColor);

          const arrowBackIcon =
            getSystemImage({
              img: ARROW_BACK_ICON_NAME,
              customImg: !ctx.useNodeIconAsBgImage ? ctx.arrowBackStorageIcon : undefined,
              color,
              mindmapAppName: ctx.mindmapAppName,
              theme: ctx.theme,
            }) ?? 'none';

          if (!ctx.useNodeIconAsBgImage) {
            return [arrowBackIcon];
          }

          let bgImg;
          let maskImg;

          if (ctx.defaultBgImg) {
            bgImg = getColorizedStorageIconPath(ctx.defaultBgImg, color, ctx.mindmapAppName, ctx.theme);
          }

          if (ctx.maskImg) {
            maskImg = getColorizedStorageIconPath(ctx.maskImg, color, ctx.mindmapAppName, ctx.theme);
          }

          return [bgImg ?? 'none', maskImg ?? 'none', arrowBackIcon];
        },
        ...(ctx.useNodeIconAsBgImage
          ? {
              'background-image-opacity': [DefaultVisitedNodeBgImageOpacity, 1, DefaultVisitedNodeBgImageOpacity],
              // 100.5% is a workaround to ensure the border is always slightly larger than the main image, preventing the floating '1px border' issue.
              'background-width': ['100%', '100.5%', 'auto'],
              'background-height': ['100%', '100.5%', 'auto'],
              'background-clip': ['node', 'none', 'none'],
              'background-repeat': ['no-repeat', 'no-repeat', 'no-repeat'],
              'background-position-x': ['50%', '50%', '6px'],
              'background-position-y': ['50%', '50%', '50%'],
            }
          : {
              'background-width': IconSize,
              'background-height': IconSize,
              'background-image-containment': 'over',
              'background-clip': 'none',
              'text-margin-x': IconNodeTextMarginX,
              'background-position-x': ctx.padding,
              'background-image-opacity': (node: NodeSingular) =>
                getSingleImageBgOpacity(node, ctx.config?.paletteSettings),
            }),
      },
    },
  ];
}

function buildEdgeStyle(ctx: StyleContext): cytoscape.StylesheetStyle {
  return {
    selector: 'edge',
    style: {
      width: DefaultEdgeWidth,
      'line-color': '#333942',
      ...ctx.config?.cytoscapeStyles.edge?.base,
    },
  };
}

function buildActiveNodeStyle(): cytoscape.StylesheetStyle {
  return {
    selector: 'node:active',
    style: {
      'overlay-opacity': 0,
    },
  };
}

function buildCompoundNodeStyle(): cytoscape.StylesheetStyle {
  return {
    selector: 'node:parent',
    style: {
      'background-image': 'none none',
      'background-opacity': 0,
      'border-opacity': 0,
      label: '',
      events: 'no',
    },
  };
}
