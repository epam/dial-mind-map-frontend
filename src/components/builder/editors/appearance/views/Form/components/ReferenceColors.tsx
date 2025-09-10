import React from 'react';

import { ColorPickerInput } from '@/components/common/ColorPickerInput';
import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ThemeConfig } from '@/types/customization';

import {
  FIELD_NAME_DIVIDER,
  ReferenceBadgeColorCategoriesFieldNamesList,
  ReferenceBadgeColorCategoriesFields,
  ReferenceBadgeColorCategoriesFieldsList,
  ReferenceBadgeColorCategoriesKeys,
  ReferenceBadgeColorCategoriesNames,
} from '../data/constants';

export const ReferenceColors: React.FC = () => {
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme) || 'dark';
  const config = useBuilderSelector(AppearanceSelectors.selectThemeConfig);
  const badgeConfig = config?.references?.badge;

  const handleCommit = (name: string, finalColor: string) => {
    if (!config) return;
    const [category, colorName] = name.split(FIELD_NAME_DIVIDER) as [
      ReferenceBadgeColorCategoriesKeys,
      ReferenceBadgeColorCategoriesFields,
    ];
    const badgeConfig = config.references?.badge;
    const updatedConfig: ThemeConfig = {
      ...config,
      references: {
        badge: {
          ...badgeConfig,
          [category]: {
            ...config.references?.badge?.[category],
            [colorName]: finalColor,
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
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-grid min-w-[611px] grid-cols-[100px_repeat(3,minmax(120px,1fr))] items-center gap-3">
        <div />
        {ReferenceBadgeColorCategoriesFieldNamesList.map(col => (
          <div key={col} className="rounded bg-layer-1 px-2 py-1 text-sm font-semibold text-primary">
            {col}
          </div>
        ))}

        {Object.values(ReferenceBadgeColorCategoriesKeys).map(category => (
          <React.Fragment key={category}>
            <div className="py-1 text-sm font-medium text-primary">{ReferenceBadgeColorCategoriesNames[category]}</div>

            {ReferenceBadgeColorCategoriesFieldsList.map(field => (
              <ColorPickerInput
                key={`${category}${FIELD_NAME_DIVIDER}${field}`}
                name={`${category}${FIELD_NAME_DIVIDER}${field}`}
                color={badgeConfig?.[category]?.[field] ?? ''}
                onCommit={handleCommit}
                mandatory={true}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
