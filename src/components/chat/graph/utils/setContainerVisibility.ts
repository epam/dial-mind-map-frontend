import { Core } from 'cytoscape';

const SHOW_FADE_MS = 220;

export const setContainerVisibility = (cy: Core | null, visible: boolean) => {
  const el = cy?.container?.();
  if (!el) return;

  if (!el.style.transition && visible) {
    el.style.transition = `opacity ${SHOW_FADE_MS}ms ease`;
    el.style.willChange = 'opacity';
  }

  if (el.style.transition && !visible) {
    // When hiding, remove transition to make it instant
    el.style.transition = '';
    el.style.willChange = '';
  }

  el.style.opacity = visible ? '1' : '0';
  el.style.pointerEvents = visible ? 'auto' : 'none';
};
