import React, { useState } from 'react';
import {
  ArrowDownRight,
  Box,
  Camera,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  Sparkles,
  SunMedium,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  getMediaUrl,
  HERO_EDITORIAL_IMAGE,
  HERO_FRAME_FINISHES,
  HERO_LENS_TINTS,
  PRODUCT_BY_ID,
} from '../data/catalog';
import { t } from '../data/i18n';
import { atelierAudio } from '../engines/atelierAudio';
import { formatMoney } from '../engines/currency';
import type { EyewearCameraPreset, StudioLightingMood } from '../types/commerce';
import { Eyewear3DCanvas } from './Eyewear3DCanvas';
import { MonogramStudio } from './MonogramStudio';

export const HeroShowcase: React.FC = () => {
  const {
    locale,
    currency,
    theme,
    heroConfig,
    setHeroConfig,
    heroMonogram,
    setHeroMonogram,
    addHeroEditionToBag,
    openQuickView,
    setStylistOpen,
    hasActiveOverlay,
  } = useStore();

  const [stageMode, setStageMode] = useState<'campaign' | '3d'>('campaign');
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [resetSignal, setResetSignal] = useState(0);

  const copy = t(locale);
  const heroProduct = PRODUCT_BY_ID['mv-eye-01'];

  const activeFinish =
    HERO_FRAME_FINISHES.find((f) => f.id === heroConfig.frameFinishId) ??
    HERO_FRAME_FINISHES[0];
  const activeLens =
    HERO_LENS_TINTS.find((l) => l.id === heroConfig.lensTintId) ?? HERO_LENS_TINTS[0];

  const cameraPresets: { id: EyewearCameraPreset; label: string }[] = [
    { id: 'runway', label: copy.camRunway },
    { id: 'hinge', label: copy.camHinge },
    { id: 'optics', label: copy.camOptics },
    { id: 'exploded', label: copy.camExploded },
  ];

  const lightingMoods: { id: StudioLightingMood; label: string; dot: string }[] = [
    { id: 'morning', label: copy.lightMorning, dot: '#EFE6D8' },
    { id: 'golden', label: copy.lightGolden, dot: '#E29E5B' },
    { id: 'gallery', label: copy.lightGallery, dot: '#DCE3EC' },
    { id: 'nocturne', label: copy.lightNocturne, dot: '#5DA6B8' },
  ];

  const handleCampaignMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (stageMode !== 'campaign') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * -14;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
    setParallax({ x: nx, y: ny });
  };

  return (
    <section
      id="top"
      className="relative border-b border-[var(--hairline)] bg-[var(--bg)]"
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-12">
        {/* Left Editorial Column */}
        <div className="flex flex-col justify-between border-b border-[var(--hairline)] px-6 py-7 sm:px-10 lg:col-span-5 lg:border-b-0 lg:border-r lg:py-9">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-[var(--hairline)] pb-3">
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
                {copy.heroEditionLabel}
              </span>
              <span className="font-mono-tech text-[10px] tracking-[0.18em] text-[var(--ink-muted)]">
                {heroProduct.sku}
              </span>
            </div>

            <h1 className="font-serif-editorial text-5xl font-normal leading-[0.96] tracking-[-0.02em] text-[var(--ink)] sm:text-[58px] xl:text-[62px]">
              {copy.heroTitleLine1}
              <br />
              <em className="font-normal italic text-[var(--accent)]">
                {copy.heroTitleLine2}
              </em>
            </h1>

            <p className="mt-4 max-w-md text-[13.5px] leading-relaxed text-[var(--ink-muted)]">
              {copy.heroLead}
            </p>
          </div>

          {/* Interactive Finish, Lens & Monogram Configurator */}
          <div className="mt-6 space-y-4 border-t border-[var(--hairline)] pt-4">
            {/* Chassis Finish */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                  {copy.heroFrameFinish}
                </span>
                <span className="font-mono-tech text-[11px] text-[var(--ink)]">
                  {activeFinish.label[locale]}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {HERO_FRAME_FINISHES.map((finish) => {
                  const selected = heroConfig.frameFinishId === finish.id;
                  return (
                    <button
                      key={finish.id}
                      type="button"
                      onClick={() => {
                        atelierAudio.playDetent();
                        setHeroConfig((prev) => ({
                          ...prev,
                          frameFinishId: finish.id,
                        }));
                      }}
                      className={`flex items-center gap-2 border px-2.5 py-2 text-left text-[11px] transition-all ${
                        selected
                          ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                          : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--hairline-strong)]'
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/20"
                        style={{ backgroundColor: finish.metalHex }}
                      />
                      <span className="truncate">{finish.label[locale]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optical Lens Tint */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                  {copy.heroLensTint}
                </span>
                <span className="font-mono-tech text-[11px] text-[var(--ink)]">
                  {activeLens.label[locale]}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {HERO_LENS_TINTS.map((lens) => {
                  const selected = heroConfig.lensTintId === lens.id;
                  return (
                    <button
                      key={lens.id}
                      type="button"
                      onClick={() => {
                        atelierAudio.playDetent();
                        setHeroConfig((prev) => ({ ...prev, lensTintId: lens.id }));
                      }}
                      className={`flex items-center gap-2 border px-3 py-1.5 text-left text-[11px] transition-all ${
                        selected
                          ? 'border-[var(--accent)] bg-[var(--surface)] text-[var(--ink)] ring-1 ring-[var(--accent)]'
                          : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-muted)] hover:border-[var(--hairline-strong)] hover:text-[var(--ink)]'
                      }`}
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border border-black/20"
                        style={{ backgroundColor: lens.hex }}
                      />
                      <span>{lens.label[locale]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Bespoke Monogram & Foil-Stamping Studio */}
            <MonogramStudio
              config={heroMonogram}
              onChange={setHeroMonogram}
              locale={locale}
              testIdPrefix="hero-monogram"
            />

            {/* Pricing + Primary 1-Click Add Hero CTA + Stylist & Archive Actions */}
            <div className="space-y-2 pt-0.5">
              <button
                type="button"
                onClick={addHeroEditionToBag}
                data-testid="hero-add-to-bag"
                data-cursor="QUICK ADD"
                className="inline-flex w-full items-center justify-between gap-3 border border-[var(--ink)] bg-[var(--ink)] px-5 py-3 text-xs font-medium uppercase tracking-[0.18em] text-[var(--surface)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
              >
                <span className="inline-flex items-center gap-2">
                  <Plus size={14} strokeWidth={1.75} />
                  {copy.heroAddEdition}
                </span>
                <span className="font-mono-tech text-xs">
                  {formatMoney(heroProduct.priceUsd, currency)}
                </span>
              </button>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  data-testid="hero-stylist-btn"
                  onClick={() => {
                    atelierAudio.playDetent();
                    setStylistOpen(true);
                  }}
                  className="inline-flex items-center justify-between border border-[var(--accent)] bg-[var(--surface)] px-3.5 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles size={13} strokeWidth={1.5} />
                    {copy.heroOpenStylist}
                  </span>
                </button>
                <a
                  href="#collection"
                  data-cursor="EXPLORE"
                  className="inline-flex items-center justify-between border border-[var(--hairline-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--ink)] transition-colors hover:border-[var(--ink)]"
                >
                  <span>{copy.heroExploreCollection}</span>
                  <ArrowDownRight size={13} strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Dual-Stage Showcase: CAMPAIGN EDITORIAL <-> 3D INTERACTIVE STUDIO */}
        <div className="archival-grid relative flex min-h-[470px] flex-col justify-between overflow-hidden bg-[var(--studio-bg)] sm:min-h-[580px] lg:col-span-7 lg:min-h-[680px]">
          {/* Top Dual-Stage Mode Switcher + Telemetry */}
          <div className="relative z-30 flex flex-wrap items-center justify-between gap-2 px-5 pt-5 sm:px-7">
            {/* Mode Pill Switcher */}
            <div className="inline-flex border border-[var(--hairline-strong)] bg-[var(--surface)]/92 p-0.5 backdrop-blur-md">
              <button
                type="button"
                data-testid="hero-mode-campaign"
                onClick={() => {
                  atelierAudio.playShutter();
                  setStageMode('campaign');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-[0.16em] transition-colors ${
                  stageMode === 'campaign'
                    ? 'bg-[var(--ink)] text-[var(--surface)]'
                    : 'text-[var(--ink)] hover:text-[var(--accent)]'
                }`}
              >
                <ImageIcon size={12} strokeWidth={1.5} />
                {copy.heroModeCampaign}
              </button>
              <button
                type="button"
                data-testid="hero-mode-3d"
                onClick={() => {
                  atelierAudio.playShutter();
                  setStageMode('3d');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-[0.16em] transition-colors ${
                  stageMode === '3d'
                    ? 'bg-[var(--ink)] text-[var(--surface)]'
                    : 'text-[var(--ink)] hover:text-[var(--accent)]'
                }`}
              >
                <Box size={12} strokeWidth={1.5} />
                {copy.heroMode3d}
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="hidden border border-[var(--hairline-strong)] bg-[var(--surface)]/88 px-2.5 py-1.5 font-mono-tech text-[10px] tracking-[0.16em] text-[var(--ink)] backdrop-blur-md xl:inline">
                {copy.heroCampaignTelemetry}
              </span>
              {stageMode === '3d' && (
                <button
                  type="button"
                  onClick={() => {
                    atelierAudio.playShutter();
                    setHeroConfig((prev) => ({ ...prev, cameraPreset: 'runway' }));
                    setResetSignal((n) => n + 1);
                  }}
                  className="inline-flex items-center gap-1.5 border border-[var(--hairline-strong)] bg-[var(--surface)]/92 px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink)] backdrop-blur-md transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <RotateCcw size={12} strokeWidth={1.5} />
                  {copy.heroResetView}
                </button>
              )}
            </div>
          </div>

          {/* Center Visual Stage: Full-Bleed Hasselblad Campaign Photo OR Live 3D Studio */}
          <div
            onMouseMove={handleCampaignMove}
            onMouseLeave={() => setParallax({ x: 0, y: 0 })}
            className="relative flex-1"
          >
            {/* Stage A: Hasselblad Editorial Campaign Photography (Default First Impression) */}
            <div
              data-testid="hero-campaign-stage"
              data-cursor="EXPLORE"
              className={`absolute inset-0 -top-16 overflow-hidden transition-opacity duration-500 ${
                stageMode === 'campaign'
                  ? 'z-10 opacity-100'
                  : 'pointer-events-none z-0 opacity-0'
              }`}
            >
              <div
                className="h-full w-full transition-transform duration-300 ease-out"
                style={{
                  transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0) scale(1.04)`,
                }}
              >
                <img
                  src={getMediaUrl(HERO_EDITORIAL_IMAGE)}
                  alt="VÉRA-01 Monolith Titanium Eyewear on Roman Travertine Plinth"
                  loading="eager"
                  decoding="async"
                  style={{
                    filter:
                      activeFinish.photoFilter !== 'none'
                        ? activeFinish.photoFilter
                        : undefined,
                  }}
                  className="animate-ken-burns h-full w-full object-cover object-center transition-[filter] duration-500"
                />
              </div>

              {/* Subtle Editorial Vignette & Active Finish/Lens Overlay Stamp */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/38 via-transparent to-black/14"
              />

              <div className="absolute bottom-5 left-5 right-5 z-20 flex flex-wrap items-end justify-between gap-3 sm:left-7 sm:right-7">
                <div className="border border-white/25 bg-[#111111]/68 px-3.5 py-2 text-[#F6F3ED] backdrop-blur-md">
                  <p className="font-mono-tech text-[9px] uppercase tracking-[0.22em] text-[#D4B483]">
                    {copy.heroCampaignCaption}
                  </p>
                  <div className="mt-1 flex items-center gap-2.5 font-mono-tech text-[11px]">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-white/40"
                        style={{ backgroundColor: activeFinish.metalHex }}
                      />
                      {activeFinish.label[locale]}
                    </span>
                    <span className="opacity-45">/</span>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-white/40"
                        style={{ backgroundColor: activeLens.hex }}
                      />
                      {activeLens.label[locale]}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    atelierAudio.playShutter();
                    setStageMode('3d');
                    setHeroConfig((prev) => ({ ...prev, cameraPreset: 'exploded' }));
                  }}
                  className="inline-flex items-center gap-2 border border-white/35 bg-[#FDFBF7]/92 px-3.5 py-2 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[#111111] backdrop-blur-md transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
                >
                  <Box size={12} strokeWidth={1.6} />
                  {copy.camExploded} 3D
                </button>
              </div>
            </div>

            {/* Stage B: Live Three.js PBR + Exploded CAD Studio */}
            <div
              data-testid="hero-3d-stage"
              className={`absolute inset-0 transition-opacity duration-500 ${
                stageMode === '3d'
                  ? 'z-20 opacity-100'
                  : 'pointer-events-none z-0 opacity-0'
              }`}
            >
              {stageMode === '3d' && (
                <Eyewear3DCanvas
                  config={heroConfig}
                  theme={theme}
                  locale={locale}
                  resetSignal={resetSignal}
                  paused={hasActiveOverlay}
                />
              )}
            </div>
          </div>

          {/* Studio Controls Bar: 4 Camera Presets + 4 Lighting Moods (Auto-Engages 3D Mode) */}
          <div className="relative z-30 space-y-2.5 border-t border-[var(--hairline)] bg-[var(--surface)]/92 px-5 py-3.5 backdrop-blur-md sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Camera Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 inline-flex items-center gap-1 font-mono-tech text-[9px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  <Camera size={11} strokeWidth={1.5} />
                  {copy.heroCameraPresetLabel}
                </span>
                {cameraPresets.map((preset) => {
                  const active =
                    stageMode === '3d' && heroConfig.cameraPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      data-testid={`cam-preset-${preset.id}`}
                      onClick={() => {
                        atelierAudio.playShutter();
                        setStageMode('3d');
                        setHeroConfig((prev) => ({
                          ...prev,
                          cameraPreset: preset.id,
                        }));
                      }}
                      className={`border px-2.5 py-1 font-mono-tech text-[10px] uppercase tracking-[0.12em] transition-colors ${
                        active
                          ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                          : 'border-[var(--hairline)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Studio Lighting Moods */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 inline-flex items-center gap-1 font-mono-tech text-[9px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  <SunMedium size={11} strokeWidth={1.5} />
                  {copy.heroLightingLabel}
                </span>
                {lightingMoods.map((mood) => {
                  const active =
                    stageMode === '3d' && heroConfig.lightingMood === mood.id;
                  return (
                    <button
                      key={mood.id}
                      type="button"
                      data-testid={`lighting-mood-${mood.id}`}
                      onClick={() => {
                        atelierAudio.playDetent();
                        setStageMode('3d');
                        setHeroConfig((prev) => ({
                          ...prev,
                          lightingMood: mood.id,
                        }));
                      }}
                      className={`inline-flex items-center gap-1.5 border px-2 py-1 font-mono-tech text-[9.5px] uppercase tracking-[0.1em] transition-colors ${
                        active
                          ? 'border-[var(--accent)] bg-[var(--accent)]/12 text-[var(--ink)]'
                          : 'border-[var(--hairline)] bg-[var(--bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      <span
                        className="h-2 w-2 rounded-full border border-black/20"
                        style={{ backgroundColor: mood.dot }}
                      />
                      <span>{mood.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--hairline)] pt-2">
              <span className="font-mono-tech text-[9.5px] tracking-[0.18em] text-[var(--ink-muted)]">
                {stageMode === 'campaign'
                  ? copy.heroCampaignCaption
                  : copy.heroDragHint}
              </span>
              <button
                type="button"
                onClick={() => openQuickView('mv-eye-01')}
                className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink)] underline decoration-[var(--accent)] underline-offset-4 transition-colors hover:text-[var(--accent)]"
              >
                {heroProduct.name[locale]} · {copy.cardQuickView}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
