import React, { useId } from 'react';
import type { Product, ProductColorway } from '../types/commerce';

interface ProductArtProps {
  product: Product;
  colorway: ProductColorway;
  variant?: 'primary' | 'detail';
  className?: string;
}

/**
 * Chiaroscuro museum-grade procedural studio SVG artwork for all 12 MAISON VÉRA SKUs.
 * Features directional gallery spotlighting, micro-woven / brushed titanium textures,
 * specular highlights, architectural plinth drop shadows, and alternate detail zoom angles.
 */
export const ProductArt: React.FC<ProductArtProps> = ({
  product,
  colorway,
  variant = 'primary',
  className = 'h-full w-full',
}) => {
  const uid = useId().replace(/:/g, '');
  const primary = colorway.hex;
  const secondary = colorway.secondaryHex;
  const accent = colorway.accentHex;
  const isDetail = variant === 'detail';

  const gMain = `grad-main-${uid}`;
  const gSoft = `grad-soft-${uid}`;
  const gSpot = `grad-spot-${uid}`;
  const gShadow = `grad-shd-${uid}`;
  const gSheen = `grad-sheen-${uid}`;
  const pWeave = `pat-weave-${uid}`;

  return (
    <svg
      viewBox="0 0 400 480"
      className={className}
      role="img"
      aria-label={`${product.name.en} — ${colorway.name.en}`}
    >
      <defs>
        <radialGradient id={gSpot} cx="36%" cy="22%" r="76%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="58%" stopColor="#FFFFFF" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#111111" stopOpacity="0.14" />
        </radialGradient>
        <linearGradient id={gMain} x1="12%" y1="0%" x2="88%" y2="100%">
          <stop offset="0%" stopColor={primary} />
          <stop offset="52%" stopColor={primary} />
          <stop offset="100%" stopColor={secondary} />
        </linearGradient>
        <linearGradient id={gSoft} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.92" />
          <stop offset="100%" stopColor={secondary} stopOpacity="0.96" />
        </linearGradient>
        <linearGradient id={gSheen} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.34" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
        <radialGradient id={gShadow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#111111" stopOpacity="0.34" />
          <stop offset="60%" stopColor="#111111" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#111111" stopOpacity="0" />
        </radialGradient>
        <pattern id={pWeave} width="6" height="6" patternUnits="userSpaceOnUse">
          <path
            d="M0 3 H6 M3 0 V6"
            stroke="#FFFFFF"
            strokeOpacity="0.06"
            strokeWidth="0.6"
          />
        </pattern>
      </defs>

      {/* Chiaroscuro gallery light vignette & framing */}
      <rect x="20" y="20" width="360" height="440" fill={`url(#${gSpot})`} />
      <rect
        x="20"
        y="20"
        width="360"
        height="440"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.11"
        strokeWidth="1"
      />
      {/* Corner gallery registration marks */}
      <path d="M20 34 V20 H34 M366 20 H380 V34 M20 446 V460 H34 M366 460 H380 V446" fill="none" stroke="currentColor" strokeOpacity="0.24" strokeWidth="1" />

      {isDetail && (
        <>
          <line x1="200" y1="20" x2="200" y2="460" stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 5" />
          <line x1="20" y1="240" x2="380" y2="240" stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 5" />
          <circle cx="200" cy="240" r="134" fill="none" stroke="currentColor" strokeOpacity="0.08" />
        </>
      )}

      {/* Architectural double plinth shadow */}
      <ellipse cx="200" cy="426" rx={isDetail ? 104 : 122} ry="15" fill={`url(#${gShadow})`} />
      <ellipse cx="200" cy="424" rx={isDetail ? 58 : 70} ry="6" fill="#111111" fillOpacity="0.14" />

      {/* 1. Atelier Architectural Trench */}
      {product.silhouetteKey === 'trench' && (
        <g transform={isDetail ? 'translate(-22, -26) scale(1.12)' : ''}>
          <path
            d="M158 76 L242 76 L284 114 L322 252 L292 260 L264 166 L284 398 L116 398 L136 166 L108 260 L78 252 L116 114 Z"
            fill={`url(#${gMain})`}
            stroke={secondary}
            strokeWidth="1.5"
          />
          <path
            d="M158 76 L242 76 L284 114 L322 252 L292 260 L264 166 L284 398 L116 398 L136 166 L108 260 L78 252 L116 114 Z"
            fill={`url(#${pWeave})`}
          />
          <path
            d="M158 76 L242 76 L284 114 L322 252 L292 260 L264 166 L284 398 L116 398 L136 166 L108 260 L78 252 L116 114 Z"
            fill={`url(#${gSheen})`}
          />
          <path d="M158 76 L202 152 L242 76 L268 134 L204 188 L132 134 Z" fill={secondary} fillOpacity="0.62" />
          <path d="M164 76 L200 176 L144 144 Z" fill={accent} fillOpacity="0.58" />
          <path d="M236 76 L200 176 L256 144 Z" fill={accent} fillOpacity="0.35" />
          <rect x="128" y="216" width="144" height="16" fill={secondary} />
          <rect x="188" y="213" width="24" height="22" fill="none" stroke={accent} strokeWidth="2.5" />
          {[184, 258, 304].map((y) => (
            <g key={y}>
              <circle cx="178" cy={y} r="4.2" fill={accent} />
              <circle cx="222" cy={y} r="4.2" fill={accent} />
            </g>
          ))}
          <line x1="200" y1="232" x2="200" y2="398" stroke={secondary} strokeWidth="1.5" opacity="0.7" />
        </g>
      )}

      {/* 2. Brutalist Wool-Cashmere Overcoat */}
      {product.silhouetteKey === 'overcoat' && (
        <g transform={isDetail ? 'translate(-20, -22) scale(1.1)' : ''}>
          <path
            d="M154 68 L246 68 L296 106 L316 286 L284 290 L268 174 L276 410 L124 410 L132 174 L116 290 L84 286 L104 106 Z"
            fill={`url(#${gMain})`}
            stroke={secondary}
            strokeWidth="1.5"
          />
          <path
            d="M154 68 L246 68 L296 106 L316 286 L284 290 L268 174 L276 410 L124 410 L132 174 L116 290 L84 286 L104 106 Z"
            fill={`url(#${pWeave})`}
          />
          <path
            d="M154 68 L246 68 L296 106 L316 286 L284 290 L268 174 L276 410 L124 410 L132 174 L116 290 L84 286 L104 106 Z"
            fill={`url(#${gSheen})`}
          />
          <path d="M154 68 L198 198 L134 146 L146 116 Z" fill={secondary} fillOpacity="0.76" />
          <path d="M246 68 L202 198 L266 146 L254 116 Z" fill={secondary} fillOpacity="0.55" />
          <line x1="146" y1="256" x2="156" y2="314" stroke={accent} strokeWidth="2.5" />
          <line x1="254" y1="256" x2="244" y2="314" stroke={accent} strokeWidth="2.5" />
          <line x1="200" y1="196" x2="200" y2="410" stroke={accent} strokeOpacity="0.5" strokeWidth="1.5" />
          <circle cx="200" cy="224" r="5" fill={accent} />
          <circle cx="200" cy="272" r="5" fill={accent} />
        </g>
      )}

      {/* 3. Nocturne Raw-Silk Tailored Blazer */}
      {product.silhouetteKey === 'blazer' && (
        <g transform={isDetail ? 'translate(-24, -18) scale(1.12)' : ''}>
          <path
            d="M156 96 L244 96 L298 124 L318 308 L284 314 L264 196 L266 356 L206 346 L200 326 L194 346 L134 356 L136 196 L116 314 L82 308 L102 124 Z"
            fill={`url(#${gMain})`}
            stroke={secondary}
            strokeWidth="1.5"
          />
          <path
            d="M156 96 L244 96 L298 124 L318 308 L284 314 L264 196 L266 356 L206 346 L200 326 L194 346 L134 356 L136 196 L116 314 L82 308 L102 124 Z"
            fill={`url(#${gSheen})`}
          />
          <path d="M162 96 L200 236 L142 162 Z" fill={secondary} fillOpacity="0.88" />
          <path d="M238 96 L200 236 L258 162 Z" fill={secondary} fillOpacity="0.68" />
          <line x1="226" y1="184" x2="256" y2="178" stroke={accent} strokeWidth="2.5" />
          <circle cx="200" cy="248" r="5.5" fill={accent} />
          <line x1="146" y1="286" x2="180" y2="286" stroke={accent} strokeWidth="2" opacity="0.72" />
          <line x1="220" y1="286" x2="254" y2="286" stroke={accent} strokeWidth="2" opacity="0.72" />
        </g>
      )}

      {/* 4. VÉRA-01 Monolith Titanium Frame */}
      {product.silhouetteKey === 'monolith-frame' && (
        <g transform={isDetail ? 'translate(0, -10) rotate(-8 200 240) scale(1.08)' : ''}>
          <path d="M74 202 L124 148 L276 148 L326 202" fill="none" stroke={secondary} strokeWidth="4.5" opacity="0.6" />
          <rect x="64" y="190" width="272" height="8" rx="2" fill={`url(#${gMain})`} />
          <polygon
            points="68,208 98,190 166,190 186,210 178,262 152,282 96,282 72,256"
            fill={accent}
            fillOpacity="0.8"
            stroke={`url(#${gMain})`}
            strokeWidth="8"
          />
          <polygon
            points="214,210 234,190 302,190 332,208 328,256 304,282 248,282 222,262"
            fill={accent}
            fillOpacity="0.8"
            stroke={`url(#${gMain})`}
            strokeWidth="8"
          />
          <rect x="184" y="218" width="32" height="8" rx="2" fill={`url(#${gMain})`} />
          <line x1="94" y1="264" x2="146" y2="204" stroke="#FFFFFF" strokeOpacity="0.42" strokeWidth="6" />
          <line x1="240" y1="264" x2="292" y2="204" stroke="#FFFFFF" strokeOpacity="0.42" strokeWidth="6" />
          <text x="200" y="344" textAnchor="middle" fill="currentColor" fillOpacity="0.5" fontSize="10" fontFamily="JetBrains Mono, monospace">
            51 □ 21 — 145 · TI-GR5
          </text>
        </g>
      )}

      {/* 5. Solaire Sculpted Bridge Shield */}
      {product.silhouetteKey === 'solaire-shield' && (
        <g transform={isDetail ? 'translate(0, -8) rotate(7 200 240) scale(1.08)' : ''}>
          <path
            d="M66 196 Q200 174 334 196 L322 268 Q266 286 218 258 L200 242 L182 258 Q134 286 78 268 Z"
            fill={accent}
            fillOpacity="0.85"
            stroke={`url(#${gMain})`}
            strokeWidth="5"
          />
          <path d="M62 184 Q200 164 338 184" fill="none" stroke={`url(#${gMain})`} strokeWidth="8.5" strokeLinecap="round" />
          <line x1="176" y1="176" x2="176" y2="194" stroke={`url(#${gMain})`} strokeWidth="3.5" />
          <line x1="224" y1="176" x2="224" y2="194" stroke={`url(#${gMain})`} strokeWidth="3.5" />
          <path d="M88 212 Q200 198 312 212" fill="none" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="5.5" />
          <text x="200" y="344" textAnchor="middle" fill="currentColor" fillOpacity="0.5" fontSize="10" fontFamily="JetBrains Mono, monospace">
            ZEISS BASE-4 SHIELD · 21G
          </text>
        </g>
      )}

      {/* 6. Archival Acetate Optical 04 */}
      {product.silhouetteKey === 'archival-optical' && (
        <g transform={isDetail ? 'translate(0, -8) rotate(-6 200 240) scale(1.08)' : ''}>
          <path
            d="M70 196 Q130 182 184 196 L184 260 Q130 288 76 262 Z"
            fill="#FFFFFF"
            fillOpacity="0.22"
            stroke={`url(#${gMain})`}
            strokeWidth="13.5"
            strokeLinejoin="round"
          />
          <path
            d="M216 196 Q270 182 330 196 L324 262 Q270 288 216 260 Z"
            fill="#FFFFFF"
            fillOpacity="0.22"
            stroke={`url(#${gMain})`}
            strokeWidth="13.5"
            strokeLinejoin="round"
          />
          <path d="M180 212 Q200 198 220 212" fill="none" stroke={`url(#${gMain})`} strokeWidth="11" strokeLinecap="round" />
          <circle cx="80" cy="208" r="2.6" fill={accent} />
          <circle cx="86" cy="208" r="2.6" fill={accent} />
          <circle cx="320" cy="208" r="2.6" fill={accent} />
          <circle cx="314" cy="208" r="2.6" fill={accent} />
          <text x="200" y="344" textAnchor="middle" fill="currentColor" fillOpacity="0.5" fontSize="10" fontFamily="JetBrains Mono, monospace">
            8MM TAKIRON ACETATE · 47 □ 22
          </text>
        </g>
      )}

      {/* 7. Monolith Box-Calf Architectural Tote */}
      {product.silhouetteKey === 'architectural-tote' && (
        <g transform={isDetail ? 'translate(-14, -14) scale(1.08)' : ''}>
          <path d="M148 176 L148 112 Q148 86 200 86 Q252 86 252 112 L252 176" fill="none" stroke={secondary} strokeWidth="11" />
          <path d="M148 176 L148 112 Q148 86 200 86 Q252 86 252 112 L252 176" fill="none" stroke={primary} strokeWidth="7" />
          <polygon points="94,174 306,174 288,396 112,396" fill={`url(#${gMain})`} stroke={secondary} strokeWidth="2" />
          <polygon points="94,174 306,174 288,396 112,396" fill={`url(#${gSheen})`} />
          <polygon points="94,174 134,174 122,396 112,396" fill={secondary} fillOpacity="0.58" />
          <polygon points="266,174 306,174 288,396 278,396" fill={secondary} fillOpacity="0.45" />
          <line x1="100" y1="226" x2="300" y2="226" stroke={accent} strokeWidth="2" strokeOpacity="0.78" />
          <rect x="184" y="218" width="32" height="16" rx="2" fill={accent} />
          <text x="200" y="366" textAnchor="middle" fill={accent} fillOpacity="0.85" fontSize="9" letterSpacing="3" fontFamily="JetBrains Mono, monospace">
            MAISON VÉRA
          </text>
          <rect x="128" y="396" width="12" height="6" fill={accent} />
          <rect x="260" y="396" width="12" height="6" fill={accent} />
        </g>
      )}

      {/* 8. Nomad Full-Grain Weekender 48H */}
      {product.silhouetteKey === 'weekender-48h' && (
        <g transform={isDetail ? 'translate(-12, -10) scale(1.07)' : ''}>
          <path d="M72 232 Q200 112 328 232" fill="none" stroke={secondary} strokeWidth="7" strokeDasharray={isDetail ? '6 4' : undefined} />
          <path d="M156 206 L156 154 Q200 132 244 154 L244 206" fill="none" stroke={primary} strokeWidth="10" strokeLinecap="round" />
          <rect x="66" y="202" width="268" height="184" rx="22" fill={`url(#${gMain})`} stroke={secondary} strokeWidth="2" />
          <rect x="66" y="202" width="268" height="184" rx="22" fill={`url(#${gSheen})`} />
          <rect x="132" y="202" width="20" height="184" fill={secondary} fillOpacity="0.68" />
          <rect x="248" y="202" width="20" height="184" fill={secondary} fillOpacity="0.68" />
          <line x1="78" y1="224" x2="322" y2="224" stroke={accent} strokeWidth="3.5" strokeDasharray="4 2" />
          <rect x="192" y="218" width="16" height="12" rx="2" fill={accent} />
          <rect x="251" y="246" width="14" height="36" rx="2" fill={accent} />
        </g>
      )}

      {/* 9. Cast Travertine & Bronze Incense Vessel */}
      {product.silhouetteKey === 'bronze-vessel' && (
        <g transform={isDetail ? 'translate(-14, -18) scale(1.08)' : ''}>
          <path d="M200 144 C188 112, 214 96, 198 62" fill="none" stroke="currentColor" strokeOpacity="0.32" strokeWidth="2" strokeLinecap="round" />
          <path d="M126 244 A74 74 0 0 1 274 244 Z" fill={`url(#${gSoft})`} stroke={accent} strokeWidth="1.5" />
          <path d="M126 244 A74 74 0 0 1 274 244 Z" fill={`url(#${gSheen})`} />
          {[168, 184, 200, 216, 232].map((cx) => (
            <circle key={cx} cx={cx} cy="206" r="3" fill="#111111" fillOpacity="0.48" />
          ))}
          <circle cx="200" cy="186" r="3.5" fill="#111111" fillOpacity="0.54" />
          <rect x="116" y="244" width="168" height="156" rx="4" fill={`url(#${gMain})`} stroke={secondary} strokeWidth="1.5" />
          <rect x="116" y="244" width="168" height="156" rx="4" fill={`url(#${gSheen})`} />
          <line x1="124" y1="286" x2="276" y2="286" stroke={secondary} strokeWidth="2" opacity="0.42" />
          <line x1="124" y1="334" x2="246" y2="334" stroke={secondary} strokeWidth="1.5" opacity="0.36" />
          <line x1="154" y1="364" x2="276" y2="364" stroke={secondary} strokeWidth="2" opacity="0.32" />
        </g>
      )}

      {/* 10. Brushed Steel Desk Monolith Tray */}
      {product.silhouetteKey === 'steel-tray' && (
        <g transform={isDetail ? 'translate(-10, -14) scale(1.07)' : ''}>
          <polygon points="74,234 200,168 326,234 200,302" fill={`url(#${gMain})`} stroke={secondary} strokeWidth="2" />
          <polygon points="74,234 200,168 326,234 200,302" fill={`url(#${gSheen})`} />
          <polygon points="104,234 200,184 296,234 200,284" fill={secondary} fillOpacity="0.58" stroke={accent} strokeWidth="1.2" />
          <line x1="158" y1="208" x2="242" y2="258" stroke={`url(#${gMain})`} strokeWidth="8" />
          <polygon points="74,234 200,302 200,334 74,266" fill={secondary} />
          <polygon points="326,234 200,302 200,334 326,266" fill={primary} />
          <polyline points="78,268 200,336 322,268" fill="none" stroke="#8C6239" strokeWidth="4" />
        </g>
      )}

      {/* 11 & 12. Grasse Apothecary Extrait Flacons */}
      {(product.silhouetteKey === 'hinoki-extrait' || product.silhouetteKey === 'fig-extrait') && (
        <g transform={isDetail ? 'translate(-16, -18) scale(1.08)' : ''}>
          <rect x="160" y="96" width="80" height="62" rx="3" fill={accent} stroke={secondary} strokeWidth="1.5" />
          <rect x="182" y="158" width="36" height="16" fill={secondary} />
          <rect
            x="118"
            y="174"
            width="164"
            height="228"
            rx="10"
            fill={`url(#${gMain})`}
            fillOpacity="0.9"
            stroke={secondary}
            strokeWidth="2"
          />
          <rect x="118" y="174" width="164" height="228" rx="10" fill={`url(#${gSheen})`} />
          <rect x="122" y="376" width="156" height="22" rx="4" fill="#FFFFFF" fillOpacity="0.28" />
          <rect x="142" y="218" width="116" height="132" fill="#F6F3ED" stroke="#111111" strokeOpacity="0.18" />
          <text x="200" y="246" textAnchor="middle" fill="#111111" fontSize="9" letterSpacing="2.4" fontFamily="JetBrains Mono, monospace">
            MAISON VÉRA
          </text>
          <line x1="162" y1="258" x2="238" y2="258" stroke="#111111" strokeOpacity="0.22" />
          <text x="200" y="286" textAnchor="middle" fill="#111111" fontSize="22" fontStyle="italic" fontFamily="Cormorant Garamond, serif">
            {product.silhouetteKey === 'hinoki-extrait' ? 'N° 01' : 'N° 04'}
          </text>
          <text x="200" y="308" textAnchor="middle" fill="#6B655E" fontSize="7.5" letterSpacing="1.6" fontFamily="JetBrains Mono, monospace">
            {product.silhouetteKey === 'hinoki-extrait' ? 'HINOKI · CONCRETE' : 'SMOKED FIG · LEATHER'}
          </text>
          <text x="200" y="334" textAnchor="middle" fill="#111111" fontSize="7" letterSpacing="1.4" fontFamily="JetBrains Mono, monospace">
            EXTRAIT · 100ML
          </text>
        </g>
      )}
    </svg>
  );
};
