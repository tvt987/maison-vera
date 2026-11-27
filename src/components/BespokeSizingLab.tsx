import React, { useState } from 'react';
import {
  BookmarkPlus,
  Check,
  Compass,
  Plus,
  Ruler,
  Sliders,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PRODUCT_BY_ID } from '../data/catalog';
import { t } from '../data/i18n';
import { atelierAudio } from '../engines/atelierAudio';
import {
  computeBespokeFit,
  ENGRAVING_TIERS,
  FACE_SHAPES,
  NOSE_BRIDGES,
  PRESCRIPTION_TIERS,
  sanitizeEngravingText,
  TEMPLE_LENGTHS,
} from '../engines/bespokeSizing';
import { formatMoney } from '../engines/currency';
import { computeOpticalLensTelemetry, getOpticalLensMode } from '../engines/opticalPhysics';
import type { FaceShape } from '../types/commerce';

const FaceShapeGlyph: React.FC<{ shape: FaceShape }> = ({ shape }) => {
  switch (shape) {
    case 'oval':
      return (
        <svg viewBox="0 0 24 28" className="h-5 w-4 shrink-0" aria-hidden="true">
          <ellipse cx="12" cy="14" rx="7.5" ry="10.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case 'square':
      return (
        <svg viewBox="0 0 24 28" className="h-5 w-4 shrink-0" aria-hidden="true">
          <rect x="4.5" y="4.5" width="15" height="19" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case 'round':
      return (
        <svg viewBox="0 0 24 28" className="h-5 w-4 shrink-0" aria-hidden="true">
          <circle cx="12" cy="14" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="0 0 24 28" className="h-5 w-4 shrink-0" aria-hidden="true">
          <path
            d="M4.5 9.5 C4.5 5.2, 8.2 4, 12 4 C15.8 4, 19.5 5.2, 19.5 9.5 C19.5 15.8, 15.2 21.5, 12 24 C8.8 21.5, 4.5 15.8, 4.5 9.5 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </svg>
      );
    case 'diamond':
      return (
        <svg viewBox="0 0 24 28" className="h-5 w-4 shrink-0" aria-hidden="true">
          <polygon
            points="12,3.5 20,13.5 12,24.5 4,13.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};

export const BespokeSizingLab: React.FC = () => {
  const {
    locale,
    currency,
    heroConfig,
    bespokeSizing,
    setBespokeSizing,
    addBespokeCommissionToBag,
    saveCurrentBespokeToLookbook,
  } = useStore();

  const copy = t(locale);
  const report = computeBespokeFit(bespokeSizing, heroConfig.lensMode);
  const optics = computeOpticalLensTelemetry(heroConfig.lensMode, heroConfig.uvIndex);
  const activeLensSpec = getOpticalLensMode(heroConfig.lensMode);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const activeProductId = selectedProductId ?? report.topRecommendation.productId;
  const activeProduct = PRODUCT_BY_ID[activeProductId] ?? PRODUCT_BY_ID['mv-eye-01'];

  const totalCommissionUsd = activeProduct.priceUsd + report.pricing.totalAddonUsd;
  const activeFaceMeta =
    FACE_SHAPES.find((f) => f.id === bespokeSizing.faceShape) ?? FACE_SHAPES[0];

  // Dynamic SVG geometric proportions derived directly from millimeter measurements
  const bp = report.blueprint;
  const lensSpanPx = 92 + (bp.lensWidthMm - 50) * 3.4;
  const bridgeSpanPx = 28 + (bp.bridgeWidthMm - 20) * 3.5;
  const frontCenterX = 205;
  const leftLensRight = frontCenterX - bridgeSpanPx / 2;
  const leftLensLeft = leftLensRight - lensSpanPx;
  const rightLensLeft = frontCenterX + bridgeSpanPx / 2;
  const rightLensRight = rightLensLeft + lensSpanPx;
  const frameOuterLeft = leftLensLeft - 14;
  const frameOuterRight = rightLensRight + 14;

  const pdHalfPx = (bp.pdMm - 46) * 2.2 + 24;
  const leftPupilX = Math.max(leftLensLeft + 24, frontCenterX - pdHalfPx);
  const rightPupilX = Math.min(rightLensRight - 24, frontCenterX + pdHalfPx);

  const padDropPx = bp.nosePadDropMm * 2.6;
  const templeLengthPx = 132 + (bp.templeLengthMm - 138) * 3.6;

  const makeOctagonPath = (x1: number, x2: number, yTop: number, yBot: number) => {
    const ch = 15;
    return `M ${x1 + ch},${yTop} L ${x2 - ch},${yTop} L ${x2},${yTop + ch} L ${x2 - 4},${yBot - ch} L ${x2 - ch - 4},${yBot} L ${x1 + ch + 4},${yBot} L ${x1 + 4},${yBot - ch} L ${x1},${yTop + ch} Z`;
  };

  return (
    <section
      id="bespoke-lab"
      data-testid="bespoke-sizing-lab"
      className="reveal-section border-b border-[var(--hairline)] bg-[var(--surface)] py-14 sm:py-20"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        {/* Section Header */}
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-[var(--hairline)] pb-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
              <Ruler size={12} strokeWidth={1.6} />
              {copy.bespokeKicker}
            </p>
            <h2 className="mt-2 font-serif-editorial text-3xl font-normal leading-tight text-[var(--ink)] sm:text-5xl">
              {copy.bespokeHeading}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
              {copy.bespokeSub}
            </p>
          </div>

          {/* Live Fit Score Pill */}
          <div className="flex items-center gap-4 border border-[var(--hairline-strong)] bg-[var(--bg)] px-5 py-3.5">
            <div>
              <span className="block font-mono-tech text-[9.5px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                {copy.bespokeFitScoreLabel}
              </span>
              <span className="mt-0.5 block text-xs font-medium text-[var(--olive)]">
                {report.fitGrade[locale]}
              </span>
            </div>
            <div className="border-l border-[var(--hairline)] pl-4 text-right">
              <span
                data-testid="bespoke-fit-score"
                className="font-serif-editorial text-4xl leading-none text-[var(--ink)]"
              >
                {report.overallFitScore}
                <span className="text-lg text-[var(--accent)]">%</span>
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN: 6-Parameter Millimeter Bespoke Controls */}
          <div className="space-y-5 lg:col-span-5">
            {/* 01. Face Shape */}
            <div className="border border-[var(--hairline)] bg-[var(--bg)] p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  {copy.bespokeFaceShapeLabel}
                </span>
                <span className="font-mono-tech text-[11px] text-[var(--accent)]">
                  {activeFaceMeta.label[locale]}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {FACE_SHAPES.map((shape) => {
                  const active = bespokeSizing.faceShape === shape.id;
                  return (
                    <button
                      key={shape.id}
                      type="button"
                      data-testid={`face-shape-${shape.id}`}
                      onClick={() => {
                        atelierAudio.playDetent();
                        setSelectedProductId(null);
                        setBespokeSizing((prev) => ({ ...prev, faceShape: shape.id }));
                      }}
                      className={`flex flex-col items-center gap-1 border px-1.5 py-2 text-center transition-colors ${
                        active
                          ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                          : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-muted)] hover:border-[var(--hairline-strong)] hover:text-[var(--ink)]'
                      }`}
                    >
                      <FaceShapeGlyph shape={shape.id} />
                      <span className="font-mono-tech text-[9.5px] uppercase tracking-[0.06em]">
                        {shape.label[locale]}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2.5 text-[11.5px] leading-relaxed text-[var(--ink-muted)]">
                {activeFaceMeta.geometryNote[locale]}
              </p>
            </div>

            {/* 02. Pupillary Distance (PD 56-72mm) */}
            <div className="border border-[var(--hairline)] bg-[var(--bg)] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  {copy.bespokePdLabel}
                </span>
                <span
                  data-testid="bespoke-pd-value"
                  className="font-mono-tech text-xs font-medium text-[var(--ink)]"
                >
                  {bp.pdMm} mm · Δ {bp.decentrationMm} mm
                </span>
              </div>
              <input
                type="range"
                min={56}
                max={72}
                step={1}
                data-testid="bespoke-pd-slider"
                aria-label={copy.bespokePdLabel}
                value={bespokeSizing.pdMm}
                onChange={(e) =>
                  setBespokeSizing((prev) => ({ ...prev, pdMm: Number(e.target.value) }))
                }
                className="vera-range"
              />
              <div className="mt-1.5 flex justify-between font-mono-tech text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                <span>56mm (Narrow)</span>
                <span>64mm (Standard)</span>
                <span>72mm (Wide)</span>
              </div>
            </div>

            {/* 03. Nose Bridge Profile & 04. Temple Length */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="border border-[var(--hairline)] bg-[var(--bg)] p-4">
                <span className="mb-2 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {copy.bespokeBridgeLabel}
                </span>
                <div className="space-y-1.5">
                  {NOSE_BRIDGES.map((bridge) => {
                    const active = bespokeSizing.noseBridge === bridge.id;
                    return (
                      <button
                        key={bridge.id}
                        type="button"
                        data-testid={`bridge-${bridge.id}`}
                        onClick={() => {
                          atelierAudio.playDetent();
                          setBespokeSizing((prev) => ({
                            ...prev,
                            noseBridge: bridge.id,
                          }));
                        }}
                        className={`flex w-full items-center justify-between border px-3 py-1.5 text-left text-[11px] transition-colors ${
                          active
                            ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                            : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--hairline-strong)]'
                        }`}
                      >
                        <span>{bridge.label[locale]}</span>
                        <span className="font-mono-tech text-[10px] opacity-80">
                          {bridge.bridgeWidthMm}mm
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border border-[var(--hairline)] bg-[var(--bg)] p-4">
                <span className="mb-2 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {copy.bespokeTempleLabel}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {TEMPLE_LENGTHS.map((len) => {
                    const active = bespokeSizing.templeLengthMm === len;
                    return (
                      <button
                        key={len}
                        type="button"
                        data-testid={`temple-${len}`}
                        onClick={() => {
                          atelierAudio.playDetent();
                          setBespokeSizing((prev) => ({
                            ...prev,
                            templeLengthMm: len,
                          }));
                        }}
                        className={`border px-2.5 py-2 font-mono-tech text-xs transition-colors ${
                          active
                            ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                            : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--hairline-strong)]'
                        }`}
                      >
                        {len} mm
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2.5 font-mono-tech text-[9.5px] leading-relaxed text-[var(--ink-muted)]">
                  {bp.bridgeSpec[locale]}
                </p>
              </div>
            </div>

            {/* 05. Custom Prescription & 06. Temple Engraving Pricing */}
            <div className="border border-[var(--hairline)] bg-[var(--bg)] p-4 space-y-4">
              <div>
                <span className="mb-2 inline-flex items-center gap-1.5 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  <Sliders size={11} strokeWidth={1.5} />
                  {copy.bespokeRxLabel}
                </span>
                <div className="space-y-1.5">
                  {PRESCRIPTION_TIERS.map((tier) => {
                    const active = bespokeSizing.prescriptionTier === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        data-testid={`rx-tier-${tier.id}`}
                        onClick={() => {
                          atelierAudio.playDetent();
                          setBespokeSizing((prev) => ({
                            ...prev,
                            prescriptionTier: tier.id,
                          }));
                        }}
                        className={`flex w-full items-start justify-between gap-2 border px-3 py-2 text-left transition-colors ${
                          active
                            ? 'border-[var(--accent)] bg-[var(--surface)] ring-1 ring-[var(--accent)]'
                            : 'border-[var(--hairline)] bg-[var(--surface)] hover:border-[var(--hairline-strong)]'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="block text-[11.5px] font-medium text-[var(--ink)]">
                            {tier.label[locale]}
                          </span>
                          <span className="block text-[10.5px] text-[var(--ink-muted)]">
                            {tier.detail[locale]}
                          </span>
                        </div>
                        <span className="shrink-0 font-mono-tech text-[11px] text-[var(--accent)]">
                          {tier.priceUsd === 0
                            ? locale === 'en'
                              ? 'Included'
                              : 'Bao gồm'
                            : `+${formatMoney(tier.priceUsd, currency)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-[var(--hairline)] pt-3.5">
                <span className="mb-2 block font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  {copy.bespokeEngravingLabel}
                </span>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                  {ENGRAVING_TIERS.map((tier) => {
                    const active = bespokeSizing.engravingTier === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        data-testid={`engraving-tier-${tier.id}`}
                        onClick={() => {
                          atelierAudio.playDetent();
                          setBespokeSizing((prev) => ({
                            ...prev,
                            engravingTier: tier.id,
                          }));
                        }}
                        className={`flex flex-col justify-between border px-2.5 py-2 text-left transition-colors ${
                          active
                            ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                            : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--hairline-strong)]'
                        }`}
                      >
                        <span className="text-[10.5px] font-medium leading-snug">
                          {tier.label[locale]}
                        </span>
                        <span className="mt-1 font-mono-tech text-[10px] opacity-80">
                          {tier.priceUsd === 0
                            ? '+$0'
                            : `+${formatMoney(tier.priceUsd, currency)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {bespokeSizing.engravingTier !== 'none' && (
                  <input
                    type="text"
                    maxLength={12}
                    data-testid="bespoke-engraving-input"
                    value={bespokeSizing.engravingText}
                    onChange={(e) =>
                      setBespokeSizing((prev) => ({
                        ...prev,
                        engravingText: sanitizeEngravingText(e.target.value),
                      }))
                    }
                    placeholder={copy.bespokeEngravingPlaceholder}
                    className="mt-2.5 h-9 w-full border border-[var(--hairline-strong)] bg-[var(--surface)] px-3 font-mono-tech text-xs uppercase tracking-[0.2em] text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Dynamic SVG Technical Blueprint + Ranked Silhouettes + Commission Bar */}
          <div className="flex flex-col justify-between gap-6 lg:col-span-7">
            {/* Dynamic SVG Millimeter Technical CAD Blueprint */}
            <div className="archival-grid border border-[var(--hairline-strong)] bg-[var(--bg)] p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--hairline)] pb-3">
                <div className="flex items-center gap-2">
                  <Compass size={13} strokeWidth={1.6} className="text-[var(--accent)]" />
                  <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink)]">
                    {copy.bespokeBlueprintTitle}
                  </span>
                </div>
                <span
                  data-testid="blueprint-code-stamp"
                  className="border border-[var(--ink)] bg-[var(--ink)] px-2.5 py-0.5 font-mono-tech text-[10px] tracking-[0.16em] text-[var(--surface)]"
                >
                  {bp.blueprintCode}
                </span>
              </div>

              <svg
                viewBox="0 0 640 270"
                data-testid="bespoke-blueprint-svg"
                className="h-auto w-full text-[var(--ink)]"
                role="img"
                aria-label={`Technical eyewear CAD blueprint ${bp.blueprintCode}, PD ${bp.pdMm}mm`}
              >
                {/* Engineering coordinate grid crosshairs */}
                <line x1="20" y1="138" x2="390" y2="138" stroke="currentColor" strokeOpacity="0.14" strokeDasharray="4 4" />
                <line x1={frontCenterX} y1="24" x2={frontCenterX} y2="236" stroke="currentColor" strokeOpacity="0.16" strokeDasharray="3 3" />
                <line x1="418" y1="24" x2="418" y2="246" stroke="currentColor" strokeOpacity="0.2" />

                {/* Top Dimension: Total Frame Width */}
                <line x1={frameOuterLeft} y1="36" x2={frameOuterRight} y2="36" stroke="var(--accent)" strokeWidth="1" />
                <line x1={frameOuterLeft} y1="30" x2={frameOuterLeft} y2="44" stroke="var(--accent)" strokeWidth="1" />
                <line x1={frameOuterRight} y1="30" x2={frameOuterRight} y2="44" stroke="var(--accent)" strokeWidth="1" />
                <rect x={frontCenterX - 54} y="24" width="108" height="18" fill="var(--bg)" />
                <text
                  x={frontCenterX}
                  y="37"
                  textAnchor="middle"
                  className="font-mono-tech"
                  fontSize="10.5"
                  fill="var(--accent)"
                >
                  TOTAL {bp.frameWidthMm} mm
                </text>

                {/* Front Elevation: Upper Architectural Brow Bar & Bridge */}
                <line
                  x1={leftLensLeft + 10}
                  y1="92"
                  x2={rightLensRight - 10}
                  y2="92"
                  stroke="currentColor"
                  strokeWidth="3.2"
                />
                <rect
                  x={leftLensRight - 2}
                  y="116"
                  width={bridgeSpanPx + 4}
                  height="6"
                  fill="currentColor"
                />

                {/* Left & Right Octagonal Titanium Rims + Live Optical Lens Tint */}
                <path
                  d={makeOctagonPath(leftLensLeft, leftLensRight, 94, 182)}
                  fill={optics.hexColor}
                  fillOpacity={Math.max(0.18, optics.opacity * 0.52)}
                  stroke="currentColor"
                  strokeWidth="3.2"
                />
                <path
                  d={makeOctagonPath(rightLensLeft, rightLensRight, 94, 182)}
                  fill={optics.hexColor}
                  fillOpacity={Math.max(0.18, optics.opacity * 0.52)}
                  stroke="currentColor"
                  strokeWidth="3.2"
                />

                {/* Milled Endpiece Lugs */}
                <rect x={frameOuterLeft} y="108" width="14" height="9" fill="currentColor" />
                <rect x={rightLensRight} y="108" width="14" height="9" fill="currentColor" />

                {/* Dynamic Nose Pads reflecting Low / Medium / High Bridge Drop */}
                <line
                  x1={leftLensRight - 2}
                  y1="122"
                  x2={leftLensRight + 6}
                  y2={122 + padDropPx}
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                />
                <ellipse
                  cx={leftLensRight + 7}
                  cy={124 + padDropPx}
                  rx="3.5"
                  ry="6.5"
                  fill="var(--accent)"
                  fillOpacity="0.45"
                  stroke="var(--accent)"
                  strokeWidth="1"
                />
                <line
                  x1={rightLensLeft + 2}
                  y1="122"
                  x2={rightLensLeft - 6}
                  y2={122 + padDropPx}
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                />
                <ellipse
                  cx={rightLensLeft - 7}
                  cy={124 + padDropPx}
                  rx="3.5"
                  ry="6.5"
                  fill="var(--accent)"
                  fillOpacity="0.45"
                  stroke="var(--accent)"
                  strokeWidth="1"
                />

                {/* Optical Center PD Crosshairs */}
                <circle cx={leftPupilX} cy="138" r="5" fill="none" stroke="var(--accent)" strokeWidth="1.2" />
                <line x1={leftPupilX - 9} y1="138" x2={leftPupilX + 9} y2="138" stroke="var(--accent)" strokeWidth="1" />
                <line x1={leftPupilX} y1="129" x2={leftPupilX} y2="147" stroke="var(--accent)" strokeWidth="1" />

                <circle cx={rightPupilX} cy="138" r="5" fill="none" stroke="var(--accent)" strokeWidth="1.2" />
                <line x1={rightPupilX - 9} y1="138" x2={rightPupilX + 9} y2="138" stroke="var(--accent)" strokeWidth="1" />
                <line x1={rightPupilX} y1="129" x2={rightPupilX} y2="147" stroke="var(--accent)" strokeWidth="1" />

                {/* PD Dimension Span */}
                <line x1={leftPupilX} y1="68" x2={rightPupilX} y2="68" stroke="currentColor" strokeOpacity="0.65" strokeWidth="1" strokeDasharray="3 2" />
                <line x1={leftPupilX} y1="62" x2={leftPupilX} y2="128" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.9" />
                <line x1={rightPupilX} y1="62" x2={rightPupilX} y2="128" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.9" />
                <rect x={frontCenterX - 36} y="58" width="72" height="16" fill="var(--bg)" />
                <text
                  x={frontCenterX}
                  y="70"
                  textAnchor="middle"
                  className="font-mono-tech"
                  fontSize="10"
                  fill="currentColor"
                >
                  PD {bp.pdMm} mm
                </text>

                {/* Bottom Dimensions: Lens Width A & Bridge DBL */}
                <line x1={leftLensLeft} y1="204" x2={leftLensRight} y2="204" stroke="currentColor" strokeWidth="1" />
                <line x1={leftLensLeft} y1="198" x2={leftLensLeft} y2="210" stroke="currentColor" strokeWidth="1" />
                <line x1={leftLensRight} y1="198" x2={leftLensRight} y2="210" stroke="currentColor" strokeWidth="1" />
                <text
                  x={(leftLensLeft + leftLensRight) / 2}
                  y="221"
                  textAnchor="middle"
                  className="font-mono-tech"
                  fontSize="10"
                  fill="currentColor"
                >
                  A: {bp.lensWidthMm} mm
                </text>

                <line x1={leftLensRight} y1="204" x2={rightLensLeft} y2="204" stroke="var(--accent)" strokeWidth="1.2" />
                <text
                  x={frontCenterX}
                  y="221"
                  textAnchor="middle"
                  className="font-mono-tech"
                  fontSize="10"
                  fill="var(--accent)"
                >
                  DBL {bp.bridgeWidthMm}
                </text>

                <text
                  x={(rightLensLeft + rightLensRight) / 2}
                  y="221"
                  textAnchor="middle"
                  className="font-mono-tech"
                  fontSize="10"
                  fill="currentColor"
                  opacity="0.72"
                >
                  PAD {bp.nosePadDropMm} mm
                </text>

                {/* RIGHT SIDE: Side Elevation Temple Architecture */}
                <text
                  x="442"
                  y="37"
                  className="font-mono-tech"
                  fontSize="9.5"
                  fill="currentColor"
                  opacity="0.65"
                >
                  SIDE PROFILE · TILT {bp.pantoscopicTiltDeg}°
                </text>

                {/* Front Rim Cross-Section */}
                <line x1="448" y1="88" x2="438" y2="176" stroke="currentColor" strokeWidth="3.5" />
                {/* 5-Barrel Hinge Node */}
                <rect x="446" y="108" width="12" height="10" fill="var(--accent)" />
                {/* Sculpted Titanium Temple Shaft & Ear-Tip Curve */}
                <path
                  d={`M 458,113 L ${458 + templeLengthPx * 0.72},113 Q ${458 + templeLengthPx * 0.88},114 ${458 + templeLengthPx * 0.94},134 L ${458 + templeLengthPx},168`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.6"
                  strokeLinecap="round"
                />

                {/* Temple Engraving Stamp Preview */}
                {bespokeSizing.engravingTier !== 'none' && (
                  <text
                    x={468 + templeLengthPx * 0.3}
                    y="104"
                    textAnchor="middle"
                    className="font-mono-tech"
                    fontSize="8.5"
                    letterSpacing="2"
                    fill="var(--accent)"
                  >
                    {report.sanitizedEngraving || 'SABAE 01'}
                  </text>
                )}

                {/* Temple Length Millimeter Callout */}
                <line
                  x1="448"
                  y1="204"
                  x2={Math.min(624, 458 + templeLengthPx)}
                  y2="204"
                  stroke="var(--accent)"
                  strokeWidth="1"
                />
                <line x1="448" y1="198" x2="448" y2="210" stroke="var(--accent)" strokeWidth="1" />
                <line
                  x1={Math.min(624, 458 + templeLengthPx)}
                  y1="198"
                  x2={Math.min(624, 458 + templeLengthPx)}
                  y2="210"
                  stroke="var(--accent)"
                  strokeWidth="1"
                />
                <text
                  x={(448 + Math.min(624, 458 + templeLengthPx)) / 2}
                  y="221"
                  textAnchor="middle"
                  className="font-mono-tech"
                  fontSize="10"
                  fill="var(--accent)"
                >
                  TEMPLE {bp.templeLengthMm} mm
                </text>

                {/* Bottom Technical Footer Metadata */}
                <text
                  x="20"
                  y="256"
                  className="font-mono-tech"
                  fontSize="9"
                  fill="currentColor"
                  opacity="0.6"
                >
                  OPTICS: {activeLensSpec.label.en.toUpperCase()} · VLT {optics.vltPercent}% · GLARE -{optics.glareReductionPercent}% · UV{optics.uvCutNm}
                </text>
              </svg>
            </div>

            {/* Ranked Maison Véra Silhouettes Recommender */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                  {copy.bespokeRecommendationsHeading}
                </span>
                <span className="font-mono-tech text-[10px] text-[var(--ink-muted)]">
                  {locale === 'en' ? 'Click silhouette to commission' : 'Chọn phom kính để đặt chế tác'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {report.recommendations.map((rec, idx) => {
                  const prod = PRODUCT_BY_ID[rec.productId];
                  if (!prod) return null;
                  const isSelected = activeProductId === rec.productId;
                  return (
                    <button
                      key={rec.productId}
                      type="button"
                      data-testid={`bespoke-rec-${rec.productId}`}
                      onClick={() => {
                        atelierAudio.playDetent();
                        setSelectedProductId(rec.productId);
                      }}
                      className={`flex flex-col justify-between border p-3.5 text-left transition-all ${
                        isSelected
                          ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                          : 'border-[var(--hairline)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--hairline-strong)]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`font-mono-tech text-[9.5px] uppercase tracking-[0.14em] ${
                              isSelected ? 'text-[#D4B483]' : 'text-[var(--accent)]'
                            }`}
                          >
                            {idx === 0
                              ? locale === 'en'
                                ? '#1 IDEAL MATCH'
                                : '#1 PHÙ HỢP NHẤT'
                              : `0${idx + 1} · ${prod.sku}`}
                          </span>
                          <span className="font-mono-tech text-xs font-medium">
                            {rec.fitScore}%
                          </span>
                        </div>
                        <h3 className="mt-1.5 font-serif-editorial text-lg leading-snug">
                          {prod.name[locale]}
                        </h3>
                        <p
                          className={`mt-1.5 text-[11px] leading-relaxed ${
                            isSelected ? 'text-[var(--surface)]/80' : 'text-[var(--ink-muted)]'
                          }`}
                        >
                          {rec.rationale[locale]}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-current/15 pt-2 font-mono-tech text-[10px]">
                        <span>{rec.recommendedBlueprint}</span>
                        <span className="inline-flex items-center gap-1">
                          {isSelected && <Check size={11} strokeWidth={2} />}
                          {formatMoney(prod.priceUsd, currency)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bespoke Pricing Breakdown & Commission Actions */}
            <div className="border border-[var(--hairline-strong)] bg-[var(--bg)] p-5">
              <div className="grid grid-cols-2 gap-3 border-b border-[var(--hairline)] pb-4 font-mono-tech text-[10.5px] sm:grid-cols-4">
                <div>
                  <span className="block text-[9px] uppercase text-[var(--ink-muted)]">
                    {locale === 'en' ? 'Base Frame' : 'Gọng Kính'}
                  </span>
                  <span className="text-[var(--ink)]">
                    {formatMoney(activeProduct.priceUsd, currency)}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase text-[var(--ink-muted)]">
                    {locale === 'en' ? 'Optical Physics' : 'Quang Học'}
                  </span>
                  <span className="text-[var(--ink)]">
                    +{formatMoney(report.pricing.opticalLensUsd, currency)}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase text-[var(--ink-muted)]">
                    {locale === 'en' ? 'Prescription' : 'Tròng Độ'}
                  </span>
                  <span className="text-[var(--ink)]">
                    +{formatMoney(report.pricing.prescriptionUsd, currency)}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase text-[var(--ink-muted)]">
                    {locale === 'en' ? 'Engraving' : 'Khắc Càng'}
                  </span>
                  <span className="text-[var(--ink)]">
                    +{formatMoney(report.pricing.engravingUsd, currency)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  data-testid="bespoke-commission-add-btn"
                  onClick={() => addBespokeCommissionToBag(activeProduct.id)}
                  className="inline-flex flex-1 items-center justify-between gap-3 border border-[var(--ink)] bg-[var(--ink)] px-5 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--surface)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Plus size={14} strokeWidth={1.75} />
                    {copy.bespokeAddCommission}
                  </span>
                  <span data-testid="bespoke-total-price" className="font-mono-tech text-xs">
                    {formatMoney(totalCommissionUsd, currency)}
                  </span>
                </button>

                <button
                  type="button"
                  data-testid="bespoke-save-lookbook-btn"
                  onClick={() =>
                    saveCurrentBespokeToLookbook({
                      productId: activeProduct.id,
                      openDrawer: true,
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 border border-[var(--accent)] bg-[var(--surface)] px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
                >
                  <BookmarkPlus size={14} strokeWidth={1.6} />
                  {copy.bespokeSaveDossier}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
