import { ChatPositionSubSection } from './ChatPositionSubSection';
import { InputPlaceholderSubSection } from './InputPlaceholderSubSection';
import { MaxNodesLimitSubSection } from './MaxNodesLimitSubSection';

export const MainSettingsSection = () => {
  return (
    <div className="flex flex-col gap-6">
      <ChatPositionSubSection />
      <InputPlaceholderSubSection />
      <MaxNodesLimitSubSection />
    </div>
  );
};
