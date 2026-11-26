import React, { useState } from 'react';
import { ArrowDownRight, Plus, RotateCcw } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { HERO_FRAME_FINISHES, HERO_LENS_TINTS, PRODUCT_BY_ID } from '../data/catalog';
import { t } from '../data/i18n';
import { formatMoney } from '../engines/currency';
import { Eyewear3DCanvas } from './Eyewear3DCanvas';

export const HeroShowcase: React.FC = () => {
  const {
    locale,
    currency,
    theme,
    heroConfig,
    setHeroConfig,
    addHeroEditionToBag,
    openQuickView,
  } = useStore();

  const [resetSignal, setResetSignal] = useState(0);
  const copy = t(locale);
  const heroProduct = PRODUCT_BY_ID['mv-eye-01'];

  const activeFinish =
    HERO_FRAME_FINISHES.find((f) => f.id === heroConfig.frameFinishId) ??
    HERO_FRAME_FINISHES[0];
  const activeLens =
    HERO_LENS_TINTS.find((l) => l.id === heroConfig.lensTintId) ?? HERO_LENS_TINTS[0];

  return (
    <section
      id="top"
      className="relative border-b border-[var(--hairline)] bg-[var(--bg)]"
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-12">
        {/* Left Editorial Column */}
        <div className="flex flex-col justify-between border-b border-[var(--hairline)] px-6 py-8 sm:px-10 lg:col-span-5 lg:border-b-0 lg:border-r lg:py-10">
          <div>
            <div className="mb-5 flex items-center justify-between border-b border-[var(--hairline)] pb-3.5">
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
                {copy.heroEditionLabel}
              </span>
              <span className="font-mono-tech text-[10px] tracking-[0.18em] text-[var(--ink-muted)]">
                {heroProduct.sku}
              </span>
            </div>

            <h1 className="font-serif-editorial text-5xl font-normal leading-[0.97] tracking-[-0.02em] text-[var(--ink)] sm:text-6xl xl:text-[64px]">
              {copy.heroTitleLine1}
              <br />
              <em className="font-normal italic text-[var(--accent)]">
                {copy.heroTitleLine2}
              </em>
            </h1>

            <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--ink-muted)]">
              {copy.heroLead}
            </p>
          </div>

          {/* Interactive Finish & Lens Configurator */}
          <div className="mt-7 space-y-5 border-t border-[var(--hairline)] pt-5">
            {/* Chassis Finish */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                  {copy.heroFrameFinish}
                </span>
                <span className="font-mono-tech text-[11px] text-[var(--ink)]">
                  {activeFinish.label[locale]}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {HERO_FRAME_FINISHES.map((finish) => {
                  const selected = heroConfig.frameFinishId === finish.id;
                  return (
                    <button
                      key={finish.id}
                      type="button"
                      onClick={() =>
                        setHeroConfig((prev) => ({
                          ...prev,
                          frameFinishId: finish.id,
                        }))
                      }
                      className={`flex items-center gap-2 border px-2.5 py-2 text-left text-[11px] transition-all ${
                        selected
                          ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                          : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--hairline-strong)]'
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/20"
                        style={{ backgroundColor: finish.metalHex }}
                      />
                      <span className="truncate">{finish.label[locale]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optical Lens Tint */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                  {copy.heroLensTint}
                </span>
                <span className="font-mono-tech text-[11px] text-[var(--ink)]">
                  {activeLens.label[locale]}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {HERO_LENS_TINTS.map((lens) => {
                  const selected = heroConfig.lensTintId === lens.id;
                  return (
                    <button
                      key={lens.id}
                      type="button"
                      onClick={() =>
                        setHeroConfig((prev) => ({ ...prev, lensTintId: lens.id }))
                      }
                      className={`flex items-center gap-2 border px-3 py-2 text-left text-[11px] transition-all ${
                        selected
                          ? 'border-[var(--accent)] bg-[var(--surface)] text-[var(--ink)] ring-1 ring-[var(--accent)]'
                          : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-muted)] hover:border-[var(--hairline-strong)] hover:text-[var(--ink)]'
                      }`}
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border border-black/20"
                        style={{ backgroundColor: lens.hex }}
                      />
                      <span>{lens.label[locale]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pricing + Primary 1-Click Add Hero CTA */}
            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={addHeroEditionToBag}
                data-testid="hero-add-to-bag"
                data-cursor="QUICK ADD"
                className="inline-flex w-full items-center justify-between gap-3 border border-[var(--ink)] bg-[var(--ink)] px-5 py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--surface)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
              >
                <span className="inline-flex items-center gap-2">
                  <Plus size={14} strokeWidth={1.75} />
                  {copy.heroAddEdition}
                </span>
                <span className="font-mono-tech text-xs">
                  {formatMoney(heroProduct.priceUsd, currency)}
                </span>
              </button>

              <a
                href="#collection"
                data-cursor="EXPLORE"
                className="inline-flex w-full items-center justify-between border border-[var(--hairline-strong)] bg-[var(--surface)] px-5 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--ink)] transition-colors hover:border-[var(--ink)]"
              >
                <span>{copy.heroExploreCollection}</span>
                <ArrowDownRight size={14} strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>

        {/* Right Interactive 3D Studio Stage */}
        <div className="archival-grid relative flex min-h-[420px] flex-col justify-between bg-[var(--studio-bg)] sm:min-h-[520px] lg:col-span-7 lg:min-h-[680px]">
          {/* Top Stage Telemetry Bar */}
          <div className="pointer-events-none relative z-10 flex items-center justify-between px-6 pt-6 sm:px-8">
            <div className="flex flex-wrap items-center gap-2 font-mono-tech text-[10px] tracking-[0.18em] text-[var(--ink-muted)]">
              <span className="border border-[var(--hairline-strong)] bg-[var(--surface)]/80 px-2.5 py-1 backdrop-blur-sm">
                {copy.heroSpecWeight}
              </span>
              <span className="border border-[var(--hairline-strong)] bg-[var(--surface)]/80 px-2.5 py-1 backdrop-blur-sm">
                {copy.heroSpecOrigin}
              </span>
              <span className="hidden border border-[var(--hairline-strong)] bg-[var(--surface)]/80 px-2.5 py-1 backdrop-blur-sm sm:inline">
                {copy.heroSpecOptics}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setResetSignal((n) => n + 1)}
              className="pointer-events-auto inline-flex items-center gap-1.5 border border-[var(--hairline-strong)] bg-[var(--surface)]/90 px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink)] backdrop-blur-sm transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <RotateCcw size={12} strokeWidth={1.5} />
              {copy.heroResetView}
            </button>
          </div>

          {/* 3D Canvas Viewport */}
          <div className="relative flex-1">
            <Eyewear3DCanvas
              config={heroConfig}
              theme={theme}
              resetSignal={resetSignal}
            />
          </div>

          {/* Bottom Stage Specimen Stamp */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline)] bg-[var(--surface)]/75 px-6 py-3.5 backdrop-blur-sm sm:px-8">
            <span className="font-mono-tech text-[10px] tracking-[0.2em] text-[var(--ink-muted)]">
              {copy.heroDragHint}
            </span>
            <button
              type="button"
              onClick={() => openQuickView('mv-eye-01')}
              className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink)] underline decoration-[var(--accent)] underline-offset-4 transition-colors hover:text-[var(--accent)]"
            >
              {heroProduct.name[locale]} · {copy.cardQuickView}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
