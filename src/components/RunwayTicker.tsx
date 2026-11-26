import React from 'react';
import { useStore } from '../context/StoreContext';

const ITEMS_EN = [
  'SABAE GRADE-5 TITANIUM · 18.4G',
  'BIELLA 340 GSM BONDED GABARDINE',
  'UBRIQUE FRENCH BOX-CALF SADDLE STITCH',
  'GRASSE 32% EXTRAIT DE PARFUM',
  'CURATED 3-PIECE LOOKS · -10% ATELIER BUNDLE',
  'COMPLIMENTARY DHL EXPRESS ABOVE $350',
];

const ITEMS_VI = [
  'TITAN NHẬT CẤP 5 SABAE · 18.4G',
  'GABARDINE ÉP LỚP BIELLA 340 GSM',
  'DA BÊ PHÁP KHÂU YÊN NGỰA UBRIQUE',
  'TINH DẦU NƯỚC HOA GRASSE 32% EXTRAIT',
  'TRỌN BỘ 3 MÓN LOOKBOOK · ƯU ĐÃI TỰ ĐỘNG -10%',
  'MIỄN PHÍ CHUYỂN PHÁT NHANH DHL TỪ $350',
];

export const RunwayTicker: React.FC = () => {
  const { locale } = useStore();
  const list = locale === 'en' ? ITEMS_EN : ITEMS_VI;
  const doubled = [...list, ...list];

  return (
    <div className="overflow-hidden border-b border-[var(--hairline)] bg-[var(--surface)] py-3.5">
      <div className="animate-runway-marquee items-center">
        {doubled.map((entry, idx) => (
          <div
            key={`${entry}-${idx}`}
            className="flex shrink-0 items-center gap-8 px-4 font-mono-tech text-[11px] uppercase tracking-[0.22em] text-[var(--ink-muted)]"
          >
            <span>{entry}</span>
            <span className="h-1 w-1 rotate-45 bg-[var(--accent)]" aria-hidden="true" />
          </div>
        ))}
      </div>
    </div>
  );
};
