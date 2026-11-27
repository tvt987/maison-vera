import type {
  EyePrescriptionInput,
  LocalizedText,
  OpticalFitVerdict,
  PrismBaseDirection,
  SabaeFrameSkuId,
} from '../types/commerce';

export interface SabaeOpticalFrameSpec {
  sku: SabaeFrameSkuId;
  productId: string;
  name: LocalizedText;
  shortLabel: LocalizedText;
  silhouetteLabel: LocalizedText;
  lensWidthMm: number; // Boxed A dimension
  bridgeWidthMm: number; // DBL (Distance Between Lenses)
  effectiveDiameterMm: number; // ED (maximum diagonal lens diameter)
  framePdMm: number; // GCD = A + DBL
  idealPdRangeMm: readonly [number, number];
}

export interface FrameDecentrationEvaluation {
  frame: SabaeOpticalFrameSpec;
  pdMm: number;
  framePdMm: number;
  decentrationPerEyeMm: number; // Signed: ((A + DBL) - PD) / 2
  absDecentrationMm: number;
  decentrationDirection: 'zero-centered' | 'inward-nasal' | 'outward-temporal';
  odHorizontalPowerD: number;
  osHorizontalPowerD: number;
  peakHorizontalPowerD: number;
  odPrismDiopters: number; // Prentice's Rule: Delta = (|Dec| / 10) * |F_h|
  osPrismDiopters: number;
  peakPrismDiopters: number;
  prismBaseDirection: PrismBaseDirection;
  withinAnsiZ80Tolerance: boolean; // <= 0.67 Delta uncompensated horizontal prism
  minimumBlankSizeMm: number; // MBS = ED + 2*|Dec| + 2.0 mm
  recommendedStockBlankMm: 65 | 70 | 75 | 80;
  fitsStandard70mmBlank: boolean;
  opticalFitScore: number; // 35..100
  verdict: OpticalFitVerdict;
  verdictLabel: LocalizedText;
  verdictGuidance: LocalizedText;
}

export interface DecentrationSuiteReport {
  pdMm: number;
  evaluations: FrameDecentrationEvaluation[];
  bestFrame: FrameDecentrationEvaluation;
}

export const ANSI_Z80_HORIZONTAL_PRISM_LIMIT_DELTA = 0.67;
export const STANDARD_STOCK_BLANK_MM = 70.0;
export const EDGING_ALLOWANCE_MM = 2.0;

export const SABAE_OPTICAL_FRAMES: readonly SabaeOpticalFrameSpec[] = [
  {
    sku: 'MV-EYE-04',
    productId: 'mv-eye-03',
    name: {
      en: 'Panto 46 Sabae Titanium',
      vi: 'Panto 46 Titan Sabae',
    },
    shortLabel: {
      en: '46 mm Panto',
      vi: 'Panto 46 mm',
    },
    silhouetteLabel: {
      en: 'Compact Crown-Panto · High-Rx Zero-Prism',
      vi: 'Crown-Panto Gọn · Tối Ưu Độ Cận Cao',
    },
    lensWidthMm: 46,
    bridgeWidthMm: 21,
    effectiveDiameterMm: 48,
    framePdMm: 67,
    idealPdRangeMm: [56, 65],
  },
  {
    sku: 'MV-EYE-03',
    productId: 'mv-eye-03',
    name: {
      en: 'Archival Optical 04 (48 mm)',
      vi: 'Archival Optical 04 (48 mm)',
    },
    shortLabel: {
      en: '48 mm Archival',
      vi: 'Archival 48 mm',
    },
    silhouetteLabel: {
      en: '8mm Takiron Acetate Panto · Classic Keyhole',
      vi: 'Acetate Takiron 8mm · Cầu Khóa Cổ Điển',
    },
    lensWidthMm: 48,
    bridgeWidthMm: 21,
    effectiveDiameterMm: 50,
    framePdMm: 69,
    idealPdRangeMm: [59, 68],
  },
  {
    sku: 'MV-EYE-01',
    productId: 'mv-eye-01',
    name: {
      en: 'VÉRA-01 Monolith (51 mm)',
      vi: 'VÉRA-01 Monolith (51 mm)',
    },
    shortLabel: {
      en: '51 mm Monolith',
      vi: 'Monolith 51 mm',
    },
    silhouetteLabel: {
      en: 'Grade-5 Sabae Titanium Octagon · 4mm Billet',
      vi: 'Bát Giác Titan Cấp 5 Sabae · Phôi 4mm',
    },
    lensWidthMm: 51,
    bridgeWidthMm: 20,
    effectiveDiameterMm: 53,
    framePdMm: 71,
    idealPdRangeMm: [62, 71],
  },
  {
    sku: 'MV-EYE-02',
    productId: 'mv-eye-02',
    name: {
      en: 'Solaire 54 Aviator Shield',
      vi: 'Solaire 54 Phi Công Shield',
    },
    shortLabel: {
      en: '54 mm Aviator',
      vi: 'Aviator 54 mm',
    },
    silhouetteLabel: {
      en: 'Grand-Touring Double-Bar Titanium Aviator',
      vi: 'Gọng Kép Titan Dáng Phi Công Du Hành',
    },
    lensWidthMm: 54,
    bridgeWidthMm: 19,
    effectiveDiameterMm: 58,
    framePdMm: 73,
    idealPdRangeMm: [65, 74],
  },
] as const;

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

export function clampPhysiologicalPdMm(pdMm: number): number {
  if (!Number.isFinite(pdMm)) return 64.0;
  return round1(Math.max(54.0, Math.min(74.0, pdMm)));
}

/**
 * Resolves exact refractive power along the horizontal 180-deg meridian:
 *   F_h = SPH + CYL * sin^2(axis)
 * When CYL = 0, F_h equals Sphere power identically.
 */
export function computeHorizontalMeridianPowerD(eye: EyePrescriptionInput): number {
  const sph = Number.isFinite(eye.sphereD) ? eye.sphereD : 0;
  const cyl = Number.isFinite(eye.cylinderD) ? eye.cylinderD : 0;
  if (Math.abs(cyl) < 1e-6) {
    return round2(sph);
  }
  const axisDeg = eye.axisDeg !== null && Number.isFinite(eye.axisDeg) ? eye.axisDeg : 90;
  const sinAxis = Math.sin((axisDeg * Math.PI) / 180);
  return round2(sph + cyl * sinAxis * sinAxis);
}

/**
 * Exact Per-Eye Horizontal Optical Decentration:
 *   Dec = ((A + DBL) - PD) / 2
 * Positive => Inward (Nasal) decentration; Negative => Outward (Temporal) decentration.
 */
export function computePerEyeDecentrationMm(
  lensWidthMm: number,
  bridgeWidthMm: number,
  pdMm: number
): number {
  const safePd = clampPhysiologicalPdMm(pdMm);
  return round2((lensWidthMm + bridgeWidthMm - safePd) / 2);
}

/**
 * Prentice's Rule Prismatic Effect:
 *   Delta = c * |F| = (|Dec_mm| / 10) * |F_horizontal|
 */
export function computePrenticePrismDiopters(
  decentrationMm: number,
  horizontalPowerD: number
): number {
  const cCm = Math.abs(decentrationMm) / 10.0;
  return round2(cCm * Math.abs(horizontalPowerD));
}

/**
 * Minimum Uncut Lens Blank Diameter (MBS):
 *   MBS = ED + 2 * |Dec| + 2.0 mm edging allowance
 */
export function computeMinimumBlankSizeMm(
  effectiveDiameterMm: number,
  decentrationMm: number
): number {
  return round1(effectiveDiameterMm + 2 * Math.abs(decentrationMm) + EDGING_ALLOWANCE_MM);
}

export function getSabaeFrameBySku(sku: SabaeFrameSkuId): SabaeOpticalFrameSpec {
  return SABAE_OPTICAL_FRAMES.find((f) => f.sku === sku) ?? SABAE_OPTICAL_FRAMES[2];
}

export function evaluateFrameDecentration(
  frame: SabaeOpticalFrameSpec,
  pdMm: number,
  od: EyePrescriptionInput,
  os: EyePrescriptionInput
): FrameDecentrationEvaluation {
  const clampedPd = clampPhysiologicalPdMm(pdMm);
  const framePdMm = round1(frame.lensWidthMm + frame.bridgeWidthMm);
  const decentrationPerEyeMm = computePerEyeDecentrationMm(
    frame.lensWidthMm,
    frame.bridgeWidthMm,
    clampedPd
  );
  const absDecentrationMm = round2(Math.abs(decentrationPerEyeMm));

  const decentrationDirection: FrameDecentrationEvaluation['decentrationDirection'] =
    absDecentrationMm < 0.05
      ? 'zero-centered'
      : decentrationPerEyeMm > 0
      ? 'inward-nasal'
      : 'outward-temporal';

  const odHorizontalPowerD = computeHorizontalMeridianPowerD(od);
  const osHorizontalPowerD = computeHorizontalMeridianPowerD(os);
  const peakHorizontalPowerD =
    Math.abs(odHorizontalPowerD) >= Math.abs(osHorizontalPowerD)
      ? odHorizontalPowerD
      : osHorizontalPowerD;

  const odPrismDiopters = computePrenticePrismDiopters(decentrationPerEyeMm, odHorizontalPowerD);
  const osPrismDiopters = computePrenticePrismDiopters(decentrationPerEyeMm, osHorizontalPowerD);
  const peakPrismDiopters = round2(Math.max(odPrismDiopters, osPrismDiopters));

  let prismBaseDirection: PrismBaseDirection = 'none';
  if (peakPrismDiopters >= 0.01) {
    const isBaseIn =
      (peakHorizontalPowerD < 0 && decentrationPerEyeMm > 0) ||
      (peakHorizontalPowerD > 0 && decentrationPerEyeMm < 0);
    prismBaseDirection = isBaseIn ? 'base-in' : 'base-out';
  }

  const withinAnsiZ80Tolerance = peakPrismDiopters <= ANSI_Z80_HORIZONTAL_PRISM_LIMIT_DELTA + 1e-6;
  const minimumBlankSizeMm = computeMinimumBlankSizeMm(
    frame.effectiveDiameterMm,
    decentrationPerEyeMm
  );
  const recommendedStockBlankMm: 65 | 70 | 75 | 80 =
    minimumBlankSizeMm <= 65
      ? 65
      : minimumBlankSizeMm <= 70
      ? 70
      : minimumBlankSizeMm <= 75
      ? 75
      : 80;
  const fitsStandard70mmBlank = minimumBlankSizeMm <= STANDARD_STOCK_BLANK_MM + 1e-6;

  const decPenalty = Math.max(0, absDecentrationMm - 1.5) * 6.5;
  const prismPenalty = Math.max(0, peakPrismDiopters - 0.5) * 8.0;
  const mbsPenalty = Math.max(0, minimumBlankSizeMm - 68.0) * 2.2;
  const opticalFitScore = Math.max(
    35,
    Math.min(100, Math.round(100 - decPenalty - prismPenalty - mbsPenalty))
  );

  let verdict: OpticalFitVerdict;
  let verdictLabel: LocalizedText;
  let verdictGuidance: LocalizedText;

  if (absDecentrationMm <= 3.0 && fitsStandard70mmBlank && peakPrismDiopters <= 1.5) {
    verdict = 'zero-prism-optimal';
    verdictLabel = {
      en: 'Razor-Sharp Zero-Prism Match',
      vi: 'Chuẩn Quang Học Không Lăng Kính',
    };
    verdictGuidance = {
      en: `Minimal ${absDecentrationMm.toFixed(1)} mm decentration aligns pupils near the optical sweet spot with ${recommendedStockBlankMm} mm stock blank.`,
      vi: `Độ lệch tâm cực thấp ${absDecentrationMm.toFixed(1)} mm đưa đồng tử vào vùng sắc nét nhất, dùng phôi chuẩn ${recommendedStockBlankMm} mm.`,
    };
  } else if (absDecentrationMm <= 5.5 && minimumBlankSizeMm <= 75.0) {
    verdict = 'sabae-centration-advised';
    verdictLabel = {
      en: 'Sabae Custom Centration',
      vi: 'Cần Căn Tâm Thủ Công Sabae',
    };
    verdictGuidance = {
      en: `Requires ${absDecentrationMm.toFixed(1)} mm lab decentration to neutralize ${peakPrismDiopters.toFixed(2)}Δ Prentice prism (${minimumBlankSizeMm.toFixed(0)} mm MBS).`,
      vi: `Cần mài dịch tâm ${absDecentrationMm.toFixed(1)} mm tại Sabae để triệt tiêu ${peakPrismDiopters.toFixed(2)}Δ hiệu ứng lăng kính (phôi MBS ${minimumBlankSizeMm.toFixed(0)} mm).`,
    };
  } else {
    verdict = 'oversized-caution';
    verdictLabel = {
      en: 'High Decentration Caution',
      vi: 'Cảnh Báo Lệch Tâm Cao',
    };
    verdictGuidance = {
      en: `${absDecentrationMm.toFixed(1)} mm decentration induces ${peakPrismDiopters.toFixed(2)}Δ uncompensated prism & requires ${minimumBlankSizeMm.toFixed(0)} mm blank; step down lens width.`,
      vi: `Lệch tâm ${absDecentrationMm.toFixed(1)} mm sinh ${peakPrismDiopters.toFixed(2)}Δ lăng kính và đòi hỏi phôi ${minimumBlankSizeMm.toFixed(0)} mm; nên chọn gọng nhỏ hơn.`,
    };
  }

  return {
    frame,
    pdMm: clampedPd,
    framePdMm,
    decentrationPerEyeMm,
    absDecentrationMm,
    decentrationDirection,
    odHorizontalPowerD,
    osHorizontalPowerD,
    peakHorizontalPowerD,
    odPrismDiopters,
    osPrismDiopters,
    peakPrismDiopters,
    prismBaseDirection,
    withinAnsiZ80Tolerance,
    minimumBlankSizeMm,
    recommendedStockBlankMm,
    fitsStandard70mmBlank,
    opticalFitScore,
    verdict,
    verdictLabel,
    verdictGuidance,
  };
}

export function evaluateAllSabaeFrames(
  pdMm: number,
  od: EyePrescriptionInput,
  os: EyePrescriptionInput
): DecentrationSuiteReport {
  const clampedPd = clampPhysiologicalPdMm(pdMm);
  const evaluations = SABAE_OPTICAL_FRAMES.map((frame) =>
    evaluateFrameDecentration(frame, clampedPd, od, os)
  );
  const sorted = [...evaluations].sort((a, b) => {
    if (b.opticalFitScore !== a.opticalFitScore) {
      return b.opticalFitScore - a.opticalFitScore;
    }
    return a.absDecentrationMm - b.absDecentrationMm;
  });

  return {
    pdMm: clampedPd,
    evaluations,
    bestFrame: sorted[0],
  };
}
