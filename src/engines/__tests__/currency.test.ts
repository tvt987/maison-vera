import { describe, expect, it } from 'vitest';
import { convertFromUsd, formatMoney, USD_TO_VND_RATE } from '../currency';

describe('currency engine', () => {
  it('converts USD to VND accurately using fixed studio exchange rate', () => {
    expect(convertFromUsd(100, 'USD')).toBe(100);
    expect(convertFromUsd(100, 'VND')).toBe(100 * USD_TO_VND_RATE);
    expect(convertFromUsd(480, 'VND')).toBe(12192000);
  });

  it('formats USD cleanly with or without fractional cents', () => {
    expect(formatMoney(480, 'USD')).toBe('$480');
    expect(formatMoney(1240, 'USD')).toBe('$1,240');
    expect(formatMoney(18.5, 'USD')).toBe('$18.50');
    expect(formatMoney(-50, 'USD')).toBe('-$50');
  });

  it('formats VND cleanly with thousand separators and dong symbol', () => {
    expect(formatMoney(350, 'VND')).toBe('8,890,000 ₫');
    expect(formatMoney(-50, 'VND')).toBe('-1,270,000 ₫');
  });
});
