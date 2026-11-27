import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Heart,
  MapPin,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Star,
  X,
  ZoomIn,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { getMediaUrl, PRODUCT_BY_ID } from '../data/catalog';
import { CATEGORY_LABELS, t } from '../data/i18n';
import { getProductAuthenticity } from '../data/reviewsAndStock';
import { atelierAudio } from '../engines/atelierAudio';
import { formatMoney } from '../engines/currency';
import { estimateAtelierSize } from '../engines/fitEngine';
import { resolveActiveMonogram } from '../engines/monogramEngine';
import type { FitPreference, MonogramConfig, ProductSize } from '../types/commerce';
import { MonogramStudio } from './MonogramStudio';
import { ProductMedia } from './ProductMedia';

const Eyewear3DCanvas = lazy(() =>
  import('./Eyewear3DCanvas').then((m) => ({ default: m.Eyewear3DCanvas }))
);

type GalleryViewId = 'primary' | 'detail' | 'lighting' | '3d';
type DossierTabId = 'overview' | 'fit' | 'reviews' | 'boutiques';

export const ProductQuickView: React.FC = () => {
  const {
    locale,
    currency,
    theme,
    heroConfig,
    quickViewProductId,
    closeQuickView,
    addToBag,
    toggleWishlist,
    isWishlisted,
  } = useStore();

  const product = quickViewProductId ? PRODUCT_BY_ID[quickViewProductId] : null;

  const [colorIdx, setColorIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<ProductSize>('M');
  const [galleryView, setGalleryView] = useState<GalleryViewId>('primary');
  const [activeTab, setActiveTab] = useState<DossierTabId>('overview');

  // Studio 2.2x Real-Photo Optical Loupe Magnifier
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
    setGalleryView('primary');
    setActiveTab('overview');
    setLoupeEnabled(false);
    setLoupePos({ x: 50, y: 50, active: false });
    setMonogram({ enabled: false, text: 'TVT', foil: 'gold-24k' });
  }, [product]);

  const fitResult = useMemo(
    () => estimateAtelierSize(heightCm, weightKg, fitPref),
    [heightCm, weightKg, fitPref]
  );

  const authenticity = useMemo(
    () => (product ? getProductAuthenticity(product.category, product.stock) : null),
    [product]
  );

  if (!product || !authenticity) return null;

  const copy = t(locale);
  const colorway = product.colorways[colorIdx] ?? product.colorways[0];
  const wishlisted = isWishlisted(product.id);
  const isSoldOut = product.stock <= 0;
  const supports3d = product.id === 'mv-eye-01';
  const photoUrl = getMediaUrl(product.imageFile);

  const handleViewportMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!loupeEnabled || galleryView === '3d') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setLoupePos({ x, y, active: true });
  };

  const thumbOptions: { id: GalleryViewId; label: string }[] = [
    { id: 'primary', label: copy.quickViewThumbFull },
    { id: 'detail', label: copy.quickViewThumbMacro },
    { id: 'lighting', label: copy.quickViewThumbLighting },
    ...(supports3d ? [{ id: '3d' as const, label: copy.quickViewThumb3d }] : []),
  ];

  const getBoutiqueBadge = (status: 'in-boutique' | 'last-piece' | 'by-appointment' | 'waitlist') => {
    switch (status) {
      case 'in-boutique':
        return {
          text: copy.boutiqueInStock,
          cls: 'border-[var(--olive)]/40 bg-[var(--olive)]/12 text-[var(--olive)]',
        };
      case 'last-piece':
        return {
          text: copy.boutiqueLastPiece,
          cls: 'border-[var(--accent)]/45 bg-[var(--accent)]/12 text-[var(--accent)]',
        };
      case 'by-appointment':
        return {
          text: copy.boutiqueAppointment,
          cls: 'border-[var(--hairline-strong)] bg-[var(--surface)] text-[var(--ink)]',
        };
      case 'waitlist':
      default:
        return {
          text: copy.boutiqueWaitlist,
          cls: 'border-[var(--hairline)] bg-[var(--bg)] text-[var(--ink-muted)]',
        };
    }
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/58 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={product.name[locale]}
      onClick={closeQuickView}
    >
      <div
        data-testid="product-quickview-modal"
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-in grid max-h-[92vh] w-full max-w-[1060px] grid-cols-1 overflow-hidden border border-[var(--hairline-strong)] bg-[var(--surface)] shadow-2xl md:grid-cols-12"
      >
        {/* Left Studio Multi-View Gallery + Real-Photo 2.2x Optical Loupe */}
        <div className="relative flex flex-col justify-between border-b border-[var(--hairline)] bg-[var(--studio-bg)] p-5 sm:p-6 md:col-span-6 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              {product.sku} · {product.editionStamp}
            </span>
            {galleryView !== '3d' && (
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
            )}
          </div>

          <div
            data-testid="quickview-studio-stage"
            onMouseMove={handleViewportMove}
            onMouseEnter={() => {
              if (loupeEnabled && galleryView !== '3d') {
                setLoupePos((p) => ({ ...p, active: true }));
              }
            }}
            onMouseLeave={() => setLoupePos((p) => ({ ...p, active: false }))}
            className={`relative my-4 flex aspect-[4/5] max-h-[420px] w-full items-center justify-center overflow-hidden border border-[var(--hairline)] bg-[var(--surface)] ${
              loupeEnabled && galleryView !== '3d' ? 'cursor-crosshair' : ''
            }`}
          >
            {galleryView === '3d' ? (
              <Suspense
                fallback={
                  <div className="flex h-full w-full items-center justify-center font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                    LOADING 3D CAD...
                  </div>
                }
              >
                <Eyewear3DCanvas
                  config={{ ...heroConfig, cameraPreset: 'runway' }}
                  theme={theme}
                  locale={locale}
                  resetSignal={0}
                />
              </Suspense>
            ) : (
              <ProductMedia
                product={product}
                colorway={colorway}
                variant={galleryView}
                loading="eager"
                className="h-full w-full"
              />
            )}

            {/* Real-Photo 2.2x Optical Loupe Magnifier Lens */}
            {loupeEnabled && galleryView !== '3d' && (
              <div
                data-testid="quickview-loupe-lens"
                aria-hidden="true"
                className="pointer-events-none absolute z-30 h-44 w-44 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 border-[var(--accent)] shadow-2xl ring-2 ring-black/20"
                style={{
                  left: `${loupePos.x}%`,
                  top: `${loupePos.y}%`,
                  opacity: loupePos.active ? 1 : 0.94,
                  backgroundImage: `url(${photoUrl})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '235%',
                  backgroundPosition: `${loupePos.x}% ${loupePos.y}%`,
                  filter:
                    colorway.photoFilter && colorway.photoFilter !== 'none'
                      ? colorway.photoFilter
                      : undefined,
                }}
              >
                <div className="absolute inset-x-0 bottom-2 text-center font-mono-tech text-[8px] uppercase tracking-[0.22em] text-white drop-shadow">
                  2.2X OPTICAL LOUPE
                </div>
              </div>
            )}
          </div>

          {loupeEnabled && galleryView !== '3d' && (
            <p className="mb-2.5 text-center font-mono-tech text-[9.5px] uppercase tracking-[0.14em] text-[var(--accent)]">
              {copy.quickViewLoupeHint}
            </p>
          )}

          {/* Real Multi-View Studio Thumbnail Rail */}
          <div
            className={`grid gap-2 ${
              supports3d ? 'grid-cols-4' : 'grid-cols-3'
            }`}
          >
            {thumbOptions.map((opt) => {
              const active = galleryView === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`quickview-thumb-${opt.id}`}
                  onClick={() => {
                    atelierAudio.playDetent();
                    setGalleryView(opt.id);
                    if (opt.id === '3d') setLoupeEnabled(false);
                  }}
                  className={`flex flex-col overflow-hidden border text-left transition-colors ${
                    active
                      ? 'border-[var(--ink)] ring-1 ring-[var(--ink)]'
                      : 'border-[var(--hairline)] opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex h-14 w-full items-center justify-center overflow-hidden bg-[var(--surface)]">
                    {opt.id === '3d' ? (
                      <div className="flex flex-col items-center justify-center text-[var(--accent)]">
                        <Box size={16} strokeWidth={1.5} />
                        <span className="mt-0.5 font-mono-tech text-[8px] uppercase">
                          3D CAD
                        </span>
                      </div>
                    ) : (
                      <ProductMedia
                        product={product}
                        colorway={colorway}
                        variant={opt.id}
                        className="h-full w-full"
                      />
                    )}
                  </div>
                  <span className="truncate bg-[var(--surface)] px-1.5 py-1 font-mono-tech text-[8.5px] uppercase tracking-[0.08em] text-[var(--ink)]">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Details, Monogram Studio & 4-Tab Authenticity Dossier */}
        <div className="flex max-h-[92vh] flex-col overflow-y-auto p-6 sm:p-8 md:col-span-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <p className="font-mono-tech text-[9.5px] uppercase tracking-[0.2em] text-[var(--accent)]">
                  {CATEGORY_LABELS[product.category][locale]}
                </p>
                <span className="inline-flex items-center gap-1 font-mono-tech text-[10px] text-[var(--ink-muted)]">
                  <Star size={11} strokeWidth={1.5} className="fill-[var(--accent)] text-[var(--accent)]" />
                  {authenticity.averageRating.toFixed(1)} ({authenticity.reviewCount})
                </span>
              </div>
              <h2 className="mt-1 font-serif-editorial text-3xl leading-tight text-[var(--ink)]">
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

          {/* 4 Luxury Flagship Dossier Tabs */}
          <div className="mt-5 border-t border-[var(--hairline)] pt-5">
            <div className="mb-4 grid grid-cols-2 gap-1 sm:grid-cols-4">
              {(
                [
                  ['overview', copy.quickViewOverview],
                  ['fit', copy.quickViewFitGuide],
                  ['reviews', `${copy.quickViewReviews} (${authenticity.averageRating.toFixed(1)})`],
                  ['boutiques', copy.quickViewBoutiques],
                ] as const
              ).map(([tabId, label]) => (
                <button
                  key={tabId}
                  type="button"
                  data-testid={`quickview-tab-${tabId}`}
                  onClick={() => {
                    atelierAudio.playDetent();
                    setActiveTab(tabId);
                  }}
                  className={`border px-2 py-2 font-mono-tech text-[9.5px] uppercase tracking-[0.12em] transition-colors ${
                    activeTab === tabId
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                      : 'border-[var(--hairline)] bg-[var(--bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab 1: Specs & Provenance */}
            {activeTab === 'overview' && (
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
            )}

            {/* Tab 2: Size & Fit Estimator */}
            {activeTab === 'fit' && (
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

            {/* Tab 3: Verified Collector Reviews & Fit Consensus Bar */}
            {activeTab === 'reviews' && (
              <div data-testid="quickview-reviews-panel" className="space-y-4">
                {/* Visual Fit Consensus Scale */}
                <div className="border border-[var(--hairline)] bg-[var(--bg)] p-3.5">
                  <div className="mb-2 flex items-center justify-between font-mono-tech text-[10px] uppercase tracking-[0.16em]">
                    <span className="text-[var(--ink-muted)]">
                      {copy.fitConsensusLabel}
                    </span>
                    <span className="text-[var(--accent)]">
                      {authenticity.averageRating.toFixed(1)} / 5.0 · {authenticity.reviewCount}
                    </span>
                  </div>
                  <div className="relative h-1.5 w-full bg-[var(--hairline-strong)]">
                    <span
                      className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--surface)] bg-[var(--accent)]"
                      style={{ left: `${authenticity.fitConsensusPercent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between font-mono-tech text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    <span>{copy.fitConsensusFitted}</span>
                    <span>{copy.fitConsensusTrue}</span>
                    <span>{copy.fitConsensusRelaxed}</span>
                  </div>
                </div>

                {/* Verified Serial Collector Reviews */}
                <div className="space-y-3">
                  {authenticity.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="border border-[var(--hairline)] bg-[var(--bg)] p-3.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[var(--ink)]">
                          {rev.author} · {rev.city}
                        </span>
                        <span className="border border-[var(--olive)]/40 bg-[var(--olive)]/10 px-1.5 py-0.5 font-mono-tech text-[9px] text-[var(--olive)]">
                          {rev.serialTag}
                        </span>
                      </div>
                      <p className="mt-1.5 font-serif-editorial text-lg leading-snug text-[var(--ink)]">
                        {rev.headline[locale]}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                        {rev.body[locale]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Global Boutique Stock Matrix */}
            {activeTab === 'boutiques' && (
              <div data-testid="quickview-boutiques-panel" className="space-y-2.5">
                {authenticity.boutiques.map((b) => {
                  const badge = getBoutiqueBadge(b.status);
                  return (
                    <div
                      key={b.address}
                      className="flex items-center justify-between gap-3 border border-[var(--hairline)] bg-[var(--bg)] px-3.5 py-3"
                    >
                      <div className="min-w-0">
                        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink)]">
                          <MapPin size={12} strokeWidth={1.5} className="text-[var(--accent)]" />
                          {b.boutiqueName[locale]}
                        </p>
                        <p className="mt-0.5 font-mono-tech text-[10px] text-[var(--ink-muted)]">
                          {b.address}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 border px-2 py-1 font-mono-tech text-[9.5px] uppercase tracking-[0.14em] ${badge.cls}`}
                      >
                        {badge.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
