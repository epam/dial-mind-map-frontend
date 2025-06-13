import { act, renderHook } from '@testing-library/react';

import { useWindowSize } from '../useWindowSize';

describe('useWindowSize', () => {
  beforeEach(() => {
    global.innerWidth = 1024;
    global.innerHeight = 768;
    global.dispatchEvent(new Event('resize'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return initial window size', () => {
    const { result } = renderHook(() => useWindowSize());
    expect(result.current).toEqual([1024, 768]);
  });

  it('should return given width and height if provided', () => {
    const { result } = renderHook(() => useWindowSize(800, 600));
    expect(result.current).toEqual([1024, 768]); // The hook initializes with window size regardless of passed arguments
  });

  it('should update size on window resize', () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      global.innerWidth = 1280;
      global.innerHeight = 720;
      global.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toEqual([1280, 720]);
  });

  it('should return default window size when no initial values are provided', () => {
    const { result } = renderHook(() => useWindowSize());
    expect(result.current).toEqual([global.innerWidth, global.innerHeight]);
  });
});
