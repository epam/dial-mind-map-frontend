import { Editor } from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import { ZodError } from 'zod';

import Tooltip from '@/components/builder/common/Tooltip';
import Button from '@/components/common/Button/Button';
import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ThemeConfigSchema } from '@/types/customization';

export const JsonView = () => {
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme) || 'dark';
  const themeConfig = useBuilderSelector(AppearanceSelectors.selectThemeConfig);

  const [editorValue, setEditorValue] = useState<string>(
    Object.keys(themeConfig ?? {}).length ? JSON.stringify(themeConfig, null, 2) : JSON.stringify({}),
  );

  const [isValidJson, setIsValidJson] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const formatted = JSON.stringify(themeConfig, null, 2);
    setEditorValue(formatted);
    validateJson(formatted);
  }, [themeConfig]);

  const validateJson = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      ThemeConfigSchema.parse(parsed);

      setIsValidJson(true);
      setErrorMessage(null);
    } catch (error) {
      setIsValidJson(false);

      if (error instanceof SyntaxError) {
        setErrorMessage('Invalid JSON syntax');
      } else if (error instanceof ZodError) {
        const issueMessages = error.issues.map(i => `${i.path.join('.')} — ${i.message}`);
        setErrorMessage(issueMessages.join('\n'));
      } else {
        setErrorMessage('Unknown validation error');
      }
    }
  };

  const handleChange = (value?: string) => {
    const updated = value ?? '';
    setEditorValue(updated);
    validateJson(updated);
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editorValue);
      ThemeConfigSchema.parse(parsed);
      dispatch(AppearanceActions.updateThemeConfig({ config: parsed, theme }));
    } catch (error) {
      console.warn('Save failed:', error);
    }
  };

  return (
    <div className="mx-3 mb-3 flex h-[calc(100%-82px)] flex-col rounded bg-layer-3 pt-1 shadow-mindmap">
      <div className="flex h-full flex-col gap-2">
        <div className="h-full px-2 pt-2">
          <Editor
            height="100%"
            defaultLanguage="json"
            value={editorValue}
            onChange={handleChange}
            theme={theme === 'light' ? 'vs' : 'vs-dark'}
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

        <div className="flex justify-end border-t border-tertiary px-6 py-4">
          {errorMessage ? (
            <Tooltip tooltip={`Errors:\n${errorMessage}`} contentClassName="px-1 text-sm text-primary">
              <Button variant="primary" label="Save changes" onClick={handleSave} disabled={!isValidJson} />
            </Tooltip>
          ) : (
            <Button variant="primary" label="Save changes" onClick={handleSave} />
          )}
        </div>
      </div>
    </div>
  );
};
