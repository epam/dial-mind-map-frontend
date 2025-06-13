import { GraphElement, PositionedElement } from '@/types/graph';

export enum UpdateMode {
  None = 'none',
  Refresh = 'refresh',
  Relayout = 'relayout',
}

export interface GraphState {
  elements: PositionedElement<GraphElement>[];
  rootNodeId: string;
  focusNodeId: string;
  focusEdgeId: string;
  highlightedNodeIds: string[];
  isReady: boolean;
  updateSignal: number;
  updateMode: UpdateMode;
}
