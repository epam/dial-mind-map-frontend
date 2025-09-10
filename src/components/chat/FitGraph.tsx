import { IconCurrentLocation } from '@tabler/icons-react';

import { useChatSelector } from '@/store/chat/hooks';
import { ChatUISelectors } from '@/store/chat/ui/ui.reducers';

export const FitGraph = ({ onClick }: { onClick: () => void }) => {
  const isFitGraphAvailable = useChatSelector(ChatUISelectors.selectIsFitGraphAvailable);

  if (!isFitGraphAvailable) return null;

  return (
    <button
      className="graph-fit-button h-9 rounded-[10px] bg-layer-3 px-3 text-secondary transition-colors duration-200 hover:bg-layer-4"
      onClick={onClick}
    >
      <IconCurrentLocation size={18} />
    </button>
  );
};
