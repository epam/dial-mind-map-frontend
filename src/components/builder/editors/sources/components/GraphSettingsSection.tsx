import MDEditor from '@uiw/react-md-editor';

import { ModelSelector } from '@/components/builder/editors/sources/components/ModelsSelector';
import { Space } from '@/components/common/Space/Space';

import { useGraphSettings } from './hooks/useGraphSettings';

export const GraphSettingsSection = () => {
  const { models, currentModel, prompt, onSetPrompt, onSetCurrentModel, isModelsLoading, defaultPrompt } =
    useGraphSettings();

  return (
    <Space size={12} direction="vertical" align="start" className="w-full">
      <Space direction="vertical" size={4} align="start" className="w-full">
        <span className="text-xs text-secondary">Model</span>
        <ModelSelector
          models={models}
          selectedModel={currentModel}
          onChange={onSetCurrentModel}
          isLoading={isModelsLoading}
        />
      </Space>

      <Space direction="vertical" size={4} className="w-full" align="start">
        <label htmlFor="simple-prompt" className="block text-xs text-secondary">
          Prompt
        </label>
        <MDEditor
          value={prompt ?? ''}
          textareaProps={{
            placeholder: defaultPrompt?.trim() ?? '',
          }}
          preview="edit"
          onChange={val => onSetPrompt(val ?? '')}
          height={215}
          className="!rounded !border !border-primary !bg-layer-2 !text-primary"
          previewOptions={{
            components: {
              a: props => <a {...props} target="_blank" rel="noopener noreferrer" />,
            },
          }}
        />
      </Space>
    </Space>
  );
};
