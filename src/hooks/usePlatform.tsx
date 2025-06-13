import { useEffect, useState } from 'react';

import { Platform } from '@/types/common';

export const usePlatform = (): Platform => {
  const [platform, setPlatform] = useState<Platform>(Platform.OTHER);

  useEffect(() => {
    const detectPlatform = (): Platform => {
      if (navigator.userAgentData) {
        // Modern API: userAgentData
        const platform = navigator.userAgentData.platform.toLowerCase();
        if (platform.includes('mac')) return Platform.MAC;
        if (platform.includes('win')) return Platform.WINDOWS;
      } else if (navigator.userAgent) {
        // Fallback to userAgent parsing
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('mac')) return Platform.MAC;
        if (userAgent.includes('win')) return Platform.WINDOWS;
      }
      return Platform.OTHER;
    };

    setPlatform(detectPlatform());
  }, []);

  return platform;
};
