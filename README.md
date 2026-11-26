# MAISON VERA v2.0 — Architectural Luxury E-Commerce Flagship

Editorial luxury storefront engineered for Architectural Fashion, CNC-Milled Grade-5 Titanium Eyewear, Saddle-Stitched Leather Goods, Home Objects, and Grasse Extrait de Parfum.

Designed and built by **Truong Van Tinh (`tvt987`)**.

## Core v2.0 Architectural Highlights

1. **Photorealistic Three.js 3D Titanium Eyewear Studio (`VÉRA-01 MONOLITH FRAME`)**
   - Procedural Grade-5 Japanese titanium eyewear with curved 7-segment CNC bevels, precision 5-barrel cylindrical metal hinges, ergonomic contrast ear-tip sleeves, nose-pad arms, and physical refractive CR-39 lenses (`transmission`, `ior: 1.52`, `clearcoat: 1.0`, `iridescence: 0.35`) floating above a sculpted Roman travertine plinth with animated caustic lens glow.
   - **4 Animated Camera Presets** (`3/4 Runway`, `Hinge Macro`, `Lens Optics`, **`Exploded Assembly`** with 3D sub-assembly separation and engineering callout badges) + **4 Real-Time Studio Lighting Moods** (`Parisian Morning`, `Golden Atelier`, `Gallery Spot`, `Nocturne Neon`).
   - Instant frame finish & lens tint configurator + SVG fallback if WebGL is unavailable.

2. **Live Bespoke Monogram & Foil-Stamping Studio**
   - Optional 1-4 letter personalized monogram with 4 metallic/debossed foil finishes (`24K Gold Foil`, `Blind Deboss`, `Silver Leaf`, `Terracotta Ink`) and live interactive foil-stamped plate preview across Hero & Quick-View, persisted end-to-end into Shopping Bag, Checkout, and Official Printed Invoice.

3. **AI Atelier Concierge / Outfit Stylist Drawer (Client-Side Deterministic, EN & VI)**
   - Curates tailored 3-piece wardrobes by Occasion, Palette Tone, and Budget Tier with streaming editorial rationale, material pairing dossier, automatic **-12% Stylist Wardrobe Bundle** pricing, and 1-click wardrobe addition to Bag.

4. **Chiaroscuro Product Cards, 3D Magnetic Tilt Glare, 2.2x Loupe & Side-by-Side Comparison**
   - 12 curated SKUs across 5 categories with chiaroscuro gallery SVG artwork, dual-angle hover swap, 3D magnetic perspective tilt + specular light sheen, Quick-Add Size Bar, Quick-View **2.2x Studio Detail Loupe**, and up-to-3 **Side-by-Side Atelier Comparison Matrix**.

5. **Craftsmanship Chronology, Tactile Atelier Audio & 3-Step Concierge Checkout**
   - 4-stage Manufacturing Chronology Strip (`Sabae` -> `Florence` -> `Grasse` -> `Paris`), optional Web Audio synthesized tactile mechanical detent/shutter cues (muted by default), View Transitions API circular wipe (`Archival Paper` <-> `Nocturne Dark`), live `USD $ <-> VND ₫` & `EN / VI` switching, Lookbook `-10%` bundles, idempotent promo engine (`VERA15`, `ATELIER50`, `VIP200`), and Zod-validated 3-step checkout minting `MV-2026-XXXX` receipts with SVG barcode/QR seal.

## Technology Stack

- **Frontend**: React 19, TypeScript 5.7, Vite 6, Tailwind CSS v4
- **3D, Audio & Motion**: Three.js (`RoomEnvironment` PBR), Web Audio API, GSAP ScrollTrigger, Lenis Smooth Scroll, View Transitions API
- **Validation & Testing**: Zod, Vitest, Lucide React

## Local Development & Verification

```bash
npm ci
npm test
npm run build
npm run preview
```

## CI / CD (GitHub Pages)

Configured with `.github/workflows/ci-and-deploy.yml` (Node 22): runs `npm ci`, `npm test`, `npm run build` (`tsc -b && vite build`), copies `dist/index.html` to `dist/404.html`, and deploys automatically to `/maison-vera/`.
