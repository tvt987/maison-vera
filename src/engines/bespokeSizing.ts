import type {
  BespokeSizingInput,
  EngravingTierId,
  FaceShape,
  LocalizedText,
  NoseBridgeProfile,
  OpticalLensModeId,
  PrescriptionTierId,
  TempleLengthMm,
} from '../types/commerce';
import { getOpticalLensMode } from './opticalPhysics';

export const FACE_SHAPES: readonly {
  id: FaceShape;
  label: LocalizedText;
  geometryNote: LocalizedText;
}[] = [
  {
    id: 'oval',
    label: { en: 'Oval', vi: 'Trái Xoan' },
    geometryNote: {
      en: 'Balanced cheekbones & softly tapered jawline suit bold geometric bevels',
      vi: 'Tỷ lệ gò má cân đối và đường hàm thanh thoát phù hợp gọng hình học sắc nét',
    },
  },
  {
    id: 'square',
    label: { en: 'Square', vi: 'Mặt Vuông' },
    geometryNote: {
      en: 'Defined mandibular angle harmonizes with sculpted crown-panto & softened curves',
      vi: 'Đường hàm góc cạnh cân bằng hoàn hảo với dáng crown-panto bo mềm kiến trúc',
    },
  },
  {
    id: 'round',
    label: { en: 'Round', vi: 'Mặt Tròn' },
    geometryNote: {
      en: 'Octagonal 4mm titanium facets introduce vertical architectural definition',
      vi: 'Cạnh bát giác titan 4mm tạo điểm nhấn góc cạnh và kéo dài tỷ lệ khuôn mặt',
    },
  },
  {
    id: 'heart',
    label: { en: 'Heart', vi: 'Trái Tim' },
    geometryNote: {
      en: 'Double-bar aerodynamic bridge balances wider brow with slender chin',
      vi: 'Cầu kính kép khí động học cân bằng trán rộng và phần cằm thon gọn',
    },
  },
  {
    id: 'diamond',
    label: { en: 'Diamond', vi: 'Kim Cương' },
    geometryNote: {
      en: 'High cheekbones pair effortlessly with cantilevered shields & milled octagon rims',
      vi: 'Gò má cao tôn dáng tuyệt đối với kính shield cầu nổi và vành bát giác CNC',
    },
  },
] as const;

export const NOSE_BRIDGES: readonly {
  id: NoseBridgeProfile;
  label: LocalizedText;
  bridgeWidthMm: number;
  nosePadDropMm: number;
  padSpec: LocalizedText;
}[] = [
  {
    id: 'low',
    label: { en: 'Low Bridge', vi: 'Sống Mũi Thấp' },
    bridgeWidthMm: 18,
    nosePadDropMm: 6.5,
    padSpec: {
      en: 'Extended Sabae titanium swan-neck pads (+2.0mm clearance)',
      vi: 'Đệm mũi cổ ngỗng titan Sabae kéo dài (+2.0mm nâng gọng)',
    },
  },
  {
    id: 'medium',
    label: { en: 'Medium Bridge', vi: 'Sống Mũi Trung Bình' },
    bridgeWidthMm: 20,
    nosePadDropMm: 4.5,
    padSpec: {
      en: 'Standard architectural floating silicone-core titanium pads',
      vi: 'Đệm mũi titan lõi silicon tiêu chuẩn kiến trúc Sabae',
    },
  },
  {
    id: 'high',
    label: { en: 'High Bridge', vi: 'Sống Mũi Cao' },
    bridgeWidthMm: 22,
    nosePadDropMm: 2.8,
    padSpec: {
      en: 'Flush sculpted keyhole profile with low-profile pad arms',
      vi: 'Cầu khóa chạm khắc sát sống mũi với chân đệm thấp',
    },
  },
] as const;

export const TEMPLE_LENGTHS: readonly TempleLengthMm[] = [138, 142, 145, 150];

export const PRESCRIPTION_TIERS: readonly {
  id: PrescriptionTierId;
  label: LocalizedText;
  detail: LocalizedText;
  priceUsd: number;
}[] = [
  {
    id: 'plano',
    label: { en: 'Plano (Non-Rx)', vi: 'Không Độ (Plano)' },
    detail: {
      en: 'CR-39 optical zero-power mineral lens',
      vi: 'Tròng quang học CR-39 không độ tiêu chuẩn',
    },
    priceUsd: 0,
  },
  {
    id: 'single-vision-167',
    label: { en: 'Single Vision 1.67', vi: 'Đơn Tròng Siêu Mỏng 1.67' },
    detail: {
      en: 'Japanese ultra-thin high-index Rx with custom PD centration',
      vi: 'Tròng chiết suất cao Nhật Bản căn tâm đúng chỉ số PD cá nhân',
    },
    priceUsd: 140,
  },
  {
    id: 'progressive-174',
    label: { en: 'Progressive 1.74 HD', vi: 'Đa Tròng Kỹ Thuật Số 1.74' },
    detail: {
      en: 'Freeform digital multifocal tailored to pantoscopic tilt & vertex distance',
      vi: 'Đa tròng kỹ thuật số đo theo góc nghiêng gọng và khoảng cách giác mạc',
    },
    priceUsd: 260,
  },
] as const;

export const ENGRAVING_TIERS: readonly {
  id: EngravingTierId;
  label: LocalizedText;
  detail: LocalizedText;
  priceUsd: number;
}[] = [
  {
    id: 'none',
    label: { en: 'No Temple Engraving', vi: 'Không Khắc Càng Kính' },
    detail: { en: 'Standard Sabae edition stamp only', vi: 'Chỉ giữ dấu xuất xưởng Sabae nguyên bản' },
    priceUsd: 0,
  },
  {
    id: 'micro-laser',
    label: { en: 'Inner Temple Laser', vi: 'Khắc Laser Trong Càng' },
    detail: {
      en: '0.12mm micro-fiber laser signature inside right titanium temple',
      vi: 'Khắc laser sợi quang 0.12mm mặt trong càng titan phải',
    },
    priceUsd: 45,
  },
  {
    id: 'gold-18k-inlay',
    label: { en: '18K Gold Inlay Signature', vi: 'Khảm Vàng 18K Chữ Ký' },
    detail: {
      en: 'Hand-inlaid 18K champagne gold monogram & serial plaque in Sabae',
      vi: 'Khảm tay chữ ký vàng 18K Champagne cùng bảng số serial tại Sabae',
    },
    priceUsd: 95,
  },
] as const;

interface EyewearSilhouetteSpec {
  productId: string;
  code: string;
  baseLensMm: number;
  baseBridgeMm: number;
  baseTempleMm: TempleLengthMm;
  faceAffinity: Record<FaceShape, number>;
  bridgeFlexibility: Record<NoseBridgeProfile, number>;
  rationale: Record<FaceShape, LocalizedText>;
}

const EYEWEAR_SILHOUETTES: readonly EyewearSilhouetteSpec[] = [
  {
    productId: 'mv-eye-01',
    code: 'VÉRA-01 MONOLITH',
    baseLensMm: 51,
    baseBridgeMm: 20,
    baseTempleMm: 145,
    faceAffinity: {
      oval: 98,
      round: 97,
      diamond: 95,
      heart: 91,
      square: 87,
    },
    bridgeFlexibility: { low: 0, medium: 2, high: 1 },
    rationale: {
      oval: {
        en: '4mm beveled octagon geometry amplifies natural oval symmetry',
        vi: 'Hình học bát giác vát 4mm tôn lên sự cân đối tự nhiên của mặt trái xoan',
      },
      round: {
        en: 'Crisp architectural facets add razor-sharp structure to soft contours',
        vi: 'Các mặt cắt kiến trúc sắc bén tạo độ góc cạnh rõ rệt cho khuôn mặt tròn',
      },
      diamond: {
        en: 'Cantilevered titanium brow line balances narrow forehead & prominent cheeks',
        vi: 'Thanh ngang titan cân bằng vùng trán hẹp và gò má cao đặc trưng',
      },
      heart: {
        en: 'Balanced lower bevel offsets wider upper brow effortlessly',
        vi: 'Đáy gọng bát giác cân bằng hài hòa với phần trán rộng',
      },
      square: {
        en: 'Chamfered corners soften strong jawlines while preserving monolith poise',
        vi: 'Góc vát chéo làm dịu đường hàm mạnh mẽ mà vẫn giữ khí chất nguyên khối',
      },
    },
  },
  {
    productId: 'mv-eye-02',
    code: 'SOLAIRE SHIELD',
    baseLensMm: 54,
    baseBridgeMm: 19,
    baseTempleMm: 145,
    faceAffinity: {
      diamond: 98,
      heart: 97,
      oval: 95,
      square: 92,
      round: 86,
    },
    bridgeFlexibility: { low: 1, medium: 2, high: 0 },
    rationale: {
      diamond: {
        en: 'Aerodynamic double-bar brow widens upper visual frame over high cheekbones',
        vi: 'Cầu kép khí động học mở rộng tỷ lệ phần trên hài hòa với gò má cao',
      },
      heart: {
        en: 'Swept base-4 Zeiss shield draws focus smoothly along the optical horizon',
        vi: 'Tròng Zeiss cong Base-4 chuyển hướng ánh nhìn mượt mà cân đối cằm thon',
      },
      oval: {
        en: 'Grand-touring double-bar silhouette pairs cleanly with proportional features',
        vi: 'Phom cầu kép du hành kết hợp hoàn hảo với tỷ lệ khuôn mặt cân đối',
      },
      square: {
        en: 'Fluid curved shield lens contrasts sculpted architectural jaw geometry',
        vi: 'Độ cong mượt của tròng shield tương phản tinh tế với hàm vuông',
      },
      round: {
        en: 'Elevated double titanium bridge visually elongates facial verticality',
        vi: 'Thanh cầu kép đặt cao giúp tạo cảm giác khuôn mặt thanh thoát hơn',
      },
    },
  },
  {
    productId: 'mv-eye-03',
    code: 'ARCHIVAL OPTICAL 04',
    baseLensMm: 48,
    baseBridgeMm: 21,
    baseTempleMm: 142,
    faceAffinity: {
      square: 98,
      oval: 95,
      heart: 92,
      diamond: 91,
      round: 88,
    },
    bridgeFlexibility: { low: -4, medium: 2, high: 3 },
    rationale: {
      square: {
        en: 'Hand-tumbled 8mm crown-panto acetate softens angular bone structure',
        vi: 'Acetate 8mm dáng crown-panto đánh bóng thủ công làm mềm cấu trúc hàm vuông',
      },
      oval: {
        en: 'Classic Parisian keyhole bridge sits effortlessly at balanced optical height',
        vi: 'Cầu khóa cổ điển Paris nằm chuẩn xác trên sống mũi hài hòa',
      },
      heart: {
        en: 'Compact 48mm lens proportion harmonizes narrower lower facial contours',
        vi: 'Khổ tròng 48mm gọn gàng cân đối hoàn hảo với phần hàm thon',
      },
      diamond: {
        en: 'Rich 8mm silhouette anchors the eye line without crowding cheekbones',
        vi: 'Độ dày 8mm tạo điểm tựa thị giác sắc sảo không chạm gò má',
      },
      round: {
        en: 'Flat sculptural crown brow delivers geometric contrast above soft cheeks',
        vi: 'Đỉnh gọng phẳng kiểu crown tạo đường nét tương phản cho mặt tròn',
      },
    },
  },
] as const;

export interface SilhouetteRecommendation {
  productId: string;
  code: string;
  fitScore: number;
  rationale: LocalizedText;
  recommendedBlueprint: string;
}

export interface BespokeBlueprintMetrics {
  pdMm: number;
  lensWidthMm: number;
  bridgeWidthMm: number;
  templeLengthMm: TempleLengthMm;
  frameWidthMm: number;
  lensHeightMm: number;
  nosePadDropMm: number;
  decentrationMm: number;
  pantoscopicTiltDeg: number;
  blueprintCode: string;
  bridgeSpec: LocalizedText;
}

export interface BespokePricingBreakdown {
  opticalLensUsd: number;
  prescriptionUsd: number;
  engravingUsd: number;
  totalAddonUsd: number;
}

export interface BespokeFitReport {
  overallFitScore: number;
  fitGrade: LocalizedText;
  blueprint: BespokeBlueprintMetrics;
  recommendations: SilhouetteRecommendation[];
  topRecommendation: SilhouetteRecommendation;
  pricing: BespokePricingBreakdown;
  sanitizedEngraving: string;
}

export function clampPdMm(pd: number): number {
  if (!Number.isFinite(pd)) return 64;
  return Math.max(56, Math.min(72, Math.round(pd)));
}

export function sanitizeEngravingText(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9.\- ]/g, '')
    .trim()
    .slice(0, 12);
}

function getIdealTempleForPd(pdMm: number): TempleLengthMm {
  if (pdMm <= 59) return 138;
  if (pdMm <= 63) return 142;
  if (pdMm <= 67) return 145;
  return 150;
}

export function computeBespokePricing(
  prescriptionTier: PrescriptionTierId,
  engravingTier: EngravingTierId,
  lensMode: OpticalLensModeId
): BespokePricingBreakdown {
  const rx = PRESCRIPTION_TIERS.find((t) => t.id === prescriptionTier) ?? PRESCRIPTION_TIERS[0];
  const eng = ENGRAVING_TIERS.find((t) => t.id === engravingTier) ?? ENGRAVING_TIERS[0];
  const lens = getOpticalLensMode(lensMode);

  const opticalLensUsd = lens.surchargeUsd;
  const prescriptionUsd = rx.priceUsd;
  const engravingUsd = eng.priceUsd;

  return {
    opticalLensUsd,
    prescriptionUsd,
    engravingUsd,
    totalAddonUsd: opticalLensUsd + prescriptionUsd + engravingUsd,
  };
}

export function computeBespokeFit(
  input: BespokeSizingInput,
  lensMode: OpticalLensModeId = 'polarized-amber'
): BespokeFitReport {
  const pdMm = clampPdMm(input.pdMm);
  const bridge = NOSE_BRIDGES.find((b) => b.id === input.noseBridge) ?? NOSE_BRIDGES[1];

  // Optical center formula: ideal Frame PD (A + DBL) sits 6-8mm wider than anatomical PD for minimal prism
  const rawLensWidth = Math.round(pdMm - bridge.bridgeWidthMm + 7);
  const lensWidthMm = Math.max(46, Math.min(56, rawLensWidth));
  const lensHeightMm = Math.round(lensWidthMm * 0.81);
  const frameWidthMm = lensWidthMm * 2 + bridge.bridgeWidthMm + 16;
  const decentrationMm = Math.round(Math.abs((lensWidthMm + bridge.bridgeWidthMm - pdMm) / 2) * 10) / 10;
  const pantoscopicTiltDeg = input.noseBridge === 'low' ? 6.5 : input.noseBridge === 'high' ? 9.0 : 8.0;

  const idealTemple = getIdealTempleForPd(pdMm);
  const templeDeltaMm = Math.abs(input.templeLengthMm - idealTemple);
  const templePenalty = templeDeltaMm === 0 ? 0 : templeDeltaMm <= 4 ? 2 : templeDeltaMm <= 7 ? 6 : 11;

  const blueprintCode = `${lensWidthMm}□${bridge.bridgeWidthMm} — ${input.templeLengthMm}mm`;

  const recommendations: SilhouetteRecommendation[] = EYEWEAR_SILHOUETTES.map((sil) => {
    const faceBase = sil.faceAffinity[input.faceShape];
    const bridgeAdj = sil.bridgeFlexibility[input.noseBridge];
    const widthDelta = Math.abs(sil.baseLensMm - lensWidthMm);
    const widthPenalty = Math.max(0, widthDelta - 2) * 2.2;
    const silTempleDelta = Math.abs(sil.baseTempleMm - input.templeLengthMm);
    const silTemplePenalty = silTempleDelta <= 3 ? 0 : silTempleDelta <= 6 ? 2 : 5;

    const rawScore = faceBase + bridgeAdj - widthPenalty - silTemplePenalty - Math.round(templePenalty * 0.5);
    const fitScore = Math.max(60, Math.min(99, Math.round(rawScore)));

    return {
      productId: sil.productId,
      code: sil.code,
      fitScore,
      rationale: sil.rationale[input.faceShape],
      recommendedBlueprint: `${lensWidthMm}-${bridge.bridgeWidthMm}-${input.templeLengthMm}`,
    };
  }).sort((a, b) => b.fitScore - a.fitScore);

  const topRecommendation = recommendations[0];
  const overallFitScore = Math.max(
    60,
    Math.min(100, Math.round(topRecommendation.fitScore - templePenalty * 0.35 + (decentrationMm <= 4 ? 1 : 0)))
  );

  const fitGrade: LocalizedText =
    overallFitScore >= 94
      ? { en: 'Haute Couture Exact Match', vi: 'Chuẩn May Đo Tuyệt Đối' }
      : overallFitScore >= 86
      ? { en: 'Atelier Tailored Harmony', vi: 'Hài Hòa Chuẩn Atelier' }
      : { en: 'Custom Calibration Advised', vi: 'Nên Tinh Chỉnh Càng Kính' };

  const pricing = computeBespokePricing(
    input.prescriptionTier,
    input.engravingTier,
    lensMode
  );

  return {
    overallFitScore,
    fitGrade,
    blueprint: {
      pdMm,
      lensWidthMm,
      bridgeWidthMm: bridge.bridgeWidthMm,
      templeLengthMm: input.templeLengthMm,
      frameWidthMm,
      lensHeightMm,
      nosePadDropMm: bridge.nosePadDropMm,
      decentrationMm,
      pantoscopicTiltDeg,
      blueprintCode,
      bridgeSpec: bridge.padSpec,
    },
    recommendations,
    topRecommendation,
    pricing,
    sanitizedEngraving: sanitizeEngravingText(input.engravingText),
  };
}
