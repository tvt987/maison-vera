import type { LocalizedText, OpticalLensModeId } from '../types/commerce';

export interface OpticalLensModeSpec {
  id: OpticalLensModeId;
  label: LocalizedText;
  shortLabel: LocalizedText;
  coatingNote: LocalizedText;
  swatchHex: string;
  swatchSecondaryHex: string;
  surchargeUsd: number;
  isPhotochromic: boolean;
  isGradient: boolean;
  isPolarized: boolean;
}

export interface OpticalLensTelemetry {
  mode: OpticalLensModeId;
  uvIndex: number;
  vltPercent: number;
  glareReductionPercent: number;
  blueLightFilterPercent: number;
  uvCutNm: number;
  filterCategory: 'CAT 0' | 'CAT 1' | 'CAT 2' | 'CAT 3';
  hexColor: string;
  attenuationHex: string;
  gradientBottomHex?: string;
  specularSheenHex: string;
  transmission: number;
  opacity: number;
  iridescence: number;
  causticHex: string;
  surchargeUsd: number;
}

export const OPTICAL_LENS_MODES: readonly OpticalLensModeSpec[] = [
  {
    id: 'clear-ar',
    label: { en: 'Clear Anti-Reflective', vi: 'Trong Chống Chói AR' },
    shortLabel: { en: 'Clear AR', vi: 'Trong AR' },
    coatingNote: {
      en: '7-layer Zeiss DuraVision anti-reflective crystal optics (98.2% VLT)',
      vi: 'Tròng pha lê phủ 7 lớp chống phản quang Zeiss (98.2% VLT)',
    },
    swatchHex: '#DCE5EC',
    swatchSecondaryHex: '#8DE2BA',
    surchargeUsd: 0,
    isPhotochromic: false,
    isGradient: false,
    isPolarized: false,
  },
  {
    id: 'photochromic-uv',
    label: { en: 'Photochromic UV Sunlight', vi: 'Đổi Màu UV Quang Điện' },
    shortLabel: { en: 'Photochromic UV', vi: 'Đổi Màu UV' },
    coatingNote: {
      en: 'Dynamic silver-halide transition darkens smoothly from UV 0 to UV 11',
      vi: 'Cảm biến quang điện tự động làm tối tròng linh hoạt theo chỉ số UV 0–11',
    },
    swatchHex: '#B8A896',
    swatchSecondaryHex: '#232022',
    surchargeUsd: 110,
    isPhotochromic: true,
    isGradient: false,
    isPolarized: false,
  },
  {
    id: 'polarized-amber',
    label: { en: 'Polarized Amber Drive', vi: 'Phân Cực Hổ Phách Lái Xe' },
    shortLabel: { en: 'Polarized Amber', vi: 'Phân Cực Hổ Phách' },
    coatingNote: {
      en: '99.4% horizontal glare cut engineered for alpine sun & grand touring',
      vi: 'Khử 99.4% lóa phản xạ ngang chuyên dụng cho nắng gắt & lái xe đường dài',
    },
    swatchHex: '#B86B2B',
    swatchSecondaryHex: '#6F3A0F',
    surchargeUsd: 85,
    isPhotochromic: false,
    isGradient: false,
    isPolarized: true,
  },
  {
    id: 'midnight-gradient',
    label: { en: 'Midnight Gradient', vi: 'Chuyển Sắc Đêm Nocturne' },
    shortLabel: { en: 'Midnight Gradient', vi: 'Chuyển Sắc Đêm' },
    coatingNote: {
      en: 'Bi-tonal obsidian crown fading into luminous mineral smoke below',
      vi: 'Chuyển sắc hai tầng từ đen obsidian phía trên xuống khói khoáng trong phía dưới',
    },
    swatchHex: '#1A202D',
    swatchSecondaryHex: '#7A8BA8',
    surchargeUsd: 95,
    isPhotochromic: false,
    isGradient: true,
    isPolarized: false,
  },
  {
    id: 'blue-light-studio',
    label: { en: 'Blue-Light Studio Filter', vi: 'Lọc Ánh Sáng Xanh Studio' },
    shortLabel: { en: 'Blue-Light Studio', vi: 'Lọc Xanh Studio' },
    coatingNote: {
      en: '92.5% HEV 415–455nm attenuation with warm archival color fidelity',
      vi: 'Cắt 92.5% tia HEV 415–455nm bảo toàn độ chuẩn màu cho studio sáng tạo',
    },
    swatchHex: '#ECE3CE',
    swatchSecondaryHex: '#6898F0',
    surchargeUsd: 65,
    isPhotochromic: false,
    isGradient: false,
    isPolarized: false,
  },
] as const;

export function getOpticalLensMode(mode: OpticalLensModeId): OpticalLensModeSpec {
  return OPTICAL_LENS_MODES.find((m) => m.id === mode) ?? OPTICAL_LENS_MODES[2];
}

export function clampUvIndex(uvIndex: number): number {
  if (!Number.isFinite(uvIndex)) return 0;
  return Math.max(0, Math.min(11, Math.round(uvIndex * 10) / 10));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function interpolateHexColor(hexA: string, hexB: string, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  return rgbToHex(
    lerp(r1, r2, clamped),
    lerp(g1, g2, clamped),
    lerp(b1, b2, clamped)
  );
}

/**
 * Computes real optical transmittance (VLT %), glare reduction, UV cut,
 * and Three.js PBR material parameters for the active lens physics mode.
 */
export function computeOpticalLensTelemetry(
  mode: OpticalLensModeId,
  rawUvIndex: number
): OpticalLensTelemetry {
  const uvIndex = clampUvIndex(rawUvIndex);

  switch (mode) {
    case 'clear-ar':
      return {
        mode,
        uvIndex,
        vltPercent: 98.2,
        glareReductionPercent: 14.0,
        blueLightFilterPercent: 12.0,
        uvCutNm: 400,
        filterCategory: 'CAT 0',
        hexColor: '#E4ECF0',
        attenuationHex: '#CBD8E0',
        specularSheenHex: '#7DE2B6',
        transmission: 0.94,
        opacity: 0.36,
        iridescence: 0.58,
        causticHex: '#DCE8E4',
        surchargeUsd: 0,
      };

    case 'photochromic-uv': {
      // Smooth non-linear silver-halide photochromic activation curve (UV 0 -> 11)
      const norm = uvIndex / 11;
      const activation = Math.pow(norm, 0.82);

      const vltPercent = round1(lerp(91.5, 13.5, activation));
      const glareReductionPercent = round1(lerp(18.0, 94.5, activation));
      const blueLightFilterPercent = round1(lerp(24.0, 86.0, activation));

      // Color transitions: indoor mineral crystal -> warm bronze -> deep obsidian eclipse
      const hexColor =
        activation < 0.5
          ? interpolateHexColor('#DCE3E8', '#7C624B', activation * 2)
          : interpolateHexColor('#7C624B', '#1C1B1E', (activation - 0.5) * 2);

      const attenuationHex =
        activation < 0.5
          ? interpolateHexColor('#B8C4CC', '#5A4331', activation * 2)
          : interpolateHexColor('#5A4331', '#0F0F12', (activation - 0.5) * 2);

      const causticHex = interpolateHexColor('#D8DFDC', '#5E4630', activation);
      const transmission = Math.round(lerp(0.91, 0.2, activation) * 100) / 100;
      const opacity = Math.round(lerp(0.42, 0.92, activation) * 100) / 100;
      const iridescence = Math.round(lerp(0.45, 0.28, activation) * 100) / 100;

      const filterCategory: OpticalLensTelemetry['filterCategory'] =
        uvIndex <= 1.5
          ? 'CAT 0'
          : uvIndex <= 4.5
          ? 'CAT 1'
          : uvIndex <= 7.5
          ? 'CAT 2'
          : 'CAT 3';

      return {
        mode,
        uvIndex,
        vltPercent,
        glareReductionPercent,
        blueLightFilterPercent,
        uvCutNm: 400,
        filterCategory,
        hexColor,
        attenuationHex,
        specularSheenHex: interpolateHexColor('#B4C8D8', '#C89B62', activation),
        transmission,
        opacity,
        iridescence,
        causticHex,
        surchargeUsd: 110,
      };
    }

    case 'polarized-amber':
      return {
        mode,
        uvIndex,
        vltPercent: 24.0,
        glareReductionPercent: 99.4,
        blueLightFilterPercent: 78.0,
        uvCutNm: 400,
        filterCategory: 'CAT 2',
        hexColor: '#B86B2B',
        attenuationHex: '#7D4112',
        specularSheenHex: '#F0B66A',
        transmission: 0.62,
        opacity: 0.8,
        iridescence: 0.36,
        causticHex: '#C27430',
        surchargeUsd: 85,
      };

    case 'midnight-gradient':
      return {
        mode,
        uvIndex,
        vltPercent: 15.8,
        glareReductionPercent: 89.0,
        blueLightFilterPercent: 64.0,
        uvCutNm: 400,
        filterCategory: 'CAT 3',
        hexColor: '#1B2230',
        attenuationHex: '#0E121B',
        gradientBottomHex: '#7A8CA8',
        specularSheenHex: '#7391C4',
        transmission: 0.44,
        opacity: 0.86,
        iridescence: 0.48,
        causticHex: '#35486A',
        surchargeUsd: 95,
      };

    case 'blue-light-studio':
      return {
        mode,
        uvIndex,
        vltPercent: 89.4,
        glareReductionPercent: 32.0,
        blueLightFilterPercent: 92.5,
        uvCutNm: 420,
        filterCategory: 'CAT 0',
        hexColor: '#EFE6D2',
        attenuationHex: '#D5C7A8',
        specularSheenHex: '#5D98FF',
        transmission: 0.88,
        opacity: 0.48,
        iridescence: 0.78,
        causticHex: '#C5D4F2',
        surchargeUsd: 65,
      };
  }
}
