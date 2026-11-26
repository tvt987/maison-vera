import React, { useEffect, useState } from 'react';
import { Layers, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PRODUCT_BY_ID } from '../data/catalog';
import { t } from '../data/i18n';
import { LOOKBOOKS } from '../data/lookbooks';
import { formatMoney } from '../engines/currency';
import type { ProductSize } from '../types/commerce';
import { ProductMedia } from './ProductMedia';

export const LookbookDrawer: React.FC = () => {
  const {
    locale,
    currency,
    activeLookbookBundleId,
    setActiveLookbookBundleId,
    addLookbookBundleToBag,
  } = useStore();

  const look = LOOKBOOKS.find((l) => l.id === activeLookbookBundleId) ?? null;

  const [sizeMap, setSizeMap] = useState<Record<string, ProductSize>>({});
  const [colorMap, setColorMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!look) return;
    const initSizes: Record<string, ProductSize> = {};
    const initColors: Record<string, string> = {};
    for (const h of look.hotspots) {
      const prod = PRODUCT_BY_ID[h.productId];
      if (!prod) continue;
      initSizes[prod.id] = prod.sizes.includes('M') ? 'M' : prod.sizes[0];
      initColors[prod.id] = prod.colorways[0].id;
    }
    setSizeMap(initSizes);
    setColorMap(initColors);
  }, [look]);

  if (!look) return null;

  const copy = t(locale);
  const items = look.hotspots
    .map((h) => PRODUCT_BY_ID[h.productId])
    .filter(Boolean);

  const retailUsd = items.reduce((sum, p) => sum + p.priceUsd, 0);
  const savingsUsd = Math.round(retailUsd * look.bundleDiscountRate * 100) / 100;
  const finalUsd = Math.round((retailUsd - savingsUsd) * 100) / 100;

  return (
    <div
      className="fixed inset-0 z-[90] flex justify-end bg-black/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={copy.lookbookBundleTitle}
      onClick={() => setActiveLookbookBundleId(null)}
    >
      <div
        data-testid="lookbook-bundle-drawer"
        onClick={(e) => e.stopPropagation()}
        className="animate-drawer-right flex h-full w-full max-w-[480px] flex-col border-l border-[var(--hairline-strong)] bg-[var(--surface)] shadow-[var(--shadow-drawer)]"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--hairline)] px-6 py-5">
          <div>
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
              {look.plateCode} · -10% BUNDLE
            </p>
            <h2 className="mt-1 font-serif-editorial text-2xl text-[var(--ink)]">
              {look.title[locale]}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setActiveLookbookBundleId(null)}
            aria-label="Close bundle drawer"
            className="flex h-8 w-8 items-center justify-center border border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--ink)]"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="mb-5 text-xs leading-relaxed text-[var(--ink-muted)]">
            {copy.lookbookBundleSub}
          </p>

          <div className="space-y-4">
            {items.map((prod, idx) => {
              const selectedSize =
                sizeMap[prod.id] ?? (prod.sizes.includes('M') ? 'M' : prod.sizes[0]);
              const selectedColorId = colorMap[prod.id] ?? prod.colorways[0].id;
              const activeColor =
                prod.colorways.find((c) => c.id === selectedColorId) ??
                prod.colorways[0];

              return (
                <div
                  key={prod.id}
                  className="flex gap-4 border border-[var(--hairline)] bg-[var(--bg)] p-3.5"
                >
                  <div className="h-24 w-20 shrink-0 overflow-hidden border border-[var(--hairline)] bg-[var(--studio-bg)]">
                    <ProductMedia product={prod} colorway={activeColor} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-tech text-[10px] text-[var(--accent)]">
                        0{idx + 1} · {prod.sku}
                      </span>
                      <span className="font-mono-tech text-xs text-[var(--ink)]">
                        {formatMoney(prod.priceUsd, currency)}
                      </span>
                    </div>
                    <h3 className="mt-0.5 truncate font-serif-editorial text-lg text-[var(--ink)]">
                      {prod.name[locale]}
                    </h3>

                    {/* Colorway Selector */}
                    <div className="mt-2 flex items-center gap-1.5">
                      {prod.colorways.map((cw) => (
                        <button
                          key={cw.id}
                          type="button"
                          onClick={() =>
                            setColorMap((prev) => ({ ...prev, [prod.id]: cw.id }))
                          }
                          title={cw.name[locale]}
                          className={`h-3.5 w-3.5 rounded-full border ${
                            selectedColorId === cw.id
                              ? 'border-[var(--ink)] ring-1 ring-[var(--ink)] ring-offset-1 ring-offset-[var(--bg)]'
                              : 'border-black/20'
                          }`}
                          style={{ backgroundColor: cw.hex }}
                        />
                      ))}
                      <span className="ml-1 truncate font-mono-tech text-[10px] text-[var(--ink-muted)]">
                        {activeColor.name[locale]}
                      </span>
                    </div>

                    {/* Size Selector */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {prod.sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() =>
                            setSizeMap((prev) => ({ ...prev, [prod.id]: size }))
                          }
                          className={`min-w-[32px] border px-2 py-0.5 font-mono-tech text-[10px] transition-colors ${
                            selectedSize === size
                              ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                              : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--ink)]'
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

        {/* Footer Summary + 1-Click Add All */}
        <div className="border-t border-[var(--hairline)] bg-[var(--bg)] px-6 py-5">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-[var(--ink-muted)]">
              <span>{copy.lookbookBundleOriginal}</span>
              <span className="font-mono-tech">{formatMoney(retailUsd, currency)}</span>
            </div>
            <div className="flex justify-between text-[var(--olive)]">
              <span>{copy.lookbookBundleSavings}</span>
              <span className="font-mono-tech">-{formatMoney(savingsUsd, currency)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--hairline)] pt-2 text-sm font-medium text-[var(--ink)]">
              <span>{copy.lookbookBundleFinal}</span>
              <span className="font-mono-tech">{formatMoney(finalUsd, currency)}</span>
            </div>
          </div>

          <button
            type="button"
            data-testid="confirm-add-lookbook-bundle"
            onClick={() =>
              addLookbookBundleToBag(
                look.id,
                items.map((prod) => ({
                  productId: prod.id,
                  size:
                    sizeMap[prod.id] ??
                    (prod.sizes.includes('M') ? 'M' : prod.sizes[0]),
                  colorwayId: colorMap[prod.id] ?? prod.colorways[0].id,
                }))
              )
            }
            className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-[var(--ink)] bg-[var(--ink)] px-5 py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--surface)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
          >
            <Layers size={14} strokeWidth={1.5} />
            {copy.lookbookAddAll}
          </button>
        </div>
      </div>
    </div>
  );
};
