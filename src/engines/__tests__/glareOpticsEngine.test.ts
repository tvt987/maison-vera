import { describe, expect, it } from 'vitest';
import {
  clampAnalyzerAngleDeg,
  computeBrewsterAngleDeg,
  computeGlareOpticsTelemetry,
  computeMalusAttenuationCurve,
  GLARE_ENVIRONMENTS,
  OPTICAL_COATING_TIERS,
  UNCOATED_GLARE_ATTENUATION_PERCENT,
} from '../glareOpticsEngine';

describe('glareOpticsEngine — Brewster Angle & Malus Law Polarization Physics', () => {
  it('computes exact Brewster angle arctan(n2/n1) for seawater, wet asphalt, and alpine ice', () => {
    expect(computeBrewsterAngleDeg(1.333)).toBe(53.1);
    expect(computeBrewsterAngleDeg(1.36)).toBe(53.7);
    expect(computeBrewsterAngleDeg(1.31)).toBe(52.6);
  });

  it('defines all 3 real-world lighting environments and 3 coating tiers', () => {
    expect(GLARE_ENVIRONMENTS.map((e) => e.id)).toEqual([
      'mediterranean-ocean',
      'rain-night-highway',
      'alpine-snow',
    ]);
    expect(OPTICAL_COATING_TIERS.map((c) => c.id)).toEqual([
      'uncoated-cr39',
      'hydrophobic-ar',
      'polarized-blue-ar',
    ]);
  });

  it('reports 12.0% glare attenuation, 7.8% surface reflection, and 0 dB gain for Uncoated CR-39', () => {
    const res = computeGlareOpticsTelemetry('mediterranean-ocean', 'uncoated-cr39', 90);
    expect(res.glareAttenuationPercent).toBe(UNCOATED_GLARE_ATTENUATION_PERCENT);
    expect(res.glareAttenuationPercent).toBe(12.0);
    expect(res.surfaceReflectionPercent).toBe(7.8);
    expect(res.vltPercent).toBe(92.0);
    expect(res.contrastAcuityGainDb).toBe(0.0);
  });

  it('reports 0.4% surface reflection and 98.8% VLT for Multi-Layer Hydrophobic AR', () => {
    const ocean = computeGlareOpticsTelemetry('mediterranean-ocean', 'hydrophobic-ar', 90);
    const night = computeGlareOpticsTelemetry('rain-night-highway', 'hydrophobic-ar', 90);
    const snow = computeGlareOpticsTelemetry('alpine-snow', 'hydrophobic-ar', 90);

    expect(ocean.surfaceReflectionPercent).toBe(0.4);
    expect(ocean.vltPercent).toBe(98.8);
    expect(ocean.glareAttenuationPercent).toBe(48.5);
    expect(night.glareAttenuationPercent).toBe(64.2);
    expect(snow.glareAttenuationPercent).toBe(44.0);
    expect(night.contrastAcuityGainDb).toBeGreaterThan(ocean.contrastAcuityGainDb);
  });

  it('achieves 99.4% horizontal glare attenuation at crossed 90 deg analyzer on Mediterranean Ocean', () => {
    const pol = computeGlareOpticsTelemetry('mediterranean-ocean', 'polarized-blue-ar', 90);
    expect(pol.glareAttenuationPercent).toBe(99.4);
    expect(pol.surfaceReflectionPercent).toBe(0.4);
    expect(pol.vltPercent).toBe(24.0);
    expect(pol.malusCosSquared).toBe(0);
    expect(pol.contrastAcuityGainDb).toBeGreaterThan(15.0);
    expect(pol.residualGlareLuminanceCdM2).toBeLessThan(600);
  });

  it('obeys Malus Law I = I0 * cos^2(theta) strictly across 0, 30, 45, 60, and 90 degrees', () => {
    const a0 = computeGlareOpticsTelemetry('mediterranean-ocean', 'polarized-blue-ar', 0);
    const a30 = computeGlareOpticsTelemetry('mediterranean-ocean', 'polarized-blue-ar', 30);
    const a45 = computeGlareOpticsTelemetry('mediterranean-ocean', 'polarized-blue-ar', 45);
    const a60 = computeGlareOpticsTelemetry('mediterranean-ocean', 'polarized-blue-ar', 60);
    const a90 = computeGlareOpticsTelemetry('mediterranean-ocean', 'polarized-blue-ar', 90);

    expect(a0.malusCosSquared).toBe(1);
    expect(a45.malusCosSquared).toBeCloseTo(0.5, 2);
    expect(a90.malusCosSquared).toBe(0);

    expect(a0.glareAttenuationPercent).toBe(42.0);
    expect(a45.glareAttenuationPercent).toBe(70.7);
    expect(a90.glareAttenuationPercent).toBe(99.4);

    // Strictly monotonic increase in glare attenuation as analyzer rotates from 0 -> 90 deg
    expect(a90.glareAttenuationPercent).toBeGreaterThan(a60.glareAttenuationPercent);
    expect(a60.glareAttenuationPercent).toBeGreaterThan(a45.glareAttenuationPercent);
    expect(a45.glareAttenuationPercent).toBeGreaterThan(a30.glareAttenuationPercent);
    expect(a30.glareAttenuationPercent).toBeGreaterThan(a0.glareAttenuationPercent);

    // Residual glare luminance drops monotonically
    expect(a90.residualGlareLuminanceCdM2).toBeLessThan(a45.residualGlareLuminanceCdM2);
    expect(a45.residualGlareLuminanceCdM2).toBeLessThan(a0.residualGlareLuminanceCdM2);
  });

  it('differentiates residual glare luminance & peak attenuation across all 3 lighting environments', () => {
    const ocean = computeGlareOpticsTelemetry('mediterranean-ocean', 'polarized-blue-ar', 90);
    const night = computeGlareOpticsTelemetry('rain-night-highway', 'polarized-blue-ar', 90);
    const snow = computeGlareOpticsTelemetry('alpine-snow', 'polarized-blue-ar', 90);

    expect(ocean.glareAttenuationPercent).toBe(99.4);
    expect(night.glareAttenuationPercent).toBe(96.2);
    expect(snow.glareAttenuationPercent).toBe(98.9);

    expect(ocean.brewsterAngleDeg).toBe(53.1);
    expect(night.brewsterAngleDeg).toBe(53.7);
    expect(snow.brewsterAngleDeg).toBe(52.6);
  });

  it('strictly improves glare attenuation from Uncoated -> Hydrophobic AR -> Polarized + Blue-Light AR', () => {
    for (const env of GLARE_ENVIRONMENTS) {
      const uncoated = computeGlareOpticsTelemetry(env.id, 'uncoated-cr39', 90);
      const ar = computeGlareOpticsTelemetry(env.id, 'hydrophobic-ar', 90);
      const polar = computeGlareOpticsTelemetry(env.id, 'polarized-blue-ar', 90);

      expect(ar.glareAttenuationPercent).toBeGreaterThan(uncoated.glareAttenuationPercent);
      expect(polar.glareAttenuationPercent).toBeGreaterThan(ar.glareAttenuationPercent);
      expect(polar.contrastAcuityGainDb).toBeGreaterThan(ar.contrastAcuityGainDb);
    }
  });

  it('clamps invalid or out-of-bounds analyzer angles safely to [0, 90]', () => {
    expect(clampAnalyzerAngleDeg(-15)).toBe(0);
    expect(clampAnalyzerAngleDeg(120)).toBe(90);
    expect(clampAnalyzerAngleDeg(Number.NaN)).toBe(90);
    expect(clampAnalyzerAngleDeg(45.24)).toBe(45.2);
  });

  it('generates a deterministic 19-point Malus attenuation curve from 0° to 90°', () => {
    const curve = computeMalusAttenuationCurve('alpine-snow', 'polarized-blue-ar');
    expect(curve).toHaveLength(19);
    expect(curve[0].angleDeg).toBe(0);
    expect(curve[18].angleDeg).toBe(90);
    expect(curve[0].glareAttenuationPercent).toBe(45.0);
    expect(curve[18].glareAttenuationPercent).toBe(98.9);

    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].glareAttenuationPercent).toBeGreaterThanOrEqual(
        curve[i - 1].glareAttenuationPercent
      );
    }
  });

  it('keeps non-polarized coatings invariant with analyzer angle theta', () => {
    const ar0 = computeGlareOpticsTelemetry('mediterranean-ocean', 'hydrophobic-ar', 0);
    const ar90 = computeGlareOpticsTelemetry('mediterranean-ocean', 'hydrophobic-ar', 90);
    expect(ar0.glareAttenuationPercent).toBe(ar90.glareAttenuationPercent);
  });

  it('maps polarized-blue-ar to polarized-amber Hero 3D studio lens mode', () => {
    const pol = computeGlareOpticsTelemetry('mediterranean-ocean', 'polarized-blue-ar', 90);
    expect(pol.coating.mappedHeroLensMode).toBe('polarized-amber');
    expect(pol.uv400BlockPercent).toBe(99.9);
    expect(pol.blueLightCutPercent).toBe(78.0);
  });
});
