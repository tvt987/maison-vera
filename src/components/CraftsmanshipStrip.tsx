import React from 'react';
import { useStore } from '../context/StoreContext';
import { t } from '../data/i18n';

const STAGES = [
  {
    step: '01',
    coords: '35.9567° N · SABAE',
    tolerance: '±0.02MM CNC',
    title: {
      en: 'Sabae Titanium Milling',
      vi: 'Phay Titan CNC Sabae',
    },
    desc: {
      en: 'Each VÉRA-01 chassis is sculpted from solid 4mm Japanese Grade-5 beta-titanium billets over 14 precision machining passes, then hand-brushed along a single grain.',
      vi: 'Mỗi khung kính VÉRA-01 được phay nguyên khối từ phôi beta-titanium Nhật cấp 5 dày 4mm qua 14 bước CNC chính xác, rồi đánh xước thủ công theo một thớ tuyến tính.',
    },
    motif: 'titanium',
  },
  {
    step: '02',
    coords: '43.7696° N · FLORENCE',
    tolerance: 'SADDLE STITCH',
    title: {
      en: 'Florence Bridle & Calfskin',
      vi: 'Da Thuộc Thảo Mộc Florence',
    },
    desc: {
      en: 'Full-grain French box calfskin and Tuscan vegetable-tanned bridle hides are skived by hand, wax-linen saddle-stitched, and edge-painted across seven drying coats.',
      vi: 'Da bê Pháp nguyên tấm và da thuộc thảo mộc Tuscany được lạng thủ công, khâu yên ngựa bằng chỉ lanh sáp ong và sơn cạnh qua bảy lớp hoàn thiện.',
    },
    motif: 'leather',
  },
  {
    step: '03',
    coords: '43.6584° N · GRASSE',
    tolerance: '12-WK MACERATION',
    title: {
      en: 'Grasse Cold Extraction',
      vi: 'Chiết Xuất Lạnh Grasse',
    },
    desc: {
      en: 'Botanical absolutes of Hinoki cypress, green fig leaf, and mineral vetiver are compounded at 32% Extrait concentration and rested in chilled glass amphorae.',
      vi: 'Tinh dầu nguyên chất gỗ bách Hinoki, lá sung xanh và cỏ hương bài được pha chế ở nồng độ 32% Extrait và ủ lạnh 12 tuần trong bình thủy tinh.',
    },
    motif: 'fragrance',
  },
  {
    step: '04',
    coords: '48.8566° N · PARIS',
    tolerance: '28-PT AUDIT',
    title: {
      en: 'Paris Atelier Inspection',
      vi: 'Kiểm Định Atelier Paris',
    },
    desc: {
      en: 'Every numbered specimen passes a 28-point optical, seam, and weight audit in Le Marais before custom foil monogramming, archival numbering, and DHL Express sealing.',
      vi: 'Mỗi tác phẩm đánh số đều trải qua quy trình kiểm định 28 điểm về quang học, đường may và trọng lượng tại Le Marais trước khi ép kim khắc tên và niêm phong DHL.',
    },
    motif: 'paris',
  },
] as const;

export const CraftsmanshipStrip: React.FC = () => {
  const { locale } = useStore();
  const copy = t(locale);

  return (
    <section
      id="craft"
      className="reveal-section border-b border-[var(--hairline)] bg-[var(--surface)] py-16 sm:py-24"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-[var(--hairline)] pb-6 md:flex-row md:items-end">
          <div>
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
              {copy.craftKicker}
            </p>
            <h2 className="mt-2 font-serif-editorial text-4xl font-normal tracking-[-0.015em] text-[var(--ink)] sm:text-5xl">
              {copy.craftHeading}
            </h2>
          </div>
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
            SABAE → FLORENCE → GRASSE → PARIS
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage) => (
            <article
              key={stage.step}
              className="craft-card group flex flex-col justify-between border border-[var(--hairline)] bg-[var(--bg)] p-6 transition-colors duration-300 hover:border-[var(--hairline-strong)]"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
                  <span className="font-mono-tech text-xs text-[var(--accent)]">
                    {stage.step}
                  </span>
                  <span className="font-mono-tech text-[9.5px] tracking-[0.16em] text-[var(--ink-muted)]">
                    {stage.tolerance}
                  </span>
                </div>

                {/* Bespoke Architectural Technical SVG Medallion */}
                <div className="my-5 flex h-24 items-center justify-center border border-[var(--hairline)] bg-[var(--surface)]">
                  <svg
                    viewBox="0 0 120 72"
                    className="h-16 w-28 text-[var(--ink)] transition-transform duration-500 group-hover:scale-105"
                    aria-hidden="true"
                  >
                    {stage.motif === 'titanium' && (
                      <g fill="none" stroke="currentColor" strokeWidth="1.2">
                        <polygon points="18,24 30,14 52,14 58,24 54,48 42,58 24,58 16,44" />
                        <polygon points="62,24 68,14 90,14 102,24 104,44 96,58 78,58 66,48" />
                        <line x1="12" y1="14" x2="108" y2="14" stroke="var(--accent)" strokeWidth="1.5" />
                        <line x1="56" y1="30" x2="64" y2="30" />
                      </g>
                    )}
                    {stage.motif === 'leather' && (
                      <g fill="none" stroke="currentColor" strokeWidth="1.2">
                        <polygon points="24,18 96,18 88,58 32,58" />
                        <line x1="28" y1="30" x2="92" y2="30" stroke="var(--accent)" strokeDasharray="3 3" />
                        <path d="M44 18 V10 Q60 4 76 10 V18" />
                      </g>
                    )}
                    {stage.motif === 'fragrance' && (
                      <g fill="none" stroke="currentColor" strokeWidth="1.2">
                        <rect x="42" y="24" width="36" height="36" rx="2" />
                        <rect x="52" y="10" width="16" height="10" stroke="var(--accent)" />
                        <line x1="60" y1="20" x2="60" y2="24" />
                        <circle cx="60" cy="42" r="9" strokeOpacity="0.45" />
                      </g>
                    )}
                    {stage.motif === 'paris' && (
                      <g fill="none" stroke="currentColor" strokeWidth="1.2">
                        <circle cx="60" cy="36" r="24" />
                        <circle cx="60" cy="36" r="15" stroke="var(--accent)" strokeDasharray="2 3" />
                        <line x1="60" y1="6" x2="60" y2="66" strokeOpacity="0.35" />
                        <line x1="28" y1="36" x2="92" y2="36" strokeOpacity="0.35" />
                        <circle cx="60" cy="36" r="2.5" fill="var(--accent)" stroke="none" />
                      </g>
                    )}
                  </svg>
                </div>

                <h3 className="font-serif-editorial text-2xl text-[var(--ink)]">
                  {stage.title[locale]}
                </h3>
                <p className="mt-2.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                  {stage.desc[locale]}
                </p>
              </div>

              <p className="mt-5 border-t border-[var(--hairline)] pt-3 font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                {stage.coords}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
