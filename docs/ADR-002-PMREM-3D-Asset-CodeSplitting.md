# ADR-002: Procedural PMREM HDRI Lighting & Aggressive Route/Studio Code-Splitting

- **Status:** Accepted
- **Date:** 2026-11-28
- **Decision Makers:** Truong Van Tinh (`tvt987`), Principal Solution Architect
- **Scope:** Frontend Bundle Architecture (`vite.config.ts`, `src/App.tsx`, `src/components/Eyewear3DCanvas.tsx`)

---

## 1. Context & Problem Statement

In Maison Véra v4.0, production builds produced a monolithic **`595.25 kB` (`175.78 kB` gzip)** main entry bundle (`index-*.js`) alongside a **`503.60 kB`** Three.js chunk that was eagerly imported at startup through `HeroShowcase.tsx` and `ProductQuickView.tsx`. Two architectural bottlenecks emerged:

1. **Initial Paint & Hydration Overhead:** Visitors landing on the default Hasselblad medium-format editorial hero (`hero_eyewear_editorial.webp`) were forced to download and parse modals (`CheckoutModal`, `ProductQuickView`, `CompareDockModal`, `VipLookbookDrawer`), optical labs (`BespokeSizingLab`, `OpticalRxLab`), and the entire `Three.js` WebGL runtime before interacting with the page.
2. **External HDRI Asset Risk & CSP Compliance:** Loading external `.hdr` or `.exr` equirectangular environment maps (`2–8 MB` each) from third-party CDNs violates Maison Véra's strict `Content-Security-Policy` (`default-src 'self'`), introduces flaky network dependencies on GitHub Pages, and stalls first-frame 3D specular rendering.

---

## 2. Decision

### 2.1 Procedural In-Memory PMREM HDRI Studio (`Eyewear3DCanvas.tsx`)
Instead of fetching external `.hdr` textures, we synthesize a physical **Parisian Boutique Softbox Studio** directly inside an offscreen `THREE.Scene` using calibrated HDR emissive panels (overhead softbox canopy, champagne left key strip, alabaster right kicker, rear rim ribbon, and warm travertine floor reflector), then bake it on the GPU via `THREE.PMREMGenerator.fromScene(envScene, 0.028)` across all 4 studio lighting moods (`morning`, `golden`, `gallery`, `nocturne`).

- **Zero external network requests** (`0 KB` HDRI download, 100% offline/CSP compliant).
- **Deterministic GPU disposal:** Previous `WebGLRenderTarget` and temporary geometries/materials are explicitly disposed on mood transitions and unmount to guarantee zero WebGL memory leaks.

### 2.2 Conditional `React.lazy` Splitting + Deterministic Rollup `manualChunks`
We refactored `src/App.tsx`, `src/components/HeroShowcase.tsx`, `src/components/ProductQuickView.tsx`, and `vite.config.ts`:

1. **On-Demand 3D WebGL Boundary:** `Eyewear3DCanvas` is wrapped in `React.lazy` inside both `HeroShowcase` and `ProductQuickView`, mounted strictly when `stageMode === '3d'` or `galleryView === '3d'`. The `503.60 kB` `three` chunk is **never fetched** on initial editorial page load.
2. **Conditional Modal/Drawer Mounting:** `CheckoutModal`, `CompareDockModal`, `VipLookbookDrawer`, `ProductQuickView`, `AtelierStylistDrawer`, `BagDrawer`, `CommandSearchModal`, `LookbookDrawer`, and `WishlistDrawer` are lazy-loaded and conditionally rendered only when active (`checkoutOpen`, `compareIds.length > 0`, etc.).
3. **Section-Level Lazy Labs:** `BespokeSizingLab`, `OpticalRxLab`, `EditorialLookbook`, and `CatalogSection` load through non-blocking `<Suspense>` boundaries.
4. **Function-Based Rollup `manualChunks(id)`:** Replaces static array matching (which missed React 19 sub-entries such as `react-dom/client` and `scheduler`) with path-aware grouping into dedicated long-lived cacheable chunks:
   - `react` (`react`, `react-dom`, `scheduler`)
   - `three` (`three`)
   - `motion` (`gsap`, `lenis`)
   - `engines` (`src/engines/*`, `zod`)
   - `icons` (`lucide-react`)

---

## 3. Verified Bundle Impact (v4.0 vs v5.0)

| Artifact | v4.0 Baseline | v5.0 Code-Split | Delta |
| :--- | ---: | ---: | :--- |
| Main Entry (`index-*.js`) | `595.25 kB` (`175.78 kB` gz) | **`135.76 kB`** (`41.96 kB` gz) | **`-77.2%` raw / `-76.1%` gzip** |
| React Runtime (`react-*.js`) | Mixed in `index` + `vendor` | `223.08 kB` (`69.17 kB` gz) | Isolated immutable cache chunk |
| Physics & Commerce (`engines-*.js`) | Mixed in `index` | `99.66 kB` (`30.21 kB` gz) | Shared across lazy labs & modals |
| Three.js PBR (`three-*.js`) | Eagerly parsed on mount | `503.60 kB` (**Deferred on demand**) | `0 kB` on initial editorial load |
| Optical Rx Lab (`OpticalRxLab-*.js`) | N/A (new v5.0) | `22.74 kB` (`5.62 kB` gz) | Lazy chunk |
| Bespoke Lab (`BespokeSizingLab-*.js`) | Inside `index` | `21.17 kB` (`4.84 kB` gz) | Lazy chunk |
| Checkout (`CheckoutModal-*.js`) | Inside `index` | `27.98 kB` (`6.10 kB` gz) | Loaded only when checking out |

---

## 4. Consequences

- **Positive:** Slashed main entry JavaScript by **77.2%** (`595.25 kB -> 135.76 kB`), well below the `< 160 kB` performance budget, while adding the full Optical Rx Sagitta & Spectral Transmittance Lab.
- **Positive:** `nginx.conf` serves all hashed `/assets/*` bundles with `Cache-Control: public, max-age=31536000, immutable`, meaning returning visitors re-use `react`, `motion`, `engines`, and `icons` across deployments.
- **Trade-off:** Opening a modal or switching to 3D mode for the first time incurs one fast local chunk fetch (~`5–28 kB` for modals, `503 kB` for WebGL 3D), gracefully masked by minimal archival typography fallbacks.
