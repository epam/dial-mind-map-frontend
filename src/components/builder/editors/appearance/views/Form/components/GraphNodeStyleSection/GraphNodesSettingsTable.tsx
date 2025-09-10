import { useCallback, useMemo } from 'react';

import { DefaultCytoscapeImagedNodeStatesStyles } from '@/constants/appearances/defaultConfig';
import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import {
  CytoscapeNodeTypesStyles,
  GraphImgResourceKey,
  GraphNodeState,
  GraphNodeType,
  NodeStylesKey,
  ThemeConfig,
} from '@/types/customization';

import { GraphNodeSettingsTable, GraphNodeSettingsTableData } from './GraphNodeSettingsTable';

const DisabledTooltipText = 'Add default icon to customize settings';

export const GraphNodesSettingsTables = () => {
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme);
  const config = useBuilderSelector(AppearanceSelectors.selectThemeConfig);

  const isTableDisabled = useMemo(
    () => !(config?.graph.useNodeIconAsBgImage && config.graph.images?.[GraphImgResourceKey.DefaultBgImg]),
    [config?.graph],
  );

  const changeHandler = useCallback(
    (type: GraphNodeType, field: string, value?: number, state?: GraphNodeState) => {
      if (!config) return;

      let updatedNode: CytoscapeNodeTypesStyles = {
        ...config.graph.cytoscapeStyles.node,
      };

      if (state) {
        updatedNode = {
          ...updatedNode,
          [type]: {
            ...updatedNode[type],
            states: {
              ...updatedNode[type]?.states,
              [state]: {
                ...updatedNode[type]?.states?.[state],
                [field]: value,
              },
            },
          },
        };
      } else {
        updatedNode = {
          ...updatedNode,
          [type]: {
            ...updatedNode[type],
            [field]: value,
          },
        };
      }

      const updatedConfig: ThemeConfig = {
        ...config,
        graph: {
          ...config.graph,
          cytoscapeStyles: {
            ...config.graph.cytoscapeStyles,
            node: {
              ...config.graph.cytoscapeStyles.node,
              ...updatedNode,
            },
          },
        },
      };

      dispatch(
        AppearanceActions.updateThemeConfig({
          theme,
          config: updatedConfig,
        }),
      );
    },
    [config, dispatch, theme],
  );

  const getTableData = useCallback(
    (type: GraphNodeType) => {
      const nodeSettings = config?.graph.cytoscapeStyles.node?.[type];

      const res: GraphNodeSettingsTableData = {
        [NodeStylesKey.Width]: {},
        [NodeStylesKey.Height]: {},
        [NodeStylesKey.FontSize]: {},
        [NodeStylesKey.TextMarginY]: {},
      };

      if (!nodeSettings) return res;

      Object.keys(res).forEach(key => {
        const field = key as NodeStylesKey;
        res[field] = {
          base: nodeSettings[field] ?? DefaultCytoscapeImagedNodeStatesStyles?.[type]?.[field],
          [GraphNodeState.Hovered]:
            nodeSettings.states?.[GraphNodeState.Hovered]?.[field] ??
            DefaultCytoscapeImagedNodeStatesStyles?.[type]?.states?.[GraphNodeState.Hovered]?.[field],
        };
      });

      return res;
    },
    [config],
  );

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6">
        <GraphNodeSettingsTable
          type={GraphNodeType.Root}
          showRowLabels={true}
          data={getTableData(GraphNodeType.Root)}
          onChange={changeHandler}
          disabled={isTableDisabled}
          disabledTooltipText={DisabledTooltipText}
        />
        <GraphNodeSettingsTable
          type={GraphNodeType.Level1}
          data={getTableData(GraphNodeType.Level1)}
          onChange={changeHandler}
          disabled={isTableDisabled}
          disabledTooltipText={DisabledTooltipText}
        />
        <GraphNodeSettingsTable
          type={GraphNodeType.Level2}
          data={getTableData(GraphNodeType.Level2)}
          onChange={changeHandler}
          disabled={isTableDisabled}
          disabledTooltipText={DisabledTooltipText}
        />
      </div>
    </div>
  );
};
