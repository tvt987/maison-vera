import { describe, expect, it } from 'vitest';
import { CATALOG } from '../../data/catalog';
import { DEFAULT_FILTERS, filterAndSortCatalog } from '../filterEngine';

describe('faceted catalog filter & sort engine', () => {
  it('returns all 12 curated SKUs with default filters', () => {
    const result = filterAndSortCatalog(CATALOG, DEFAULT_FILTERS, 'en');
    expect(result).toHaveLength(12);
    expect(result[0].sku).toBe('MV-EYE-01');
  });

  it('filters accurately by category across all 5 categories', () => {
    expect(
      filterAndSortCatalog(CATALOG, { ...DEFAULT_FILTERS, category: 'Outerwear' })
    ).toHaveLength(3);
    expect(
      filterAndSortCatalog(CATALOG, { ...DEFAULT_FILTERS, category: 'Eyewear' })
    ).toHaveLength(3);
    expect(
      filterAndSortCatalog(CATALOG, { ...DEFAULT_FILTERS, category: 'Leather Goods' })
    ).toHaveLength(2);
    expect(
      filterAndSortCatalog(CATALOG, { ...DEFAULT_FILTERS, category: 'Objects' })
    ).toHaveLength(2);
    expect(
      filterAndSortCatalog(CATALOG, { ...DEFAULT_FILTERS, category: 'Fragrance' })
    ).toHaveLength(2);
  });

  it('supports bilingual search across SKU, EN, and VI descriptions', () => {
    const bySku = filterAndSortCatalog(CATALOG, {
      ...DEFAULT_FILTERS,
      searchQuery: 'MV-FRG-01',
    });
    expect(bySku.map((p) => p.sku)).toEqual(['MV-FRG-01']);

    const byVietnamese = filterAndSortCatalog(CATALOG, {
      ...DEFAULT_FILTERS,
      searchQuery: 'Hinoki',
    });
    expect(byVietnamese.map((p) => p.sku)).toEqual(['MV-FRG-01']);

    const byViTerm = filterAndSortCatalog(CATALOG, {
      ...DEFAULT_FILTERS,
      searchQuery: 'Lư Trầm',
    });
    expect(byViTerm.map((p) => p.sku)).toEqual(['MV-OBJ-01']);
  });

  it('applies colorway, max price ceiling, and in-stock filters simultaneously', () => {
    const filtered = filterAndSortCatalog(CATALOG, {
      ...DEFAULT_FILTERS,
      colorFamily: 'Titanium',
      maxPriceUsd: 500,
      inStockOnly: true,
    });
    // MV-OBJ-02 is Titanium & $220 but stock === 0, so excluded
    expect(filtered.map((p) => p.sku)).toEqual(['MV-EYE-01', 'MV-EYE-02']);
  });

  it('sorts deterministically by price ascending, descending, and newest', () => {
    const asc = filterAndSortCatalog(CATALOG, {
      ...DEFAULT_FILTERS,
      sortBy: 'price-asc',
    });
    expect(asc[0].priceUsd).toBe(220);
    expect(asc[asc.length - 1].priceUsd).toBe(1450);

    const desc = filterAndSortCatalog(CATALOG, {
      ...DEFAULT_FILTERS,
      sortBy: 'price-desc',
    });
    expect(desc[0].priceUsd).toBe(1450);
    expect(desc[desc.length - 1].priceUsd).toBe(220);

    const newest = filterAndSortCatalog(CATALOG, {
      ...DEFAULT_FILTERS,
      sortBy: 'newest',
    });
    expect(newest.slice(0, 4).every((p) => p.isNew)).toBe(true);
  });
});
