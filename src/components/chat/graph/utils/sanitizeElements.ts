import { Element, GraphElement } from '@/types/graph';
import { isNode } from '@/utils/app/graph/typeGuards';

export const sanitizeElements = (elements: Element<GraphElement>[], useNodeIconAsBgImage?: boolean) => {
  let res = elements;

  if (useNodeIconAsBgImage) {
    res = res.map(el => {
      if (!isNode(el.data) || !el.data.neon) return el;
      el.data.neon = false;
      return el;
    });
  }

  return res;
};
