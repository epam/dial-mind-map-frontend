import { DocsReference, Element, GraphElement, NodeReference } from '@/types/graph';

export type DepthType = 1 | 2;

export interface MindmapState {
  elements: Element<GraphElement>[];
  fallbackElements: Element<GraphElement>[];
  previousNodeId: string;
  focusNodeId: string;
  isReady: boolean;
  visitedNodes: Record<string, string>;
  depth: DepthType;
  updateSignal: number;
  isGraphFetching: boolean;
  sequentialFetchFailures: number;
  isNotFound: boolean;
  isRootNodeNotFound: boolean;
  fullscreenReferences: Array<DocsReference | NodeReference> | null;
  fullscreenInitialSlide: number | null;
  activeFullscreenReferenceId: string | null;
}
