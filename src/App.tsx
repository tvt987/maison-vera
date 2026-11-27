import React, { lazy, Suspense, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { AtelierCurtain } from './components/AtelierCurtain';
import { AtelierManifesto } from './components/AtelierManifesto';
import { CraftsmanshipStrip } from './components/CraftsmanshipStrip';
import { HeroShowcase } from './components/HeroShowcase';
import { Navbar } from './components/Navbar';
import { PrivateVaultBanner } from './components/PrivateVaultBanner';
import { RecentlyViewedStrip } from './components/RecentlyViewedStrip';
import { RunwayTicker } from './components/RunwayTicker';
import { ToastStack } from './components/ToastStack';
import { StoreProvider, useStore } from './context/StoreContext';

const BespokeSizingLab = lazy(() =>
  import('./components/BespokeSizingLab').then((m) => ({ default: m.BespokeSizingLab }))
);
const OpticalRxLab = lazy(() =>
  import('./components/OpticalRxLab').then((m) => ({ default: m.OpticalRxLab }))
);
const PolarizedGlareLab = lazy(() =>
  import('./components/PolarizedGlareLab').then((m) => ({ default: m.PolarizedGlareLab }))
);
const EditorialLookbook = lazy(() =>
  import('./components/EditorialLookbook').then((m) => ({ default: m.EditorialLookbook }))
);
const CatalogSection = lazy(() =>
  import('./components/CatalogSection').then((m) => ({ default: m.CatalogSection }))
);
const CheckoutModal = lazy(() =>
  import('./components/CheckoutModal').then((m) => ({ default: m.CheckoutModal }))
);
const CompareDockModal = lazy(() =>
  import('./components/CompareDockModal').then((m) => ({ default: m.CompareDockModal }))
);
const VipLookbookDrawer = lazy(() =>
  import('./components/VipLookbookDrawer').then((m) => ({ default: m.VipLookbookDrawer }))
);
const ProductQuickView = lazy(() =>
  import('./components/ProductQuickView').then((m) => ({ default: m.ProductQuickView }))
);
const AtelierStylistDrawer = lazy(() =>
  import('./components/AtelierStylistDrawer').then((m) => ({ default: m.AtelierStylistDrawer }))
);
const BagDrawer = lazy(() =>
  import('./components/BagDrawer').then((m) => ({ default: m.BagDrawer }))
);
const CommandSearchModal = lazy(() =>
  import('./components/CommandSearchModal').then((m) => ({ default: m.CommandSearchModal }))
);
const LookbookDrawer = lazy(() =>
  import('./components/LookbookDrawer').then((m) => ({ default: m.LookbookDrawer }))
);
const WishlistDrawer = lazy(() =>
  import('./components/WishlistDrawer').then((m) => ({ default: m.WishlistDrawer }))
);

gsap.registerPlugin(ScrollTrigger);

const LabSectionFallback: React.FC<{ id: string; label: string }> = ({ id, label }) => (
  <section
    id={id}
    className="border-b border-[var(--hairline)] bg-[var(--surface)] py-16 text-center"
  >
    <span className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
      {label}
    </span>
  </section>
);

const StorefrontShell: React.FC = () => {
  const {
    hasActiveOverlay,
    stylistOpen,
    vipLookbookOpen,
    activeLookbookBundleId,
    quickViewProductId,
    searchOpen,
    wishlistOpen,
    bagOpen,
    compareIds,
    checkoutOpen,
  } = useStore();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const prefersReduced =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tickerFn = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.reveal-section').forEach((section) => {
        gsap.fromTo(
          section,
          { y: 18 },
          {
            y: 0,
            duration: 0.75,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 92%',
              once: true,
            },
          }
        );
      });

      gsap.fromTo(
        '.craft-card',
        { y: 20 },
        {
          y: 0,
          duration: 0.65,
          stagger: 0.09,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '#craft',
            start: 'top 86%',
            once: true,
          },
        }
      );
    });

    return () => {
      ctx.revert();
      gsap.ticker.remove(tickerFn);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (hasActiveOverlay) {
      lenisRef.current?.stop();
      document.body.style.overflow = 'hidden';
    } else {
      lenisRef.current?.start();
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [hasActiveOverlay]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <AtelierCurtain />
      <Navbar />
      <main>
        <HeroShowcase />
        <RunwayTicker />
        <Suspense fallback={<LabSectionFallback id="bespoke-lab" label="CALIBRATING SABAE MILLIMETER LAB..." />}>
          <BespokeSizingLab />
        </Suspense>
        <Suspense fallback={<LabSectionFallback id="optical-rx-lab" label="LOADING OPTICAL RX SAGITTA LAB..." />}>
          <OpticalRxLab />
        </Suspense>
        <Suspense fallback={<LabSectionFallback id="polarized-glare-lab" label="CALIBRATING POLARIZED GLARE & AR LAB..." />}>
          <PolarizedGlareLab />
        </Suspense>
        <Suspense fallback={<LabSectionFallback id="lookbook" label="LOADING EDITORIAL LOOKBOOK..." />}>
          <EditorialLookbook />
        </Suspense>
        <Suspense fallback={<LabSectionFallback id="collection" label="LOADING ARCHIVAL COLLECTION..." />}>
          <CatalogSection />
        </Suspense>
        <CraftsmanshipStrip />
        <RecentlyViewedStrip />
        <PrivateVaultBanner />
      </main>
      <AtelierManifesto />

      {/* On-Demand Code-Split Overlays, Concierge Drawers & Comparison Matrix */}
      <Suspense fallback={null}>
        {stylistOpen && <AtelierStylistDrawer />}
        {vipLookbookOpen && <VipLookbookDrawer />}
        {activeLookbookBundleId && <LookbookDrawer />}
        {quickViewProductId && <ProductQuickView />}
        {searchOpen && <CommandSearchModal />}
        {wishlistOpen && <WishlistDrawer />}
        {bagOpen && <BagDrawer />}
        {compareIds.length > 0 && <CompareDockModal />}
        {checkoutOpen && <CheckoutModal />}
      </Suspense>
      <ToastStack />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <StoreProvider>
      <StorefrontShell />
    </StoreProvider>
  );
};

export default App;
