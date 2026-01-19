'use client';

import MDEditor from '@uiw/react-md-editor';

import { ModelSelector } from '@/components/builder/editors/sources/components/ModelsSelector';
import { Space } from '@/components/common/Space/Space';

import { useChatSettings } from './hooks/useChatSettings';

export const ChatSettingsSection: React.FC = () => {
  const { models, isModelsLoading, currentModel, onSetCurrentModel, chatPrompt, onSetPrompt, defaultChatPrompt } =
    useChatSettings();

  return (
    <Space direction="vertical" size={12} align="start" className="max-w-[764px]">
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
        <span className="text-xs text-secondary">Prompt</span>
        <MDEditor
          value={chatPrompt ?? ''}
          textareaProps={{
            placeholder: defaultChatPrompt?.trim() ?? '',
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
