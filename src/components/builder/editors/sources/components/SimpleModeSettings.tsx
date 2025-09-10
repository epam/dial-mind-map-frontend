'use client';

import MDEditor from '@uiw/react-md-editor';

import { Space } from '@/components/common/Space/Space';
import { ToggleSwitch } from '@/components/common/ToggleSwitch/ToggleSwitch';
import { GenerationType } from '@/types/generate';

import { useSimpleModeSettings } from './hooks/useSimpleModeSettings';
import { ModelSelector } from './ModelsSelector';

export const SimpleModeSettings: React.FC = () => {
  const {
    generationType,
    onSetGenerationType,
    models,
    currentModel,
    prompt,
    onSetPrompt,
    onSetCurrentModel,
    isModelsLoading,
  } = useSimpleModeSettings();

  return (
    <Space className="w-full border-l border-tertiary" direction="vertical">
      <Space size="middle" direction="vertical" align="start" className="w-[300px] shrink-0  p-2">
        <Space>
          <label htmlFor="node-highlight" className="mb-1 flex min-w-20 text-sm">
            Simple mode:
          </label>

          <ToggleSwitch
            isOn={generationType === GenerationType.Simple}
            switchOnText="ON"
            switchOFFText="OFF"
            handleSwitch={(e: React.ChangeEvent<HTMLInputElement>) => {
              onSetGenerationType(e.target.checked);
            }}
          />
        </Space>
        <ModelSelector
          models={models}
          selectedModel={currentModel}
          onChange={onSetCurrentModel}
          isLoading={isModelsLoading}
        />

        <Space direction="vertical" className="w-full" align="start">
          <label htmlFor="simple-prompt" className="mb-1 block text-xs text-secondary">
            Prompt:
          </label>
          <MDEditor
            value={prompt ?? ''}
            preview="edit"
            onChange={val => onSetPrompt(val ?? '')}
            height={400}
            className="!rounded !border !border-primary !bg-layer-2 !text-primary"
          />
        </Space>
      </Space>
    </Space>
  );
};
