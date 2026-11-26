import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Globe,
  Moon,
  Search,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CATALOG } from '../data/catalog';
import { CATEGORY_LABELS, t } from '../data/i18n';
import { formatMoney } from '../engines/currency';
import { DEFAULT_FILTERS, filterAndSortCatalog } from '../engines/filterEngine';
import { ProductArt } from './ProductArt';

export const CommandSearchModal: React.FC = () => {
  const {
    locale,
    currency,
    searchOpen,
    setSearchOpen,
    openQuickView,
    toggleThemeWithWipe,
    toggleCurrency,
    toggleLocale,
    setStylistOpen,
    setBagOpen,
  } = useStore();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (searchOpen) {
      setQuery('');
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [searchOpen]);

  const results = useMemo(
    () =>
      filterAndSortCatalog(
        CATALOG,
        { ...DEFAULT_FILTERS, searchQuery: query },
        locale
      ).slice(0, 6),
    [query, locale]
  );

  if (!searchOpen) return null;

  const copy = t(locale);

  const actions = [
    {
      id: 'theme',
      label: copy.cmdActionTheme,
      icon: Moon,
      run: () => {
        toggleThemeWithWipe();
        setSearchOpen(false);
      },
    },
    {
      id: 'currency',
      label: `${copy.cmdActionCurrency} (${currency === 'USD' ? 'VND ₫' : 'USD $'})`,
      icon: Globe,
      run: () => {
        toggleCurrency();
        setSearchOpen(false);
      },
    },
    {
      id: 'locale',
      label: `${copy.cmdActionLanguage} (${locale === 'en' ? 'VI' : 'EN'})`,
      icon: Globe,
      run: () => {
        toggleLocale();
        setSearchOpen(false);
      },
    },
    {
      id: 'stylist',
      label: copy.cmdActionStylist,
      icon: Sparkles,
      run: () => {
        setSearchOpen(false);
        setStylistOpen(true);
      },
    },
    {
      id: 'bag',
      label: copy.cmdActionBag,
      icon: ShoppingBag,
      run: () => {
        setSearchOpen(false);
        setBagOpen(true);
      },
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/55 px-4 pt-[10vh] backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Search"
      onClick={() => setSearchOpen(false)}
    >
      <div
        data-testid="command-search-modal"
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-in w-full max-w-[640px] overflow-hidden border border-[var(--hairline-strong)] bg-[var(--surface)] shadow-2xl"
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 border-b border-[var(--hairline)] px-5 py-4">
          <Search size={17} strokeWidth={1.5} className="text-[var(--ink-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={copy.cmdPlaceholder}
            className="flex-1 bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            aria-label="Close command search"
            className="flex h-7 w-7 items-center justify-center border border-[var(--hairline)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[65vh] overflow-y-auto p-4">
          <p className="mb-2 px-2 font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
            {copy.cmdProductsHeading}
          </p>

          {results.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-[var(--ink-muted)]">
              {copy.cmdNoResults}
            </p>
          ) : (
            <div className="space-y-1">
              {results.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    openQuickView(prod.id);
                  }}
                  className="flex w-full items-center gap-3 border border-transparent px-2.5 py-2 text-left transition-colors hover:border-[var(--hairline)] hover:bg-[var(--bg)]"
                >
                  <div className="h-12 w-10 shrink-0 border border-[var(--hairline)] bg-[var(--studio-bg)] p-1">
                    <ProductArt product={prod} colorway={prod.colorways[0]} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif-editorial text-lg text-[var(--ink)]">
                      {prod.name[locale]}
                    </p>
                    <p className="font-mono-tech text-[10px] text-[var(--ink-muted)]">
                      {prod.sku} · {CATEGORY_LABELS[prod.category][locale]}
                    </p>
                  </div>
                  <span className="font-mono-tech text-xs text-[var(--ink)]">
                    {formatMoney(prod.priceUsd, currency)}
                  </span>
                  <ArrowRight size={13} strokeWidth={1.5} className="text-[var(--ink-muted)]" />
                </button>
              ))}
            </div>
          )}

          {/* Quick Atelier Commands */}
          <div className="mt-5 border-t border-[var(--hairline)] pt-4">
            <p className="mb-2 px-2 font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              {copy.cmdActionsHeading}
            </p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {actions.map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={act.run}
                    className="flex items-center gap-2.5 border border-[var(--hairline)] bg-[var(--bg)] px-3 py-2 text-left text-xs text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    <Icon size={13} strokeWidth={1.5} />
                    <span className="truncate">{act.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
