import { IconBorderRadius, IconRulerMeasure, IconSpacingHorizontal } from '@tabler/icons-react';
import { debounce, isNumber } from 'lodash-es';
import { useCallback, useMemo } from 'react';

import {
  DefaultGraphNodeBorderWidth,
  DefaultGraphNodePadding,
  DefaultGraphNodeShape,
  INPUT_DEBOUNCE,
} from '@/constants/app';
import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ThemeConfig } from '@/types/customization';

import { NumericInput } from '../common/NumericInput';

export const NodeLayoutSettings = () => {
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme) || 'dark';
  const config = useBuilderSelector(AppearanceSelectors.selectThemeConfig);
  const baseNodeStyles = config?.graph?.cytoscapeStyles?.node?.base;

  const shape = config?.graph?.cytoscapeStyles?.node?.base?.shape ?? DefaultGraphNodeShape;

  const handleChange = useCallback(
    (field: 'corner-radius' | 'border-width' | 'padding', value?: number) => {
      if (!config) return;

      const updatedConfig: ThemeConfig = {
        ...config,
        graph: {
          ...config.graph,
          cytoscapeStyles: {
            ...config.graph.cytoscapeStyles,
            node: {
              ...config.graph.cytoscapeStyles?.node,
              base: {
                ...config.graph.cytoscapeStyles?.node?.base,
                [field]: value?.toString(),
              },
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

  const debouncedChange = useMemo(() => debounce(handleChange, INPUT_DEBOUNCE), [handleChange]);

  const getDefault = (value: string | number | undefined) => {
    if (isNumber(value) || value === undefined) return value;
    return parseFloat(value);
  };

  const hasRoundCorners = shape.startsWith('round-');

  return (
    <div className="flex flex-wrap gap-4">
      {hasRoundCorners && (
        <NumericInput
          id="node-corner-radius"
          label="Corner radius"
          icon={IconBorderRadius}
          onChange={val => debouncedChange('corner-radius', val)}
          value={getDefault(baseNodeStyles?.['corner-radius'])}
          placeholder="Auto"
        />
      )}
      <NumericInput
        id="node-border-width"
        label="Border width"
        icon={IconRulerMeasure}
        onChange={val => debouncedChange('border-width', val)}
        value={getDefault(baseNodeStyles?.['border-width'])}
        placeholder={DefaultGraphNodeBorderWidth.toString()}
      />
      <NumericInput
        id="node-padding"
        label="Padding"
        icon={IconSpacingHorizontal}
        onChange={val => debouncedChange('padding', val)}
        value={getDefault(baseNodeStyles?.padding)}
        placeholder={DefaultGraphNodePadding.toString()}
      />
    </div>
  );
};
