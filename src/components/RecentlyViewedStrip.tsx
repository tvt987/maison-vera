import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PRODUCT_BY_ID } from '../data/catalog';
import { t } from '../data/i18n';
import { formatMoney } from '../engines/currency';
import { ProductArt } from './ProductArt';

export const RecentlyViewedStrip: React.FC = () => {
  const { locale, currency, recentlyViewed, openQuickView } = useStore();
  const copy = t(locale);

  const products = recentlyViewed
    .map((id) => PRODUCT_BY_ID[id])
    .filter(Boolean);

  if (products.length === 0) return null;

  return (
    <section className="border-b border-[var(--hairline)] bg-[var(--surface)] py-12">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
              {copy.recentlyViewedKicker}
            </p>
            <h3 className="mt-1 font-serif-editorial text-2xl text-[var(--ink)] sm:text-3xl">
              {copy.recentlyViewedTitle}
            </h3>
          </div>
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            {products.length} ITEMS
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {products.map((prod) => (
            <button
              key={prod.id}
              type="button"
              onClick={() => openQuickView(prod.id)}
              className="group flex flex-col border border-[var(--hairline)] bg-[var(--bg)] p-3 text-left transition-colors hover:border-[var(--ink)]"
            >
              <div className="aspect-[5/6] w-full bg-[var(--studio-bg)] p-2">
                <ProductArt product={prod} colorway={prod.colorways[0]} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono-tech text-[9px] text-[var(--ink-muted)]">
                  {prod.sku}
                </span>
                <ArrowUpRight
                  size={12}
                  strokeWidth={1.5}
                  className="text-[var(--ink-muted)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--accent)]"
                />
              </div>
              <p className="mt-1 truncate font-serif-editorial text-base text-[var(--ink)]">
                {prod.name[locale]}
              </p>
              <p className="mt-0.5 font-mono-tech text-[11px] text-[var(--ink-muted)]">
                {formatMoney(prod.priceUsd, currency)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
