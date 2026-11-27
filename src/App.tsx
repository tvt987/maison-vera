import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { AtelierCurtain } from './components/AtelierCurtain';
import { AtelierManifesto } from './components/AtelierManifesto';
import { AtelierStylistDrawer } from './components/AtelierStylistDrawer';
import { BagDrawer } from './components/BagDrawer';
import { BespokeSizingLab } from './components/BespokeSizingLab';
import { CatalogSection } from './components/CatalogSection';
import { CheckoutModal } from './components/CheckoutModal';
import { CommandSearchModal } from './components/CommandSearchModal';
import { CompareDockModal } from './components/CompareDockModal';
import { CraftsmanshipStrip } from './components/CraftsmanshipStrip';
import { CustomCursor } from './components/CustomCursor';
import { EditorialLookbook } from './components/EditorialLookbook';
import { HeroShowcase } from './components/HeroShowcase';
import { LookbookDrawer } from './components/LookbookDrawer';
import { Navbar } from './components/Navbar';
import { PrivateVaultBanner } from './components/PrivateVaultBanner';
import { ProductQuickView } from './components/ProductQuickView';
import { RecentlyViewedStrip } from './components/RecentlyViewedStrip';
import { RunwayTicker } from './components/RunwayTicker';
import { ToastStack } from './components/ToastStack';
import { VipLookbookDrawer } from './components/VipLookbookDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { StoreProvider, useStore } from './context/StoreContext';

gsap.registerPlugin(ScrollTrigger);

const StorefrontShell: React.FC = () => {
  const { hasActiveOverlay } = useStore();
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
      <CustomCursor />
      <Navbar />
      <main>
        <HeroShowcase />
        <RunwayTicker />
        <BespokeSizingLab />
        <EditorialLookbook />
        <CatalogSection />
        <CraftsmanshipStrip />
        <RecentlyViewedStrip />
        <PrivateVaultBanner />
      </main>
      <AtelierManifesto />

      {/* Production Overlays, Concierge Drawers & Comparison Matrix */}
      <AtelierStylistDrawer />
      <VipLookbookDrawer />
      <LookbookDrawer />
      <ProductQuickView />
      <CommandSearchModal />
      <WishlistDrawer />
      <BagDrawer />
      <CompareDockModal />
      <CheckoutModal />
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
