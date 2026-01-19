import { IconRulerMeasure } from '@tabler/icons-react';
import { useCallback } from 'react';

import { Space } from '@/components/common/Space/Space';
import { DefaultEdgeWidth } from '@/constants/app';
import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { CytoscapeEdgeStyles, EdgeLineStyle, ThemeConfig } from '@/types/customization';

import { EdgeLineStyleList } from '../data/constants';
import { NumericInput } from './common/NumericInput';
import { ToggleGroup } from './common/ToggleGroup';

export const EdgeStyleSection = () => {
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme) || 'dark';
  const themeConfig = useBuilderSelector(AppearanceSelectors.selectThemeConfig);
  const edgeBaseConfig: CytoscapeEdgeStyles | undefined = themeConfig?.graph?.cytoscapeStyles?.edge?.base;

  const handleChangeLineStyle = (finalValue: EdgeLineStyle) => {
    if (!themeConfig) return;

    const updatedConfig: ThemeConfig = {
      ...themeConfig,
      graph: {
        ...themeConfig.graph,
        cytoscapeStyles: {
          ...(themeConfig.graph.cytoscapeStyles ?? {}),
          edge: {
            ...(themeConfig.graph.cytoscapeStyles.edge ?? {}),
            base: {
              ...(edgeBaseConfig ?? {}),
              'line-style': finalValue,
            },
          },
        },
      },
    };

    dispatch(
      AppearanceActions.updateThemeConfig({
        config: updatedConfig,
        theme,
      }),
    );
  };

  const handleChangeWidth = useCallback(
    (finalValue?: number) => {
      if (!themeConfig) return;

      const updatedConfig: ThemeConfig = {
        ...themeConfig,
        graph: {
          ...themeConfig.graph,
          cytoscapeStyles: {
            ...(themeConfig.graph.cytoscapeStyles ?? {}),
            edge: {
              ...(themeConfig.graph.cytoscapeStyles.edge ?? {}),
              base: {
                ...(edgeBaseConfig ?? {}),
                width: finalValue,
              },
            },
          },
        },
      };

      dispatch(
        AppearanceActions.updateThemeConfig({
          config: updatedConfig,
          theme,
        }),
      );
    },
    [dispatch, theme, themeConfig, edgeBaseConfig],
  );

  return (
    <Space direction="vertical" size="large" align="start">
      <Space direction="vertical" size="small" align="start">
        <span className="text-xs text-secondary">Line style</span>
        <ToggleGroup
          options={EdgeLineStyleList}
          value={edgeBaseConfig?.['line-style'] ?? EdgeLineStyle.Solid}
          onChange={handleChangeLineStyle}
          buttonClassName="min-w-[60px] text-center"
        />
      </Space>
      <NumericInput
        id={'width'}
        label={'Width'}
        icon={IconRulerMeasure}
        onChange={handleChangeWidth}
        max={50}
        value={edgeBaseConfig?.width}
        placeholder={DefaultEdgeWidth.toString()}
        defaultValue={DefaultEdgeWidth}
      />
    </Space>
  );
};
