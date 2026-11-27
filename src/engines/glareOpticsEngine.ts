import type {
  GlareEnvironmentId,
  LocalizedText,
  OpticalCoatingTierId,
  OpticalLensModeId,
} from '../types/commerce';

export interface GlareEnvironmentSpec {
  id: GlareEnvironmentId;
  label: LocalizedText;
  shortLabel: LocalizedText;
  surfaceMedium: LocalizedText;
  refractiveIndexN2: number;
  brewsterAngleDeg: number;
  horizontalPolarizationRatio: number;
  baseGlareLuminanceCdM2: number;
  solarElevationDeg: number;
  ambientNote: LocalizedText;
  arAttenuationPercent: number;
  polarizedPeakAttenuationPercent: number;
  polarizedParallelAttenuationPercent: number;
}

export interface OpticalCoatingTierSpec {
  id: OpticalCoatingTierId;
  label: LocalizedText;
  shortLabel: LocalizedText;
  stackSummary: LocalizedText;
  vltPercent: number;
  surfaceReflectionPercent: number;
  blueLightCutPercent: number;
  uv400BlockPercent: number;
  surchargeUsd: number;
  isPolarized: boolean;
  mappedHeroLensMode: OpticalLensModeId;
  badgeCode: string;
}

export interface GlareOpticsTelemetry {
  environment: GlareEnvironmentSpec;
  coating: OpticalCoatingTierSpec;
  analyzerAngleDeg: number;
  malusCosSquared: number;
  brewsterAngleDeg: number;
  vltPercent: number;
  surfaceReflectionPercent: number;
  glareAttenuationPercent: number;
  residualGlareFraction: number;
  residualGlareLuminanceCdM2: number;
  contrastAcuityGainDb: number;
  blueLightCutPercent: number;
  uv400BlockPercent: number;
  clinicalAdvisory: LocalizedText;
}

export interface MalusCurvePoint {
  angleDeg: number;
  glareAttenuationPercent: number;
  transmittedIntensityRatio: number;
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

function round3(val: number): number {
  return Math.round(val * 1000) / 1000;
}

export function computeBrewsterAngleDeg(n2: number, n1 = 1.0): number {
  const safeN1 = n1 > 0 && Number.isFinite(n1) ? n1 : 1.0;
  const safeN2 = n2 > 0 && Number.isFinite(n2) ? n2 : 1.333;
  return round1((Math.atan(safeN2 / safeN1) * 180) / Math.PI);
}

export const GLARE_ENVIRONMENTS: readonly GlareEnvironmentSpec[] = [
  {
    id: 'mediterranean-ocean',
    label: {
      en: 'Mediterranean Ocean Sun',
      vi: 'Nắng Biển Địa Trung Hải',
    },
    shortLabel: {
      en: 'Ocean Sun',
      vi: 'Nắng Biển',
    },
    surfaceMedium: {
      en: 'Seawater Surface (n = 1.333)',
      vi: 'Mặt Nước Biển (n = 1.333)',
    },
    refractiveIndexN2: 1.333,
    brewsterAngleDeg: computeBrewsterAngleDeg(1.333),
    horizontalPolarizationRatio: 0.96,
    baseGlareLuminanceCdM2: 88000,
    solarElevationDeg: 36.9,
    ambientNote: {
      en: 'Horizontal water speculars hit Brewster angle (53.1°), polarizing 96% of blinding surface glare.',
      vi: 'Tia nắng phản xạ mặt biển chạm góc Brewster (53.1°), phân cực ngang 96% cường độ chói.',
    },
    arAttenuationPercent: 48.5,
    polarizedPeakAttenuationPercent: 99.4,
    polarizedParallelAttenuationPercent: 42.0,
  },
  {
    id: 'rain-night-highway',
    label: {
      en: 'Rain-Slicked Night Highway',
      vi: 'Cao Tốc Mưa Đêm',
    },
    shortLabel: {
      en: 'Night Highway',
      vi: 'Cao Tốc Đêm',
    },
    surfaceMedium: {
      en: 'Wet Asphalt Film (n = 1.360)',
      vi: 'Màng Nước Mặt Đường Nhựa (n = 1.360)',
    },
    refractiveIndexN2: 1.36,
    brewsterAngleDeg: computeBrewsterAngleDeg(1.36),
    horizontalPolarizationRatio: 0.88,
    baseGlareLuminanceCdM2: 24000,
    solarElevationDeg: 36.3,
    ambientNote: {
      en: 'Oncoming LED headlamps trigger 7.8% double-surface ghosting on uncoated lenses and polarized tarmac streaks.',
      vi: 'Đèn pha LED đối diện tạo bóng ma phản xạ 7.8% trên tròng trần và vệt lóa ngang trên mặt đường ướt.',
    },
    arAttenuationPercent: 64.2,
    polarizedPeakAttenuationPercent: 96.2,
    polarizedParallelAttenuationPercent: 38.0,
  },
  {
    id: 'alpine-snow',
    label: {
      en: 'High-Altitude Alpine Snow',
      vi: 'Tuyết Cao Nguyên Alps',
    },
    shortLabel: {
      en: 'Alpine Snow',
      vi: 'Tuyết Alps',
    },
    surfaceMedium: {
      en: 'Compacted Ice Crust (n = 1.310)',
      vi: 'Bề Mặt Băng Tuyết Nén (n = 1.310)',
    },
    refractiveIndexN2: 1.31,
    brewsterAngleDeg: computeBrewsterAngleDeg(1.31),
    horizontalPolarizationRatio: 0.92,
    baseGlareLuminanceCdM2: 112000,
    solarElevationDeg: 37.4,
    ambientNote: {
      en: 'Chamonix high-altitude albedo exceeds 85% snow reflectance with intense UV400 & crystalline horizon glare.',
      vi: 'Độ phản xạ tuyết cao nguyên Alps vượt 85% kèm cường độ tia UV400 và chói lóa đường chân trời.',
    },
    arAttenuationPercent: 44.0,
    polarizedPeakAttenuationPercent: 98.9,
    polarizedParallelAttenuationPercent: 45.0,
  },
] as const;

export const OPTICAL_COATING_TIERS: readonly OpticalCoatingTierSpec[] = [
  {
    id: 'uncoated-cr39',
    label: {
      en: 'Uncoated CR-39',
      vi: 'CR-39 Không Phủ',
    },
    shortLabel: {
      en: 'Uncoated CR-39',
      vi: 'CR-39 Trần',
    },
    stackSummary: {
      en: 'Bare n = 1.50 monomer · 7.8% dual-face Fresnel reflection · zero polarization',
      vi: 'Phôi nhựa trần n = 1.50 · Phản xạ Fresnel hai mặt 7.8% · không phân cực',
    },
    vltPercent: 92.0,
    surfaceReflectionPercent: 7.8,
    blueLightCutPercent: 8.0,
    uv400BlockPercent: 91.5,
    surchargeUsd: 0,
    isPolarized: false,
    mappedHeroLensMode: 'clear-ar',
    badgeCode: 'BASE · 7.8% REFL',
  },
  {
    id: 'hydrophobic-ar',
    label: {
      en: 'Multi-Layer Hydrophobic AR',
      vi: 'Phủ Chống Chói AR Đa Lớp',
    },
    shortLabel: {
      en: 'Hydrophobic AR (0.4%)',
      vi: 'AR Đa Lớp (0.4%)',
    },
    stackSummary: {
      en: '7-layer dielectric interference stack · 0.4% surface reflection · 98.8% crystal VLT',
      vi: '7 lớp giao thoa điện môi · Phản xạ bề mặt 0.4% · Truyền sáng pha lê 98.8%',
    },
    vltPercent: 98.8,
    surfaceReflectionPercent: 0.4,
    blueLightCutPercent: 18.0,
    uv400BlockPercent: 99.6,
    surchargeUsd: 65,
    isPolarized: false,
    mappedHeroLensMode: 'clear-ar',
    badgeCode: 'AR · 0.4% REFL',
  },
  {
    id: 'polarized-blue-ar',
    label: {
      en: 'Polarized Optical Filter + Blue-Light AR',
      vi: 'Phân Cực Quang Học + AR Lọc Ánh Sáng Xanh',
    },
    shortLabel: {
      en: 'Polarized + Blue-Light AR',
      vi: 'Phân Cực + AR Xanh',
    },
    stackSummary: {
      en: 'Vertical PVA dichroic polarizer (99.4% cut) + rear 0.4% AR + HEV 415–455nm filter',
      vi: 'Màng phân cực PVA dọc (khử 99.4% lóa) + AR mặt sau 0.4% + lọc HEV 415–455nm',
    },
    vltPercent: 24.0,
    surfaceReflectionPercent: 0.4,
    blueLightCutPercent: 78.0,
    uv400BlockPercent: 99.9,
    surchargeUsd: 85,
    isPolarized: true,
    mappedHeroLensMode: 'polarized-amber',
    badgeCode: 'POLAR · 99.4% CUT',
  },
] as const;

export const UNCOATED_GLARE_ATTENUATION_PERCENT = 12.0;

export function clampAnalyzerAngleDeg(angleDeg: number): number {
  if (!Number.isFinite(angleDeg)) return 90;
  return Math.max(0, Math.min(90, Math.round(angleDeg * 10) / 10));
}

export function getGlareEnvironment(id: GlareEnvironmentId): GlareEnvironmentSpec {
  return GLARE_ENVIRONMENTS.find((env) => env.id === id) ?? GLARE_ENVIRONMENTS[0];
}

export function getOpticalCoatingTier(id: OpticalCoatingTierId): OpticalCoatingTierSpec {
  return OPTICAL_COATING_TIERS.find((c) => c.id === id) ?? OPTICAL_COATING_TIERS[2];
}

/**
 * Computes Malus's Law optical glare physics across lighting environments & coatings:
 *   I(theta) = I_min + (I_max - I_min) * cos^2(theta)
 * where theta = 90 deg is vertical transmission axis crossed perpendicular to horizontal Brewster glare.
 */
export function computeGlareOpticsTelemetry(
  environmentId: GlareEnvironmentId,
  coatingId: OpticalCoatingTierId,
  rawAnalyzerAngleDeg = 90
): GlareOpticsTelemetry {
  const environment = getGlareEnvironment(environmentId);
  const coating = getOpticalCoatingTier(coatingId);
  const analyzerAngleDeg = clampAnalyzerAngleDeg(rawAnalyzerAngleDeg);
  const thetaRad = (analyzerAngleDeg * Math.PI) / 180;
  const cosTheta = Math.cos(thetaRad);
  const malusCosSquared = round3(cosTheta * cosTheta);

  let glareAttenuationPercent: number;

  if (coating.id === 'uncoated-cr39') {
    glareAttenuationPercent = UNCOATED_GLARE_ATTENUATION_PERCENT;
  } else if (coating.id === 'hydrophobic-ar') {
    glareAttenuationPercent = environment.arAttenuationPercent;
  } else {
    // Polarized Optical Filter + Blue-Light AR obeys Malus's Law: I = I_0 * cos^2(theta)
    const rMin = 1 - environment.polarizedPeakAttenuationPercent / 100;
    const rMax = 1 - environment.polarizedParallelAttenuationPercent / 100;
    const residual = rMin + (rMax - rMin) * (cosTheta * cosTheta);
    glareAttenuationPercent = round1((1 - residual) * 100);
  }

  const residualGlareFraction = round3(Math.max(0.001, 1 - glareAttenuationPercent / 100));
  const residualGlareLuminanceCdM2 = Math.round(
    environment.baseGlareLuminanceCdM2 * residualGlareFraction
  );

  // Veiling glare contrast acuity gain in dB relative to uncoated CR-39 baseline
  const baselineVeiling = (1 - UNCOATED_GLARE_ATTENUATION_PERCENT / 100) + (7.8 / 100) * 1.6 + 0.012;
  const activeVeiling =
    residualGlareFraction + (coating.surfaceReflectionPercent / 100) * 1.6 + 0.012;
  const contrastAcuityGainDb =
    coating.id === 'uncoated-cr39'
      ? 0.0
      : round1(Math.max(0, 10 * Math.log10(baselineVeiling / activeVeiling)));

  let clinicalAdvisory: LocalizedText;
  if (coating.id === 'uncoated-cr39') {
    clinicalAdvisory = {
      en: 'Uncoated CR-39 reflects 7.8% across both faces, creating veiling flare & harsh horizontal glare.',
      vi: 'CR-39 không phủ phản xạ 7.8% trên hai mặt, gây lóa mờ và chói ngang cường độ cao.',
    };
  } else if (coating.id === 'hydrophobic-ar') {
    clinicalAdvisory =
      environment.id === 'rain-night-highway'
        ? {
            en: 'Optimal nocturnal driving optic: 98.8% VLT preserves shadow detail while 0.4% AR eliminates headlamp halos.',
            vi: 'Tối ưu nhất cho lái xe đêm: VLT 98.8% giữ chi tiết vùng tối và lớp AR 0.4% triệt tiêu quầng sáng đèn pha.',
          }
        : {
            en: '0.4% hydrophobic AR erases ghost reflections, though solar horizontal glare still benefits from polarization.',
            vi: 'Lớp AR 0.4% xóa hoàn toàn bóng ma phản xạ, tuy nhiên nắng phản xạ ngang ngoài trời vẫn tối ưu hơn với phân cực.',
          };
  } else {
    clinicalAdvisory =
      environment.id === 'rain-night-highway'
        ? {
            en: 'Cuts 96.2% of wet-road Brewster glare at dusk; switch to Hydrophobic AR (98.8% VLT) for pitch-black highway driving.',
            vi: 'Triệt tiêu 96.2% lóa mặt đường ướt lúc chạng vạng; khuyến nghị AR 98.8% VLT khi lái xe ban đêm tối hoàn toàn.',
          }
        : {
            en: `Crossed vertical polarizer (${analyzerAngleDeg.toFixed(0)}°) cancels ${glareAttenuationPercent.toFixed(1)}% horizontal Brewster glare with +${contrastAcuityGainDb.toFixed(1)} dB contrast.`,
            vi: `Trục phân cực dọc (${analyzerAngleDeg.toFixed(0)}°) triệt tiêu ${glareAttenuationPercent.toFixed(1)}% lóa ngang Brewster, tăng tương phản +${contrastAcuityGainDb.toFixed(1)} dB.`,
          };
  }

  return {
    environment,
    coating,
    analyzerAngleDeg,
    malusCosSquared,
    brewsterAngleDeg: environment.brewsterAngleDeg,
    vltPercent: coating.vltPercent,
    surfaceReflectionPercent: coating.surfaceReflectionPercent,
    glareAttenuationPercent,
    residualGlareFraction,
    residualGlareLuminanceCdM2,
    contrastAcuityGainDb,
    blueLightCutPercent: coating.blueLightCutPercent,
    uv400BlockPercent: coating.uv400BlockPercent,
    clinicalAdvisory,
  };
}

/**
 * Generates a 19-point Malus's Law curve from 0 deg (parallel) to 90 deg (crossed vertical)
 * in 5-degree steps for live SVG plotting.
 */
export function computeMalusAttenuationCurve(
  environmentId: GlareEnvironmentId,
  coatingId: OpticalCoatingTierId
): MalusCurvePoint[] {
  const points: MalusCurvePoint[] = [];
  for (let angle = 0; angle <= 90; angle += 5) {
    const t = computeGlareOpticsTelemetry(environmentId, coatingId, angle);
    points.push({
      angleDeg: angle,
      glareAttenuationPercent: t.glareAttenuationPercent,
      transmittedIntensityRatio: t.residualGlareFraction,
    });
  }
  return points;
}
