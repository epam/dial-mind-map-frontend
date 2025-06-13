import { useEffect, useState } from 'react';

export const useWindowSize = (width?: number, height?: number) => {
  const initValue: [number, number] | undefined = width && height ? [width, height] : undefined;
  const [size, setSize] = useState<[number, number] | undefined>(initValue);

  useEffect(() => {
    const resize = () => {
      setSize([globalThis.window.innerWidth, globalThis.window.innerHeight]);
    };
    globalThis.window.addEventListener('resize', resize);
    setSize([globalThis.window.innerWidth, globalThis.window.innerHeight]);

    return () => {
      globalThis.window.removeEventListener('resize', resize);
    };
  }, []);

  return size || [];
};
