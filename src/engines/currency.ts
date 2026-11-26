import type { Currency } from '../types/commerce';

export const USD_TO_VND_RATE = 25400;

export function convertFromUsd(amountUsd: number, currency: Currency): number {
  if (currency === 'VND') {
    return Math.round(amountUsd * USD_TO_VND_RATE);
  }
  return Math.round(amountUsd * 100) / 100;
}

export function formatMoney(amountUsd: number, currency: Currency): string {
  const isNegative = amountUsd < 0;
  const absUsd = Math.abs(amountUsd);
  const converted = convertFromUsd(absUsd, currency);

  if (currency === 'VND') {
    const formatted = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(converted);
    return `${isNegative ? '-' : ''}${formatted} ₫`;
  }

  const hasCents = Math.round(converted * 100) % 100 !== 0;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(converted);
  return `${isNegative ? '-' : ''}$${formatted}`;
}
