import React, { lazy, Suspense, useRef, useState } from 'react';
import {
  ArrowDownRight,
  BookmarkPlus,
  Box,
  Camera,
  Download,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Sun,
  SunMedium,
  Video,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  getMediaUrl,
  HERO_EDITORIAL_IMAGE,
  HERO_FRAME_FINISHES,
  PRODUCT_BY_ID,
} from '../data/catalog';
import { t } from '../data/i18n';
import { atelierAudio } from '../engines/atelierAudio';
import { formatMoney } from '../engines/currency';
import {
  computeOpticalLensTelemetry,
  getOpticalLensMode,
  OPTICAL_LENS_MODES,
} from '../engines/opticalPhysics';
import {
  computePhotochromicUvPhysics,
  computePolarizedGlareShield,
  evaluateVirtualTryOnFit,
  FACE_ARCHETYPES,
  resolveTryOnLensMaterialState,
  TRYON_FRAME_SPECS,
  type FaceArchetypeId,
  type HeroStageMode,
} from '../engines/virtualTryOnEngine';
import type {
  EyewearCameraPreset,
  SabaeFrameSkuId,
  StudioLightingMood,
} from '../types/commerce';
import type { Eyewear3DCanvasHandle, WebcamArNudge } from './Eyewear3DCanvas';
import { MonogramStudio } from './MonogramStudio';

const Eyewear3DCanvas = lazy(() =>
  import('./Eyewear3DCanvas').then((m) => ({ default: m.Eyewear3DCanvas }))
);

export const HeroShowcase: React.FC = () => {
  const {
    locale,
    currency,
    theme,
    heroConfig,
    setHeroConfig,
    heroMonogram,
    setHeroMonogram,
    bespokeSizing,
    setBespokeSizing,
    addHeroEditionToBag,
    saveCurrentBespokeToLookbook,
    openQuickView,
    setStylistOpen,
    pushToast,
    hasActiveOverlay,
  } = useStore();

  const canvasHandleRef = useRef<Eyewear3DCanvasHandle | null>(null);

  const [stageMode, setStageMode] = useState<HeroStageMode>('tryon');
  const [faceArchetype, setFaceArchetype] = useState<FaceArchetypeId>('OVAL');
  const [frameSku, setFrameSku] = useState<SabaeFrameSkuId>('MV-EYE-01');
  const [glareSplitEnabled, setGlareSplitEnabled] = useState<boolean>(false);
  const [glareAngleDeg, setGlareAngleDeg] = useState<number>(90);
  const [glareSplitPercent, setGlareSplitPercent] = useState<number>(50);
  const [headPose, setHeadPose] = useState<{ yawDeg: number; pitchDeg: number }>({
    yawDeg: -14,
    pitchDeg: 4,
  });
  const [arNudge, setArNudge] = useState<WebcamArNudge>({
    scale: 1,
    offsetY: 0,
    tiltDeg: 0,
  });
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [resetSignal, setResetSignal] = useState(0);

  const copy = t(locale);
  const heroProduct = PRODUCT_BY_ID['mv-eye-01'];

  const activeFinish =
    HERO_FRAME_FINISHES.find((f) => f.id === heroConfig.frameFinishId) ??
    HERO_FRAME_FINISHES[0];
  const activeLensSpec = getOpticalLensMode(heroConfig.lensMode);
  const opticalTelemetry = computeOpticalLensTelemetry(
    heroConfig.lensMode,
    heroConfig.uvIndex
  );
  const tryOnLensState = resolveTryOnLensMaterialState(
    heroConfig.lensMode,
    heroConfig.uvIndex
  );
  const uvPhysics = computePhotochromicUvPhysics(heroConfig.uvIndex);
  const glareShield = computePolarizedGlareShield(glareAngleDeg, glareSplitEnabled);
  const fitEval = evaluateVirtualTryOnFit(faceArchetype, frameSku, bespokeSizing.pdMm);

  const configuredPriceUsd = heroProduct.priceUsd + opticalTelemetry.surchargeUsd;

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

  const handleCaptureEditorialPortrait = async () => {
    atelierAudio.playShutter();
    const handle = canvasHandleRef.current;
    const pose = handle?.getCurrentHeadPose() ?? headPose;
    const { downloadEditorialTryOnPortrait } = await import('./tryOnExport');
    const fileName = await downloadEditorialTryOnPortrait({
      webglCanvas: handle?.getWebGLCanvas() ?? null,
      videoElement: handle?.getVideoElement() ?? null,
      stageMode,
      locale,
      finishLabel: activeFinish.label[locale],
      finishHex: activeFinish.metalHex,
      lensLabel: activeLensSpec.shortLabel[locale],
      uvIndex: heroConfig.uvIndex,
      lensState: tryOnLensState,
      fit: fitEval,
      glare: glareShield,
      monogram: heroMonogram,
      headYawDeg: pose.yawDeg,
      headPitchDeg: pose.pitchDeg,
    });
    pushToast({
      title:
        locale === 'en'
          ? 'Editorial Try-On Portrait Exported (1200×800 PNG)'
          : 'Đã Xuất Chân Dung Thử Kính Editorial (1200×800 PNG)',
      detail: `${fileName} · Fit ${fitEval.fitScore}% · VLT ${tryOnLensState.vltPercent}%`,
      tone: 'olive',
    });
  };

  const isWebGLMode = stageMode !== 'campaign';

  return (
    <section
      id="top"
      className="relative border-b border-[var(--hairline)] bg-[var(--bg)]"
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-12">
        {/* Left Editorial Column */}
        <div className="flex flex-col justify-between border-b border-[var(--hairline)] px-5 py-6 sm:px-8 lg:col-span-5 lg:border-b-0 lg:border-r lg:py-7">
          <div>
            <div className="mb-3 flex items-center justify-between border-b border-[var(--hairline)] pb-2.5">
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
                {copy.heroEditionLabel}
              </span>
              <span className="font-mono-tech text-[10px] tracking-[0.18em] text-[var(--ink-muted)]">
                {fitEval.frame.sku} · V7.0
              </span>
            </div>

            <h1 className="font-serif-editorial text-5xl font-normal leading-[0.95] tracking-[-0.02em] text-[var(--ink)] sm:text-[52px] xl:text-[56px]">
              {copy.heroTitleLine1}
              <br />
              <em className="font-normal italic text-[var(--accent)]">
                {copy.heroTitleLine2}
              </em>
            </h1>

            <p className="mt-3 max-w-md text-[13px] leading-relaxed text-[var(--ink-muted)]">
              {copy.heroLead}
            </p>
          </div>

          {/* Interactive Metallurgy, Optical Lens Physics & Monogram Configurator */}
          <div className="mt-5 space-y-3.5 border-t border-[var(--hairline)] pt-3.5">
            {/* Chassis Metallurgy */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                  {copy.heroFrameFinish}
                </span>
                <span className="font-mono-tech text-[11px] text-[var(--ink)]">
                  {activeFinish.label[locale]}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {HERO_FRAME_FINISHES.map((finish) => {
                  const selected = heroConfig.frameFinishId === finish.id;
                  return (
                    <button
                      key={finish.id}
                      type="button"
                      data-testid={`finish-${finish.id}`}
                      onClick={() => {
                        atelierAudio.playDetent();
                        setHeroConfig((prev) => ({
                          ...prev,
                          frameFinishId: finish.id,
                        }));
                      }}
                      className={`flex items-center gap-1.5 border px-2 py-1.5 text-left text-[11px] transition-all ${
                        selected
                          ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                          : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--hairline-strong)]'
                      }`}
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border border-black/20"
                        style={{ backgroundColor: finish.metalHex }}
                      />
                      <span className="truncate">{finish.label[locale]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optical Lens Physics & Lighting Simulator (5 Modes + UV Index 0->11) */}
            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1">
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {copy.heroLensTint}
                </span>
                <span className="shrink-0 font-mono-tech text-[10.5px] text-[var(--accent)]">
                  {activeLensSpec.shortLabel[locale]} · {tryOnLensState.filterCategory}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {OPTICAL_LENS_MODES.map((lens) => {
                  const selected = heroConfig.lensMode === lens.id;
                  return (
                    <button
                      key={lens.id}
                      type="button"
                      data-testid={`lens-mode-${lens.id}`}
                      onClick={() => {
                        atelierAudio.playDetent();
                        setHeroConfig((prev) => ({ ...prev, lensMode: lens.id }));
                      }}
                      className={`flex items-center gap-1.5 border px-2 py-1.5 text-left text-[10.5px] transition-all ${
                        selected
                          ? 'border-[var(--accent)] bg-[var(--surface)] text-[var(--ink)] ring-1 ring-[var(--accent)]'
                          : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-muted)] hover:border-[var(--hairline-strong)] hover:text-[var(--ink)]'
                      }`}
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border border-black/20"
                        style={{
                          background: `linear-gradient(135deg, ${lens.swatchHex} 45%, ${lens.swatchSecondaryHex} 100%)`,
                        }}
                      />
                      <span className="truncate">{lens.shortLabel[locale]}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  data-testid="lens-inspect-3d-btn"
                  onClick={() => {
                    atelierAudio.playShutter();
                    setStageMode('cad');
                    setHeroConfig((prev) => ({ ...prev, cameraPreset: 'optics' }));
                  }}
                  className="flex items-center justify-center gap-1.5 border border-[var(--hairline-strong)] bg-[var(--surface-alt)] px-2 py-1.5 font-mono-tech text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <Box size={11} strokeWidth={1.6} />
                  <span>{locale === 'en' ? '3D Optics' : 'Quang Học 3D'}</span>
                </button>
              </div>

              {/* Photochromic UV Index 0 -> 11 Live Sunlight Simulator */}
              {heroConfig.lensMode === 'photochromic-uv' && (
                <div
                  data-testid="photochromic-uv-panel"
                  className="mt-2 border border-[var(--accent)]/45 bg-[var(--surface)] px-3 py-2"
                >
                  <div className="mb-1 flex items-center justify-between font-mono-tech text-[10px]">
                    <span className="inline-flex items-center gap-1.5 uppercase tracking-[0.16em] text-[var(--ink)]">
                      <Sun size={12} strokeWidth={1.6} className="text-[var(--accent)]" />
                      {copy.heroUvIndexLabel}
                    </span>
                    <span
                      data-testid="uv-index-readout"
                      className="font-medium text-[var(--accent)]"
                    >
                      UV {uvPhysics.uvIndex} / 11 · {uvPhysics.filterCategory}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={11}
                    step={1}
                    data-testid="uv-index-slider"
                    aria-label={copy.heroUvIndexLabel}
                    value={heroConfig.uvIndex}
                    onChange={(e) => {
                      const nextUv = Number(e.target.value);
                      setHeroConfig((prev) => ({ ...prev, uvIndex: nextUv }));
                    }}
                    className="vera-range"
                  />
                  <div className="mt-1 flex justify-between font-mono-tech text-[8.5px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                    <span>0 · 88% Clear</span>
                    <span>5 · Riviera Sun</span>
                    <span>11 · 14% Extreme</span>
                  </div>
                </div>
              )}

              {/* Live Optical Physics Readout Bar (VLT %, Glare Reduction %, UV400 / Blue Cut) */}
              <div
                data-testid="optical-telemetry-bar"
                className="mt-2 grid grid-cols-3 divide-x divide-[var(--hairline)] border border-[var(--hairline)] bg-[var(--surface)]"
              >
                <div className="px-2.5 py-1.5">
                  <span className="block font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    {copy.heroOpticalVlt}
                  </span>
                  <span
                    data-testid="optical-vlt-value"
                    className="font-mono-tech text-[11.5px] font-medium text-[var(--ink)]"
                  >
                    {tryOnLensState.vltPercent}%
                  </span>
                </div>
                <div className="px-2.5 py-1.5">
                  <span className="block font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    {copy.heroOpticalGlare}
                  </span>
                  <span
                    data-testid="optical-glare-value"
                    className="font-mono-tech text-[11.5px] font-medium text-[var(--accent)]"
                  >
                    -
                    {glareSplitEnabled
                      ? glareShield.glareReductionPercent
                      : opticalTelemetry.glareReductionPercent}
                    %
                  </span>
                </div>
                <div className="px-2.5 py-1.5">
                  <span className="block font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    {copy.heroOpticalBlue}
                  </span>
                  <span className="font-mono-tech text-[11.5px] font-medium text-[var(--ink)]">
                    {opticalTelemetry.blueLightFilterPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Live Bespoke Monogram & Foil-Stamping Studio */}
            <MonogramStudio
              config={heroMonogram}
              onChange={setHeroMonogram}
              locale={locale}
              testIdPrefix="hero-monogram"
            />

            {/* Pricing + Primary 1-Click Add Hero CTA + VIP Lookbook & Stylist Actions */}
            <div className="space-y-2 pt-0.5">
              <button
                type="button"
                onClick={addHeroEditionToBag}
                data-testid="hero-add-to-bag"
                data-cursor="QUICK ADD"
                className="inline-flex w-full items-center justify-between gap-3 border border-[var(--ink)] bg-[var(--ink)] px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--surface)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
              >
                <span className="inline-flex items-center gap-2">
                  <Plus size={14} strokeWidth={1.75} />
                  {copy.heroAddEdition}
                </span>
                <span className="font-mono-tech text-xs">
                  {formatMoney(configuredPriceUsd, currency)}
                </span>
              </button>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  data-testid="hero-save-lookbook-btn"
                  onClick={() =>
                    saveCurrentBespokeToLookbook({
                      productId: 'mv-eye-01',
                      openDrawer: true,
                    })
                  }
                  className="inline-flex items-center justify-center gap-1.5 border border-[var(--hairline-strong)] bg-[var(--surface)] px-2.5 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink)] transition-colors hover:border-[var(--ink)]"
                >
                  <BookmarkPlus size={12} strokeWidth={1.5} />
                  <span>{locale === 'en' ? 'VIP Lookbook' : 'Hồ Sơ VIP'}</span>
                </button>
                <button
                  type="button"
                  data-testid="hero-stylist-btn"
                  onClick={() => {
                    atelierAudio.playDetent();
                    setStylistOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 border border-[var(--accent)] bg-[var(--surface)] px-2.5 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
                >
                  <Sparkles size={12} strokeWidth={1.5} />
                  <span className="truncate">{copy.navStylist} -12%</span>
                </button>
                <a
                  href="#bespoke-lab"
                  data-cursor="CALIBRATE"
                  className="inline-flex items-center justify-between border border-[var(--hairline-strong)] bg-[var(--surface)] px-2.5 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink)] transition-colors hover:border-[var(--ink)]"
                >
                  <span className="truncate">{copy.navBespokeLab}</span>
                  <ArrowDownRight size={12} strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Primary Interactive 3D Stage: 3D VIRTUAL TRY-ON | SCULPTURAL 3D CAD | WEBCAM AR | EDITORIAL CAMPAIGN */}
        <div className="archival-grid relative flex min-h-[600px] flex-col justify-between overflow-hidden bg-[var(--studio-bg)] sm:min-h-[660px] lg:col-span-7 lg:min-h-[720px]">
          {/* Top Haute-Couture 4-Mode Switcher + Export Portrait Action */}
          <div className="relative z-30 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--hairline)] bg-[var(--surface)]/92 px-4 py-3 backdrop-blur-md sm:px-6">
            <div
              role="tablist"
              aria-label="Primary 3D Eyewear Stage Modes"
              className="grid w-full grid-cols-2 gap-0.5 border border-[var(--hairline-strong)] bg-[var(--bg)] p-0.5 sm:inline-flex sm:w-auto"
            >
              <button
                type="button"
                role="tab"
                aria-selected={stageMode === 'tryon'}
                data-testid="hero-mode-tryon"
                onClick={() => {
                  atelierAudio.playShutter();
                  setStageMode('tryon');
                }}
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 font-mono-tech text-[9.5px] uppercase tracking-[0.12em] transition-colors ${
                  stageMode === 'tryon'
                    ? 'bg-[var(--ink)] text-[var(--surface)]'
                    : 'text-[var(--ink)] hover:text-[var(--accent)]'
                }`}
              >
                <ScanFace size={12} strokeWidth={1.6} />
                <span className="truncate">{copy.heroModeTryOn}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={stageMode === 'cad'}
                data-testid="hero-mode-3d"
                onClick={() => {
                  atelierAudio.playShutter();
                  setStageMode('cad');
                }}
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 font-mono-tech text-[9.5px] uppercase tracking-[0.12em] transition-colors ${
                  stageMode === 'cad'
                    ? 'bg-[var(--ink)] text-[var(--surface)]'
                    : 'text-[var(--ink)] hover:text-[var(--accent)]'
                }`}
              >
                <Box size={12} strokeWidth={1.6} />
                <span className="truncate">{copy.heroMode3d}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={stageMode === 'ar'}
                data-testid="hero-mode-ar"
                onClick={() => {
                  atelierAudio.playShutter();
                  setStageMode('ar');
                }}
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 font-mono-tech text-[9.5px] uppercase tracking-[0.12em] transition-colors ${
                  stageMode === 'ar'
                    ? 'bg-[var(--ink)] text-[var(--surface)]'
                    : 'text-[var(--ink)] hover:text-[var(--accent)]'
                }`}
              >
                <Video size={12} strokeWidth={1.6} />
                <span className="truncate">{copy.heroModeAr}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={stageMode === 'campaign'}
                data-testid="hero-mode-campaign"
                onClick={() => {
                  atelierAudio.playShutter();
                  setStageMode('campaign');
                }}
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 font-mono-tech text-[9.5px] uppercase tracking-[0.12em] transition-colors ${
                  stageMode === 'campaign'
                    ? 'bg-[var(--ink)] text-[var(--surface)]'
                    : 'text-[var(--ink)] hover:text-[var(--accent)]'
                }`}
              >
                <ImageIcon size={12} strokeWidth={1.6} />
                <span className="truncate">{copy.heroModeCampaign}</span>
              </button>
            </div>

            <div className="flex w-full items-center justify-end gap-1.5 sm:w-auto">
              {(stageMode === 'tryon' || stageMode === 'ar') && (
                <button
                  type="button"
                  data-testid="tryon-capture-png-btn"
                  onClick={handleCaptureEditorialPortrait}
                  className="inline-flex w-full items-center justify-center gap-1.5 border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 font-mono-tech text-[9.5px] uppercase tracking-[0.14em] text-[var(--accent-contrast)] transition-opacity hover:opacity-90 sm:w-auto"
                >
                  <Download size={12} strokeWidth={1.7} />
                  <span>{copy.heroCapturePortrait}</span>
                </button>
              )}
              {stageMode === 'cad' && (
                <button
                  type="button"
                  onClick={() => {
                    atelierAudio.playShutter();
                    setHeroConfig((prev) => ({ ...prev, cameraPreset: 'runway' }));
                    setResetSignal((n) => n + 1);
                  }}
                  className="inline-flex items-center gap-1.5 border border-[var(--hairline-strong)] bg-[var(--surface)] px-3 py-1.5 font-mono-tech text-[9.5px] uppercase tracking-[0.14em] text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <RotateCcw size={12} strokeWidth={1.5} />
                  {copy.heroResetView}
                </button>
              )}
            </div>
          </div>

          {/* Compact Mobile Atelier Fit Telemetry Ribbon (Unobstructed 3D Bust on 390px) */}
          {stageMode === 'tryon' && (
            <div className="relative z-20 flex items-center justify-between gap-2 border-b border-[var(--hairline)] bg-[var(--surface)]/95 px-4 py-2 font-mono-tech text-[9.5px] sm:hidden">
              <div className="flex items-baseline gap-2">
                <span className="uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  {locale === 'en' ? 'FIT' : 'KHỚP'}
                </span>
                <span className="font-serif-editorial text-xl leading-none text-[var(--accent)]">
                  {fitEval.fitScore}%
                </span>
                <span className="text-[var(--ink)]">
                  {fitEval.templeClearanceMm >= 0 ? '+' : ''}
                  {fitEval.templeClearanceMm.toFixed(1)}mm · PD {fitEval.pdMm}
                </span>
              </div>
              <span className="truncate uppercase tracking-[0.08em] text-[var(--olive)]">
                {fitEval.bridgeComfortVerdict[locale]}
              </span>
            </div>
          )}

          {/* Center Visual Stage: Live 60fps 3D Virtual Try-On / CAD / Webcam AR OR Hasselblad Campaign */}
          <div
            onMouseMove={handleCampaignMove}
            onMouseLeave={() => setParallax({ x: 0, y: 0 })}
            className="relative min-h-[360px] flex-1 sm:min-h-[430px]"
          >
            {/* Floating Minimal Atelier Fit Telemetry Badge (Try-On Mode Desktop/Tablet) */}
            {stageMode === 'tryon' && (
              <div
                data-testid="tryon-fit-hud"
                className="pointer-events-none absolute left-5 top-4 z-20 hidden max-w-[235px] border border-[var(--hairline-strong)] bg-[var(--surface)]/90 px-3 py-2 backdrop-blur-md sm:block"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono-tech text-[8.5px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    {locale === 'en' ? 'ATELIER FIT' : 'ĐỘ KHỚP ATELIER'}
                  </span>
                  <span
                    data-testid="tryon-fit-score"
                    className="font-serif-editorial text-2xl leading-none text-[var(--accent)] sm:text-[26px]"
                  >
                    {fitEval.fitScore}%
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-[var(--hairline)] pt-1.5 font-mono-tech text-[9px] text-[var(--ink)]">
                  <span>
                    {locale === 'en' ? 'TEMPLE' : 'CÀNG'}{' '}
                    <strong>
                      {fitEval.templeClearanceMm >= 0 ? '+' : ''}
                      {fitEval.templeClearanceMm.toFixed(1)}mm
                    </strong>
                  </span>
                  <span className="opacity-35">|</span>
                  <span>
                    PD <strong>{fitEval.pdMm}mm</strong>
                  </span>
                </div>
                <p
                  data-testid="tryon-bridge-verdict"
                  className="mt-1 truncate font-mono-tech text-[8.5px] uppercase tracking-[0.12em] text-[var(--olive)]"
                >
                  {fitEval.bridgeComfortVerdict[locale]}
                </p>
              </div>
            )}

            {/* Floating Live Pose & Optical Readout Pill (Try-On Mode Bottom-Left) */}
            {stageMode === 'tryon' && (
              <div
                data-testid="tryon-optical-pill"
                className="pointer-events-none absolute bottom-3 left-3 z-20 hidden flex-wrap items-center gap-1.5 border border-[var(--hairline-strong)] bg-[var(--surface)]/90 px-2.5 py-1 font-mono-tech text-[9px] uppercase tracking-[0.12em] text-[var(--ink)] backdrop-blur-md sm:bottom-4 sm:left-5 sm:flex"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                <span>{fitEval.archetype.shortLabel[locale]}</span>
                <span className="opacity-35">·</span>
                <span>YAW {headPose.yawDeg}°</span>
                <span className="opacity-35">·</span>
                <span>UV {heroConfig.uvIndex}/11</span>
                <span className="opacity-35">·</span>
                <span>VLT {tryOnLensState.vltPercent}%</span>
                <span className="opacity-35">·</span>
                <span className="text-[var(--accent)]">UV400 99.9%</span>
              </div>
            )}

            {/* Stage A: Hasselblad Editorial Campaign Photography */}
            <div
              data-testid="hero-campaign-stage"
              data-cursor="EXPLORE"
              className={`absolute inset-0 overflow-hidden transition-opacity duration-500 ${
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
                  loading="lazy"
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

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/42 via-transparent to-black/14"
              />

              <div className="absolute bottom-5 left-5 right-5 z-20 flex flex-wrap items-end justify-between gap-3 sm:left-7 sm:right-7">
                <div className="border border-white/25 bg-[#111111]/72 px-3.5 py-2 text-[#F6F3ED] backdrop-blur-md">
                  <p className="font-mono-tech text-[9px] uppercase tracking-[0.22em] text-[#D4B483]">
                    {copy.heroCampaignCaption}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 font-mono-tech text-[10.5px]">
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
                        style={{ backgroundColor: tryOnLensState.hexColor }}
                      />
                      {activeLensSpec.shortLabel[locale]}
                    </span>
                    <span className="opacity-45">·</span>
                    <span className="text-[#D4B483]">
                      VLT {tryOnLensState.vltPercent}% · GLARE -
                      {opticalTelemetry.glareReductionPercent}%
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="hero-launch-3d-exploded"
                  onClick={() => {
                    atelierAudio.playShutter();
                    setStageMode('cad');
                    setHeroConfig((prev) => ({ ...prev, cameraPreset: 'exploded' }));
                  }}
                  className="inline-flex items-center gap-2 border border-white/35 bg-[#FDFBF7]/92 px-3.5 py-2 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[#111111] backdrop-blur-md transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
                >
                  <Box size={12} strokeWidth={1.6} />
                  {copy.camExploded} 3D
                </button>
              </div>
            </div>

            {/* Stage B: Live Three.js 60fps PBR Virtual Try-On / CAD / Webcam AR Canvas */}
            <div
              data-testid="hero-3d-stage"
              className={`absolute inset-0 transition-opacity duration-500 ${
                isWebGLMode
                  ? 'z-10 opacity-100'
                  : 'pointer-events-none z-0 opacity-0'
              }`}
            >
              {isWebGLMode && (
                <Suspense
                  fallback={
                    <div className="flex h-full w-full items-center justify-center font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                      INITIALIZING 3D VIRTUAL TRY-ON ATELIER...
                    </div>
                  }
                >
                  <Eyewear3DCanvas
                    ref={canvasHandleRef}
                    config={heroConfig}
                    theme={theme}
                    locale={locale}
                    resetSignal={resetSignal}
                    paused={hasActiveOverlay}
                    stageMode={stageMode}
                    faceArchetype={faceArchetype}
                    frameSku={frameSku}
                    pdMm={bespokeSizing.pdMm}
                    monogram={heroMonogram}
                    glareSplitEnabled={glareSplitEnabled}
                    glareAngleDeg={glareAngleDeg}
                    glareSplitPercent={glareSplitPercent}
                    onGlareSplitPercentChange={setGlareSplitPercent}
                    arNudge={arNudge}
                    onHeadPoseChange={(yawDeg, pitchDeg) =>
                      setHeadPose({ yawDeg, pitchDeg })
                    }
                    onReturnToTryOn={() => {
                      atelierAudio.playShutter();
                      setStageMode('tryon');
                    }}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Bottom Interactive On-Stage Controls Dock */}
          <div className="relative z-30 space-y-2.5 border-t border-[var(--hairline)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur-md sm:px-6">
            {stageMode === 'tryon' && (
              <>
                {/* Row 1: Face Archetype Morph Pills + Frame SKU Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="mr-1 font-mono-tech text-[9px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                      {locale === 'en' ? 'Face' : 'Dáng Mặt'}
                    </span>
                    {FACE_ARCHETYPES.map((arch) => {
                      const active = faceArchetype === arch.id;
                      return (
                        <button
                          key={arch.id}
                          type="button"
                          data-testid={`tryon-archetype-${arch.id}`}
                          onClick={() => {
                            atelierAudio.playDetent();
                            setFaceArchetype(arch.id);
                          }}
                          className={`border px-2.5 py-1 font-mono-tech text-[9.5px] uppercase tracking-[0.12em] transition-colors ${
                            active
                              ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                              : 'border-[var(--hairline)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                          }`}
                        >
                          {arch.shortLabel[locale]}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    <span className="mr-1 font-mono-tech text-[9px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                      SKU
                    </span>
                    {TRYON_FRAME_SPECS.map((spec) => {
                      const active = frameSku === spec.sku;
                      return (
                        <button
                          key={spec.sku}
                          type="button"
                          data-testid={`tryon-sku-${spec.sku}`}
                          onClick={() => {
                            atelierAudio.playDetent();
                            setFrameSku(spec.sku);
                          }}
                          className={`border px-2 py-1 font-mono-tech text-[9.5px] uppercase tracking-[0.08em] transition-colors ${
                            active
                              ? 'border-[var(--accent)] bg-[var(--accent)]/12 text-[var(--ink)]'
                              : 'border-[var(--hairline)] bg-[var(--bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                          }`}
                        >
                          {spec.shortLabel[locale]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Row 2: Live UV Photochromic Scrubber + PD Fit Gauge + Polarized Riviera Glare Split */}
                <div className="grid grid-cols-1 gap-2.5 border-t border-[var(--hairline)] pt-2.5 sm:grid-cols-12 sm:items-center">
                  {/* Live UV Index Scrubber (0 -> 11 physically darkens lenses!) */}
                  <div className="sm:col-span-4">
                    <div className="mb-1 flex items-center justify-between font-mono-tech text-[9.5px]">
                      <span className="inline-flex items-center gap-1 uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                        <Sun size={11} strokeWidth={1.6} className="text-[var(--accent)]" />
                        UV {heroConfig.uvIndex}/11
                      </span>
                      <span
                        data-testid="tryon-uv-readout"
                        className="font-medium text-[var(--ink)]"
                      >
                        VLT {tryOnLensState.vltPercent}% · {tryOnLensState.filterCategory}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={11}
                      step={1}
                      data-testid="tryon-uv-slider"
                      aria-label="Live Photochromic UV Index 0 to 11"
                      value={heroConfig.uvIndex}
                      onChange={(e) => {
                        const nextUv = Number(e.target.value);
                        setHeroConfig((prev) => ({
                          ...prev,
                          lensMode: 'photochromic-uv',
                          uvIndex: nextUv,
                        }));
                      }}
                      className="vera-range"
                    />
                  </div>

                  {/* PD Fit Gauge (56-74 mm) */}
                  <div className="sm:col-span-4">
                    <div className="mb-1 flex items-center justify-between font-mono-tech text-[9.5px]">
                      <span className="uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                        {locale === 'en' ? 'PD Gauge' : 'Khoảng PD'}
                      </span>
                      <span
                        data-testid="tryon-pd-readout"
                        className="font-medium text-[var(--ink)]"
                      >
                        {fitEval.pdMm} mm · Δ{Math.abs(fitEval.pdDecentrationMm).toFixed(1)}mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min={56}
                      max={74}
                      step={1}
                      data-testid="tryon-pd-slider"
                      aria-label="Pupillary Distance Fit Gauge 56 to 74 mm"
                      value={bespokeSizing.pdMm}
                      onChange={(e) => {
                        const nextPd = Number(e.target.value);
                        setBespokeSizing((prev) => ({ ...prev, pdMm: nextPd }));
                      }}
                      className="vera-range"
                    />
                  </div>

                  {/* Polarized Glare Split Toggle + Malus Theta Quick Switch */}
                  <div className="flex flex-col gap-1 sm:col-span-4">
                    <button
                      type="button"
                      data-testid="tryon-glare-toggle"
                      onClick={() => {
                        atelierAudio.playShutter();
                        setGlareSplitEnabled((prev) => !prev);
                      }}
                      className={`inline-flex w-full items-center justify-between gap-1.5 border px-2.5 py-1.5 font-mono-tech text-[9.5px] uppercase tracking-[0.11em] transition-colors ${
                        glareSplitEnabled
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                          : 'border-[var(--hairline-strong)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--accent)]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 truncate">
                        <ShieldCheck size={12} strokeWidth={1.7} />
                        {locale === 'en' ? 'Polarized Glare Split' : 'Màn Lọc Phân Cực'}
                      </span>
                      <span className="shrink-0">
                        {glareSplitEnabled
                          ? `-${glareShield.glareReductionPercent}%`
                          : 'OFF'}
                      </span>
                    </button>
                    {glareSplitEnabled && (
                      <div className="flex items-center justify-between gap-1 font-mono-tech text-[8.5px]">
                        <span className="uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                          Malus θ:
                        </span>
                        <div className="flex gap-1">
                          {[90, 45, 0].map((deg) => (
                            <button
                              key={deg}
                              type="button"
                              data-testid={`tryon-malus-${deg}`}
                              onClick={() => {
                                atelierAudio.playDetent();
                                setGlareAngleDeg(deg);
                              }}
                              className={`border px-1.5 py-0.5 transition-colors ${
                                glareAngleDeg === deg
                                  ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                                  : 'border-[var(--hairline)] bg-[var(--bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                              }`}
                            >
                              {deg}°
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {stageMode === 'ar' && (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12 sm:items-center">
                <div className="sm:col-span-3">
                  <div className="mb-1 flex justify-between font-mono-tech text-[9px] uppercase text-[var(--ink-muted)]">
                    <span>Scale</span>
                    <span className="text-[var(--ink)]">{arNudge.scale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={1.25}
                    step={0.01}
                    data-testid="ar-nudge-scale"
                    value={arNudge.scale}
                    onChange={(e) =>
                      setArNudge((prev) => ({ ...prev, scale: Number(e.target.value) }))
                    }
                    className="vera-range"
                  />
                </div>
                <div className="sm:col-span-3">
                  <div className="mb-1 flex justify-between font-mono-tech text-[9px] uppercase text-[var(--ink-muted)]">
                    <span>Height</span>
                    <span className="text-[var(--ink)]">{arNudge.offsetY.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={-0.6}
                    max={0.6}
                    step={0.02}
                    data-testid="ar-nudge-height"
                    value={arNudge.offsetY}
                    onChange={(e) =>
                      setArNudge((prev) => ({ ...prev, offsetY: Number(e.target.value) }))
                    }
                    className="vera-range"
                  />
                </div>
                <div className="sm:col-span-3">
                  <div className="mb-1 flex justify-between font-mono-tech text-[9px] uppercase text-[var(--ink-muted)]">
                    <span>Tilt</span>
                    <span className="text-[var(--ink)]">{arNudge.tiltDeg}°</span>
                  </div>
                  <input
                    type="range"
                    min={-15}
                    max={15}
                    step={1}
                    data-testid="ar-nudge-tilt"
                    value={arNudge.tiltDeg}
                    onChange={(e) =>
                      setArNudge((prev) => ({ ...prev, tiltDeg: Number(e.target.value) }))
                    }
                    className="vera-range"
                  />
                </div>
                <div className="sm:col-span-3">
                  <button
                    type="button"
                    onClick={() => setGlareSplitEnabled((prev) => !prev)}
                    className={`w-full border px-2.5 py-1.5 font-mono-tech text-[9px] uppercase tracking-[0.12em] ${
                      glareSplitEnabled
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                        : 'border-[var(--hairline-strong)] bg-[var(--bg)] text-[var(--ink)]'
                    }`}
                  >
                    {glareSplitEnabled ? 'Polarized ON' : 'Polarized Split'}
                  </button>
                </div>
              </div>
            )}

            {(stageMode === 'cad' || stageMode === 'campaign') && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Camera Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 inline-flex items-center gap-1 font-mono-tech text-[9px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    <Camera size={11} strokeWidth={1.5} />
                    {copy.heroCameraPresetLabel}
                  </span>
                  {cameraPresets.map((preset) => {
                    const active =
                      stageMode === 'cad' && heroConfig.cameraPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        data-testid={`cam-preset-${preset.id}`}
                        onClick={() => {
                          atelierAudio.playShutter();
                          setStageMode('cad');
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
                      stageMode === 'cad' && heroConfig.lightingMood === mood.id;
                    return (
                      <button
                        key={mood.id}
                        type="button"
                        data-testid={`lighting-mood-${mood.id}`}
                        onClick={() => {
                          atelierAudio.playDetent();
                          setStageMode('cad');
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
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--hairline)] pt-2">
              <span className="font-mono-tech text-[9px] tracking-[0.14em] text-[var(--ink-muted)]">
                {stageMode === 'tryon'
                  ? copy.heroTryOnDragHint
                  : stageMode === 'ar'
                  ? copy.heroArHint
                  : stageMode === 'campaign'
                  ? copy.heroCampaignCaption
                  : copy.heroDragHint}
              </span>
              <button
                type="button"
                onClick={() => openQuickView('mv-eye-01')}
                className="font-mono-tech text-[9.5px] uppercase tracking-[0.16em] text-[var(--ink)] underline decoration-[var(--accent)] underline-offset-4 transition-colors hover:text-[var(--accent)]"
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
