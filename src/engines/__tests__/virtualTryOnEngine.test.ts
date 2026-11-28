import { describe, expect, it } from 'vitest';
import {
  clampHeadPose,
  clampTryOnPdMm,
  computePhotochromicUvPhysics,
  computePolarizedGlareShield,
  createHeadPoseFilter,
  estimateFacePoseFromImageData,
  evaluateVirtualTryOnFit,
  FACE_ARCHETYPES,
  getFaceArchetype,
  getTryOnFrameSpec,
  HEAD_PITCH_LIMIT_DEG,
  HEAD_ROLL_LIMIT_DEG,
  HEAD_YAW_LIMIT_DEG,
  resolveTryOnLensMaterialState,
  stepHeadPoseFilter,
  TRYON_FRAME_SPECS,
  TRYON_PD_MAX_MM,
  TRYON_PD_MIN_MM,
  type FaceArchetypeId,
} from '../virtualTryOnEngine';

function createSyntheticFaceRgba(
  width: number,
  height: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        // Warm skin tone well inside YCbCr chrominance envelope
        data[idx] = 212;
        data[idx + 1] = 160;
        data[idx + 2] = 128;
        data[idx + 3] = 255;
      } else {
        // Neutral cool studio wall
        data[idx] = 28;
        data[idx + 1] = 32;
        data[idx + 2] = 44;
        data[idx + 3] = 255;
      }
    }
  }
  return data;
}

describe('virtualTryOnEngine v7.0 — Face Archetypes & 3D Seating Fit', () => {
  it('defines all 4 anthropometric face archetypes within exact physical bounds', () => {
    expect(FACE_ARCHETYPES).toHaveLength(4);
    const ids = FACE_ARCHETYPES.map((a) => a.id);
    expect(ids).toEqual(['OVAL', 'ANGULAR', 'HEART', 'ROUND']);

    for (const arch of FACE_ARCHETYPES) {
      expect(arch.templeWidthMm).toBeGreaterThanOrEqual(132);
      expect(arch.templeWidthMm).toBeLessThanOrEqual(148);
      expect(arch.noseBridgeHeightMm).toBeGreaterThanOrEqual(16);
      expect(arch.noseBridgeHeightMm).toBeLessThanOrEqual(22);
      expect(arch.cheekClearanceOffsetMm).toBeGreaterThan(2);
      expect(arch.sculptProfile.craniumWidthScale).toBeGreaterThan(0.8);
    }
  });

  it('defines 4 Sabae eyewear geometry specs with distinct outer widths', () => {
    expect(TRYON_FRAME_SPECS).toHaveLength(4);
    expect(getTryOnFrameSpec('MV-EYE-01').lensWidthMm).toBe(51);
    expect(getTryOnFrameSpec('MV-EYE-02').lensWidthMm).toBe(54);
    expect(getTryOnFrameSpec('MV-EYE-03').lensWidthMm).toBe(48);
    expect(getTryOnFrameSpec('MV-EYE-04').lensWidthMm).toBe(46);
  });

  it('clamps physiological PD strictly to 56-74 mm and recovers from NaN', () => {
    expect(clampTryOnPdMm(42)).toBe(TRYON_PD_MIN_MM);
    expect(clampTryOnPdMm(88)).toBe(TRYON_PD_MAX_MM);
    expect(clampTryOnPdMm(64.5)).toBe(64.5);
    expect(clampTryOnPdMm(Number.NaN)).toBe(TRYON_PD_MIN_MM);
  });

  it('computes high Atelier Fit Score for OVAL face wearing VÉRA-01 Monolith at 64mm PD', () => {
    const evalFit = evaluateVirtualTryOnFit('OVAL', 'MV-EYE-01', 64);
    expect(evalFit.fitScore).toBeGreaterThanOrEqual(88);
    expect(evalFit.fitScore).toBeLessThanOrEqual(100);
    expect(evalFit.templeClearanceMm).toBeCloseTo(2.0, 1);
    expect(evalFit.bridgeVerdictCode).toBe('atelier-optimal');
    expect(evalFit.transform3d.scaleX).toBeCloseTo(1.0, 2);
  });

  it('assigns High-Bridge Precision Seat for ANGULAR archetype with wider 54mm Aviator', () => {
    const evalFit = evaluateVirtualTryOnFit('ANGULAR', 'MV-EYE-02', 68);
    expect(evalFit.archetype.templeWidthMm).toBe(146);
    expect(evalFit.templeClearanceMm).toBeCloseTo(1.0, 1);
    expect(evalFit.bridgeVerdictCode).toBe('high-bridge-poise');
    expect(evalFit.transform3d.scaleX).toBeGreaterThan(1.02);
    expect(evalFit.transform3d.offsetY).toBeGreaterThan(0);
  });

  it('triggers Raised Titanium Nose-Pad Lift on ROUND face for extra cheek clearance', () => {
    const evalFit = evaluateVirtualTryOnFit('ROUND', 'MV-EYE-01', 64);
    expect(evalFit.bridgeVerdictCode).toBe('custom-nosepad-lift');
    expect(evalFit.transform3d.offsetZ).toBeGreaterThan(0);
  });

  it('penalizes snug temple tension when compact 46mm Panto is fitted on wide ANGULAR face', () => {
    const snug = evaluateVirtualTryOnFit('ANGULAR', 'MV-EYE-04', 70);
    const tailored = evaluateVirtualTryOnFit('ANGULAR', 'MV-EYE-02', 70);
    expect(snug.templeClearanceMm).toBeLessThan(0);
    expect(snug.fitScore).toBeLessThan(tailored.fitScore);
    expect(snug.transform3d.templeSplayRad).toBeGreaterThan(tailored.transform3d.templeSplayRad);
  });

  it('favors compact 46mm-48mm frames on narrower HEART face at 60mm PD', () => {
    const compact = evaluateVirtualTryOnFit('HEART', 'MV-EYE-04', 60);
    const oversized = evaluateVirtualTryOnFit('HEART', 'MV-EYE-02', 60);
    expect(compact.fitScore).toBeGreaterThan(oversized.fitScore);
    expect(oversized.templeClearanceMm).toBeGreaterThan(compact.templeClearanceMm);
  });

  it('is 100% deterministic across repeated evaluations for every archetype', () => {
    const archetypes: FaceArchetypeId[] = ['OVAL', 'ANGULAR', 'HEART', 'ROUND'];
    for (const id of archetypes) {
      const a = evaluateVirtualTryOnFit(id, 'MV-EYE-01', 65);
      const b = evaluateVirtualTryOnFit(id, 'MV-EYE-01', 65);
      expect(a).toEqual(b);
      expect(getFaceArchetype(id).id).toBe(id);
    }
  });
});

describe('virtualTryOnEngine v7.0 — Real-Time Photochromic UV Darkening Physics', () => {
  it('yields 88.0% optical transmission & CAT 0 clear state at UV Index 0', () => {
    const uv0 = computePhotochromicUvPhysics(0);
    expect(uv0.uvIndex).toBe(0);
    expect(uv0.activation).toBe(0);
    expect(uv0.opticalTransmissionPercent).toBe(88.0);
    expect(uv0.filterCategory).toBe('CAT 0');
    expect(uv0.uv400BlockPercent).toBe(99.9);
    expect(uv0.tintRgb[0]).toBeGreaterThan(200);
  });

  it('yields 14.0% optical transmission & CAT 3 deep sun tint at UV Index 11', () => {
    const uv11 = computePhotochromicUvPhysics(11);
    expect(uv11.uvIndex).toBe(11);
    expect(uv11.activation).toBe(1);
    expect(uv11.opticalTransmissionPercent).toBe(14.0);
    expect(uv11.filterCategory).toBe('CAT 3');
    expect(uv11.uv400BlockPercent).toBe(99.9);
    expect(uv11.lensOpacity).toBeGreaterThan(0.88);
    expect(uv11.tintRgb[0]).toBeLessThan(40);
  });

  it('monotonically decreases optical transmission and increases opacity from UV 0 to 11', () => {
    let prevVlt = 100;
    let prevOpacity = 0;
    let prevLuma = 255;

    for (let uv = 0; uv <= 11; uv++) {
      const state = computePhotochromicUvPhysics(uv);
      expect(state.opticalTransmissionPercent).toBeLessThan(prevVlt);
      expect(state.lensOpacity).toBeGreaterThan(prevOpacity);
      const luma =
        0.299 * state.tintRgb[0] + 0.587 * state.tintRgb[1] + 0.114 * state.tintRgb[2];
      expect(luma).toBeLessThan(prevLuma);
      expect(state.uv400BlockPercent).toBe(99.9);
      prevVlt = state.opticalTransmissionPercent;
      prevOpacity = state.lensOpacity;
      prevLuma = luma;
    }
  });

  it('clamps out-of-range and NaN UV indices cleanly', () => {
    expect(computePhotochromicUvPhysics(-4).uvIndex).toBe(0);
    expect(computePhotochromicUvPhysics(25).uvIndex).toBe(11);
    expect(computePhotochromicUvPhysics(Number.NaN).uvIndex).toBe(0);
  });

  it('maps resolveTryOnLensMaterialState seamlessly for photochromic and fixed modes', () => {
    const photoLow = resolveTryOnLensMaterialState('photochromic-uv', 0);
    const photoHigh = resolveTryOnLensMaterialState('photochromic-uv', 11);
    expect(photoLow.isPhotochromicActive).toBe(true);
    expect(photoLow.vltPercent).toBe(88.0);
    expect(photoHigh.vltPercent).toBe(14.0);

    const amber = resolveTryOnLensMaterialState('polarized-amber', 8);
    expect(amber.isPhotochromicActive).toBe(false);
    expect(amber.uv400BlockPercent).toBe(99.9);
    expect(amber.hexColor).toBe('#B86B2B');

    const grad = resolveTryOnLensMaterialState('midnight-gradient', 5);
    expect(grad.gradientBottomHex).toBeDefined();
  });
});

describe('virtualTryOnEngine v7.0 — Polarized Glare Shield (Malus Law cos²θ)', () => {
  it('blocks 99.4% horizontal glare at crossed 90 deg when polarized shield is active', () => {
    const shield = computePolarizedGlareShield(90, true);
    expect(shield.glareAngleDeg).toBe(90);
    expect(shield.malusCosSquared).toBe(0);
    expect(shield.glareReductionPercent).toBe(99.4);
    expect(shield.rivieraClarityGainDb).toBeGreaterThan(15);
    expect(shield.glareVeilOpacity).toBeLessThan(0.05);
  });

  it('obeys Malus cos²(45 deg) = 0.5 intermediate glare attenuation (~70.7%)', () => {
    const shield = computePolarizedGlareShield(45, true);
    expect(shield.malusCosSquared).toBeCloseTo(0.5, 3);
    expect(shield.glareReductionPercent).toBeCloseTo(70.7, 1);
  });

  it('yields parallel 42.0% attenuation at 0 deg (cos²0 = 1)', () => {
    const shield = computePolarizedGlareShield(0, true);
    expect(shield.malusCosSquared).toBe(1);
    expect(shield.glareReductionPercent).toBe(42.0);
  });

  it('drops to baseline 12.0% reduction and high glare veil when polarized shield is disabled', () => {
    const off = computePolarizedGlareShield(90, false);
    expect(off.polarizedActive).toBe(false);
    expect(off.glareReductionPercent).toBe(12.0);
    expect(off.rivieraClarityGainDb).toBe(0);
    expect(off.glareVeilOpacity).toBeGreaterThan(0.65);
  });

  it('increases glare attenuation monotonically from 0 deg to 90 deg when polarized', () => {
    let prev = -1;
    for (let angle = 0; angle <= 90; angle += 10) {
      const s = computePolarizedGlareShield(angle, true);
      expect(s.glareReductionPercent).toBeGreaterThan(prev);
      prev = s.glareReductionPercent;
    }
  });

  it('clamps invalid glare angles into [0, 90]', () => {
    expect(computePolarizedGlareShield(-30, true).glareAngleDeg).toBe(0);
    expect(computePolarizedGlareShield(145, true).glareAngleDeg).toBe(90);
    expect(computePolarizedGlareShield(Number.NaN, true).glareAngleDeg).toBe(0);
  });
});

describe('virtualTryOnEngine v7.0 — 6-DOF Head Pose Smoothing Filter', () => {
  it('clamps extreme head rotations and scale into natural anthropometric bounds', () => {
    const clamped = clampHeadPose({
      yawDeg: 140,
      pitchDeg: -80,
      rollDeg: 95,
      tx: 4,
      ty: -3,
      scale: 5,
      ipdPx: 999,
    });
    expect(clamped.yawDeg).toBe(HEAD_YAW_LIMIT_DEG);
    expect(clamped.pitchDeg).toBe(-HEAD_PITCH_LIMIT_DEG);
    expect(clamped.rollDeg).toBe(HEAD_ROLL_LIMIT_DEG);
    expect(clamped.tx).toBe(1);
    expect(clamped.ty).toBe(-1);
    expect(clamped.scale).toBe(1.6);
    expect(clamped.ipdPx).toBe(420);
  });

  it('initializes immediately on first measurement and smoothly tracks step rotations', () => {
    let filter = createHeadPoseFilter();
    filter = stepHeadPoseFilter(filter, {
      yawDeg: 0,
      pitchDeg: 0,
      rollDeg: 0,
      tx: 0,
      ty: 0,
      scale: 1,
      ipdPx: 140,
    });
    expect(filter.initialized).toBe(true);
    expect(filter.pose.yawDeg).toBe(0);

    // Step to +32 deg yaw
    const step1 = stepHeadPoseFilter(filter, {
      yawDeg: 32,
      pitchDeg: -8,
      rollDeg: 4,
      tx: 0.2,
      ty: -0.1,
      scale: 1.1,
      ipdPx: 155,
    });
    expect(step1.pose.yawDeg).toBeGreaterThan(5);
    expect(step1.pose.yawDeg).toBeLessThan(32);

    // Converges smoothly within 20 frames without overshoot
    let curr = step1;
    for (let i = 0; i < 25; i++) {
      curr = stepHeadPoseFilter(curr, {
        yawDeg: 32,
        pitchDeg: -8,
        rollDeg: 4,
        tx: 0.2,
        ty: -0.1,
        scale: 1.1,
        ipdPx: 155,
      });
    }
    expect(curr.pose.yawDeg).toBeCloseTo(32, 0);
    expect(curr.pose.pitchDeg).toBeCloseTo(-8, 0);
    expect(curr.pose.scale).toBeCloseTo(1.1, 2);
  });

  it('suppresses high-frequency micro-jitter inside the dead-zone', () => {
    let filter = createHeadPoseFilter({
      yawDeg: 10,
      pitchDeg: 2,
      rollDeg: 0,
      tx: 0,
      ty: 0,
      scale: 1,
      ipdPx: 140,
    });
    const maxDeviation: number[] = [];
    for (let i = 0; i < 12; i++) {
      const jitter = i % 2 === 0 ? 0.28 : -0.28;
      filter = stepHeadPoseFilter(filter, {
        yawDeg: 10 + jitter,
        pitchDeg: 2 - jitter * 0.5,
        rollDeg: 0,
        tx: 0,
        ty: 0,
        scale: 1,
        ipdPx: 140,
      });
      maxDeviation.push(Math.abs(filter.pose.yawDeg - 10));
    }
    expect(Math.max(...maxDeviation)).toBeLessThan(0.05);
  });

  it('adapts gain faster on large intentional turns than tiny movements', () => {
    const base = createHeadPoseFilter({
      yawDeg: 0,
      pitchDeg: 0,
      rollDeg: 0,
      tx: 0,
      ty: 0,
      scale: 1,
      ipdPx: 140,
    });
    const smallTurn = stepHeadPoseFilter(base, {
      yawDeg: 2,
      pitchDeg: 0,
      rollDeg: 0,
      tx: 0,
      ty: 0,
      scale: 1,
      ipdPx: 140,
    });
    const bigTurn = stepHeadPoseFilter(base, {
      yawDeg: 40,
      pitchDeg: 0,
      rollDeg: 0,
      tx: 0,
      ty: 0,
      scale: 1,
      ipdPx: 140,
    });
    const smallRatio = smallTurn.pose.yawDeg / 2;
    const bigRatio = bigTurn.pose.yawDeg / 40;
    expect(bigRatio).toBeGreaterThan(smallRatio);
  });
});

describe('virtualTryOnEngine v7.0 — On-Device Privacy-First Webcam Face Estimator', () => {
  it('returns detected=false safely on dark/empty frames and invalid dimensions', () => {
    const empty = new Uint8ClampedArray(64 * 48 * 4);
    const darkEst = estimateFacePoseFromImageData(empty, 64, 48);
    expect(darkEst.detected).toBe(false);
    expect(darkEst.confidence).toBe(0);

    const bad = estimateFacePoseFromImageData(new Uint8ClampedArray(0), 0, 0);
    expect(bad.detected).toBe(false);
  });

  it('detects a centered synthetic portrait oval with near-zero offset & strong confidence', () => {
    const rgba = createSyntheticFaceRgba(96, 72, 48, 34, 15, 20);
    const est = estimateFacePoseFromImageData(rgba, 96, 72);
    expect(est.detected).toBe(true);
    expect(est.confidence).toBeGreaterThan(0.5);
    expect(Math.abs(est.centerXNorm)).toBeLessThan(0.08);
    expect(Math.abs(est.centerYNorm)).toBeLessThan(0.12);
    expect(est.faceWidthRatio).toBeGreaterThan(0.2);
    expect(est.estimatedIpdPx).toBeGreaterThan(80);
  });

  it('tracks horizontal face shift and infers matching yaw direction', () => {
    const leftFace = createSyntheticFaceRgba(96, 72, 30, 34, 14, 19);
    const rightFace = createSyntheticFaceRgba(96, 72, 66, 34, 14, 19);
    const estLeft = estimateFacePoseFromImageData(leftFace, 96, 72);
    const estRight = estimateFacePoseFromImageData(rightFace, 96, 72);
    expect(estLeft.detected).toBe(true);
    expect(estRight.detected).toBe(true);
    expect(estLeft.centerXNorm).toBeLessThan(0);
    expect(estRight.centerXNorm).toBeGreaterThan(0);
    expect(estLeft.estimatedYawDeg).toBeGreaterThan(estRight.estimatedYawDeg);
  });

  it('scales estimated IPD and faceWidthRatio proportionally with apparent face distance', () => {
    const farFace = createSyntheticFaceRgba(96, 72, 48, 34, 10, 14);
    const nearFace = createSyntheticFaceRgba(96, 72, 48, 34, 22, 26);
    const estFar = estimateFacePoseFromImageData(farFace, 96, 72);
    const estNear = estimateFacePoseFromImageData(nearFace, 96, 72);
    expect(estNear.faceWidthRatio).toBeGreaterThan(estFar.faceWidthRatio);
    expect(estNear.estimatedIpdPx).toBeGreaterThan(estFar.estimatedIpdPx);
  });
});
