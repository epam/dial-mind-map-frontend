import keyBy from 'lodash-es/keyBy';
import merge from 'lodash-es/merge';
import sortBy from 'lodash-es/sortBy';
import values from 'lodash-es/values';

import { Entity } from '@/types/common';

export const sortByName = <T extends Entity>(entities: T[]): T[] =>
  sortBy(entities, entity => entity.name.toLowerCase());

export const doesHaveDotsInTheEnd = (name: string) => name.trim().endsWith('.');

export const isValidUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Combine entities. If there are the same ids then will be used entity from entities1 i.e. first in array
 * @param entities1
 * @param entities2
 * @returns new array without duplicates
 */
export const combineEntities = <T extends Entity>(entities1: T[], entities2: T[]): T[] => {
  const mergedEntities = merge(keyBy(entities2, 'id'), keyBy(entities1, 'id'));

  return values(mergedEntities);
};

export const dispatchMouseLeaveEvent = (eventTarget: EventTarget | null) => {
  const mouseLeaveEvent = new MouseEvent('mouseleave', {
    bubbles: true,
    cancelable: true,
    view: window,
  });

  eventTarget?.dispatchEvent(mouseLeaveEvent);
};

/**
 * Waits for a DOM element with the given ID to appear.
 * Checks once per animation frame until found or timeout.
 *
 * @param id - Element ID to wait for. If missing, resolves to `null`.
 * @param timeoutMs - Max wait time in ms (default: 2000).
 * @returns Promise resolving to the element or `null` if not found.
 */
export const waitForElement = (id: string | undefined, timeoutMs = 2000): Promise<HTMLElement | null> => {
  return new Promise(resolve => {
    if (!id) {
      resolve(null);
      return;
    }
    const start = performance.now();
    let rafId = 0;
    let canceled = false;

    const check = () => {
      if (canceled) return;
      const el = document.getElementById(id);
      if (el) {
        resolve(el);
        return;
      }
      if (performance.now() - start >= timeoutMs) {
        resolve(null);
        return;
      }
      rafId = requestAnimationFrame(check);
    };

    rafId = requestAnimationFrame(check);

    (resolve as any).cancel = () => {
      canceled = true;
      cancelAnimationFrame(rafId);
      resolve(null);
    };
  });
};
