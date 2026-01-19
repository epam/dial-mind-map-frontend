import { ClusteredLayoutConfig } from '../../types/config';
import { Pos } from '../../types/shared';
import { box, computeBBox, getContainer, nodeRectAt, nodeSize, nodeSizeWithLabels } from '../cytoscape';

type MockBoundingBox = { x1: number; y1: number; x2: number; y2: number; w: number; h: number };

function makeMockNode(bb: MockBoundingBox, dataProps: Record<string, any> = {}) {
  return {
    empty: () => false,
    boundingBox: () => bb,
    data: (key: string) => dataProps[key],
  };
}

describe('layout utils', () => {
  describe('getContainer', () => {
    it('returns width, height and center from container bounding rect', () => {
      const fakeRect = { width: 200, height: 100, x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0 };
      const cy = {
        container: () => ({
          getBoundingClientRect: () => fakeRect,
        }),
      } as any;
      const res = getContainer(cy);
      expect(res).toEqual({
        width: 200,
        height: 100,
        center: { x: 100, y: 50 },
      });
    });
  });

  describe('box', () => {
    const pad = 5;

    it('returns minimal box when node does not exist or is empty', () => {
      const cy = {
        getElementById: () => ({ empty: () => true }),
      } as any;
      const res = box(cy, 'nonexistent', false, pad);
      expect(res).toEqual({ w: 2 * pad, h: 2 * pad });
    });

    it('for non-neon node uses boundingBox logic + pad', () => {
      const bb = { x1: 0, y1: 0, x2: 20, y2: 10, w: 20, h: 10 };
      const node = makeMockNode(bb, { neon: false });
      const cy = {
        getElementById: () => node,
      } as any;
      const res = box(cy, 'id', false, pad);
      expect(res).toEqual({ w: bb.w + 2 * pad, h: bb.h + 2 * pad });
    });

    it('for neon node without icon computes using neonSvgSize and padding', () => {
      const bb = { x1: 0, y1: 0, x2: 40, y2: 20, w: 40, h: 20 };
      const dataProps = { neon: true, neonSvgSize: { rectWidth: 80, rectHeight: 40 }, icon: false };
      const node = makeMockNode(bb, dataProps);
      const cy = { getElementById: () => node } as any;

      // proportionWidth = 80 / 40 = 2
      // proportionHeight = 40 / 20 = 2
      // xPadding = 16 / 2 = 8
      // yPadding = 16 / 2 = 8
      // w = 40 - 8 + 2*pad = 40 - 8 + 10 = 42
      // h = 20 - 8 + 10 = 22
      const res = box(cy, 'id', false, pad);
      expect(res).toEqual({ w: 42, h: 22 });
    });

    it('for neon node with icon uses extra xPadding', () => {
      const bb = { x1: 0, y1: 0, x2: 50, y2: 30, w: 50, h: 30 };
      const dataProps = { neon: true, neonSvgSize: { rectWidth: 100, rectHeight: 60 }, icon: true };
      const node = makeMockNode(bb, dataProps);
      const cy = { getElementById: () => node } as any;

      // proportionWidth = 100/50 = 2
      // proportionHeight = 60/30 = 2
      // xPadding = (16 + 10) / 2 = 13
      // yPadding = 16 / 2 = 8
      // w = 50 - 13 + 2*pad = 50 - 13 + 10 = 47
      // h = 30 - 8 + 10 = 32
      const res = box(cy, 'id', false, pad);
      expect(res).toEqual({ w: 47, h: 32 });
    });

    it('boundingBox includeLabels parameter passed through for neon and non-neon', () => {
      const bbNoLabels = { x1: 0, y1: 0, x2: 30, y2: 20, w: 30, h: 20 };
      const bbWithLabels = { x1: 0, y1: 0, x2: 35, y2: 25, w: 35, h: 25 };
      // We'll make the node boundingBox behave depending on includeLabels
      const node = {
        empty: () => false,
        boundingBox: (opts: any) => {
          return opts.includeLabels ? bbWithLabels : bbNoLabels;
        },
        data: (key: string) => {
          if (key === 'neon') return false;
          return undefined;
        },
      };
      const cy = { getElementById: () => node } as any;
      const res1 = box(cy, 'id', false, pad);
      expect(res1).toEqual({ w: bbNoLabels.w + 2 * pad, h: bbNoLabels.h + 2 * pad });
      const res2 = box(cy, 'id', true, pad);
      expect(res2).toEqual({ w: bbWithLabels.w + 2 * pad, h: bbWithLabels.h + 2 * pad });
    });

    it('falls back to 1 when neonSvgSize is defined but boundingBox has no size', () => {
      const node = {
        empty: () => false,
        boundingBox: () => undefined, // << triggers `b?.w ?? 1`
        data: (key: string) => {
          if (key === 'neon') return true;
          if (key === 'neonSvgSize') return { rectWidth: 100, rectHeight: 50 };
          if (key === 'icon') return false;
          return undefined;
        },
      };
      const cy = { getElementById: () => node } as any;
      const result = box(cy, 'id', false, 5);
      // since b?.w and b?.h are undefined → proportion = 100/1 and 50/1
      // xPadding = 16 / 100 = 0.16, yPadding = 16 / 50 = 0.32 (approximately, but since widths are undefined, final width and height are -xPadding + 2 * pad)
      // because b?.w ?? 0 = 0 - 0.16 + 10 = 9.84 approx
      expect(result.w).toBeCloseTo(9.84, 1);
      expect(result.h).toBeCloseTo(9.68, 1);
    });

    it('uses icon=false when icon is undefined', () => {
      const node = {
        empty: () => false,
        boundingBox: () => ({ w: 40, h: 20 }),
        data: (key: string) => {
          if (key === 'neon') return true;
          if (key === 'neonSvgSize') return { rectWidth: 80, rectHeight: 40 };
          return undefined; // icon not defined
        },
      };
      const cy = { getElementById: () => node } as any;
      const res = box(cy, 'id', false, 5);
      // proportion = 80/40 = 2, 40/20 = 2 → xPadding = 16/2 = 8, yPadding = 16/2 = 8
      // final: 40 - 8 + 10 = 42, 20 - 8 + 10 = 22
      expect(res).toEqual({ w: 42, h: 22 });
    });

    it('uses fallback 0 size when boundingBox is undefined on non-neon node', () => {
      const node = {
        empty: () => false,
        boundingBox: () => undefined,
        data: () => false,
      };
      const cy = { getElementById: () => node } as any;
      const result = box(cy, 'id', false, 3);
      expect(result).toEqual({ w: 6, h: 6 }); // fallback w/h = 0 + 2 * pad
    });
  });

  describe('computeBBox', () => {
    it('computes bounding box correctly for multiple ids', () => {
      const cfg: ClusteredLayoutConfig = { LABEL_PAD: 0 } as any;
      // two nodes: id1 at (10, 10) size 4x6, id2 at (20, 15) size 8x4
      const cy = {} as any;
      const positions: Record<string, Pos> = {
        a: { x: 10, y: 10 },
        b: { x: 20, y: 15 },
      };
      const sizeFn = (_cy: any, id: string) => {
        if (id === 'a') return { w: 4, h: 6 };
        return { w: 8, h: 4 };
      };
      const res = computeBBox(cy, ['a', 'b'], positions, sizeFn, cfg);
      // For a:
      // x1a = 10 - 4/2 = 8
      // y1a = 10 - 6/2 = 7
      // x2a = 10 + 2 = 12
      // y2a = 10 + 3 = 13
      // For b:
      // x1b = 20 - 4 = 16
      // y1b = 15 - 2 = 13
      // x2b = 20 + 4 = 24
      // y2b = 15 + 2 = 17
      // minX = 8, minY = 7, maxX = 24, maxY = 17
      // w = 16, h = 10, cx = 16, cy = 12
      expect(res).toEqual({
        x: 8,
        y: 7,
        w: 16,
        h: 10,
        cx: 16,
        cy: 12,
      });
    });

    it('falls back to proportionWidth = 1 if division is NaN (rectWidth undefined)', () => {
      const node = {
        empty: () => false,
        boundingBox: () => ({ w: 0, h: 20 }),
        data: (key: string) => {
          if (key === 'neon') return true;
          if (key === 'neonSvgSize') return { /* rectWidth missing */ rectHeight: 40 };
          if (key === 'icon') return false;
          return undefined;
        },
      };
      const cy = { getElementById: () => node } as any;
      const result = box(cy, 'id', false, 5);
      // proportionWidth = undefined / 0 = NaN → fallback to 1
      // xPadding = 16 / 1 = 16, yPadding = 16 / 2 = 8
      // w = 0 - 16 + 10 = -6, h = 20 - 8 + 10 = 22
      expect(result.w).toBeCloseTo(-6, 1);
      expect(result.h).toBeCloseTo(22, 1);
    });

    it('falls back to proportionHeight = 1 if division is NaN (rectHeight undefined)', () => {
      const node = {
        empty: () => false,
        boundingBox: () => ({ w: 40, h: 0 }),
        data: (key: string) => {
          if (key === 'neon') return true;
          if (key === 'neonSvgSize') return { rectWidth: 80 /* rectHeight missing */ };
          if (key === 'icon') return false;
          return undefined;
        },
      };
      const cy = { getElementById: () => node } as any;
      const result = box(cy, 'id', false, 5);
      // proportionHeight = undefined / 0 = NaN → fallback to 1
      // xPadding = 16 / 2 = 8, yPadding = 16 / 1 = 16
      // w = 40 - 8 + 10 = 42, h = 0 - 16 + 10 = -6
      expect(result.w).toBeCloseTo(42, 1);
      expect(result.h).toBeCloseTo(-6, 1);
    });
  });

  describe('nodeRectAt', () => {
    it('computes rectangle with labels by default', () => {
      const pad = 3;
      const cfg: ClusteredLayoutConfig = { LABEL_PAD: pad } as any;
      const bb = { x1: 0, y1: 0, x2: 10, y2: 4, w: 10, h: 4 };
      const node = makeMockNode(bb, { neon: false });
      const cy = { getElementById: () => node } as any;
      const pos: Pos = { x: 5, y: 6 };

      // nodeSizeWithLabels uses includeLabels = true, pad=0
      // so size = { w: 10, h: 4 }
      // then nodeRectAt: pad default = 0, w = 10, h = 4
      // x = 5 - 10/2 = 0, y = 6 - 4/2 = 4
      const res = nodeRectAt(cy, 'id', pos, cfg, {});
      expect(res).toEqual({ x: 0, y: 4, w: 10, h: 4 });
    });

    it('can use pad and exclude labels', () => {
      const pad = 2;
      const cfg: ClusteredLayoutConfig = { LABEL_PAD: pad } as any;
      const bb = { x1: 0, y1: 0, x2: 8, y2: 6, w: 8, h: 6 };
      const node = makeMockNode(bb, { neon: false });
      const cy = { getElementById: () => node } as any;
      const pos: Pos = { x: 4, y: 5 };

      // use includeLabels = false, pad override = 1
      const res = nodeRectAt(cy, 'id', pos, cfg, { includeLabels: false, pad: 1 });
      // nodeSize (exclude labels) gives { w: 8 + 2*cfg.LABEL_PAD = 8 + 4 = 12, h = 6 + 4 = 10 }
      // then in nodeRectAt: w = 12 + 2*1 = 14, h = 10 + 2*1 = 12
      // x = 4 - 14/2 = -3, y = 5 - 12/2 = -1
      expect(res).toEqual({ x: -3, y: -1, w: 14, h: 12 });
    });
  });

  it('uses default opts = {} when not provided', () => {
    const cfg: ClusteredLayoutConfig = { LABEL_PAD: 0 } as any;
    const bb = { w: 10, h: 6 };
    const node = {
      empty: () => false,
      boundingBox: () => bb,
      data: () => false,
    };
    const cy = { getElementById: () => node } as any;
    const pos: Pos = { x: 5, y: 5 };

    // Call WITHOUT passing opts argument (to trigger opts = {})
    const result = nodeRectAt(cy, 'id', pos, cfg);

    // nodeSizeWithLabels used (includeLabels defaults to true), pad = 0
    // w = 10, h = 6 → final x = 5 - 5 = 0, y = 5 - 3 = 2
    expect(result).toEqual({ x: 0, y: 2, w: 10, h: 6 });
  });
});

describe('nodeSize / nodeSizeWithLabels', () => {
  const node = {
    empty: () => false,
    boundingBox: () => ({ w: 20, h: 10 }),
    data: (key: string) => {
      if (key === 'neon') return false;
      return undefined;
    },
  };
  const cy = { getElementById: () => node } as any;

  it('nodeSize calls box with includeLabels=false and applies pad from cfg', () => {
    const cfg: ClusteredLayoutConfig = { LABEL_PAD: 4 } as any;
    const result = nodeSize(cy, 'node1', cfg);
    // box returns { w: 20 + 2*4 = 28, h: 10 + 2*4 = 18 }
    expect(result).toEqual({ w: 28, h: 18 });
  });

  it('nodeSizeWithLabels calls box with includeLabels=true and pad=0', () => {
    const result = nodeSizeWithLabels(cy, 'node2');
    // box returns { w: 20 + 2*0 = 20, h: 10 + 2*0 = 10 }
    expect(result).toEqual({ w: 20, h: 10 });
  });
});
