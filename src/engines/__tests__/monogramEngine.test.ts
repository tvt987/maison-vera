import { describe, expect, it } from 'vitest';
import {
  formatMonogramDisplay,
  formatMonogramLine,
  resolveActiveMonogram,
  sanitizeMonogramLetters,
  serializeMonogram,
} from '../monogramEngine';

describe('bespoke monogram & foil-stamping engine', () => {
  it('sanitizes input to uppercase alphabetic characters capped at 4 letters', () => {
    expect(sanitizeMonogramLetters('t.v.t')).toBe('TVT');
    expect(sanitizeMonogramLetters('  m-v 99 abcdef ')).toBe('MVAB');
    expect(sanitizeMonogramLetters('1234!@#')).toBe('');
  });

  it('formats monogram display with architectural middots', () => {
    expect(formatMonogramDisplay('tvt')).toBe('T·V·T');
    expect(formatMonogramDisplay('mv')).toBe('M·V');
    expect(formatMonogramDisplay('')).toBe('');
  });

  it('serializes deterministic cart keys and resolves active config cleanly', () => {
    expect(serializeMonogram({ text: 't.v.t', foil: 'gold-24k' })).toBe(
      'MONO:TVT@gold-24k'
    );
    expect(serializeMonogram({ text: '', foil: 'gold-24k' })).toBe('');

    expect(
      resolveActiveMonogram({ enabled: false, text: 'TVT', foil: 'gold-24k' })
    ).toBeUndefined();
    expect(
      resolveActiveMonogram({ enabled: true, text: 't.v.t', foil: 'silver-leaf' })
    ).toEqual({ text: 'TVT', foil: 'silver-leaf' });
  });

  it('renders bilingual monogram lines for bag & printable invoice', () => {
    expect(formatMonogramLine({ text: 'TVT', foil: 'gold-24k' }, 'en')).toBe(
      'Monogram "T·V·T" · 24K Gold Foil'
    );
    expect(formatMonogramLine({ text: 'TVT', foil: 'blind-deboss' }, 'vi')).toBe(
      'Khắc Chữ "T·V·T" · Dập Chìm Không Màu'
    );
  });
});
