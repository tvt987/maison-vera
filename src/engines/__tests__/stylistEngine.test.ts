import { describe, expect, it } from 'vitest';
import { PRODUCT_BY_ID } from '../../data/catalog';
import {
  curateAtelierWardrobe,
  STYLIST_BUNDLE_DISCOUNT_RATE,
} from '../stylistEngine';

describe('AI Atelier Stylist deterministic curator engine', () => {
  it('curates 3 distinct in-stock specimens with exact -12% wardrobe bundle savings', () => {
    const result = curateAtelierWardrobe(
      PRODUCT_BY_ID,
      'gallery-opening',
      'alabaster-sand',
      'signature'
    );

    expect(result.pieces).toHaveLength(3);
    expect(result.pieces.every((p) => p.product.stock > 0)).toBe(true);
    expect(new Set(result.pieces.map((p) => p.product.id)).size).toBe(3);

    const expectedRetail = result.pieces.reduce(
      (sum, p) => sum + p.product.priceUsd,
      0
    );
    expect(result.retailUsd).toBe(expectedRetail);
    expect(result.discountRate).toBe(STYLIST_BUNDLE_DISCOUNT_RATE);
    expect(result.savingsUsd).toBe(Math.round(expectedRetail * 0.12 * 100) / 100);
    expect(result.finalUsd).toBe(
      Math.round((expectedRetail - result.savingsUsd) * 100) / 100
    );
  });

  it('aligns colorway selection with requested palette tone', () => {
    const obsidian = curateAtelierWardrobe(
      PRODUCT_BY_ID,
      'gallery-opening',
      'obsidian-monochrome',
      'signature'
    );
    const terracotta = curateAtelierWardrobe(
      PRODUCT_BY_ID,
      'gallery-opening',
      'terracotta-warmth',
      'collector'
    );

    expect(obsidian.pieces.some((p) => p.colorway.family === 'Obsidian')).toBe(true);
    expect(terracotta.pieces.some((p) => p.colorway.family === 'Sienna')).toBe(true);
    expect(obsidian.bundleId).not.toBe(terracotta.bundleId);
  });

  it('produces bilingual EN & VI styling rationale and fabric pairing notes', () => {
    const res = curateAtelierWardrobe(
      PRODUCT_BY_ID,
      'tokyo-architecture',
      'alabaster-sand',
      'essential'
    );
    expect(res.headline.en.length).toBeGreaterThan(10);
    expect(res.headline.vi.length).toBeGreaterThan(10);
    expect(res.editorialRationale.vi.length).toBeGreaterThan(20);
    expect(res.fabricPairingNote.en).toContain('Material harmony');
  });
});
