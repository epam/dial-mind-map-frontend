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
  textColor: string;
  borderColor?: string;
  image?: string;
  branchColorIndex: number;
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

export type ReverseEdge = Omit<Edge, 'reverseEdge'>;

export interface Edge extends Entity {
  source: string;
  target: string;
  type?: EdgeType;
  reverseEdge?: ReverseEdge;
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

export interface CompletionGraphResponse {
  graph: Graph;
  responseId: string;
}

// Enum representing system-specific node data keys used for internal visualizations.
// These keys facilitate communication between Cytoscape contexts and other application contexts.
// Note: These fields are not part of the standard Node data entity and are intended for visualization purposes only.
export enum SystemNodeDataKeys {
  BranchColorIndex = 'branch-color-index',
  BorderColor = 'border-color',
  TextColor = 'text-color',
  BgColor = 'bg-color',
  Neon = 'neon',
  Pulsating = 'pulsating',
  NodeType = 'node-type',
  Parent = 'parent',
}
