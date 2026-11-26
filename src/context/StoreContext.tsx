import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CATALOG, HERO_FRAME_FINISHES, HERO_LENS_TINTS, PRODUCT_BY_ID } from '../data/catalog';
import { LOOKBOOKS } from '../data/lookbooks';
import {
  calculateCartTotals,
  evaluatePromoCode,
  removeCartItem,
  updateCartItemQty,
  upsertCartItem,
} from '../engines/cartEngine';
import type {
  CartItem,
  CartTotals,
  Currency,
  HeroEyewearConfig,
  Locale,
  OrderRecord,
  ProductSize,
  PromoCodeId,
  PromoEvaluationResult,
  ThemeMode,
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
  heroConfig: HeroEyewearConfig;
  setHeroConfig: React.Dispatch<React.SetStateAction<HeroEyewearConfig>>;
  addHeroEditionToBag: () => void;
  cart: CartItem[];
  cartTotals: CartTotals;
  addToBag: (payload: {
    productId: string;
    size: ProductSize;
    colorwayId: string;
    quantity?: number;
    customMeta?: string;
    openDrawer?: boolean;
  }) => void;
  addLookbookBundleToBag: (
    lookbookId: string,
    selections: { productId: string; size: ProductSize; colorwayId: string }[]
  ) => void;
  setBagItemQty: (key: string, qty: number) => void;
  removeBagItem: (key: string) => void;
  clearBagAfterOrder: (order: OrderRecord) => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
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
  cart: 'maison_vera_v1_cart',
  wishlist: 'maison_vera_v1_wishlist',
  recent: 'maison_vera_v1_recent',
  prefs: 'maison_vera_v1_prefs',
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

  const [heroConfig, setHeroConfig] = useState<HeroEyewearConfig>({
    frameFinishId: 'raw-titanium',
    lensTintId: 'smoked-amber',
  });

  const [cart, setCart] = useState<CartItem[]>(() =>
    readStorage<CartItem[]>(STORAGE_KEYS.cart, [])
  );
  const [wishlist, setWishlist] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.wishlist, ['mv-eye-01', 'mv-out-01'])
  );
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.recent, ['mv-eye-01', 'mv-out-01', 'mv-lth-01', 'mv-frg-01'])
  );

  const [activePromoCode, setActivePromoCode] = useState<PromoCodeId | null>(null);
  const [giftWrap, setGiftWrap] = useState<boolean>(false);
  const [giftNote, setGiftNote] = useState<string>('');

  const [bagOpen, setBagOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickViewProductId, setQuickViewProductId] = useState<string | null>(null);
  const [activeLookbookBundleId, setActiveLookbookBundleId] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<OrderRecord | null>(null);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  // Apply theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Persist states
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
    } catch {
      // ignore quota errors
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

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastNotice, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 3400);
    },
    []
  );

  const cartTotals = useMemo(
    () => calculateCartTotals(cart, PRODUCT_BY_ID, LOOKBOOKS, activePromoCode, giftWrap),
    [cart, activePromoCode, giftWrap]
  );

  const toggleLocale = useCallback(() => {
    setLocale((prev) => (prev === 'en' ? 'vi' : 'en'));
  }, []);

  const toggleCurrency = useCallback(() => {
    setCurrency((prev) => (prev === 'USD' ? 'VND' : 'USD'));
  }, []);

  const toggleThemeWithWipe = useCallback(
    (origin?: { x: number; y: number }) => {
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
        .catch(() => {
          // Graceful fallback if animation rejected
        });
    },
    [theme]
  );

  const recordViewed = useCallback((productId: string) => {
    if (!PRODUCT_BY_ID[productId]) return;
    setRecentlyViewed((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, 6));
  }, []);

  const openQuickView = useCallback(
    (productId: string) => {
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
      openDrawer?: boolean;
    }) => {
      const product = PRODUCT_BY_ID[payload.productId];
      if (!product || product.stock <= 0) return;

      setCart((prev) => upsertCartItem(prev, payload, product.stock));
      recordViewed(payload.productId);

      pushToast({
        title:
          locale === 'en'
            ? `Added to Bag — ${product.name.en}`
            : `Đã thêm vào giỏ — ${product.name.vi}`,
        detail: `${product.sku} · ${payload.size}${payload.customMeta ? ` · ${payload.customMeta}` : ''}`,
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
    const lens =
      HERO_LENS_TINTS.find((l) => l.id === heroConfig.lensTintId) ?? HERO_LENS_TINTS[0];

    addToBag({
      productId: 'mv-eye-01',
      size: 'OS',
      colorwayId: finish.colorwayId,
      customMeta: `${finish.label[locale]} / ${lens.label[locale]}`,
      openDrawer: true,
    });
  }, [addToBag, heroConfig, locale]);

  const addLookbookBundleToBag = useCallback(
    (
      lookbookId: string,
      selections: { productId: string; size: ProductSize; colorwayId: string }[]
    ) => {
      const look = LOOKBOOKS.find((l) => l.id === lookbookId);
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

  const setBagItemQty = useCallback((key: string, qty: number) => {
    setCart((prev) => {
      const item = prev.find((c) => c.key === key);
      const maxStock = item ? PRODUCT_BY_ID[item.productId]?.stock ?? 10 : 10;
      return updateCartItemQty(prev, key, qty, maxStock);
    });
  }, []);

  const removeBagItem = useCallback((key: string) => {
    setCart((prev) => removeCartItem(prev, key));
  }, []);

  const clearBagAfterOrder = useCallback((order: OrderRecord) => {
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

  const applyPromoCode = useCallback(
    (raw: string): PromoEvaluationResult => {
      const result = evaluatePromoCode(
        raw,
        activePromoCode,
        cartTotals.postBundleSubtotalUsd
      );
      if (result.status === 'APPLIED' && result.code) {
        setActivePromoCode(result.code);
      }
      return result;
    },
    [activePromoCode, cartTotals.postBundleSubtotalUsd]
  );

  const clearPromoCode = useCallback(() => {
    setActivePromoCode(null);
  }, []);

  // Global keyboard shortcuts (CMD+K / Ctrl+K & Escape)
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
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const hasActiveOverlay = Boolean(
    bagOpen ||
      wishlistOpen ||
      searchOpen ||
      quickViewProductId ||
      activeLookbookBundleId ||
      checkoutOpen
  );

  // Ensure initial catalog integrity
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
    heroConfig,
    setHeroConfig,
    addHeroEditionToBag,
    cart,
    cartTotals,
    addToBag,
    addLookbookBundleToBag,
    setBagItemQty,
    removeBagItem,
    clearBagAfterOrder,
    wishlist,
    toggleWishlist,
    isWishlisted,
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
