import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Check,
  Compass,
  Eye,
  MoveHorizontal,
  ShieldCheck,
  Sparkles,
  Sun,
  Waves,
  CloudRain,
  Mountain,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PRODUCT_BY_ID } from '../data/catalog';
import { atelierAudio } from '../engines/atelierAudio';
import { formatMoney } from '../engines/currency';
import {
  computeGlareOpticsTelemetry,
  computeMalusAttenuationCurve,
  GLARE_ENVIRONMENTS,
  OPTICAL_COATING_TIERS,
  type GlareOpticsTelemetry,
} from '../engines/glareOpticsEngine';
import type { GlareEnvironmentId, OpticalCoatingTierId } from '../types/commerce';

interface SceneLayerProps {
  environmentId: GlareEnvironmentId;
  glareStrength: number; // 0.006 .. 0.88
  ghostStrength: number; // 0.04 .. 1.0 (scales with surface reflection %)
  isPolarized: boolean;
  vltPercent: number;
}

const OpticalEnvironmentScene: React.FC<SceneLayerProps> = ({
  environmentId,
  glareStrength,
  ghostStrength,
  isPolarized,
  vltPercent,
}) => {
  const glareOpacity = Math.max(0.02, Math.min(0.96, glareStrength * 1.06));
  const ghostOpacity = Math.max(0.0, Math.min(0.85, ghostStrength));
  const tintDarkening = vltPercent < 40 ? 0.14 : 0;

  if (environmentId === 'mediterranean-ocean') {
    return (
      <g>
        {/* Sky */}
        <rect x="0" y="0" width="760" height="176" fill="url(#oceanSkyGrad)" />
        {/* Warm solar disc */}
        <circle cx="548" cy="64" r="24" fill="#FFF8E2" opacity="0.95" />
        <circle cx="548" cy="64" r="56" fill="url(#oceanSunGlow)" opacity={0.35 + glareOpacity * 0.55} />

        {/* Distant Riviera Limestone Cliffs & Villa */}
        <path
          d="M 0,176 L 0,132 Q 62,108 134,124 Q 186,136 244,148 L 296,176 Z"
          fill="#8A7E70"
        />
        <path
          d="M 16,176 L 44,136 Q 92,120 148,136 L 210,176 Z"
          fill="#AFA28E"
          opacity="0.72"
        />
        {/* Architectural cliffside villa silhouette */}
        <rect x="74" y="114" width="32" height="12" fill="#F5EFE5" />
        <rect x="82" y="108" width="16" height="6" fill="#E3D6C3" />

        {/* Deep Mediterranean Sea */}
        <rect x="0" y="176" width="760" height="224" fill="url(#oceanWaterGrad)" />

        {/* Underwater Reef Contours & Bathymetry (Revealed crystal clear when glare is attenuated!) */}
        <g opacity={Math.max(0.12, 1 - glareOpacity * 0.88)}>
          <path
            d="M 60,362 Q 160,320 278,342 T 500,326 T 710,352 L 760,400 L 0,400 Z"
            fill="#0D6E7D"
            opacity="0.65"
          />
          <path
            d="M 110,334 Q 210,295 330,318 T 565,302 T 720,324"
            fill="none"
            stroke="#59D2C8"
            strokeWidth="2.2"
            strokeDasharray="10 6"
            opacity="0.72"
          />
          <ellipse cx="265" cy="312" rx="68" ry="16" fill="#1C9FA8" opacity="0.55" />
          <ellipse cx="520" cy="336" rx="92" ry="20" fill="#158F99" opacity="0.5" />
          {/* Crisp submerged mooring buoy & wave crests */}
          <circle cx="445" cy="264" r="5" fill="#D45735" />
          <line x1="445" y1="269" x2="438" y2="328" stroke="#D4B483" strokeWidth="1.4" opacity="0.75" />
        </g>

        {/* Subtle natural water ripples */}
        {[202, 224, 250, 282, 318, 358].map((y, idx) => (
          <line
            key={y}
            x1={32 + idx * 14}
            y1={y}
            x2={728 - idx * 10}
            y2={y}
            stroke="#8BE0E8"
            strokeWidth="1"
            opacity={0.22 + (1 - glareOpacity) * 0.2}
            strokeDasharray={`${28 + idx * 8} ${18 + idx * 4}`}
          />
        ))}

        {/* Crisp Editorial Sailboat on Horizon */}
        <g opacity={Math.max(0.32, 1 - glareOpacity * 0.6)}>
          <path d="M 358,216 L 424,216 L 414,226 L 368,226 Z" fill="#18202B" />
          <line x1="392" y1="216" x2="392" y2="128" stroke="#18202B" strokeWidth="2.2" />
          <path d="M 394,132 L 424,210 L 394,210 Z" fill="#FDFBF7" />
          <path d="M 389,144 L 365,208 L 389,208 Z" fill="#EFE7DA" />
        </g>

        {/* Warm amber/polarized clarity enhancement tint */}
        {isPolarized && (
          <rect x="0" y="0" width="760" height="400" fill="#8E5B24" opacity={tintDarkening} />
        )}

        {/* Horizontal Brewster Specular Glare Sheet (I = I0 * cos^2(theta)) */}
        <g opacity={glareOpacity}>
          <rect x="0" y="174" width="760" height="226" fill="url(#oceanBrewsterGlare)" />
          {[184, 196, 210, 226, 246, 268, 294, 326, 360].map((y, idx) => (
            <ellipse
              key={y}
              cx={510 - idx * 20}
              cy={y}
              rx={165 + idx * 34}
              ry={4 + idx * 1.4}
              fill="#FFFDF5"
              opacity={0.86 - idx * 0.04}
            />
          ))}
          <rect x="0" y="176" width="760" height="145" fill="#FFFFFF" opacity="0.44" />
        </g>

        {/* Uncoated Double-Surface Fresnel Ghost Reflection Halos */}
        {ghostOpacity > 0.05 && (
          <g opacity={ghostOpacity}>
            <circle cx="315" cy="148" r="34" fill="none" stroke="#9DF2C9" strokeWidth="6" opacity="0.35" />
            <circle cx="242" cy="192" r="22" fill="#D5FFEA" opacity="0.28" />
            <line x1="0" y1="60" x2="760" y2="305" stroke="#FFFFFF" strokeWidth="26" opacity="0.2" />
          </g>
        )}
      </g>
    );
  }

  if (environmentId === 'rain-night-highway') {
    return (
      <g>
        {/* Nocturne Rain Sky */}
        <rect x="0" y="0" width="760" height="190" fill="url(#nightSkyGrad)" />
        {/* Distant Parisian Viaduct & City Skyline */}
        <path
          d="M 0,190 L 0,148 L 58,148 L 58,130 L 116,130 L 116,154 L 194,154 L 194,136 L 268,136 L 268,162 L 496,162 L 496,138 L 566,138 L 566,152 L 652,152 L 652,126 L 760,126 L 760,190 Z"
          fill="#101521"
        />
        {/* Overhead Highway Gantry & Crisp Signage */}
        <line x1="115" y1="92" x2="645" y2="92" stroke="#2D374A" strokeWidth="4" />
        <line x1="125" y1="92" x2="125" y2="190" stroke="#232B3B" strokeWidth="5" />
        <line x1="635" y1="92" x2="635" y2="190" stroke="#232B3B" strokeWidth="5" />
        <rect x="292" y="66" width="176" height="42" fill="#17385B" stroke="#D8E2EE" strokeWidth="1.5" />
        <text
          x="380"
          y="85"
          textAnchor="middle"
          fill="#F6F3ED"
          fontSize="10"
          className="font-mono-tech"
          letterSpacing="1.6"
        >
          A1 · PARIS CENTRE
        </text>
        <text
          x="380"
          y="100"
          textAnchor="middle"
          fill="#D4B483"
          fontSize="8.5"
          className="font-mono-tech"
          letterSpacing="1.4"
        >
          SORTIE 400 M
        </text>

        {/* Wet Perspective Asphalt Highway */}
        <polygon points="0,190 760,190 760,400 0,400" fill="#141820" />
        <polygon points="315,190 445,190 715,400 45,400" fill="url(#wetAsphaltGrad)" />

        {/* Crisp Lane Markings & Road Cat-Eye Studs (Sharp when glare is cut!) */}
        <g opacity={Math.max(0.24, 1 - glareOpacity * 0.72)}>
          <line x1="322" y1="192" x2="88" y2="400" stroke="#E8E4DA" strokeWidth="3" />
          <line x1="438" y1="192" x2="672" y2="400" stroke="#E8E4DA" strokeWidth="3" />
          <line
            x1="380"
            y1="196"
            x2="380"
            y2="400"
            stroke="#F4C768"
            strokeWidth="3.5"
            strokeDasharray="18 16"
          />
          <circle cx="240" cy="274" r="3.2" fill="#7DE0C3" />
          <circle cx="520" cy="274" r="3.2" fill="#7DE0C3" />
          <circle cx="176" cy="336" r="4" fill="#7DE0C3" />
          <circle cx="584" cy="336" r="4" fill="#7DE0C3" />
        </g>

        {/* Oncoming Vehicle Silhouette + Twin LED Headlamps & Tail-lights */}
        <rect x="242" y="196" width="66" height="24" rx="4" fill="#0B0E14" />
        <circle cx="256" cy="208" r="5" fill="#F2F8FF" />
        <circle cx="294" cy="208" r="5" fill="#F2F8FF" />
        {/* Ahead car crimson taillights */}
        <rect x="448" y="200" width="54" height="20" rx="3" fill="#0C0F16" />
        <rect x="453" y="206" width="12" height="5" fill="#E3473B" />
        <rect x="485" y="206" width="12" height="5" fill="#E3473B" />

        {/* Boulevard Street Lamps */}
        {[175, 250, 510, 585].map((x) => (
          <circle key={x} cx={x} cy="154" r="3.5" fill="#FFDFA8" />
        ))}

        {/* Wet-Tarmac Horizontal Brewster Glare Streaks + LED Flare */}
        <g opacity={glareOpacity}>
          <ellipse cx="275" cy="208" rx="88" ry="44" fill="url(#headlampFlare)" />
          <polygon points="244,218 308,218 242,400 72,400" fill="url(#wetRoadStreak)" />
          <polygon points="452,216 502,216 618,400 500,400" fill="url(#redRoadStreak)" opacity="0.7" />
          {[242, 274, 308, 346, 378].map((y, idx) => (
            <ellipse
              key={y}
              cx={248 - idx * 14}
              cy={y}
              rx={95 + idx * 24}
              ry={4.5}
              fill="#FFF4DB"
              opacity={0.78 - idx * 0.08}
            />
          ))}
        </g>

        {/* Uncoated Double-Surface Fresnel Starburst & Ghost Halos */}
        {ghostOpacity > 0.05 && (
          <g opacity={ghostOpacity}>
            <line x1="165" y1="208" x2="385" y2="208" stroke="#EAF6FF" strokeWidth="3" opacity="0.82" />
            <line x1="275" y1="126" x2="275" y2="290" stroke="#EAF6FF" strokeWidth="2.5" opacity="0.68" />
            <line x1="205" y1="145" x2="345" y2="270" stroke="#CFEAFF" strokeWidth="2" opacity="0.6" />
            <circle cx="468" cy="252" r="24" fill="none" stroke="#85F5C2" strokeWidth="4" opacity="0.45" />
            <circle cx="326" cy="236" r="14" fill="#9AF2D0" opacity="0.32" />
          </g>
        )}
      </g>
    );
  }

  // High-Altitude Alpine Snow
  return (
    <g>
      {/* High-Altitude Alpine Sky */}
      <rect x="0" y="0" width="760" height="196" fill="url(#alpineSkyGrad)" />
      {/* Intense High-Altitude Sun */}
      <circle cx="592" cy="58" r="22" fill="#FFFFFF" />
      <circle cx="592" cy="58" r="64" fill="url(#oceanSunGlow)" opacity={0.4 + glareOpacity * 0.52} />

      {/* Sculpted Chamonix Alpine Peaks */}
      <polygon points="0,210 116,96 226,184 342,74 472,188 578,108 760,204 760,230 0,230" fill="#DDE6F0" />
      {/* Crisp Glacier Shadow Facets (Revealed when snow glare is attenuated!) */}
      <g opacity={Math.max(0.18, 1 - glareOpacity * 0.8)}>
        <polygon points="116,96 154,196 226,184" fill="#6F8FAF" />
        <polygon points="342,74 398,196 472,188" fill="#5A7EA3" />
        <polygon points="578,108 632,202 760,204" fill="#6A8CAE" />
      </g>

      {/* Foreground Alpine Snow Slope */}
      <path d="M 0,204 Q 210,186 410,206 T 760,196 L 760,400 L 0,400 Z" fill="url(#alpineSnowGrad)" />

      {/* Terrain Undulation Contours & Slalom Gates (High-Contrast Clarity on Polarized Side) */}
      <g opacity={Math.max(0.16, 1 - glareOpacity * 0.82)}>
        <path
          d="M 38,266 Q 190,242 355,268 T 710,256"
          fill="none"
          stroke="#5C84AC"
          strokeWidth="2.4"
          opacity="0.72"
        />
        <path
          d="M 16,326 Q 230,296 445,328 T 744,312"
          fill="none"
          stroke="#4A739C"
          strokeWidth="2.8"
          opacity="0.75"
        />
        <path d="M 155,400 Q 320,310 470,224" fill="none" stroke="#85A7C8" strokeWidth="3" strokeDasharray="8 6" />
        {/* Terracotta & Cobalt Slalom Course Gates */}
        <line x1="234" y1="240" x2="234" y2="306" stroke="#B84A27" strokeWidth="3.5" />
        <rect x="236" y="242" width="24" height="16" fill="#B84A27" />
        <line x1="486" y1="256" x2="486" y2="332" stroke="#1E4B8F" strokeWidth="3.5" />
        <rect x="488" y="258" width="26" height="18" fill="#1E4B8F" />
        <line x1="364" y1="296" x2="364" y2="374" stroke="#B84A27" strokeWidth="4" />
        <rect x="366" y="298" width="28" height="20" fill="#B84A27" />
      </g>

      {isPolarized && (
        <rect x="0" y="0" width="760" height="400" fill="#7D5224" opacity={tintDarkening} />
      )}

      {/* Blinding Alpine Snowfield Whiteout Glare */}
      <g opacity={glareOpacity}>
        <rect x="0" y="180" width="760" height="220" fill="url(#alpineGlareGrad)" />
        <rect x="0" y="196" width="760" height="204" fill="#FFFFFF" opacity="0.58" />
        {[220, 260, 306, 352].map((y, idx) => (
          <ellipse
            key={y}
            cx={420 - idx * 35}
            cy={y}
            rx={240 + idx * 30}
            ry={14}
            fill="#FFFFFF"
            opacity="0.72"
          />
        ))}
      </g>

      {ghostOpacity > 0.05 && (
        <g opacity={ghostOpacity}>
          <circle cx="290" cy="144" r="30" fill="none" stroke="#A6F5D3" strokeWidth="5" opacity="0.38" />
          <line x1="120" y1="0" x2="720" y2="350" stroke="#FFFFFF" strokeWidth="32" opacity="0.22" />
        </g>
      )}
    </g>
  );
};

export const PolarizedGlareLab: React.FC = () => {
  const { locale, currency, activeOpticalCoating, applyOpticalCoatingToActiveFrame } = useStore();
  const isEn = locale === 'en';

  const [environmentId, setEnvironmentId] = useState<GlareEnvironmentId>('mediterranean-ocean');
  const [coatingId, setCoatingId] = useState<OpticalCoatingTierId>('polarized-blue-ar');
  const [analyzerAngleDeg, setAnalyzerAngleDeg] = useState<number>(90);
  const [splitPercent, setSplitPercent] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [justApplied, setJustApplied] = useState<boolean>(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);

  const telemetry: GlareOpticsTelemetry = useMemo(
    () => computeGlareOpticsTelemetry(environmentId, coatingId, analyzerAngleDeg),
    [environmentId, coatingId, analyzerAngleDeg]
  );

  const uncoatedBaseline = useMemo(
    () => computeGlareOpticsTelemetry(environmentId, 'uncoated-cr39', 90),
    [environmentId]
  );

  const malusCurve = useMemo(
    () => computeMalusAttenuationCurve(environmentId, coatingId),
    [environmentId, coatingId]
  );

  const updateSplitFromClientX = useCallback((clientX: number) => {
    const box = viewportRef.current?.getBoundingClientRect();
    if (!box || box.width <= 0) return;
    const rawPct = ((clientX - box.left) / box.width) * 100;
    const clamped = Math.max(0, Math.min(100, Math.round(rawPct)));
    setSplitPercent(clamped);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updateSplitFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateSplitFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore if already released
      }
      setIsDragging(false);
    }
  };

  const handleApplyCoating = () => {
    applyOpticalCoatingToActiveFrame(coatingId, environmentId, analyzerAngleDeg);
    setJustApplied(true);
    window.setTimeout(() => setJustApplied(false), 2400);
  };

  const splitX = (splitPercent / 100) * 760;
  const activeGhostStrength = telemetry.surfaceReflectionPercent / 7.8;

  // Malus Curve SVG coordinates (X: 36..284 for 0..90 deg; Y: 108..18 for 0..100%)
  const malusX = (deg: number) => 36 + (deg / 90) * 248;
  const malusY = (attenPct: number) => 108 - (Math.max(0, Math.min(100, attenPct)) / 100) * 90;
  const malusPoints = malusCurve
    .map((pt) => `${malusX(pt.angleDeg).toFixed(1)},${malusY(pt.glareAttenuationPercent).toFixed(1)}`)
    .join(' ');

  const baseFrame = PRODUCT_BY_ID['mv-eye-01'];

  const renderEnvIcon = (id: GlareEnvironmentId) => {
    if (id === 'mediterranean-ocean') return <Waves size={13} strokeWidth={1.6} />;
    if (id === 'rain-night-highway') return <CloudRain size={13} strokeWidth={1.6} />;
    return <Mountain size={13} strokeWidth={1.6} />;
  };

  return (
    <section
      id="polarized-glare-lab"
      data-testid="polarized-glare-lab"
      className="reveal-section border-b border-[var(--hairline)] bg-[var(--surface)] py-14 sm:py-20"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        {/* Editorial Header */}
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-[var(--hairline)] pb-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
              <Sun size={12} strokeWidth={1.6} />
              {isEn
                ? 'BREWSTER ANGLE & MALUS LAW PHYSICS LAB · .NET 10 PARITY'
                : 'PHÒNG VẬT LÝ GÓC BREWSTER & ĐỊNH LUẬT MALUS · ĐỒNG BỘ .NET 10'}
            </p>
            <h2 className="mt-2 font-serif-editorial text-3xl font-normal leading-tight text-[var(--ink)] sm:text-5xl">
              {isEn
                ? 'Split-Screen Polarization & Anti-Reflective Glare Lab'
                : 'Phòng Thử Nghiệm Phân Cực & Chống Chói AR Chia Đôi Màn Hình'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
              {isEn
                ? 'Drag the champagne optical analyzer across real-world Brewster glare environments to compare bare CR-39 (7.8% surface reflection), Multi-Layer Hydrophobic AR (0.4% reflection), and Polarized Optical Filter + Blue-Light AR obeying I = I₀ cos²(θ).'
                : 'Kéo thanh chia vàng champagne qua 3 môi trường chói lóa góc Brewster thực tế để đối chiếu CR-39 không phủ (phản xạ 7.8%), AR đa lớp (0.4%) và Phân Cực Quang Học + AR Lọc Xanh theo định luật Malus I = I₀ cos²(θ).'}
            </p>
          </div>

          {/* Live Glare Attenuation Hero Pill */}
          <div className="flex items-center gap-4 border border-[var(--hairline-strong)] bg-[var(--bg)] px-5 py-3.5">
            <div>
              <span className="block font-mono-tech text-[9.5px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                {isEn ? 'GLARE ATTENUATION' : 'TRIỆT TIÊU CHÓI LÓA'}
              </span>
              <span className="mt-0.5 block text-xs font-medium text-[var(--ink)]">
                {telemetry.coating.shortLabel[locale]}
              </span>
            </div>
            <div className="border-l border-[var(--hairline)] pl-4 text-right">
              <span
                data-testid="glare-attenuation-value"
                className="font-serif-editorial text-3xl leading-none text-[var(--accent)] sm:text-4xl"
              >
                {telemetry.glareAttenuationPercent.toFixed(1)}
                <span className="text-lg">%</span>
              </span>
              <span className="block font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                θB {telemetry.brewsterAngleDeg.toFixed(1)}° · cos²θ {telemetry.malusCosSquared.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT 7 COLS: Interactive Draggable Split-Screen Optical Viewport + Telemetry Bar */}
          <div className="flex flex-col gap-5 lg:col-span-7">
            {/* Environment Selector Strip */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {GLARE_ENVIRONMENTS.map((env) => {
                const selected = env.id === environmentId;
                return (
                  <button
                    key={env.id}
                    type="button"
                    data-testid={`glare-env-${env.id}`}
                    onClick={() => {
                      atelierAudio.playDetent();
                      setEnvironmentId(env.id);
                    }}
                    className={`flex items-center justify-between gap-2 border px-3 py-2.5 text-left transition-all ${
                      selected
                        ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                        : 'border-[var(--hairline)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--hairline-strong)]'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="flex items-center gap-1.5 text-[11.5px] font-medium">
                        {renderEnvIcon(env.id)}
                        <span className="truncate">{env.shortLabel[locale]}</span>
                      </span>
                      <span
                        className={`mt-0.5 block font-mono-tech text-[9px] uppercase tracking-[0.12em] ${
                          selected ? 'text-[#D4B483]' : 'text-[var(--ink-muted)]'
                        }`}
                      >
                        θB {env.brewsterAngleDeg.toFixed(1)}° · {(env.baseGlareLuminanceCdM2 / 1000).toFixed(0)}k cd/m²
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Interactive Split-Screen SVG Daylight/Glare Optical Comparison Viewport */}
            <div className="border border-[var(--hairline-strong)] bg-[var(--bg)] p-3 sm:p-4">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 font-mono-tech text-[9.5px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                <span className="inline-flex items-center gap-1.5 text-[var(--ink)]">
                  <Eye size={12} strokeWidth={1.6} className="text-[var(--accent)]" />
                  {telemetry.environment.label[locale]}
                </span>
                <span data-testid="glare-split-readout">
                  {isEn ? 'OPTICAL SPLIT' : 'CHIA QUANG HỌC'} · {splitPercent}%
                </span>
              </div>

              <div
                ref={viewportRef}
                data-testid="glare-split-viewport"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="relative aspect-[19/10] w-full select-none overflow-hidden border border-[var(--hairline-strong)] touch-none cursor-ew-resize"
              >
                <svg
                  viewBox="0 0 760 400"
                  data-testid="glare-comparison-svg"
                  className="block h-full w-full"
                  role="img"
                  aria-label={`Split-screen optical comparison of ${telemetry.environment.label.en}: Uncoated CR-39 versus ${telemetry.coating.label.en}`}
                >
                  <defs>
                    <clipPath id="glareUncoatedClip">
                      <rect x="0" y="0" width={splitX} height="400" />
                    </clipPath>
                    <clipPath id="glareCoatedClip">
                      <rect x={splitX} y="0" width={Math.max(0, 760 - splitX)} height="400" />
                    </clipPath>

                    {/* Ocean gradients */}
                    <linearGradient id="oceanSkyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1D5D9B" />
                      <stop offset="65%" stopColor="#6AA7D8" />
                      <stop offset="100%" stopColor="#DFCFBA" />
                    </linearGradient>
                    <linearGradient id="oceanWaterGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0E4A6B" />
                      <stop offset="48%" stopColor="#0B6D82" />
                      <stop offset="100%" stopColor="#083B54" />
                    </linearGradient>
                    <radialGradient id="oceanSunGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFFDF2" stopOpacity="1" />
                      <stop offset="55%" stopColor="#FFE6A8" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#FFE6A8" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="oceanBrewsterGlare" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFFDF4" stopOpacity="0.95" />
                      <stop offset="52%" stopColor="#FFF6DF" stopOpacity="0.62" />
                      <stop offset="100%" stopColor="#E6ECF2" stopOpacity="0.18" />
                    </linearGradient>

                    {/* Night Highway gradients */}
                    <linearGradient id="nightSkyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#070B14" />
                      <stop offset="100%" stopColor="#192338" />
                    </linearGradient>
                    <linearGradient id="wetAsphaltGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1B212E" />
                      <stop offset="100%" stopColor="#0F131B" />
                    </linearGradient>
                    <radialGradient id="headlampFlare" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
                      <stop offset="45%" stopColor="#CBE4FF" stopOpacity="0.58" />
                      <stop offset="100%" stopColor="#6BA8FF" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="wetRoadStreak" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.88" />
                      <stop offset="60%" stopColor="#D7EAFF" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#A9CEFF" stopOpacity="0.08" />
                    </linearGradient>
                    <linearGradient id="redRoadStreak" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF5E54" stopOpacity="0.82" />
                      <stop offset="100%" stopColor="#B82A22" stopOpacity="0.05" />
                    </linearGradient>

                    {/* Alpine Snow gradients */}
                    <linearGradient id="alpineSkyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10396E" />
                      <stop offset="65%" stopColor="#3B79B8" />
                      <stop offset="100%" stopColor="#B9D7F0" />
                    </linearGradient>
                    <linearGradient id="alpineSnowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EBF2FA" />
                      <stop offset="55%" stopColor="#D6E4F2" />
                      <stop offset="100%" stopColor="#C1D5EA" />
                    </linearGradient>
                    <linearGradient id="alpineGlareGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
                      <stop offset="100%" stopColor="#F2F7FF" stopOpacity="0.42" />
                    </linearGradient>
                  </defs>

                  {/* LEFT CLIPPED VIEW: Uncoated CR-39 Raw Specular Glare */}
                  <g clipPath="url(#glareUncoatedClip)">
                    <OpticalEnvironmentScene
                      environmentId={environmentId}
                      glareStrength={uncoatedBaseline.residualGlareFraction}
                      ghostStrength={1.0}
                      isPolarized={false}
                      vltPercent={92.0}
                    />
                  </g>

                  {/* RIGHT CLIPPED VIEW: Active Optical Coating */}
                  <g clipPath="url(#glareCoatedClip)">
                    <OpticalEnvironmentScene
                      environmentId={environmentId}
                      glareStrength={telemetry.residualGlareFraction}
                      ghostStrength={activeGhostStrength}
                      isPolarized={telemetry.coating.isPolarized}
                      vltPercent={telemetry.vltPercent}
                    />
                  </g>

                  {/* Vertical Champagne Gold Optical Divider Line */}
                  <line
                    x1={splitX}
                    y1="0"
                    x2={splitX}
                    y2="400"
                    stroke="#D4B483"
                    strokeWidth="2.5"
                  />
                  <line
                    x1={splitX}
                    y1="0"
                    x2={splitX}
                    y2="400"
                    stroke="#111111"
                    strokeOpacity="0.45"
                    strokeWidth="0.75"
                  />
                </svg>

                {/* Left & Right Corner Optical Badges */}
                <div className="pointer-events-none absolute left-3 top-3 border border-white/25 bg-[#111111]/78 px-2.5 py-1 font-mono-tech text-[9px] uppercase tracking-[0.14em] text-[#F6F3ED] backdrop-blur-sm">
                  {isEn ? 'UNCOATED CR-39 · 12.0% CUT' : 'CR-39 TRẦN · KHỬ 12.0%'}
                </div>
                <div className="pointer-events-none absolute right-3 top-3 border border-[#D4B483]/60 bg-[#111111]/82 px-2.5 py-1 font-mono-tech text-[9px] uppercase tracking-[0.14em] text-[#D4B483] backdrop-blur-sm">
                  {telemetry.coating.shortLabel[locale]} · -{telemetry.glareAttenuationPercent.toFixed(1)}%
                </div>

                {/* Draggable Champagne-Gold Medallion Handle */}
                <div
                  role="slider"
                  tabIndex={0}
                  data-testid="glare-split-handle"
                  aria-label={isEn ? 'Optical glare split comparison slider' : 'Thanh kéo so sánh quang học'}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={splitPercent}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') setSplitPercent((p) => Math.max(0, p - 5));
                    if (e.key === 'ArrowRight') setSplitPercent((p) => Math.min(100, p + 5));
                  }}
                  style={{ left: `${splitPercent}%` }}
                  className="absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#D4B483] bg-[#111111]/92 text-[#D4B483] shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#D4B483]"
                >
                  <MoveHorizontal size={16} strokeWidth={1.8} />
                </div>
              </div>

              {/* Accessible Companion Split Slider + Quick Snap Buttons */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-3 min-w-[180px]">
                  <span className="font-mono-tech text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    0%
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    data-testid="glare-split-slider"
                    aria-label={isEn ? 'Split-screen position percentage' : 'Vị trí thanh chia màn hình'}
                    value={splitPercent}
                    onChange={(e) => setSplitPercent(Number(e.target.value))}
                    className="vera-range"
                  />
                  <span className="font-mono-tech text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    100%
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono-tech text-[9px]">
                  {[15, 50, 85].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        atelierAudio.playDetent();
                        setSplitPercent(pct);
                      }}
                      className={`border px-2 py-1 uppercase transition-colors ${
                        splitPercent === pct
                          ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                          : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Optical Physics Telemetry 4-Metric Strip */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="border border-[var(--hairline)] bg-[var(--bg)] p-3.5">
                <span className="block font-mono-tech text-[9px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {isEn ? 'LUMINOUS VLT' : 'TRUYỀN SÁNG VLT'}
                </span>
                <span
                  data-testid="glare-vlt-value"
                  className="mt-1 block font-serif-editorial text-2xl text-[var(--ink)]"
                >
                  {telemetry.vltPercent.toFixed(1)}%
                </span>
                <span className="font-mono-tech text-[9px] text-[var(--ink-muted)]">
                  UV400 {telemetry.uv400BlockPercent}%
                </span>
              </div>

              <div className="border border-[var(--hairline)] bg-[var(--bg)] p-3.5">
                <span className="block font-mono-tech text-[9px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {isEn ? 'SURFACE REFL.' : 'PHẢN XẠ BỀ MẶT'}
                </span>
                <span
                  data-testid="glare-reflection-value"
                  className="mt-1 block font-serif-editorial text-2xl text-[var(--ink)]"
                >
                  {telemetry.surfaceReflectionPercent.toFixed(1)}%
                </span>
                <span className="font-mono-tech text-[9px] text-[var(--olive)]">
                  {telemetry.surfaceReflectionPercent <= 0.5
                    ? isEn
                      ? 'ZERO GHOSTING'
                      : 'KHÔNG BÓNG MA'
                    : isEn
                    ? 'FRESNEL FLARE'
                    : 'CHÓI FRESNEL'}
                </span>
              </div>

              <div className="border border-[var(--hairline)] bg-[var(--bg)] p-3.5">
                <span className="block font-mono-tech text-[9px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {isEn ? 'CONTRAST GAIN' : 'TĂNG TƯƠNG PHẢN'}
                </span>
                <span
                  data-testid="glare-contrast-value"
                  className="mt-1 block font-serif-editorial text-2xl text-[var(--accent)]"
                >
                  +{telemetry.contrastAcuityGainDb.toFixed(1)} dB
                </span>
                <span className="font-mono-tech text-[9px] text-[var(--ink-muted)]">
                  HEV {telemetry.blueLightCutPercent}%
                </span>
              </div>

              <div className="border border-[var(--hairline)] bg-[var(--bg)] p-3.5">
                <span className="block font-mono-tech text-[9px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {isEn ? 'RESIDUAL GLARE' : 'CHÓI DƯ CÒN LẠI'}
                </span>
                <span
                  data-testid="glare-luminance-value"
                  className="mt-1 block font-serif-editorial text-2xl text-[var(--ink)]"
                >
                  {telemetry.residualGlareLuminanceCdM2.toLocaleString('en-US')}
                </span>
                <span className="font-mono-tech text-[9px] text-[var(--ink-muted)]">
                  cd/m² (I₀ {(telemetry.environment.baseGlareLuminanceCdM2 / 1000).toFixed(0)}k)
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: Coating Selector, Malus Law Axis Control + Curve SVG & 1-Click Apply */}
          <div className="flex flex-col justify-between gap-5 lg:col-span-5">
            {/* Optical Coating Tier Stack Selector */}
            <div className="border border-[var(--hairline)] bg-[var(--bg)] p-5">
              <div className="mb-3 flex items-center justify-between border-b border-[var(--hairline)] pb-2.5">
                <span className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink)]">
                  <Sparkles size={12} strokeWidth={1.6} className="text-[var(--accent)]" />
                  {isEn ? '01 · OPTICAL COATING ARCHITECTURE' : '01 · CẤU TRÚC LỚP PHỦ QUANG HỌC'}
                </span>
                <span className="font-mono-tech text-[9.5px] text-[var(--ink-muted)]">
                  {isEn ? '3 LAB TIERS' : '3 CẤP ĐỘ'}
                </span>
              </div>

              <div className="space-y-2.5">
                {OPTICAL_COATING_TIERS.map((tier) => {
                  const selected = tier.id === coatingId;
                  const applied = tier.id === activeOpticalCoating;
                  const previewTel = computeGlareOpticsTelemetry(
                    environmentId,
                    tier.id,
                    analyzerAngleDeg
                  );
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      data-testid={`glare-coating-${tier.id}`}
                      onClick={() => {
                        atelierAudio.playDetent();
                        setCoatingId(tier.id);
                      }}
                      className={`w-full border p-3.5 text-left transition-all ${
                        selected
                          ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                          : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--hairline-strong)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="block text-xs font-medium">{tier.label[locale]}</span>
                          <span
                            className={`mt-0.5 block font-mono-tech text-[9.5px] ${
                              selected ? 'text-[#D4B483]' : 'text-[var(--ink-muted)]'
                            }`}
                          >
                            {tier.stackSummary[locale]}
                          </span>
                        </div>
                        <div className="shrink-0 text-right font-mono-tech">
                          <span
                            className={`block text-xs font-medium ${
                              selected ? 'text-[#D4B483]' : 'text-[var(--accent)]'
                            }`}
                          >
                            -{previewTel.glareAttenuationPercent.toFixed(1)}%
                          </span>
                          <span className="block text-[9px] opacity-75">
                            {tier.surchargeUsd === 0
                              ? '+$0'
                              : `+${formatMoney(tier.surchargeUsd, currency)}`}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-current/15 pt-2 font-mono-tech text-[9px] uppercase tracking-[0.12em]">
                        <span>
                          VLT {tier.vltPercent.toFixed(1)}% · REFL {tier.surfaceReflectionPercent.toFixed(1)}%
                        </span>
                        {applied && (
                          <span className={selected ? 'text-[#D4B483]' : 'text-[var(--olive)]'}>
                            {isEn ? 'ACTIVE ON VÉRA-01' : 'ĐANG DÙNG TRÊN VÉRA-01'}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Malus's Law Polarizer Analyzer Axis Control + Live SVG Curve */}
            <div className="border border-[var(--hairline)] bg-[var(--bg)] p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--ink)]">
                  <Compass size={12} strokeWidth={1.6} className="text-[var(--accent)]" />
                  {isEn ? '02 · MALUS LAW ANALYZER AXIS (θ)' : '02 · TRỤC PHÂN TÍCH MALUS (θ)'}
                </span>
                <span
                  data-testid="glare-angle-readout"
                  className="font-mono-tech text-[11px] font-medium text-[var(--accent)]"
                >
                  θ = {analyzerAngleDeg.toFixed(0)}° · cos²θ = {telemetry.malusCosSquared.toFixed(2)}
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={90}
                step={5}
                data-testid="glare-angle-slider"
                aria-label={isEn ? 'Malus law polarization analyzer angle' : 'Góc trục phân cực Malus'}
                value={analyzerAngleDeg}
                onChange={(e) => setAnalyzerAngleDeg(Number(e.target.value))}
                className="vera-range"
              />
              <div className="mt-1 flex justify-between font-mono-tech text-[8.5px] uppercase text-[var(--ink-muted)]">
                <span>0° (Parallel · cos²=1)</span>
                <span>45° (cos²=0.5)</span>
                <span>90° (Crossed · 99.4%)</span>
              </div>

              {/* Compact Malus Curve SVG */}
              <svg
                viewBox="0 0 300 128"
                data-testid="glare-malus-svg"
                className="mt-3 h-auto w-full text-[var(--ink)]"
                role="img"
                aria-label="Malus law polarization glare attenuation curve from 0 to 90 degrees"
              >
                {[0, 50, 100].map((pct) => {
                  const y = malusY(pct);
                  return (
                    <g key={pct}>
                      <line
                        x1="36"
                        y1={y}
                        x2="284"
                        y2={y}
                        stroke="currentColor"
                        strokeOpacity={pct === 0 ? 0.35 : 0.14}
                        strokeDasharray={pct === 0 ? undefined : '3 3'}
                      />
                      <text
                        x="30"
                        y={y + 3}
                        textAnchor="end"
                        className="font-mono-tech"
                        fontSize="8"
                        fill="currentColor"
                        opacity="0.6"
                      >
                        {pct}%
                      </text>
                    </g>
                  );
                })}
                <polyline
                  points={malusPoints}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.2"
                />
                {/* Live Active Analyzer Crosshair */}
                <line
                  x1={malusX(analyzerAngleDeg)}
                  y1="18"
                  x2={malusX(analyzerAngleDeg)}
                  y2="108"
                  stroke="var(--olive)"
                  strokeDasharray="3 3"
                  strokeOpacity="0.6"
                />
                <circle
                  cx={malusX(analyzerAngleDeg)}
                  cy={malusY(telemetry.glareAttenuationPercent)}
                  r="4.5"
                  fill="var(--accent)"
                  stroke="var(--surface)"
                  strokeWidth="1.5"
                />
                {[0, 30, 45, 60, 90].map((deg) => (
                  <text
                    key={deg}
                    x={malusX(deg)}
                    y="122"
                    textAnchor="middle"
                    className="font-mono-tech"
                    fontSize="8"
                    fill="currentColor"
                    opacity="0.65"
                  >
                    {deg}°
                  </text>
                ))}
              </svg>

              {/* Clinical Optical Advisory */}
              <div className="mt-3 flex items-start gap-2 border-t border-[var(--hairline)] pt-3 text-xs leading-relaxed text-[var(--ink-muted)]">
                <ShieldCheck size={14} strokeWidth={1.6} className="mt-0.5 shrink-0 text-[var(--olive)]" />
                <span>{telemetry.clinicalAdvisory[locale]}</span>
              </div>
            </div>

            {/* 1-Click Apply Optical Coating to Active Frame */}
            <div className="border border-[var(--hairline-strong)] bg-[var(--bg)] p-4">
              <div className="mb-3 flex items-center justify-between font-mono-tech text-[10px]">
                <span className="uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {baseFrame.sku} · {telemetry.coating.badgeCode}
                </span>
                <span className="text-[var(--accent)]">
                  {telemetry.coating.surchargeUsd === 0
                    ? isEn
                      ? 'INCLUDED'
                      : 'TIÊU CHUẨN'
                    : `+${formatMoney(telemetry.coating.surchargeUsd, currency)}`}
                </span>
              </div>
              <button
                type="button"
                data-testid="glare-apply-coating-btn"
                onClick={handleApplyCoating}
                className="inline-flex w-full items-center justify-center gap-2 border border-[var(--ink)] bg-[var(--ink)] px-5 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--surface)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
              >
                {justApplied ? (
                  <>
                    <Check size={14} strokeWidth={2} />
                    {isEn ? 'Optical Coating Applied to VÉRA-01' : 'Đã Áp Dụng Lớp Phủ Lên VÉRA-01'}
                  </>
                ) : (
                  <>
                    <Sparkles size={14} strokeWidth={1.6} />
                    {isEn
                      ? 'Apply Optical Coating to Active Frame'
                      : 'Áp Dụng Lớp Phủ Quang Học Vào Gọng Đang Chọn'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PolarizedGlareLab;
