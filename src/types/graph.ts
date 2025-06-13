interface Entity {
  id: string;
}

export enum NodeStatus {
  Draft = 'draft',
  ReviewRequired = 'review-required',
  Reviewed = 'reviewed',
}

export interface DocsReference {
  doc_id: string;
  chunk_id: string;
  doc_name: string;
  source_name: string;
  doc_type: string;
  doc_content_type: string;
  doc_url: string;
  content: string;
  content_type: string;
  version: number;
}

export interface NodeReference {
  id: string;
  label: string;
  details: string;
  question: string;
}

export interface Reference {
  docs: DocsReference[];
  nodes: NodeReference[];
}

export interface Node extends Entity {
  label: string;
  details?: string;
  icon?: string;
  status?: NodeStatus;
  references?: Reference;
  neon?: boolean;
  questions?: string[];
  question?: string;
}

export interface ColoredNode extends Node {
  color: string;
}

export enum EdgeType {
  Init = 'Init',
  Manual = 'Manual',
  Generated = 'Generated',
}

export enum EdgeDirectionType {
  Inbound = 'inbound',
  Outbound = 'outbound',
}

export interface Edge extends Entity {
  source: string;
  target: string;
  type?: EdgeType;
}

export type GraphElement = Node | Edge;

export interface Element<T extends GraphElement> {
  data: T;
}

export interface PositionedElement<T extends GraphElement> extends Element<T> {
  position?: {
    x: number;
    y: number;
  };
}

export interface Graph {
  nodes: PositionedElement<Node>[];
  edges: Element<Edge>[];
  root: string;
}
