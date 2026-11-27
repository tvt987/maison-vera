import { describe, expect, it } from 'vitest';
import {
  clampUvIndex,
  computeOpticalLensTelemetry,
  getOpticalLensMode,
  interpolateHexColor,
  OPTICAL_LENS_MODES,
} from '../opticalPhysics';

describe('optical lens physics & photochromic UV sunlight simulator', () => {
  it('exposes all 5 flagship optical lens modes with bilingual labels and pricing', () => {
    expect(OPTICAL_LENS_MODES).toHaveLength(5);
    const ids = OPTICAL_LENS_MODES.map((m) => m.id);
    expect(ids).toEqual([
      'clear-ar',
      'photochromic-uv',
      'polarized-amber',
      'midnight-gradient',
      'blue-light-studio',
    ]);
    for (const mode of OPTICAL_LENS_MODES) {
      expect(mode.label.en.length).toBeGreaterThan(4);
      expect(mode.label.vi.length).toBeGreaterThan(4);
      expect(mode.surchargeUsd).toBeGreaterThanOrEqual(0);
    }
  });

  it('clamps UV index strictly to [0, 11] and handles non-finite inputs safely', () => {
    expect(clampUvIndex(-4)).toBe(0);
    expect(clampUvIndex(0)).toBe(0);
    expect(clampUvIndex(6.44)).toBe(6.4);
    expect(clampUvIndex(25)).toBe(11);
    expect(clampUvIndex(Number.NaN)).toBe(0);
  });

  it('dynamically darkens Photochromic UV lenses monotonically as UV Index slides 0 -> 11', () => {
    const uv0 = computeOpticalLensTelemetry('photochromic-uv', 0);
    const uv3 = computeOpticalLensTelemetry('photochromic-uv', 3);
    const uv6 = computeOpticalLensTelemetry('photochromic-uv', 6);
    const uv11 = computeOpticalLensTelemetry('photochromic-uv', 11);

    expect(uv0.filterCategory).toBe('CAT 0');
    expect(uv3.filterCategory).toBe('CAT 1');
    expect(uv6.filterCategory).toBe('CAT 2');
    expect(uv11.filterCategory).toBe('CAT 3');

    // Monotonic VLT drop & glare reduction increase
    expect(uv0.vltPercent).toBeGreaterThan(90);
    expect(uv0.vltPercent).toBeGreaterThan(uv3.vltPercent);
    expect(uv3.vltPercent).toBeGreaterThan(uv6.vltPercent);
    expect(uv6.vltPercent).toBeGreaterThan(uv11.vltPercent);
    expect(uv11.vltPercent).toBeLessThan(16);

    expect(uv11.glareReductionPercent).toBeGreaterThan(90);
    expect(uv0.transmission).toBeGreaterThan(uv11.transmission);
    expect(uv11.opacity).toBeGreaterThan(uv0.opacity);
    expect(uv0.hexColor).not.toBe(uv11.hexColor);
  });

  it('delivers 98.2% VLT clear crystal physics for Clear Anti-Reflective', () => {
    const clear = computeOpticalLensTelemetry('clear-ar', 9);
    expect(clear.vltPercent).toBe(98.2);
    expect(clear.filterCategory).toBe('CAT 0');
    expect(clear.transmission).toBeGreaterThanOrEqual(0.9);
    expect(clear.surchargeUsd).toBe(0);
  });

  it('delivers 99.4% glare reduction for Polarized Amber Drive', () => {
    const pol = computeOpticalLensTelemetry('polarized-amber', 5);
    expect(pol.glareReductionPercent).toBeGreaterThanOrEqual(99);
    expect(pol.vltPercent).toBe(24);
    expect(pol.filterCategory).toBe('CAT 2');
    expect(getOpticalLensMode('polarized-amber').isPolarized).toBe(true);
  });

  it('provides gradient bottom hex and CAT 3 transmittance for Midnight Gradient', () => {
    const grad = computeOpticalLensTelemetry('midnight-gradient', 4);
    expect(grad.gradientBottomHex).toMatch(/^#[0-9A-F]{6}$/);
    expect(grad.filterCategory).toBe('CAT 3');
    expect(grad.vltPercent).toBeLessThan(20);
    expect(getOpticalLensMode('midnight-gradient').isGradient).toBe(true);
  });

  it('delivers >= 92% HEV blue-light attenuation and 420nm cut for Blue-Light Studio Filter', () => {
    const blue = computeOpticalLensTelemetry('blue-light-studio', 0);
    expect(blue.blueLightFilterPercent).toBeGreaterThanOrEqual(92);
    expect(blue.uvCutNm).toBe(420);
    expect(blue.iridescence).toBeGreaterThan(0.7);
  });

  it('interpolates RGB hex colors deterministically across endpoints and midpoint', () => {
    expect(interpolateHexColor('#000000', '#FFFFFF', 0)).toBe('#000000');
    expect(interpolateHexColor('#000000', '#FFFFFF', 1)).toBe('#FFFFFF');
    expect(interpolateHexColor('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });
});
