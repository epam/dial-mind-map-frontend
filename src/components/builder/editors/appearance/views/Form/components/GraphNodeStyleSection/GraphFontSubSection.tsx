import { useCallback } from 'react';

import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ThemeConfig } from '@/types/customization';
import { extractOriginalStorageFontFileName, isStorageFontFileName } from '@/utils/app/file';

import { FontHandler } from '../FontsSection/FontHandler';

const GraphFontUploadKey = 'graph-font';

export const GraphFontSubSection = () => {
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme);
  const config = useBuilderSelector(AppearanceSelectors.selectThemeConfig);

  const font = config?.graph?.font;
  const fontFamily = font?.['font-family'];
  const fontFileName = isStorageFontFileName(font?.fontFileName ?? '')
    ? extractOriginalStorageFontFileName(font?.fontFileName ?? '')
    : '';

  const selectFileHandler = useCallback(
    (file: File, fileName: string) => {
      dispatch(
        AppearanceActions.uploadFont({
          type: GraphFontUploadKey,
          file,
          fileName,
        }),
      );
    },
    [dispatch],
  );

  const successFileUploadHandler = useCallback(
    (fontFileName: string, fontFamilyName: string) => {
      if (!config) return;

      const updatedConfig: ThemeConfig = {
        ...config,
        graph: {
          ...config.graph,
          font: {
            ...config.graph.font,
            ['font-family']: fontFamilyName,
            fontFileName,
          },
        },
      };

      return dispatch(AppearanceActions.updateThemeConfig({ theme, config: updatedConfig }));
    },
    [dispatch, config, theme],
  );

  const deleteFileHandler = useCallback(() => {
    if (!config) return;

    const updatedConfig: ThemeConfig = {
      ...config,
      graph: {
        ...config.graph,
        font: undefined,
      },
    };

    dispatch(AppearanceActions.updateThemeConfig({ theme, config: updatedConfig }));
  }, [theme, dispatch, config]);

  const selectorChangeHandler = useCallback(
    (value?: string) => {
      if (!config) return;

      const updatedConfig: ThemeConfig = {
        ...config,
        graph: {
          ...config.graph,
          font: {
            ...config.graph.font,
            'font-family': value,
            fontFileName: undefined,
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
    [config, theme],
  );

  const inputChangeHandler = useCallback(
    (value?: string) => {
      if (!config) return;

      const updatedConfig: ThemeConfig = {
        ...config,
        graph: {
          ...config.graph,
          font: {
            ...config.graph.font,
            'font-family': value,
            fontFileName: undefined,
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
    <FontHandler
      fontFamily={fontFamily}
      fontFileName={fontFileName}
      uploadKey={GraphFontUploadKey}
      onDeleteFile={deleteFileHandler}
      onSelectFile={selectFileHandler}
      onSuccessFileUpload={successFileUploadHandler}
      onSelectorChange={selectorChangeHandler}
      onInputChange={inputChangeHandler}
      selectorPlaceholder="Auto"
    />
  );
};
