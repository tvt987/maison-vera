import type {
  CartItem,
  CartTotals,
  LookbookPlate,
  Product,
  ProductSize,
  PromoCodeId,
  PromoEvaluationResult,
  PromoRule,
} from '../types/commerce';

export const FREE_SHIPPING_THRESHOLD_USD = 350;
export const STANDARD_SHIPPING_USD = 25;
export const GIFT_WRAP_FEE_USD = 18;

export const PROMO_RULES: Record<PromoCodeId, PromoRule> = {
  VERA15: {
    code: 'VERA15',
    type: 'percent',
    value: 15,
    minSpendUsd: 0,
    description: {
      en: '15% Atelier Privilege on entire order',
      vi: 'Giảm 15% Đặc Quyền Atelier toàn đơn hàng',
    },
  },
  ATELIER50: {
    code: 'ATELIER50',
    type: 'fixed',
    value: 50,
    minSpendUsd: 100,
    description: {
      en: '$50 instant reduction on orders from $100',
      vi: 'Giảm ngay $50 cho đơn từ $100',
    },
  },
  VIP200: {
    code: 'VIP200',
    type: 'fixed',
    value: 200,
    minSpendUsd: 1000,
    description: {
      en: '$200 Private Client reduction on orders $1,000+',
      vi: 'Giảm $200 Khách VIP cho đơn từ $1,000',
    },
  },
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function makeCartKey(
  productId: string,
  size: ProductSize,
  colorwayId: string,
  customMeta?: string
): string {
  return [productId, size, colorwayId, customMeta ?? ''].join('::');
}

export function upsertCartItem(
  items: CartItem[],
  payload: {
    productId: string;
    size: ProductSize;
    colorwayId: string;
    quantity?: number;
    customMeta?: string;
  },
  maxStock = 20
): CartItem[] {
  const qtyToAdd = Math.max(1, payload.quantity ?? 1);
  const key = makeCartKey(
    payload.productId,
    payload.size,
    payload.colorwayId,
    payload.customMeta
  );
  const existing = items.find((item) => item.key === key);

  if (existing) {
    return items.map((item) =>
      item.key === key
        ? { ...item, quantity: Math.min(maxStock, item.quantity + qtyToAdd) }
        : item
    );
  }

  return [
    ...items,
    {
      key,
      productId: payload.productId,
      size: payload.size,
      colorwayId: payload.colorwayId,
      quantity: Math.min(maxStock, qtyToAdd),
      customMeta: payload.customMeta,
    },
  ];
}

export function updateCartItemQty(
  items: CartItem[],
  key: string,
  nextQty: number,
  maxStock = 20
): CartItem[] {
  if (nextQty <= 0) {
    return items.filter((item) => item.key !== key);
  }
  const clamped = Math.min(maxStock, Math.floor(nextQty));
  return items.map((item) =>
    item.key === key ? { ...item, quantity: clamped } : item
  );
}

export function removeCartItem(items: CartItem[], key: string): CartItem[] {
  return items.filter((item) => item.key !== key);
}

export function evaluatePromoCode(
  rawCode: string,
  activePromoCode: PromoCodeId | null,
  postBundleSubtotalUsd: number
): PromoEvaluationResult {
  if (postBundleSubtotalUsd <= 0) {
    return { status: 'EMPTY_CART' };
  }

  const normalized = rawCode.trim().toUpperCase();
  if (!(normalized in PROMO_RULES)) {
    return { status: 'INVALID_CODE' };
  }

  const code = normalized as PromoCodeId;
  if (activePromoCode === code) {
    return { status: 'DUPLICATE_CODE', code };
  }

  const rule = PROMO_RULES[code];
  if (postBundleSubtotalUsd < rule.minSpendUsd) {
    return {
      status: 'MIN_SPEND_NOT_MET',
      code,
      remainingUsdForMinSpend: round2(rule.minSpendUsd - postBundleSubtotalUsd),
    };
  }

  return { status: 'APPLIED', code };
}

export function calculateCartTotals(
  items: CartItem[],
  productsById: Record<string, Product>,
  lookbooks: LookbookPlate[],
  activePromoCode: PromoCodeId | null,
  giftWrapEnabled: boolean
): CartTotals {
  let merchandiseSubtotalUsd = 0;
  let totalUnits = 0;
  const qtyByProductId: Record<string, number> = {};

  for (const item of items) {
    const product = productsById[item.productId];
    if (!product || item.quantity <= 0) continue;
    merchandiseSubtotalUsd += product.priceUsd * item.quantity;
    totalUnits += item.quantity;
    qtyByProductId[item.productId] =
      (qtyByProductId[item.productId] ?? 0) + item.quantity;
  }

  merchandiseSubtotalUsd = round2(merchandiseSubtotalUsd);

  const matchedLookbooks: CartTotals['matchedLookbooks'] = [];
  let lookbookDiscountUsd = 0;

  for (const look of lookbooks) {
    const requiredIds = look.hotspots.map((h) => h.productId);
    const completeSetCount = Math.min(
      ...requiredIds.map((pid) => qtyByProductId[pid] ?? 0)
    );
    if (completeSetCount > 0) {
      const singleBundleRetail = requiredIds.reduce(
        (sum, pid) => sum + (productsById[pid]?.priceUsd ?? 0),
        0
      );
      const savingsUsd = round2(
        singleBundleRetail * look.bundleDiscountRate * completeSetCount
      );
      lookbookDiscountUsd = round2(lookbookDiscountUsd + savingsUsd);
      matchedLookbooks.push({
        lookbookId: look.id,
        title: look.title,
        count: completeSetCount,
        savingsUsd,
      });
    }
  }

  const postBundleSubtotalUsd = round2(
    Math.max(0, merchandiseSubtotalUsd - lookbookDiscountUsd)
  );

  let promoDiscountUsd = 0;
  if (activePromoCode && postBundleSubtotalUsd > 0) {
    const rule = PROMO_RULES[activePromoCode];
    if (rule && postBundleSubtotalUsd >= rule.minSpendUsd) {
      promoDiscountUsd =
        rule.type === 'percent'
          ? round2((postBundleSubtotalUsd * rule.value) / 100)
          : round2(Math.min(postBundleSubtotalUsd, rule.value));
    }
  }

  const giftWrapUsd = totalUnits > 0 && giftWrapEnabled ? GIFT_WRAP_FEE_USD : 0;
  const shippingUsd =
    totalUnits === 0 || postBundleSubtotalUsd >= FREE_SHIPPING_THRESHOLD_USD
      ? 0
      : STANDARD_SHIPPING_USD;

  const freeShippingRemainingUsd = round2(
    Math.max(0, FREE_SHIPPING_THRESHOLD_USD - postBundleSubtotalUsd)
  );
  const freeShippingProgress = Math.min(
    100,
    Math.round((postBundleSubtotalUsd / FREE_SHIPPING_THRESHOLD_USD) * 100)
  );

  const grandTotalUsd = round2(
    Math.max(0, postBundleSubtotalUsd - promoDiscountUsd + giftWrapUsd + shippingUsd)
  );

  return {
    merchandiseSubtotalUsd,
    lookbookDiscountUsd,
    matchedLookbooks,
    postBundleSubtotalUsd,
    promoDiscountUsd,
    giftWrapUsd,
    shippingUsd,
    freeShippingThresholdUsd: FREE_SHIPPING_THRESHOLD_USD,
    freeShippingRemainingUsd,
    freeShippingProgress,
    grandTotalUsd,
    totalUnits,
  };
}
