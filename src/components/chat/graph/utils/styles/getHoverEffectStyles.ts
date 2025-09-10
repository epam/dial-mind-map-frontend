import { NodeSingular } from 'cytoscape';
import omit from 'lodash-es/omit';

import {
  DefaultHoveredLevel1NodeFontSize,
  DefaultHoveredLevel2NodeFontSize,
  DefaultHoveredRootNodeFontSize,
  DefaultLevel1NodeFontSize,
  DefaultLevel2NodeFontSize,
  DefaultRootNodeFontSize,
} from '@/constants/app';
import { DefaultCytoscapeImagedNodeStatesStyles } from '@/constants/appearances/defaultConfig';
import { CytoscapeNodeStyles, GraphConfig, GraphNodeState, GraphNodeType, NodeStylesKey } from '@/types/customization';
import { SystemNodeDataKeys } from '@/types/graph';

import { ExtraWidthForNodesWithImages } from '../../options';
import { getMergedNodeStyles } from './settings';
import { getWidth } from './styles';

const getFallbackFontSize = (nodeType: GraphNodeType, mode: 'mouseover' | 'mouseout') => {
  if (nodeType === GraphNodeType.Level1) {
    return mode === 'mouseover' ? DefaultHoveredLevel1NodeFontSize : DefaultLevel1NodeFontSize;
  }

  if (nodeType === GraphNodeType.Level2) {
    return mode === 'mouseover' ? DefaultHoveredLevel2NodeFontSize : DefaultLevel2NodeFontSize;
  }

  return mode === 'mouseover' ? DefaultHoveredRootNodeFontSize : DefaultRootNodeFontSize;
};

export const getHoverEffectStyles = (node: NodeSingular, graphConfig: GraphConfig, mode: 'mouseover' | 'mouseout') => {
  let styles = {};
  const nodeType = node.data(SystemNodeDataKeys.NodeType) as GraphNodeType;

  const customStyles = getMergedNodeStyles({
    type: nodeType,
    state: mode === 'mouseover' ? GraphNodeState.Hovered : undefined,
    nodeStateStyles: graphConfig.cytoscapeStyles.node,
    mergeMode: 'base',
  });

  if (customStyles) {
    let validStyles = omit(customStyles, 'shape', 'text-wrap') as CytoscapeNodeStyles;

    if (graphConfig.useNodeIconAsBgImage) {
      if (!validStyles.width) {
        validStyles = {
          ...validStyles,
          ...DefaultCytoscapeImagedNodeStatesStyles?.[nodeType],
        };
      }
    } else {
      validStyles = omit(validStyles, NodeStylesKey.Width, NodeStylesKey.Height, NodeStylesKey.TextMarginY);
    }

    styles = {
      ...styles,
      ...validStyles,
    };

    if (!validStyles.width) {
      const fontSize = validStyles[NodeStylesKey.FontSize] ?? getFallbackFontSize(nodeType, mode);

      let width = getWidth(node, fontSize);
      if (node.hasClass('imaged') || node.data('icon')) {
        width += ExtraWidthForNodesWithImages;
      }

      styles = {
        ...styles,
        width,
        [NodeStylesKey.FontSize]: fontSize,
      };
    }
  }

  return styles;
};
