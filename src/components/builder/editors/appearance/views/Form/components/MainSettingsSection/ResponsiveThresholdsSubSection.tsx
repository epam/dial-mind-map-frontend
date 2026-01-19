import { isNumber } from 'lodash-es';
import { useCallback, useMemo } from 'react';

import { MIN_DESKTOP_WIDTH_DEFAULT, MIN_TABLET_WIDTH_DEFAULT } from '@/constants/app';
import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ThemeConfig } from '@/types/customization';

import { NumericInput } from '../common/NumericInput';

export const ResponsiveThresholdsSubSection = () => {
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme) || 'dark';
  const config = useBuilderSelector(AppearanceSelectors.selectThemeConfig);
  const responsiveThresholds = config?.responsiveThresholds;

  const handleChange = useCallback(
    (field: 'md' | 'xl', value?: number) => {
      if (!config) return;

      const updatedConfig: ThemeConfig = {
        ...config,
        responsiveThresholds: {
          ...responsiveThresholds,
          [field]: value,
        },
      };

      dispatch(
        AppearanceActions.updateThemeConfig({
          theme,
          config: updatedConfig,
        }),
      );
    },
    [config, dispatch, responsiveThresholds, theme],
  );

  const getDefault = (value: string | number | undefined) => {
    if (isNumber(value) || value === undefined) return value;
    return parseFloat(value);
  };

  const thresholds: Array<{
    label: string;
    value: number | undefined;
    id: 'md' | 'xl';
    placeholder: string;
    defaultValue: number;
  }> = useMemo(
    () => [
      {
        label: 'Mobile Threshold',
        value: responsiveThresholds?.md,
        id: 'md',
        placeholder: MIN_TABLET_WIDTH_DEFAULT.toString(),
        defaultValue: MIN_TABLET_WIDTH_DEFAULT,
      },
      {
        label: 'Tablet Threshold',
        value: responsiveThresholds?.xl,
        id: 'xl',
        placeholder: MIN_DESKTOP_WIDTH_DEFAULT.toString(),
        defaultValue: MIN_DESKTOP_WIDTH_DEFAULT,
      },
    ],
    [responsiveThresholds],
  );

  return (
    <div className="flex flex-wrap gap-4">
      {thresholds.map(({ label, value, id, placeholder, defaultValue }) => (
        <NumericInput
          key={id}
          id={`responsive-threshold-${id}`}
          label={label}
          onChange={val => handleChange(id, val)}
          value={getDefault(value)}
          placeholder={placeholder}
          min={0}
          max={Infinity}
          defaultValue={defaultValue}
        />
      ))}
    </div>
  );
};
