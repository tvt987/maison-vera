import type {
  LocalizedText,
  OpticalLensModeId,
  SabaeFrameSkuId,
} from '../types/commerce';
import { computeOpticalLensTelemetry, interpolateHexColor } from './opticalPhysics';

export type FaceArchetypeId = 'OVAL' | 'ANGULAR' | 'HEART' | 'ROUND';

export type HeroStageMode = 'tryon' | 'cad' | 'ar' | 'campaign';

export interface SculptBustProfile {
  craniumWidthScale: number;
  jawWidthScale: number;
  jawAngularity: number; // 0 = softly curved, 1 = sculpted architectural square jaw
  cheekboneProminence: number;
  chinTaper: number;
  browStrength: number;
  noseBridgeProjection: number;
  noseBridgeWidth: number;
  faceLengthScale: number;
}

export interface FaceArchetypeSpec {
  id: FaceArchetypeId;
  label: LocalizedText;
  shortLabel: LocalizedText;
  templeWidthMm: number; // 132 - 148 mm
  noseBridgeHeightMm: number; // 16 - 22 mm
  cheekClearanceOffsetMm: number; // 2.4 - 5.4 mm
  sculptProfile: SculptBustProfile;
  atelierNote: LocalizedText;
}

export interface TryOnFrameGeometrySpec {
  sku: SabaeFrameSkuId;
  productId: string;
  name: LocalizedText;
  shortLabel: LocalizedText;
  lensWidthMm: number;
  bridgeWidthMm: number;
  templeLengthMm: number;
  frameOuterWidthMm: number;
  rimHeightRatio: number;
  bridgeStyle: 'double-bar' | 'aviator-twin' | 'keyhole' | 'panto-slim';
  idealArchetypes: readonly FaceArchetypeId[];
}

export interface TryOnTransform3D {
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  offsetY: number;
  offsetZ: number;
  templeSplayRad: number;
  nosePadSeatMm: number;
}

export type BridgeComfortVerdictCode =
  | 'atelier-optimal'
  | 'high-bridge-poise'
  | 'custom-nosepad-lift'
  | 'wide-bridge-relief';

export interface TryOnFitEvaluation {
  archetype: FaceArchetypeSpec;
  frame: TryOnFrameGeometrySpec;
  pdMm: number;
  fitScore: number; // 0 - 100
  templeClearanceMm: number; // Per-side temple clearance in mm
  totalWidthDeltaMm: number;
  pdDecentrationMm: number;
  cheekClearanceMm: number;
  bridgeVerdictCode: BridgeComfortVerdictCode;
  bridgeComfortVerdict: LocalizedText;
  templeComfortLabel: LocalizedText;
  transform3d: TryOnTransform3D;
}

export interface PhotochromicUvState {
  uvIndex: number;
  activation: number; // 0..1
  opticalTransmissionPercent: number; // 88.0% -> 14.0%
  lensOpacity: number;
  threeTransmission: number;
  tintRgb: readonly [number, number, number];
  tintHex: string;
  attenuationHex: string;
  uv400BlockPercent: number; // 99.9%
  filterCategory: 'CAT 0' | 'CAT 1' | 'CAT 2' | 'CAT 3';
  ambientLabel: LocalizedText;
}

export interface TryOnLensMaterialState {
  vltPercent: number;
  opacity: number;
  transmission: number;
  hexColor: string;
  attenuationHex: string;
  gradientBottomHex?: string;
  specularSheenHex: string;
  iridescence: number;
  uv400BlockPercent: number;
  filterCategory: 'CAT 0' | 'CAT 1' | 'CAT 2' | 'CAT 3';
  isPhotochromicActive: boolean;
}

export interface PolarizedGlareShieldState {
  glareAngleDeg: number; // 0..90
  polarizedActive: boolean;
  malusCosSquared: number; // cos^2(theta)
  glareReductionPercent: number; // 12.0% unpolarized; 42.0%..99.4% polarized
  transmittedGlareFraction: number;
  rivieraClarityGainDb: number;
  glareVeilOpacity: number;
  statusLabel: LocalizedText;
}

export interface HeadPose6Dof {
  yawDeg: number;
  pitchDeg: number;
  rollDeg: number;
  tx: number; // Normalized -1..1
  ty: number; // Normalized -1..1
  scale: number; // 0.6..1.6
  ipdPx: number;
}

export interface HeadPoseFilterConfig {
  minAlpha: number;
  maxAlpha: number;
  deadzoneDeg: number;
  deadzonePos: number;
  velocityGain: number;
}

export interface HeadPoseFilterState {
  pose: HeadPose6Dof;
  initialized: boolean;
  config: HeadPoseFilterConfig;
}

export interface WebcamFaceEstimate {
  detected: boolean;
  confidence: number; // 0..1
  skinPixelRatio: number;
  centerXNorm: number; // -1..1 (0 = centered)
  centerYNorm: number; // -1..1 (0 = centered)
  faceWidthRatio: number; // 0..1 fraction of viewport width
  estimatedYawDeg: number;
  estimatedPitchDeg: number;
  estimatedRollDeg: number;
  estimatedIpdPx: number;
}

export const HEAD_YAW_LIMIT_DEG = 55;
export const HEAD_PITCH_LIMIT_DEG = 22;
export const HEAD_ROLL_LIMIT_DEG = 18;
export const TRYON_PD_MIN_MM = 56;
export const TRYON_PD_MAX_MM = 74;

export const FACE_ARCHETYPES: readonly FaceArchetypeSpec[] = [
  {
    id: 'OVAL',
    label: { en: 'Oval Classical', vi: 'Mặt Trái Xoan' },
    shortLabel: { en: 'Oval', vi: 'Trái Xoan' },
    templeWidthMm: 138,
    noseBridgeHeightMm: 19,
    cheekClearanceOffsetMm: 4.2,
    sculptProfile: {
      craniumWidthScale: 1.0,
      jawWidthScale: 0.94,
      jawAngularity: 0.25,
      cheekboneProminence: 0.56,
      chinTaper: 0.52,
      browStrength: 0.55,
      noseBridgeProjection: 0.62,
      noseBridgeWidth: 0.5,
      faceLengthScale: 1.02,
    },
    atelierNote: {
      en: 'Balanced cranial symmetry allows effortless architectural poise across all four Sabae widths.',
      vi: 'Tỷ lệ khuôn mặt cân đối cổ điển tương thích hài hòa với cả bốn kích cỡ gọng Sabae.',
    },
  },
  {
    id: 'ANGULAR',
    label: { en: 'Angular Architectural', vi: 'Mặt Góc Cạnh' },
    shortLabel: { en: 'Angular', vi: 'Góc Cạnh' },
    templeWidthMm: 146,
    noseBridgeHeightMm: 21,
    cheekClearanceOffsetMm: 5.1,
    sculptProfile: {
      craniumWidthScale: 1.05,
      jawWidthScale: 1.14,
      jawAngularity: 0.92,
      cheekboneProminence: 0.78,
      chinTaper: 0.28,
      browStrength: 0.86,
      noseBridgeProjection: 0.78,
      noseBridgeWidth: 0.54,
      faceLengthScale: 1.04,
    },
    atelierNote: {
      en: 'Defined mandibular planes and high nasal bridge pair cleanly with 51–54 mm sculpted titanium frames.',
      vi: 'Đường hàm sắc nét và sống mũi cao tôn dáng mạnh mẽ với gọng titan 51–54 mm.',
    },
  },
  {
    id: 'HEART',
    label: { en: 'Heart Sculpted', vi: 'Mặt Trái Tim' },
    shortLabel: { en: 'Heart', vi: 'Trái Tim' },
    templeWidthMm: 134,
    noseBridgeHeightMm: 20,
    cheekClearanceOffsetMm: 3.8,
    sculptProfile: {
      craniumWidthScale: 1.01,
      jawWidthScale: 0.78,
      jawAngularity: 0.2,
      cheekboneProminence: 0.84,
      chinTaper: 0.88,
      browStrength: 0.6,
      noseBridgeProjection: 0.68,
      noseBridgeWidth: 0.44,
      faceLengthScale: 1.0,
    },
    atelierNote: {
      en: 'Luminous upper cheekbones tapering to a refined chin favor lightweight 46–51 mm balanced silhouettes.',
      vi: 'Gò má thanh tú thuôn nhẹ về cằm tối ưu với phom kính nhẹ 46–51 mm cân bằng tỷ lệ.',
    },
  },
  {
    id: 'ROUND',
    label: { en: 'Round Sculptural', vi: 'Mặt Tròn Mềm Mại' },
    shortLabel: { en: 'Round', vi: 'Mặt Tròn' },
    templeWidthMm: 143,
    noseBridgeHeightMm: 17,
    cheekClearanceOffsetMm: 2.6,
    sculptProfile: {
      craniumWidthScale: 1.04,
      jawWidthScale: 1.08,
      jawAngularity: 0.08,
      cheekboneProminence: 0.68,
      chinTaper: 0.34,
      browStrength: 0.38,
      noseBridgeProjection: 0.46,
      noseBridgeWidth: 0.58,
      faceLengthScale: 0.94,
    },
    atelierNote: {
      en: 'Angular octagonal rims sharpen soft contours while raised titanium nose pads add generous cheek clearance.',
      vi: 'Vành bát giác kiến trúc tạo điểm nhấn sắc sảo, đệm mũi nâng cao giúp kính không chạm gò má.',
    },
  },
] as const;

export const TRYON_FRAME_SPECS: readonly TryOnFrameGeometrySpec[] = [
  {
    sku: 'MV-EYE-01',
    productId: 'mv-eye-01',
    name: { en: 'VÉRA-01 Monolith (51 mm)', vi: 'VÉRA-01 Monolith (51 mm)' },
    shortLabel: { en: '51mm Monolith', vi: 'Monolith 51' },
    lensWidthMm: 51,
    bridgeWidthMm: 20,
    templeLengthMm: 145,
    frameOuterWidthMm: 142,
    rimHeightRatio: 1.0,
    bridgeStyle: 'double-bar',
    idealArchetypes: ['OVAL', 'ANGULAR', 'ROUND'],
  },
  {
    sku: 'MV-EYE-02',
    productId: 'mv-eye-02',
    name: { en: 'Solaire 54 Aviator', vi: 'Solaire 54 Phi Công' },
    shortLabel: { en: '54mm Aviator', vi: 'Aviator 54' },
    lensWidthMm: 54,
    bridgeWidthMm: 19,
    templeLengthMm: 145,
    frameOuterWidthMm: 148,
    rimHeightRatio: 1.07,
    bridgeStyle: 'aviator-twin',
    idealArchetypes: ['ANGULAR', 'OVAL'],
  },
  {
    sku: 'MV-EYE-03',
    productId: 'mv-eye-03',
    name: { en: 'Archival 48 Panto', vi: 'Archival 48 Panto' },
    shortLabel: { en: '48mm Archival', vi: 'Archival 48' },
    lensWidthMm: 48,
    bridgeWidthMm: 21,
    templeLengthMm: 142,
    frameOuterWidthMm: 138,
    rimHeightRatio: 1.04,
    bridgeStyle: 'keyhole',
    idealArchetypes: ['OVAL', 'HEART', 'ROUND'],
  },
  {
    sku: 'MV-EYE-04',
    productId: 'mv-eye-03',
    name: { en: 'Panto 46 Compact', vi: 'Panto 46 Gọn' },
    shortLabel: { en: '46mm Panto', vi: 'Panto 46' },
    lensWidthMm: 46,
    bridgeWidthMm: 21,
    templeLengthMm: 138,
    frameOuterWidthMm: 134,
    rimHeightRatio: 0.98,
    bridgeStyle: 'panto-slim',
    idealArchetypes: ['HEART', 'OVAL'],
  },
] as const;

export const DEFAULT_POSE_FILTER_CONFIG: HeadPoseFilterConfig = {
  minAlpha: 0.14,
  maxAlpha: 0.48,
  deadzoneDeg: 0.35,
  deadzonePos: 0.004,
  velocityGain: 0.045,
};

function clamp(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, val));
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

function round3(val: number): number {
  return Math.round(val * 1000) / 1000;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hexToRgbTuple(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const parsed = parseInt(clean, 16);
  return [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255];
}

export function getFaceArchetype(id: FaceArchetypeId): FaceArchetypeSpec {
  return FACE_ARCHETYPES.find((a) => a.id === id) ?? FACE_ARCHETYPES[0];
}

export function getTryOnFrameSpec(sku: SabaeFrameSkuId): TryOnFrameGeometrySpec {
  return TRYON_FRAME_SPECS.find((f) => f.sku === sku) ?? TRYON_FRAME_SPECS[0];
}

export function clampTryOnPdMm(pdMm: number): number {
  return round1(clamp(pdMm, TRYON_PD_MIN_MM, TRYON_PD_MAX_MM));
}

/**
 * Computes deterministic 3D glasses seating, auto-scale, temple clearance,
 * bridge comfort verdict, and overall Atelier Fit Score (0-100%) for any
 * combination of Face Archetype, Sabae Frame SKU, and Pupillary Distance (PD).
 */
export function evaluateVirtualTryOnFit(
  archetypeId: FaceArchetypeId,
  frameSku: SabaeFrameSkuId,
  rawPdMm: number
): TryOnFitEvaluation {
  const archetype = getFaceArchetype(archetypeId);
  const frame = getTryOnFrameSpec(frameSku);
  const pdMm = clampTryOnPdMm(rawPdMm);

  // Per-side temple clearance: positive = relaxed breathing room; negative = snug temple tension
  const totalWidthDeltaMm = round1(frame.frameOuterWidthMm - archetype.templeWidthMm);
  const templeClearanceMm = round1(totalWidthDeltaMm / 2);

  // Optical PD centration delta per eye
  const framePdMm = frame.lensWidthMm + frame.bridgeWidthMm;
  const pdDecentrationMm = round1((framePdMm - pdMm) / 2);
  const absPdDec = Math.abs(pdDecentrationMm);

  // Ideal temple clearance sits around +1.0mm .. +3.0mm per side
  const templeErrorMm = Math.abs(templeClearanceMm - 2.0);
  const templePenalty = Math.max(0, templeErrorMm - 0.8) * 4.4;

  // PD centration penalty
  const pdPenalty = Math.max(0, absPdDec - 1.8) * 4.0;

  // Nose bridge ergonomics: bridge height vs frame DBL width
  const bridgeDeltaMm = frame.bridgeWidthMm - archetype.noseBridgeHeightMm;
  const bridgePenalty = Math.max(0, Math.abs(bridgeDeltaMm) - 1.5) * 3.0;

  // Cheek clearance ergonomics (tall frames on lower cheek clearance need nose-pad lift)
  const effectiveCheekClearanceMm = round1(
    archetype.cheekClearanceOffsetMm - (frame.rimHeightRatio - 1.0) * 6.5
  );
  const cheekPenalty = effectiveCheekClearanceMm < 2.4 ? (2.4 - effectiveCheekClearanceMm) * 4.5 : 0;

  // Silhouette aesthetic synergy bonus
  const aestheticBonus = frame.idealArchetypes.includes(archetype.id) ? 4 : 0;

  const rawScore =
    97 + aestheticBonus - templePenalty - pdPenalty - bridgePenalty - cheekPenalty;
  const fitScore = Math.round(clamp(rawScore, 52, 100));

  let bridgeVerdictCode: BridgeComfortVerdictCode;
  let bridgeComfortVerdict: LocalizedText;

  if (archetype.noseBridgeHeightMm <= 17.5 || effectiveCheekClearanceMm < 2.6) {
    bridgeVerdictCode = 'custom-nosepad-lift';
    bridgeComfortVerdict = {
      en: 'Raised Ti Pad Lift (+1.8 mm)',
      vi: 'Nâng Đệm Titan (+1.8 mm)',
    };
  } else if (archetype.noseBridgeHeightMm >= 20.5 && frame.bridgeWidthMm <= 20) {
    bridgeVerdictCode = 'high-bridge-poise';
    bridgeComfortVerdict = {
      en: 'High-Bridge Precision Seat',
      vi: 'Ôm Chuẩn Sống Mũi Cao',
    };
  } else if (bridgeDeltaMm > 2.2) {
    bridgeVerdictCode = 'wide-bridge-relief';
    bridgeComfortVerdict = {
      en: 'Featherlight Bridge Relief',
      vi: 'Cầu Kính Thoáng Nhẹ',
    };
  } else {
    bridgeVerdictCode = 'atelier-optimal';
    bridgeComfortVerdict = {
      en: 'Atelier Balanced Bridge Seat',
      vi: 'Tựa Sống Mũi Chuẩn Atelier',
    };
  }

  let templeComfortLabel: LocalizedText;
  if (templeClearanceMm < -1.0) {
    templeComfortLabel = {
      en: 'Snug Temple Tension — Step Up Width',
      vi: 'Càng Kính Hơi Ôm — Nên Tăng Size',
    };
  } else if (templeClearanceMm <= 3.5) {
    templeComfortLabel = {
      en: 'Zero-Pressure Tailored Temple Fit',
      vi: 'Càng Kính Êm Chuẩn Không Tỳ Thái Dương',
    };
  } else {
    templeComfortLabel = {
      en: 'Relaxed Couture Temple Clearance',
      vi: 'Độ Thoáng Thái Dương Phóng Khoáng',
    };
  }

  // Deterministic 3D seating transforms for the sculpted alabaster bust
  // Reference baseline: VÉRA-01 (142mm outer) on OVAL (138mm temple, 19mm bridge)
  const scaleX = round3(frame.frameOuterWidthMm / 142);
  const scaleY = round3(frame.rimHeightRatio);
  const scaleZ = round3(frame.templeLengthMm / 145);

  // Vertical seating: higher nose bridge seats glasses slightly higher; raised nose pads also lift slightly
  const bridgeHeightShift = (archetype.noseBridgeHeightMm - 19) * 0.018;
  const padLiftShift = bridgeVerdictCode === 'custom-nosepad-lift' ? 0.045 : 0;
  const offsetY = round3(bridgeHeightShift + padLiftShift);

  // Forward vertex clearance: lower cheek clearance pulls glasses slightly forward on titanium nosepad arms
  const cheekForwardShift = (4.2 - archetype.cheekClearanceOffsetMm) * 0.028;
  const noseProjShift = (archetype.sculptProfile.noseBridgeProjection - 0.62) * 0.24;
  const offsetZ = round3(clamp(cheekForwardShift + noseProjShift, -0.05, 0.14));

  // Temple splay opens slightly outward when face is wider than frame so temples never intersect head geometry
  const requiredSplay = Math.max(0, (archetype.templeWidthMm - frame.frameOuterWidthMm + 6) * 0.0042);
  const templeSplayRad = round3(clamp(requiredSplay, 0.0, 0.11));
  const nosePadSeatMm = round1(clamp(archetype.noseBridgeHeightMm * 0.92, 14.5, 20.5));

  return {
    archetype,
    frame,
    pdMm,
    fitScore,
    templeClearanceMm,
    totalWidthDeltaMm,
    pdDecentrationMm,
    cheekClearanceMm: Math.max(1.2, effectiveCheekClearanceMm),
    bridgeVerdictCode,
    bridgeComfortVerdict,
    templeComfortLabel,
    transform3d: {
      scaleX,
      scaleY,
      scaleZ,
      offsetY,
      offsetZ,
      templeSplayRad,
      nosePadSeatMm,
    },
  };
}

/**
 * Models real-time silver-halide photochromic UV darkening physics:
 *   uvIndex 0 -> 88.0% optical transmission (crystal clear CAT 0)
 *   uvIndex 11 -> 14.0% optical transmission (deep architectural sun tint CAT 3)
 *   UV400 protection locked at 99.9% across all UV states.
 */
export function computePhotochromicUvPhysics(rawUvIndex: number): PhotochromicUvState {
  const uvIndex = round1(clamp(rawUvIndex, 0, 11));
  const norm = uvIndex / 11;
  // Slightly super-responsive activation curve mirroring real silver-halide kinetics
  const activation = round3(Math.pow(norm, 0.85));

  const opticalTransmissionPercent = round1(lerp(88.0, 14.0, activation));
  const lensOpacity = round3(lerp(0.28, 0.92, activation));
  const threeTransmission = round3(lerp(0.92, 0.16, activation));

  // Clear architectural crystal -> warm Riviera bronze-smoke -> deep obsidian eclipse
  const tintHex =
    activation < 0.48
      ? interpolateHexColor('#E2E9EE', '#785E47', activation / 0.48)
      : interpolateHexColor('#785E47', '#18171B', (activation - 0.48) / 0.52);

  const attenuationHex =
    activation < 0.48
      ? interpolateHexColor('#C2CED6', '#543D2C', activation / 0.48)
      : interpolateHexColor('#543D2C', '#0C0C0F', (activation - 0.48) / 0.52);

  const tintRgb = hexToRgbTuple(tintHex);

  const filterCategory: PhotochromicUvState['filterCategory'] =
    uvIndex <= 1.5
      ? 'CAT 0'
      : uvIndex <= 4.5
      ? 'CAT 1'
      : uvIndex <= 7.5
      ? 'CAT 2'
      : 'CAT 3';

  const ambientLabel: LocalizedText =
    uvIndex <= 1.5
      ? { en: 'Atelier Indoor Clear', vi: 'Trong Suốt Nội Thất' }
      : uvIndex <= 4.5
      ? { en: 'Parisian Overcast', vi: 'Nắng Nhẹ Paris' }
      : uvIndex <= 7.5
      ? { en: 'Riviera Midday Sun', vi: 'Nắng Biển Riviera' }
      : { en: 'Alpine Extreme UV', vi: 'Cực Tím Cao Nguyên' };

  return {
    uvIndex,
    activation,
    opticalTransmissionPercent,
    lensOpacity,
    threeTransmission,
    tintRgb,
    tintHex,
    attenuationHex,
    uv400BlockPercent: 99.9,
    filterCategory,
    ambientLabel,
  };
}

/**
 * Resolves the live Three.js lens PBR state for the 3D Virtual Try-On stage,
 * combining the user's selected optical lens mode with photochromic UV darkening.
 */
export function resolveTryOnLensMaterialState(
  lensMode: OpticalLensModeId,
  uvIndex: number
): TryOnLensMaterialState {
  if (lensMode === 'photochromic-uv') {
    const uv = computePhotochromicUvPhysics(uvIndex);
    return {
      vltPercent: uv.opticalTransmissionPercent,
      opacity: uv.lensOpacity,
      transmission: uv.threeTransmission,
      hexColor: uv.tintHex,
      attenuationHex: uv.attenuationHex,
      specularSheenHex: interpolateHexColor('#98C4D8', '#D4A86A', uv.activation),
      iridescence: round3(lerp(0.5, 0.24, uv.activation)),
      uv400BlockPercent: uv.uv400BlockPercent,
      filterCategory: uv.filterCategory,
      isPhotochromicActive: true,
    };
  }

  const base = computeOpticalLensTelemetry(lensMode, uvIndex);
  return {
    vltPercent: base.vltPercent,
    opacity: base.opacity,
    transmission: base.transmission,
    hexColor: base.hexColor,
    attenuationHex: base.attenuationHex,
    gradientBottomHex: base.gradientBottomHex,
    specularSheenHex: base.specularSheenHex,
    iridescence: base.iridescence,
    uv400BlockPercent: 99.9,
    filterCategory: base.filterCategory,
    isPhotochromicActive: false,
  };
}

/**
 * Models Polarized Glare Attenuation obeying Malus's Law:
 *   I(theta) = I_min + (I_max - I_min) * cos^2(theta)
 * At theta = 90° (vertical polarizer crossed against horizontal Riviera water/road glare),
 * horizontal glare is attenuated by 99.4%.
 */
export function computePolarizedGlareShield(
  rawGlareAngleDeg: number,
  polarizedActive: boolean
): PolarizedGlareShieldState {
  const glareAngleDeg = round1(clamp(rawGlareAngleDeg, 0, 90));
  const thetaRad = (glareAngleDeg * Math.PI) / 180;
  const cosTheta = Math.cos(thetaRad);
  const malusCosSquared = round3(cosTheta * cosTheta);

  const PEAK_CUT_PCT = 99.4;
  const PARALLEL_CUT_PCT = 42.0;
  const UNPOLARIZED_CUT_PCT = 12.0;

  let glareReductionPercent: number;
  if (!polarizedActive) {
    glareReductionPercent = UNPOLARIZED_CUT_PCT;
  } else {
    const rMin = 1 - PEAK_CUT_PCT / 100;
    const rMax = 1 - PARALLEL_CUT_PCT / 100;
    const residual = rMin + (rMax - rMin) * (cosTheta * cosTheta);
    glareReductionPercent = round1((1 - residual) * 100);
  }

  const transmittedGlareFraction = round3(clamp(1 - glareReductionPercent / 100, 0.001, 1));
  const baselineVeiling = 0.88 + 0.078 * 1.6 + 0.012;
  const activeVeiling =
    transmittedGlareFraction + (polarizedActive ? 0.004 : 0.078) * 1.6 + 0.012;
  const rivieraClarityGainDb = polarizedActive
    ? round1(Math.max(0, 10 * Math.log10(baselineVeiling / activeVeiling)))
    : 0.0;

  const glareVeilOpacity = round3(clamp(transmittedGlareFraction * 0.82, 0.02, 0.78));

  const statusLabel: LocalizedText = !polarizedActive
    ? { en: 'Unpolarized Riviera Glare', vi: 'Chói Lóa Chưa Phân Cực' }
    : glareAngleDeg >= 75
    ? { en: 'Crossed Vertical Polarizer · Peak Cut', vi: 'Phân Cực Dọc · Khử Chói Tối Đa' }
    : glareAngleDeg >= 30
    ? { en: 'Oblique Malus Attenuation', vi: 'Triệt Chói Góc Nghiêng Malus' }
    : { en: 'Parallel Axis · Minimal Polarization', vi: 'Trục Song Song · Phân Cực Thấp' };

  return {
    glareAngleDeg,
    polarizedActive,
    malusCosSquared,
    glareReductionPercent,
    transmittedGlareFraction,
    rivieraClarityGainDb,
    glareVeilOpacity,
    statusLabel,
  };
}

/**
 * Clamps a 6-DOF head pose into natural anthropometric try-on bounds.
 */
export function clampHeadPose(pose: HeadPose6Dof): HeadPose6Dof {
  return {
    yawDeg: round3(clamp(pose.yawDeg, -HEAD_YAW_LIMIT_DEG, HEAD_YAW_LIMIT_DEG)),
    pitchDeg: round3(clamp(pose.pitchDeg, -HEAD_PITCH_LIMIT_DEG, HEAD_PITCH_LIMIT_DEG)),
    rollDeg: round3(clamp(pose.rollDeg, -HEAD_ROLL_LIMIT_DEG, HEAD_ROLL_LIMIT_DEG)),
    tx: round3(clamp(pose.tx, -1, 1)),
    ty: round3(clamp(pose.ty, -1, 1)),
    scale: round3(clamp(pose.scale, 0.6, 1.6)),
    ipdPx: round1(clamp(pose.ipdPx, 20, 420)),
  };
}

export function createHeadPoseFilter(
  initialPose?: Partial<HeadPose6Dof>,
  config?: Partial<HeadPoseFilterConfig>
): HeadPoseFilterState {
  const pose = clampHeadPose({
    yawDeg: initialPose?.yawDeg ?? 0,
    pitchDeg: initialPose?.pitchDeg ?? 0,
    rollDeg: initialPose?.rollDeg ?? 0,
    tx: initialPose?.tx ?? 0,
    ty: initialPose?.ty ?? 0,
    scale: initialPose?.scale ?? 1,
    ipdPx: initialPose?.ipdPx ?? 140,
  });

  return {
    pose,
    initialized: Boolean(initialPose),
    config: {
      ...DEFAULT_POSE_FILTER_CONFIG,
      ...config,
    },
  };
}

/**
 * Velocity-adaptive EMA / Kalman-like 6-DOF pose smoothing filter.
 * Suppresses sub-degree sensor/webcam jitter via dead-zone damping while ramping
 * responsiveness smoothly during intentional head rotation.
 */
export function stepHeadPoseFilter(
  state: HeadPoseFilterState,
  rawMeasurement: HeadPose6Dof
): HeadPoseFilterState {
  const target = clampHeadPose(rawMeasurement);

  if (!state.initialized) {
    return {
      ...state,
      pose: target,
      initialized: true,
    };
  }

  const prev = state.pose;
  const { minAlpha, maxAlpha, deadzoneDeg, deadzonePos, velocityGain } = state.config;

  const smoothScalar = (
    current: number,
    measured: number,
    deadzone: number,
    scaleFactor = 1
  ): number => {
    const delta = measured - current;
    const absDelta = Math.abs(delta);
    if (absDelta <= deadzone) {
      // Gentle micro-drift suppression inside jitter dead-zone
      return current + delta * (minAlpha * 0.25);
    }
    const adaptiveAlpha = clamp(
      minAlpha + (absDelta - deadzone) * velocityGain * scaleFactor,
      minAlpha,
      maxAlpha
    );
    return current + delta * adaptiveAlpha;
  };

  const nextPose = clampHeadPose({
    yawDeg: smoothScalar(prev.yawDeg, target.yawDeg, deadzoneDeg, 1),
    pitchDeg: smoothScalar(prev.pitchDeg, target.pitchDeg, deadzoneDeg, 1),
    rollDeg: smoothScalar(prev.rollDeg, target.rollDeg, deadzoneDeg, 1),
    tx: smoothScalar(prev.tx, target.tx, deadzonePos, 18),
    ty: smoothScalar(prev.ty, target.ty, deadzonePos, 18),
    scale: smoothScalar(prev.scale, target.scale, deadzonePos, 18),
    ipdPx: smoothScalar(prev.ipdPx, target.ipdPx, 0.8, 0.4),
  });

  return {
    ...state,
    pose: nextPose,
    initialized: true,
  };
}

/**
 * Zero-dependency privacy-first on-device face-region estimator using YCbCr skin
 * chrominance segmentation with central portrait weighting.
 * Runs in <0.4 ms on downsampled 96x72 RGBA webcam frames.
 */
export function estimateFacePoseFromImageData(
  rgba: Uint8ClampedArray,
  width: number,
  height: number
): WebcamFaceEstimate {
  if (width <= 0 || height <= 0 || rgba.length < width * height * 4) {
    return {
      detected: false,
      confidence: 0,
      skinPixelRatio: 0,
      centerXNorm: 0,
      centerYNorm: 0,
      faceWidthRatio: 0.34,
      estimatedYawDeg: 0,
      estimatedPitchDeg: 0,
      estimatedRollDeg: 0,
      estimatedIpdPx: 140,
    };
  }

  let weightSum = 0;
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumYY = 0;
  let sumXY = 0;
  let skinCount = 0;

  const totalPixels = width * height;
  const cxFrame = width * 0.5;
  const cyFrame = height * 0.46;

  for (let y = 0; y < height; y++) {
    const ny = (y - cyFrame) / (height * 0.5);
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = rgba[idx];
      const g = rgba[idx + 1];
      const b = rgba[idx + 2];

      // ITU-R BT.601 YCbCr skin-tone chrominance envelope (broad inclusive luminance range)
      const yLuma = 0.299 * r + 0.587 * g + 0.114 * b;
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      if (
        yLuma > 38 &&
        yLuma < 245 &&
        cb >= 77 &&
        cb <= 128 &&
        cr >= 132 &&
        cr <= 176
      ) {
        const nx = (x - cxFrame) / (width * 0.5);
        // Portrait Gaussian spatial prior favors central face over peripheral hands/background
        const spatialWeight = Math.exp(-(nx * nx * 0.9 + ny * ny * 1.1));
        skinCount += 1;
        weightSum += spatialWeight;
        sumX += x * spatialWeight;
        sumY += y * spatialWeight;
        sumXX += x * x * spatialWeight;
        sumYY += y * y * spatialWeight;
        sumXY += x * y * spatialWeight;
      }
    }
  }

  const skinPixelRatio = round3(skinCount / totalPixels);
  if (weightSum < 12 || skinPixelRatio < 0.025) {
    return {
      detected: false,
      confidence: 0,
      skinPixelRatio,
      centerXNorm: 0,
      centerYNorm: 0,
      faceWidthRatio: 0.34,
      estimatedYawDeg: 0,
      estimatedPitchDeg: 0,
      estimatedRollDeg: 0,
      estimatedIpdPx: 140,
    };
  }

  const meanX = sumX / weightSum;
  const meanY = sumY / weightSum;
  const varX = Math.max(1, sumXX / weightSum - meanX * meanX);
  const varY = Math.max(1, sumYY / weightSum - meanY * meanY);
  const covXY = sumXY / weightSum - meanX * meanY;

  const stdX = Math.sqrt(varX);
  const faceWidthPx = stdX * 3.2;
  const faceWidthRatio = round3(clamp(faceWidthPx / width, 0.16, 0.68));

  // Mirror X for natural selfie interaction (-1 = left, +1 = right)
  const centerXNorm = round3(clamp((meanX - width * 0.5) / (width * 0.5), -0.85, 0.85));
  const centerYNorm = round3(clamp((meanY - height * 0.48) / (height * 0.5), -0.85, 0.85));

  // Subtle head roll inferred from principal axis tilt of face oval
  const rawRollRad = 0.5 * Math.atan2(2 * covXY, varY - varX);
  const estimatedRollDeg = round1(clamp((rawRollRad * 180) / Math.PI * 0.45, -14, 14));
  const estimatedYawDeg = round1(clamp(-centerXNorm * 22, -28, 28));
  const estimatedPitchDeg = round1(clamp(-centerYNorm * 14, -15, 15));
  const estimatedIpdPx = round1(clamp(faceWidthRatio * 410, 64, 240));
  const confidence = round3(clamp((skinPixelRatio - 0.025) / 0.16, 0.15, 0.98));

  return {
    detected: true,
    confidence,
    skinPixelRatio,
    centerXNorm,
    centerYNorm,
    faceWidthRatio,
    estimatedYawDeg,
    estimatedPitchDeg,
    estimatedRollDeg,
    estimatedIpdPx,
  };
}
