import {
  CytoscapeLayoutSettings,
  CytoscapeNodeTypesStyles,
  GraphNodeState,
  GraphNodeType,
  NodeStylesKey,
  ThemeConfig,
} from '@/types/customization';

import {
  DefaultHoveredLevel1NodeFontSize,
  DefaultHoveredLevel2NodeFontSize,
  DefaultHoveredRootNodeFontSize,
  DefaultLevel1NodeFontSize,
  DefaultLevel2NodeFontSize,
  DefaultRootNodeFontSize,
} from '../app';

export const DefaultCytoscapeImagedNodeStatesStyles: CytoscapeNodeTypesStyles = {
  [GraphNodeType.Root]: {
    [NodeStylesKey.Height]: 120,
    [NodeStylesKey.Width]: 212,
  },
  [GraphNodeType.Level1]: {
    [NodeStylesKey.Height]: 90,
    [NodeStylesKey.Width]: 160,
  },
  [GraphNodeType.Level2]: {
    [NodeStylesKey.Height]: 60,
    [NodeStylesKey.Width]: 106,
  },
};

export const DefaultCytoscapeLayoutSettings: CytoscapeLayoutSettings = {
  nodeRepulsion: 10000,
  idealEdgeLength: 30,
  edgeElasticity: 0.8,
};

export const defaultConfig: Record<string, ThemeConfig> = {
  light: {
    colors: {
      'bg-layer-0': '#FCFCFC',
      'bg-layer-1': '#EAEDF0',
      'bg-layer-3': '#FCFCFC',
      'bg-layer-4': '#C3C9D0',
      'bg-error': '#F3D6D8',
      'bg-info': '#D3DFF5',
      'controls-bg-accent': '#5C8DEA',
      'controls-bg-accent-hover': '#4878D2',
      'controls-bg-disable': '#7F8792',
      'text-primary': '#141A23',
      'text-secondary': '#7F8792',
      'text-accent-primary': '#2764D9',
      'text-error': '#AE2F2F',
      'text-info': '#2764D9',
      'controls-text-permanent': '#FCFCFC',
      'controls-text-disable': '#C3C9D0',
      'stroke-primary': '#C3C9D0',
      'stroke-accent-primary': '#2764D9',
      'stroke-error': '#AE2F2F',
      'stroke-warning': '#DAAE14',
      'stroke-info': '#2764D9',
      'stroke-success': '#009D9F',
    },
    chat: { placeholder: 'Type your question' },
    graph: {
      paletteSettings: {
        branchesColors: [
          { bgColor: '#FF8E8E', textColor: '#141A23' },
          { bgColor: '#EFC09F', textColor: '#141A23' },
          { bgColor: '#B2E29C', textColor: '#141A23' },
          { bgColor: '#A5DED4', textColor: '#141A23' },
          { bgColor: '#7DD5F2', textColor: '#141A23' },
          { bgColor: '#89ABFF', textColor: '#141A23' },
          { bgColor: '#D2B5FF', textColor: '#141A23' },
          { bgColor: '#F0A1F5', textColor: '#141A23' },
          { bgColor: '#F39BCA', textColor: '#141A23' },
        ],
        focusedNodeColors: { bgColor: '#424952', textColor: '#EAEDF0' },
      },
      cytoscapeStyles: {
        node: {
          [GraphNodeType.Base]: { shape: 'round-rectangle', padding: '8px' },
          [GraphNodeType.Root]: {
            'font-size': DefaultRootNodeFontSize,
            states: {
              [GraphNodeState.Hovered]: {
                'font-size': DefaultHoveredRootNodeFontSize,
              },
            },
          },
          [GraphNodeType.Level1]: {
            'font-size': DefaultLevel1NodeFontSize,
            states: {
              [GraphNodeState.Hovered]: {
                'font-size': DefaultHoveredLevel1NodeFontSize,
              },
            },
          },
          [GraphNodeType.Level2]: {
            'font-size': DefaultLevel2NodeFontSize,
            states: {
              [GraphNodeState.Hovered]: {
                'font-size': DefaultHoveredLevel2NodeFontSize,
              },
            },
          },
        },
        edge: { base: { width: 1 } },
      },
    },
    references: {
      badge: {
        textColor: { default: '#141A23', hovered: '#141A23', selected: '#EAEDF0' },
        backgroundColor: { default: '#FCFCFC', hovered: '#C3C9D0', selected: '#424952' },
      },
    },
  },
  dark: {
    colors: {
      'bg-layer-0': '#000000',
      'bg-layer-1': '#090D13',
      'bg-layer-3': '#222932',
      'bg-layer-4': '#424952',
      'bg-error': '#402027',
      'bg-info': '#1C2C47',
      'controls-bg-accent': '#5C8DEA',
      'controls-bg-accent-hover': '#4878D2',
      'controls-bg-disable': '#7F8792',
      'text-primary': '#F3F4F6',
      'text-secondary': '#7F8792',
      'text-accent-primary': '#5C8DEA',
      'text-error': '#F76464',
      'text-info': '#5C8DEA',
      'controls-text-permanent': '#FCFCFC',
      'controls-text-disable': '#424952',
      'stroke-primary': '#424952',
      'stroke-accent-primary': '#5C8DEA',
      'stroke-error': '#F76464',
      'stroke-warning': '#F4CE46',
      'stroke-info': '#5C8DEA',
      'stroke-success': '#37BABC',
    },
    chat: { placeholder: 'Type your question' },
    graph: {
      paletteSettings: {
        branchesColors: [
          { bgColor: '#8C1756' },
          { bgColor: '#046280' },
          { bgColor: '#41712B' },
          { bgColor: '#422471' },
          { bgColor: '#6E2573' },
          { bgColor: '#136758' },
          { bgColor: '#233B78' },
          { bgColor: '#9E531D' },
          { bgColor: '#932A2A' },
        ],
        focusedNodeColors: { bgColor: '#C3C9D0', textColor: '#090D13' },
      },
      cytoscapeStyles: {
        node: {
          [GraphNodeType.Base]: { shape: 'round-rectangle', padding: '8px' },
          [GraphNodeType.Root]: {
            'font-size': DefaultRootNodeFontSize,
            states: {
              [GraphNodeState.Hovered]: {
                'font-size': DefaultHoveredRootNodeFontSize,
              },
            },
          },
          [GraphNodeType.Level1]: {
            'font-size': DefaultLevel1NodeFontSize,
            states: {
              [GraphNodeState.Hovered]: {
                'font-size': DefaultHoveredLevel1NodeFontSize,
              },
            },
          },
          [GraphNodeType.Level2]: {
            'font-size': DefaultLevel2NodeFontSize,
            states: {
              [GraphNodeState.Hovered]: {
                'font-size': DefaultHoveredLevel2NodeFontSize,
              },
            },
          },
        },
        edge: { base: { width: 1 } },
      },
    },
    references: {
      badge: {
        textColor: { default: '#F3F4F6', hovered: '#F3F4F6', selected: '#090D13' },
        backgroundColor: { default: '#222932', hovered: '#333942', selected: '#C3C9D0' },
      },
    },
  },
  'light-orange': {
    colors: {
      'bg-layer-0': '#FFFFFF',
      'bg-layer-1': '#F8F8F8',
      'bg-layer-3': '#FFFFFF',
      'bg-layer-4': '#E5E5E5',
      'bg-error': '#F3D6D8',
      'bg-info': '#D3DFF5',
      'controls-bg-accent': '#E47E46',
      'controls-bg-accent-hover': '#D76E34',
      'controls-bg-disable': '#A0A0A0',
      'text-primary': '#111111',
      'text-secondary': '#A0A0A0',
      'text-accent-primary': '#111111',
      'text-error': '#111111',
      'text-info': '#2764D9',
      'controls-text-permanent': '#FFFFFF',
      'controls-text-disable': '#E5E5E5',
      'stroke-primary': '#CACACB',
      'stroke-accent-primary': '#111111',
      'stroke-error': '#AE2F2F',
      'stroke-warning': '#DAAE14',
      'stroke-info': '#2764D9',
      'stroke-success': '#009D9F',
    },
    chat: { placeholder: 'Type your question' },
    graph: {
      paletteSettings: {
        branchesColors: [
          { bgColor: '#E47E46', textColor: '#FFFFFF' },
          { bgColor: '#FFA726', textColor: '#111111' },
          { bgColor: '#FFCC80', textColor: '#111111' },
          { bgColor: '#FFE082', textColor: '#111111' },
          { bgColor: '#FFF59D', textColor: '#111111' },
          { bgColor: '#CEEBEE', textColor: '#111111' },
          { bgColor: '#D76E34', textColor: '#FFFFFF' },
          { bgColor: '#FFB74D', textColor: '#111111' },
          { bgColor: '#FFD54F', textColor: '#111111' },
        ],
        focusedNodeColors: { bgColor: '#E47E46', textColor: '#FFFFFF' },
      },
      cytoscapeStyles: {
        node: {
          [GraphNodeType.Base]: { shape: 'round-rectangle', padding: '8px' },
          [GraphNodeType.Root]: {
            'font-size': DefaultRootNodeFontSize,
            states: {
              [GraphNodeState.Hovered]: {
                'font-size': DefaultHoveredRootNodeFontSize,
              },
            },
          },
          [GraphNodeType.Level1]: {
            'font-size': DefaultLevel1NodeFontSize,
            states: {
              [GraphNodeState.Hovered]: {
                'font-size': DefaultHoveredLevel1NodeFontSize,
              },
            },
          },
          [GraphNodeType.Level2]: {
            'font-size': DefaultLevel2NodeFontSize,
            states: {
              [GraphNodeState.Hovered]: {
                'font-size': DefaultHoveredLevel2NodeFontSize,
              },
            },
          },
        },
        edge: { base: { width: 1 } },
      },
    },
    references: {
      badge: {
        textColor: { default: '#111111', hovered: '#111111', selected: '#FFFFFF' },
        backgroundColor: { default: '#F8F8F8', hovered: '#E5E5E5', selected: '#E47E46' },
      },
    },
  },
};
