import { IconPhoto } from '@tabler/icons-react';
import { useCallback } from 'react';

import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { GraphImgResourceKey, ThemeConfig } from '@/types/customization';

import { IconUploader } from '../IconsSection.tsx/IconUploader';

export const NodeImagesSubSection = () => {
  const config = useBuilderSelector(AppearanceSelectors.selectThemeConfig);
  const theme = useBuilderSelector(UISelectors.selectTheme);
  const dispatch = useBuilderDispatch();

  const iconItems = [
    {
      label: 'Default icon',
      type: GraphImgResourceKey.DefaultBgImg,
    },
    {
      label: 'Border image',
      type: GraphImgResourceKey.BorderImg,
    },
  ];

  const getSelectHandler = useCallback(
    (type: GraphImgResourceKey) => (fileName: string, file: File) => {
      dispatch(
        AppearanceActions.uploadResource({
          type,
          file,
          fileName,
        }),
      );
    },
    [dispatch],
  );

  const getDeleteHandler = useCallback(
    (type: GraphImgResourceKey) => () => {
      if (config) {
        const updatedConfig: ThemeConfig = {
          ...config,
          graph: {
            ...config.graph,
            images: {
              ...config.graph.images,
              [type]: undefined,
            },
          },
        };

        dispatch(
          AppearanceActions.updateThemeConfig({
            theme,
            config: updatedConfig,
          }),
        );
      }
    },
    [config, theme, dispatch],
  );

  const getOnSuccessUploadHandler = useCallback(
    (type: GraphImgResourceKey) => (fileName: string) => {
      if (config) {
        const updatedConfig: ThemeConfig = {
          ...config,
          graph: {
            ...config.graph,
            images: {
              ...config.graph.images,
              [type]: fileName,
            },
          },
        };

        dispatch(
          AppearanceActions.updateThemeConfig({
            theme,
            config: updatedConfig,
          }),
        );
      }
    },
    [config, theme, dispatch],
  );

  return (
    <div className="flex flex-wrap gap-[50px]">
      {iconItems.map(({ label, type }) => (
        <IconUploader
          key={label}
          label={label}
          value={config?.graph?.images?.[type]}
          type={type}
          onSelect={getSelectHandler(type)}
          onDelete={getDeleteHandler(type)}
          onSuccessUpload={getOnSuccessUploadHandler(type)}
          defaultIcon={<IconPhoto />}
          placeholder="No icon"
          imageContainerClassName="!p-0"
        />
      ))}
    </div>
  );
};
