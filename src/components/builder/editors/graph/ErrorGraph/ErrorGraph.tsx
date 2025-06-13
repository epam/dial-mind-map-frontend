import { IconAlertTriangle } from '@tabler/icons-react';

export const ErrorGraph = () => {
  return (
    <div className="relative flex size-full flex-row">
      <div className="size-full flex-1">
        <div className="flex size-full flex-col items-center justify-center gap-4">
          <IconAlertTriangle size={80} stroke={0.5} className="text-secondary" role="alert" />
          <div className="text-lg font-semibold">Unable to load the graph</div>
          <div className="text-sm">Please contact the support team for assistance</div>
        </div>
      </div>
    </div>
  );
};
