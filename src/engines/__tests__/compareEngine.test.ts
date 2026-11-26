import { describe, expect, it } from 'vitest';
import { PRODUCT_BY_ID } from '../../data/catalog';
import {
  buildComparisonMatrix,
  MAX_COMPARE_SPECIMENS,
  toggleCompareList,
} from '../compareEngine';

describe('specimen comparison engine', () => {
  it('toggles specimens idempotently and enforces max 3 limit', () => {
    let list: string[] = [];
    const r1 = toggleCompareList(list, 'mv-eye-01');
    expect(r1.status).toBe('added');
    list = r1.next;

    list = toggleCompareList(list, 'mv-out-01').next;
    list = toggleCompareList(list, 'mv-lth-01').next;
    expect(list).toHaveLength(MAX_COMPARE_SPECIMENS);

    const r4 = toggleCompareList(list, 'mv-frg-01');
    expect(r4.status).toBe('limit-reached');
    expect(r4.next).toHaveLength(3);

    const removed = toggleCompareList(list, 'mv-out-01');
    expect(removed.status).toBe('removed');
    expect(removed.next).toEqual(['mv-eye-01', 'mv-lth-01']);
  });

  it('builds localized multi-currency side-by-side comparison matrix rows', () => {
    const products = [PRODUCT_BY_ID['mv-eye-01'], PRODUCT_BY_ID['mv-out-01']];
    const rowsUsd = buildComparisonMatrix(products, 'en', 'USD');
    const rowsVnd = buildComparisonMatrix(products, 'vi', 'VND');

    const priceRowUsd = rowsUsd.find((r) => r.id === 'price');
    const priceRowVnd = rowsVnd.find((r) => r.id === 'price');

    expect(priceRowUsd?.values).toEqual(['$480', '$890']);
    expect(priceRowVnd?.values[0]).toContain('12,192,000');
    expect(rowsUsd.length).toBeGreaterThanOrEqual(7);
  });
});
