import { useEffect, useRef, useState } from 'react';

import { isWebFontLoaded } from '@/utils/app/fonts';

interface UseFontReadyOptions {
  intervalMs?: number;
  timeoutSeconds?: number;
}

type FontStatus = 'loading' | 'ready' | 'timeout';

export const useWebFontReady = (
  fontFamily: string,
  { intervalMs = 100, timeoutSeconds = 10 }: UseFontReadyOptions = {},
): { isReady: boolean; status: FontStatus } => {
  const [status, setStatus] = useState<FontStatus>('loading');
  const [activeFont, setActiveFont] = useState<string>(fontFamily);

  const intervalRef = useRef<number>(undefined);
  const timeoutRef = useRef<number>(undefined);

  useEffect(() => {
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);

    setActiveFont(fontFamily);
    setStatus('loading');

    if (typeof document === 'undefined' || !document.fonts) {
      setStatus('timeout');
      return;
    }

    const checkFont = () => {
      if (isWebFontLoaded(fontFamily)) {
        setStatus('ready');
        clearInterval(intervalRef.current);
        clearTimeout(timeoutRef.current);
      }
    };

    checkFont();

    intervalRef.current = window.setInterval(checkFont, intervalMs);

    timeoutRef.current = window.setTimeout(() => {
      setStatus(current => (current === 'ready' ? 'ready' : 'timeout'));
      clearInterval(intervalRef.current);
    }, timeoutSeconds * 1000);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [fontFamily, intervalMs, timeoutSeconds]);

  return {
    isReady: status === 'ready' && activeFont === fontFamily,
    status: activeFont !== fontFamily ? 'loading' : status,
  };
};
