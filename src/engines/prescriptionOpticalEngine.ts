import type {
  EyePrescriptionInput,
  LocalizedText,
  OpticalRxInput,
  RefractiveIndexId,
  SpectralFilterProfileId,
} from '../types/commerce';

export interface RefractiveIndexSpec {
  id: RefractiveIndexId;
  code: string;
  refractiveIndex: number;
  abbeValue: number;
  densityGcm3: number;
  minCenterThicknessMm: number;
  minEdgeThicknessMm: number;
  asphericFactor: number;
  surchargeUsd: number;
  label: LocalizedText;
  shortLabel: LocalizedText;
  materialOrigin: LocalizedText;
  recommendedBand: LocalizedText;
}

export const REFRACTIVE_INDEX_SPECS: readonly RefractiveIndexSpec[] = [
  {
    id: 'cr39-150',
    code: '1.50',
    refractiveIndex: 1.5,
    abbeValue: 58,
    densityGcm3: 1.32,
    minCenterThicknessMm: 2.0,
    minEdgeThicknessMm: 1.2,
    asphericFactor: 1.0,
    surchargeUsd: 0,
    label: { en: 'CR-39 Standard 1.50', vi: 'CR-39 Tiêu Chuẩn 1.50' },
    shortLabel: { en: 'CR-39 1.50', vi: 'CR-39 1.50' },
    materialOrigin: {
      en: 'Mineral-grade Columbia Resin · Highest Abbe 58 optical clarity',
      vi: 'Nhựa quang học Columbia Resin · Độ trong Abbe 58 cao nhất',
    },
    recommendedBand: {
      en: 'Ideal for plano to ±2.00 D',
      vi: 'Lý tưởng từ 0.00 đến ±2.00 D',
    },
  },
  {
    id: 'poly-159',
    code: '1.59',
    refractiveIndex: 1.59,
    abbeValue: 30,
    densityGcm3: 1.2,
    minCenterThicknessMm: 1.5,
    minEdgeThicknessMm: 1.0,
    asphericFactor: 0.97,
    surchargeUsd: 75,
    label: { en: 'Polycarbonate 1.59', vi: 'Polycarbonate Chịu Lực 1.59' },
    shortLabel: { en: 'Poly 1.59', vi: 'Poly 1.59' },
    materialOrigin: {
      en: 'Featherweight impact-resistant aerospace polycarbonate',
      vi: 'Polycarbonate hàng không siêu nhẹ, chống va đập vượt trội',
    },
    recommendedBand: {
      en: 'Recommended for ±2.25 D to ±3.75 D',
      vi: 'Khuyên dùng cho ±2.25 D đến ±3.75 D',
    },
  },
  {
    id: 'high-167',
    code: '1.67',
    refractiveIndex: 1.67,
    abbeValue: 32,
    densityGcm3: 1.35,
    minCenterThicknessMm: 1.3,
    minEdgeThicknessMm: 0.9,
    asphericFactor: 0.93,
    surchargeUsd: 140,
    label: { en: 'High-Index 1.67 Aspheric', vi: 'Chiết Suất Cao 1.67 Phi Cầu' },
    shortLabel: { en: 'High-Index 1.67', vi: 'Siêu Mỏng 1.67' },
    materialOrigin: {
      en: 'Japanese MR-7 high-index monomer · Single-side aspheric profile',
      vi: 'Vật liệu MR-7 Nhật Bản · Thiết kế phi cầu chống méo hình rìa',
    },
    recommendedBand: {
      en: 'Recommended for ±4.00 D to ±5.50 D',
      vi: 'Khuyên dùng cho ±4.00 D đến ±5.50 D',
    },
  },
  {
    id: 'ultra-174',
    code: '1.74',
    refractiveIndex: 1.74,
    abbeValue: 33,
    densityGcm3: 1.47,
    minCenterThicknessMm: 1.1,
    minEdgeThicknessMm: 0.8,
    asphericFactor: 0.88,
    surchargeUsd: 240,
    label: {
      en: 'Ultra-Thin 1.74 Japanese Aspheric',
      vi: 'Siêu Mỏng 1.74 Phi Cầu Kép Nhật Bản',
    },
    shortLabel: { en: 'Ultra-Thin 1.74', vi: 'Siêu Mỏng 1.74' },
    materialOrigin: {
      en: 'Sabae double-aspheric MR-174 · Engineered flush for 4mm titanium rims',
      vi: 'Phi cầu kép MR-174 Sabae · Tối ưu nằm gọn trong vành titan 4mm',
    },
    recommendedBand: {
      en: 'Essential above ±5.50 D high prescription',
      vi: 'Tối ưu nhất cho độ cao trên ±5.50 D',
    },
  },
] as const;

export const BLUE_LIGHT_STUDIO_SURCHARGE_USD = 65;
export const TITANIUM_RIM_DEPTH_MM = 4.0;

export const RX_BOUNDS = {
  sphereMin: -10.0,
  sphereMax: 6.0,
  cylinderMin: -4.0,
  cylinderMax: 0.0,
  axisMin: 1,
  axisMax: 180,
  pdMin: 54.0,
  pdMax: 74.0,
  lensDiameterMin: 44,
  lensDiameterMax: 62,
} as const;

export interface OpticalRxPreset {
  id: string;
  label: LocalizedText;
  badge: string;
  input: OpticalRxInput;
}

export const OPTICAL_RX_PRESETS: readonly OpticalRxPreset[] = [
  {
    id: 'high-myopia-600',
    label: { en: 'High Myopia (-6.00 D)', vi: 'Cận Nặng (-6.00 D)' },
    badge: '-6.00 D',
    input: {
      od: { sphereD: -6.0, cylinderD: -0.75, axisDeg: 175 },
      os: { sphereD: -5.75, cylinderD: -0.5, axisDeg: 5 },
      pdMm: 63,
      lensDiameterMm: 51,
      bridgeWidthMm: 20,
      blueLightFilterEnabled: true,
    },
  },
  {
    id: 'astigmatic-architect',
    label: { en: 'Astigmatic Studio', vi: 'Cận Loạn Kiến Trúc' },
    badge: '-3.25 / -1.50',
    input: {
      od: { sphereD: -3.25, cylinderD: -1.5, axisDeg: 90 },
      os: { sphereD: -3.0, cylinderD: -1.25, axisDeg: 85 },
      pdMm: 64,
      lensDiameterMm: 51,
      bridgeWidthMm: 20,
      blueLightFilterEnabled: true,
    },
  },
  {
    id: 'moderate-myopia',
    label: { en: 'Moderate Myopia', vi: 'Cận Trung Bình' },
    badge: '-2.50 D',
    input: {
      od: { sphereD: -2.5, cylinderD: 0, axisDeg: 0 },
      os: { sphereD: -2.25, cylinderD: 0, axisDeg: 0 },
      pdMm: 64,
      lensDiameterMm: 51,
      bridgeWidthMm: 20,
      blueLightFilterEnabled: true,
    },
  },
  {
    id: 'hyperopia-reading',
    label: { en: 'Hyperopia (+3.00 D)', vi: 'Viễn Thị (+3.00 D)' },
    badge: '+3.00 D',
    input: {
      od: { sphereD: 3.0, cylinderD: -0.5, axisDeg: 180 },
      os: { sphereD: 2.75, cylinderD: -0.5, axisDeg: 180 },
      pdMm: 65,
      lensDiameterMm: 48,
      bridgeWidthMm: 21,
      blueLightFilterEnabled: false,
    },
  },
] as const;

export interface RxValidationError {
  field: string;
  code:
    | 'SPHERE_OUT_OF_RANGE'
    | 'SPHERE_INVALID_STEP'
    | 'CYLINDER_OUT_OF_RANGE'
    | 'CYLINDER_INVALID_STEP'
    | 'AXIS_REQUIRED'
    | 'AXIS_OUT_OF_RANGE'
    | 'PD_OUT_OF_RANGE'
    | 'PD_INVALID_STEP'
    | 'DIAMETER_OUT_OF_RANGE';
  message: LocalizedText;
}

export interface RxValidationResult {
  valid: boolean;
  errors: RxValidationError[];
}

export interface EyeThicknessResult {
  dominantPowerD: number;
  sphericalEquivalentD: number;
  sagittaMm: number;
  centerThicknessMm: number;
  edgeThicknessMm: number;
  maxThicknessMm: number;
  weightGrams: number;
}

export interface IndexComparisonRow {
  spec: RefractiveIndexSpec;
  od: EyeThicknessResult;
  os: EyeThicknessResult;
  peakCenterThicknessMm: number;
  peakEdgeThicknessMm: number;
  peakThicknessMm: number;
  edgeReductionPercentVs150: number;
  maxThicknessReductionPercentVs150: number;
  pairWeightGrams: number;
  fits4mmTitaniumRim: boolean;
  isRecommended: boolean;
}

export interface SpectralSamplePoint {
  wavelengthNm: number;
  baselineArTransmittancePct: number;
  activeTransmittancePct: number;
}

export interface SpectralCurveReport {
  profile: SpectralFilterProfileId;
  samples: SpectralSamplePoint[];
  uv400BlockPercent: number;
  hevBlueFilterPercent: number;
  visibleAvgTransmittancePercent: number;
}

export interface OpticalRxReport {
  validation: RxValidationResult;
  effectiveSemiDiameterMm: number;
  decentrationPerEyeMm: number;
  strongestMeridianAbsD: number;
  recommendedIndex: RefractiveIndexSpec;
  comparisons: IndexComparisonRow[];
  spectral: SpectralCurveReport;
  totalUpgradeUsd: number;
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

export function isQuarterDiopterStep(value: number): boolean {
  if (!Number.isFinite(value)) return false;
  return Math.abs(value * 4 - Math.round(value * 4)) < 1e-6;
}

export function isHalfMillimeterStep(value: number): boolean {
  if (!Number.isFinite(value)) return false;
  return Math.abs(value * 2 - Math.round(value * 2)) < 1e-6;
}

export function formatDiopter(value: number): string {
  const rounded = round2(value);
  if (Math.abs(rounded) < 1e-6) return '0.00 D';
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded.toFixed(2)} D`;
}

function validateEye(
  eyeKey: 'od' | 'os',
  eye: EyePrescriptionInput,
  errors: RxValidationError[]
): void {
  const labelEn = eyeKey === 'od' ? 'Right Eye (OD)' : 'Left Eye (OS)';
  const labelVi = eyeKey === 'od' ? 'Mắt Phải (OD)' : 'Mắt Trái (OS)';

  if (
    !Number.isFinite(eye.sphereD) ||
    eye.sphereD < RX_BOUNDS.sphereMin - 1e-6 ||
    eye.sphereD > RX_BOUNDS.sphereMax + 1e-6
  ) {
    errors.push({
      field: `${eyeKey}.sphereD`,
      code: 'SPHERE_OUT_OF_RANGE',
      message: {
        en: `${labelEn} Sphere must be between -10.00 D and +6.00 D.`,
        vi: `${labelVi} độ cầu (SPH) phải nằm trong khoảng -10.00 D đến +6.00 D.`,
      },
    });
  } else if (!isQuarterDiopterStep(eye.sphereD)) {
    errors.push({
      field: `${eyeKey}.sphereD`,
      code: 'SPHERE_INVALID_STEP',
      message: {
        en: `${labelEn} Sphere must use exact 0.25 D optometry increments.`,
        vi: `${labelVi} độ cầu (SPH) phải theo bước đo nhãn khoa chuẩn 0.25 D.`,
      },
    });
  }

  if (
    !Number.isFinite(eye.cylinderD) ||
    eye.cylinderD < RX_BOUNDS.cylinderMin - 1e-6 ||
    eye.cylinderD > RX_BOUNDS.cylinderMax + 1e-6
  ) {
    errors.push({
      field: `${eyeKey}.cylinderD`,
      code: 'CYLINDER_OUT_OF_RANGE',
      message: {
        en: `${labelEn} Cylinder must be between -4.00 D and 0.00 D.`,
        vi: `${labelVi} độ loạn (CYL) phải nằm trong khoảng -4.00 D đến 0.00 D.`,
      },
    });
  } else if (!isQuarterDiopterStep(eye.cylinderD)) {
    errors.push({
      field: `${eyeKey}.cylinderD`,
      code: 'CYLINDER_INVALID_STEP',
      message: {
        en: `${labelEn} Cylinder must use exact 0.25 D optometry increments.`,
        vi: `${labelVi} độ loạn (CYL) phải theo bước đo nhãn khoa chuẩn 0.25 D.`,
      },
    });
  }

  const hasCylinder = Number.isFinite(eye.cylinderD) && Math.abs(eye.cylinderD) > 1e-6;
  if (hasCylinder) {
    if (eye.axisDeg === null || !Number.isFinite(eye.axisDeg)) {
      errors.push({
        field: `${eyeKey}.axisDeg`,
        code: 'AXIS_REQUIRED',
        message: {
          en: `${labelEn} Axis (1°–180°) is required whenever Cylinder is non-zero.`,
          vi: `${labelVi} bắt buộc nhập Trục loạn (1°–180°) khi độ loạn CYL khác 0.`,
        },
      });
    } else if (
      !Number.isInteger(eye.axisDeg) ||
      eye.axisDeg < RX_BOUNDS.axisMin ||
      eye.axisDeg > RX_BOUNDS.axisMax
    ) {
      errors.push({
        field: `${eyeKey}.axisDeg`,
        code: 'AXIS_OUT_OF_RANGE',
        message: {
          en: `${labelEn} Axis must be a whole integer between 1° and 180°.`,
          vi: `${labelVi} Trục loạn phải là số nguyên từ 1° đến 180°.`,
        },
      });
    }
  } else if (
    eye.axisDeg !== null &&
    (!Number.isInteger(eye.axisDeg) || eye.axisDeg < 0 || eye.axisDeg > RX_BOUNDS.axisMax)
  ) {
    errors.push({
      field: `${eyeKey}.axisDeg`,
      code: 'AXIS_OUT_OF_RANGE',
      message: {
        en: `${labelEn} Axis must be between 0° and 180°.`,
        vi: `${labelVi} Trục loạn phải nằm trong khoảng 0° đến 180°.`,
      },
    });
  }
}

export function validateOpticalRx(input: OpticalRxInput): RxValidationResult {
  const errors: RxValidationError[] = [];

  validateEye('od', input.od, errors);
  validateEye('os', input.os, errors);

  if (
    !Number.isFinite(input.pdMm) ||
    input.pdMm < RX_BOUNDS.pdMin - 1e-6 ||
    input.pdMm > RX_BOUNDS.pdMax + 1e-6
  ) {
    errors.push({
      field: 'pdMm',
      code: 'PD_OUT_OF_RANGE',
      message: {
        en: 'Pupillary Distance (PD) must be within physiological bounds (54–74 mm).',
        vi: 'Khoảng cách đồng tử (PD) phải nằm trong giới hạn sinh học (54–74 mm).',
      },
    });
  } else if (!isHalfMillimeterStep(input.pdMm)) {
    errors.push({
      field: 'pdMm',
      code: 'PD_INVALID_STEP',
      message: {
        en: 'Pupillary Distance (PD) must use 0.5 mm precision steps.',
        vi: 'Khoảng cách đồng tử (PD) phải chia theo bước 0.5 mm.',
      },
    });
  }

  if (
    !Number.isFinite(input.lensDiameterMm) ||
    input.lensDiameterMm < RX_BOUNDS.lensDiameterMin ||
    input.lensDiameterMm > RX_BOUNDS.lensDiameterMax
  ) {
    errors.push({
      field: 'lensDiameterMm',
      code: 'DIAMETER_OUT_OF_RANGE',
      message: {
        en: 'Frame lens diameter must be between 44 mm and 62 mm.',
        vi: 'Đường kính tròng gọng phải nằm trong khoảng 44 mm đến 62 mm.',
      },
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function computeEffectiveSemiDiameter(
  lensDiameterMm: number,
  pdMm: number,
  bridgeWidthMm = 20
): { semiDiameterMm: number; decentrationPerEyeMm: number } {
  const clampedDiameter = Math.max(
    RX_BOUNDS.lensDiameterMin,
    Math.min(RX_BOUNDS.lensDiameterMax, Number.isFinite(lensDiameterMm) ? lensDiameterMm : 51)
  );
  const clampedPd = Math.max(
    RX_BOUNDS.pdMin,
    Math.min(RX_BOUNDS.pdMax, Number.isFinite(pdMm) ? pdMm : 64)
  );
  const framePdMm = clampedDiameter + bridgeWidthMm;
  const decentrationPerEyeMm = round2(Math.max(0, (framePdMm - clampedPd) / 2));
  const semiDiameterMm = round2(
    Math.max(22, Math.min(33, clampedDiameter / 2 + decentrationPerEyeMm * 0.45))
  );
  return { semiDiameterMm, decentrationPerEyeMm };
}

export function getDominantMeridianPower(eye: EyePrescriptionInput): number {
  const m1 = Number.isFinite(eye.sphereD) ? eye.sphereD : 0;
  const cyl = Number.isFinite(eye.cylinderD) ? eye.cylinderD : 0;
  const m2 = m1 + cyl;
  return round2(Math.abs(m2) >= Math.abs(m1) ? m2 : m1);
}

/**
 * Exact ophthalmic optical sagitta formula:
 *   R = 1000 * (n - 1) / |F|
 *   s = (R - sqrt(R^2 - h^2)) * asphericFactor
 * Minus lens: center = minCenter, edge = minCenter + s
 * Plus lens:  edge = minEdge, center = minEdge + s
 */
export function computeEyeSagittaForMaterial(
  eye: EyePrescriptionInput,
  spec: RefractiveIndexSpec,
  semiDiameterMm: number
): EyeThicknessResult {
  const dominantPowerD = getDominantMeridianPower(eye);
  const sphericalEquivalentD = round2(
    (Number.isFinite(eye.sphereD) ? eye.sphereD : 0) +
      (Number.isFinite(eye.cylinderD) ? eye.cylinderD : 0) / 2
  );
  const absPower = Math.abs(dominantPowerD);

  let sagittaMm = 0;
  let centerThicknessMm = spec.minCenterThicknessMm;
  let edgeThicknessMm = spec.minCenterThicknessMm;

  if (absPower >= 1e-6) {
    const radiusMm = (1000 * (spec.refractiveIndex - 1)) / absPower;
    const hEff = Math.min(semiDiameterMm, radiusMm * 0.98);
    const rawSagitta = radiusMm - Math.sqrt(radiusMm * radiusMm - hEff * hEff);
    sagittaMm = round2(rawSagitta * spec.asphericFactor);

    if (dominantPowerD < 0) {
      centerThicknessMm = round2(spec.minCenterThicknessMm);
      edgeThicknessMm = round2(spec.minCenterThicknessMm + rawSagitta * spec.asphericFactor);
    } else {
      edgeThicknessMm = round2(spec.minEdgeThicknessMm);
      centerThicknessMm = round2(spec.minEdgeThicknessMm + rawSagitta * spec.asphericFactor);
    }
  }

  const maxThicknessMm = Math.max(centerThicknessMm, edgeThicknessMm);
  const avgThicknessMm = (centerThicknessMm + edgeThicknessMm) / 2;
  const volumeCm3 = (Math.PI * semiDiameterMm * semiDiameterMm * avgThicknessMm) / 1000;
  const weightGrams = round1(volumeCm3 * spec.densityGcm3);

  return {
    dominantPowerD,
    sphericalEquivalentD,
    sagittaMm,
    centerThicknessMm,
    edgeThicknessMm,
    maxThicknessMm,
    weightGrams,
  };
}

export function recommendRefractiveIndex(strongestAbsPowerD: number): RefractiveIndexSpec {
  if (strongestAbsPowerD <= 2.0 + 1e-6) return REFRACTIVE_INDEX_SPECS[0]; // 1.50
  if (strongestAbsPowerD <= 3.75 + 1e-6) return REFRACTIVE_INDEX_SPECS[1]; // 1.59
  if (strongestAbsPowerD <= 5.5 + 1e-6) return REFRACTIVE_INDEX_SPECS[2]; // 1.67
  return REFRACTIVE_INDEX_SPECS[3]; // 1.74
}

function computeSingleWavelengthTransmittance(
  wavelengthNm: number,
  profile: SpectralFilterProfileId
): number {
  // UV400 dielectric cutoff below 400nm
  if (wavelengthNm <= 390) return 0.1;
  if (wavelengthNm === 400) return profile === 'uv400-blue-cut' ? 0.2 : 0.4;

  // Smooth UV-edge recovery curve above 400nm
  const uvRamp = 1 / (1 + Math.exp(-(wavelengthNm - 408) / 4.2));
  const baseAr = 98.4 * uvRamp;

  if (profile === 'uv400-ar') {
    return round1(Math.max(0.2, Math.min(98.8, baseAr)));
  }

  if (profile === 'uv400-blue-cut') {
    // Gaussian HEV 415–455nm attenuation notch centered at 432nm
    const hevNotch = 58.0 * Math.exp(-Math.pow((wavelengthNm - 432) / 19.5, 2));
    // Secondary violet suppression near 410nm
    const violetCut = 34.0 * Math.exp(-Math.pow((wavelengthNm - 410) / 10.5, 2));
    const filtered = baseAr - hevNotch - violetCut;
    return round1(Math.max(0.2, Math.min(97.8, filtered)));
  }

  // Solar polarized amber window
  const amberWindow = 28.5 * (1 / (1 + Math.exp(-(wavelengthNm - 545) / 28)));
  return round1(Math.max(0.1, Math.min(34.0, amberWindow * uvRamp + 3.2 * uvRamp)));
}

/**
 * Generates deterministic 380nm–780nm spectral transmittance curves (41 points, 10nm step)
 * illustrating UV400 cutoff + HEV 415–455nm Blue-Light studio filtration.
 */
export function computeSpectralTransmittanceCurve(
  profile: SpectralFilterProfileId
): SpectralCurveReport {
  const samples: SpectralSamplePoint[] = [];
  for (let wl = 380; wl <= 780; wl += 10) {
    samples.push({
      wavelengthNm: wl,
      baselineArTransmittancePct: computeSingleWavelengthTransmittance(wl, 'uv400-ar'),
      activeTransmittancePct: computeSingleWavelengthTransmittance(wl, profile),
    });
  }

  const uvBand = samples.filter((s) => s.wavelengthNm <= 400);
  const uvAvgT = uvBand.reduce((acc, s) => acc + s.activeTransmittancePct, 0) / uvBand.length;
  const uv400BlockPercent = round1(100 - uvAvgT);

  const hevBand = samples.filter((s) => s.wavelengthNm >= 410 && s.wavelengthNm <= 450);
  const hevAvgT = hevBand.reduce((acc, s) => acc + s.activeTransmittancePct, 0) / hevBand.length;
  const hevBlueFilterPercent = round1(100 - hevAvgT);

  const visBand = samples.filter((s) => s.wavelengthNm >= 500 && s.wavelengthNm <= 780);
  const visibleAvgTransmittancePercent = round1(
    visBand.reduce((acc, s) => acc + s.activeTransmittancePct, 0) / visBand.length
  );

  return {
    profile,
    samples,
    uv400BlockPercent,
    hevBlueFilterPercent,
    visibleAvgTransmittancePercent,
  };
}

export function computeOpticalRxReport(input: OpticalRxInput): OpticalRxReport {
  const validation = validateOpticalRx(input);
  const { semiDiameterMm, decentrationPerEyeMm } = computeEffectiveSemiDiameter(
    input.lensDiameterMm,
    input.pdMm,
    input.bridgeWidthMm ?? 20
  );

  const odDominant = Math.abs(getDominantMeridianPower(input.od));
  const osDominant = Math.abs(getDominantMeridianPower(input.os));
  const strongestMeridianAbsD = round2(Math.max(odDominant, osDominant));
  const recommendedIndex = recommendRefractiveIndex(strongestMeridianAbsD);

  const rawRows = REFRACTIVE_INDEX_SPECS.map((spec) => {
    const od = computeEyeSagittaForMaterial(input.od, spec, semiDiameterMm);
    const os = computeEyeSagittaForMaterial(input.os, spec, semiDiameterMm);
    const peakCenterThicknessMm = Math.max(od.centerThicknessMm, os.centerThicknessMm);
    const peakEdgeThicknessMm = Math.max(od.edgeThicknessMm, os.edgeThicknessMm);
    const peakThicknessMm = Math.max(od.maxThicknessMm, os.maxThicknessMm);
    const pairWeightGrams = round1(od.weightGrams + os.weightGrams);

    return {
      spec,
      od,
      os,
      peakCenterThicknessMm,
      peakEdgeThicknessMm,
      peakThicknessMm,
      pairWeightGrams,
      fits4mmTitaniumRim: peakEdgeThicknessMm <= TITANIUM_RIM_DEPTH_MM + 0.05,
      isRecommended: spec.id === recommendedIndex.id,
    };
  });

  const baseline150 = rawRows[0];
  const comparisons: IndexComparisonRow[] = rawRows.map((row) => ({
    ...row,
    edgeReductionPercentVs150:
      baseline150.peakEdgeThicknessMm > 0
        ? round1(
            ((baseline150.peakEdgeThicknessMm - row.peakEdgeThicknessMm) /
              baseline150.peakEdgeThicknessMm) *
              100
          )
        : 0,
    maxThicknessReductionPercentVs150:
      baseline150.peakThicknessMm > 0
        ? round1(
            ((baseline150.peakThicknessMm - row.peakThicknessMm) /
              baseline150.peakThicknessMm) *
              100
          )
        : 0,
  }));

  const spectral = computeSpectralTransmittanceCurve(
    input.blueLightFilterEnabled ? 'uv400-blue-cut' : 'uv400-ar'
  );

  const totalUpgradeUsd =
    recommendedIndex.surchargeUsd +
    (input.blueLightFilterEnabled ? BLUE_LIGHT_STUDIO_SURCHARGE_USD : 0);

  return {
    validation,
    effectiveSemiDiameterMm: semiDiameterMm,
    decentrationPerEyeMm,
    strongestMeridianAbsD,
    recommendedIndex,
    comparisons,
    spectral,
    totalUpgradeUsd,
  };
}

export function buildOpticalRxCartPayload(
  input: OpticalRxInput,
  selectedIndexId?: RefractiveIndexId,
  productId = 'mv-eye-01'
): {
  productId: string;
  indexSpec: RefractiveIndexSpec;
  unitPriceAddonUsd: number;
  customMeta: string;
  bespokeSummary: string;
} {
  const report = computeOpticalRxReport(input);
  const chosen =
    REFRACTIVE_INDEX_SPECS.find((s) => s.id === selectedIndexId) ?? report.recommendedIndex;
  const chosenRow =
    report.comparisons.find((c) => c.spec.id === chosen.id) ?? report.comparisons[0];
  const unitPriceAddonUsd =
    chosen.surchargeUsd + (input.blueLightFilterEnabled ? BLUE_LIGHT_STUDIO_SURCHARGE_USD : 0);

  const formatEyeCompact = (label: string, eye: EyePrescriptionInput) => {
    const cylPart =
      Math.abs(eye.cylinderD) > 1e-6
        ? `/${eye.cylinderD.toFixed(2)}x${eye.axisDeg ?? 0}°`
        : '';
    return `${label} ${eye.sphereD >= 0 ? '+' : ''}${eye.sphereD.toFixed(2)}${cylPart}`;
  };

  const coatingTag = input.blueLightFilterEnabled ? 'UV400+HEV Blue' : 'UV400 AR';
  return {
    productId,
    indexSpec: chosen,
    unitPriceAddonUsd,
    customMeta: `Rx ${chosen.shortLabel.en} / ${coatingTag}`,
    bespokeSummary: `${formatEyeCompact('OD', input.od)} · ${formatEyeCompact('OS', input.os)} · PD ${input.pdMm}mm · Edge ${chosenRow.peakEdgeThicknessMm.toFixed(2)}mm (${chosen.code})`,
  };
}
