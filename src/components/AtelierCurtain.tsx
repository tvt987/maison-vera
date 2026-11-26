import React, { useEffect, useState } from 'react';

/**
 * Ultra-fast 0.7s non-blocking Atelier Curtain Entrance (once per session, respects reduced motion).
 */
export const AtelierCurtain: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      const reduced =
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) return false;
      if (window.sessionStorage.getItem('maison_vera_curtain_seen') === '1') {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  });

  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    try {
      window.sessionStorage.setItem('maison_vera_curtain_seen', '1');
    } catch {
      // ignore
    }
    const tExit = window.setTimeout(() => setExiting(true), 420);
    const tUnmount = window.setTimeout(() => setVisible(false), 740);
    return () => {
      window.clearTimeout(tExit);
      window.clearTimeout(tUnmount);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[150] flex flex-col items-center justify-center bg-[var(--ink)] text-[var(--surface)] transition-transform duration-300 ease-out ${
        exiting ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <span className="font-mono-tech text-[10px] uppercase tracking-[0.34em] text-[var(--accent)]">
        PARIS · SABAE · AW26
      </span>
      <span className="mt-2 font-serif-editorial text-4xl tracking-[0.32em] sm:text-5xl">
        MAISON VÉRA
      </span>
    </div>
  );
};
