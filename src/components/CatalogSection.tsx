import React, { useMemo, useState } from 'react';
import {
  Columns3,
  Eye,
  Heart,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CATALOG } from '../data/catalog';
import { CATEGORY_LABELS, COLOR_FAMILY_LABELS, t } from '../data/i18n';
import { atelierAudio } from '../engines/atelierAudio';
import { formatMoney } from '../engines/currency';
import { DEFAULT_FILTERS, filterAndSortCatalog } from '../engines/filterEngine';
import type {
  CatalogFilterState,
  ColorFamily,
  Product,
  ProductCategory,
  SortOption,
} from '../types/commerce';
import { ProductArt } from './ProductArt';

const CATEGORIES: (ProductCategory | 'All')[] = [
  'All',
  'Outerwear',
  'Eyewear',
  'Leather Goods',
  'Objects',
  'Fragrance',
];

const COLOR_FAMILIES: { id: ColorFamily | 'All'; hex?: string }[] = [
  { id: 'All' },
  { id: 'Obsidian', hex: '#1E1F22' },
  { id: 'Sand', hex: '#C7B8A1' },
  { id: 'Sienna', hex: '#9E462B' },
  { id: 'Olive', hex: '#3E4C40' },
  { id: 'Titanium', hex: '#BFC2C7' },
  { id: 'Gold', hex: '#D1AE6F' },
];

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    locale,
    currency,
    addToBag,
    toggleWishlist,
    isWishlisted,
    compareIds,
    toggleCompare,
    openQuickView,
  } = useStore();

  const [activeColorIdx, setActiveColorIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });

  const copy = t(locale);
  const colorway = product.colorways[activeColorIdx] ?? product.colorways[0];
  const wishlisted = isWishlisted(product.id);
  const comparing = compareIds.includes(product.id);
  const isSoldOut = product.stock <= 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - py) * 7,
      ry: (px - 0.5) * 7,
      gx: Math.round(px * 100),
      gy: Math.round(py * 100),
    });
  };

  return (
    <article
      data-testid={`product-card-${product.sku}`}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setHovered(false);
        setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });
      }}
      style={{
        transform: hovered
          ? `perspective(960px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateY(-3px)`
          : 'perspective(960px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        transition: hovered
          ? 'transform 0.12s ease-out, box-shadow 0.3s ease, border-color 0.3s ease'
          : 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease, border-color 0.3s ease',
      }}
      className="group relative flex flex-col border border-[var(--hairline)] bg-[var(--surface)] will-change-transform hover:border-[var(--hairline-strong)] hover:shadow-[var(--shadow-card)]"
    >
      {/* Dynamic Specular Light Glare Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(360px circle at ${tilt.gx}% ${tilt.gy}%, rgba(255, 250, 240, 0.16), transparent 62%)`,
        }}
      />

      {/* Studio Artwork Viewport with Dual-Angle Hover Swap & Quick-Add Size Bar */}
      <div
        data-cursor={isSoldOut ? 'EXPLORE' : 'QUICK ADD'}
        className="relative aspect-[5/6] overflow-hidden bg-[var(--studio-bg)] transition-colors duration-300 group-hover:bg-[var(--studio-bg-hover)]"
      >
        {/* Top Badges & Action Icons (Compare, Quick-View, Wishlist) */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="border border-[var(--hairline)] bg-[var(--surface)]/90 px-2 py-0.5 font-mono-tech text-[9px] uppercase tracking-[0.18em] text-[var(--ink-muted)] backdrop-blur-sm">
              {product.editionStamp}
            </span>
            {isSoldOut ? (
              <span className="w-fit bg-[var(--ink)] px-2 py-0.5 font-mono-tech text-[9px] uppercase tracking-[0.16em] text-[var(--surface)]">
                {copy.cardSoldOut}
              </span>
            ) : product.stock <= 4 ? (
              <span className="w-fit bg-[var(--accent)] px-2 py-0.5 font-mono-tech text-[9px] uppercase tracking-[0.16em] text-[var(--accent-contrast)]">
                {product.stock} {copy.cardLowStock}
              </span>
            ) : null}
          </div>

          <div className="pointer-events-auto flex items-center gap-1">
            <button
              type="button"
              data-testid={`compare-toggle-${product.sku}`}
              onClick={() => toggleCompare(product.id)}
              aria-label={`${copy.cardCompare} ${product.name[locale]}`}
              title={comparing ? copy.cardComparing : copy.cardCompare}
              className={`flex h-8 w-8 items-center justify-center border backdrop-blur-sm transition-colors ${
                comparing
                  ? 'border-[var(--olive)] bg-[var(--olive)] text-white'
                  : 'border-[var(--hairline)] bg-[var(--surface)]/90 text-[var(--ink)] hover:border-[var(--ink)]'
              }`}
            >
              <Columns3 size={13} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              data-testid={`quickview-btn-${product.sku}`}
              onClick={() => openQuickView(product.id)}
              aria-label={`${copy.cardQuickView} ${product.name[locale]}`}
              className="flex h-8 w-8 items-center justify-center border border-[var(--hairline)] bg-[var(--surface)]/90 text-[var(--ink)] backdrop-blur-sm transition-colors hover:border-[var(--ink)]"
            >
              <Eye size={14} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              data-testid={`wishlist-toggle-${product.sku}`}
              onClick={() => toggleWishlist(product.id)}
              aria-label={copy.wishlist}
              className={`flex h-8 w-8 items-center justify-center border backdrop-blur-sm transition-colors ${
                wishlisted
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                  : 'border-[var(--hairline)] bg-[var(--surface)]/90 text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
              }`}
            >
              <Heart
                size={14}
                strokeWidth={1.5}
                fill={wishlisted ? 'currentColor' : 'none'}
              />
            </button>
          </div>
        </div>

        {/* Clickable Artwork Area (Primary <-> Detail Crossfade on Hover) */}
        <button
          type="button"
          onClick={() => openQuickView(product.id)}
          className="relative block h-full w-full p-4 text-left focus:outline-none"
          aria-label={product.name[locale]}
        >
          <div
            className={`absolute inset-4 transition-all duration-500 ease-out ${
              hovered ? 'scale-[1.03] opacity-0' : 'scale-100 opacity-100'
            }`}
          >
            <ProductArt product={product} colorway={colorway} variant="primary" />
          </div>
          <div
            className={`absolute inset-4 transition-all duration-500 ease-out ${
              hovered ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          >
            <ProductArt product={product} colorway={colorway} variant="detail" />
          </div>
        </button>

        {/* Subtle Alt-Angle Indicator */}
        <div
          className={`pointer-events-none absolute right-3 bottom-14 z-10 font-mono-tech text-[9px] tracking-[0.18em] text-[var(--ink-muted)] transition-opacity duration-300 ${
            hovered ? 'opacity-80' : 'opacity-0'
          }`}
        >
          {copy.cardHoverDetail}
        </div>

        {/* Quick-Add Size Bar on Hover */}
        <div
          className={`absolute inset-x-0 bottom-0 z-20 border-t border-[var(--hairline)] bg-[var(--surface)]/95 px-3 py-2.5 backdrop-blur-md transition-all duration-300 ${
            hovered
              ? 'translate-y-0 opacity-100'
              : 'translate-y-full opacity-0 group-focus-within:translate-y-0 group-focus-within:opacity-100'
          }`}
        >
          {isSoldOut ? (
            <div className="py-1 text-center font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              {copy.quickViewOutOfStock}
            </div>
          ) : (
            <div>
              <p className="mb-1.5 text-center font-mono-tech text-[9px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                {copy.cardQuickAdd}
              </p>
              <div className="flex items-center justify-center gap-1.5">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    data-testid={`quick-add-${product.sku}-${size}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      addToBag({
                        productId: product.id,
                        size,
                        colorwayId: colorway.id,
                      });
                    }}
                    className="min-w-[36px] border border-[var(--hairline-strong)] bg-[var(--bg)] px-2 py-1 font-mono-tech text-[10px] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--surface)]"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Dossier Footer */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              {product.sku} · {CATEGORY_LABELS[product.category][locale]}
            </span>
            <span
              data-testid={`product-price-${product.sku}`}
              className="font-mono-tech text-xs font-medium text-[var(--ink)]"
            >
              {formatMoney(product.priceUsd, currency)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => openQuickView(product.id)}
            className="mt-1.5 block text-left font-serif-editorial text-xl leading-snug text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
          >
            {product.name[locale]}
          </button>
          <p className="mt-1 line-clamp-1 text-xs text-[var(--ink-muted)]">
            {product.subtitle[locale]}
          </p>
        </div>

        {/* Dynamic Colorway Swatch Switcher */}
        <div className="mt-4 flex items-center justify-between border-t border-[var(--hairline)] pt-3">
          <div className="flex items-center gap-2">
            {product.colorways.map((cw, idx) => {
              const active = idx === activeColorIdx;
              return (
                <button
                  key={cw.id}
                  type="button"
                  onClick={() => {
                    atelierAudio.playDetent();
                    setActiveColorIdx(idx);
                  }}
                  title={cw.name[locale]}
                  aria-label={cw.name[locale]}
                  className={`h-4 w-4 rounded-full border transition-transform ${
                    active
                      ? 'scale-110 border-[var(--ink)] ring-1 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--surface)]'
                      : 'border-black/20 hover:scale-110'
                  }`}
                  style={{ backgroundColor: cw.hex }}
                />
              );
            })}
          </div>
          <span className="truncate pl-2 font-mono-tech text-[10px] text-[var(--ink-muted)]">
            {colorway.name[locale]}
          </span>
        </div>
      </div>
    </article>
  );
};

export const CatalogSection: React.FC = () => {
  const { locale, currency } = useStore();
  const [filters, setFilters] = useState<CatalogFilterState>(DEFAULT_FILTERS);
  const copy = t(locale);

  const visibleProducts = useMemo(
    () => filterAndSortCatalog(CATALOG, filters, locale),
    [filters, locale]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: CATALOG.length };
    for (const prod of CATALOG) {
      counts[prod.category] = (counts[prod.category] ?? 0) + 1;
    }
    return counts;
  }, []);

  const hasActiveFilters =
    filters.category !== 'All' ||
    filters.searchQuery.trim() !== '' ||
    filters.colorFamily !== 'All' ||
    filters.maxPriceUsd < DEFAULT_FILTERS.maxPriceUsd ||
    filters.inStockOnly ||
    filters.sortBy !== 'featured';

  return (
    <section
      id="collection"
      className="reveal-section border-b border-[var(--hairline)] bg-[var(--bg)] py-16 sm:py-24"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        {/* Heading */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[var(--hairline)] pb-6 md:flex-row md:items-end">
          <div>
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
              {copy.catalogKicker}
            </p>
            <h2 className="mt-2 font-serif-editorial text-4xl font-normal tracking-[-0.015em] text-[var(--ink)] sm:text-5xl">
              {copy.catalogHeading}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <span
              data-testid="catalog-count"
              className="font-mono-tech text-xs text-[var(--ink-muted)]"
            >
              {visibleProducts.length} / {CATALOG.length} {copy.catalogResultsCount}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="inline-flex items-center gap-1.5 border border-[var(--hairline-strong)] px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <RotateCcw size={12} strokeWidth={1.5} />
                {copy.catalogResetFilters}
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const active = filters.category === cat;
            return (
              <button
                key={cat}
                type="button"
                data-testid={`cat-tab-${cat}`}
                onClick={() => {
                  atelierAudio.playDetent();
                  setFilters((prev) => ({ ...prev, category: cat }));
                }}
                className={`inline-flex items-center gap-2 border px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors ${
                  active
                    ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                    : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--hairline-strong)]'
                }`}
              >
                <span>{CATEGORY_LABELS[cat][locale]}</span>
                <span className="font-mono-tech text-[10px] opacity-65">
                  {categoryCounts[cat] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Faceted Filter Rail */}
        <div className="mb-8 grid grid-cols-1 gap-4 border border-[var(--hairline)] bg-[var(--surface)] p-4 sm:p-5 lg:grid-cols-12 lg:items-center">
          <div className="relative lg:col-span-4">
            <Search
              size={15}
              strokeWidth={1.5}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
            />
            <input
              type="text"
              data-testid="catalog-search-input"
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              placeholder={copy.catalogSearchPlaceholder}
              className="h-10 w-full border border-[var(--hairline)] bg-[var(--bg)] pl-10 pr-9 text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)] focus:outline-none"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 lg:col-span-4">
            {COLOR_FAMILIES.map((cf) => {
              const active = filters.colorFamily === cf.id;
              return (
                <button
                  key={cf.id}
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, colorFamily: cf.id }))
                  }
                  className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] transition-colors ${
                    active
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                      : 'border-[var(--hairline)] bg-[var(--bg)] text-[var(--ink-muted)] hover:border-[var(--hairline-strong)] hover:text-[var(--ink)]'
                  }`}
                >
                  {cf.hex && (
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-black/20"
                      style={{ backgroundColor: cf.hex }}
                    />
                  )}
                  <span>{COLOR_FAMILY_LABELS[cf.id][locale]}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:col-span-4">
            <div className="min-w-[135px] flex-1">
              <div className="mb-1 flex items-center justify-between font-mono-tech text-[10px] text-[var(--ink-muted)]">
                <span>{copy.catalogMaxPrice}</span>
                <span className="text-[var(--ink)]">
                  {formatMoney(filters.maxPriceUsd, currency)}
                </span>
              </div>
              <input
                type="range"
                min={250}
                max={1600}
                step={50}
                value={filters.maxPriceUsd}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    maxPriceUsd: Number(e.target.value),
                  }))
                }
                aria-label={copy.catalogMaxPrice}
                className="vera-range"
              />
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap text-[11px] text-[var(--ink)]">
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    inStockOnly: e.target.checked,
                  }))
                }
                className="h-3.5 w-3.5 accent-[var(--accent)]"
              />
              <span>{copy.catalogInStockOnly}</span>
            </label>

            <div className="inline-flex items-center gap-1.5 border border-[var(--hairline)] bg-[var(--bg)] px-2.5 py-1.5">
              <SlidersHorizontal size={13} strokeWidth={1.5} className="text-[var(--ink-muted)]" />
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: e.target.value as SortOption,
                  }))
                }
                aria-label={copy.catalogSortLabel}
                className="bg-transparent text-[11px] text-[var(--ink)] focus:outline-none"
              >
                <option value="featured">{copy.sortFeatured}</option>
                <option value="newest">{copy.sortNewest}</option>
                <option value="price-asc">{copy.sortPriceAsc}</option>
                <option value="price-desc">{copy.sortPriceDesc}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid or Empty State */}
        {visibleProducts.length === 0 ? (
          <div className="border border-[var(--hairline)] bg-[var(--surface)] px-6 py-16 text-center">
            <p className="font-serif-editorial text-2xl text-[var(--ink)]">
              {copy.catalogEmptyTitle}
            </p>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              {copy.catalogEmptySub}
            </p>
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mt-6 border border-[var(--ink)] bg-[var(--ink)] px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--accent)]"
            >
              {copy.catalogResetFilters}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
