'use client';

import { IconAlertTriangle } from '@tabler/icons-react';

export function NetworkOfflineBanner() {
  return (
    <div className="relative flex size-full flex-row">
      <div className="size-full flex-1">
        <div className="flex size-full flex-col items-center justify-center gap-4">
          <IconAlertTriangle size={80} stroke={0.5} role="alert" />
          <div className="text-center text-lg font-semibold">You’re offline</div>
          <div className="text-center text-sm text-secondary">Please check your internet connection and refresh.</div>
          <button onClick={() => window.location.reload()} className="button button-primary">
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
