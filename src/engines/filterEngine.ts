import type { CatalogFilterState, Locale, Product } from '../types/commerce';

export const DEFAULT_FILTERS: CatalogFilterState = {
  category: 'All',
  searchQuery: '',
  colorFamily: 'All',
  maxPriceUsd: 1600,
  inStockOnly: false,
  sortBy: 'featured',
};

export function filterAndSortCatalog(
  products: Product[],
  filters: CatalogFilterState,
  locale: Locale = 'en'
): Product[] {
  const query = filters.searchQuery.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (filters.category !== 'All' && product.category !== filters.category) {
      return false;
    }

    if (product.priceUsd > filters.maxPriceUsd) {
      return false;
    }

    if (filters.inStockOnly && product.stock <= 0) {
      return false;
    }

    if (
      filters.colorFamily !== 'All' &&
      !product.colorways.some((cw) => cw.family === filters.colorFamily)
    ) {
      return false;
    }

    if (query.length > 0) {
      const searchable = [
        product.sku,
        product.category,
        product.name.en,
        product.name.vi,
        product.subtitle.en,
        product.subtitle.vi,
        product.materialSpec.en,
        product.materialSpec.vi,
        product.editionStamp,
        ...product.colorways.flatMap((cw) => [cw.name.en, cw.name.vi, cw.family]),
      ]
        .join(' ')
        .toLowerCase();

      if (!searchable.includes(query)) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered];

  switch (filters.sortBy) {
    case 'price-asc':
      sorted.sort((a, b) => a.priceUsd - b.priceUsd || a.featuredRank - b.featuredRank);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.priceUsd - a.priceUsd || a.featuredRank - b.featuredRank);
      break;
    case 'newest':
      sorted.sort((a, b) => {
        const newDiff = Number(Boolean(b.isNew)) - Number(Boolean(a.isNew));
        if (newDiff !== 0) return newDiff;
        return a.featuredRank - b.featuredRank;
      });
      break;
    case 'featured':
    default:
      sorted.sort((a, b) => {
        if (a.featuredRank !== b.featuredRank) {
          return a.featuredRank - b.featuredRank;
        }
        return a.name[locale].localeCompare(b.name[locale]);
      });
      break;
  }

  return sorted;
}
