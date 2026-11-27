import type {
  CartItem,
  CartTotals,
  FoilFinishId,
  LookbookPlate,
  Product,
  ProductSize,
  PromoCodeId,
  PromoEvaluationResult,
  PromoRule,
} from '../types/commerce';
import { serializeMonogram } from './monogramEngine';
import { STYLIST_BUNDLE_DISCOUNT_RATE } from './stylistEngine';

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
  PRIVATE10: {
    code: 'PRIVATE10',
    type: 'percent',
    value: 10,
    minSpendUsd: 0,
    description: {
      en: '10% Private Vault Member Invitation Privilege',
      vi: 'Giảm 10% Đặc Quyền Thành Viên Private Vault',
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
  customMeta?: string,
  monogram?: { text: string; foil: FoilFinishId },
  stylistBundleId?: string,
  bespokeSummary?: string,
  unitPriceAddonUsd?: number
): string {
  return [
    productId,
    size,
    colorwayId,
    customMeta ?? '',
    serializeMonogram(monogram),
    stylistBundleId ?? '',
    bespokeSummary ?? '',
    unitPriceAddonUsd ? String(unitPriceAddonUsd) : '',
  ].join('::');
}

export function upsertCartItem(
  items: CartItem[],
  payload: {
    productId: string;
    size: ProductSize;
    colorwayId: string;
    quantity?: number;
    customMeta?: string;
    unitPriceAddonUsd?: number;
    bespokeSummary?: string;
    monogram?: { text: string; foil: FoilFinishId };
    stylistBundleId?: string;
  },
  maxStock = 20
): CartItem[] {
  const qtyToAdd = Math.max(1, payload.quantity ?? 1);
  const addon = payload.unitPriceAddonUsd && payload.unitPriceAddonUsd > 0
    ? round2(payload.unitPriceAddonUsd)
    : undefined;
  const key = makeCartKey(
    payload.productId,
    payload.size,
    payload.colorwayId,
    payload.customMeta,
    payload.monogram,
    payload.stylistBundleId,
    payload.bespokeSummary,
    addon
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
      unitPriceAddonUsd: addon,
      bespokeSummary: payload.bespokeSummary,
      monogram: payload.monogram,
      stylistBundleId: payload.stylistBundleId,
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

  // Separate non-stylist items for Lookbook (-10%) matching so no piece double-stacks bundle discounts
  const nonStylistQtyByProductId: Record<string, number> = {};
  const stylistGroups: Record<string, CartItem[]> = {};

  for (const item of items) {
    const product = productsById[item.productId];
    if (!product || item.quantity <= 0) continue;
    const effectiveUnitUsd = product.priceUsd + Math.max(0, item.unitPriceAddonUsd ?? 0);
    merchandiseSubtotalUsd += effectiveUnitUsd * item.quantity;
    totalUnits += item.quantity;

    if (item.stylistBundleId) {
      if (!stylistGroups[item.stylistBundleId]) {
        stylistGroups[item.stylistBundleId] = [];
      }
      stylistGroups[item.stylistBundleId].push(item);
    } else {
      nonStylistQtyByProductId[item.productId] =
        (nonStylistQtyByProductId[item.productId] ?? 0) + item.quantity;
    }
  }

  merchandiseSubtotalUsd = round2(merchandiseSubtotalUsd);

  // 1. Stylist Wardrobe Bundle (-12%) when all 3 curated items of a stylistBundleId exist
  const matchedStylistBundles: CartTotals['matchedStylistBundles'] = [];
  let stylistDiscountUsd = 0;

  for (const [bundleId, groupItems] of Object.entries(stylistGroups)) {
    const uniqueIds = new Set(groupItems.map((i) => i.productId));
    if (uniqueIds.size >= 3) {
      const setCount = Math.min(...groupItems.map((i) => i.quantity));
      const singleSetRetail = groupItems.reduce(
        (sum, i) => sum + (productsById[i.productId]?.priceUsd ?? 0),
        0
      );
      const savingsUsd = round2(
        singleSetRetail * STYLIST_BUNDLE_DISCOUNT_RATE * setCount
      );
      stylistDiscountUsd = round2(stylistDiscountUsd + savingsUsd);
      matchedStylistBundles.push({ bundleId, savingsUsd });
    } else {
      // Partial stylist bundle falls back to regular Lookbook eligibility
      for (const item of groupItems) {
        nonStylistQtyByProductId[item.productId] =
          (nonStylistQtyByProductId[item.productId] ?? 0) + item.quantity;
      }
    }
  }

  // 2. Editorial Lookbook Bundle (-10%)
  const matchedLookbooks: CartTotals['matchedLookbooks'] = [];
  let lookbookDiscountUsd = 0;

  for (const look of lookbooks) {
    const requiredIds = look.hotspots.map((h) => h.productId);
    const completeSetCount = Math.min(
      ...requiredIds.map((pid) => nonStylistQtyByProductId[pid] ?? 0)
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
    Math.max(0, merchandiseSubtotalUsd - lookbookDiscountUsd - stylistDiscountUsd)
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
    stylistDiscountUsd,
    matchedLookbooks,
    matchedStylistBundles,
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
