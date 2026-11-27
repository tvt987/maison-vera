import React, { useEffect, useState } from 'react';
import {
  Building2,
  Check,
  Copy,
  CreditCard,
  PackageCheck,
  Printer,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PRODUCT_BY_ID } from '../data/catalog';
import { t } from '../data/i18n';
import {
  deliveryFormSchema,
  generateDeterministicOrderId,
  paymentFormSchema,
  type DeliveryFormValues,
} from '../engines/checkoutSchema';
import { formatMoney } from '../engines/currency';
import { formatMonogramLine } from '../engines/monogramEngine';
import {
  buildMbBankVietQrUrl,
  computeVietQrAmountVnd,
  formatVndPlain,
  MBBANK_VIETQR_CONFIG,
} from '../engines/vietQr';
import type {
  OrderRecord,
  PaymentMethod,
  VietQrSettlementMode,
} from '../types/commerce';

/**
 * Deterministic SVG Barcode + QR Matrix Seal derived from Order ID
 */
const ArchivalBarcodeSeal: React.FC<{ orderId: string }> = ({ orderId }) => {
  const bars: { x: number; w: number }[] = [];
  let cursor = 6;
  for (let i = 0; i < 36; i++) {
    const code = orderId.charCodeAt(i % orderId.length) + i * 17;
    const w = (code % 3) + 1.4;
    const gap = (code % 2) + 1.8;
    bars.push({ x: cursor, w });
    cursor += w + gap;
  }

  // 7x7 deterministic architectural QR matrix
  const qrCells: { r: number; c: number }[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const corner =
        (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2);
      const hashBit =
        (orderId.charCodeAt((r * 7 + c) % orderId.length) + r * 11 + c * 7) % 2 ===
        0;
      if (corner || hashBit) {
        qrCells.push({ r, c });
      }
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 border border-[var(--hairline)] bg-[var(--bg)] p-3.5">
      <div className="min-w-0 flex-1">
        <svg viewBox="0 0 180 42" className="h-10 w-full max-w-[200px]" aria-label={`Barcode ${orderId}`}>
          {bars.map((b, idx) => (
            <rect
              key={idx}
              x={b.x}
              y={2}
              width={b.w}
              height={32}
              fill="currentColor"
            />
          ))}
        </svg>
        <p className="mt-1 font-mono-tech text-[10px] tracking-[0.22em] text-[var(--ink-muted)]">
          {orderId} · AUTH SEAL
        </p>
      </div>

      <svg
        viewBox="0 0 42 42"
        className="h-12 w-12 shrink-0 border border-[var(--hairline-strong)] p-1"
        aria-label={`QR seal ${orderId}`}
      >
        {qrCells.map(({ r, c }) => (
          <rect
            key={`${r}-${c}`}
            x={c * 6}
            y={r * 6}
            width={5}
            height={5}
            fill="currentColor"
          />
        ))}
      </svg>
    </div>
  );
};

export const CheckoutModal: React.FC = () => {
  const {
    locale,
    currency,
    cart,
    cartTotals,
    activePromoCode,
    giftWrap,
    giftNote,
    checkoutOpen,
    setCheckoutOpen,
    clearBagAfterOrder,
  } = useStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [delivery, setDelivery] = useState<DeliveryFormValues>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    companyName: '',
  });
  const [deliveryErrors, setDeliveryErrors] = useState<Record<string, string>>({});

  const [payMethod, setPayMethod] = useState<PaymentMethod>('vietqr-mbbank');
  const [vietQrMode, setVietQrMode] = useState<VietQrSettlementMode>('deposit-30');
  const [copiedField, setCopiedField] = useState<'account' | 'memo' | null>(null);
  const [cardNumber, setCardNumber] = useState('4532 8910 4421 9084');
  const [cardHolder, setCardHolder] = useState('TRUONG VAN TINH');
  const [cardExpiry, setCardExpiry] = useState('11/29');
  const [cardCvc, setCardCvc] = useState('842');
  const [b2bVatId, setB2bVatId] = useState('FR84910283741');
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);
  const [trackingStage, setTrackingStage] = useState<number>(1);

  // Reset modal flow whenever opened fresh
  useEffect(() => {
    if (checkoutOpen && !confirmedOrder) {
      setStep(1);
      setDeliveryErrors({});
      setPaymentErrors({});
    }
  }, [checkoutOpen, confirmedOrder]);

  // Animate live tracking progress gently on Step 3
  useEffect(() => {
    if (step !== 3) return;
    setTrackingStage(1);
    const t1 = window.setTimeout(() => setTrackingStage(2), 900);
    const t2 = window.setTimeout(() => setTrackingStage(3), 2100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [step]);

  if (!checkoutOpen) return null;

  const copy = t(locale);

  const handleClose = () => {
    setCheckoutOpen(false);
    if (confirmedOrder) {
      setConfirmedOrder(null);
      setStep(1);
    }
  };

  const autofillDemoClient = () => {
    setDelivery({
      fullName: 'Truong Van Tinh',
      email: 'tinhkun102@gmail.com',
      phone: '+84 931 467 024',
      address: '14 Rue des Francs-Bourgeois, Le Marais',
      city: 'Paris',
      country: 'France',
      postalCode: '75003',
      companyName: 'Maison Atelier Holdings',
    });
    setCardHolder('TRUONG VAN TINH');
    setDeliveryErrors({});
  };

  const handleDeliveryNext = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = deliveryFormSchema.safeParse(delivery);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        errs[key] = issue.message;
      }
      setDeliveryErrors(errs);
      return;
    }
    setDeliveryErrors({});
    setStep(2);
  };

  const previewOrderSeed = `${delivery.email || 'vip@maison-vera.paris'}|${cartTotals.grandTotalUsd}|${activePromoCode ?? 'NONE'}|${cart
    .map((i) => `${i.productId}:${i.quantity}`)
    .join(',')}`;
  const previewOrderRef = generateDeterministicOrderId(previewOrderSeed);
  const vietQrAmountVnd = computeVietQrAmountVnd(cartTotals.grandTotalUsd, vietQrMode);
  const vietQrMemo = `${previewOrderRef} ${vietQrMode === 'deposit-30' ? 'VIP30' : 'FULL'}`;
  const vietQrUrl = buildMbBankVietQrUrl({
    amountVnd: vietQrAmountVnd,
    transferRef: vietQrMemo,
  });

  const handleCopyText = (field: 'account' | 'memo', text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 1800);
  };

  const handleAuthorizeOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = paymentFormSchema.safeParse({
      method: payMethod,
      vietQrMode,
      cardNumber,
      cardHolder,
      cardExpiry,
      cardCvc,
      b2bVatId,
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'payment');
        errs[key] = issue.message;
      }
      setPaymentErrors(errs);
      return;
    }

    setPaymentErrors({});
    const orderId = previewOrderRef;

    const record: OrderRecord = {
      orderId,
      createdAtIso: new Date().toISOString(),
      currency,
      paymentMethod: payMethod,
      vietQrMode: payMethod === 'vietqr-mbbank' ? vietQrMode : undefined,
      vietQrAmountVnd: payMethod === 'vietqr-mbbank' ? vietQrAmountVnd : undefined,
      customer: { ...delivery },
      items: cart
        .map((item) => {
          const prod = PRODUCT_BY_ID[item.productId];
          if (!prod) return null;
          const cw =
            prod.colorways.find((c) => c.id === item.colorwayId) ??
            prod.colorways[0];
          return {
            sku: prod.sku,
            name: prod.name,
            size: item.size,
            colorwayName: cw.name,
            quantity: item.quantity,
            unitPriceUsd: prod.priceUsd,
            unitPriceAddonUsd: item.unitPriceAddonUsd,
            customMeta: item.customMeta,
            bespokeSummary: item.bespokeSummary,
            monogram: item.monogram,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
      giftWrap,
      giftNote,
      promoCode: activePromoCode,
      totals: { ...cartTotals },
    };

    setConfirmedOrder(record);
    clearBagAfterOrder(record);
    setStep(3);
  };

  const trackingStages = [
    copy.receiptStage1,
    copy.receiptStage2,
    copy.receiptStage3,
    copy.receiptStage4,
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={copy.checkoutTitle}
      onClick={handleClose}
    >
      <div
        id="printable-invoice"
        data-testid="checkout-modal"
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-in flex max-h-[92vh] w-full max-w-[820px] flex-col overflow-hidden border border-[var(--hairline-strong)] bg-[var(--surface)] shadow-2xl"
      >
        {/* Top Header + Stepper */}
        <div className="border-b border-[var(--hairline)] px-6 py-5 sm:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
                MAISON VÉRA · PARIS FLAGSHIP
              </p>
              <h2 className="mt-0.5 font-serif-editorial text-2xl text-[var(--ink)] sm:text-3xl">
                {copy.checkoutTitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close checkout"
              className="no-print flex h-8 w-8 items-center justify-center border border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--ink)]"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>

          <div className="no-print mt-4 grid grid-cols-3 gap-2">
            {[
              [1, copy.checkoutStep1],
              [2, copy.checkoutStep2],
              [3, copy.checkoutStep3],
            ].map(([idx, label]) => {
              const active = step === idx;
              const done = step > Number(idx);
              return (
                <div
                  key={String(idx)}
                  className={`border px-3 py-2 font-mono-tech text-[10px] uppercase tracking-[0.14em] ${
                    active
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                      : done
                      ? 'border-[var(--olive)] bg-[var(--olive)]/10 text-[var(--olive)]'
                      : 'border-[var(--hairline)] bg-[var(--bg)] text-[var(--ink-muted)]'
                  }`}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Step Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {/* STEP 1: Concierge Delivery */}
          {step === 1 && (
            <form onSubmit={handleDeliveryNext} className="space-y-4">
              <div className="flex items-center justify-between border border-[var(--hairline)] bg-[var(--bg)] px-4 py-3">
                <span className="text-xs text-[var(--ink-muted)]">
                  {locale === 'en'
                    ? 'Need rapid evaluation? Populate sample Parisian concierge profile.'
                    : 'Cần kiểm thử nhanh? Điền tự động hồ sơ khách hàng mẫu Paris.'}
                </span>
                <button
                  type="button"
                  data-testid="checkout-autofill-btn"
                  onClick={autofillDemoClient}
                  className="inline-flex shrink-0 items-center gap-1.5 border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[var(--accent-contrast)] hover:opacity-90"
                >
                  <Sparkles size={12} strokeWidth={1.5} />
                  {copy.checkoutAutofill}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {copy.checkoutFullName} *
                  </label>
                  <input
                    type="text"
                    value={delivery.fullName}
                    onChange={(e) =>
                      setDelivery((d) => ({ ...d, fullName: e.target.value }))
                    }
                    className="h-10 w-full border border-[var(--hairline-strong)] bg-[var(--bg)] px-3 text-xs text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
                  />
                  {deliveryErrors.fullName && (
                    <p className="mt-1 text-[11px] text-[#B83227]">
                      {deliveryErrors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {copy.checkoutEmail} *
                  </label>
                  <input
                    type="email"
                    value={delivery.email}
                    onChange={(e) =>
                      setDelivery((d) => ({ ...d, email: e.target.value }))
                    }
                    className="h-10 w-full border border-[var(--hairline-strong)] bg-[var(--bg)] px-3 text-xs text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
                  />
                  {deliveryErrors.email && (
                    <p className="mt-1 text-[11px] text-[#B83227]">
                      {deliveryErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {copy.checkoutPhone} *
                  </label>
                  <input
                    type="tel"
                    value={delivery.phone}
                    onChange={(e) =>
                      setDelivery((d) => ({ ...d, phone: e.target.value }))
                    }
                    className="h-10 w-full border border-[var(--hairline-strong)] bg-[var(--bg)] px-3 text-xs text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
                  />
                  {deliveryErrors.phone && (
                    <p className="mt-1 text-[11px] text-[#B83227]">
                      {deliveryErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {copy.checkoutCompany}
                  </label>
                  <input
                    type="text"
                    value={delivery.companyName ?? ''}
                    onChange={(e) =>
                      setDelivery((d) => ({ ...d, companyName: e.target.value }))
                    }
                    className="h-10 w-full border border-[var(--hairline-strong)] bg-[var(--bg)] px-3 text-xs text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {copy.checkoutAddress} *
                  </label>
                  <input
                    type="text"
                    value={delivery.address}
                    onChange={(e) =>
                      setDelivery((d) => ({ ...d, address: e.target.value }))
                    }
                    className="h-10 w-full border border-[var(--hairline-strong)] bg-[var(--bg)] px-3 text-xs text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
                  />
                  {deliveryErrors.address && (
                    <p className="mt-1 text-[11px] text-[#B83227]">
                      {deliveryErrors.address}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {copy.checkoutCity} *
                  </label>
                  <input
                    type="text"
                    value={delivery.city}
                    onChange={(e) =>
                      setDelivery((d) => ({ ...d, city: e.target.value }))
                    }
                    className="h-10 w-full border border-[var(--hairline-strong)] bg-[var(--bg)] px-3 text-xs text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
                  />
                  {deliveryErrors.city && (
                    <p className="mt-1 text-[11px] text-[#B83227]">
                      {deliveryErrors.city}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                      {copy.checkoutCountry} *
                    </label>
                    <input
                      type="text"
                      value={delivery.country}
                      onChange={(e) =>
                        setDelivery((d) => ({ ...d, country: e.target.value }))
                      }
                      className="h-10 w-full border border-[var(--hairline-strong)] bg-[var(--bg)] px-3 text-xs text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
                    />
                    {deliveryErrors.country && (
                      <p className="mt-1 text-[11px] text-[#B83227]">
                        {deliveryErrors.country}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                      {copy.checkoutPostal} *
                    </label>
                    <input
                      type="text"
                      value={delivery.postalCode}
                      onChange={(e) =>
                        setDelivery((d) => ({ ...d, postalCode: e.target.value }))
                      }
                      className="h-10 w-full border border-[var(--hairline-strong)] bg-[var(--bg)] px-3 text-xs text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
                    />
                    {deliveryErrors.postalCode && (
                      <p className="mt-1 text-[11px] text-[#B83227]">
                        {deliveryErrors.postalCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--hairline)] pt-5">
                <span className="font-mono-tech text-xs text-[var(--ink-muted)]">
                  {copy.bagTotal}:{' '}
                  <strong className="text-[var(--ink)]">
                    {formatMoney(cartTotals.grandTotalUsd, currency)}
                  </strong>
                </span>
                <button
                  type="submit"
                  data-testid="checkout-continue-payment"
                  className="border border-[var(--ink)] bg-[var(--ink)] px-6 py-3 text-xs font-medium uppercase tracking-[0.18em] text-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--accent)]"
                >
                  {copy.checkoutContinuePayment}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Payment — Live MBBank VietQR + Metallic Card + Apple Pay + B2B */}
          {step === 2 && (
            <form onSubmit={handleAuthorizeOrder} className="space-y-5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    ['vietqr-mbbank', copy.checkoutPayMethodVietQr, QrCode],
                    ['card', copy.checkoutPayMethodCard, CreditCard],
                    ['apple-pay', copy.checkoutPayMethodApple, Smartphone],
                    ['b2b-invoice', copy.checkoutPayMethodB2b, Building2],
                  ] as const
                ).map(([id, label, Icon]) => (
                  <button
                    key={id}
                    type="button"
                    data-testid={`pay-method-${id}`}
                    onClick={() => {
                      setPayMethod(id);
                      setPaymentErrors({});
                    }}
                    className={`flex items-center gap-2 border px-3 py-2.5 text-left text-[11px] transition-colors ${
                      payMethod === id
                        ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                        : 'border-[var(--hairline-strong)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--ink)]'
                    }`}
                  >
                    <Icon size={14} strokeWidth={1.5} className="shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>

              {payMethod === 'vietqr-mbbank' && (
                <div
                  data-testid="vietqr-mbbank-panel"
                  className="grid grid-cols-1 gap-5 border border-[var(--hairline-strong)] bg-[var(--bg)] p-5 md:grid-cols-12"
                >
                  {/* Live Scannable MBBank VietQR Image */}
                  <div className="flex flex-col items-center justify-center border border-[var(--hairline)] bg-white p-3 md:col-span-5">
                    <img
                      src={vietQrUrl}
                      alt={`MBBank VietQR ${MBBANK_VIETQR_CONFIG.accountNo} — ${MBBANK_VIETQR_CONFIG.accountName}`}
                      data-testid="mbbank-vietqr-img"
                      className="h-auto w-full max-w-[230px] object-contain"
                    />
                    <span className="mt-2 font-mono-tech text-[9.5px] uppercase tracking-[0.16em] text-[#111111]/70">
                      NAPAS 24/7 · MBBANK {MBBANK_VIETQR_CONFIG.bankBin}
                    </span>
                  </div>

                  {/* Settlement Toggle + Structured Bank Transfer Dossier */}
                  <div className="flex flex-col justify-between space-y-3.5 md:col-span-7">
                    <div>
                      <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                        VIP PRIVATE CLIENT TRANSFER · VIETQR LIVE
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                        {copy.checkoutVietQrNote}
                      </p>

                      {/* 30% Deposit vs 100% Full Settlement */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          data-testid="vietqr-mode-deposit"
                          onClick={() => setVietQrMode('deposit-30')}
                          className={`border px-3 py-2 text-left transition-colors ${
                            vietQrMode === 'deposit-30'
                              ? 'border-[var(--accent)] bg-[var(--surface)] text-[var(--ink)] ring-1 ring-[var(--accent)]'
                              : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-muted)]'
                          }`}
                        >
                          <span className="block font-mono-tech text-[9.5px] uppercase">
                            {copy.checkoutVietQrDeposit}
                          </span>
                          <span className="mt-0.5 block font-mono-tech text-xs font-medium text-[var(--accent)]">
                            {formatVndPlain(
                              computeVietQrAmountVnd(cartTotals.grandTotalUsd, 'deposit-30')
                            )}
                          </span>
                        </button>
                        <button
                          type="button"
                          data-testid="vietqr-mode-full"
                          onClick={() => setVietQrMode('full')}
                          className={`border px-3 py-2 text-left transition-colors ${
                            vietQrMode === 'full'
                              ? 'border-[var(--accent)] bg-[var(--surface)] text-[var(--ink)] ring-1 ring-[var(--accent)]'
                              : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-muted)]'
                          }`}
                        >
                          <span className="block font-mono-tech text-[9.5px] uppercase">
                            {copy.checkoutVietQrFull}
                          </span>
                          <span className="mt-0.5 block font-mono-tech text-xs font-medium text-[var(--ink)]">
                            {formatVndPlain(
                              computeVietQrAmountVnd(cartTotals.grandTotalUsd, 'full')
                            )}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Bank Details Table */}
                    <div className="space-y-2 border border-[var(--hairline)] bg-[var(--surface)] p-3.5 font-mono-tech text-[11px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[var(--ink-muted)]">BANK</span>
                        <span className="text-[var(--ink)]">
                          {MBBANK_VIETQR_CONFIG.bankShortName} ({MBBANK_VIETQR_CONFIG.bankBin})
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[var(--ink-muted)]">ACCOUNT</span>
                        <span className="inline-flex items-center gap-2 font-medium text-[var(--ink)]">
                          {MBBANK_VIETQR_CONFIG.accountNo}
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText('account', MBBANK_VIETQR_CONFIG.accountNo)
                            }
                            className="inline-flex items-center gap-1 border border-[var(--hairline-strong)] px-1.5 py-0.5 text-[9px] uppercase hover:border-[var(--accent)] hover:text-[var(--accent)]"
                          >
                            <Copy size={10} />
                            {copiedField === 'account'
                              ? copy.checkoutCopied
                              : copy.checkoutCopyAccount}
                          </button>
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[var(--ink-muted)]">HOLDER</span>
                        <span className="font-medium text-[var(--ink)]">
                          {MBBANK_VIETQR_CONFIG.accountName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[var(--ink-muted)]">MEMO</span>
                        <span className="inline-flex items-center gap-2 text-[var(--accent)]">
                          {vietQrMemo}
                          <button
                            type="button"
                            onClick={() => handleCopyText('memo', vietQrMemo)}
                            className="inline-flex items-center gap-1 border border-[var(--hairline-strong)] px-1.5 py-0.5 text-[9px] uppercase text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                          >
                            <Copy size={10} />
                            {copiedField === 'memo'
                              ? copy.checkoutCopied
                              : copy.checkoutCopyMemo}
                          </button>
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-[var(--hairline)] pt-2">
                        <span className="text-[var(--ink-muted)]">DUE NOW</span>
                        <span className="text-sm font-medium text-[var(--ink)]">
                          {formatVndPlain(vietQrAmountVnd)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {payMethod === 'card' && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                  {/* Live Brushed Titanium Private Client Card Preview */}
                  <div className="flex flex-col justify-between rounded-sm border border-white/15 bg-gradient-to-br from-[#1C1C21] via-[#2A292E] to-[#111114] p-5 text-[#F4EFE6] shadow-xl md:col-span-5">
                    <div className="flex items-center justify-between">
                      <span className="font-serif-editorial text-lg tracking-[0.2em]">
                        MAISON VÉRA
                      </span>
                      <span className="h-5 w-7 rounded-xs border border-[#D4B483]/70 bg-[#D4B483]/25" />
                    </div>
                    <p className="my-6 font-mono-tech text-sm tracking-[0.2em]">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </p>
                    <div className="flex items-end justify-between font-mono-tech text-[10px] uppercase tracking-[0.16em]">
                      <div>
                        <span className="block text-[8px] opacity-60">HOLDER</span>
                        <span>{cardHolder || 'PRIVATE CLIENT'}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] opacity-60">EXP</span>
                        <span>{cardExpiry || 'MM/YY'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Form Inputs */}
                  <div className="space-y-3 md:col-span-7">
                    <div>
                      <label className="mb-1 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                        {copy.checkoutCardNumber}
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="h-10 w-full border border-[var(--hairline-strong)] bg-[var(--bg)] px-3 font-mono-tech text-xs text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
                      />
                      {paymentErrors.cardNumber && (
                        <p className="mt-1 text-[11px] text-[#B83227]">
                          {paymentErrors.cardNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                        {copy.checkoutCardHolder}
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        className="h-10 w-full border border-[var(--hairline-strong)] bg-[var(--bg)] px-3 font-mono-tech text-xs uppercase text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
                      />
                      {paymentErrors.cardHolder && (
                        <p className="mt-1 text-[11px] text-[#B83227]">
                          {paymentErrors.cardHolder}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                          {copy.checkoutCardExpiry}
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="h-10 w-full border border-[var(--hairline-strong)] bg-[var(--bg)] px-3 font-mono-tech text-xs text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
                        />
                        {paymentErrors.cardExpiry && (
                          <p className="mt-1 text-[11px] text-[#B83227]">
                            {paymentErrors.cardExpiry}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                          {copy.checkoutCardCvc}
                        </label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="h-10 w-full border border-[var(--hairline-strong)] bg-[var(--bg)] px-3 font-mono-tech text-xs text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
                        />
                        {paymentErrors.cardCvc && (
                          <p className="mt-1 text-[11px] text-[#B83227]">
                            {paymentErrors.cardCvc}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {payMethod === 'apple-pay' && (
                <div className="border border-[var(--hairline-strong)] bg-[var(--bg)] p-6 text-center">
                  <ShieldCheck size={24} strokeWidth={1.5} className="mx-auto text-[var(--olive)]" />
                  <p className="mt-3 text-sm font-medium text-[var(--ink)]">
                    Apple Pay Express Passkey
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-xs text-[var(--ink-muted)]">
                    {copy.checkoutAppleNote}
                  </p>
                </div>
              )}

              {payMethod === 'b2b-invoice' && (
                <div className="space-y-3 border border-[var(--hairline-strong)] bg-[var(--bg)] p-5">
                  <p className="text-xs text-[var(--ink-muted)]">{copy.checkoutB2bNote}</p>
                  <div>
                    <label className="mb-1 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                      Corporate VAT / Tax Registration ID *
                    </label>
                    <input
                      type="text"
                      value={b2bVatId}
                      onChange={(e) => setB2bVatId(e.target.value)}
                      className="h-10 w-full border border-[var(--hairline-strong)] bg-[var(--surface)] px-3 font-mono-tech text-xs uppercase text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
                    />
                    {paymentErrors.b2bVatId && (
                      <p className="mt-1 text-[11px] text-[#B83227]">
                        {paymentErrors.b2bVatId}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline)] pt-5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border border-[var(--hairline-strong)] px-4 py-3 text-xs uppercase tracking-[0.16em] text-[var(--ink)] hover:border-[var(--ink)]"
                >
                  {copy.checkoutBackDelivery}
                </button>
                <button
                  type="submit"
                  data-testid="checkout-authorize-btn"
                  className="border border-[var(--ink)] bg-[var(--ink)] px-6 py-3 text-xs font-medium uppercase tracking-[0.18em] text-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--accent)]"
                >
                  {copy.checkoutAuthorize} · {formatMoney(cartTotals.grandTotalUsd, currency)}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Order Confirmed + Live Tracking Timeline + Printable Receipt */}
          {step === 3 && confirmedOrder && (
            <div data-testid="order-receipt" className="space-y-6">
              <div className="flex flex-col justify-between gap-4 border border-[var(--olive)]/40 bg-[var(--olive)]/10 p-5 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--olive)] text-white">
                    <PackageCheck size={16} strokeWidth={1.6} />
                  </span>
                  <div>
                    <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--olive)]">
                      {copy.receiptConfirmed}
                    </p>
                    <h3 className="mt-0.5 font-serif-editorial text-2xl text-[var(--ink)]">
                      {confirmedOrder.customer.fullName}
                    </h3>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {confirmedOrder.customer.address}, {confirmedOrder.customer.city},{' '}
                      {confirmedOrder.customer.country}
                    </p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <span className="block font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    {copy.receiptOrderId}
                  </span>
                  <span
                    data-testid="confirmed-order-id"
                    className="font-mono-tech text-lg font-medium text-[var(--ink)]"
                  >
                    {confirmedOrder.orderId}
                  </span>
                </div>
              </div>

              {/* Live Concierge Dispatch Timeline */}
              <div className="border border-[var(--hairline)] bg-[var(--bg)] p-5">
                <p className="mb-4 font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                  {copy.receiptTrackingTitle}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  {trackingStages.map((stageLabel, idx) => {
                    const reached = idx < trackingStage;
                    return (
                      <div
                        key={stageLabel}
                        className={`border p-3 transition-colors ${
                          reached
                            ? 'border-[var(--olive)] bg-[var(--surface)]'
                            : 'border-[var(--hairline)] bg-transparent opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono-tech text-[10px] text-[var(--ink-muted)]">
                            0{idx + 1}
                          </span>
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full ${
                              reached
                                ? 'bg-[var(--olive)] text-white'
                                : 'border border-[var(--hairline-strong)]'
                            }`}
                          >
                            {reached && <Check size={10} strokeWidth={2.5} />}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-medium text-[var(--ink)]">
                          {stageLabel}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Itemized Receipt + Barcode/QR Seal */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                <div className="space-y-2 border border-[var(--hairline)] p-4 md:col-span-7">
                  {confirmedOrder.items.map((item, idx) => (
                    <div
                      key={`${item.sku}-${idx}`}
                      className="flex items-start justify-between gap-2 border-b border-[var(--hairline)] pb-2 text-xs last:border-b-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium text-[var(--ink)]">
                          {item.name[locale]} × {item.quantity}
                        </p>
                        <p className="font-mono-tech text-[10px] text-[var(--ink-muted)]">
                          {item.sku} · {item.size} · {item.customMeta ?? item.colorwayName[locale]}
                        </p>
                        {item.bespokeSummary && (
                          <p className="mt-0.5 font-mono-tech text-[9.5px] text-[var(--olive)]">
                            {item.bespokeSummary}
                          </p>
                        )}
                        {item.monogram && (
                          <p
                            data-testid="receipt-item-monogram"
                            className="mt-0.5 font-mono-tech text-[9.5px] text-[var(--accent)]"
                          >
                            {formatMonogramLine(item.monogram, locale)}
                          </p>
                        )}
                      </div>
                      <span className="font-mono-tech text-[var(--ink)]">
                        {formatMoney(
                          (item.unitPriceUsd + (item.unitPriceAddonUsd ?? 0)) *
                            item.quantity,
                          currency
                        )}
                      </span>
                    </div>
                  ))}
                  {confirmedOrder.giftWrap && (
                    <p className="pt-2 text-[11px] italic text-[var(--ink-muted)]">
                      {copy.bagGiftWrapTitle}
                      {confirmedOrder.giftNote ? `: "${confirmedOrder.giftNote}"` : ''}
                    </p>
                  )}
                </div>

                <div className="space-y-4 md:col-span-5">
                  <div className="space-y-1.5 border border-[var(--hairline)] bg-[var(--bg)] p-4 text-xs">
                    <div className="flex justify-between text-[var(--ink-muted)]">
                      <span>{copy.bagSubtotal}</span>
                      <span className="font-mono-tech">
                        {formatMoney(confirmedOrder.totals.merchandiseSubtotalUsd, currency)}
                      </span>
                    </div>
                    {confirmedOrder.totals.stylistDiscountUsd > 0 && (
                      <div className="flex justify-between text-[var(--olive)]">
                        <span>{copy.bagStylistDiscount}</span>
                        <span className="font-mono-tech">
                          -{formatMoney(confirmedOrder.totals.stylistDiscountUsd, currency)}
                        </span>
                      </div>
                    )}
                    {confirmedOrder.totals.lookbookDiscountUsd > 0 && (
                      <div className="flex justify-between text-[var(--olive)]">
                        <span>{copy.bagLookbookDiscount}</span>
                        <span className="font-mono-tech">
                          -{formatMoney(confirmedOrder.totals.lookbookDiscountUsd, currency)}
                        </span>
                      </div>
                    )}
                    {confirmedOrder.totals.promoDiscountUsd > 0 && (
                      <div className="flex justify-between text-[var(--olive)]">
                        <span>
                          {copy.bagPromoDiscount} ({confirmedOrder.promoCode})
                        </span>
                        <span className="font-mono-tech">
                          -{formatMoney(confirmedOrder.totals.promoDiscountUsd, currency)}
                        </span>
                      </div>
                    )}
                    {confirmedOrder.totals.giftWrapUsd > 0 && (
                      <div className="flex justify-between text-[var(--ink-muted)]">
                        <span>{copy.bagGiftWrapLine}</span>
                        <span className="font-mono-tech">
                          +{formatMoney(confirmedOrder.totals.giftWrapUsd, currency)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-[var(--ink-muted)]">
                      <span>{copy.bagShipping}</span>
                      <span className="font-mono-tech">
                        {confirmedOrder.totals.shippingUsd === 0
                          ? copy.bagShippingFree
                          : formatMoney(confirmedOrder.totals.shippingUsd, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--hairline)] pt-2 text-sm font-medium text-[var(--ink)]">
                      <span>{copy.bagTotal}</span>
                      <span className="font-mono-tech">
                        {formatMoney(confirmedOrder.totals.grandTotalUsd, currency)}
                      </span>
                    </div>
                    {confirmedOrder.paymentMethod === 'vietqr-mbbank' &&
                      confirmedOrder.vietQrAmountVnd && (
                        <div className="mt-2 border-t border-[var(--hairline)] pt-2 font-mono-tech text-[10px] text-[var(--accent)]">
                          MBBank {MBBANK_VIETQR_CONFIG.accountNo} ·{' '}
                          {confirmedOrder.vietQrMode === 'deposit-30'
                            ? '30% VIP DEPOSIT'
                            : '100% VIETQR'}{' '}
                          ({formatVndPlain(confirmedOrder.vietQrAmountVnd)})
                        </div>
                      )}
                  </div>

                  <ArchivalBarcodeSeal orderId={confirmedOrder.orderId} />
                </div>
              </div>

              {/* Actions */}
              <div className="no-print flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline)] pt-4">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 border border-[var(--hairline-strong)] px-4 py-2.5 text-xs uppercase tracking-[0.16em] text-[var(--ink)] hover:border-[var(--ink)]"
                >
                  <Printer size={14} strokeWidth={1.5} />
                  {copy.receiptPrintInvoice}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="border border-[var(--ink)] bg-[var(--ink)] px-6 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--accent)]"
                >
                  {copy.receiptReturnStore}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
