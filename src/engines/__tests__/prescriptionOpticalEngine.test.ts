import { describe, expect, it } from 'vitest';
import {
  BLUE_LIGHT_STUDIO_SURCHARGE_USD,
  buildOpticalRxCartPayload,
  computeEffectiveSemiDiameter,
  computeEyeSagittaForMaterial,
  computeOpticalRxReport,
  computeSpectralTransmittanceCurve,
  formatDiopter,
  getDominantMeridianPower,
  isQuarterDiopterStep,
  OPTICAL_RX_PRESETS,
  REFRACTIVE_INDEX_SPECS,
  recommendRefractiveIndex,
  validateOpticalRx,
} from '../prescriptionOpticalEngine';
import type { OpticalRxInput } from '../../types/commerce';

const BASE_MYOPIA_600: OpticalRxInput = {
  od: { sphereD: -6.0, cylinderD: 0, axisDeg: 0 },
  os: { sphereD: -6.0, cylinderD: 0, axisDeg: 0 },
  pdMm: 64,
  lensDiameterMm: 51,
  bridgeWidthMm: 20,
  blueLightFilterEnabled: true,
};

describe('prescriptionOpticalEngine — Optometry Validation & Sagitta Physics', () => {
  it('accepts valid 0.25 D steps and rejects non-quarter diopter increments', () => {
    expect(isQuarterDiopterStep(-6.0)).toBe(true);
    expect(isQuarterDiopterStep(-2.75)).toBe(true);
    expect(isQuarterDiopterStep(1.25)).toBe(true);
    expect(isQuarterDiopterStep(-2.1)).toBe(false);
    expect(isQuarterDiopterStep(-0.33)).toBe(false);

    const invalid = validateOpticalRx({
      ...BASE_MYOPIA_600,
      od: { sphereD: -2.1, cylinderD: -0.33, axisDeg: 90 },
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.some((e) => e.code === 'SPHERE_INVALID_STEP')).toBe(true);
    expect(invalid.errors.some((e) => e.code === 'CYLINDER_INVALID_STEP')).toBe(true);
  });

  it('rejects Sphere out of physiological bounds (-10.00 D to +6.00 D)', () => {
    const low = validateOpticalRx({
      ...BASE_MYOPIA_600,
      od: { sphereD: -10.5, cylinderD: 0, axisDeg: 0 },
    });
    const high = validateOpticalRx({
      ...BASE_MYOPIA_600,
      os: { sphereD: 6.25, cylinderD: 0, axisDeg: 0 },
    });
    expect(low.valid).toBe(false);
    expect(low.errors[0].code).toBe('SPHERE_OUT_OF_RANGE');
    expect(high.valid).toBe(false);
    expect(high.errors[0].code).toBe('SPHERE_OUT_OF_RANGE');
  });

  it('rejects Cylinder outside [-4.00, 0.00] D', () => {
    const posCyl = validateOpticalRx({
      ...BASE_MYOPIA_600,
      od: { sphereD: -2.0, cylinderD: 0.5, axisDeg: 90 },
    });
    const deepCyl = validateOpticalRx({
      ...BASE_MYOPIA_600,
      os: { sphereD: -2.0, cylinderD: -4.25, axisDeg: 90 },
    });
    expect(posCyl.errors.some((e) => e.code === 'CYLINDER_OUT_OF_RANGE')).toBe(true);
    expect(deepCyl.errors.some((e) => e.code === 'CYLINDER_OUT_OF_RANGE')).toBe(true);
  });

  it('requires Axis (1°–180°) when Cylinder is non-zero and rejects missing or zero Axis', () => {
    const missingAxis = validateOpticalRx({
      ...BASE_MYOPIA_600,
      od: { sphereD: -3.0, cylinderD: -1.25, axisDeg: null },
    });
    const zeroAxis = validateOpticalRx({
      ...BASE_MYOPIA_600,
      os: { sphereD: -3.0, cylinderD: -0.75, axisDeg: 0 },
    });
    const outAxis = validateOpticalRx({
      ...BASE_MYOPIA_600,
      od: { sphereD: -3.0, cylinderD: -0.75, axisDeg: 185 },
    });
    expect(missingAxis.valid).toBe(false);
    expect(missingAxis.errors[0].code).toBe('AXIS_REQUIRED');
    expect(zeroAxis.valid).toBe(false);
    expect(zeroAxis.errors[0].code).toBe('AXIS_OUT_OF_RANGE');
    expect(outAxis.valid).toBe(false);
    expect(outAxis.errors[0].code).toBe('AXIS_OUT_OF_RANGE');
  });

  it('permits null or 0° Axis when Cylinder is 0.00 D', () => {
    const validNull = validateOpticalRx({
      ...BASE_MYOPIA_600,
      od: { sphereD: -2.0, cylinderD: 0, axisDeg: null },
      os: { sphereD: -2.0, cylinderD: 0, axisDeg: 0 },
    });
    expect(validNull.valid).toBe(true);
    expect(validNull.errors).toHaveLength(0);
  });

  it('enforces physiological PD bounds (54–74 mm) and 0.5 mm precision steps', () => {
    const tooNarrow = validateOpticalRx({ ...BASE_MYOPIA_600, pdMm: 52 });
    const tooWide = validateOpticalRx({ ...BASE_MYOPIA_600, pdMm: 76 });
    const badStep = validateOpticalRx({ ...BASE_MYOPIA_600, pdMm: 63.3 });
    const validHalf = validateOpticalRx({ ...BASE_MYOPIA_600, pdMm: 63.5 });

    expect(tooNarrow.errors.some((e) => e.code === 'PD_OUT_OF_RANGE')).toBe(true);
    expect(tooWide.errors.some((e) => e.code === 'PD_OUT_OF_RANGE')).toBe(true);
    expect(badStep.errors.some((e) => e.code === 'PD_INVALID_STEP')).toBe(true);
    expect(validHalf.valid).toBe(true);
  });

  it('enforces lens diameter bounds (44–62 mm)', () => {
    const small = validateOpticalRx({ ...BASE_MYOPIA_600, lensDiameterMm: 40 });
    const large = validateOpticalRx({ ...BASE_MYOPIA_600, lensDiameterMm: 66 });
    expect(small.errors.some((e) => e.code === 'DIAMETER_OUT_OF_RANGE')).toBe(true);
    expect(large.errors.some((e) => e.code === 'DIAMETER_OUT_OF_RANGE')).toBe(true);
  });

  it('validates all curated OPTICAL_RX_PRESETS cleanly', () => {
    for (const preset of OPTICAL_RX_PRESETS) {
      const res = validateOpticalRx(preset.input);
      expect(res.valid).toBe(true);
    }
  });

  it('computes strict monotonic edge thinning (1.74 < 1.67 < 1.59 < 1.50) at -6.00 D', () => {
    const report = computeOpticalRxReport(BASE_MYOPIA_600);
    const [r150, r159, r167, r174] = report.comparisons;

    expect(r174.peakEdgeThicknessMm).toBeLessThan(r167.peakEdgeThicknessMm);
    expect(r167.peakEdgeThicknessMm).toBeLessThan(r159.peakEdgeThicknessMm);
    expect(r159.peakEdgeThicknessMm).toBeLessThan(r150.peakEdgeThicknessMm);
    // At -6.00 D, CR-39 1.50 exceeds 6mm while Ultra-Thin 1.74 stays below 4mm
    expect(r150.peakEdgeThicknessMm).toBeGreaterThan(6.0);
    expect(r174.peakEdgeThicknessMm).toBeLessThan(4.0);
    expect(r174.fits4mmTitaniumRim).toBe(true);
    expect(r150.fits4mmTitaniumRim).toBe(false);
  });

  it('achieves >40% edge thickness reduction from 1.50 to 1.74 for -6.00 D myopia', () => {
    const report = computeOpticalRxReport(BASE_MYOPIA_600);
    const r150 = report.comparisons[0];
    const r174 = report.comparisons[3];

    expect(r150.edgeReductionPercentVs150).toBe(0);
    expect(r174.edgeReductionPercentVs150).toBeGreaterThan(40);
    expect(r174.edgeReductionPercentVs150).toBeLessThan(55);
  });

  it('computes hyperopic (+4.00 D) lenses thicker in the center than at the edge with strict monotonicity', () => {
    const report = computeOpticalRxReport({
      od: { sphereD: 4.0, cylinderD: 0, axisDeg: 0 },
      os: { sphereD: 4.0, cylinderD: 0, axisDeg: 0 },
      pdMm: 64,
      lensDiameterMm: 50,
      bridgeWidthMm: 20,
      blueLightFilterEnabled: false,
    });
    const [r150, r159, r167, r174] = report.comparisons;

    for (const row of report.comparisons) {
      expect(row.peakCenterThicknessMm).toBeGreaterThan(row.peakEdgeThicknessMm);
    }
    expect(r174.peakCenterThicknessMm).toBeLessThan(r167.peakCenterThicknessMm);
    expect(r167.peakCenterThicknessMm).toBeLessThan(r159.peakCenterThicknessMm);
    expect(r159.peakCenterThicknessMm).toBeLessThan(r150.peakCenterThicknessMm);
  });

  it('returns zero sagitta and flat center == edge thickness for Plano (0.00 D)', () => {
    const spec150 = REFRACTIVE_INDEX_SPECS[0];
    const res = computeEyeSagittaForMaterial(
      { sphereD: 0, cylinderD: 0, axisDeg: null },
      spec150,
      26
    );
    expect(res.sagittaMm).toBe(0);
    expect(res.centerThicknessMm).toBe(spec150.minCenterThicknessMm);
    expect(res.edgeThicknessMm).toBe(spec150.minCenterThicknessMm);
  });

  it('uses strongest meridian power (SPH + CYL) when astigmatism compounds myopia', () => {
    const dominant = getDominantMeridianPower({
      sphereD: -4.0,
      cylinderD: -2.0,
      axisDeg: 90,
    });
    expect(dominant).toBe(-6.0);

    const mixedDominant = getDominantMeridianPower({
      sphereD: 1.0,
      cylinderD: -2.5,
      axisDeg: 180,
    });
    expect(mixedDominant).toBe(-1.5);
  });

  it('increases effective semi-diameter and edge thickness for narrower PD due to optical decentration', () => {
    const narrowPd = computeEffectiveSemiDiameter(52, 56, 20);
    const widePd = computeEffectiveSemiDiameter(52, 72, 20);
    expect(narrowPd.decentrationPerEyeMm).toBeGreaterThan(widePd.decentrationPerEyeMm);
    expect(narrowPd.semiDiameterMm).toBeGreaterThan(widePd.semiDiameterMm);

    const narrowReport = computeOpticalRxReport({ ...BASE_MYOPIA_600, pdMm: 56 });
    const wideReport = computeOpticalRxReport({ ...BASE_MYOPIA_600, pdMm: 72 });
    expect(narrowReport.comparisons[0].peakEdgeThicknessMm).toBeGreaterThan(
      wideReport.comparisons[0].peakEdgeThicknessMm
    );
  });

  it('recommends the exact refractive index tier across all clinical power bands', () => {
    expect(recommendRefractiveIndex(0).id).toBe('cr39-150');
    expect(recommendRefractiveIndex(2.0).id).toBe('cr39-150');
    expect(recommendRefractiveIndex(2.25).id).toBe('poly-159');
    expect(recommendRefractiveIndex(3.75).id).toBe('poly-159');
    expect(recommendRefractiveIndex(4.0).id).toBe('high-167');
    expect(recommendRefractiveIndex(5.5).id).toBe('high-167');
    expect(recommendRefractiveIndex(6.0).id).toBe('ultra-174');
  });

  it('uses the stronger eye in asymmetric OD/OS prescriptions for recommendation and peak edge', () => {
    const asymmetric = computeOpticalRxReport({
      od: { sphereD: -1.5, cylinderD: 0, axisDeg: 0 },
      os: { sphereD: -6.25, cylinderD: -0.5, axisDeg: 170 },
      pdMm: 64,
      lensDiameterMm: 51,
      bridgeWidthMm: 20,
      blueLightFilterEnabled: true,
    });
    expect(asymmetric.strongestMeridianAbsD).toBe(6.75);
    expect(asymmetric.recommendedIndex.id).toBe('ultra-174');
    expect(asymmetric.comparisons[3].os.edgeThicknessMm).toBeGreaterThan(
      asymmetric.comparisons[3].od.edgeThicknessMm
    );
  });

  it('generates a complete 41-point 380nm–780nm spectral transmittance curve in 10nm steps', () => {
    const curve = computeSpectralTransmittanceCurve('uv400-blue-cut');
    expect(curve.samples).toHaveLength(41);
    expect(curve.samples[0].wavelengthNm).toBe(380);
    expect(curve.samples[curve.samples.length - 1].wavelengthNm).toBe(780);
  });

  it('verifies UV400 blocks >= 99% of <= 400nm radiation across clear and blue-cut filters', () => {
    const clear = computeSpectralTransmittanceCurve('uv400-ar');
    const blue = computeSpectralTransmittanceCurve('uv400-blue-cut');

    expect(clear.uv400BlockPercent).toBeGreaterThanOrEqual(99.5);
    expect(blue.uv400BlockPercent).toBeGreaterThanOrEqual(99.5);
    const pt400 = blue.samples.find((s) => s.wavelengthNm === 400);
    expect(pt400?.activeTransmittancePct).toBeLessThanOrEqual(0.5);
  });

  it('attenuates HEV 415–455nm blue light significantly more with Blue-Light filter while preserving >= 95% visible clarity', () => {
    const clear = computeSpectralTransmittanceCurve('uv400-ar');
    const blue = computeSpectralTransmittanceCurve('uv400-blue-cut');

    expect(blue.hevBlueFilterPercent).toBeGreaterThan(clear.hevBlueFilterPercent + 30);
    expect(blue.visibleAvgTransmittancePercent).toBeGreaterThanOrEqual(95);
    const pt430Blue = blue.samples.find((s) => s.wavelengthNm === 430);
    const pt430Clear = clear.samples.find((s) => s.wavelengthNm === 430);
    expect(pt430Blue!.activeTransmittancePct).toBeLessThan(pt430Clear!.activeTransmittancePct - 45);
  });

  it('builds an itemized cart upgrade payload with recommended index + blue-light surcharge', () => {
    const payload = buildOpticalRxCartPayload(BASE_MYOPIA_600);
    expect(payload.productId).toBe('mv-eye-01');
    expect(payload.indexSpec.id).toBe('ultra-174');
    expect(payload.unitPriceAddonUsd).toBe(240 + BLUE_LIGHT_STUDIO_SURCHARGE_USD);
    expect(payload.customMeta).toContain('Ultra-Thin 1.74');
    expect(payload.customMeta).toContain('UV400+HEV Blue');
    expect(payload.bespokeSummary).toContain('OD -6.00');
    expect(payload.bespokeSummary).toContain('PD 64mm');
  });

  it('allows overriding cart upgrade payload to a client-chosen refractive index without blue-light filter', () => {
    const payload = buildOpticalRxCartPayload(
      { ...BASE_MYOPIA_600, blueLightFilterEnabled: false },
      'high-167',
      'mv-eye-03'
    );
    expect(payload.productId).toBe('mv-eye-03');
    expect(payload.indexSpec.id).toBe('high-167');
    expect(payload.unitPriceAddonUsd).toBe(140);
    expect(payload.customMeta).toContain('UV400 AR');
  });

  it('formats positive, negative, and plano diopters cleanly', () => {
    expect(formatDiopter(-6)).toBe('-6.00 D');
    expect(formatDiopter(2.25)).toBe('+2.25 D');
    expect(formatDiopter(0)).toBe('0.00 D');
  });
});
