import React, { useState } from 'react';
import {
  Heart,
  Menu,
  Moon,
  Search,
  ShoppingBag,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { t } from '../data/i18n';
import { atelierAudio } from '../engines/atelierAudio';

export const Navbar: React.FC = () => {
  const {
    locale,
    toggleLocale,
    currency,
    toggleCurrency,
    theme,
    toggleThemeWithWipe,
    audioEnabled,
    toggleAudio,
    cartTotals,
    wishlist,
    setBagOpen,
    setWishlistOpen,
    setStylistOpen,
    setSearchOpen,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const copy = t(locale);

  const handleThemeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    toggleThemeWithWipe({
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--hairline)] bg-[var(--bg)]/90 backdrop-blur-md">
      {/* Archival Top Telemetry Ribbon */}
      <div className="border-b border-[var(--hairline)] px-4 py-1.5 text-[10px] tracking-[0.2em] text-[var(--ink-muted)] sm:px-8">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between font-mono-tech uppercase">
          <span>{copy.brandSub}</span>
          <span className="hidden md:inline">
            {locale === 'en'
              ? 'COMPLIMENTARY DHL EXPRESS $350+ · BESPOKE FOIL MONOGRAM · AI STYLIST -12%'
              : 'MIỄN PHÍ DHL EXPRESS $350+ · ÉP KIM MONOGRAM MIỄN PHÍ · STYLIST AI -12%'}
          </span>
          <span className="text-[var(--accent)]">AW26 · V3.0</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-2 px-4 sm:h-[72px] sm:px-8">
        {/* Left Navigation Anchors */}
        <nav className="hidden items-center gap-6 xl:flex" aria-label="Primary">
          <a
            href="#lookbook"
            className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
          >
            {copy.navLookbook}
          </a>
          <a
            href="#collection"
            className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
          >
            {copy.navCatalog}
          </a>
          <a
            href="#craft"
            className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
          >
            {copy.navCraft}
          </a>
          <button
            type="button"
            data-testid="nav-stylist-btn"
            onClick={() => {
              atelierAudio.playDetent();
              setStylistOpen(true);
            }}
            className="inline-flex items-center gap-1.5 border border-[var(--accent)]/60 bg-[var(--surface)] px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.16em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
          >
            <Sparkles size={12} strokeWidth={1.6} />
            {copy.navStylist}
          </button>
        </nav>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="inline-flex h-9 w-9 items-center justify-center border border-[var(--hairline)] text-[var(--ink)] xl:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={16} strokeWidth={1.5} /> : <Menu size={16} strokeWidth={1.5} />}
        </button>

        {/* Center Wordmark */}
        <a
          href="#top"
          className="flex flex-col items-center text-center leading-none"
        >
          <span className="font-serif-editorial text-xl font-medium tracking-[0.24em] text-[var(--ink)] sm:text-[26px]">
            MAISON VÉRA
          </span>
        </a>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* CMD+K Global Search */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            data-testid="nav-search-btn"
            className="inline-flex h-9 items-center gap-2 border border-[var(--hairline)] bg-[var(--surface)] px-2.5 text-xs text-[var(--ink)] transition-colors hover:border-[var(--hairline-strong)] sm:px-3"
            aria-label={copy.searchShortcut}
          >
            <Search size={14} strokeWidth={1.5} />
            <span className="hidden text-[11px] uppercase tracking-[0.14em] md:inline">
              {copy.searchShortcut}
            </span>
            <kbd className="hidden rounded border border-[var(--hairline)] px-1.5 py-0.5 font-mono-tech text-[9px] text-[var(--ink-muted)] 2xl:inline">
              CMD+K
            </kbd>
          </button>

          {/* Tactile Atelier Audio Toggle (Muted by default) */}
          <button
            type="button"
            onClick={toggleAudio}
            data-testid="audio-toggle"
            className={`hidden h-9 w-9 items-center justify-center border transition-colors sm:inline-flex ${
              audioEnabled
                ? 'border-[var(--accent)] bg-[var(--accent)]/12 text-[var(--accent)]'
                : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
            aria-label={audioEnabled ? copy.audioOn : copy.audioOff}
            title={audioEnabled ? copy.audioOn : copy.audioOff}
          >
            {audioEnabled ? (
              <Volume2 size={14} strokeWidth={1.5} />
            ) : (
              <VolumeX size={14} strokeWidth={1.5} />
            )}
          </button>

          {/* Currency Switcher (USD <-> VND) */}
          <button
            type="button"
            onClick={toggleCurrency}
            data-testid="currency-toggle"
            className="inline-flex h-9 items-center border border-[var(--hairline)] bg-[var(--surface)] px-2 font-mono-tech text-[11px] tracking-[0.1em] text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] sm:px-2.5"
            title="Switch currency USD / VND"
          >
            {currency === 'USD' ? 'USD $' : 'VND ₫'}
          </button>

          {/* Language Switcher (EN <-> VI) */}
          <button
            type="button"
            onClick={toggleLocale}
            data-testid="locale-toggle"
            className="inline-flex h-9 items-center border border-[var(--hairline)] bg-[var(--surface)] px-2 font-mono-tech text-[11px] uppercase tracking-[0.1em] text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] sm:px-2.5"
            title="Switch language EN / VI"
          >
            {locale.toUpperCase()}
          </button>

          {/* View Transitions Theme Wipe Button */}
          <button
            type="button"
            onClick={handleThemeClick}
            data-testid="theme-toggle"
            className="inline-flex h-9 w-9 items-center justify-center border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            aria-label={theme === 'paper' ? copy.themeNocturne : copy.themePaper}
            title={theme === 'paper' ? copy.themeNocturne : copy.themePaper}
          >
            {theme === 'paper' ? (
              <Moon size={15} strokeWidth={1.5} />
            ) : (
              <Sun size={15} strokeWidth={1.5} />
            )}
          </button>

          {/* Wishlist Trigger */}
          <button
            type="button"
            onClick={() => setWishlistOpen(true)}
            data-testid="wishlist-btn"
            className="relative inline-flex h-9 w-9 items-center justify-center border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] transition-colors hover:border-[var(--hairline-strong)]"
            aria-label={copy.wishlist}
          >
            <Heart size={15} strokeWidth={1.5} />
            {wishlist.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center bg-[var(--ink)] px-1 font-mono-tech text-[9px] text-[var(--surface)]">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Shopping Bag Trigger */}
          <button
            type="button"
            onClick={() => setBagOpen(true)}
            data-testid="bag-btn"
            className="relative inline-flex h-9 items-center gap-1.5 border border-[var(--ink)] bg-[var(--ink)] px-2.5 text-[var(--surface)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] sm:px-3"
            aria-label={copy.bag}
          >
            <ShoppingBag size={14} strokeWidth={1.5} />
            <span className="hidden text-[11px] font-medium uppercase tracking-[0.16em] sm:inline">
              {copy.bag}
            </span>
            <span
              data-testid="bag-count-badge"
              className="font-mono-tech text-[11px]"
            >
              ({cartTotals.totalUnits})
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-[var(--hairline)] bg-[var(--surface)] px-6 py-4 xl:hidden">
          <div className="flex flex-col gap-3">
            <a
              href="#lookbook"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-xs uppercase tracking-[0.18em] text-[var(--ink)]"
            >
              {copy.navLookbook}
            </a>
            <a
              href="#collection"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-xs uppercase tracking-[0.18em] text-[var(--ink)]"
            >
              {copy.navCatalog}
            </a>
            <a
              href="#craft"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-xs uppercase tracking-[0.18em] text-[var(--ink)]"
            >
              {copy.navCraft}
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setStylistOpen(true);
              }}
              className="inline-flex w-fit items-center gap-2 border border-[var(--accent)] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-[var(--accent)]"
            >
              <Sparkles size={13} strokeWidth={1.5} />
              {copy.navStylist}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
