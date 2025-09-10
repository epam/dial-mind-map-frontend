import { useCallback } from 'react';

import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ChatNodeResourceKey, ThemeConfig } from '@/types/customization';

import { IconUploader } from '../IconsSection.tsx/IconUploader';

export const ChatNodeMaskSubSection = () => {
  const config = useBuilderSelector(AppearanceSelectors.selectThemeConfig);
  const theme = useBuilderSelector(UISelectors.selectTheme);
  const dispatch = useBuilderDispatch();

  const selectHandler = useCallback(
    (fileName: string, file: File) => {
      dispatch(
        AppearanceActions.uploadResource({
          type: ChatNodeResourceKey.MaskImg,
          file,
          fileName,
        }),
      );
    },
    [dispatch],
  );

  const deleteHandler = useCallback(() => {
    if (config) {
      const updatedConfig: ThemeConfig = {
        ...config,
        chat: {
          ...config.chat,
          chatNode: {
            ...config.chat?.chatNode,
            [ChatNodeResourceKey.MaskImg]: undefined,
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
  }, [config, theme, dispatch]);

  const onSuccessUploadHandler = useCallback(
    (fileName: string) => {
      if (config) {
        const updatedConfig: ThemeConfig = {
          ...config,
          chat: {
            ...config.chat,
            chatNode: {
              ...config.chat?.chatNode,
              [ChatNodeResourceKey.MaskImg]: fileName,
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
      <IconUploader
        label="Mask"
        value={config?.chat?.chatNode?.[ChatNodeResourceKey.MaskImg]}
        type={ChatNodeResourceKey.MaskImg}
        onSelect={selectHandler}
        onDelete={deleteHandler}
        onSuccessUpload={onSuccessUploadHandler}
      />
    </div>
  );
};
