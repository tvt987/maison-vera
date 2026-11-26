import { describe, expect, it } from 'vitest';
import { PRODUCT_BY_ID } from '../../data/catalog';
import { LOOKBOOKS } from '../../data/lookbooks';
import {
  calculateCartTotals,
  evaluatePromoCode,
  FREE_SHIPPING_THRESHOLD_USD,
  GIFT_WRAP_FEE_USD,
  STANDARD_SHIPPING_USD,
  updateCartItemQty,
  upsertCartItem,
} from '../cartEngine';

describe('cart, lookbook bundle, gift wrap & idempotent promo engine', () => {
  it('computes subtotal, standard shipping below $350, and gift wrap fee', () => {
    const items = upsertCartItem([], {
      productId: 'mv-obj-01', // $290
      size: 'OS',
      colorwayId: 'obj01-sand',
    });

    const totals = calculateCartTotals(items, PRODUCT_BY_ID, LOOKBOOKS, null, true);
    expect(totals.merchandiseSubtotalUsd).toBe(290);
    expect(totals.shippingUsd).toBe(STANDARD_SHIPPING_USD);
    expect(totals.freeShippingRemainingUsd).toBe(FREE_SHIPPING_THRESHOLD_USD - 290);
    expect(totals.giftWrapUsd).toBe(GIFT_WRAP_FEE_USD);
    expect(totals.grandTotalUsd).toBe(290 + STANDARD_SHIPPING_USD + GIFT_WRAP_FEE_USD);
  });

  it('unlocks free express courier at or above $350', () => {
    const items = upsertCartItem([], {
      productId: 'mv-eye-01', // $480
      size: 'OS',
      colorwayId: 'eye01-titan',
    });
    const totals = calculateCartTotals(items, PRODUCT_BY_ID, LOOKBOOKS, null, false);
    expect(totals.shippingUsd).toBe(0);
    expect(totals.freeShippingProgress).toBe(100);
    expect(totals.grandTotalUsd).toBe(480);
  });

  it('automatically detects a complete 3-piece Lookbook bundle and applies -10% discount', () => {
    // Look 01: mv-eye-01 ($480) + mv-out-01 ($890) + mv-lth-01 ($1180) = $2,550
    let items = upsertCartItem([], {
      productId: 'mv-eye-01',
      size: 'OS',
      colorwayId: 'eye01-titan',
    });
    items = upsertCartItem(items, {
      productId: 'mv-out-01',
      size: 'M',
      colorwayId: 'out01-sand',
    });
    items = upsertCartItem(items, {
      productId: 'mv-lth-01',
      size: 'OS',
      colorwayId: 'lth01-noir',
    });

    const totals = calculateCartTotals(items, PRODUCT_BY_ID, LOOKBOOKS, null, false);
    expect(totals.merchandiseSubtotalUsd).toBe(2550);
    expect(totals.lookbookDiscountUsd).toBe(255);
    expect(totals.matchedLookbooks).toHaveLength(1);
    expect(totals.postBundleSubtotalUsd).toBe(2295);
    expect(totals.grandTotalUsd).toBe(2295);
  });

  it('enforces promo code idempotency, invalid code guard, and VIP200 min-spend guard', () => {
    expect(evaluatePromoCode('VERA15', null, 0).status).toBe('EMPTY_CART');
    expect(evaluatePromoCode('UNKNOWN99', null, 500).status).toBe('INVALID_CODE');

    // First apply VERA15 -> APPLIED
    const first = evaluatePromoCode('vera15 ', null, 500);
    expect(first).toEqual({ status: 'APPLIED', code: 'VERA15' });

    // Re-applying VERA15 -> DUPLICATE_CODE (idempotent!)
    const dup = evaluatePromoCode('VERA15', 'VERA15', 500);
    expect(dup).toEqual({ status: 'DUPLICATE_CODE', code: 'VERA15' });

    // VIP200 under $1,000 -> MIN_SPEND_NOT_MET with exact delta
    const belowMin = evaluatePromoCode('VIP200', null, 760);
    expect(belowMin).toEqual({
      status: 'MIN_SPEND_NOT_MET',
      code: 'VIP200',
      remainingUsdForMinSpend: 240,
    });

    // VIP200 at $1,240 -> APPLIED
    const validVip = evaluatePromoCode('VIP200', null, 1240);
    expect(validVip).toEqual({ status: 'APPLIED', code: 'VIP200' });
  });

  it('stacks VERA15 cleanly on post-bundle subtotal and handles quantity updates', () => {
    let items = upsertCartItem([], {
      productId: 'mv-eye-01',
      size: 'OS',
      colorwayId: 'eye01-titan',
    });
    items = updateCartItemQty(items, items[0].key, 2); // $960
    const withVera15 = calculateCartTotals(
      items,
      PRODUCT_BY_ID,
      LOOKBOOKS,
      'VERA15',
      false
    );
    expect(withVera15.promoDiscountUsd).toBe(144);
    expect(withVera15.grandTotalUsd).toBe(816);

    const withAtelier50 = calculateCartTotals(
      items,
      PRODUCT_BY_ID,
      LOOKBOOKS,
      'ATELIER50',
      true
    );
    expect(withAtelier50.promoDiscountUsd).toBe(50);
    expect(withAtelier50.giftWrapUsd).toBe(18);
    expect(withAtelier50.grandTotalUsd).toBe(960 - 50 + 18);
  });

  it('automatically applies -12% Stylist Wardrobe bundle savings without double-stacking Lookbook discount', () => {
    const bundleId = 'stylist-gallery-opening-alabaster-sand-signature';
    let items = upsertCartItem([], {
      productId: 'mv-out-01', // $890
      size: 'M',
      colorwayId: 'out01-sand',
      stylistBundleId: bundleId,
    });
    items = upsertCartItem(items, {
      productId: 'mv-eye-01', // $480
      size: 'OS',
      colorwayId: 'eye01-titan',
      stylistBundleId: bundleId,
    });
    items = upsertCartItem(items, {
      productId: 'mv-lth-01', // $1180
      size: 'OS',
      colorwayId: 'lth01-sand',
      stylistBundleId: bundleId,
    });

    const totals = calculateCartTotals(items, PRODUCT_BY_ID, LOOKBOOKS, null, false);
    expect(totals.merchandiseSubtotalUsd).toBe(2550);
    expect(totals.stylistDiscountUsd).toBe(306);
    expect(totals.lookbookDiscountUsd).toBe(0);
    expect(totals.grandTotalUsd).toBe(2244);
  });
});
