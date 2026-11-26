import type { Currency, Locale, LocalizedText, Product } from '../types/commerce';
import { formatMoney } from './currency';

export const MAX_COMPARE_SPECIMENS = 3;

export function toggleCompareList(
  current: string[],
  productId: string
): { next: string[]; status: 'added' | 'removed' | 'limit-reached' } {
  if (current.includes(productId)) {
    return {
      next: current.filter((id) => id !== productId),
      status: 'removed',
    };
  }
  if (current.length >= MAX_COMPARE_SPECIMENS) {
    return {
      next: current,
      status: 'limit-reached',
    };
  }
  return {
    next: [...current, productId],
    status: 'added',
  };
}

export interface ComparisonRow {
  id: string;
  label: LocalizedText;
  values: string[];
}

export function buildComparisonMatrix(
  products: Product[],
  locale: Locale,
  currency: Currency
): ComparisonRow[] {
  return [
    {
      id: 'price',
      label: { en: 'Atelier Retail', vi: 'Giá Niêm Yết' },
      values: products.map((p) => formatMoney(p.priceUsd, currency)),
    },
    {
      id: 'edition',
      label: { en: 'Edition Stamp', vi: 'Mã Phiên Bản' },
      values: products.map((p) => `${p.sku} · ${p.editionStamp}`),
    },
    {
      id: 'material',
      label: { en: 'Material & Spec', vi: 'Chất Liệu & Thông Số' },
      values: products.map((p) => p.materialSpec[locale]),
    },
    {
      id: 'provenance',
      label: { en: 'Atelier Origin', vi: 'Xuất Xứ Xưởng' },
      values: products.map((p) => p.provenance[locale]),
    },
    {
      id: 'colorways',
      label: { en: 'Available Finishes', vi: 'Phối Màu Hiện Có' },
      values: products.map((p) => p.colorways.map((c) => c.name[locale]).join(' / ')),
    },
    {
      id: 'care',
      label: { en: 'Preservation Care', vi: 'Bảo Quản' },
      values: products.map((p) => p.careGuide[locale]),
    },
    {
      id: 'stock',
      label: { en: 'Inventory Status', vi: 'Trạng Thái Kho' },
      values: products.map((p) =>
        p.stock > 0
          ? locale === 'en'
            ? `${p.stock} Ready to Dispatch`
            : `${p.stock} Sẵn Sàng Xuất Xưởng`
          : locale === 'en'
          ? 'Archive Sold Out'
          : 'Đã Hết Phiên Bản'
      ),
    },
  ];
}
