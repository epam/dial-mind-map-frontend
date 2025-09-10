import { renderHook } from '@testing-library/react';

import { Platform } from '@/types/common';

import { usePlatform } from '../usePlatform';

describe('usePlatform hook', () => {
  const originalUAData = navigator.userAgentData;
  const originalUA = navigator.userAgent;

  afterEach(() => {
    // Restore originals
    Object.defineProperty(navigator, 'userAgentData', { value: originalUAData, writable: true });
    Object.defineProperty(navigator, 'userAgent', { value: originalUA });
  });

  const setUserAgentData = (platform: string | undefined) => {
    Object.defineProperty(navigator, 'userAgentData', {
      value: platform != null ? { platform } : undefined,
      writable: true,
    });
  };

  const setUserAgent = (ua: string) => {
    Object.defineProperty(navigator, 'userAgent', {
      value: ua,
      writable: true,
    });
  };

  it('detects mac via userAgentData', () => {
    setUserAgentData('MacIntel');
    setUserAgent('Windows');
    const { result } = renderHook(() => usePlatform());
    expect(result.current).toBe(Platform.MAC);
  });

  it('detects windows via userAgentData', () => {
    setUserAgentData('Windows');
    setUserAgent('');
    const { result } = renderHook(() => usePlatform());
    expect(result.current).toBe(Platform.WINDOWS);
  });

  it('falls back to userAgent when userAgentData missing', () => {
    setUserAgentData(undefined);
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
    const { result } = renderHook(() => usePlatform());
    expect(result.current).toBe(Platform.MAC);
  });

  it('returns OTHER for unknown platform', () => {
    setUserAgentData(undefined);
    setUserAgent('Some Random Agent');
    const { result } = renderHook(() => usePlatform());
    expect(result.current).toBe(Platform.OTHER);
  });

  it('falls back to userAgent when userAgentData missing (windows)', () => {
    setUserAgentData(undefined);
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    const { result } = renderHook(() => usePlatform());
    expect(result.current).toBe(Platform.WINDOWS);
  });
});
