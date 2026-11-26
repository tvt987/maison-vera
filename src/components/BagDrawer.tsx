import React, { useState } from 'react';
import {
  ArrowRight,
  Gift,
  Minus,
  Plus,
  Tag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PRODUCT_BY_ID } from '../data/catalog';
import { t } from '../data/i18n';
import { GIFT_WRAP_FEE_USD } from '../engines/cartEngine';
import { formatMoney } from '../engines/currency';
import { formatMonogramLine } from '../engines/monogramEngine';
import type { PromoCodeId } from '../types/commerce';
import { ProductArt } from './ProductArt';

const TEST_PROMO_PILLS: PromoCodeId[] = ['VERA15', 'ATELIER50', 'VIP200'];

export const BagDrawer: React.FC = () => {
  const {
    locale,
    currency,
    cart,
    cartTotals,
    bagOpen,
    setBagOpen,
    setBagItemQty,
    removeBagItem,
    activePromoCode,
    applyPromoCode,
    clearPromoCode,
    giftWrap,
    setGiftWrap,
    giftNote,
    setGiftNote,
    setCheckoutOpen,
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{
    tone: 'success' | 'warn' | 'error';
    text: string;
  } | null>(null);

  if (!bagOpen) return null;

  const copy = t(locale);

  const handleApplyPromo = (raw: string) => {
    const res = applyPromoCode(raw);
    switch (res.status) {
      case 'APPLIED':
        setPromoFeedback({ tone: 'success', text: `${res.code}: ${copy.promoMsgApplied}` });
        setPromoInput('');
        break;
      case 'DUPLICATE_CODE':
        setPromoFeedback({ tone: 'warn', text: `${res.code}: ${copy.promoMsgDuplicate}` });
        break;
      case 'MIN_SPEND_NOT_MET':
        setPromoFeedback({
          tone: 'error',
          text: `${res.code}: ${copy.promoMsgMinSpend} ${formatMoney(
            res.remainingUsdForMinSpend ?? 0,
            currency
          )}`,
        });
        break;
      case 'EMPTY_CART':
        setPromoFeedback({ tone: 'error', text: copy.promoMsgEmpty });
        break;
      case 'INVALID_CODE':
      default:
        setPromoFeedback({ tone: 'error', text: copy.promoMsgInvalid });
        break;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex justify-end bg-black/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={copy.bagTitle}
      onClick={() => setBagOpen(false)}
    >
      <div
        data-testid="bag-drawer"
        onClick={(e) => e.stopPropagation()}
        className="animate-drawer-right flex h-full w-full max-w-[500px] flex-col border-l border-[var(--hairline-strong)] bg-[var(--surface)] shadow-[var(--shadow-drawer)]"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[var(--hairline)] px-6 py-5">
          <div>
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
              ATELIER DISPATCH · {cartTotals.totalUnits} UNIT(S)
            </p>
            <h2 className="mt-0.5 font-serif-editorial text-2xl text-[var(--ink)]">
              {copy.bagTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setBagOpen(false)}
            aria-label="Close shopping bag"
            className="flex h-8 w-8 items-center justify-center border border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--ink)]"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Free Express Courier Progress Bar ($350) */}
        <div className="border-b border-[var(--hairline)] bg-[var(--bg)] px-6 py-3.5">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="inline-flex items-center gap-2 text-[var(--ink)]">
              <Truck size={14} strokeWidth={1.5} className="text-[var(--accent)]" />
              {cartTotals.freeShippingRemainingUsd === 0 && cartTotals.totalUnits > 0
                ? copy.bagFreeCourierUnlocked
                : `${copy.bagFreeCourierRemaining}: ${formatMoney(
                    cartTotals.freeShippingRemainingUsd,
                    currency
                  )}`}
            </span>
            <span className="font-mono-tech text-[10px] text-[var(--ink-muted)]">
              {cartTotals.freeShippingProgress}%
            </span>
          </div>
          <div className="mt-2 h-1 w-full bg-[var(--hairline)]">
            <div
              className="h-full bg-[var(--olive)] transition-all duration-500"
              style={{ width: `${cartTotals.freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-14 text-center">
              <p className="font-serif-editorial text-2xl text-[var(--ink)]">
                {copy.bagEmptyTitle}
              </p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-[var(--ink-muted)]">
                {copy.bagEmptySub}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Matched Stylist Wardrobe Bundle (-12%) Alert */}
              {cartTotals.matchedStylistBundles.length > 0 && (
                <div
                  data-testid="bag-stylist-bundle-badge"
                  className="border border-[var(--olive)]/45 bg-[var(--olive)]/12 px-4 py-3 text-xs text-[var(--olive)]"
                >
                  {cartTotals.matchedStylistBundles.map((match) => (
                    <div
                      key={match.bundleId}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="font-medium">
                        {copy.bagStylistDiscount}
                      </span>
                      <span className="font-mono-tech">
                        -{formatMoney(match.savingsUsd, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Matched Lookbook Bundle Alert */}
              {cartTotals.matchedLookbooks.length > 0 && (
                <div
                  data-testid="bag-bundle-badge"
                  className="border border-[var(--olive)]/40 bg-[var(--olive)]/10 px-4 py-3 text-xs text-[var(--olive)]"
                >
                  {cartTotals.matchedLookbooks.map((match) => (
                    <div
                      key={match.lookbookId}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="font-medium">
                        {match.title[locale]} (×{match.count}) · -10%
                      </span>
                      <span className="font-mono-tech">
                        -{formatMoney(match.savingsUsd, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cart Items */}
              <div className="space-y-3.5">
                {cart.map((item) => {
                  const prod = PRODUCT_BY_ID[item.productId];
                  if (!prod) return null;
                  const cw =
                    prod.colorways.find((c) => c.id === item.colorwayId) ??
                    prod.colorways[0];

                  return (
                    <div
                      key={item.key}
                      className="flex gap-4 border border-[var(--hairline)] bg-[var(--bg)] p-3.5"
                    >
                      <div className="h-24 w-20 shrink-0 border border-[var(--hairline)] bg-[var(--studio-bg)] p-1.5">
                        <ProductArt product={prod} colorway={cw} />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono-tech text-[10px] text-[var(--ink-muted)]">
                              {prod.sku} · {item.size}
                            </span>
                            <span className="font-mono-tech text-xs text-[var(--ink)]">
                              {formatMoney(prod.priceUsd * item.quantity, currency)}
                            </span>
                          </div>
                          <h3 className="mt-0.5 truncate font-serif-editorial text-lg text-[var(--ink)]">
                            {prod.name[locale]}
                          </h3>
                          <p className="truncate font-mono-tech text-[10px] text-[var(--ink-muted)]">
                            {item.customMeta ?? cw.name[locale]}
                          </p>
                          {item.monogram && (
                            <p
                              data-testid="bag-item-monogram"
                              className="mt-1 inline-block border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-1.5 py-0.5 font-mono-tech text-[9.5px] text-[var(--accent)]"
                            >
                              {formatMonogramLine(item.monogram, locale)}
                            </p>
                          )}
                        </div>

                        <div className="mt-2.5 flex items-center justify-between">
                          <div className="inline-flex items-center border border-[var(--hairline-strong)] bg-[var(--surface)]">
                            <button
                              type="button"
                              onClick={() => setBagItemQty(item.key, item.quantity - 1)}
                              aria-label="Decrease quantity"
                              className="flex h-7 w-7 items-center justify-center text-[var(--ink)] hover:bg-[var(--bg)]"
                            >
                              <Minus size={12} strokeWidth={1.5} />
                            </button>
                            <span className="min-w-[28px] text-center font-mono-tech text-xs text-[var(--ink)]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setBagItemQty(item.key, item.quantity + 1)}
                              aria-label="Increase quantity"
                              className="flex h-7 w-7 items-center justify-center text-[var(--ink)] hover:bg-[var(--bg)]"
                            >
                              <Plus size={12} strokeWidth={1.5} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeBagItem(item.key)}
                            aria-label="Remove item"
                            className="flex h-7 w-7 items-center justify-center text-[var(--ink-muted)] hover:text-[var(--accent)]"
                          >
                            <Trash2 size={14} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Atelier Gift Wrapping Toggle (+$18) + Custom Note */}
              <div className="border border-[var(--hairline)] bg-[var(--bg)] p-4">
                <label className="flex cursor-pointer items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      data-testid="gift-wrap-toggle"
                      checked={giftWrap}
                      onChange={(e) => setGiftWrap(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                    />
                    <div>
                      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink)]">
                        <Gift size={13} strokeWidth={1.5} className="text-[var(--accent)]" />
                        {copy.bagGiftWrapTitle}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                        {copy.bagGiftWrapDesc}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono-tech text-xs text-[var(--ink)]">
                    +{formatMoney(GIFT_WRAP_FEE_USD, currency)}
                  </span>
                </label>

                {giftWrap && (
                  <textarea
                    rows={2}
                    maxLength={140}
                    value={giftNote}
                    onChange={(e) => setGiftNote(e.target.value)}
                    placeholder={copy.bagGiftNotePlaceholder}
                    className="mt-3 w-full border border-[var(--hairline-strong)] bg-[var(--surface)] p-2.5 text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)] focus:outline-none"
                  />
                )}
              </div>

              {/* Idempotent Promo Code Engine */}
              <div className="border border-[var(--hairline)] bg-[var(--bg)] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    <Tag size={12} strokeWidth={1.5} />
                    {copy.bagPromoLabel}
                  </span>
                  {activePromoCode && (
                    <button
                      type="button"
                      onClick={() => {
                        clearPromoCode();
                        setPromoFeedback(null);
                      }}
                      className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[var(--accent)] hover:underline"
                    >
                      {activePromoCode} · {copy.bagPromoRemove}
                    </button>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleApplyPromo(promoInput);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    data-testid="promo-input"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder={copy.bagPromoPlaceholder}
                    className="h-9 flex-1 border border-[var(--hairline-strong)] bg-[var(--surface)] px-3 font-mono-tech text-xs uppercase text-[var(--ink)] placeholder:normal-case placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)] focus:outline-none"
                  />
                  <button
                    type="submit"
                    data-testid="promo-apply-btn"
                    className="border border-[var(--ink)] bg-[var(--ink)] px-4 font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--accent)]"
                  >
                    {copy.bagPromoApply}
                  </button>
                </form>

                {/* Concierge Test Code Pills */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="font-mono-tech text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    {copy.bagPromoTestPills}
                  </span>
                  {TEST_PROMO_PILLS.map((code) => (
                    <button
                      key={code}
                      type="button"
                      data-testid={`promo-pill-${code}`}
                      onClick={() => handleApplyPromo(code)}
                      className={`border px-2 py-0.5 font-mono-tech text-[10px] transition-colors ${
                        activePromoCode === code
                          ? 'border-[var(--olive)] bg-[var(--olive)] text-white'
                          : 'border-[var(--hairline-strong)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>

                {promoFeedback && (
                  <p
                    data-testid="promo-feedback"
                    className={`mt-2.5 text-[11px] ${
                      promoFeedback.tone === 'success'
                        ? 'text-[var(--olive)]'
                        : promoFeedback.tone === 'warn'
                        ? 'text-[var(--accent)]'
                        : 'text-[#B83227]'
                    }`}
                  >
                    {promoFeedback.text}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Totals Footer & Checkout Trigger */}
        {cart.length > 0 && (
          <div className="border-t border-[var(--hairline)] bg-[var(--bg)] px-6 py-5">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[var(--ink-muted)]">
                <span>{copy.bagSubtotal}</span>
                <span className="font-mono-tech">
                  {formatMoney(cartTotals.merchandiseSubtotalUsd, currency)}
                </span>
              </div>

              {cartTotals.stylistDiscountUsd > 0 && (
                <div className="flex justify-between text-[var(--olive)]">
                  <span>{copy.bagStylistDiscount}</span>
                  <span className="font-mono-tech">
                    -{formatMoney(cartTotals.stylistDiscountUsd, currency)}
                  </span>
                </div>
              )}

              {cartTotals.lookbookDiscountUsd > 0 && (
                <div className="flex justify-between text-[var(--olive)]">
                  <span>{copy.bagLookbookDiscount}</span>
                  <span className="font-mono-tech">
                    -{formatMoney(cartTotals.lookbookDiscountUsd, currency)}
                  </span>
                </div>
              )}

              {cartTotals.promoDiscountUsd > 0 && (
                <div className="flex justify-between text-[var(--olive)]">
                  <span>
                    {copy.bagPromoDiscount} ({activePromoCode})
                  </span>
                  <span className="font-mono-tech">
                    -{formatMoney(cartTotals.promoDiscountUsd, currency)}
                  </span>
                </div>
              )}

              {cartTotals.giftWrapUsd > 0 && (
                <div className="flex justify-between text-[var(--ink-muted)]">
                  <span>{copy.bagGiftWrapLine}</span>
                  <span className="font-mono-tech">
                    +{formatMoney(cartTotals.giftWrapUsd, currency)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-[var(--ink-muted)]">
                <span>{copy.bagShipping}</span>
                <span className="font-mono-tech">
                  {cartTotals.shippingUsd === 0
                    ? copy.bagShippingFree
                    : formatMoney(cartTotals.shippingUsd, currency)}
                </span>
              </div>

              <div className="flex justify-between border-t border-[var(--hairline)] pt-2.5 text-sm font-medium text-[var(--ink)]">
                <span>{copy.bagTotal}</span>
                <span data-testid="bag-grand-total" className="font-mono-tech text-base">
                  {formatMoney(cartTotals.grandTotalUsd, currency)}
                </span>
              </div>
            </div>

            <button
              type="button"
              data-testid="proceed-checkout-btn"
              onClick={() => {
                setBagOpen(false);
                setCheckoutOpen(true);
              }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-[var(--ink)] bg-[var(--ink)] px-5 py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--surface)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
            >
              <span>{copy.bagProceedCheckout}</span>
              <ArrowRight size={14} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
