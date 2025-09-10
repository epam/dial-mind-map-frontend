import { OnMount } from '@monaco-editor/react';
import { debounce } from 'lodash-es';
import { useCallback, useMemo, useRef } from 'react';

import { MonacoEditor } from '@/components/builder/common/MonacoEditor';
import { INPUT_DEBOUNCE } from '@/constants/app';
import { CustomStylesPlaceholder } from '@/constants/chat/customStyles';
import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ThemeConfig } from '@/types/customization';
import { validateCustomCSS } from '@/utils/app/validateCustomCSS';

const EDITOR_DEBOUNCE = INPUT_DEBOUNCE * 3;
const VALIDATION_DEBOUNCE = 300;

export const CustomStylesSection = () => {
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme) || 'dark';
  const config = useBuilderSelector(AppearanceSelectors.selectThemeConfig);
  const customStyles = config?.chat?.customStyles || CustomStylesPlaceholder;

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const handleEditorMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;
  };

  const setEditorMarkers = (markers: { message: string; line: number }[]) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model) return;

    monaco.editor.setModelMarkers(
      model,
      'custom-css-validation',
      markers.map(({ message, line }) => ({
        startLineNumber: line,
        endLineNumber: line,
        startColumn: 1,
        endColumn: model.getLineLength(line),
        message,
        severity: monaco.MarkerSeverity.Error,
      })),
    );
  };

  const validateAndMark = useCallback(
    async (value: string) => {
      const result = await validateCustomCSS(value);
      if (result.status) {
        setEditorMarkers([]);
      } else {
        setEditorMarkers(result.errors || [{ message: result.error ?? '', line: 1 }]);
      }
      return result.status;
    },
    [dispatch],
  );

  const handleChange = useCallback(
    async (value?: string) => {
      if (!config || !value) return;

      const isValid = await validateAndMark(value);
      if (!isValid) return;

      const updatedConfig: ThemeConfig = {
        ...config,
        chat: {
          ...config.chat,
          customStyles: value,
        },
      };

      dispatch(
        AppearanceActions.updateThemeConfig({
          theme,
          config: updatedConfig,
        }),
      );
    },
    [config, dispatch, theme, validateAndMark],
  );

  const debouncedChange = useMemo(() => debounce(handleChange, EDITOR_DEBOUNCE), [handleChange]);
  const debouncedValidate = useMemo(() => debounce(validateAndMark, VALIDATION_DEBOUNCE), [validateAndMark]);

  return (
    <div className="max-w-[764px]">
      <MonacoEditor
        height={400}
        value={customStyles}
        className="m-0.5 w-full rounded border border-primary"
        language="css"
        onChange={val => {
          if (val) {
            debouncedValidate(val);
            debouncedChange(val);
          }
        }}
        allowFullScreen
        onMount={handleEditorMount}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          wordWrap: 'on',
          formatOnType: true,
          formatOnPaste: true,
          automaticLayout: true,
        }}
      />
    </div>
  );
};
