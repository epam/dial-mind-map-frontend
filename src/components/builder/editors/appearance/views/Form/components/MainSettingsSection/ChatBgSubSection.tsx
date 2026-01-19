import { IconPhoto } from '@tabler/icons-react';
import { useCallback } from 'react';

import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ChatImgResourceKey, ThemeConfig } from '@/types/customization';

import { IconUploader } from '../IconsSection.tsx/IconUploader';

export const ChatBgSubSection = () => {
  const dispatch = useBuilderDispatch();
  const config = useBuilderSelector(AppearanceSelectors.selectThemeConfig);
  const theme = useBuilderSelector(UISelectors.selectTheme);

  const selectHandler = useCallback(
    (fileName: string, file: File) => {
      dispatch(
        AppearanceActions.uploadResource({
          type: ChatImgResourceKey.ChatBgImg,
          file,
          fileName,
        }),
      );
    },
    [dispatch],
  );

  const deleteHandler = useCallback(() => {
    if (config?.chat) {
      const updatedConfig: ThemeConfig = {
        ...config,
        chat: {
          ...config.chat,
          images: {
            ...config.chat.images,
            [ChatImgResourceKey.ChatBgImg]: undefined,
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
      if (config?.chat) {
        const updatedConfig: ThemeConfig = {
          ...config,
          chat: {
            ...config.chat,
            images: {
              ...config.chat.images,
              [ChatImgResourceKey.ChatBgImg]: fileName,
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
    <div>
      <IconUploader
        label="Chat background image"
        value={config?.chat?.images?.[ChatImgResourceKey.ChatBgImg]}
        type={ChatImgResourceKey.ChatBgImg}
        onSelect={selectHandler}
        onDelete={deleteHandler}
        onSuccessUpload={onSuccessUploadHandler}
        defaultIcon={<IconPhoto />}
        placeholder="No image"
        imageContainerClassName="!p-0"
      />
    </div>
  );
};
