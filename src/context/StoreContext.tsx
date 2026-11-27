import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CATALOG, HERO_FRAME_FINISHES, PRODUCT_BY_ID } from '../data/catalog';
import { t } from '../data/i18n';
import { LOOKBOOKS } from '../data/lookbooks';
import { atelierAudio } from '../engines/atelierAudio';
import { computeBespokeFit, ENGRAVING_TIERS, PRESCRIPTION_TIERS } from '../engines/bespokeSizing';
import {
  calculateCartTotals,
  evaluatePromoCode,
  removeCartItem,
  updateCartItemQty,
  upsertCartItem,
} from '../engines/cartEngine';
import { toggleCompareList } from '../engines/compareEngine';
import { resolveActiveMonogram } from '../engines/monogramEngine';
import { computeOpticalLensTelemetry, getOpticalLensMode } from '../engines/opticalPhysics';
import {
  createInitialVipLookbookSeed,
  createVipLookbookEntry,
  upsertVipLookbook,
} from '../engines/vipLookbook';
import type {
  BespokeSizingInput,
  CartItem,
  CartTotals,
  Currency,
  FoilFinishId,
  HeroEyewearConfig,
  Locale,
  MonogramConfig,
  OrderRecord,
  ProductSize,
  PromoCodeId,
  PromoEvaluationResult,
  ThemeMode,
  VipLookbookEntry,
} from '../types/commerce';

export interface ToastNotice {
  id: string;
  title: string;
  detail?: string;
  tone?: 'default' | 'accent' | 'olive';
}

interface StoreContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggleLocale: () => void;
  currency: Currency;
  setCurrency: (next: Currency) => void;
  toggleCurrency: () => void;
  theme: ThemeMode;
  toggleThemeWithWipe: (origin?: { x: number; y: number }) => void;
  audioEnabled: boolean;
  toggleAudio: () => void;
  heroConfig: HeroEyewearConfig;
  setHeroConfig: React.Dispatch<React.SetStateAction<HeroEyewearConfig>>;
  heroMonogram: MonogramConfig;
  setHeroMonogram: React.Dispatch<React.SetStateAction<MonogramConfig>>;
  bespokeSizing: BespokeSizingInput;
  setBespokeSizing: React.Dispatch<React.SetStateAction<BespokeSizingInput>>;
  addHeroEditionToBag: () => void;
  addBespokeCommissionToBag: (productId?: string) => void;
  vipLookbook: VipLookbookEntry[];
  vipLookbookOpen: boolean;
  setVipLookbookOpen: (open: boolean) => void;
  saveCurrentBespokeToLookbook: (options?: {
    productId?: string;
    clientLabel?: string;
    openDrawer?: boolean;
  }) => VipLookbookEntry;
  removeVipLookbookEntry: (id: string) => void;
  loadVipLookbookEntry: (entry: VipLookbookEntry) => void;
  cart: CartItem[];
  cartTotals: CartTotals;
  addToBag: (payload: {
    productId: string;
    size: ProductSize;
    colorwayId: string;
    quantity?: number;
    customMeta?: string;
    unitPriceAddonUsd?: number;
    bespokeSummary?: string;
    monogram?: { text: string; foil: FoilFinishId };
    stylistBundleId?: string;
    openDrawer?: boolean;
  }) => void;
  addLookbookBundleToBag: (
    lookbookId: string,
    selections: { productId: string; size: ProductSize; colorwayId: string }[]
  ) => void;
  addStylistWardrobeToBag: (
    bundleId: string,
    selections: { productId: string; size: ProductSize; colorwayId: string }[]
  ) => void;
  setBagItemQty: (key: string, qty: number) => void;
  removeBagItem: (key: string) => void;
  clearBagAfterOrder: (order: OrderRecord) => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  compareIds: string[];
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;
  compareModalOpen: boolean;
  setCompareModalOpen: (open: boolean) => void;
  recentlyViewed: string[];
  recordViewed: (productId: string) => void;
  activePromoCode: PromoCodeId | null;
  applyPromoCode: (raw: string) => PromoEvaluationResult;
  clearPromoCode: () => void;
  giftWrap: boolean;
  setGiftWrap: (next: boolean) => void;
  giftNote: string;
  setGiftNote: (next: string) => void;
  bagOpen: boolean;
  setBagOpen: (open: boolean) => void;
  wishlistOpen: boolean;
  setWishlistOpen: (open: boolean) => void;
  stylistOpen: boolean;
  setStylistOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  quickViewProductId: string | null;
  openQuickView: (productId: string) => void;
  closeQuickView: () => void;
  activeLookbookBundleId: string | null;
  setActiveLookbookBundleId: (id: string | null) => void;
  checkoutOpen: boolean;
  setCheckoutOpen: (open: boolean) => void;
  lastOrder: OrderRecord | null;
  setLastOrder: (order: OrderRecord | null) => void;
  toasts: ToastNotice[];
  pushToast: (toast: Omit<ToastNotice, 'id'>) => void;
  dismissToast: (id: string) => void;
  hasActiveOverlay: boolean;
}

const STORAGE_KEYS = {
  cart: 'maison_vera_v2_cart',
  wishlist: 'maison_vera_v2_wishlist',
  recent: 'maison_vera_v2_recent',
  prefs: 'maison_vera_v2_prefs',
  vipLookbook: 'maison_vera_v4_vip_lookbook',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const StoreContext = createContext<StoreContextValue | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialPrefs = useMemo(
    () =>
      readStorage<{ locale: Locale; currency: Currency; theme: ThemeMode }>(
        STORAGE_KEYS.prefs,
        { locale: 'en', currency: 'USD', theme: 'paper' }
      ),
    []
  );

  const [locale, setLocale] = useState<Locale>(initialPrefs.locale);
  const [currency, setCurrency] = useState<Currency>(initialPrefs.currency);
  const [theme, setTheme] = useState<ThemeMode>(initialPrefs.theme);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  const [heroConfig, setHeroConfig] = useState<HeroEyewearConfig>({
    frameFinishId: 'raw-titanium',
    lensMode: 'polarized-amber',
    uvIndex: 6,
    cameraPreset: 'runway',
    lightingMood: 'morning',
  });

  const [heroMonogram, setHeroMonogram] = useState<MonogramConfig>({
    enabled: false,
    text: 'TVT',
    foil: 'gold-24k',
  });

  const [bespokeSizing, setBespokeSizing] = useState<BespokeSizingInput>({
    faceShape: 'oval',
    pdMm: 64,
    noseBridge: 'medium',
    templeLengthMm: 145,
    prescriptionTier: 'plano',
    engravingTier: 'none',
    engravingText: 'T.V. TINH',
  });

  const [vipLookbook, setVipLookbook] = useState<VipLookbookEntry[]>(() =>
    readStorage<VipLookbookEntry[]>(
      STORAGE_KEYS.vipLookbook,
      createInitialVipLookbookSeed()
    )
  );
  const [vipLookbookOpen, setVipLookbookOpen] = useState(false);

  const [cart, setCart] = useState<CartItem[]>(() =>
    readStorage<CartItem[]>(STORAGE_KEYS.cart, [])
  );
  const [wishlist, setWishlist] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.wishlist, ['mv-eye-01', 'mv-out-01'])
  );
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.recent, ['mv-eye-01', 'mv-out-01', 'mv-lth-01', 'mv-frg-01'])
  );
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const [activePromoCode, setActivePromoCode] = useState<PromoCodeId | null>(null);
  const [giftWrap, setGiftWrap] = useState<boolean>(false);
  const [giftNote, setGiftNote] = useState<string>('');

  const [bagOpen, setBagOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [stylistOpen, setStylistOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickViewProductId, setQuickViewProductId] = useState<string | null>(null);
  const [activeLookbookBundleId, setActiveLookbookBundleId] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<OrderRecord | null>(null);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.wishlist, JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.recent, JSON.stringify(recentlyViewed));
    } catch {
      // ignore
    }
  }, [recentlyViewed]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.prefs,
        JSON.stringify({ locale, currency, theme })
      );
    } catch {
      // ignore
    }
  }, [locale, currency, theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.vipLookbook,
        JSON.stringify(vipLookbook)
      );
    } catch {
      // ignore
    }
  }, [vipLookbook]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback((toast: Omit<ToastNotice, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3400);
  }, []);

  const cartTotals = useMemo(
    () => calculateCartTotals(cart, PRODUCT_BY_ID, LOOKBOOKS, activePromoCode, giftWrap),
    [cart, activePromoCode, giftWrap]
  );

  const toggleLocale = useCallback(() => {
    atelierAudio.playDetent();
    setLocale((prev) => (prev === 'en' ? 'vi' : 'en'));
  }, []);

  const toggleCurrency = useCallback(() => {
    atelierAudio.playDetent();
    setCurrency((prev) => (prev === 'USD' ? 'VND' : 'USD'));
  }, []);

  const toggleAudio = useCallback(() => {
    setAudioEnabled((prev) => {
      const next = !prev;
      atelierAudio.setEnabled(next);
      return next;
    });
  }, []);

  const toggleThemeWithWipe = useCallback(
    (origin?: { x: number; y: number }) => {
      atelierAudio.playShutter();
      const nextTheme: ThemeMode = theme === 'paper' ? 'nocturne' : 'paper';
      const x = origin?.x ?? window.innerWidth - 64;
      const y = origin?.y ?? 36;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const docWithTransition = document as Document & {
        startViewTransition?: (cb: () => void) => { ready: Promise<void> };
      };

      const prefersReduced =
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!docWithTransition.startViewTransition || prefersReduced) {
        document.documentElement.setAttribute('data-theme', nextTheme);
        setTheme(nextTheme);
        return;
      }

      const transition = docWithTransition.startViewTransition(() => {
        document.documentElement.setAttribute('data-theme', nextTheme);
        setTheme(nextTheme);
      });

      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 580,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        })
        .catch(() => {});
    },
    [theme]
  );

  const recordViewed = useCallback((productId: string) => {
    if (!PRODUCT_BY_ID[productId]) return;
    setRecentlyViewed((prev) =>
      [productId, ...prev.filter((id) => id !== productId)].slice(0, 6)
    );
  }, []);

  const openQuickView = useCallback(
    (productId: string) => {
      atelierAudio.playDetent();
      recordViewed(productId);
      setQuickViewProductId(productId);
    },
    [recordViewed]
  );

  const closeQuickView = useCallback(() => {
    setQuickViewProductId(null);
  }, []);

  const addToBag = useCallback(
    (payload: {
      productId: string;
      size: ProductSize;
      colorwayId: string;
      quantity?: number;
      customMeta?: string;
      unitPriceAddonUsd?: number;
      bespokeSummary?: string;
      monogram?: { text: string; foil: FoilFinishId };
      stylistBundleId?: string;
      openDrawer?: boolean;
    }) => {
      const product = PRODUCT_BY_ID[payload.productId];
      if (!product || product.stock <= 0) return;

      atelierAudio.playConfirm();
      setCart((prev) => upsertCartItem(prev, payload, product.stock));
      recordViewed(payload.productId);

      pushToast({
        title:
          locale === 'en'
            ? `Added to Bag — ${product.name.en}`
            : `Đã thêm vào giỏ — ${product.name.vi}`,
        detail: `${product.sku} · ${payload.size}${payload.monogram ? ` · MONO:${payload.monogram.text}` : ''}`,
        tone: 'accent',
      });

      if (payload.openDrawer) {
        setBagOpen(true);
      }
    },
    [locale, pushToast, recordViewed]
  );

  const addHeroEditionToBag = useCallback(() => {
    const finish =
      HERO_FRAME_FINISHES.find((f) => f.id === heroConfig.frameFinishId) ??
      HERO_FRAME_FINISHES[0];
    const lensSpec = getOpticalLensMode(heroConfig.lensMode);
    const optics = computeOpticalLensTelemetry(heroConfig.lensMode, heroConfig.uvIndex);
    const activeMono = resolveActiveMonogram(heroMonogram);

    addToBag({
      productId: 'mv-eye-01',
      size: 'OS',
      colorwayId: finish.colorwayId,
      customMeta: `${finish.label[locale]} / ${lensSpec.label[locale]}`,
      unitPriceAddonUsd: optics.surchargeUsd > 0 ? optics.surchargeUsd : undefined,
      bespokeSummary: `VLT ${optics.vltPercent}% · Glare -${optics.glareReductionPercent}%${
        heroConfig.lensMode === 'photochromic-uv' ? ` · UV ${optics.uvIndex}` : ''
      }`,
      monogram: activeMono,
      openDrawer: true,
    });
  }, [addToBag, heroConfig, heroMonogram, locale]);

  const addBespokeCommissionToBag = useCallback(
    (productId = 'mv-eye-01') => {
      const prod = PRODUCT_BY_ID[productId] ?? PRODUCT_BY_ID['mv-eye-01'];
      const finish =
        HERO_FRAME_FINISHES.find((f) => f.id === heroConfig.frameFinishId) ??
        HERO_FRAME_FINISHES[0];
      const lensSpec = getOpticalLensMode(heroConfig.lensMode);
      const fit = computeBespokeFit(bespokeSizing, heroConfig.lensMode);
      const rx = PRESCRIPTION_TIERS.find((r) => r.id === bespokeSizing.prescriptionTier);
      const eng = ENGRAVING_TIERS.find((e) => e.id === bespokeSizing.engravingTier);
      const activeMono = resolveActiveMonogram(heroMonogram);

      const cwId =
        prod.colorways.find((c) => c.id === finish.colorwayId)?.id ??
        prod.colorways[0].id;

      const engSnippet =
        bespokeSizing.engravingTier !== 'none'
          ? ` · ${eng?.label[locale]}: ${fit.sanitizedEngraving || 'SABAE'}`
          : '';

      addToBag({
        productId: prod.id,
        size: 'OS',
        colorwayId: cwId,
        customMeta: `${finish.label[locale]} / ${lensSpec.shortLabel[locale]}`,
        unitPriceAddonUsd: fit.pricing.totalAddonUsd > 0 ? fit.pricing.totalAddonUsd : undefined,
        bespokeSummary: `CAD ${fit.blueprint.blueprintCode} · PD ${fit.blueprint.pdMm}mm · Fit ${fit.overallFitScore}% · ${
          rx?.label[locale] ?? 'Plano'
        }${engSnippet}`,
        monogram: activeMono,
        openDrawer: true,
      });
    },
    [addToBag, bespokeSizing, heroConfig, heroMonogram, locale]
  );

  const saveCurrentBespokeToLookbook = useCallback(
    (options?: { productId?: string; clientLabel?: string; openDrawer?: boolean }) => {
      const productId = options?.productId ?? 'mv-eye-01';
      const prod = PRODUCT_BY_ID[productId] ?? PRODUCT_BY_ID['mv-eye-01'];
      const activeMono = resolveActiveMonogram(heroMonogram);

      const entry = createVipLookbookEntry({
        clientLabel: options?.clientLabel,
        productId: prod.id,
        basePriceUsd: prod.priceUsd,
        frameFinishId: heroConfig.frameFinishId,
        lensMode: heroConfig.lensMode,
        uvIndex: heroConfig.uvIndex,
        sizing: bespokeSizing,
        monogram: activeMono,
      });

      atelierAudio.playConfirm();
      setVipLookbook((prev) => upsertVipLookbook(prev, entry));
      pushToast({
        title:
          locale === 'en'
            ? `Saved to VIP Lookbook — ${entry.certificateId}`
            : `Đã lưu Hồ Sơ VIP — ${entry.certificateId}`,
        detail: `${entry.frameBlueprintCode} · Fit ${entry.fitScore}% · VLT ${entry.vltPercent}%`,
        tone: 'olive',
      });

      if (options?.openDrawer) {
        setVipLookbookOpen(true);
      }
      return entry;
    },
    [bespokeSizing, heroConfig, heroMonogram, locale, pushToast]
  );

  const removeVipLookbookEntry = useCallback((id: string) => {
    atelierAudio.playDetent();
    setVipLookbook((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const loadVipLookbookEntry = useCallback(
    (entry: VipLookbookEntry) => {
      atelierAudio.playShutter();
      setHeroConfig((prev) => ({
        ...prev,
        frameFinishId: entry.frameFinishId,
        lensMode: entry.lensMode,
        uvIndex: entry.uvIndex,
      }));
      setBespokeSizing({ ...entry.sizing });
      if (entry.monogram) {
        setHeroMonogram({
          enabled: true,
          text: entry.monogram.text,
          foil: entry.monogram.foil,
        });
      }
      setVipLookbookOpen(false);
      pushToast({
        title:
          locale === 'en'
            ? `Loaded Bespoke Study — ${entry.certificateId}`
            : `Đã nạp cấu hình — ${entry.certificateId}`,
        detail: `${entry.frameBlueprintCode} · VLT ${entry.vltPercent}%`,
        tone: 'accent',
      });
    },
    [locale, pushToast]
  );

  const addLookbookBundleToBag = useCallback(
    (
      lookbookId: string,
      selections: { productId: string; size: ProductSize; colorwayId: string }[]
    ) => {
      const look = LOOKBOOKS.find((l) => l.id === lookbookId);
      atelierAudio.playConfirm();
      setCart((prev) => {
        let next = prev;
        for (const sel of selections) {
          const product = PRODUCT_BY_ID[sel.productId];
          if (!product || product.stock <= 0) continue;
          next = upsertCartItem(
            next,
            {
              productId: sel.productId,
              size: sel.size,
              colorwayId: sel.colorwayId,
              quantity: 1,
            },
            product.stock
          );
        }
        return next;
      });
      setActiveLookbookBundleId(null);
      setBagOpen(true);
      pushToast({
        title:
          locale === 'en'
            ? `${look?.title.en ?? 'Complete Look'} added (-10% bundle active)`
            : `Đã thêm ${look?.title.vi ?? 'Trọn Bộ Look'} (giảm tự động 10%)`,
        detail: locale === 'en' ? '3 curated pieces paired in bag' : '3 sản phẩm tuyển chọn đã vào giỏ',
        tone: 'olive',
      });
    },
    [locale, pushToast]
  );

  const addStylistWardrobeToBag = useCallback(
    (
      bundleId: string,
      selections: { productId: string; size: ProductSize; colorwayId: string }[]
    ) => {
      atelierAudio.playConfirm();
      setCart((prev) => {
        let next = prev;
        for (const sel of selections) {
          const product = PRODUCT_BY_ID[sel.productId];
          if (!product || product.stock <= 0) continue;
          next = upsertCartItem(
            next,
            {
              productId: sel.productId,
              size: sel.size,
              colorwayId: sel.colorwayId,
              quantity: 1,
              stylistBundleId: bundleId,
            },
            product.stock
          );
        }
        return next;
      });
      setStylistOpen(false);
      setBagOpen(true);
      pushToast({
        title:
          locale === 'en'
            ? 'AI Atelier Styled Wardrobe added (-12% privilege active)'
            : 'Đã thêm Trọn Bộ Stylist AI (giảm tự động 12%)',
        detail: locale === 'en' ? '3 tailored specimens paired in bag' : '3 tác phẩm tuyển chọn đã vào giỏ',
        tone: 'olive',
      });
    },
    [locale, pushToast]
  );

  const setBagItemQty = useCallback((key: string, qty: number) => {
    atelierAudio.playDetent();
    setCart((prev) => {
      const item = prev.find((c) => c.key === key);
      const maxStock = item ? PRODUCT_BY_ID[item.productId]?.stock ?? 10 : 10;
      return updateCartItemQty(prev, key, qty, maxStock);
    });
  }, []);

  const removeBagItem = useCallback((key: string) => {
    atelierAudio.playDetent();
    setCart((prev) => removeCartItem(prev, key));
  }, []);

  const clearBagAfterOrder = useCallback((order: OrderRecord) => {
    atelierAudio.playConfirm();
    setLastOrder(order);
    setCart([]);
    setActivePromoCode(null);
    setGiftWrap(false);
    setGiftNote('');
  }, []);

  const toggleWishlist = useCallback(
    (productId: string) => {
      const product = PRODUCT_BY_ID[productId];
      if (!product) return;
      atelierAudio.playDetent();
      setWishlist((prev) => {
        const exists = prev.includes(productId);
        pushToast({
          title: exists
            ? locale === 'en'
              ? `Removed from Wishlist — ${product.name.en}`
              : `Đã bỏ lưu — ${product.name.vi}`
            : locale === 'en'
            ? `Saved to Wishlist — ${product.name.en}`
            : `Đã lưu yêu thích — ${product.name.vi}`,
          detail: product.sku,
        });
        return exists ? prev.filter((id) => id !== productId) : [productId, ...prev];
      });
    },
    [locale, pushToast]
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  );

  const toggleCompare = useCallback(
    (productId: string) => {
      atelierAudio.playDetent();
      setCompareIds((prev) => {
        const res = toggleCompareList(prev, productId);
        if (res.status === 'limit-reached') {
          pushToast({
            title: t(locale).compareLimitToast,
            tone: 'accent',
          });
        }
        return res.next;
      });
    },
    [locale, pushToast]
  );

  const clearCompare = useCallback(() => {
    setCompareIds([]);
    setCompareModalOpen(false);
  }, []);

  const applyPromoCode = useCallback(
    (raw: string): PromoEvaluationResult => {
      const result = evaluatePromoCode(
        raw,
        activePromoCode,
        cartTotals.postBundleSubtotalUsd
      );
      if (result.status === 'APPLIED' && result.code) {
        atelierAudio.playConfirm();
        setActivePromoCode(result.code);
      }
      return result;
    },
    [activePromoCode, cartTotals.postBundleSubtotalUsd]
  );

  const clearPromoCode = useCallback(() => {
    setActivePromoCode(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setQuickViewProductId(null);
        setActiveLookbookBundleId(null);
        setBagOpen(false);
        setWishlistOpen(false);
        setStylistOpen(false);
        setVipLookbookOpen(false);
        setCompareModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const hasActiveOverlay = Boolean(
    bagOpen ||
      wishlistOpen ||
      stylistOpen ||
      vipLookbookOpen ||
      searchOpen ||
      quickViewProductId ||
      activeLookbookBundleId ||
      compareModalOpen ||
      checkoutOpen
  );

  void CATALOG;

  const value: StoreContextValue = {
    locale,
    setLocale,
    toggleLocale,
    currency,
    setCurrency,
    toggleCurrency,
    theme,
    toggleThemeWithWipe,
    audioEnabled,
    toggleAudio,
    heroConfig,
    setHeroConfig,
    heroMonogram,
    setHeroMonogram,
    bespokeSizing,
    setBespokeSizing,
    addHeroEditionToBag,
    addBespokeCommissionToBag,
    vipLookbook,
    vipLookbookOpen,
    setVipLookbookOpen,
    saveCurrentBespokeToLookbook,
    removeVipLookbookEntry,
    loadVipLookbookEntry,
    cart,
    cartTotals,
    addToBag,
    addLookbookBundleToBag,
    addStylistWardrobeToBag,
    setBagItemQty,
    removeBagItem,
    clearBagAfterOrder,
    wishlist,
    toggleWishlist,
    isWishlisted,
    compareIds,
    toggleCompare,
    clearCompare,
    compareModalOpen,
    setCompareModalOpen,
    recentlyViewed,
    recordViewed,
    activePromoCode,
    applyPromoCode,
    clearPromoCode,
    giftWrap,
    setGiftWrap,
    giftNote,
    setGiftNote,
    bagOpen,
    setBagOpen,
    wishlistOpen,
    setWishlistOpen,
    stylistOpen,
    setStylistOpen,
    searchOpen,
    setSearchOpen,
    quickViewProductId,
    openQuickView,
    closeQuickView,
    activeLookbookBundleId,
    setActiveLookbookBundleId,
    checkoutOpen,
    setCheckoutOpen,
    lastOrder,
    setLastOrder,
    toasts,
    pushToast,
    dismissToast,
    hasActiveOverlay,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return ctx;
}
