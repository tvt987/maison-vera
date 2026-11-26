import React, { useEffect, useRef, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const [label, setLabel] = useState<string>('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isFinePointer =
      window.matchMedia &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReduced =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isFinePointer || prefersReduced) return;

    const pos = { x: -100, y: -100, tx: -100, ty: -100 };
    let rafId = 0;

    const onMouseMove = (e: MouseEvent) => {
      pos.tx = e.clientX;
      pos.ty = e.clientY;
      if (!visible) setVisible(true);

      const target = e.target as HTMLElement | null;
      const cursorZone = target?.closest('[data-cursor]') as HTMLElement | null;
      setLabel(cursorZone?.getAttribute('data-cursor') ?? '');
    };

    const onMouseLeave = () => {
      setVisible(false);
    };

    const onScroll = () => {
      setLabel('');
    };

    const tick = () => {
      pos.x += (pos.tx - pos.x) * 0.2;
      pos.y += (pos.ty - pos.y) * 0.2;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.cancelAnimationFrame(rafId);
    };
  }, [visible]);

  if (!visible || !label) return null;

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[120] hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-[var(--ink)] px-3.5 py-1.5 font-mono-tech text-[10px] tracking-[0.18em] text-[var(--surface)] shadow-lg lg:flex"
    >
      {label}
    </div>
  );
};
