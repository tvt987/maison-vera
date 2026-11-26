import React, { useState } from 'react';
import { ArrowUpRight, Layers, Plus } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PRODUCT_BY_ID } from '../data/catalog';
import { t } from '../data/i18n';
import { LOOKBOOKS } from '../data/lookbooks';
import { formatMoney } from '../engines/currency';
import { LookbookArt } from './LookbookArt';
import { ProductArt } from './ProductArt';

export const EditorialLookbook: React.FC = () => {
  const {
    locale,
    currency,
    openQuickView,
    addToBag,
    setActiveLookbookBundleId,
  } = useStore();

  const [activeLookIdx, setActiveLookIdx] = useState(0);
  const [activePinIndex, setActivePinIndex] = useState<'01' | '02' | '03'>('01');

  const copy = t(locale);
  const look = LOOKBOOKS[activeLookIdx];
  const activeHotspot =
    look.hotspots.find((h) => h.index === activePinIndex) ?? look.hotspots[0];
  const activeProduct = PRODUCT_BY_ID[activeHotspot.productId];

  const bundleRetailUsd = look.hotspots.reduce(
    (sum, h) => sum + (PRODUCT_BY_ID[h.productId]?.priceUsd ?? 0),
    0
  );
  const bundleFinalUsd = Math.round(bundleRetailUsd * (1 - look.bundleDiscountRate));

  return (
    <section
      id="lookbook"
      className="reveal-section border-b border-[var(--hairline)] bg-[var(--bg)] py-16 sm:py-24"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        {/* Section Header + Look Switcher */}
        <div className="mb-10 flex flex-col justify-between gap-6 border-b border-[var(--hairline)] pb-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
              {copy.lookbookKicker}
            </p>
            <h2 className="mt-3 font-serif-editorial text-4xl font-normal tracking-[-0.015em] text-[var(--ink)] sm:text-5xl">
              {copy.lookbookHeading}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
              {copy.lookbookSub}
            </p>
          </div>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lookbook plates">
            {LOOKBOOKS.map((item, idx) => {
              const selected = idx === activeLookIdx;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  data-testid={`lookbook-tab-${item.id}`}
                  onClick={() => {
                    setActiveLookIdx(idx);
                    setActivePinIndex('01');
                  }}
                  className={`border px-4 py-2.5 text-left transition-all ${
                    selected
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                      : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--hairline-strong)]'
                  }`}
                >
                  <span className="block font-mono-tech text-[9px] uppercase tracking-[0.2em] opacity-70">
                    {item.plateCode}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium">
                    {item.title[locale]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Lookbook Plate Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left: Interactive Editorial SVG Plate with Pulsing Numbered Hotspots */}
          <div
            data-cursor="SHOP LOOK"
            className="relative overflow-hidden border border-[var(--hairline)] bg-[var(--studio-bg)] lg:col-span-7"
          >
            <div className="relative aspect-[600/720] w-full max-h-[700px]">
              <LookbookArt artKey={look.artKey} />

              {/* Top Editorial Stamp Overlay */}
              <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-3 border border-black/15 bg-[#FDFBF7]/90 px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[#111111] backdrop-blur-sm">
                <span>{look.plateCode}</span>
                <span className="opacity-40">|</span>
                <span>{look.seasonStamp}</span>
              </div>

              {/* Pulsing Numbered Hotspot Pins (01, 02, 03) */}
              {look.hotspots.map((spot) => {
                const isActive = spot.index === activePinIndex;
                return (
                  <button
                    key={`${look.id}-${spot.index}`}
                    type="button"
                    data-testid={`lookbook-pin-${spot.index}`}
                    onClick={() => setActivePinIndex(spot.index)}
                    style={{
                      left: `${spot.xPercent}%`,
                      top: `${spot.yPercent}%`,
                    }}
                    aria-label={`${spot.index}: ${spot.note[locale]}`}
                    className={`hotspot-pulse absolute -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border font-mono-tech text-[11px] font-medium transition-transform duration-200 hover:scale-110 ${
                      isActive
                        ? 'z-20 scale-110 border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)] shadow-lg'
                        : 'z-10 border-[#111111] bg-[#FDFBF7]/95 text-[#111111]'
                    }`}
                  >
                    {spot.index}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Editorial Plate Dossier + Active Hotspot Detail + Shop Complete Look Bundle CTA */}
          <div className="flex flex-col justify-between border border-[var(--hairline)] bg-[var(--surface)] p-6 sm:p-8 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4">
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                  {look.architectureRef[locale]}
                </span>
                <span className="border border-[var(--olive)]/40 bg-[var(--olive)]/10 px-2 py-0.5 font-mono-tech text-[10px] text-[var(--olive)]">
                  -10% BUNDLE
                </span>
              </div>

              <h3 className="mt-5 font-serif-editorial text-3xl text-[var(--ink)]">
                {look.title[locale]}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[var(--ink-muted)]">
                {look.editorialNote[locale]}
              </p>

              {/* Active Highlighted Specimen Card */}
              {activeProduct && (
                <div className="mt-6 border border-[var(--hairline-strong)] bg-[var(--bg)] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                      {copy.lookbookPinPrompt} · #{activeHotspot.index}
                    </span>
                    <span className="font-mono-tech text-[11px] text-[var(--ink)]">
                      {formatMoney(activeProduct.priceUsd, currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="h-24 w-20 shrink-0 border border-[var(--hairline)] bg-[var(--studio-bg)] p-1">
                      <ProductArt
                        product={activeProduct}
                        colorway={activeProduct.colorways[0]}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono-tech text-[10px] text-[var(--ink-muted)]">
                        {activeProduct.sku}
                      </p>
                      <h4 className="mt-0.5 truncate font-serif-editorial text-xl text-[var(--ink)]">
                        {activeProduct.name[locale]}
                      </h4>
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--ink-muted)]">
                        {activeProduct.materialSpec[locale]}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openQuickView(activeProduct.id)}
                      className="inline-flex items-center justify-center gap-1.5 border border-[var(--hairline-strong)] bg-[var(--surface)] px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-[var(--ink)] transition-colors hover:border-[var(--ink)]"
                    >
                      {copy.lookbookQuickView}
                      <ArrowUpRight size={13} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addToBag({
                          productId: activeProduct.id,
                          size: activeProduct.sizes.includes('M')
                            ? 'M'
                            : activeProduct.sizes[0],
                          colorwayId: activeProduct.colorways[0].id,
                        })
                      }
                      className="inline-flex items-center justify-center gap-1.5 border border-[var(--ink)] bg-[var(--ink)] px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-[var(--surface)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
                    >
                      <Plus size={13} strokeWidth={1.5} />
                      {copy.lookbookAddSingle}
                    </button>
                  </div>
                </div>
              )}

              {/* 3-Piece Plate Index List */}
              <div className="mt-6 space-y-2">
                {look.hotspots.map((spot) => {
                  const prod = PRODUCT_BY_ID[spot.productId];
                  if (!prod) return null;
                  const active = spot.index === activePinIndex;
                  return (
                    <button
                      key={spot.index}
                      type="button"
                      onClick={() => setActivePinIndex(spot.index)}
                      className={`flex w-full items-center justify-between border px-3.5 py-2.5 text-left transition-colors ${
                        active
                          ? 'border-[var(--accent)] bg-[var(--accent)]/8'
                          : 'border-[var(--hairline)] bg-transparent hover:border-[var(--hairline-strong)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`font-mono-tech text-[10px] ${
                            active ? 'text-[var(--accent)]' : 'text-[var(--ink-muted)]'
                          }`}
                        >
                          {spot.index}
                        </span>
                        <span className="truncate text-xs font-medium text-[var(--ink)]">
                          {prod.name[locale]}
                        </span>
                      </div>
                      <span className="ml-3 shrink-0 font-mono-tech text-xs text-[var(--ink-muted)]">
                        {formatMoney(prod.priceUsd, currency)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shop Complete Look (-10% Bundle) CTA */}
            <div className="mt-8 border-t border-[var(--hairline)] pt-6">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  {copy.lookbookBundleFinal}
                </span>
                <div className="flex items-baseline gap-2.5 font-mono-tech">
                  <span className="text-xs text-[var(--ink-muted)] line-through">
                    {formatMoney(bundleRetailUsd, currency)}
                  </span>
                  <span className="text-base font-medium text-[var(--ink)]">
                    {formatMoney(bundleFinalUsd, currency)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                data-testid="shop-complete-look-btn"
                onClick={() => setActiveLookbookBundleId(look.id)}
                className="inline-flex w-full items-center justify-center gap-2.5 border border-[var(--ink)] bg-[var(--ink)] px-5 py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--surface)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
              >
                <Layers size={15} strokeWidth={1.5} />
                {copy.lookbookShopComplete}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
