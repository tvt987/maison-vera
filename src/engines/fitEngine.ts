import type { FitPreference, FitRecommendation, ProductSize } from '../types/commerce';

const SIZE_SPECS: Record<
  Exclude<ProductSize, 'OS'>,
  { chestCm: string; shoulderCm: string; lengthCm: string }
> = {
  XS: { chestCm: '104 cm', shoulderCm: '45.5 cm', lengthCm: '112 cm' },
  S: { chestCm: '110 cm', shoulderCm: '47.5 cm', lengthCm: '116 cm' },
  M: { chestCm: '116 cm', shoulderCm: '49.5 cm', lengthCm: '120 cm' },
  L: { chestCm: '122 cm', shoulderCm: '51.5 cm', lengthCm: '124 cm' },
};

export function estimateAtelierSize(
  heightCm: number,
  weightKg: number,
  preference: FitPreference
): FitRecommendation {
  const safeHeight = Math.min(210, Math.max(145, heightCm));
  const safeWeight = Math.min(130, Math.max(40, weightKg));

  // Weighted architectural proportion index
  let score = (safeHeight - 150) * 0.45 + (safeWeight - 45) * 0.85;

  if (preference === 'tailored') score -= 7;
  if (preference === 'oversized') score += 8;

  let recommendedSize: Exclude<ProductSize, 'OS'>;
  if (score < 16) {
    recommendedSize = 'XS';
  } else if (score < 30) {
    recommendedSize = 'S';
  } else if (score < 46) {
    recommendedSize = 'M';
  } else {
    recommendedSize = 'L';
  }

  const specs = SIZE_SPECS[recommendedSize];

  const confidenceNote =
    preference === 'tailored'
      ? {
          en: `Precision shoulder line with minimal ease for ${safeHeight}cm / ${safeWeight}kg.`,
          vi: `Đường vai sắc nét, độ dư tối giản cho thông số ${safeHeight}cm / ${safeWeight}kg.`,
        }
      : preference === 'oversized'
      ? {
          en: `Generous cantilevered drape allowing heavy knitwear layering (${safeHeight}cm / ${safeWeight}kg).`,
          vi: `Phom rũ rộng phóng khoáng, thoải mái phối nhiều lớp áo len (${safeHeight}cm / ${safeWeight}kg).`,
        }
      : {
          en: `Signature MAISON VÉRA architectural proportion balanced for ${safeHeight}cm / ${safeWeight}kg.`,
          vi: `Tỷ lệ kiến trúc chuẩn MAISON VÉRA cân bằng cho thông số ${safeHeight}cm / ${safeWeight}kg.`,
        };

  return {
    recommendedSize,
    chestCm: specs.chestCm,
    shoulderCm: specs.shoulderCm,
    lengthCm: specs.lengthCm,
    confidenceNote,
  };
}
