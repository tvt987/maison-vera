# MAISON VÉRA v7.0 — Full-Stack `.NET 10` Live 3D Virtual Try-On Studio, Webcam Face-Tracking AR & Optical Glare Lab Monorepo

Full-stack luxury architectural eyewear & optical engineering platform combining an interactive **60fps Three.js Live 3D Virtual Try-On Studio** (with procedural Parisian Alabaster Sculpted Bust, 4 anthropometric Face Archetypes, real-time UV `0→11` Photochromic Darkening, Polarized Riviera Glare Split Curtain & 1-Click `1200×800` Editorial Portrait PNG export), **Privacy-First On-Device Webcam AR**, **Sculptural 3D PMREM HDRI CAD**, **Split-Screen Polarization & AR Glare Physics Lab**, **Pupillary-Distance (PD) Optical Decentration & Prentice's Rule Prism Calculator**, **Optical Rx Sagitta Lab**, and a **Clean Architecture `.NET 10` Optical & Private Atelier API**.

Designed and engineered by **Truong Van Tinh (`tvt987`)**.

---

## System Architecture

```mermaid
flowchart LR
  subgraph Client["Browser Client (GitHub Pages / Nginx Web)"]
    UI["React 19 + Tailwind v4<br/>Parisian Editorial #F6F3ED"]
    Three["Lazy Three.js PMREM 3D Studio<br/>VÉRA-01 Grade-5 Titanium"]
    GlareLab["Lazy Split-Screen Polarized Glare Lab<br/>Brewster Angle + Malus Law I = I0 cos²θ"]
    RxLab["Lazy Optical Rx Sagitta & PD Decentration Lab<br/>4 Indices + Prentice Rule Prism + MBS"]
    Sizing["Lazy Millimeter Bespoke Lab<br/>PD + Bridge + Sabae CAD"]
  end

  subgraph Edge["Edge Reverse Proxy (Docker :8080)"]
    Nginx["Nginx 1.27 Alpine<br/>Strict CSP + Immutable Cache"]
  end

  subgraph Backend[".NET 10 Clean Architecture API (:5080)"]
    Api["MaisonVera.Api<br/>Minimal API + RFC 7807"]
    Domain["MaisonVera.Domain<br/>0.25D Validator + Sagitta + Malus Glare<br/>PD Decentration / Prentice Prism + Quotes"]
    Infra["MaisonVera.Infrastructure<br/>Concurrency-Safe Idempotent Store"]
  end

  subgraph Data["Stateful Infrastructure"]
    PG[("PostgreSQL 16 Alpine")]
    Redis[("Redis 7 Alpine")]
  end

  UI --> Nginx
  Three --> Nginx
  GlareLab --> Nginx
  RxLab --> Nginx
  Sizing --> Nginx
  Nginx -->|"/api/v1/* & /health"| Api
  Api --> Domain
  Api --> Infra
  Infra -.-> PG
  Infra -.-> Redis
```

---

## Core v7.0 Full-Stack Capabilities

### 0. Live 3D Virtual Try-On Studio, Webcam Face-Tracking AR & Photochromic UV Lab (`virtualTryOnEngine.ts` + `sculptedBustGeometry.ts` + `Eyewear3DCanvas.tsx`)
- **4-Mode Primary 3D Eyewear Stage** (`[3D VIRTUAL TRY-ON | SCULPTURAL 3D CAD | WEBCAM AR | EDITORIAL CAMPAIGN]`):
  - **3D Virtual Try-On Studio**: Procedural museum-grade **Parisian Alabaster / Roman Travertine Architectural Bust** (96×80 smooth analytical $C^\infty$ sculpted geometry) wearing the exact live-configured Grade-5 Titanium eyewear (frame finish, optical lens mode, photochromic UV darkening, Sabae SKU `46/48/51/54 mm`, and temple foil monogram).
  - **4 Anthropometric Face Archetypes** (`OVAL`, `ANGULAR`, `HEART`, `ROUND`) morphing cranial/jaw/brow/nose-bridge geometry in real time (`132–148 mm` temple width, `16–22 mm` bridge height, cheek clearance) while computing deterministic **Atelier Fit Score (`0–100%`)**, **Temple Clearance (mm)**, and **Bridge Comfort Verdict**.
  - **6-DOF Head Pose Smoothing (`EMA Kalman-like filter`)**: Direct pointer drag smoothly rotates head pose (`Yaw ±55° / Pitch ±22°`) with spring-damped inertia and dead-zone micro-jitter suppression.
  - **Real-Time Photochromic UV Darkening (`0 → 11`) & Polarized Riviera Glare Split**: Scrubbing UV visibly darkens the 3D CR-39 lenses from `88%` crystal clear (`CAT 0`) to `14%` deep sun tint (`CAT 3`, `99.9% UV400`), paired with an interactive draggable **Malus's Law `cos²θ` Polarized Glare Curtain (`-99.4%` at `90°`)**.
  - **1-Click Parisian Editorial Try-On Portrait PNG (`1200×800`)**: Lazy-loaded Canvas compositor (`tryOnExport.ts`) exports a framed archival gallery portrait card with live 3D/AR capture and full fit & optical telemetry.
  - **Privacy-First On-Device Webcam AR**: Requests `getUserMedia` strictly on user click, overlays transparent 3D glasses over mirrored live video using lightweight zero-dependency on-device YCbCr face-region pose estimation + micro-align nudges, with an elegant Parisian Studio Fallback when no camera is attached.

### 1. Split-Screen Polarization & Anti-Reflective (AR) Glare Physics Lab (`glareOpticsEngine.ts` + lazy `PolarizedGlareLab.tsx`)
- Models real optical physics across **3 lighting environments** using **Brewster's Angle** ($\theta_B = \arctan(n_2/n_1)$) and **Malus's Law** ($I(\theta) = I_{\min} + (I_{\max} - I_{\min})\cos^2\theta$):
  - **Mediterranean Ocean Sun** (Seawater $n = 1.333$, $\theta_B = 53.1^\circ$, $88,000\text{ cd/m}^2$)
  - **Rain-Slicked Night Highway** (Wet Asphalt Film $n = 1.360$, $\theta_B = 53.7^\circ$, $24,000\text{ cd/m}^2$)
  - **High-Altitude Alpine Snow** (Compacted Ice Crust $n = 1.310$, $\theta_B = 52.6^\circ$, $112,000\text{ cd/m}^2$)
- Compares **Uncoated CR-39** (`7.8%` dual-face Fresnel reflection, `12.0%` glare attenuation) vs **Multi-Layer Hydrophobic AR** (`0.4%` surface reflection, `98.8%` crystal VLT) vs **Polarized Optical Filter + Blue-Light AR** (`99.4%` horizontal glare attenuation at $\theta = 90^\circ$, `+16.2 dB` contrast acuity gain, `78%` HEV blue cut).
- Features an interactive **Draggable Champagne-Gold Split-Screen SVG Daylight/Glare Viewport** (`0%–100%` pointer, touch, slider & keyboard support), a live **Malus's Law `0°–90°` Analyzer Curve**, and **1-Click "Apply Optical Coating to Active Frame"** synchronized directly with the VÉRA-01 Hero 3D studio.

### 2. Pupillary-Distance (PD) & Frame Optical Decentration Calculator (`decentrationEngine.ts` integrated into `OpticalRxLab.tsx`)
- Computes exact **Per-Eye Horizontal Optical Decentration** ($\text{Dec} = \frac{(A + \text{DBL}) - \text{PD}}{2}$), horizontal meridian power ($F_h = \text{SPH} + \text{CYL}\sin^2\alpha$), **Prentice's Rule Prismatic Effect** ($\Delta = c \cdot |F_h|$ with Base-In / Base-Out direction vs ANSI Z80.1 $\le 0.67\Delta$ tolerance), and **Minimum Blank Size** ($\text{MBS} = \text{ED} + 2|\text{Dec}| + 2.0\text{ mm}$).
- Evaluates all **4 Maison Véra Sabae Titanium frames** (`46 mm Panto`, `48 mm Archival`, `51 mm Monolith`, `54 mm Aviator`) live against the client's exact PD (`54–74 mm`) and Rx with a live SVG optical centration schematic and ranked fit verdicts.

### 3. Interactive Optical Rx Sagitta & 380–780nm Spectral Transmittance Lab (`prescriptionOpticalEngine.ts` + lazy `OpticalRxLab.tsx`)
- Clinical `0.25 D` OD/OS optometry validation, exact ophthalmic sagitta comparison across **`CR-39 1.50`**, **`Poly 1.59`**, **`High-Index 1.67`**, and **`Ultra-Thin 1.74` Japanese Double-Aspheric** against the `4.0 mm` titanium rim, live `380–780 nm` UV400 + HEV Blue-Light curve, and 1-click cart commissioning.

### 4. Clean Architecture `.NET 10` Backend (`backend/MaisonVera.sln`)
- `MaisonVera.Domain`: Zero-dependency optometry validator, exact sagitta physics engine, Brewster/Malus glare & PD decentration/Prentice's Rule engine (1:1 parity with TypeScript), bespoke commission & VietQR 30% deposit quote engine, and fitting reservation domain contracts.
- `MaisonVera.Infrastructure`: Thread-safe atomic slot locking and `Idempotency-Key` deduplication with SHA-256 payload fingerprinting.
- `MaisonVera.Api`: Hardened ASP.NET Core 10 Minimal API exposing:
  - `GET /health` (`version: 6.0.0`)
  - `POST /api/v1/optical/validate-rx`
  - `POST /api/v1/optical/decentration-glare` (Malus's Law glare attenuation, Brewster angle, VLT, Prentice's Rule prism diopters, MBS blank size & 4-frame Sabae fit verdicts)
  - `POST /api/v1/atelier/quote`
  - `POST /api/v1/fittings/reserve` (`201 Created`, idempotent `200 OK` replay, atomic `409 Conflict`)
  - `GET /api/v1/fittings/{reservationId}` & `GET /api/v1/fittings/boutiques/{boutiqueId}`

### 5. PMREM HDRI 3D Studio, Millimeter Bespoke Lab, 16 Hasselblad WebP Photographs & Commerce Engine
- Procedural in-memory **Three.js PMREM HDRI Studio** deferred cleanly behind `React.lazy`, **Millimeter Bespoke Sizing Lab**, **VIP Bespoke Lookbook** with printable certificates & JSON spec export, **AI Atelier Stylist (-12%)**, real **MBBank VietQR** settlement, Zod-validated 3-step Checkout, strict CSP + `Referrer-Policy`, zero custom mouse cursors, zero UI emojis, and zero `dangerouslySetInnerHTML`/`innerHTML`/`eval`.

---

## Verified v7.0 Quality & Performance Metrics

| Verification Gate | Result | Highlights |
| :--- | :--- | :--- |
| **Frontend Unit Tests (`npm test`)** | **133 / 133 PASS** (`16` suites) | `105` v6.0 + `28` `virtualTryOnEngine.test.ts` (Face Archetypes, Photochromic UV `88%→14%`, Malus `cos²θ` Glare Shield, 6-DOF EMA Pose Filter & On-Device Face Estimator) |
| **Backend Integration Tests (`dotnet test`)** | **48 / 48 PASS** (`0` warnings) | `.NET 10` xUnit + `WebApplicationFactory<Program>` (`31` v5.0 + `17` `DecentrationGlareEndpointTests`) |
| **Main Entry Bundle (`npm run build`)** | **`94.93 kB`** (`24.42 kB` gz) | Strictly `< 100 kB` entry budget; `three` (`505.03 kB`), `Eyewear3DCanvas` (`44.16 kB`), `tryOnExport` (`5.28 kB`), `data` (`62.90 kB`), `PolarizedGlareLab` & `OpticalRxLab` cleanly split |
| **Playwright Headless E2E** | **PASS (`1440x900` & `390x844`)** | `0` console errors, `0` page errors, `0` failed requests, `0px` horizontal overflow; verified 3D Virtual Try-On bust & Fit Score, `1200×800` Portrait PNG download (`615 kB`), UV `11` (`VLT 14% · CAT 3`) + Polarized `-99.4%` Glare Split, `ANGULAR` face + `18K Warm Gold` + `3/4` head rotation, Webcam AR Parisian Studio Fallback, Sculptural 3D CAD Exploded view & Strict CSP |

---

## Architecture & API Documentation

- **OpenAPI 3.1 Specification (v6.0.0):** [docs/openapi.yaml](docs/openapi.yaml)
- **ADR-001:** [Optical Sagitta Physics & Clinical 0.25 D Rx Validation Parity](docs/ADR-001-Optical-Sagitta-Rx-Validation.md)
- **ADR-002:** [Procedural PMREM HDRI Lighting & Aggressive Route/Studio Code-Splitting](docs/ADR-002-PMREM-3D-Asset-CodeSplitting.md)

---

## Local Development & Docker Compose

### Full-Stack with Docker Compose (`web` + `api` + `postgres` + `redis`)
```bash
docker compose up --build
# Storefront + API Proxy: http://localhost:8080
# .NET 10 API Direct:     http://localhost:5080/health
```

### Frontend Only (Node 22+)
```bash
npm ci
npm test
npm run build
npm run preview
```

### Backend Only (`.NET 10 SDK`)
```bash
dotnet test backend/MaisonVera.sln
dotnet run --project backend/src/MaisonVera.Api/MaisonVera.Api.csproj
```

---

## CI / CD (GitHub Pages)

Configured via `.github/workflows/ci-and-deploy.yml` (Node 22): executes `npm ci`, `npm test`, `npm run build` (`tsc -b && vite build`), generates SPA `404.html`, and deploys automatically to GitHub Pages.
