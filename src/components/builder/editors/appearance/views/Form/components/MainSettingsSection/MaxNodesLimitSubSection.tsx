import { useCallback } from 'react';

import { DefaultMaxNodesLimit } from '@/constants/app';
import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ThemeConfig } from '@/types/customization';

import { NumericInput } from '../common/NumericInput';

const MaxNodesLimitMaxValue = 1000;

export const MaxNodesLimitSubSection = () => {
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme) || 'dark';
  const config = useBuilderSelector(AppearanceSelectors.selectThemeConfig);
  const maxNodesLimit = config?.graph?.maxNodesLimit;

  const handleChange = useCallback(
    (value?: number) => {
      if (!config) return;

      const updatedConfig: ThemeConfig = {
        ...config,
        graph: {
          ...config.graph,
          maxNodesLimit: value,
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

  return (
    <NumericInput
      id={'max-nodes-limit'}
      label={'Max nodes to show'}
      onChange={handleChange}
      max={MaxNodesLimitMaxValue}
      value={maxNodesLimit}
      placeholder={DefaultMaxNodesLimit.toString()}
      defaultValue={DefaultMaxNodesLimit}
    />
  );
};
