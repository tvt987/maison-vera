export type Locale = 'en' | 'vi';
export type Currency = 'USD' | 'VND';
export type ThemeMode = 'paper' | 'nocturne';

export type ProductCategory =
  | 'Outerwear'
  | 'Eyewear'
  | 'Leather Goods'
  | 'Objects'
  | 'Fragrance';

export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'OS';

export type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc';

export type ColorFamily =
  | 'Obsidian'
  | 'Sand'
  | 'Sienna'
  | 'Olive'
  | 'Titanium'
  | 'Gold';

export interface LocalizedText {
  en: string;
  vi: string;
}

export interface ProductColorway {
  id: string;
  name: LocalizedText;
  family: ColorFamily;
  hex: string;
  secondaryHex: string;
  accentHex: string;
}

export interface Product {
  id: string;
  sku: string;
  category: ProductCategory;
  name: LocalizedText;
  subtitle: LocalizedText;
  description: LocalizedText;
  provenance: LocalizedText;
  careGuide: LocalizedText;
  materialSpec: LocalizedText;
  priceUsd: number;
  sizes: ProductSize[];
  colorways: ProductColorway[];
  stock: number;
  isNew?: boolean;
  featuredRank: number;
  editionStamp: string;
  silhouetteKey:
    | 'trench'
    | 'overcoat'
    | 'blazer'
    | 'monolith-frame'
    | 'solaire-shield'
    | 'archival-optical'
    | 'architectural-tote'
    | 'weekender-48h'
    | 'bronze-vessel'
    | 'steel-tray'
    | 'hinoki-extrait'
    | 'fig-extrait';
}

export interface LookbookHotspot {
  index: '01' | '02' | '03';
  productId: string;
  xPercent: number;
  yPercent: number;
  note: LocalizedText;
}

export interface LookbookPlate {
  id: string;
  plateCode: string;
  seasonStamp: string;
  title: LocalizedText;
  editorialNote: LocalizedText;
  architectureRef: LocalizedText;
  bundleDiscountRate: number;
  artKey: 'autumn-architecture' | 'brutalist-travel' | 'nocturne-salon';
  hotspots: LookbookHotspot[];
}

export type FoilFinishId =
  | 'gold-24k'
  | 'blind-deboss'
  | 'silver-leaf'
  | 'terracotta-ink';

export interface MonogramConfig {
  enabled: boolean;
  text: string;
  foil: FoilFinishId;
}

export interface CartItem {
  key: string;
  productId: string;
  size: ProductSize;
  colorwayId: string;
  quantity: number;
  customMeta?: string;
  monogram?: {
    text: string;
    foil: FoilFinishId;
  };
  stylistBundleId?: string;
}

export type PromoCodeId = 'VERA15' | 'ATELIER50' | 'VIP200';

export interface PromoRule {
  code: PromoCodeId;
  type: 'percent' | 'fixed';
  value: number;
  minSpendUsd: number;
  description: LocalizedText;
}

export type PromoValidationStatus =
  | 'APPLIED'
  | 'DUPLICATE_CODE'
  | 'INVALID_CODE'
  | 'MIN_SPEND_NOT_MET'
  | 'EMPTY_CART';

export interface PromoEvaluationResult {
  status: PromoValidationStatus;
  code?: PromoCodeId;
  remainingUsdForMinSpend?: number;
}

export interface CartTotals {
  merchandiseSubtotalUsd: number;
  lookbookDiscountUsd: number;
  stylistDiscountUsd: number;
  matchedLookbooks: { lookbookId: string; title: LocalizedText; count: number; savingsUsd: number }[];
  matchedStylistBundles: { bundleId: string; savingsUsd: number }[];
  postBundleSubtotalUsd: number;
  promoDiscountUsd: number;
  giftWrapUsd: number;
  shippingUsd: number;
  freeShippingThresholdUsd: number;
  freeShippingRemainingUsd: number;
  freeShippingProgress: number;
  grandTotalUsd: number;
  totalUnits: number;
}

export interface CatalogFilterState {
  category: ProductCategory | 'All';
  searchQuery: string;
  colorFamily: ColorFamily | 'All';
  maxPriceUsd: number;
  inStockOnly: boolean;
  sortBy: SortOption;
}

export type FitPreference = 'tailored' | 'architectural' | 'oversized';

export interface FitRecommendation {
  recommendedSize: Exclude<ProductSize, 'OS'>;
  chestCm: string;
  shoulderCm: string;
  lengthCm: string;
  confidenceNote: LocalizedText;
}

export type PaymentMethod = 'card' | 'apple-pay' | 'b2b-invoice';

export interface OrderRecord {
  orderId: string;
  createdAtIso: string;
  currency: Currency;
  paymentMethod: PaymentMethod;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
    companyName?: string;
  };
  items: {
    sku: string;
    name: LocalizedText;
    size: ProductSize;
    colorwayName: LocalizedText;
    quantity: number;
    unitPriceUsd: number;
    customMeta?: string;
    monogram?: {
      text: string;
      foil: FoilFinishId;
    };
  }[];
  giftWrap: boolean;
  giftNote: string;
  promoCode: PromoCodeId | null;
  totals: CartTotals;
}

export type EyewearCameraPreset = 'runway' | 'hinge' | 'optics' | 'exploded';
export type StudioLightingMood = 'morning' | 'golden' | 'gallery' | 'nocturne';

export interface HeroEyewearConfig {
  frameFinishId: 'raw-titanium' | 'warm-gold' | 'matte-noir';
  lensTintId: 'smoked-amber' | 'obsidian-polarized' | 'olive-mineral' | 'rose-quartz';
  cameraPreset: EyewearCameraPreset;
  lightingMood: StudioLightingMood;
}

export type StylistOccasion =
  | 'gallery-opening'
  | 'tokyo-architecture'
  | 'minimalist-weekend'
  | 'nocturne-salon';

export type StylistPalette =
  | 'alabaster-sand'
  | 'obsidian-monochrome'
  | 'terracotta-warmth';

export type StylistBudgetTier = 'essential' | 'signature' | 'collector';
