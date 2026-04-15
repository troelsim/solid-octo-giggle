import { useState, useEffect } from 'react';

// Returns true when the viewport is wide enough for the desktop layout (≥640 px).
// Defaults to false (mobile) in JSDOM where matchMedia is unavailable.
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(min-width: 640px)')?.matches
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 640px)');
    if (!mq) return;
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}
