import { useCallback } from 'react';

import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ThemeConfig } from '@/types/customization';
import { extractOriginalStorageFontFileName, isStorageFontFileName } from '@/utils/app/file';

import { FontHandler } from './FontHandler';

const MainFontUploadKey = 'main-font';

export const MainFontSubSection = () => {
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme);
  const config = useBuilderSelector(AppearanceSelectors.selectThemeConfig);

  const font = config?.font;
  const fontFamily = font?.['font-family'];
  const fontFileName = isStorageFontFileName(font?.fontFileName ?? '')
    ? extractOriginalStorageFontFileName(font?.fontFileName ?? '')
    : '';

  const selectFileHandler = useCallback(
    (file: File, fileName: string) => {
      dispatch(
        AppearanceActions.uploadFont({
          type: MainFontUploadKey,
          file,
          fileName,
        }),
      );
    },
    [dispatch],
  );

  const successFileUploadHandler = useCallback(
    (fontFileName: string, fontFamilyName: string) => {
      if (config) {
        const updatedConfig: ThemeConfig = {
          ...config,
          font: {
            ...config.font,
            ['font-family']: fontFamilyName,
            fontFileName,
          },
        };

        return dispatch(AppearanceActions.updateThemeConfig({ theme, config: updatedConfig }));
      }
    },
    [dispatch, config, theme],
  );

  const deleteFileHandler = useCallback(() => {
    const updatedConfig = {
      ...config,
      font: undefined,
    } as ThemeConfig;

    dispatch(AppearanceActions.updateThemeConfig({ theme, config: updatedConfig }));
  }, [theme, dispatch, config]);

  const selectorChangeHandler = useCallback(
    (value?: string) => {
      if (!config) return;

      const updatedConfig: ThemeConfig = {
        ...config,
        font: {
          ...config.font,
          'font-family': value,
          fontFileName: undefined,
        },
      };
      dispatch(
        AppearanceActions.updateThemeConfig({
          theme,
          config: updatedConfig,
        }),
      );
    },
    [config, theme],
  );

  const inputChangeHandler = useCallback(
    (value?: string) => {
      if (!config) return;

      const updatedConfig: ThemeConfig = {
        ...config,
        font: {
          ...config.font,
          'font-family': value,
          fontFileName: undefined,
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
    <FontHandler
      fontFamily={fontFamily}
      fontFileName={fontFileName}
      uploadKey={MainFontUploadKey}
      onDeleteFile={deleteFileHandler}
      onSelectFile={selectFileHandler}
      onSuccessFileUpload={successFileUploadHandler}
      onSelectorChange={selectorChangeHandler}
      onInputChange={inputChangeHandler}
      selectorPlaceholder="Default"
    />
  );
};
