import React from 'react';
import { Compass, ShieldCheck, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { t } from '../data/i18n';

export const AtelierManifesto: React.FC = () => {
  const { locale } = useStore();
  const copy = t(locale);

  const pillars = [
    {
      icon: Compass,
      code: '01 · SABAE',
      title:
        locale === 'en'
          ? 'Zero-Solder Grade-5 Titanium'
          : 'Titan Cấp 5 Không Mối Hàn',
      desc:
        locale === 'en'
          ? '5-axis CNC milling from solid 4mm beta-titanium blocks for an 18.4g chassis weight.'
          : 'Phay CNC 5 trục từ phôi beta-titanium 4mm nguyên khối, trọng lượng siêu nhẹ 18.4g.',
    },
    {
      icon: ShieldCheck,
      code: '02 · BIELLA & UBRIQUE',
      title:
        locale === 'en'
          ? 'Numbered Archival Provenance'
          : 'Xuất Xứ Xưởng Đánh Số Lưu Trữ',
      desc:
        locale === 'en'
          ? 'Traceable Milanese gabardine and French Tanneries du Puy box calfskin finished by hand.'
          : 'Vải gabardine Milan và da bê Pháp Tanneries du Puy khâu yên ngựa hoàn toàn thủ công.',
    },
    {
      icon: Truck,
      code: '03 · CONCIERGE DISPATCH',
      title:
        locale === 'en'
          ? 'Climate-Neutral DHL Express'
          : 'Chuyển Phát Nhanh DHL Express',
      desc:
        locale === 'en'
          ? 'Complimentary tracked air courier from $350 with wax-sealed archival presentation.'
          : 'Miễn phí chuyển phát nhanh quốc tế từ $350 kèm hộp đóng dấu sáp thủ công.',
    },
  ];

  return (
    <footer id="atelier" className="bg-[var(--bg)]">
      {/* Craftsmanship Manifesto */}
      <div className="reveal-section border-b border-[var(--hairline)] py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="font-mono-tech text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
                {copy.atelierKicker}
              </p>
              <h2 className="mt-3 font-serif-editorial text-4xl font-normal leading-tight text-[var(--ink)] sm:text-5xl">
                {copy.atelierTitle}
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-[var(--ink-muted)]">
                {copy.atelierBody}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.code}
                    className="flex flex-col justify-between border border-[var(--hairline)] bg-[var(--surface)] p-6"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono-tech text-[10px] tracking-[0.18em] text-[var(--accent)]">
                          {pillar.code}
                        </span>
                        <Icon size={16} strokeWidth={1.5} className="text-[var(--ink-muted)]" />
                      </div>
                      <h3 className="mt-6 font-serif-editorial text-2xl text-[var(--ink)]">
                        {pillar.title}
                      </h3>
                      <p className="mt-2.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Archival Footer Bar */}
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-4 px-4 py-8 text-xs text-[var(--ink-muted)] sm:flex-row sm:items-center sm:px-8">
        <div className="flex items-center gap-4">
          <span className="font-serif-editorial text-xl tracking-[0.24em] text-[var(--ink)]">
            MAISON VÉRA
          </span>
          <span className="hidden font-mono-tech text-[10px] uppercase tracking-[0.18em] sm:inline">
            48.8566° N, 2.3522° E · PARIS
          </span>
        </div>
        <p className="font-mono-tech text-[10px] tracking-[0.14em]">
          {copy.footerRights}
        </p>
      </div>
    </footer>
  );
};
