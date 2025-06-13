import { Core, LayoutOptions } from 'cytoscape';
import throttle from 'lodash/throttle';
import { useEffect, useRef } from 'react';

import { AnimationDurationMs, InitLayoutOptions } from '../options';

export const useThrottledResizeGraph = (cy: Core | null, delay = AnimationDurationMs) => {
  const cyRef = useRef<Core | null>(cy);
  cyRef.current = cy;

  const throttledLayout = useRef(
    throttle(
      () => {
        if (!cyRef.current) return;
        cyRef.current
          .layout({
            randomize: false,
            ...InitLayoutOptions,
          } as LayoutOptions)
          .run();
      },
      delay,
      {
        leading: true,
        trailing: false,
      },
    ),
  ).current;

  useEffect(() => {
    const handler = () => {
      throttledLayout();
    };

    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('resize', handler);
      throttledLayout.cancel();
    };
  }, [throttledLayout]);
};
