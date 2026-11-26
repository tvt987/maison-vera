import React from 'react';
import { Columns3, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PRODUCT_BY_ID } from '../data/catalog';
import { t } from '../data/i18n';
import { buildComparisonMatrix, MAX_COMPARE_SPECIMENS } from '../engines/compareEngine';
import { ProductMedia } from './ProductMedia';

export const CompareDockModal: React.FC = () => {
  const {
    locale,
    currency,
    compareIds,
    toggleCompare,
    clearCompare,
    compareModalOpen,
    setCompareModalOpen,
    addToBag,
  } = useStore();

  const products = compareIds.map((id) => PRODUCT_BY_ID[id]).filter(Boolean);
  if (products.length === 0) return null;

  const copy = t(locale);
  const rows = buildComparisonMatrix(products, locale, currency);

  return (
    <>
      {/* Floating Bottom Specimen Comparison Dock */}
      {!compareModalOpen && (
        <div
          data-testid="compare-dock"
          className="fixed bottom-5 left-1/2 z-[80] flex w-[calc(100vw-2rem)] max-w-[680px] -translate-x-1/2 flex-wrap items-center justify-between gap-3 border border-[var(--hairline-strong)] bg-[var(--ink)] px-4 py-3 text-[var(--surface)] shadow-2xl"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
              <Columns3 size={13} strokeWidth={1.5} />
              {copy.compareBarLabel} ({products.length}/{MAX_COMPARE_SPECIMENS})
            </span>
            <div className="flex items-center gap-1.5">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center gap-1.5 border border-white/15 bg-white/8 px-2 py-1"
                >
                  <span className="max-w-[92px] truncate font-mono-tech text-[10px]">
                    {prod.sku}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleCompare(prod.id)}
                    aria-label={`Remove ${prod.sku} from comparison`}
                    className="opacity-65 hover:opacity-100"
                  >
                    <X size={11} strokeWidth={1.6} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearCompare}
              className="inline-flex items-center gap-1 border border-white/20 px-2.5 py-1.5 font-mono-tech text-[10px] uppercase tracking-[0.14em] text-white/80 hover:border-white/50 hover:text-white"
            >
              <Trash2 size={11} strokeWidth={1.5} />
              {copy.compareClear}
            </button>
            <button
              type="button"
              data-testid="open-compare-modal-btn"
              onClick={() => setCompareModalOpen(true)}
              className="border border-[var(--accent)] bg-[var(--accent)] px-3.5 py-1.5 font-mono-tech text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--accent-contrast)] hover:opacity-90"
            >
              {copy.compareOpenMatrix}
            </button>
          </div>
        </div>
      )}

      {/* Full Side-by-Side Comparison Matrix Modal */}
      {compareModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={copy.compareModalTitle}
          onClick={() => setCompareModalOpen(false)}
        >
          <div
            data-testid="compare-matrix-modal"
            onClick={(e) => e.stopPropagation()}
            className="animate-modal-in flex max-h-[90vh] w-full max-w-[1040px] flex-col overflow-hidden border border-[var(--hairline-strong)] bg-[var(--surface)] shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-[var(--hairline)] px-6 py-5">
              <div>
                <p className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
                  SIDE-BY-SIDE DOSSIER ({products.length}/{MAX_COMPARE_SPECIMENS})
                </p>
                <h2 className="mt-0.5 font-serif-editorial text-2xl text-[var(--ink)] sm:text-3xl">
                  {copy.compareModalTitle}
                </h2>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  {copy.compareModalSub}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                aria-label="Close comparison matrix"
                className="flex h-8 w-8 items-center justify-center border border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--ink)]"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <table className="w-full min-w-[600px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--hairline-strong)]">
                    <th className="w-40 pb-4 pr-4 align-bottom font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                      SPECIFICATION
                    </th>
                    {products.map((prod) => (
                      <th key={prod.id} className="px-3 pb-4 align-top">
                        <div className="flex flex-col border border-[var(--hairline)] bg-[var(--bg)] p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-mono-tech text-[10px] text-[var(--ink-muted)]">
                              {prod.sku}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleCompare(prod.id)}
                              className="text-[var(--ink-muted)] hover:text-[var(--accent)]"
                              aria-label={`Remove ${prod.sku}`}
                            >
                              <X size={13} strokeWidth={1.5} />
                            </button>
                          </div>
                          <div className="h-40 w-full overflow-hidden bg-[var(--studio-bg)]">
                            <ProductMedia product={prod} colorway={prod.colorways[0]} />
                          </div>
                          <p className="mt-2.5 font-serif-editorial text-lg font-normal text-[var(--ink)]">
                            {prod.name[locale]}
                          </p>
                          <button
                            type="button"
                            disabled={prod.stock <= 0}
                            onClick={() => {
                              addToBag({
                                productId: prod.id,
                                size: prod.sizes.includes('M') ? 'M' : prod.sizes[0],
                                colorwayId: prod.colorways[0].id,
                                openDrawer: true,
                              });
                              setCompareModalOpen(false);
                            }}
                            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 border border-[var(--ink)] bg-[var(--ink)] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--surface)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] disabled:opacity-40"
                          >
                            <ShoppingBag size={12} strokeWidth={1.5} />
                            {prod.stock <= 0 ? copy.cardSoldOut : copy.quickViewAddToBag}
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--hairline)] last:border-b-0"
                    >
                      <td className="py-3.5 pr-4 align-top font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                        {row.label[locale]}
                      </td>
                      {row.values.map((val, idx) => (
                        <td
                          key={`${row.id}-${idx}`}
                          className={`px-3 py-3.5 align-top text-xs leading-relaxed ${
                            row.id === 'price'
                              ? 'font-mono-tech text-sm font-medium text-[var(--ink)]'
                              : 'text-[var(--ink)]'
                          }`}
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
