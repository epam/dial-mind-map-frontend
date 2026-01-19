'use client';

import { ChatSettingsSection } from './ChatSettingsSection';
import { GraphSettingsSection } from './GraphSettingsSection';
import { GuardrailsSettingsSection } from './GuardrailsSettingsSection';

export const SimpleModeSettings: React.FC = () => {
  return (
    <div className="flex h-full max-h-full w-[360px] shrink-0 flex-col overflow-y-auto border-l border-tertiary">
      <div className="flex flex-col gap-3 p-[20px]">
        <h3 className="text-base font-semibold text-primary">Graph settings</h3>
        <GraphSettingsSection />
      </div>

      <div className="w-full border-b border-tertiary" />

      <div className="flex flex-col gap-3 p-[20px]">
        <h3 className="text-base font-semibold text-primary">Rag settings</h3>
        <ChatSettingsSection />
      </div>

      <div className="w-full border-b border-tertiary" />

      <div className="flex flex-col gap-3 p-[20px]">
        <GuardrailsSettingsSection />
      </div>
    </div>
  );
};
