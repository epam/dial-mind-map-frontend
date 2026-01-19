import { Cluster, Container, Gaps, RootSizes } from '../../types/shared';
import { DebugEvent, EllipticOptions, layoutClustersElliptic } from '../ellipticRingLayout';

function makeCluster(id: string, packW: number, packH: number): Cluster {
  return {
    id,
    packW,
    packH,
    kids: 0,
    innerW: 0,
    innerH: 0,
    outerW: 0,
    outerH: 0,
    area: 0,
    AR: 0,
  };
}

function makeRootSizes(packW: number, packH: number): RootSizes {
  return {
    packW,
    packH,
    innerW: packW,
    innerH: packH,
    outerW: packW,
    outerH: packH,
  };
}

function captureDebugEvents(opts: EllipticOptions = {}): { events: DebugEvent[]; options: EllipticOptions } {
  const events: DebugEvent[] = [];
  const optionsWithDebug = {
    ...opts,
    debug: true,
    onDebug: (e: DebugEvent) => {
      events.push(e);
    },
  };
  return { events, options: optionsWithDebug };
}

describe('layoutClustersElliptic', () => {
  const container: Container = { w: 200, h: 200 };
  const gaps: Gaps = {
    betweenClusters: 5,
    border: 0,
  };

  it('handles zero clusters', () => {
    const root = makeRootSizes(40, 40);
    const { events, options } = captureDebugEvents();
    const result = layoutClustersElliptic(container, root, [], gaps, options);

    expect(Object.keys(result.positions)).toEqual(['root']);
    expect(result.metrics.totalOverlap).toBe(0);
    expect(events.some(e => e.type === 'summary')).toBe(true);
  });

  it('places two clusters with default settings', () => {
    const root = makeRootSizes(20, 20);
    const clusters = [makeCluster('a', 30, 10), makeCluster('b', 30, 10)];
    const { events, options } = captureDebugEvents();
    const result = layoutClustersElliptic(container, root, clusters, gaps, options);

    expect(Object.keys(result.positions)).toEqual(expect.arrayContaining(['root', 'a', 'b']));
    expect(events.some(e => e.type === 'r0')).toBe(true);
    expect(events.some(e => e.type === 'summary')).toBe(true);
  });

  it('uses provided ellipse dimensions', () => {
    const root = makeRootSizes(10, 10);
    const clusters = [makeCluster('a', 20, 20), makeCluster('b', 20, 20)];
    const { events, options } = captureDebugEvents({ ellipse: { rx: 80, ry: 40 } });
    layoutClustersElliptic(container, root, clusters, gaps, options);
    const summary = events.find(e => e.type === 'summary') as any;
    expect(summary.rx).toBeCloseTo(80);
    expect(summary.ry).toBeCloseTo(40);
  });

  it('respects different cluster orderings', () => {
    const root = makeRootSizes(20, 20);
    const clusters = [makeCluster('z', 30, 20), makeCluster('m', 25, 20), makeCluster('a', 30, 25)];

    for (const order of ['balanced', 'area', 'given'] as const) {
      const { options } = captureDebugEvents({ order });
      const result = layoutClustersElliptic(container, root, clusters, gaps, options);
      expect(Object.keys(result.positions)).toEqual(expect.arrayContaining(['root', 'a', 'm', 'z']));
    }
  });

  it('uses shrinkToTouch with custom options', () => {
    const root = makeRootSizes(20, 20);
    const clusters = [makeCluster('a', 70, 70), makeCluster('b', 70, 70)];
    const shrinkToTouch = {
      respectRoot: true,
      respectContainer: true,
      maxIters: 10,
      tol: 1e-5,
      minScale: 0.1,
    };
    const { events, options } = captureDebugEvents({ shrinkToTouch });
    layoutClustersElliptic(container, root, clusters, gaps, options);
    expect(events.some(e => e.type === 'probe')).toBe(true);
  });

  it('applies angleBias in sector mode', () => {
    const root = makeRootSizes(20, 20);
    const clusters = [makeCluster('a', 10, 20), makeCluster('b', 10, 20), makeCluster('c', 10, 20)];
    const angleBias = { mode: 'sector' as const, center: 0, halfWidth: Math.PI / 4, strength: 5 };
    const { events, options } = captureDebugEvents({ angleBias });
    layoutClustersElliptic(container, root, clusters, gaps, options);
    expect(events.some(e => e.type === 'summary')).toBe(true);
  });

  it('applies angleBias in autoMaxSlack mode', () => {
    const root = makeRootSizes(20, 20);
    const clusters = [makeCluster('a', 20, 20), makeCluster('b', 20, 20), makeCluster('c', 20, 20)];
    const angleBias = { mode: 'autoMaxSlack' as const };
    const { events, options } = captureDebugEvents({ angleBias });
    layoutClustersElliptic(container, root, clusters, gaps, options);
    expect(events.some(e => e.type === 'summary')).toBe(true);
  });

  it('diagnoses bottlenecks at final placement', () => {
    const root = makeRootSizes(10, 10);
    const clusters = [makeCluster('a', 50, 50), makeCluster('b', 50, 50)];
    const { events, options } = captureDebugEvents();
    layoutClustersElliptic(container, root, clusters, gaps, options);
    expect(events.some(e => e.type === 'bottlenecks')).toBe(true);
  });
});
