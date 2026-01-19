import { Core, LayoutOptions } from 'cytoscape';
import debounce from 'lodash/debounce';
import { useEffect, useRef } from 'react';

import { GraphLayoutType } from '@/types/customization';

import { AnimationDurationMs, InitLayoutOptions } from '../options';
import { applyClusteredAroundRoot } from '../utils/graph/layout/';

export const useThrottledResizeGraph = (
  cy: Core | null,
  delay = AnimationDurationMs,
  graphLayoutType?: GraphLayoutType,
) => {
  const cyRef = useRef<Core | null>(null);
  const layoutTypeRef = useRef<GraphLayoutType | undefined>(graphLayoutType);

  useEffect(() => {
    cyRef.current = cy;
  }, [cy]);
  useEffect(() => {
    layoutTypeRef.current = graphLayoutType;
  }, [graphLayoutType]);

  const runLayout = useRef(() => {
    const inst = cyRef.current;
    const type = layoutTypeRef.current;
    if (!inst) return;

    if (type === GraphLayoutType.EllipticRing) {
      applyClusteredAroundRoot(inst);
    } else {
      inst
        .layout({
          randomize: false,
          ...InitLayoutOptions,
        } as LayoutOptions)
        .run();
    }
  }).current;

  const debouncedLayout = useRef(
    debounce(
      () => {
        runLayout();
      },
      delay,
      { leading: false, trailing: true },
    ),
  ).current;

  useEffect(() => {
    const inst = cyRef.current;
    if (!inst) return;
    const container = inst.container?.() as HTMLElement | undefined;
    if (!container) return;

    let prevW = Math.round(container.clientWidth);
    let prevH = Math.round(container.clientHeight);

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const rect = entry.contentRect;
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);

        if (w === prevW && h === prevH) continue;
        prevW = w;
        prevH = h;
        if (!w || !h) continue;
        debouncedLayout();
      }
    });

    ro.observe(container);

    return () => {
      ro.disconnect();
      debouncedLayout.cancel();
    };
  }, [cy, debouncedLayout]);

  useEffect(() => {
    debouncedLayout.cancel();
    runLayout();
  }, [graphLayoutType, runLayout, debouncedLayout]);
};
