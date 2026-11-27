import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Check,
  Eye,
  Layers,
  Plus,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PRODUCT_BY_ID } from '../data/catalog';
import { t } from '../data/i18n';
import { atelierAudio } from '../engines/atelierAudio';
import { formatMoney } from '../engines/currency';
import {
  BLUE_LIGHT_STUDIO_SURCHARGE_USD,
  computeOpticalRxReport,
  formatDiopter,
  OPTICAL_RX_PRESETS,
  RX_BOUNDS,
  TITANIUM_RIM_DEPTH_MM,
  type IndexComparisonRow,
} from '../engines/prescriptionOpticalEngine';
import type {
  EyePrescriptionInput,
  OpticalRxInput,
  RefractiveIndexId,
} from '../types/commerce';

const FRAME_DIAMETER_OPTIONS = [
  { mm: 48, label: '48 mm · Archival 04' },
  { mm: 51, label: '51 mm · VÉRA-01 Monolith' },
  { mm: 54, label: '54 mm · Solaire Shield' },
] as const;

function buildLensCrossSectionPath(
  centerX: number,
  topY: number,
  height: number,
  centerThickMm: number,
  edgeThickMm: number,
  pxPerMm: number
): string {
  const halfH = height / 2;
  const midY = topY + halfH;
  const botY = topY + height;

  // Front gentle meniscus curve (slight forward convex curve for realistic optical aesthetics)
  const frontCurve = 8;
  const frontTopX = centerX - (edgeThickMm * pxPerMm) / 2;
  const frontMidX = centerX - (centerThickMm * pxPerMm) / 2 - frontCurve;
  const frontBotX = frontTopX;

  // Back surface carries the optical sagitta concavity/convexity
  const backTopX = centerX + (edgeThickMm * pxPerMm) / 2;
  const backMidX = centerX + (centerThickMm * pxPerMm) / 2 - frontCurve;
  const backBotX = backTopX;

  return [
    `M ${frontTopX.toFixed(1)},${topY.toFixed(1)}`,
    `Q ${frontMidX.toFixed(1)},${midY.toFixed(1)} ${frontBotX.toFixed(1)},${botY.toFixed(1)}`,
    `L ${backBotX.toFixed(1)},${botY.toFixed(1)}`,
    `Q ${backMidX.toFixed(1)},${midY.toFixed(1)} ${backTopX.toFixed(1)},${topY.toFixed(1)}`,
    'Z',
  ].join(' ');
}

export const OpticalRxLab: React.FC = () => {
  const { locale, currency, addOpticalRxCommissionToBag } = useStore();
  const copy = t(locale);

  const [rxInput, setRxInput] = useState<OpticalRxInput>(OPTICAL_RX_PRESETS[0].input);
  const [selectedIndexOverride, setSelectedIndexOverride] = useState<RefractiveIndexId | null>(
    null
  );

  const report = useMemo(() => computeOpticalRxReport(rxInput), [rxInput]);
  const activeIndexId = selectedIndexOverride ?? report.recommendedIndex.id;
  const activeRow: IndexComparisonRow =
    report.comparisons.find((c) => c.spec.id === activeIndexId) ?? report.comparisons[0];
  const row150 = report.comparisons[0];
  const row174 = report.comparisons[3];

  const baseFrame = PRODUCT_BY_ID['mv-eye-01'];
  const upgradeAddonUsd =
    activeRow.spec.surchargeUsd +
    (rxInput.blueLightFilterEnabled ? BLUE_LIGHT_STUDIO_SURCHARGE_USD : 0);
  const totalCommissionUsd = baseFrame.priceUsd + upgradeAddonUsd;

  const updateEye = (
    eyeKey: 'od' | 'os',
    patch: Partial<EyePrescriptionInput>
  ) => {
    setSelectedIndexOverride(null);
    setRxInput((prev) => {
      const nextEye = { ...prev[eyeKey], ...patch };
      if (patch.cylinderD !== undefined) {
        if (Math.abs(patch.cylinderD) < 1e-6) {
          nextEye.axisDeg = 0;
        } else if (nextEye.axisDeg === null || nextEye.axisDeg === 0) {
          nextEye.axisDeg = 90;
        }
      }
      return { ...prev, [eyeKey]: nextEye };
    });
  };

  // Cross-section SVG geometry (strictly proportional mm -> px scale shared by 1.50 & 1.74)
  const maxThickRef = Math.max(row150.peakThicknessMm, row174.peakThicknessMm, 7.5);
  const pxPerMm = Math.min(13.5, 96 / maxThickRef);
  const rimWidthPx = TITANIUM_RIM_DEPTH_MM * pxPerMm;

  const path150 = buildLensCrossSectionPath(
    145,
    46,
    148,
    row150.peakCenterThicknessMm,
    row150.peakEdgeThicknessMm,
    pxPerMm
  );
  const path174 = buildLensCrossSectionPath(
    455,
    46,
    148,
    row174.peakCenterThicknessMm,
    row174.peakEdgeThicknessMm,
    pxPerMm
  );

  // Spectral SVG coordinates (380nm -> 780nm mapped to X: 46 -> 586, Y: 185 -> 25)
  const specX = (wl: number) => 46 + ((wl - 380) / 400) * 540;
  const specY = (pct: number) => 185 - (Math.max(0, Math.min(100, pct)) / 100) * 160;

  const baselinePolyline = report.spectral.samples
    .map((pt) => `${specX(pt.wavelengthNm).toFixed(1)},${specY(pt.baselineArTransmittancePct).toFixed(1)}`)
    .join(' ');
  const activePolyline = report.spectral.samples
    .map((pt) => `${specX(pt.wavelengthNm).toFixed(1)},${specY(pt.activeTransmittancePct).toFixed(1)}`)
    .join(' ');
  const activeAreaPath = [
    `M ${specX(380).toFixed(1)},185`,
    ...report.spectral.samples.map(
      (pt) => `L ${specX(pt.wavelengthNm).toFixed(1)},${specY(pt.activeTransmittancePct).toFixed(1)}`
    ),
    `L ${specX(780).toFixed(1)},185 Z`,
  ].join(' ');

  const renderEyeCard = (eyeKey: 'od' | 'os', title: string) => {
    const eye = rxInput[eyeKey];
    const hasCyl = Math.abs(eye.cylinderD) > 1e-6;
    const eye174 = row174[eyeKey];

    return (
      <div className="border border-[var(--hairline)] bg-[var(--bg)] p-4">
        <div className="mb-3 flex items-center justify-between border-b border-[var(--hairline)] pb-2">
          <span className="font-mono-tech text-[10.5px] font-medium uppercase tracking-[0.18em] text-[var(--ink)]">
            {title}
          </span>
          <span className="font-mono-tech text-[10px] text-[var(--accent)]">
            SE {formatDiopter(eye174.sphericalEquivalentD)}
          </span>
        </div>

        {/* Sphere (SPH -10.00 to +6.00 D) */}
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <label
              htmlFor={`rx-${eyeKey}-sph-input`}
              className="font-mono-tech text-[9.5px] uppercase tracking-[0.16em] text-[var(--ink-muted)]"
            >
              {copy.rxSphereLabel}
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id={`rx-${eyeKey}-sph-input`}
                type="number"
                step={0.25}
                min={RX_BOUNDS.sphereMin}
                max={RX_BOUNDS.sphereMax}
                data-testid={`rx-${eyeKey}-sph`}
                value={eye.sphereD}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) updateEye(eyeKey, { sphereD: v });
                }}
                className="h-7 w-20 border border-[var(--hairline-strong)] bg-[var(--surface)] px-2 text-right font-mono-tech text-[11px] text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
              />
              <span className="font-mono-tech text-[10px] text-[var(--ink-muted)]">D</span>
            </div>
          </div>
          <input
            type="range"
            min={RX_BOUNDS.sphereMin}
            max={RX_BOUNDS.sphereMax}
            step={0.25}
            aria-label={`${title} ${copy.rxSphereLabel}`}
            value={Math.max(RX_BOUNDS.sphereMin, Math.min(RX_BOUNDS.sphereMax, eye.sphereD))}
            onChange={(e) => updateEye(eyeKey, { sphereD: Number(e.target.value) })}
            className="vera-range"
          />
          <div className="mt-1 flex justify-between font-mono-tech text-[8.5px] text-[var(--ink-muted)]">
            <span>-10.00 D</span>
            <span>0.00 D</span>
            <span>+6.00 D</span>
          </div>
        </div>

        {/* Cylinder (CYL -4.00 to 0.00 D) + Axis (0-180 deg) */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label
                htmlFor={`rx-${eyeKey}-cyl-input`}
                className="font-mono-tech text-[9.5px] uppercase tracking-[0.14em] text-[var(--ink-muted)]"
              >
                {copy.rxCylinderLabel}
              </label>
              <span className="font-mono-tech text-[10.5px] text-[var(--ink)]">
                {eye.cylinderD.toFixed(2)} D
              </span>
            </div>
            <input
              id={`rx-${eyeKey}-cyl-input`}
              type="range"
              min={RX_BOUNDS.cylinderMin}
              max={RX_BOUNDS.cylinderMax}
              step={0.25}
              data-testid={`rx-${eyeKey}-cyl`}
              aria-label={`${title} ${copy.rxCylinderLabel}`}
              value={Math.max(RX_BOUNDS.cylinderMin, Math.min(RX_BOUNDS.cylinderMax, eye.cylinderD))}
              onChange={(e) => updateEye(eyeKey, { cylinderD: Number(e.target.value) })}
              className="vera-range"
            />
            <div className="mt-1 flex justify-between font-mono-tech text-[8.5px] text-[var(--ink-muted)]">
              <span>-4.00 D</span>
              <span>0.00 D</span>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label
                htmlFor={`rx-${eyeKey}-axis-input`}
                className="font-mono-tech text-[9.5px] uppercase tracking-[0.14em] text-[var(--ink-muted)]"
              >
                {copy.rxAxisLabel}
              </label>
              <span className="font-mono-tech text-[10px] text-[var(--ink-muted)]">
                {hasCyl ? '1°–180°' : 'N/A'}
              </span>
            </div>
            <input
              id={`rx-${eyeKey}-axis-input`}
              type="number"
              min={0}
              max={180}
              step={1}
              disabled={!hasCyl}
              data-testid={`rx-${eyeKey}-axis`}
              value={eye.axisDeg ?? 0}
              onChange={(e) => {
                const raw = e.target.value;
                updateEye(eyeKey, { axisDeg: raw === '' ? null : Number(raw) });
              }}
              className="h-7 w-full border border-[var(--hairline-strong)] bg-[var(--surface)] px-2 font-mono-tech text-[11px] text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none disabled:opacity-45"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <section
      id="optical-rx-lab"
      data-testid="optical-rx-lab"
      className="reveal-section border-b border-[var(--hairline)] bg-[var(--bg)] py-14 sm:py-20"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        {/* Section Header */}
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-[var(--hairline)] pb-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
              <Eye size={12} strokeWidth={1.6} />
              {copy.rxLabKicker}
            </p>
            <h2 className="mt-2 font-serif-editorial text-3xl font-normal leading-tight text-[var(--ink)] sm:text-5xl">
              {copy.rxLabHeading}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
              {copy.rxLabSub}
            </p>
          </div>

          {/* Live Recommended Index Pill */}
          <div className="flex items-center gap-4 border border-[var(--hairline-strong)] bg-[var(--surface)] px-5 py-3.5">
            <div>
              <span className="block font-mono-tech text-[9.5px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                {locale === 'en' ? 'RECOMMENDED INDEX' : 'CHIẾT SUẤT KHUYÊN DÙNG'}
              </span>
              <span
                data-testid="rx-recommended-label"
                className="mt-0.5 block text-xs font-medium text-[var(--olive)]"
              >
                {report.recommendedIndex.label[locale]}
              </span>
            </div>
            <div className="border-l border-[var(--hairline)] pl-4 text-right">
              <span
                data-testid="rx-reduction-badge"
                className="font-serif-editorial text-3xl leading-none text-[var(--ink)] sm:text-4xl"
              >
                -{row174.edgeReductionPercentVs150}
                <span className="text-lg text-[var(--accent)]">%</span>
              </span>
              <span className="block font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                1.50 → 1.74 EDGE
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN: Optometry Presets + OD/OS Rx Controls + PD + Validation */}
          <div className="space-y-4 lg:col-span-5">
            {/* Clinical Study Presets */}
            <div className="border border-[var(--hairline)] bg-[var(--surface)] p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  <Sliders size={11} strokeWidth={1.6} />
                  {copy.rxPresetsLabel}
                </span>
                <span className="font-mono-tech text-[9.5px] text-[var(--ink-muted)]">
                  MAX MERIDIAN {report.strongestMeridianAbsD.toFixed(2)} D
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {OPTICAL_RX_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    data-testid={`rx-preset-${preset.id}`}
                    onClick={() => {
                      atelierAudio.playDetent();
                      setSelectedIndexOverride(null);
                      setRxInput(preset.input);
                    }}
                    className="flex items-center justify-between gap-2 border border-[var(--hairline)] bg-[var(--bg)] px-2.5 py-2 text-left transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    <span className="truncate text-[11px] font-medium text-[var(--ink)]">
                      {preset.label[locale]}
                    </span>
                    <span className="shrink-0 font-mono-tech text-[9.5px] text-[var(--accent)]">
                      {preset.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* OD & OS Prescription Inputs */}
            {renderEyeCard('od', copy.rxOdLabel)}
            {renderEyeCard('os', copy.rxOsLabel)}

            {/* PD + Lens Diameter + Blue-Light Coating */}
            <div className="space-y-4 border border-[var(--hairline)] bg-[var(--surface)] p-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    {copy.rxPdLabel}
                  </span>
                  <span
                    data-testid="rx-pd-readout"
                    className="font-mono-tech text-xs font-medium text-[var(--ink)]"
                  >
                    {rxInput.pdMm.toFixed(1)} mm · Dec {report.decentrationPerEyeMm.toFixed(1)} mm
                  </span>
                </div>
                <input
                  type="range"
                  min={RX_BOUNDS.pdMin}
                  max={RX_BOUNDS.pdMax}
                  step={0.5}
                  data-testid="rx-pd-slider"
                  aria-label={copy.rxPdLabel}
                  value={rxInput.pdMm}
                  onChange={(e) =>
                    setRxInput((prev) => ({ ...prev, pdMm: Number(e.target.value) }))
                  }
                  className="vera-range"
                />
                <div className="mt-1 flex justify-between font-mono-tech text-[8.5px] uppercase text-[var(--ink-muted)]">
                  <span>54 mm</span>
                  <span>64 mm</span>
                  <span>74 mm</span>
                </div>
              </div>

              <div className="border-t border-[var(--hairline)] pt-3">
                <span className="mb-2 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {copy.rxDiameterLabel}
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {FRAME_DIAMETER_OPTIONS.map((opt) => {
                    const active = rxInput.lensDiameterMm === opt.mm;
                    return (
                      <button
                        key={opt.mm}
                        type="button"
                        onClick={() => {
                          atelierAudio.playDetent();
                          setRxInput((prev) => ({ ...prev, lensDiameterMm: opt.mm }));
                        }}
                        className={`border px-2 py-1.5 text-center font-mono-tech text-[10px] transition-colors ${
                          active
                            ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                            : 'border-[var(--hairline)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--hairline-strong)]'
                        }`}
                      >
                        {opt.mm} mm
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-[var(--hairline)] pt-3">
                <button
                  type="button"
                  data-testid="rx-blue-toggle"
                  onClick={() => {
                    atelierAudio.playDetent();
                    setRxInput((prev) => ({
                      ...prev,
                      blueLightFilterEnabled: !prev.blueLightFilterEnabled,
                    }));
                  }}
                  className={`flex w-full items-center justify-between gap-2 border px-3 py-2.5 text-left transition-colors ${
                    rxInput.blueLightFilterEnabled
                      ? 'border-[var(--accent)] bg-[var(--bg)] ring-1 ring-[var(--accent)]'
                      : 'border-[var(--hairline)] bg-[var(--bg)] text-[var(--ink-muted)]'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block text-[11.5px] font-medium text-[var(--ink)]">
                      {copy.rxBlueLightToggle}
                    </span>
                    <span className="font-mono-tech text-[9.5px] text-[var(--ink-muted)]">
                      UV400 ({report.spectral.uv400BlockPercent}%) · HEV CUT{' '}
                      {report.spectral.hevBlueFilterPercent}%
                    </span>
                  </div>
                  <span className="shrink-0 font-mono-tech text-[11px] text-[var(--accent)]">
                    {rxInput.blueLightFilterEnabled
                      ? `+${formatMoney(BLUE_LIGHT_STUDIO_SURCHARGE_USD, currency)}`
                      : 'OFF'}
                  </span>
                </button>
              </div>
            </div>

            {/* Clinical Optometry Validation Status */}
            <div
              data-testid="rx-validation-banner"
              className={`border px-4 py-3 ${
                report.validation.valid
                  ? 'border-[var(--olive)]/45 bg-[var(--olive)]/10 text-[var(--olive)]'
                  : 'border-[#B83227]/60 bg-[#B83227]/10 text-[#B83227]'
              }`}
            >
              <div className="flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[0.16em]">
                {report.validation.valid ? (
                  <ShieldCheck size={13} strokeWidth={1.6} />
                ) : (
                  <AlertTriangle size={13} strokeWidth={1.6} />
                )}
                <span>
                  {report.validation.valid ? copy.rxValidStamp : copy.rxInvalidStamp}
                </span>
              </div>
              {!report.validation.valid && (
                <ul className="mt-1.5 space-y-1 text-xs">
                  {report.validation.errors.map((err, idx) => (
                    <li key={`${err.field}-${idx}`}>· {err.message[locale]}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Side-by-Side Sagitta SVG + 4-Index Matrix + 380-780nm Spectral SVG + Add to Cart */}
          <div className="flex flex-col justify-between gap-6 lg:col-span-7">
            {/* 1. Live Side-by-Side Optical Cross-Section SVG (CR-39 1.50 vs Ultra-Thin 1.74) */}
            <div className="archival-grid border border-[var(--hairline-strong)] bg-[var(--surface)] p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--hairline)] pb-3">
                <div className="flex items-center gap-2">
                  <Layers size={13} strokeWidth={1.6} className="text-[var(--accent)]" />
                  <span className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink)]">
                    {copy.rxCrossSectionTitle}
                  </span>
                </div>
                <span className="font-mono-tech text-[10px] text-[var(--ink-muted)]">
                  EFF. HALF-BLANK {report.effectiveSemiDiameterMm.toFixed(1)} MM · 4.0 MM TI RIM
                </span>
              </div>

              <svg
                viewBox="0 0 600 245"
                data-testid="rx-cross-section-svg"
                className="h-auto w-full text-[var(--ink)]"
                role="img"
                aria-label={`Optical sagitta cross-section comparing CR-39 1.50 (${row150.peakEdgeThicknessMm}mm edge) versus Ultra-Thin 1.74 (${row174.peakEdgeThicknessMm}mm edge)`}
              >
                {/* Center divider */}
                <line
                  x1="300"
                  y1="14"
                  x2="300"
                  y2="232"
                  stroke="currentColor"
                  strokeOpacity="0.18"
                  strokeDasharray="4 4"
                />

                {/* LEFT: CR-39 1.50 Panel */}
                <text
                  x="145"
                  y="24"
                  textAnchor="middle"
                  className="font-mono-tech"
                  fontSize="10.5"
                  fill="currentColor"
                  opacity="0.72"
                >
                  CR-39 1.50 STANDARD (ABBE 58)
                </text>

                {/* 4.0mm Titanium Rim Depth Reference Box */}
                <rect
                  x={145 - rimWidthPx / 2}
                  y="40"
                  width={rimWidthPx}
                  height="160"
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity="0.34"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                {/* Actual 1.50 Lens Profile */}
                <path
                  d={path150}
                  fill="currentColor"
                  fillOpacity="0.14"
                  stroke="currentColor"
                  strokeWidth="2.2"
                />
                {/* Edge & Center Caliper Labels */}
                <text
                  x="145"
                  y="214"
                  textAnchor="middle"
                  className="font-mono-tech"
                  fontSize="10.5"
                  fill="currentColor"
                >
                  EDGE {row150.peakEdgeThicknessMm.toFixed(2)} mm · CTR{' '}
                  {row150.peakCenterThicknessMm.toFixed(2)} mm
                </text>
                <text
                  x="145"
                  y="230"
                  textAnchor="middle"
                  className="font-mono-tech"
                  fontSize="9"
                  fill="currentColor"
                  opacity="0.62"
                >
                  {row150.fits4mmTitaniumRim
                    ? 'FLUSH INSIDE 4.0MM TITANIUM RIM'
                    : `PROTRUDES +${Math.max(0, row150.peakEdgeThicknessMm - TITANIUM_RIM_DEPTH_MM).toFixed(2)}MM BEYOND 4MM RIM`}
                </text>

                {/* RIGHT: Ultra-Thin 1.74 Japanese Aspheric Panel */}
                <text
                  x="455"
                  y="24"
                  textAnchor="middle"
                  className="font-mono-tech"
                  fontSize="10.5"
                  fill="var(--accent)"
                >
                  ULTRA-THIN 1.74 JAPANESE ASPHERIC
                </text>

                {/* 4.0mm Titanium Rim Depth Reference Box */}
                <rect
                  x={455 - rimWidthPx / 2}
                  y="40"
                  width={rimWidthPx}
                  height="160"
                  fill="none"
                  stroke="var(--olive)"
                  strokeOpacity="0.55"
                  strokeDasharray="3 3"
                  strokeWidth="1.2"
                />
                {/* Actual 1.74 Lens Profile */}
                <path
                  d={path174}
                  fill="var(--accent)"
                  fillOpacity="0.22"
                  stroke="var(--accent)"
                  strokeWidth="2.4"
                />
                <text
                  x="455"
                  y="214"
                  textAnchor="middle"
                  className="font-mono-tech"
                  fontSize="10.5"
                  fill="var(--accent)"
                >
                  EDGE {row174.peakEdgeThicknessMm.toFixed(2)} mm · CTR{' '}
                  {row174.peakCenterThicknessMm.toFixed(2)} mm
                </text>
                <text
                  x="455"
                  y="230"
                  textAnchor="middle"
                  className="font-mono-tech"
                  fontSize="9"
                  fill="var(--olive)"
                >
                  {row174.edgeReductionPercentVs150 > 0
                    ? `-${row174.edgeReductionPercentVs150}% EDGE REDUCTION · ${row174.fits4mmTitaniumRim ? 'FLUSH IN 4MM RIM' : 'SLEEK BEVEL'}`
                    : 'DOUBLE-ASPHERIC MINIMAL PROFILE'}
                </text>
              </svg>
            </div>

            {/* 2. 4-Refractive-Index Comparison Matrix */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                  {copy.rxIndexMatrixTitle}
                </span>
                <span className="font-mono-tech text-[10px] text-[var(--ink-muted)]">
                  {locale === 'en' ? 'Select index to commission' : 'Chọn chiết suất chế tác'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                {report.comparisons.map((row) => {
                  const selected = row.spec.id === activeIndexId;
                  return (
                    <button
                      key={row.spec.id}
                      type="button"
                      data-testid={`rx-index-card-${row.spec.code.replace('.', '')}`}
                      onClick={() => {
                        atelierAudio.playDetent();
                        setSelectedIndexOverride(row.spec.id);
                      }}
                      className={`flex flex-col justify-between border p-3.5 text-left transition-all ${
                        selected
                          ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                          : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--hairline-strong)]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`font-mono-tech text-sm font-medium ${
                              selected ? 'text-[#D4B483]' : 'text-[var(--accent)]'
                            }`}
                          >
                            n = {row.spec.code}
                          </span>
                          {row.isRecommended && (
                            <span
                              className={`border px-1.5 py-0.5 font-mono-tech text-[8px] uppercase tracking-[0.12em] ${
                                selected
                                  ? 'border-[#D4B483]/60 text-[#D4B483]'
                                  : 'border-[var(--olive)]/50 bg-[var(--olive)]/12 text-[var(--olive)]'
                              }`}
                            >
                              {copy.rxRecommendedBadge}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 font-serif-editorial text-base leading-snug">
                          {row.spec.shortLabel[locale]}
                        </p>

                        <dl className="mt-2.5 space-y-1 font-mono-tech text-[10px]">
                          <div className="flex justify-between">
                            <dt className="opacity-65">Edge</dt>
                            <dd
                              data-testid={`rx-edge-${row.spec.code.replace('.', '')}`}
                              className="font-medium"
                            >
                              {row.peakEdgeThicknessMm.toFixed(2)} mm
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="opacity-65">Center</dt>
                            <dd>{row.peakCenterThicknessMm.toFixed(2)} mm</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="opacity-65">Weight</dt>
                            <dd>{row.pairWeightGrams.toFixed(1)} g</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="opacity-65">Abbe</dt>
                            <dd>{row.spec.abbeValue}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-current/15 pt-2 font-mono-tech text-[10px]">
                        <span>
                          {row.edgeReductionPercentVs150 > 0
                            ? `-${row.edgeReductionPercentVs150}%`
                            : 'BASE'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          {selected && <Check size={11} strokeWidth={2} />}
                          {row.spec.surchargeUsd === 0
                            ? '+$0'
                            : `+${formatMoney(row.spec.surchargeUsd, currency)}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. 380nm–780nm Spectral Transmittance Curve SVG (UV400 + Blue-Light Filtration) */}
            <div className="border border-[var(--hairline-strong)] bg-[var(--surface)] p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--hairline)] pb-3">
                <div className="flex items-center gap-2">
                  <Activity size={13} strokeWidth={1.6} className="text-[var(--accent)]" />
                  <span className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink)]">
                    {copy.rxSpectralTitle}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 font-mono-tech text-[9.5px]">
                  <span className="border border-[var(--hairline)] bg-[var(--bg)] px-2 py-0.5 text-[var(--ink)]">
                    UV400 BLOCK {report.spectral.uv400BlockPercent}%
                  </span>
                  <span className="border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-2 py-0.5 text-[var(--accent)]">
                    HEV 415–455NM CUT {report.spectral.hevBlueFilterPercent}%
                  </span>
                  <span className="border border-[var(--olive)]/40 bg-[var(--olive)]/10 px-2 py-0.5 text-[var(--olive)]">
                    VIS VLT {report.spectral.visibleAvgTransmittancePercent}%
                  </span>
                </div>
              </div>

              <svg
                viewBox="0 0 600 225"
                data-testid="rx-spectral-svg"
                className="h-auto w-full text-[var(--ink)]"
                role="img"
                aria-label="380nm to 780nm optical spectral transmittance curve showing UV400 block and HEV blue-light attenuation"
              >
                <defs>
                  <linearGradient id="veraVisibleSpectrum" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#5B2C8A" />
                    <stop offset="12%" stopColor="#3B5CCC" />
                    <stop offset="28%" stopColor="#2A9FD6" />
                    <stop offset="46%" stopColor="#3A9B5C" />
                    <stop offset="64%" stopColor="#D6A92A" />
                    <stop offset="80%" stopColor="#CC5A2B" />
                    <stop offset="100%" stopColor="#8F2222" />
                  </linearGradient>
                  <linearGradient id="veraSpectralFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Shaded UV400 Band (380-400nm) & HEV Blue Band (415-455nm) */}
                <rect
                  x={specX(380)}
                  y="25"
                  width={specX(400) - specX(380)}
                  height="160"
                  fill="currentColor"
                  fillOpacity="0.09"
                />
                <rect
                  x={specX(415)}
                  y="25"
                  width={specX(455) - specX(415)}
                  height="160"
                  fill="#3B68CC"
                  fillOpacity="0.11"
                />
                <text
                  x={(specX(380) + specX(400)) / 2}
                  y="18"
                  textAnchor="middle"
                  className="font-mono-tech"
                  fontSize="8"
                  fill="currentColor"
                  opacity="0.7"
                >
                  UV400
                </text>
                <text
                  x={(specX(415) + specX(455)) / 2}
                  y="18"
                  textAnchor="middle"
                  className="font-mono-tech"
                  fontSize="8"
                  fill="#3B68CC"
                >
                  HEV BLUE
                </text>

                {/* Horizontal Y Gridlines (0%, 25%, 50%, 75%, 100%) */}
                {[0, 25, 50, 75, 100].map((pct) => {
                  const y = specY(pct);
                  return (
                    <g key={pct}>
                      <line
                        x1="46"
                        y1={y}
                        x2="586"
                        y2={y}
                        stroke="currentColor"
                        strokeOpacity={pct === 0 ? 0.35 : 0.12}
                        strokeDasharray={pct === 0 ? undefined : '3 3'}
                      />
                      <text
                        x="38"
                        y={y + 3}
                        textAnchor="end"
                        className="font-mono-tech"
                        fontSize="8.5"
                        fill="currentColor"
                        opacity="0.6"
                      >
                        {pct}%
                      </text>
                    </g>
                  );
                })}

                {/* Active Area Fill + Baseline AR Dashed Curve + Active Curve */}
                <path d={activeAreaPath} fill="url(#veraSpectralFill)" />
                <polyline
                  points={baselinePolyline}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity="0.4"
                  strokeWidth="1.4"
                  strokeDasharray="4 3"
                />
                <polyline
                  points={activePolyline}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.4"
                />

                {/* Visible Wavelength Spectrum Ribbon */}
                <rect
                  x="46"
                  y="191"
                  width="540"
                  height="5"
                  fill="url(#veraVisibleSpectrum)"
                  opacity="0.85"
                />

                {/* Wavelength X-axis ticks */}
                {[380, 400, 450, 500, 550, 600, 650, 700, 780].map((wl) => (
                  <text
                    key={wl}
                    x={specX(wl)}
                    y="212"
                    textAnchor="middle"
                    className="font-mono-tech"
                    fontSize="8.5"
                    fill="currentColor"
                    opacity="0.68"
                  >
                    {wl}nm
                  </text>
                ))}
              </svg>
            </div>

            {/* 4. Auto-Add Recommended Lens Index Upgrade CTA */}
            <div className="flex flex-col justify-between gap-3 border border-[var(--hairline-strong)] bg-[var(--surface)] p-5 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="font-mono-tech text-[9.5px] uppercase tracking-[0.2em] text-[var(--accent)]">
                  {baseFrame.sku} · {activeRow.spec.label[locale]}
                </p>
                <p className="mt-1 font-mono-tech text-[11px] text-[var(--ink-muted)]">
                  OD {formatDiopter(rxInput.od.sphereD)} / OS {formatDiopter(rxInput.os.sphereD)} ·
                  PD {rxInput.pdMm.toFixed(1)}mm · Edge {activeRow.peakEdgeThicknessMm.toFixed(2)}mm
                </p>
              </div>
              <button
                type="button"
                disabled={!report.validation.valid}
                data-testid="rx-add-recommended-btn"
                onClick={() =>
                  addOpticalRxCommissionToBag(rxInput, activeRow.spec.id, baseFrame.id)
                }
                className="inline-flex shrink-0 items-center justify-between gap-4 border border-[var(--ink)] bg-[var(--ink)] px-5 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--surface)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="inline-flex items-center gap-2">
                  <Plus size={14} strokeWidth={1.75} />
                  {copy.rxAddRecommended}
                </span>
                <span className="font-mono-tech text-xs">
                  {formatMoney(totalCommissionUsd, currency)}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OpticalRxLab;
