import { useCallback } from 'react';

import Checkbox from '@/components/builder/common/Checkbox';
import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ThemeConfig } from '@/types/customization';

import { GraphNodesSettingsTables } from './GraphNodesSettingsTable';
import { NodeImagesSubSection } from './NodeImagesSubSection';

export const BackgroundImageSection = () => {
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme);
  const config = useBuilderSelector(AppearanceSelectors.selectThemeConfig);

  const handleCheckboxChange = useCallback(
    (checked: boolean) => {
      if (!config) return;

      const updatedConfig: ThemeConfig = {
        ...config,
        graph: {
          ...config.graph,
          useNodeIconAsBgImage: checked,
        },
      };

      return dispatch(AppearanceActions.updateThemeConfig({ theme, config: updatedConfig }));
    },
    [dispatch, theme, config],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex h-[26px]">
        <Checkbox checked={config?.graph.useNodeIconAsBgImage} onChange={handleCheckboxChange}>
          Use node icon as background image
        </Checkbox>
      </div>
      {config?.graph.useNodeIconAsBgImage && (
        <>
          <NodeImagesSubSection />
          <GraphNodesSettingsTables />
        </>
      )}
    </div>
  );
};
