import MDEditor from '@uiw/react-md-editor';
import { useEffect, useRef, useState } from 'react';

import { Space } from '@/components/common/Space/Space';
import { ToggleSwitch } from '@/components/common/ToggleSwitch/ToggleSwitch';

import { useGuardrailsSettings } from './hooks/useGuardrailsSettings';

export const GuardrailsSettingsSection: React.FC = () => {
  const {
    chatGuardrailsEnabled,
    defaultChatGuardrailsPrompt,
    defaultChatGuardrailsResponsePrompt,
    chatGuardrailsPrompt,
    chatGuardrailsResponsePrompt,
    onSetGuardrailsPrompt,
    onSetGuardrailsEnabled,
    onSetChatGuardrailsResponsePrompt,
  } = useGuardrailsSettings();

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [prevEnabled, setPrevEnabled] = useState(chatGuardrailsEnabled);

  useEffect(() => {
    const turnedOn = !prevEnabled && chatGuardrailsEnabled;

    if (turnedOn && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setPrevEnabled(chatGuardrailsEnabled);
  }, [chatGuardrailsEnabled, prevEnabled]);

  return (
    <>
      <div className="flex justify-between">
        <h3 className="text-base font-semibold text-primary">Guardrails</h3>
        <ToggleSwitch
          id="chat-guardrails-enabled-toggle"
          isOn={chatGuardrailsEnabled}
          switchOnText="ON"
          switchOFFText="OFF"
          handleSwitch={(e: React.ChangeEvent<HTMLInputElement>) => {
            onSetGuardrailsEnabled(e.target.checked);
          }}
        />
      </div>
      {chatGuardrailsEnabled && (
        <Space ref={sectionRef} direction="vertical" size={12} align="start" className="max-w-[764px]">
          <Space direction="vertical" size={4} className="w-full" align="start">
            <span className="text-xs text-secondary">Prompt</span>
            <MDEditor
              value={chatGuardrailsPrompt ?? ''}
              textareaProps={{
                placeholder: defaultChatGuardrailsPrompt?.trim() ?? '',
              }}
              preview="edit"
              onChange={val => onSetGuardrailsPrompt(val ?? '')}
              height={215}
              className="!rounded !border !border-primary !bg-layer-2 !text-primary"
              previewOptions={{
                components: {
                  a: props => <a {...props} target="_blank" rel="noopener noreferrer" />,
                },
              }}
            />
          </Space>
          <Space direction="vertical" size={4} className="w-full" align="start">
            <span className="text-xs text-secondary">Response Prompt</span>
            <MDEditor
              value={chatGuardrailsResponsePrompt ?? ''}
              textareaProps={{
                placeholder: defaultChatGuardrailsResponsePrompt?.trim() ?? '',
              }}
              preview="edit"
              onChange={val => onSetChatGuardrailsResponsePrompt(val ?? '')}
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
      )}
    </>
  );
};
