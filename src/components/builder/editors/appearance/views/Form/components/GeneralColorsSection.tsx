import React from 'react';

import { ColorPickerInput } from '@/components/common/ColorPickerInput';
import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ThemeConfig } from '@/types/customization';

const categories: {
  name: string;
  fields: { label: string; name: string; info?: string; labelClassName?: string }[];
}[] = [
  {
    name: 'Background',
    fields: [
      {
        label: 'Layer-0',
        name: 'bg-layer-0',
        info: 'Reference background and tooltips colors',
        labelClassName: 'w-[60px]',
      },
      { label: 'Layer-1', name: 'bg-layer-1', info: 'Main background color', labelClassName: 'w-[60px]' },
      {
        label: 'Layer-2',
        name: 'bg-layer-3',
        info: 'Chat input and current message background colors',
        labelClassName: 'w-[60px]',
      },
      { label: 'Layer-3', name: 'bg-layer-4', info: 'Scroll color', labelClassName: 'w-[60px]' },
    ],
  },
  {
    name: 'Text and icon',
    fields: [
      { label: 'Primary', name: 'text-primary' },
      { label: 'Secondary', name: 'text-secondary' },
      { label: 'Accent', name: 'text-accent-primary' },
    ],
  },
  {
    name: 'Border',
    fields: [
      { label: 'Primary', name: 'stroke-primary' },
      { label: 'Accent', name: 'stroke-accent-primary' },
    ],
  },
];

export const GeneralColorsSection: React.FC = () => {
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme) || 'dark';
  const themeConfig = useBuilderSelector(AppearanceSelectors.selectThemeConfig);
  const colors = themeConfig?.colors ?? {};

  const handleCommit = (name: string, finalValue: string) => {
    if (!themeConfig) return;

    const updatedConfig: ThemeConfig = {
      ...themeConfig,
      colors: {
        ...colors,
        [name]: finalValue,
      },
    };

    dispatch(
      AppearanceActions.updateThemeConfig({
        config: updatedConfig,
        theme,
      }),
    );
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-9">
        {categories.map(cat => (
          <div key={cat.name} className="flex flex-col gap-3">
            <h3 className="w-[280px] rounded bg-layer-1 px-2 py-1 font-semibold text-primary">{cat.name}</h3>
            <div className="space-y-3">
              {cat.fields.map(field => (
                <ColorPickerInput
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  color={colors[field.name]}
                  onCommit={handleCommit}
                  infoTooltip={field.info}
                  className="w-full max-w-xs"
                  mandatory={true}
                  labelClassName={field.labelClassName}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
