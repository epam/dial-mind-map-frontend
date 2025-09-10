import { useEffect, useState } from 'react';

interface LoadingTextProps {
  text: string;
  intervalMs?: number;
}

export function LoadingText({ text, intervalMs = 300 }: LoadingTextProps) {
  const [dots, setDots] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setDots(prev => (prev.length < 3 ? prev + '.' : ''));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return (
    <span className="italic text-secondary">
      {text}
      <span aria-hidden="true">{dots}</span>
    </span>
  );
}
