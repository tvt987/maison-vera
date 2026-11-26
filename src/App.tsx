import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { AtelierManifesto } from './components/AtelierManifesto';
import { BagDrawer } from './components/BagDrawer';
import { CatalogSection } from './components/CatalogSection';
import { CheckoutModal } from './components/CheckoutModal';
import { CommandSearchModal } from './components/CommandSearchModal';
import { CustomCursor } from './components/CustomCursor';
import { EditorialLookbook } from './components/EditorialLookbook';
import { HeroShowcase } from './components/HeroShowcase';
import { LookbookDrawer } from './components/LookbookDrawer';
import { Navbar } from './components/Navbar';
import { ProductQuickView } from './components/ProductQuickView';
import { RecentlyViewedStrip } from './components/RecentlyViewedStrip';
import { RunwayTicker } from './components/RunwayTicker';
import { ToastStack } from './components/ToastStack';
import { WishlistDrawer } from './components/WishlistDrawer';
import { StoreProvider, useStore } from './context/StoreContext';

gsap.registerPlugin(ScrollTrigger);

const StorefrontShell: React.FC = () => {
  const { hasActiveOverlay } = useStore();
  const lenisRef = useRef<Lenis | null>(null);

  // Sync Lenis smooth inertial scrolling with GSAP ScrollTrigger
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

    // Subtle vertical polish on major editorial sections without hiding content permanently
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
    });

    return () => {
      ctx.revert();
      gsap.ticker.remove(tickerFn);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Pause smooth scrolling when modals or drawers are open so overlay scroll is native
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
      <CustomCursor />
      <Navbar />
      <main>
        <HeroShowcase />
        <RunwayTicker />
        <EditorialLookbook />
        <CatalogSection />
        <RecentlyViewedStrip />
      </main>
      <AtelierManifesto />

      {/* Production Overlays & Drawers */}
      <LookbookDrawer />
      <ProductQuickView />
      <CommandSearchModal />
      <WishlistDrawer />
      <BagDrawer />
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
