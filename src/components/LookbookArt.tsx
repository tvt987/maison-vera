import React, { useId } from 'react';
import type { LookbookPlate } from '../types/commerce';

interface LookbookArtProps {
  artKey: LookbookPlate['artKey'];
}

/**
 * Museum-grade architectural editorial lookbook compositions matching hotspot coordinates.
 */
export const LookbookArt: React.FC<LookbookArtProps> = ({ artKey }) => {
  const uid = useId().replace(/:/g, '');

  if (artKey === 'autumn-architecture') {
    return (
      <svg viewBox="0 0 600 760" className="h-full w-full object-cover" role="img" aria-label="Look 01 Autumn Architecture">
        <defs>
          <linearGradient id={`bg1-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ECE6DC" />
            <stop offset="100%" stopColor="#D7CEC0" />
          </linearGradient>
          <linearGradient id={`trench-${uid}`} x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#C8B9A2" />
            <stop offset="100%" stopColor="#9A886F" />
          </linearGradient>
        </defs>
        <rect width="600" height="760" fill={`url(#bg1-${uid})`} />
        {/* Brutalist limestone gallery colonnade */}
        <rect x="44" y="42" width="110" height="676" fill="#DDD4C6" />
        <rect x="478" y="42" width="78" height="676" fill="#D0C6B6" />
        <polygon points="154,42 478,42 392,260 154,260" fill="#F4EFE6" fillOpacity="0.65" />
        <line x1="0" y1="646" x2="600" y2="646" stroke="#111111" strokeOpacity="0.14" />

        {/* Architectural shadow */}
        <ellipse cx="304" cy="672" rx="146" ry="20" fill="#111111" fillOpacity="0.14" />

        {/* Editorial sculpted silhouette figure */}
        {/* Head & VÉRA-01 Titanium Eyewear (y ~ 20%) */}
        <circle cx="290" cy="146" r="34" fill="#2A2622" />
        <rect x="260" y="138" width="26" height="14" rx="2" fill="#B86B2B" stroke="#D5D3CC" strokeWidth="2.5" />
        <rect x="294" y="138" width="26" height="14" rx="2" fill="#B86B2B" stroke="#D5D3CC" strokeWidth="2.5" />
        <line x1="258" y1="138" x2="322" y2="138" stroke="#D5D3CC" strokeWidth="2.5" />

        {/* Cantilevered Trench Coat (y ~ 47%) */}
        <path
          d="M242 198 L338 198 L398 242 L422 440 L376 446 L362 326 L388 614 L196 614 L222 326 L196 446 L156 436 L184 242 Z"
          fill={`url(#trench-${uid})`}
          stroke="#6F614E"
          strokeWidth="1.5"
        />
        <path d="M242 198 L290 294 L338 198 L368 264 L290 326 L212 264 Z" fill="#8C7B63" fillOpacity="0.5" />
        <rect x="210" y="378" width="160" height="18" fill="#6F614E" />
        <rect x="278" y="375" width="24" height="24" fill="none" stroke="#111111" strokeWidth="2.5" />

        {/* Legs */}
        <rect x="242" y="614" width="32" height="58" fill="#1E1E20" />
        <rect x="306" y="614" width="32" height="58" fill="#1E1E20" />

        {/* Monolith Box-Calf Tote held right (x ~ 69%, y ~ 72%) */}
        <g transform="translate(358, 464)">
          <path d="M30 48 L30 16 Q56 0 82 16 L82 48" fill="none" stroke="#111111" strokeWidth="6" />
          <polygon points="8,48 104,48 96,158 16,158" fill="#1B1B1E" stroke="#3B3B40" strokeWidth="1.5" />
          <line x1="12" y1="78" x2="100" y2="78" stroke="#B84A27" strokeWidth="2" />
        </g>

        {/* Plate registration stamp */}
        <text x="58" y="728" fill="#111111" fillOpacity="0.55" fontSize="11" letterSpacing="3" fontFamily="JetBrains Mono, monospace">
          FIG. 01 · PALAIS DE TOKYO · AUTUMN ARCHIVE
        </text>
      </svg>
    );
  }

  if (artKey === 'brutalist-travel') {
    return (
      <svg viewBox="0 0 600 760" className="h-full w-full object-cover" role="img" aria-label="Look 02 Brutalist Travel">
        <defs>
          <linearGradient id={`bg2-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#DDD9D1" />
            <stop offset="100%" stopColor="#B9B3A9" />
          </linearGradient>
          <linearGradient id={`coat2-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A64A2C" />
            <stop offset="100%" stopColor="#722E18" />
          </linearGradient>
        </defs>
        <rect width="600" height="760" fill={`url(#bg2-${uid})`} />
        {/* Terminal concrete diagonal skylight */}
        <polygon points="0,0 600,0 600,240 0,430" fill="#ECEAE4" fillOpacity="0.52" />
        <line x1="0" y1="430" x2="600" y2="240" stroke="#111111" strokeOpacity="0.16" strokeWidth="1.5" />
        <line x1="0" y1="650" x2="600" y2="650" stroke="#111111" strokeOpacity="0.16" />

        {/* Brutalist ground shadow */}
        <ellipse cx="308" cy="676" rx="172" ry="22" fill="#111111" fillOpacity="0.16" />

        {/* Figure + Solaire Bridge Shield (y ~ 21%) */}
        <circle cx="308" cy="154" r="34" fill="#1E1E22" />
        <path d="M272 146 Q308 136 344 146 L338 164 Q308 172 278 164 Z" fill="#3B291D" stroke="#D1B073" strokeWidth="2.5" />

        {/* Terracotta Brutalist Wool-Cashmere Overcoat (y ~ 48%) */}
        <path
          d="M254 204 L362 204 L418 248 L434 452 L390 458 L374 332 L386 626 L218 626 L232 332 L212 458 L174 452 L196 248 Z"
          fill={`url(#coat2-${uid})`}
          stroke="#592211"
          strokeWidth="1.5"
        />
        <path d="M254 204 L306 326 L234 274 Z" fill="#692A16" />
        <path d="M362 204 L310 326 L382 274 Z" fill="#5D2412" />
        <line x1="308" y1="322" x2="308" y2="626" stroke="#D4B483" strokeOpacity="0.45" strokeWidth="1.5" />

        {/* Nomad 48H Tuscan Bridle Weekender (x ~ 66%, y ~ 76%) */}
        <g transform="translate(310, 514)">
          <path d="M56 36 L56 12 Q88 -4 120 12 L120 36" fill="none" stroke="#232E25" strokeWidth="7" />
          <rect x="8" y="34" width="162" height="114" rx="16" fill="#364538" stroke="#1E281F" strokeWidth="2" />
          <rect x="46" y="34" width="14" height="114" fill="#232E25" />
          <rect x="118" y="34" width="14" height="114" fill="#232E25" />
          <line x1="16" y1="50" x2="162" y2="50" stroke="#D1B073" strokeWidth="3" strokeDasharray="4 2" />
        </g>

        <text x="58" y="728" fill="#111111" fillOpacity="0.58" fontSize="11" letterSpacing="3" fontFamily="JetBrains Mono, monospace">
          FIG. 02 · CDG TERMINAL 01 · BRUTALIST TRANSIT
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 600 760" className="h-full w-full object-cover" role="img" aria-label="Look 03 Nocturne Salon">
      <defs>
        <linearGradient id={`bg3-${uid}`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#1B1B20" />
          <stop offset="100%" stopColor="#0E0E12" />
        </linearGradient>
        <radialGradient id={`glow3-${uid}`} cx="52%" cy="32%" r="55%">
          <stop offset="0%" stopColor="#D4B483" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0E0E12" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="600" height="760" fill={`url(#bg3-${uid})`} />
      <rect width="600" height="760" fill={`url(#glow3-${uid})`} />

      {/* Travertine plinth gallery pedestal */}
      <rect x="74" y="544" width="452" height="148" fill="#262422" stroke="#D4B483" strokeOpacity="0.2" />
      <line x1="74" y1="544" x2="526" y2="544" stroke="#D4B483" strokeOpacity="0.38" />

      {/* Nocturne Raw-Silk Blazer displayed on architectural form (x ~ 42%, y ~ 40%) */}
      <g transform="translate(116, 138)">
        <path
          d="M94 36 L178 36 L236 68 L254 276 L218 282 L200 162 L202 362 L144 348 L136 322 L128 348 L70 362 L72 162 L54 282 L18 276 L36 68 Z"
          fill="#15161A"
          stroke="#D4B483"
          strokeOpacity="0.4"
          strokeWidth="1.5"
        />
        <path d="M98 36 L136 186 L78 112 Z" fill="#22232A" />
        <path d="M174 36 L136 186 L194 112 Z" fill="#1D1E24" />
        <circle cx="136" cy="202" r="5" fill="#D4B483" />
      </g>

      {/* Cast Travertine & Bronze Incense Vessel on right pedestal (x ~ 68%, y ~ 66%) */}
      <g transform="translate(352, 434)">
        <path d="M56 32 C48 12, 66 4, 54 -22" fill="none" stroke="#F4EFE6" strokeOpacity="0.36" strokeWidth="2" />
        <path d="M16 74 A40 40 0 0 1 96 74 Z" fill="#A67C46" />
        <rect x="10" y="74" width="92" height="86" rx="2" fill="#D4C8B4" />
        <line x1="16" y1="104" x2="96" y2="104" stroke="#A69882" strokeWidth="2" />
      </g>

      {/* N°01 Hinoki & Wet Concrete Extrait on left pedestal (x ~ 29%, y ~ 74%) */}
      <g transform="translate(128, 492)">
        <rect x="28" y="0" width="36" height="28" fill="#D8CEBE" />
        <rect x="10" y="34" width="72" height="104" rx="4" fill="#465647" stroke="#D4B483" strokeOpacity="0.45" />
        <rect x="20" y="54" width="52" height="62" fill="#F6F3ED" />
        <text x="46" y="88" textAnchor="middle" fill="#111111" fontSize="13" fontStyle="italic" fontFamily="Cormorant Garamond, serif">
          N°01
        </text>
      </g>

      <text x="58" y="728" fill="#F4EFE6" fillOpacity="0.55" fontSize="11" letterSpacing="3" fontFamily="JetBrains Mono, monospace">
        FIG. 03 · VILLA NECCHI · NOCTURNE SALON
      </text>
    </svg>
  );
};
