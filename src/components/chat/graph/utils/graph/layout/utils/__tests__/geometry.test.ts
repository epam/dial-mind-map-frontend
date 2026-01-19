import {
  arrangeBalanced,
  circRadiusOfRect,
  distPointToSegment,
  inflateTL,
  inflateWH,
  intersects,
  minDistanceSegmentToRect,
  outsideContainer,
  polar,
  rectCenterToTL,
  rectCtoTL,
  rectTLContains,
  segIntersects,
  supportOnDir,
  TAU,
} from '../geometry';

describe('geometryUtils', () => {
  test('TAU is 2π', () => {
    expect(TAU).toBeCloseTo(Math.PI * 2);
  });

  test('polar coordinates', () => {
    const p = polar(0, 0, 1, Math.PI / 2);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(1);
  });

  test('rectCtoTL and rectCenterToTL', () => {
    const rect = { x: 50, y: 40, w: 20, h: 10 };
    expect(rectCtoTL(rect)).toEqual({ x: 40, y: 35, w: 20, h: 10 });
    expect(rectCenterToTL(rect)).toEqual({ x: 40, y: 35, w: 20, h: 10 });
  });

  test('intersects returns true on overlap', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 5, y: 5, w: 10, h: 10 };
    expect(intersects(a, b)).toBe(true);
  });

  test('intersects returns false when not overlapping', () => {
    const a = { x: 0, y: 0, w: 5, h: 5 };
    const b = { x: 10, y: 10, w: 5, h: 5 };
    expect(intersects(a, b)).toBe(false);
  });

  test('outsideContainer detects overflow', () => {
    const r = { x: 90, y: 90, w: 20, h: 20 };
    expect(outsideContainer(r, 100, 100)).toBe(true);
  });

  test('outsideContainer detects inside', () => {
    const r = { x: 10, y: 10, w: 20, h: 20 };
    expect(outsideContainer(r, 100, 100)).toBe(false);
  });

  test('circRadiusOfRect computes radius', () => {
    expect(circRadiusOfRect(3, 4)).toBeCloseTo(2.5);
  });

  test('inflateWH adds gap', () => {
    expect(inflateWH(10, 10, 5)).toEqual({ w: 15, h: 15 });
  });

  test('inflateWH clamps negative gap to 0', () => {
    expect(inflateWH(10, 10, -5)).toEqual({ w: 10, h: 10 });
  });

  test('supportOnDir computes projected support length', () => {
    expect(supportOnDir(4, 3, 1, 0)).toBeCloseTo(2);
    expect(supportOnDir(4, 3, 0, 1)).toBeCloseTo(1.5);
    expect(supportOnDir(4, 3, 1, 1)).toBeCloseTo(3.5);
  });

  test('arrangeBalanced alternates between large and small', () => {
    const items = [1, 2, 3, 4, 5];
    const weights = (x: number) => x;
    const result = arrangeBalanced(items, weights);
    expect(result).toEqual([5, 1, 4, 2, 3]);
  });

  test('inflateTL expands rect in all directions', () => {
    const rect = { x: 10, y: 10, w: 20, h: 20 };
    expect(inflateTL(rect, 5)).toEqual({ x: 5, y: 5, w: 30, h: 30 });
  });

  test('rectTLContains correctly checks containment', () => {
    const rect = { x: 0, y: 0, w: 10, h: 10 };
    expect(rectTLContains(rect, 5, 5)).toBe(true);
    expect(rectTLContains(rect, 15, 5)).toBe(false);
  });

  test('distPointToSegment computes correct distance', () => {
    expect(distPointToSegment(5, 5, 0, 0, 10, 0)).toBeCloseTo(5);
  });

  test('segIntersects detects intersection', () => {
    expect(segIntersects(0, 0, 10, 10, 0, 10, 10, 0)).toBe(true);
  });

  test('segIntersects detects no intersection', () => {
    expect(segIntersects(0, 0, 5, 0, 10, 10, 15, 10)).toBe(false);
  });

  test('segIntersects handles colinear and overlapping (o1 === 0)', () => {
    expect(segIntersects(0, 0, 10, 0, 5, 0, 5, 0)).toBe(true);
  });

  test('segIntersects handles colinear and overlapping (o2 === 0)', () => {
    expect(segIntersects(0, 0, 10, 0, 10, 0, 10, 0)).toBe(true);
  });

  test('segIntersects handles colinear and overlapping (o3 === 0)', () => {
    expect(segIntersects(5, 5, 15, 5, 10, 5, 10, 5)).toBe(true);
  });

  test('segIntersects handles colinear and overlapping (o4 === 0)', () => {
    expect(segIntersects(5, 5, 15, 5, 5, 5, 5, 5)).toBe(true);
  });

  test('minDistanceSegmentToRect returns 0 if inside or intersects', () => {
    const r = { x: 0, y: 0, w: 10, h: 10 };
    expect(minDistanceSegmentToRect(1, 1, 5, 5, r)).toBe(0);
    expect(minDistanceSegmentToRect(-5, 5, 15, 5, r)).toBe(0);
  });

  test('minDistanceSegmentToRect returns distance if no intersection', () => {
    const r = { x: 0, y: 0, w: 2, h: 2 };
    const dist = minDistanceSegmentToRect(5, 5, 6, 6, r);
    expect(dist).toBeGreaterThan(0);
  });
});
