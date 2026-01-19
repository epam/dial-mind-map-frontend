export interface ClusteredLayoutConfig {
  GAP: number;
  CHILD_RING_PAD: number;
  CLUSTER_PAD: number;
  ROOT_PAD: number;
  LABEL_PAD: number;

  ARC_TIGHTEN: number;

  EPS: number;

  EMPTY_MIN_DEG: number;
  RING_MIN_DEG: number;

  SPAN_BY_COUNT: { one: number; two: number; three: number; default: number };

  LAYOUT_ANIMATE_MS: number;
  ANIMATE: boolean;
  LAYOUT_PADDING: number;

  FOUR_GRID_ROW_PAD: number;
  FOUR_GRID_INNER_GAP: number;

  DEBUG_LOG?: boolean;
  LOG_PREFIX?: string;
  CENTER_PULL_DEBUG?: boolean;
  CENTER_PULL_DEBUG_VERBOSE?: boolean;

  CENTER_PULL_ALLOW_OUTWARD?: boolean;
  CENTER_PULL_CORRIDOR_FACTOR?: number;
  CENTER_PULL_CORRIDOR_CHILD_FACTOR?: number;
  CENTER_PULL_MIN_CLEARANCE?: number;
  CENTER_PULL_DIAG_SWEEP_STEPS?: number;
  CENTER_PULL_TARGET_STRATEGY?: 'median-centers' | 'boundary';
  CENTER_PULL_PACK_SLACK?: number;
  CENTER_PULL_IGNORE_PACK?: boolean;

  CENTER_PULL_LOG_AGGREGATE?: boolean;
  CENTER_PULL_LOG_STREAM?: boolean;

  // NEW:
  CENTER_PULL_PACK_MODE?: 'enforce' | 'enforce-if-inside' | 'ignore';
}

export const DEFAULT_LAYOUT_CONFIG: ClusteredLayoutConfig = {
  GAP: 4,
  CHILD_RING_PAD: 4,
  CLUSTER_PAD: 8,
  ROOT_PAD: 8,
  LABEL_PAD: 8,

  ARC_TIGHTEN: 0.8,

  EPS: 1e-3,

  EMPTY_MIN_DEG: (Math.PI / 180) * 15,
  RING_MIN_DEG: (Math.PI / 180) * 20,

  SPAN_BY_COUNT: {
    one: Math.PI * 0.4,
    two: Math.PI * 0.6,
    three: Math.PI * 0.5,
    default: Math.PI * 0.4,
  },

  LAYOUT_ANIMATE_MS: 700,
  ANIMATE: true,
  LAYOUT_PADDING: 10,

  FOUR_GRID_ROW_PAD: 5,
  FOUR_GRID_INNER_GAP: 10,

  DEBUG_LOG: false,
  LOG_PREFIX: '[layout]',
  CENTER_PULL_DEBUG_VERBOSE: false,
  CENTER_PULL_DEBUG: false,

  CENTER_PULL_ALLOW_OUTWARD: true,
  CENTER_PULL_CORRIDOR_FACTOR: 1,
  CENTER_PULL_MIN_CLEARANCE: 8,
  CENTER_PULL_CORRIDOR_CHILD_FACTOR: 0,
  CENTER_PULL_DIAG_SWEEP_STEPS: 10,
  CENTER_PULL_TARGET_STRATEGY: 'median-centers',
  CENTER_PULL_PACK_SLACK: 0,
  CENTER_PULL_IGNORE_PACK: false,

  CENTER_PULL_LOG_AGGREGATE: false,
  CENTER_PULL_LOG_STREAM: false,

  CENTER_PULL_PACK_MODE: 'enforce-if-inside',
};
