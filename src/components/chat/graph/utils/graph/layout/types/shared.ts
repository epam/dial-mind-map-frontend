export type Pos = { x: number; y: number };

export type Container = { w: number; h: number };

export interface RectTL {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type RootSizes = {
  innerW: number;
  innerH: number;
  outerW: number;
  outerH: number;
  packW: number;
  packH: number;
};

export type Cluster = {
  id: string;
  kids: number;
  innerW: number;
  innerH: number;
  outerW: number;
  outerH: number;
  packW: number;
  packH: number;
  area: number;
  AR: number;
};

export type Gaps = {
  betweenClusters: number;
  border: number;
};

export interface Item extends RectTL {
  id: string;
}

export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}
