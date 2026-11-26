import React from 'react';
import { ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PRODUCT_BY_ID } from '../data/catalog';
import { t } from '../data/i18n';
import { formatMoney } from '../engines/currency';
import { ProductMedia } from './ProductMedia';

export const WishlistDrawer: React.FC = () => {
  const {
    locale,
    currency,
    wishlist,
    wishlistOpen,
    setWishlistOpen,
    toggleWishlist,
    addToBag,
  } = useStore();

  if (!wishlistOpen) return null;

  const copy = t(locale);
  const products = wishlist.map((id) => PRODUCT_BY_ID[id]).filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-[90] flex justify-end bg-black/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={copy.wishlistTitle}
      onClick={() => setWishlistOpen(false)}
    >
      <div
        data-testid="wishlist-drawer"
        onClick={(e) => e.stopPropagation()}
        className="animate-drawer-right flex h-full w-full max-w-[440px] flex-col border-l border-[var(--hairline-strong)] bg-[var(--surface)] shadow-[var(--shadow-drawer)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--hairline)] px-6 py-5">
          <div>
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
              ARCHIVE SAVED ({products.length})
            </p>
            <h2 className="mt-0.5 font-serif-editorial text-2xl text-[var(--ink)]">
              {copy.wishlistTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setWishlistOpen(false)}
            aria-label="Close wishlist"
            className="flex h-8 w-8 items-center justify-center border border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--ink)]"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {products.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-serif-editorial text-2xl text-[var(--ink)]">
                {copy.wishlistEmpty}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((prod) => {
                const isSoldOut = prod.stock <= 0;
                return (
                  <div
                    key={prod.id}
                    className="flex gap-4 border border-[var(--hairline)] bg-[var(--bg)] p-3.5"
                  >
                    <div className="h-24 w-20 shrink-0 overflow-hidden border border-[var(--hairline)] bg-[var(--studio-bg)]">
                      <ProductMedia product={prod} colorway={prod.colorways[0]} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono-tech text-[10px] text-[var(--ink-muted)]">
                            {prod.sku}
                          </span>
                          <span className="font-mono-tech text-xs text-[var(--ink)]">
                            {formatMoney(prod.priceUsd, currency)}
                          </span>
                        </div>
                        <h3 className="mt-0.5 truncate font-serif-editorial text-lg text-[var(--ink)]">
                          {prod.name[locale]}
                        </h3>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isSoldOut}
                          onClick={() => {
                            addToBag({
                              productId: prod.id,
                              size: prod.sizes.includes('M') ? 'M' : prod.sizes[0],
                              colorwayId: prod.colorways[0].id,
                              openDrawer: true,
                            });
                            toggleWishlist(prod.id);
                            setWishlistOpen(false);
                          }}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 border border-[var(--ink)] bg-[var(--ink)] px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--surface)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] disabled:opacity-40"
                        >
                          <ShoppingBag size={12} strokeWidth={1.5} />
                          {isSoldOut ? copy.cardSoldOut : copy.wishlistMoveToBag}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleWishlist(prod.id)}
                          aria-label={copy.wishlistRemove}
                          className="flex h-7 w-7 items-center justify-center border border-[var(--hairline)] text-[var(--ink-muted)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
                        >
                          <Trash2 size={13} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
