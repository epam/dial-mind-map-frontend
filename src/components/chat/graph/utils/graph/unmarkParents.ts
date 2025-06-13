import { Element, GraphElement } from '@/types/graph';

export function unmarkParents(elements: Element<GraphElement>[]) {
  // Filter out the group pointer elements
  const filteredElements = elements.filter(element => {
    // Check if the element is a group pointer
    return !element.data.id.startsWith('#parent-');
  });

  // Remove the parent property from each node
  const result = filteredElements.map(element => {
    const node = element.data as any;
    if (node.parent !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { parent, ...rest } = node;
      return { data: { ...rest } };
    }
    return element;
  });

  return result;
}
