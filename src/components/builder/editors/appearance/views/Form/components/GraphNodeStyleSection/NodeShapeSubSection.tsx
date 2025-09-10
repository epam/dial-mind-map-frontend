import classNames from 'classnames';
import { useCallback, useState } from 'react';

import { DefaultGraphNodeShape } from '@/constants/app';
import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { NodeShapes, ThemeConfig } from '@/types/customization';

import { ShapesSettings } from './shapes';

export const NodeShapeSubSection = () => {
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme) || 'dark';
  const config = useBuilderSelector(AppearanceSelectors.selectThemeConfig);
  const shape = config?.graph?.cytoscapeStyles?.node?.base?.shape ?? DefaultGraphNodeShape;

  const [showAll, setShowAll] = useState(false);

  const handleChange = useCallback(
    (value: NodeShapes) => {
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
                shape: value,
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

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-secondary">Shape</span>
      <div
        className={classNames('flex flex-wrap gap-5 transition-max-height duration-500 ease-in-out overflow-hidden', {
          'max-h-[56px]': !showAll,
          'max-h-[2000px]': showAll,
        })}
      >
        {ShapesSettings.map(({ id, value, label, icon: Icon }) => (
          <div
            key={id}
            onClick={() => handleChange(value)}
            className={classNames([
              'flex cursor-pointer items-center gap-3 rounded-xl border border-primary p-3 hover:border-accent-primary',
              value === shape && '!border-accent-primary',
            ])}
          >
            <Icon style={{ color: 'var(--stroke-primary)' }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <button onClick={() => setShowAll(prev => !prev)} className="w-fit text-sm text-accent-primary hover:underline">
        {showAll ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
};
