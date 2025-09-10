import { IconExclamationCircle, IconInfoCircle, IconX } from '@tabler/icons-react';
import React from 'react';

import { ColorPickerInput } from '@/components/common/ColorPickerInput';
import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ThemeConfig } from '@/types/customization';

import {
  SemanticColorsCategoriesFieldNamesList,
  SemanticColorsCategoriesKeys,
  SemanticColorsCategoriesNames,
} from '../data/constants';

const categories = {
  [SemanticColorsCategoriesKeys.ERROR]: {
    fields: [{ name: 'bg-error' }, { label: 'Error', name: 'text-error' }, { name: 'stroke-error' }],
  },
  [SemanticColorsCategoriesKeys.Info]: {
    fields: [{ name: 'bg-info' }, { name: 'text-info' }, { name: 'stroke-info' }],
  },
};

const toastsConfigs = {
  [SemanticColorsCategoriesKeys.ERROR]: {
    text: 'Error message',
    bgField: 'bg-error',
    borderField: 'stroke-error',
    iconRenderer: (color: string) => <IconExclamationCircle color={color} />,
    iconColor: 'text-error',
  },
  [SemanticColorsCategoriesKeys.Info]: {
    text: 'Information message',
    bgField: 'bg-info',
    borderField: 'stroke-info',
    iconRenderer: (color: string) => <IconInfoCircle color={color} />,
    iconColor: 'text-info',
  },
};

export const SemanticColorsSection: React.FC = () => {
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme) || 'dark';
  const config = useBuilderSelector(AppearanceSelectors.selectThemeConfig);
  const colors = config?.colors ?? {};

  const handleCommit = (name: string, finalValue: string) => {
    if (!config) return;

    const updatedConfig: ThemeConfig = {
      ...config,
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
    <div className="w-full max-w-[920px] overflow-x-auto">
      <div className="inline-grid min-w-[800px] max-w-[920px] grid-cols-[100px_repeat(3,minmax(160px,160px))_20px_minmax(220px,300px)] items-center gap-3">
        <div />
        {SemanticColorsCategoriesFieldNamesList.map(col =>
          col ? (
            <div key={col} className="rounded bg-layer-1 px-2 py-1 text-sm font-semibold text-primary">
              {col}
            </div>
          ) : (
            <div key="empty" />
          ),
        )}

        {Object.values(SemanticColorsCategoriesKeys).map(category => (
          <React.Fragment key={category}>
            <div className="py-1 text-sm font-medium text-primary">{SemanticColorsCategoriesNames[category]}</div>

            {categories[category].fields.map(field => (
              <ColorPickerInput
                key={`${field.name}`}
                name={`${field.name}`}
                color={colors[field.name] ?? ''}
                onCommit={handleCommit}
                mandatory={true}
              />
            ))}
            <div />
            <div
              style={{
                backgroundColor: colors[toastsConfigs[category].bgField],
                width: '100%',
                borderColor: colors[toastsConfigs[category].borderField],
              }}
              className="flex items-center justify-between rounded border px-2 py-1 text-primary"
              data-testid={`toast-preview-${category}`}
            >
              <div className="flex items-center gap-2">
                {toastsConfigs[category].iconRenderer(colors[toastsConfigs[category].iconColor])}
                <span style={{ color: colors['text-primary'] }}>{toastsConfigs[category].text}</span>
              </div>

              <IconX className="text-secondary" data-testid={`icon-close-${category}`} />
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
