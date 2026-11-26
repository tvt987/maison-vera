import React, { useEffect, useMemo, useState } from 'react';
import { Heart, Ruler, ShieldCheck, ShoppingBag, X, ZoomIn } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PRODUCT_BY_ID } from '../data/catalog';
import { CATEGORY_LABELS, t } from '../data/i18n';
import { atelierAudio } from '../engines/atelierAudio';
import { formatMoney } from '../engines/currency';
import { estimateAtelierSize } from '../engines/fitEngine';
import { resolveActiveMonogram } from '../engines/monogramEngine';
import type { FitPreference, MonogramConfig, ProductSize } from '../types/commerce';
import { MonogramStudio } from './MonogramStudio';
import { ProductArt } from './ProductArt';

export const ProductQuickView: React.FC = () => {
  const {
    locale,
    currency,
    quickViewProductId,
    closeQuickView,
    addToBag,
    toggleWishlist,
    isWishlisted,
  } = useStore();

  const product = quickViewProductId ? PRODUCT_BY_ID[quickViewProductId] : null;

  const [colorIdx, setColorIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<ProductSize>('M');
  const [angle, setAngle] = useState<'primary' | 'detail'>('primary');
  const [activeTab, setActiveTab] = useState<'overview' | 'fit'>('overview');

  // Studio 2.2x Interactive Loupe Magnifier
  const [loupeEnabled, setLoupeEnabled] = useState(false);
  const [loupePos, setLoupePos] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false,
  });

  // Bespoke Monogram state
  const [monogram, setMonogram] = useState<MonogramConfig>({
    enabled: false,
    text: 'TVT',
    foil: 'gold-24k',
  });

  // Fit estimator controls
  const [heightCm, setHeightCm] = useState(176);
  const [weightKg, setWeightKg] = useState(72);
  const [fitPref, setFitPref] = useState<FitPreference>('architectural');

  useEffect(() => {
    if (!product) return;
    setColorIdx(0);
    setSelectedSize(product.sizes.includes('M') ? 'M' : product.sizes[0]);
    setAngle('primary');
    setActiveTab('overview');
    setLoupeEnabled(false);
    setLoupePos({ x: 50, y: 50, active: false });
    setMonogram({ enabled: false, text: 'TVT', foil: 'gold-24k' });
  }, [product]);

  const fitResult = useMemo(
    () => estimateAtelierSize(heightCm, weightKg, fitPref),
    [heightCm, weightKg, fitPref]
  );

  if (!product) return null;

  const copy = t(locale);
  const colorway = product.colorways[colorIdx] ?? product.colorways[0];
  const wishlisted = isWishlisted(product.id);
  const isSoldOut = product.stock <= 0;

  const handleViewportMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!loupeEnabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setLoupePos({ x, y, active: true });
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={product.name[locale]}
      onClick={closeQuickView}
    >
      <div
        data-testid="product-quickview-modal"
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-in grid max-h-[92vh] w-full max-w-[1020px] grid-cols-1 overflow-hidden border border-[var(--hairline-strong)] bg-[var(--surface)] shadow-2xl md:grid-cols-12"
      >
        {/* Left Studio Dual-Angle + 2.2x Loupe Magnifier Viewer */}
        <div className="relative flex flex-col justify-between border-b border-[var(--hairline)] bg-[var(--studio-bg)] p-6 md:col-span-6 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              {product.sku} · {product.editionStamp}
            </span>
            <button
              type="button"
              data-testid="quickview-loupe-toggle"
              onClick={() => {
                atelierAudio.playDetent();
                setLoupeEnabled((v) => !v);
              }}
              className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono-tech text-[10px] uppercase tracking-[0.14em] transition-colors ${
                loupeEnabled
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                  : 'border-[var(--hairline-strong)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--ink)]'
              }`}
            >
              <ZoomIn size={12} strokeWidth={1.6} />
              {loupeEnabled ? copy.quickViewLoupeOn : copy.quickViewLoupeOff}
            </button>
          </div>

          <div
            data-testid="quickview-studio-stage"
            onMouseMove={handleViewportMove}
            onMouseEnter={() => {
              if (loupeEnabled) setLoupePos((p) => ({ ...p, active: true }));
            }}
            onMouseLeave={() => setLoupePos((p) => ({ ...p, active: false }))}
            className={`relative my-4 flex min-h-[280px] flex-1 items-center justify-center overflow-hidden sm:min-h-[370px] ${
              loupeEnabled ? 'cursor-crosshair' : ''
            }`}
          >
            <div className="h-full w-full max-w-[340px]">
              <ProductArt
                product={product}
                colorway={colorway}
                variant={angle}
                className="max-h-[380px] w-full"
              />
            </div>

            {/* Interactive 2.2x Architectural Loupe Reticle */}
            {loupeEnabled && (
              <div
                data-testid="quickview-loupe-lens"
                aria-hidden="true"
                className="pointer-events-none absolute z-30 h-40 w-40 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 border-[var(--accent)] bg-[var(--studio-bg)] shadow-2xl ring-2 ring-black/15"
                style={{
                  left: `${loupePos.x}%`,
                  top: `${loupePos.y}%`,
                  opacity: loupePos.active ? 1 : 0.92,
                }}
              >
                <div
                  className="h-[370px] w-[340px]"
                  style={{
                    transform: `translate(${80 - (loupePos.x / 100) * 340 * 2.2}px, ${80 - (loupePos.y / 100) * 370 * 2.2}px) scale(2.2)`,
                    transformOrigin: 'top left',
                  }}
                >
                  <ProductArt product={product} colorway={colorway} variant={angle} />
                </div>
                <div className="absolute inset-x-0 bottom-1.5 text-center font-mono-tech text-[8px] uppercase tracking-[0.2em] text-[var(--ink)]">
                  2.2X MACRO
                </div>
              </div>
            )}
          </div>

          {loupeEnabled && (
            <p className="mb-2 text-center font-mono-tech text-[9.5px] uppercase tracking-[0.14em] text-[var(--accent)]">
              {copy.quickViewLoupeHint}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAngle('primary')}
              className={`border px-3 py-2 font-mono-tech text-[10px] uppercase tracking-[0.16em] transition-colors ${
                angle === 'primary'
                  ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                  : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)]'
              }`}
            >
              {copy.quickViewPrimaryView}
            </button>
            <button
              type="button"
              onClick={() => setAngle('detail')}
              className={`border px-3 py-2 font-mono-tech text-[10px] uppercase tracking-[0.16em] transition-colors ${
                angle === 'detail'
                  ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                  : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)]'
              }`}
            >
              {copy.quickViewDetailView}
            </button>
          </div>
        </div>

        {/* Right Details, Monogram Studio & Fit Estimator */}
        <div className="flex max-h-[92vh] flex-col overflow-y-auto p-6 sm:p-8 md:col-span-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono-tech text-[9.5px] uppercase tracking-[0.2em] text-[var(--accent)]">
                {CATEGORY_LABELS[product.category][locale]}
              </p>
              <h2 className="mt-0.5 font-serif-editorial text-3xl leading-tight text-[var(--ink)]">
                {product.name[locale]}
              </h2>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                {product.subtitle[locale]}
              </p>
            </div>
            <button
              type="button"
              onClick={closeQuickView}
              aria-label="Close quick view"
              className="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--ink)]"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between border-y border-[var(--hairline)] py-3">
            <span className="font-mono-tech text-xl text-[var(--ink)]">
              {formatMoney(product.priceUsd, currency)}
            </span>
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              {isSoldOut
                ? copy.cardSoldOut
                : `${product.stock} ${copy.quickViewPiecesLeft}`}
            </span>
          </div>

          {/* Colorways */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                {copy.quickViewSelectColor}
              </span>
              <span className="text-[var(--ink)]">{colorway.name[locale]}</span>
            </div>
            <div className="flex items-center gap-2.5">
              {product.colorways.map((cw, idx) => (
                <button
                  key={cw.id}
                  type="button"
                  onClick={() => {
                    atelierAudio.playDetent();
                    setColorIdx(idx);
                  }}
                  aria-label={cw.name[locale]}
                  className={`h-6 w-6 rounded-full border transition-transform ${
                    idx === colorIdx
                      ? 'scale-110 border-[var(--ink)] ring-1 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--surface)]'
                      : 'border-black/20'
                  }`}
                  style={{ backgroundColor: cw.hex }}
                />
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                {copy.quickViewSelectSize}
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('fit')}
                className="inline-flex items-center gap-1 font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[var(--accent)] hover:underline"
              >
                <Ruler size={12} strokeWidth={1.5} />
                {copy.quickViewFitGuide}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-[48px] border px-3 py-1.5 font-mono-tech text-xs transition-colors ${
                    selectedSize === size
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                      : 'border-[var(--hairline-strong)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--ink)]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Live Bespoke Monogram & Foil-Stamping Studio */}
          {!isSoldOut && (
            <div className="mt-4">
              <MonogramStudio
                config={monogram}
                onChange={setMonogram}
                locale={locale}
                testIdPrefix="qv-monogram"
              />
            </div>
          )}

          {/* Primary Actions */}
          <div className="mt-5 flex gap-2.5">
            <button
              type="button"
              disabled={isSoldOut}
              data-testid="quickview-add-to-bag"
              onClick={() => {
                addToBag({
                  productId: product.id,
                  size: selectedSize,
                  colorwayId: colorway.id,
                  monogram: resolveActiveMonogram(monogram),
                  openDrawer: true,
                });
                closeQuickView();
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 border border-[var(--ink)] bg-[var(--ink)] px-5 py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--surface)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ShoppingBag size={14} strokeWidth={1.5} />
              {isSoldOut ? copy.quickViewOutOfStock : copy.quickViewAddToBag}
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-label={copy.wishlist}
              className={`flex w-12 items-center justify-center border transition-colors ${
                wishlisted
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                  : 'border-[var(--hairline-strong)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
              }`}
            >
              <Heart
                size={16}
                strokeWidth={1.5}
                fill={wishlisted ? 'currentColor' : 'none'}
              />
            </button>
          </div>

          {/* Tabs: Overview vs Interactive Size/Fit Guide */}
          <div className="mt-5 border-t border-[var(--hairline)] pt-5">
            <div className="mb-4 grid grid-cols-2 border border-[var(--hairline)]">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`py-2 font-mono-tech text-[10px] uppercase tracking-[0.16em] ${
                  activeTab === 'overview'
                    ? 'bg-[var(--ink)] text-[var(--surface)]'
                    : 'bg-[var(--bg)] text-[var(--ink-muted)]'
                }`}
              >
                {copy.quickViewOverview}
              </button>
              <button
                type="button"
                data-testid="quickview-fit-tab"
                onClick={() => setActiveTab('fit')}
                className={`py-2 font-mono-tech text-[10px] uppercase tracking-[0.16em] ${
                  activeTab === 'fit'
                    ? 'bg-[var(--ink)] text-[var(--surface)]'
                    : 'bg-[var(--bg)] text-[var(--ink-muted)]'
                }`}
              >
                {copy.quickViewFitGuide}
              </button>
            </div>

            {activeTab === 'overview' ? (
              <div className="space-y-3 text-xs leading-relaxed">
                <p className="text-[var(--ink-muted)]">{product.description[locale]}</p>
                <div className="border-t border-[var(--hairline)] pt-3">
                  <p className="font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink)]">
                    {copy.quickViewMaterial}
                  </p>
                  <p className="mt-1 text-[var(--ink-muted)]">{product.materialSpec[locale]}</p>
                </div>
                <div className="border-t border-[var(--hairline)] pt-3">
                  <p className="font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink)]">
                    {copy.quickViewProvenance}
                  </p>
                  <p className="mt-1 text-[var(--ink-muted)]">{product.provenance[locale]}</p>
                </div>
                <div className="border-t border-[var(--hairline)] pt-3">
                  <p className="font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink)]">
                    {copy.quickViewCare}
                  </p>
                  <p className="mt-1 text-[var(--ink-muted)]">{product.careGuide[locale]}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 border border-[var(--hairline)] bg-[var(--bg)] p-4">
                <div>
                  <div className="mb-1 flex justify-between font-mono-tech text-[11px]">
                    <span className="text-[var(--ink-muted)]">{copy.fitHeight}</span>
                    <span className="text-[var(--ink)]">{heightCm} cm</span>
                  </div>
                  <input
                    type="range"
                    min={150}
                    max={205}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="vera-range"
                  />
                </div>

                <div>
                  <div className="mb-1 flex justify-between font-mono-tech text-[11px]">
                    <span className="text-[var(--ink-muted)]">{copy.fitWeight}</span>
                    <span className="text-[var(--ink)]">{weightKg} kg</span>
                  </div>
                  <input
                    type="range"
                    min={45}
                    max={115}
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="vera-range"
                  />
                </div>

                <div>
                  <p className="mb-2 font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {copy.fitPreference}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        ['tailored', copy.fitTailored],
                        ['architectural', copy.fitArchitectural],
                        ['oversized', copy.fitOversized],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFitPref(id)}
                        className={`border py-1.5 text-[11px] ${
                          fitPref === id
                            ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                            : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[var(--hairline)] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
                      <ShieldCheck size={13} strokeWidth={1.5} />
                      {copy.fitRecommended}
                    </span>
                    <span className="font-serif-editorial text-3xl text-[var(--ink)]">
                      {product.sizes.includes('OS') ? 'OS' : fitResult.recommendedSize}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    {fitResult.confidenceNote[locale]}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--hairline)] pt-2.5 font-mono-tech text-[10px]">
                    <div>
                      <span className="block text-[var(--ink-muted)]">{copy.fitChest}</span>
                      <span className="text-[var(--ink)]">{fitResult.chestCm}</span>
                    </div>
                    <div>
                      <span className="block text-[var(--ink-muted)]">{copy.fitShoulder}</span>
                      <span className="text-[var(--ink)]">{fitResult.shoulderCm}</span>
                    </div>
                    <div>
                      <span className="block text-[var(--ink-muted)]">{copy.fitLength}</span>
                      <span className="text-[var(--ink)]">{fitResult.lengthCm}</span>
                    </div>
                  </div>

                  {!product.sizes.includes('OS') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSize(fitResult.recommendedSize);
                        setActiveTab('overview');
                      }}
                      className="mt-3 w-full border border-[var(--ink)] py-2 font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--surface)]"
                    >
                      {copy.fitApplySize} ({fitResult.recommendedSize})
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
