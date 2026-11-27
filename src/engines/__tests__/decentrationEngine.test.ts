import { describe, expect, it } from 'vitest';
import {
  ANSI_Z80_HORIZONTAL_PRISM_LIMIT_DELTA,
  clampPhysiologicalPdMm,
  computeHorizontalMeridianPowerD,
  computeMinimumBlankSizeMm,
  computePerEyeDecentrationMm,
  computePrenticePrismDiopters,
  evaluateAllSabaeFrames,
  evaluateFrameDecentration,
  getSabaeFrameBySku,
  SABAE_OPTICAL_FRAMES,
} from '../decentrationEngine';

describe('decentrationEngine — PD Decentration, Prentice Rule Prism & MBS', () => {
  it('computes exact Per-Eye Optical Decentration Dec = ((A + DBL) - PD) / 2', () => {
    // VERA-01 Monolith: A = 51, DBL = 20 => Frame PD = 71; client PD = 64 => Dec = +3.50 mm inward
    expect(computePerEyeDecentrationMm(51, 20, 64)).toBe(3.5);
    // Exact zero-decentration optical bullseye when PD == A + DBL (67mm on Panto 46+21)
    expect(computePerEyeDecentrationMm(46, 21, 67)).toBe(0);
    // Outward (temporal) decentration when PD exceeds frame GCD (71mm on Panto 46+21)
    expect(computePerEyeDecentrationMm(46, 21, 71)).toBe(-2);
  });

  it('computes exact Prentice Rule prismatic effect Delta = (|Dec| / 10) * |F|', () => {
    // 5.0 mm (0.5 cm) decentration * -6.00 D = 3.00 prism diopters
    expect(computePrenticePrismDiopters(5.0, -6.0)).toBe(3.0);
    // 1.5 mm (0.15 cm) decentration * -2.50 D = 0.38 prism diopters
    expect(computePrenticePrismDiopters(1.5, -2.5)).toBe(0.38);
    // Zero decentration => zero prism regardless of power
    expect(computePrenticePrismDiopters(0, -10.0)).toBe(0);
    // Negative (outward) decentration still produces positive prism magnitude
    expect(computePrenticePrismDiopters(-3.0, 4.0)).toBe(1.2);
  });

  it('resolves horizontal meridian refractive power accurately for pure sphere and astigmatic Rx', () => {
    expect(computeHorizontalMeridianPowerD({ sphereD: -4.0, cylinderD: 0, axisDeg: 0 })).toBe(-4.0);
    // Axis 180 deg => sin^2(180) = 0 => horizontal power is purely sphere (-3.00 D)
    expect(computeHorizontalMeridianPowerD({ sphereD: -3.0, cylinderD: -2.0, axisDeg: 180 })).toBe(-3.0);
    // Axis 90 deg => sin^2(90) = 1 => full cylinder compounds horizontally (-5.00 D)
    expect(computeHorizontalMeridianPowerD({ sphereD: -3.0, cylinderD: -2.0, axisDeg: 90 })).toBe(-5.0);
    // Axis 45 deg => sin^2(45) = 0.5 => half cylinder adds horizontally (-4.00 D)
    expect(computeHorizontalMeridianPowerD({ sphereD: -3.0, cylinderD: -2.0, axisDeg: 45 })).toBe(-4.0);
  });

  it('computes exact Minimum Blank Size MBS = ED + 2*|Dec| + 2.0 mm', () => {
    // Panto 46 (ED=48) with 1.5 mm Dec => 48 + 3.0 + 2.0 = 53.0 mm
    expect(computeMinimumBlankSizeMm(48, 1.5)).toBe(53.0);
    // Solaire 54 Aviator (ED=58) with 7.5 mm Dec => 58 + 15.0 + 2.0 = 75.0 mm
    expect(computeMinimumBlankSizeMm(58, 7.5)).toBe(75.0);
  });

  it('flags 54mm Solaire Aviator as oversized-caution for narrow PD 58mm with -6.00D and recommends 46mm Panto', () => {
    const od = { sphereD: -6.0, cylinderD: 0, axisDeg: 0 };
    const os = { sphereD: -6.0, cylinderD: 0, axisDeg: 0 };
    const suite = evaluateAllSabaeFrames(58, od, os);

    const panto46 = suite.evaluations.find((e) => e.frame.sku === 'MV-EYE-04')!;
    const aviator54 = suite.evaluations.find((e) => e.frame.sku === 'MV-EYE-02')!;

    expect(aviator54.decentrationPerEyeMm).toBe(7.5);
    expect(aviator54.peakPrismDiopters).toBe(4.5);
    expect(aviator54.prismBaseDirection).toBe('base-in');
    expect(aviator54.minimumBlankSizeMm).toBe(75.0);
    expect(aviator54.fitsStandard70mmBlank).toBe(false);
    expect(aviator54.verdict).toBe('oversized-caution');

    expect(panto46.decentrationPerEyeMm).toBe(4.5);
    expect(panto46.minimumBlankSizeMm).toBe(59.0);
    expect(panto46.fitsStandard70mmBlank).toBe(true);
    expect(panto46.recommendedStockBlankMm).toBe(65);
    expect(suite.bestFrame.frame.sku).toBe('MV-EYE-04');
    expect(panto46.opticalFitScore).toBeGreaterThan(aviator54.opticalFitScore);
  });

  it('awards zero-prism-optimal bullseye to 54mm Solaire Aviator for wide PD 73mm', () => {
    const od = { sphereD: -2.5, cylinderD: 0, axisDeg: 0 };
    const os = { sphereD: -2.25, cylinderD: 0, axisDeg: 0 };
    const suite = evaluateAllSabaeFrames(73, od, os);
    const aviator54 = suite.evaluations.find((e) => e.frame.sku === 'MV-EYE-02')!;

    expect(aviator54.decentrationPerEyeMm).toBe(0);
    expect(aviator54.peakPrismDiopters).toBe(0);
    expect(aviator54.withinAnsiZ80Tolerance).toBe(true);
    expect(aviator54.peakPrismDiopters).toBeLessThanOrEqual(ANSI_Z80_HORIZONTAL_PRISM_LIMIT_DELTA);
    expect(aviator54.minimumBlankSizeMm).toBe(60.0);
    expect(aviator54.verdict).toBe('zero-prism-optimal');
    expect(suite.bestFrame.frame.sku).toBe('MV-EYE-02');
  });

  it('awards exact zero-decentration bullseye to 51mm VERA-01 Monolith for PD 71mm', () => {
    const od = { sphereD: -2.5, cylinderD: 0, axisDeg: 0 };
    const os = { sphereD: -2.25, cylinderD: 0, axisDeg: 0 };
    const suite = evaluateAllSabaeFrames(71, od, os);
    const vera01 = suite.evaluations.find((e) => e.frame.sku === 'MV-EYE-01')!;

    expect(vera01.decentrationPerEyeMm).toBe(0);
    expect(vera01.peakPrismDiopters).toBe(0);
    expect(vera01.verdict).toBe('zero-prism-optimal');
    expect(suite.bestFrame.frame.sku).toBe('MV-EYE-01');
  });

  it('determines correct prism base direction for plus vs minus lenses and inward vs outward decentration', () => {
    const panto46 = getSabaeFrameBySku('MV-EYE-04'); // GCD = 67

    // Minus lens + inward (PD 61 < 67 => Dec +3.0) => Base-In
    const minusIn = evaluateFrameDecentration(
      panto46,
      61,
      { sphereD: -3.0, cylinderD: 0, axisDeg: 0 },
      { sphereD: -3.0, cylinderD: 0, axisDeg: 0 }
    );
    expect(minusIn.decentrationDirection).toBe('inward-nasal');
    expect(minusIn.prismBaseDirection).toBe('base-in');

    // Plus lens + inward (PD 61 < 67 => Dec +3.0) => Base-Out
    const plusIn = evaluateFrameDecentration(
      panto46,
      61,
      { sphereD: 3.0, cylinderD: 0, axisDeg: 0 },
      { sphereD: 3.0, cylinderD: 0, axisDeg: 0 }
    );
    expect(plusIn.prismBaseDirection).toBe('base-out');

    // Minus lens + outward (PD 73 > 67 => Dec -3.0) => Base-Out
    const minusOut = evaluateFrameDecentration(
      panto46,
      73,
      { sphereD: -3.0, cylinderD: 0, axisDeg: 0 },
      { sphereD: -3.0, cylinderD: 0, axisDeg: 0 }
    );
    expect(minusOut.decentrationDirection).toBe('outward-temporal');
    expect(minusOut.prismBaseDirection).toBe('base-out');

    // Exact match PD 67 => zero-centered & no prism
    const exact = evaluateFrameDecentration(
      panto46,
      67,
      { sphereD: -4.0, cylinderD: 0, axisDeg: 0 },
      { sphereD: -4.0, cylinderD: 0, axisDeg: 0 }
    );
    expect(exact.decentrationDirection).toBe('zero-centered');
    expect(exact.peakPrismDiopters).toBe(0);
    expect(exact.prismBaseDirection).toBe('none');
  });

  it('clamps PD strictly within physiological 54–74 mm bounds', () => {
    expect(clampPhysiologicalPdMm(48)).toBe(54);
    expect(clampPhysiologicalPdMm(82)).toBe(74);
    expect(clampPhysiologicalPdMm(Number.NaN)).toBe(64);
    expect(clampPhysiologicalPdMm(63.5)).toBe(63.5);
  });

  it('covers all 4 Sabae optical frames ordered from 46mm Panto to 54mm Aviator', () => {
    expect(SABAE_OPTICAL_FRAMES.map((f) => f.lensWidthMm)).toEqual([46, 48, 51, 54]);
    expect(SABAE_OPTICAL_FRAMES.map((f) => f.sku)).toEqual([
      'MV-EYE-04',
      'MV-EYE-03',
      'MV-EYE-01',
      'MV-EYE-02',
    ]);
  });

  it('picks peak horizontal prism when OD and OS have asymmetric prescriptions', () => {
    const vera01 = getSabaeFrameBySku('MV-EYE-01'); // GCD = 71
    const res = evaluateFrameDecentration(
      vera01,
      63, // Dec = +4.0 mm => 0.4 cm
      { sphereD: -1.0, cylinderD: 0, axisDeg: 0 }, // 0.40 Delta
      { sphereD: -5.0, cylinderD: 0, axisDeg: 0 } // 2.00 Delta
    );
    expect(res.odPrismDiopters).toBe(0.4);
    expect(res.osPrismDiopters).toBe(2.0);
    expect(res.peakPrismDiopters).toBe(2.0);
    expect(res.withinAnsiZ80Tolerance).toBe(false);
  });

  it('flags 80mm custom surfaced blank when extreme narrow PD 54mm meets 54mm Aviator', () => {
    const aviator = getSabaeFrameBySku('MV-EYE-02'); // GCD = 73, ED = 58
    const res = evaluateFrameDecentration(
      aviator,
      54, // Dec = +9.5 mm => MBS = 58 + 19 + 2 = 79.0 mm
      { sphereD: -4.0, cylinderD: 0, axisDeg: 0 },
      { sphereD: -4.0, cylinderD: 0, axisDeg: 0 }
    );
    expect(res.decentrationPerEyeMm).toBe(9.5);
    expect(res.minimumBlankSizeMm).toBe(79.0);
    expect(res.recommendedStockBlankMm).toBe(80);
    expect(res.fitsStandard70mmBlank).toBe(false);
    expect(res.verdict).toBe('oversized-caution');
  });
});
