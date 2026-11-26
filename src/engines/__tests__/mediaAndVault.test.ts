import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CATALOG, HERO_EDITORIAL_IMAGE, PRODUCT_BY_ID } from '../../data/catalog';
import { LOOKBOOKS } from '../../data/lookbooks';
import { getProductAuthenticity } from '../../data/reviewsAndStock';
import {
  calculateCartTotals,
  evaluatePromoCode,
  upsertCartItem,
} from '../cartEngine';

describe('v3.0 Hasselblad WebP media integrity & Private Vault PRIVATE10 engine', () => {
  const mediaDir = path.resolve(process.cwd(), 'public/media');

  it('verifies all 16 curated WebP media assets exist on disk with non-zero bytes', () => {
    const referenced = new Set<string>([
      HERO_EDITORIAL_IMAGE,
      ...LOOKBOOKS.map((l) => l.imageFile),
      ...CATALOG.map((p) => p.imageFile),
    ]);

    expect(referenced.size).toBe(16);

    for (const file of referenced) {
      const fullPath = path.join(mediaDir, file);
      expect(fs.existsSync(fullPath), `Missing WebP asset: ${file}`).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(2000);
    }
  });

  it('redeems Private Vault PRIVATE10 (-10%) cleanly and blocks duplicate application', () => {
    const first = evaluatePromoCode('PRIVATE10', null, 890);
    expect(first).toEqual({ status: 'APPLIED', code: 'PRIVATE10' });

    const duplicate = evaluatePromoCode('private10', 'PRIVATE10', 890);
    expect(duplicate).toEqual({ status: 'DUPLICATE_CODE', code: 'PRIVATE10' });

    const items = upsertCartItem([], {
      productId: 'mv-out-01', // $890
      size: 'M',
      colorwayId: 'out01-sand',
    });
    const totals = calculateCartTotals(
      items,
      PRODUCT_BY_ID,
      LOOKBOOKS,
      'PRIVATE10',
      false
    );
    expect(totals.promoDiscountUsd).toBe(89);
    expect(totals.grandTotalUsd).toBe(801);
  });

  it('supplies authentic collector reviews and 4-boutique availability matrix for every category', () => {
    for (const prod of CATALOG) {
      const data = getProductAuthenticity(prod.category, prod.stock);
      expect(data.averageRating).toBeGreaterThanOrEqual(4.8);
      expect(data.reviews.length).toBeGreaterThanOrEqual(2);
      expect(data.boutiques).toHaveLength(4);
      if (prod.stock === 0) {
        expect(data.boutiques.every((b) => b.status === 'waitlist')).toBe(true);
      }
    }
  });
});
