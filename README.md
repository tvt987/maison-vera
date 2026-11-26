# MAISON VERA v3.0 — Real-Photography Luxury E-Commerce Flagship

Editorial luxury storefront combining **16 Hasselblad medium-format WebP studio photographs** with an **interactive Three.js PBR + Exploded CAD 3D Studio** for Architectural Fashion, CNC-Milled Grade-5 Titanium Eyewear, Saddle-Stitched Leather Goods, Home Objects, and Grasse Extrait de Parfum.

Designed and built by **Truong Van Tinh (`tvt987`)**.

## Core v3.0 Flagship Highlights

1. **Dual-Stage Hero Showcase (`Campaign Editorial` <-> `3D Interactive CAD`)**
   - Opens with full-bleed `hero_eyewear_editorial.webp` (subtle Ken Burns breathing motion, mouse parallax depth, warm vignette, and lens/chassis spec telemetry).
   - 1-click transition (or clicking any Camera Preset / Lighting Mood) seamlessly crossfades into the live **Three.js PBR `VÉRA-01 MONOLITH FRAME`** studio with 7-segment CNC bevels, precision 5-barrel metal hinges, physical refractive iridescent CR-39 lenses (`ior: 1.52`, `iridescence: 0.35`), Roman travertine plinth with caustic glow, **4 Animated Camera Presets** (`3/4 Runway`, `Hinge Macro`, `Lens Optics`, `Exploded Assembly`), and **4 Studio Lighting Moods**.

2. **12-SKU Real Studio Photography Catalog + Multi-View Quick-View & 2.2x Optical Loupe**
   - Every SKU renders bespoke Hasselblad WebP studio photography (`prod_*.webp`, SVG fallback only on error) with macro crop on hover, optical colorway grade shifts, 3D magnetic perspective tilt glare, Quick-Add Size Bar, and Side-by-Side Comparison Matrix.
   - `ProductQuickView` includes a **Multi-View Thumbnail Rail** (`Studio Full`, `Material Macro`, `Light Study`, + `3D Interactive` for `MV-EYE-01`), **2.2x Real-Photo Optical Loupe Magnifier**, Size/Fit Estimator, **Verified Collector Reviews (4.9/5)** with Fit Consensus bar, and **Global Boutique Stock Matrix** (*Paris Le Marais*, *Tokyo Aoyama*, *Saigon Dong Khoi*, *Online Atelier Vault*).

3. **Real High-Fashion Campaign Lookbooks — "Shop The Look" Hotspots**
   - 3 full-bleed Parisian campaign plates (`lookbook_01_autumn.webp`, `lookbook_02_travel.webp`, `lookbook_03_nocturne.webp`) with GSAP shutter unveil, pulsing glass hotspot pins positioned on the photographed garments/accessories, and 1-click `-10%` Lookbook Bundle Drawer.

4. **Bespoke Foil Monogram Studio, AI Atelier Stylist (-12%), Private Vault (`PRIVATE10`) & 3-Step Checkout**
   - Live foil-stamped 1-4 letter monogram (`24K Gold Foil`, `Blind Deboss`, `Silver Leaf`, `Terracotta Ink`) persisted through Bag, Checkout, and Official Printed Invoice.
   - Client-side deterministic **AI Atelier Stylist** curating 3-piece wardrobes (`-12%`), **Private Vault** email invitation issuing working member code `PRIVATE10` (`-10%`), idempotent promo engine (`VERA15`, `ATELIER50`, `VIP200`, `PRIVATE10`), optional Web Audio tactile cues, View Transitions API circular theme wipe (`Archival Paper` <-> `Nocturne Dark`), live `USD $ <-> VND ₫` & `EN / VI` switching, and Zod-validated 3-step Checkout minting `MV-2026-XXXX` receipts.

## Local Development & Verification

```bash
npm ci
npm test
npm run build
npm run preview
```

## CI / CD (GitHub Pages)

Configured with `.github/workflows/ci-and-deploy.yml` (Node 22): runs `npm ci`, `npm test`, `npm run build` (`tsc -b && vite build`), copies `dist/index.html` to `dist/404.html`, and deploys automatically to `/maison-vera/`.
