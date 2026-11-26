import type {
  ColorFamily,
  LocalizedText,
  Product,
  ProductColorway,
  ProductSize,
  StylistBudgetTier,
  StylistOccasion,
  StylistPalette,
} from '../types/commerce';

export const STYLIST_BUNDLE_DISCOUNT_RATE = 0.12;

export interface CuratedStylistPiece {
  product: Product;
  colorway: ProductColorway;
  recommendedSize: ProductSize;
  roleLabel: LocalizedText;
}

export interface StylistCurationResult {
  bundleId: string;
  headline: LocalizedText;
  editorialRationale: LocalizedText;
  fabricPairingNote: LocalizedText;
  pieces: CuratedStylistPiece[];
  retailUsd: number;
  savingsUsd: number;
  finalUsd: number;
  discountRate: number;
}

const PALETTE_FAMILY_PRIORITY: Record<StylistPalette, ColorFamily[]> = {
  'alabaster-sand': ['Sand', 'Titanium', 'Olive', 'Gold', 'Obsidian', 'Sienna'],
  'obsidian-monochrome': ['Obsidian', 'Titanium', 'Olive', 'Gold', 'Sand', 'Sienna'],
  'terracotta-warmth': ['Sienna', 'Gold', 'Sand', 'Olive', 'Obsidian', 'Titanium'],
};

const OCCASION_TRIOS: Record<
  StylistOccasion,
  Record<StylistBudgetTier, [string, string, string]>
> = {
  'gallery-opening': {
    essential: ['mv-out-03', 'mv-eye-03', 'mv-frg-01'],
    signature: ['mv-out-01', 'mv-eye-01', 'mv-lth-01'],
    collector: ['mv-out-02', 'mv-eye-01', 'mv-lth-01'],
  },
  'tokyo-architecture': {
    essential: ['mv-out-03', 'mv-eye-02', 'mv-obj-01'],
    signature: ['mv-out-01', 'mv-eye-01', 'mv-lth-02'],
    collector: ['mv-out-02', 'mv-eye-02', 'mv-lth-02'],
  },
  'minimalist-weekend': {
    essential: ['mv-eye-03', 'mv-obj-01', 'mv-frg-01'],
    signature: ['mv-out-01', 'mv-eye-01', 'mv-frg-01'],
    collector: ['mv-out-01', 'mv-lth-02', 'mv-frg-02'],
  },
  'nocturne-salon': {
    essential: ['mv-out-03', 'mv-obj-01', 'mv-frg-02'],
    signature: ['mv-out-03', 'mv-eye-01', 'mv-frg-02'],
    collector: ['mv-out-02', 'mv-lth-01', 'mv-frg-02'],
  },
};

const OCCASION_COPY: Record<
  StylistOccasion,
  { headline: LocalizedText; baseNote: LocalizedText }
> = {
  'gallery-opening': {
    headline: {
      en: 'Curated For Vernissage & Architectural Salons',
      vi: 'Tuyển Chọn Cho Triển Lãm & Không Gian Kiến Trúc',
    },
    baseNote: {
      en: 'Structured silhouette authority balanced with Sabae optical clarity so your presence anchors white-cube gallery lighting without visual noise.',
      vi: 'Phom dáng kiến trúc dứt khoát kết hợp quang học Sabae tinh khiết, giúp diện mạo nổi bật giữa ánh sáng phòng triển lãm mà vẫn giữ sự tĩnh lặng sang trọng.',
    },
  },
  'tokyo-architecture': {
    headline: {
      en: 'Intercontinental Transit & Concrete Minimalism',
      vi: 'Du Hành Xuyên Lục Địa & Tối Giản Bê Tông',
    },
    baseNote: {
      en: 'Engineered around low-crease double-faced wool, featherweight 18.4g titanium optics, and cabin-compliant Tuscan leather that builds patina across flight miles.',
      vi: 'Xoay quanh chất liệu chống nhăn cao cấp, kính titan siêu nhẹ 18.4g và túi da Tuscany chuẩn cabin giúp lên màu patina sâu theo từng chặng bay.',
    },
  },
  'minimalist-weekend': {
    headline: {
      en: 'Unstructured Ease & Tactile Rituals',
      vi: 'Cuối Tuần Tối Giản & Nghi Thức Cảm Xúc',
    },
    baseNote: {
      en: 'Breathable Italian gabardine paired with acoustic mineral fragrance and quiet architectural accessories designed for slow studio mornings.',
      vi: 'Vải gabardine Ý thoáng nhẹ phối cùng hương gỗ-khoáng tĩnh lặng và phụ kiện tối giản dành cho những sáng cuối tuần tại studio.',
    },
  },
  'nocturne-salon': {
    headline: {
      en: 'After-Hours Tailoring & Smoked Sillage',
      vi: 'May Đo Dạ Tiệc & Dư Hương Đêm Khói',
    },
    baseNote: {
      en: 'Slubbed raw Como silk catches ambient candle and gallery lighting, grounded by 30% Extrait sillage and honed sculptural objects.',
      vi: 'Lụa thô Como bắt sáng tinh tế dưới ánh đèn đêm, kết hợp cùng tinh dầu 30% Extrait sâu lắng và các tác phẩm thủ công điêu khắc.',
    },
  },
};

const PALETTE_FABRIC_NOTES: Record<StylistPalette, LocalizedText> = {
  'alabaster-sand': {
    en: 'Material harmony: Limestone gabardine, raw brushed titanium, and warm travertine stone tones create sunlit Parisian depth.',
    vi: 'Hòa phối chất liệu: Gabardine màu đá vôi, titan đánh xước nguyên bản và đá travertine ấm tạo chiều sâu ánh sáng Paris.',
  },
  'obsidian-monochrome': {
    en: 'Material harmony: Matte PVD noir titanium, French box calfskin, and raw dark bourette silk deliver razor-sharp architectural contrast.',
    vi: 'Hòa phối chất liệu: Titan phủ đen nhám PVD, da bê Pháp Box-Calf và lụa thô tối màu mang lại tương phản kiến trúc sắc lẹm.',
  },
  'terracotta-warmth': {
    en: 'Material harmony: Earthy terracotta sienna, champagne gold hardware, and smoked amber glass evoke late-afternoon Florentine patina.',
    vi: 'Hòa phối chất liệu: Sắc đất nung sienna, chi tiết kim loại vàng champagne và thủy tinh hổ phách gợi nhớ nước màu cổ điển Florence.',
  },
};

function pickBestColorway(
  product: Product,
  palette: StylistPalette
): ProductColorway {
  const order = PALETTE_FAMILY_PRIORITY[palette];
  for (const family of order) {
    const match = product.colorways.find((c) => c.family === family);
    if (match) return match;
  }
  return product.colorways[0];
}

function getRoleLabel(category: Product['category']): LocalizedText {
  switch (category) {
    case 'Outerwear':
      return { en: 'Architectural Anchor', vi: 'Trục Phom Dáng Chính' };
    case 'Eyewear':
      return { en: 'Optical Signature', vi: 'Điểm Nhấn Quang Học' };
    case 'Leather Goods':
      return { en: 'Sculpted Carry', vi: 'Đồ Da Định Hình' };
    case 'Fragrance':
      return { en: 'Olfactory Sillage', vi: 'Dấu Ấn Mùi Hương' };
    case 'Objects':
    default:
      return { en: 'Atelier Ritual Object', vi: 'Vật Phẩm Không Gian' };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function curateAtelierWardrobe(
  productsById: Record<string, Product>,
  occasion: StylistOccasion,
  palette: StylistPalette,
  budget: StylistBudgetTier
): StylistCurationResult {
  const trioIds = OCCASION_TRIOS[occasion][budget];
  const fallbackPool = Object.values(productsById).filter((p) => p.stock > 0);

  const pieces: CuratedStylistPiece[] = trioIds.map((pid, idx) => {
    const candidate = productsById[pid];
    const product =
      candidate && candidate.stock > 0
        ? candidate
        : fallbackPool[idx % fallbackPool.length];
    return {
      product,
      colorway: pickBestColorway(product, palette),
      recommendedSize: product.sizes.includes('M') ? 'M' : product.sizes[0],
      roleLabel: getRoleLabel(product.category),
    };
  });

  const retailUsd = round2(
    pieces.reduce((sum, item) => sum + item.product.priceUsd, 0)
  );
  const savingsUsd = round2(retailUsd * STYLIST_BUNDLE_DISCOUNT_RATE);
  const finalUsd = round2(retailUsd - savingsUsd);

  return {
    bundleId: `stylist-${occasion}-${palette}-${budget}`,
    headline: OCCASION_COPY[occasion].headline,
    editorialRationale: OCCASION_COPY[occasion].baseNote,
    fabricPairingNote: PALETTE_FABRIC_NOTES[palette],
    pieces,
    retailUsd,
    savingsUsd,
    finalUsd,
    discountRate: STYLIST_BUNDLE_DISCOUNT_RATE,
  };
}
