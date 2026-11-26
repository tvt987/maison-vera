# MAISON VERA — Architectural Luxury E-Commerce Flagship

Editorial luxury storefront engineered for Architectural Fashion, CNC-Milled Grade-5 Titanium Eyewear, Saddle-Stitched Leather Goods, Home Objects, and Grasse Extrait de Parfum.

Designed and built by **Truong Van Tinh (`tvt987`)**.

## Core Architectural Highlights

1. **Interactive Three.js PBR Eyewear Showcase (`VÉRA-01 MONOLITH FRAME`)**
   - Procedural 3D titanium architectural sunglasses rendered with `RoomEnvironment` IBL lighting, procedural brushed-titanium roughness/bump texture, CNC-beveled octagonal rims, milled nose bridge, micro-rivets, and translucent PBR optical lenses.
   - Live frame finish (`Raw Titanium`, `Warm Gold`, `Matte Noir`) and lens tint (`Smoked Amber`, `Obsidian Polarized`, `Olive Mineral`, `Rose Quartz`) configurator with smooth drag-to-orbit, scroll-reactive tilt, and 1-click Hero Edition Add-to-Bag.
   - Automatic clean SVG fallback if WebGL is unavailable.

2. **Parisian Archival Paper & Nocturne Runway Dark (View Transitions API Circular Wipe)**
   - Default warm archival paper palette (`#F6F3ED` alabaster, `#FDFBF7` elevated ivory, `#111111` jet ink, `#B84A27` terracotta sienna, `#3A4A3D` deep olive) transitioning via circular radial `document.startViewTransition` clip-path wipe into Nocturne Runway Dark (`#0B0B0D` carbon + `#D4B483` champagne gold).

3. **Editorial Lookbook — "Shop The Look" Hotspots & Curated Bundle Engine**
   - 3 bespoke museum-grade editorial plates (*Look 01: Autumn Architecture*, *Look 02: Brutalist Travel*, *Look 03: Nocturne Salon*) with pulsing numbered hotspot pins (`01`, `02`, `03`).
   - Dedicated Lookbook Bundle Drawer allowing per-piece sizing/colorway customization and 1-click 3-piece bag addition triggering an automatic `-10%` bundle privilege.

4. **12-SKU Multi-Category Storefront & Faceted Search**
   - 12 curated SKUs across 5 categories (`Outerwear`, `Eyewear`, `Leather Goods`, `Objects`, `Fragrance`) with bespoke dual-angle procedural studio SVG artwork that adapts dynamically to colorway swatches.
   - Quick-Add Size Bar on card hover, Wishlist drawer, Recently Viewed persistence, `CMD+K` Global Product & Command Search, live `USD $ / VND ₫` currency switching, bilingual `EN / VI` localization, and Product Quick-View with interactive height/weight Size & Fit Estimator.

5. **Production Shopping Bag, Idempotent Promo Engine & 3-Step Concierge Checkout**
   - Free DHL Express Courier progress bar (`$350` threshold), Atelier Gift Wrapping (`+$18` embossed cotton dustbag + custom gift note), automatic Lookbook bundle detection, and idempotent promo codes (`VERA15`, `ATELIER50`, `VIP200`) with duplicate, invalid, and minimum-spend guardrails.
   - Zod-validated 3-step checkout (`Delivery` -> `Settlement` with live metallic card preview / Apple Pay Express / B2B Invoice -> `Confirmed Order` with live dispatch timeline, deterministic `MV-2026-XXXX` Order ID, SVG barcode/QR seal, and printable invoice).

## Technology Stack

- **Frontend**: React 19, TypeScript 5.7, Vite 6, Tailwind CSS v4
- **3D & Motion**: Three.js (`RoomEnvironment` PBR), GSAP ScrollTrigger, Lenis Inertial Smooth Scroll, View Transitions API
- **Validation & Testing**: Zod, Vitest, Lucide React

## Local Development & Verification

```bash
npm ci
npm test
npm run build
npm run preview
```

## CI / CD (GitHub Pages)

Configured with `.github/workflows/ci-and-deploy.yml` (Node 22): installs via `npm ci`, executes `npm test`, runs `tsc -b && vite build`, copies `dist/index.html` to `dist/404.html`, and deploys automatically to `/maison-vera/`.
