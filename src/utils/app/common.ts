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
