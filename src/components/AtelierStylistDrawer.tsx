import React, { useEffect, useMemo, useState } from 'react';
import { Layers, Sparkles, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PRODUCT_BY_ID } from '../data/catalog';
import { t } from '../data/i18n';
import { atelierAudio } from '../engines/atelierAudio';
import { formatMoney } from '../engines/currency';
import { curateAtelierWardrobe } from '../engines/stylistEngine';
import type {
  ProductSize,
  StylistBudgetTier,
  StylistOccasion,
  StylistPalette,
} from '../types/commerce';
import { ProductMedia } from './ProductMedia';

export const AtelierStylistDrawer: React.FC = () => {
  const {
    locale,
    currency,
    stylistOpen,
    setStylistOpen,
    addStylistWardrobeToBag,
  } = useStore();

  const [occasion, setOccasion] = useState<StylistOccasion>('gallery-opening');
  const [palette, setPalette] = useState<StylistPalette>('alabaster-sand');
  const [budget, setBudget] = useState<StylistBudgetTier>('signature');
  const [sizeOverrides, setSizeOverrides] = useState<Record<string, ProductSize>>({});
  const [streamChars, setStreamChars] = useState<number>(999);

  const curation = useMemo(
    () => curateAtelierWardrobe(PRODUCT_BY_ID, occasion, palette, budget),
    [occasion, palette, budget]
  );

  // Subtle deterministic streaming reveal when curation parameters change
  useEffect(() => {
    if (!stylistOpen) return;
    const fullLen = curation.editorialRationale[locale].length;
    setStreamChars(Math.min(28, fullLen));
    const timer = window.setInterval(() => {
      setStreamChars((prev) => {
        if (prev >= fullLen) {
          window.clearInterval(timer);
          return fullLen;
        }
        return prev + 16;
      });
    }, 24);
    return () => window.clearInterval(timer);
  }, [curation, locale, stylistOpen]);

  if (!stylistOpen) return null;

  const copy = t(locale);
  const fullRationale = curation.editorialRationale[locale];
  const visibleRationale = fullRationale.slice(0, streamChars);

  const occasions: { id: StylistOccasion; label: string }[] = [
    { id: 'gallery-opening', label: copy.occGallery },
    { id: 'tokyo-architecture', label: copy.occTokyo },
    { id: 'minimalist-weekend', label: copy.occWeekend },
    { id: 'nocturne-salon', label: copy.occNocturne },
  ];

  const palettes: { id: StylistPalette; label: string; swatches: [string, string] }[] = [
    { id: 'alabaster-sand', label: copy.palAlabaster, swatches: ['#D8CEBE', '#C4C2BC'] },
    { id: 'obsidian-monochrome', label: copy.palObsidian, swatches: ['#1B1C20', '#5E6068'] },
    { id: 'terracotta-warmth', label: copy.palTerracotta, swatches: ['#9E462B', '#D1AE6F'] },
  ];

  const budgets: { id: StylistBudgetTier; label: string }[] = [
    { id: 'essential', label: copy.budEssential },
    { id: 'signature', label: copy.budSignature },
    { id: 'collector', label: copy.budCollector },
  ];

  return (
    <div
      className="fixed inset-0 z-[95] flex justify-end bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={copy.stylistTitle}
      onClick={() => setStylistOpen(false)}
    >
      <div
        data-testid="atelier-stylist-drawer"
        onClick={(e) => e.stopPropagation()}
        className="animate-drawer-right flex h-full w-full max-w-[540px] flex-col border-l border-[var(--hairline-strong)] bg-[var(--surface)] shadow-[var(--shadow-drawer)]"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--hairline)] px-6 py-5">
          <div>
            <p className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
              <Sparkles size={11} strokeWidth={1.6} />
              {copy.stylistKicker}
            </p>
            <h2 className="mt-1 font-serif-editorial text-2xl text-[var(--ink)] sm:text-3xl">
              {copy.stylistTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setStylistOpen(false)}
            aria-label="Close stylist drawer"
            className="flex h-8 w-8 items-center justify-center border border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--ink)]"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable Concierge Controls + Curated Trio */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* 01 Occasion */}
          <div>
            <p className="mb-2 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              {copy.stylistOccasion}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {occasions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`stylist-occ-${item.id}`}
                  onClick={() => {
                    atelierAudio.playDetent();
                    setOccasion(item.id);
                  }}
                  className={`border px-3 py-2 text-left text-xs transition-colors ${
                    occasion === item.id
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                      : 'border-[var(--hairline)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--hairline-strong)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 02 Palette Tone */}
          <div>
            <p className="mb-2 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              {copy.stylistPalette}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {palettes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`stylist-pal-${item.id}`}
                  onClick={() => {
                    atelierAudio.playDetent();
                    setPalette(item.id);
                  }}
                  className={`flex items-center gap-2 border px-3 py-2 text-left text-[11px] transition-colors ${
                    palette === item.id
                      ? 'border-[var(--accent)] bg-[var(--bg)] text-[var(--ink)] ring-1 ring-[var(--accent)]'
                      : 'border-[var(--hairline)] bg-[var(--bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  <span className="flex shrink-0 -space-x-1">
                    <span
                      className="h-3 w-3 rounded-full border border-black/20"
                      style={{ backgroundColor: item.swatches[0] }}
                    />
                    <span
                      className="h-3 w-3 rounded-full border border-black/20"
                      style={{ backgroundColor: item.swatches[1] }}
                    />
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 03 Budget Tier */}
          <div>
            <p className="mb-2 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              {copy.stylistBudget}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {budgets.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`stylist-bud-${item.id}`}
                  onClick={() => {
                    atelierAudio.playDetent();
                    setBudget(item.id);
                  }}
                  className={`border px-2.5 py-2 text-center text-[11px] transition-colors ${
                    budget === item.id
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                      : 'border-[var(--hairline)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--hairline-strong)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Curatorial Editorial Rationale Dossier */}
          <div className="border border-[var(--hairline-strong)] bg-[var(--bg)] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono-tech text-[9.5px] uppercase tracking-[0.2em] text-[var(--accent)]">
                {copy.stylistNoteHeading}
              </span>
              <span className="border border-[var(--olive)]/40 bg-[var(--olive)]/10 px-2 py-0.5 font-mono-tech text-[9.5px] text-[var(--olive)]">
                -12% WARDROBE
              </span>
            </div>
            <h3 className="mt-2 font-serif-editorial text-xl text-[var(--ink)]">
              {curation.headline[locale]}
            </h3>
            <p className="mt-1.5 min-h-[42px] text-xs leading-relaxed text-[var(--ink-muted)]">
              {visibleRationale}
            </p>
            <p className="mt-2.5 border-t border-[var(--hairline)] pt-2.5 font-mono-tech text-[10px] leading-relaxed text-[var(--ink)]">
              {curation.fabricPairingNote[locale]}
            </p>
          </div>

          {/* Curated 3-Piece Wardrobe */}
          <div className="space-y-3">
            {curation.pieces.map((piece, idx) => {
              const selectedSize =
                sizeOverrides[piece.product.id] ?? piece.recommendedSize;
              return (
                <div
                  key={piece.product.id}
                  className="flex gap-3.5 border border-[var(--hairline)] bg-[var(--bg)] p-3"
                >
                  <div className="h-24 w-20 shrink-0 overflow-hidden border border-[var(--hairline)] bg-[var(--studio-bg)]">
                    <ProductMedia product={piece.product} colorway={piece.colorway} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-tech text-[9.5px] uppercase tracking-[0.14em] text-[var(--accent)]">
                        0{idx + 1} · {piece.roleLabel[locale]}
                      </span>
                      <span className="font-mono-tech text-xs text-[var(--ink)]">
                        {formatMoney(piece.product.priceUsd, currency)}
                      </span>
                    </div>
                    <h4 className="mt-0.5 truncate font-serif-editorial text-lg text-[var(--ink)]">
                      {piece.product.name[locale]}
                    </h4>
                    <p className="truncate font-mono-tech text-[10px] text-[var(--ink-muted)]">
                      {piece.product.sku} · {piece.colorway.name[locale]}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {piece.product.sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() =>
                            setSizeOverrides((prev) => ({
                              ...prev,
                              [piece.product.id]: size,
                            }))
                          }
                          className={`min-w-[30px] border px-2 py-0.5 font-mono-tech text-[10px] ${
                            selectedSize === size
                              ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                              : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)]'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Totals & 1-Click Add Wardrobe */}
        <div className="border-t border-[var(--hairline)] bg-[var(--bg)] px-6 py-5">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[var(--ink-muted)]">
              <span>{copy.lookbookBundleOriginal}</span>
              <span className="font-mono-tech">
                {formatMoney(curation.retailUsd, currency)}
              </span>
            </div>
            <div className="flex justify-between text-[var(--olive)]">
              <span>{copy.stylistSavingsLabel}</span>
              <span className="font-mono-tech">
                -{formatMoney(curation.savingsUsd, currency)}
              </span>
            </div>
            <div className="flex justify-between border-t border-[var(--hairline)] pt-2 text-sm font-medium text-[var(--ink)]">
              <span>{copy.lookbookBundleFinal}</span>
              <span className="font-mono-tech text-base">
                {formatMoney(curation.finalUsd, currency)}
              </span>
            </div>
          </div>

          <button
            type="button"
            data-testid="stylist-add-wardrobe-btn"
            onClick={() =>
              addStylistWardrobeToBag(
                curation.bundleId,
                curation.pieces.map((p) => ({
                  productId: p.product.id,
                  size: sizeOverrides[p.product.id] ?? p.recommendedSize,
                  colorwayId: p.colorway.id,
                }))
              )
            }
            className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-[var(--ink)] bg-[var(--ink)] px-5 py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--surface)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
          >
            <Layers size={14} strokeWidth={1.5} />
            {copy.stylistAddWardrobe}
          </button>
        </div>
      </div>
    </div>
  );
};
