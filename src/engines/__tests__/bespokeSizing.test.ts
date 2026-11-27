import { describe, expect, it } from 'vitest';
import {
  clampPdMm,
  computeBespokeFit,
  computeBespokePricing,
  FACE_SHAPES,
  NOSE_BRIDGES,
  sanitizeEngravingText,
  TEMPLE_LENGTHS,
} from '../bespokeSizing';
import type { BespokeSizingInput, FaceShape } from '../../types/commerce';

const BASE_INPUT: BespokeSizingInput = {
  faceShape: 'oval',
  pdMm: 64,
  noseBridge: 'medium',
  templeLengthMm: 145,
  prescriptionTier: 'plano',
  engravingTier: 'none',
  engravingText: '',
};

describe('interactive face-shape recommender & millimeter bespoke sizing lab', () => {
  it('supports all 5 face shapes, 3 nose bridge profiles, and 4 temple lengths', () => {
    expect(FACE_SHAPES.map((f) => f.id)).toEqual([
      'oval',
      'square',
      'round',
      'heart',
      'diamond',
    ]);
    expect(NOSE_BRIDGES.map((b) => b.id)).toEqual(['low', 'medium', 'high']);
    expect([...TEMPLE_LENGTHS]).toEqual([138, 142, 145, 150]);
  });

  it('clamps pupillary distance strictly inside 56-72mm anatomical range', () => {
    expect(clampPdMm(48)).toBe(56);
    expect(clampPdMm(64.4)).toBe(64);
    expect(clampPdMm(80)).toBe(72);
    expect(clampPdMm(Number.NaN)).toBe(64);
  });

  it('produces valid 0-100% fit scores and 3 ranked silhouettes for every face shape', () => {
    const shapes: FaceShape[] = ['oval', 'square', 'round', 'heart', 'diamond'];
    for (const shape of shapes) {
      const report = computeBespokeFit({ ...BASE_INPUT, faceShape: shape });
      expect(report.overallFitScore).toBeGreaterThanOrEqual(60);
      expect(report.overallFitScore).toBeLessThanOrEqual(100);
      expect(report.recommendations).toHaveLength(3);
      expect(report.recommendations[0].fitScore).toBeGreaterThanOrEqual(
        report.recommendations[1].fitScore
      );
      expect(report.recommendations[1].fitScore).toBeGreaterThanOrEqual(
        report.recommendations[2].fitScore
      );
      expect(report.topRecommendation.productId).toBe(
        report.recommendations[0].productId
      );
    }
  });

  it('recommends VÉRA-01 Monolith for round faces, Archival Optical 04 for square faces, and Solaire Shield for diamond faces', () => {
    const round = computeBespokeFit({ ...BASE_INPUT, faceShape: 'round' });
    expect(round.topRecommendation.productId).toBe('mv-eye-01');

    const square = computeBespokeFit({ ...BASE_INPUT, faceShape: 'square', pdMm: 62, templeLengthMm: 142 });
    expect(square.topRecommendation.productId).toBe('mv-eye-03');

    const diamond = computeBespokeFit({ ...BASE_INPUT, faceShape: 'diamond', pdMm: 66, templeLengthMm: 145 });
    expect(diamond.topRecommendation.productId).toBe('mv-eye-02');
  });

  it('updates millimeter CAD blueprint dimensions dynamically with PD and nose bridge changes', () => {
    const narrowLow = computeBespokeFit({
      ...BASE_INPUT,
      pdMm: 58,
      noseBridge: 'low',
      templeLengthMm: 138,
    });
    const wideHigh = computeBespokeFit({
      ...BASE_INPUT,
      pdMm: 70,
      noseBridge: 'high',
      templeLengthMm: 150,
    });

    expect(narrowLow.blueprint.bridgeWidthMm).toBe(18);
    expect(narrowLow.blueprint.nosePadDropMm).toBe(6.5);
    expect(narrowLow.blueprint.templeLengthMm).toBe(138);

    expect(wideHigh.blueprint.bridgeWidthMm).toBe(22);
    expect(wideHigh.blueprint.nosePadDropMm).toBe(2.8);
    expect(wideHigh.blueprint.templeLengthMm).toBe(150);

    expect(wideHigh.blueprint.frameWidthMm).toBeGreaterThan(
      narrowLow.blueprint.frameWidthMm
    );
    expect(wideHigh.blueprint.blueprintCode).toContain('150mm');
  });

  it('penalizes severely mismatched temple length vs narrow PD while rewarding matched calibration', () => {
    const matched = computeBespokeFit({
      ...BASE_INPUT,
      pdMm: 57,
      templeLengthMm: 138,
    });
    const mismatched = computeBespokeFit({
      ...BASE_INPUT,
      pdMm: 57,
      templeLengthMm: 150,
    });
    expect(matched.overallFitScore).toBeGreaterThan(mismatched.overallFitScore);
  });

  it('calculates exact custom optical lens, prescription, and temple engraving surcharges', () => {
    const planoNone = computeBespokePricing('plano', 'none', 'clear-ar');
    expect(planoNone.totalAddonUsd).toBe(0);

    const svLaser = computeBespokePricing(
      'single-vision-167',
      'micro-laser',
      'polarized-amber'
    );
    expect(svLaser).toEqual({
      opticalLensUsd: 85,
      prescriptionUsd: 140,
      engravingUsd: 45,
      totalAddonUsd: 270,
    });

    const progGold = computeBespokePricing(
      'progressive-174',
      'gold-18k-inlay',
      'photochromic-uv'
    );
    expect(progGold).toEqual({
      opticalLensUsd: 110,
      prescriptionUsd: 260,
      engravingUsd: 95,
      totalAddonUsd: 465,
    });
  });

  it('sanitizes inner-temple engraving strings cleanly against unsafe characters and length', () => {
    expect(sanitizeEngravingText('  t.v. tinh <script>  ')).toBe('T.V. TINH SC');
    expect(sanitizeEngravingText('mv-01')).toBe('MV-01');
  });
});
