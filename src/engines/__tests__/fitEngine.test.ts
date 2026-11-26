import { describe, expect, it } from 'vitest';
import { estimateAtelierSize } from '../fitEngine';

describe('size & fit estimator engine', () => {
  it('recommends XS for petite proportions with tailored fit', () => {
    const res = estimateAtelierSize(160, 50, 'tailored');
    expect(res.recommendedSize).toBe('XS');
    expect(res.chestCm).toBe('104 cm');
  });

  it('recommends M for average architectural proportions', () => {
    const res = estimateAtelierSize(176, 72, 'architectural');
    expect(res.recommendedSize).toBe('M');
    expect(res.shoulderCm).toBe('49.5 cm');
  });

  it('shifts size upward when oversized drape is requested', () => {
    const tailored = estimateAtelierSize(175, 72, 'tailored');
    const oversized = estimateAtelierSize(175, 72, 'oversized');
    expect(['XS', 'S', 'M', 'L'].indexOf(oversized.recommendedSize)).toBeGreaterThanOrEqual(
      ['XS', 'S', 'M', 'L'].indexOf(tailored.recommendedSize)
    );
  });

  it('recommends L for tall / broad proportions', () => {
    const res = estimateAtelierSize(190, 92, 'architectural');
    expect(res.recommendedSize).toBe('L');
  });
});
