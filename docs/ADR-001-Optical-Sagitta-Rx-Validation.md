# ADR-001: Exact Optical Sagitta Physics & Clinical 0.25 D Rx Validation Parity

- **Status:** Accepted
- **Date:** 2026-11-28
- **Decision Makers:** Truong Van Tinh (`tvt987`), Principal Solution Architect
- **Scope:** Frontend (`src/engines/prescriptionOpticalEngine.ts`) & Backend (`backend/src/MaisonVera.Domain/Optical/`)

---

## 1. Context & Problem Statement

Haute couture optical frames such as the **VÉRA-01 Monolith** are CNC-milled from a solid `4.0 mm` Grade-5 Japanese titanium billet. Clients ordering high-diopter prescriptions (e.g., `-6.00 D` myopia or compound myopic astigmatism) routinely encounter "coke-bottle" temporal edge protrusion (`> 6.0 mm`) when ordering standard `CR-39 1.50` lenses, resulting in unexpected weight, aesthetic overhang outside the 4 mm chassis, and costly lab remakes.

To eliminate client ambiguity and enable automated refractive-index upgrades (`1.50` -> `1.59` -> `1.67` -> `1.74` Japanese Double-Aspheric), Maison Véra v5.0 requires:

1. Strict **clinical optometry input validation** before a lens job can be quoted or dispatched.
2. **Exact ophthalmic sagitta lens thickness physics** rather than linear heuristic approximations.
3. **Bit-level deterministic parity** between the client-side interactive Optical Rx Lab (for zero-latency 60 FPS slider exploration and static GitHub Pages deployments) and the authoritative `.NET 10` Clean Architecture API (`POST /api/v1/optical/validate-rx`).

---

## 2. Decision

### 2.1 Clinical Optometry Validation Contract
Both `validateOpticalRx()` (TypeScript) and `OpticalRxValidator.Validate()` (C# `.NET 10`) enforce identical domain invariants:

| Parameter | Physiological Bounds | Step Granularity | Rejection Code |
| :--- | :--- | :--- | :--- |
| Sphere (`SPH`) | `-10.00 D` to `+6.00 D` | Exact `0.25 D` | `SPHERE_OUT_OF_RANGE`, `SPHERE_INVALID_STEP` |
| Cylinder (`CYL`) | `-4.00 D` to `0.00 D` (minus-cyl convention) | Exact `0.25 D` | `CYLINDER_OUT_OF_RANGE`, `CYLINDER_INVALID_STEP` |
| Axis (`°`) | `1°`–`180°` integer required when `CYL != 0` | `1°` integer | `AXIS_REQUIRED`, `AXIS_OUT_OF_RANGE` |
| Pupillary Distance (`PD`) | `54.0 mm` to `74.0 mm` | `0.5 mm` | `PD_OUT_OF_RANGE`, `PD_INVALID_STEP` |
| Frame Lens Diameter (`A`) | `44 mm` to `62 mm` | `1 mm` | `DIAMETER_OUT_OF_RANGE` |

Any violation on the `.NET 10` API returns `400 Bad Request` formatted as **RFC 7807 `ValidationProblemDetails`** keyed by optometry field (`od.sphereD`, `od.axisDeg`, `pdMm`, etc.).

### 2.2 Exact Optical Sagitta Equation
Instead of the paraxial thin-lens approximation $s \approx \frac{h^2 |F|}{2000(n-1)}$ (which underestimates steep high-diopter edges by 6–11% at `-6.00 D` to `-10.00 D`), we compute the **exact spherical sagitta** combined with manufacturer-calibrated aspheric reduction factors:

$$R = \frac{1000 \cdot (n - 1)}{|F_{\text{dominant}}|}, \qquad s = \left(R - \sqrt{R^2 - h_{\text{eff}}^2}\right) \cdot k_{\text{asph}}$$

Where:
- $F_{\text{dominant}} = \arg\max_{P \in \{\text{SPH},\; \text{SPH}+\text{CYL}\}} |P|$ captures the steepest toric meridian for compound astigmatism.
- Effective blank semi-diameter $h_{\text{eff}} = \text{clamp}\left(\frac{A}{2} + 0.45 \cdot \max\left(0, \frac{(A + \text{DBL}) - \text{PD}}{2}\right),\; 22,\; 33\right)$ models real horizontal decentration from narrower client PD.
- For **myopic (minus) lenses** ($F < 0$): $t_{\text{center}} = t_{c,\min}$, $t_{\text{edge}} = t_{c,\min} + s$.
- For **hyperopic (plus) lenses** ($F > 0$): $t_{\text{edge}} = t_{e,\min}$, $t_{\text{center}} = t_{e,\min} + s$.
- Lens pair weight integrates the exact paraboloid volume $V = \pi h_{\text{eff}}^2 \cdot \frac{t_c + t_e}{2} \cdot 10^{-3}\text{ cm}^3$ multiplied by material density $\rho$.

### 2.3 Four Calibrated Refractive Index Profiles

| Material | Index ($n$) | Abbe ($V_d$) | Density ($\text{g/cm}^3$) | Min Center / Edge (mm) | Aspheric Factor | Upgrade (USD) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| CR-39 Standard | `1.50` | `58` | `1.32` | `2.0 / 1.2` | `1.00` | `+$0` |
| Polycarbonate | `1.59` | `30` | `1.20` | `1.5 / 1.0` | `0.97` | `+$75` |
| High-Index MR-7 | `1.67` | `32` | `1.35` | `1.3 / 0.9` | `0.93` | `+$140` |
| Ultra-Thin Japanese MR-174 | `1.74` | `33` | `1.47` | `1.1 / 0.8` | `0.88` | `+$240` |

**Verified Benchmark (`-6.00 D` Myopia, `A=51 mm`, `DBL=20 mm`, `PD=64 mm`, $h_{\text{eff}} = 27.08\text{ mm}$):**
- `CR-39 1.50`: Edge **`6.54 mm`** (protrudes `+2.54 mm` outside 4.0 mm titanium rim)
- `Poly 1.59`: Edge **`5.19 mm`** (`-20.6%`)
- `High-Index 1.67`: Edge **`4.40 mm`** (`-32.7%`)
- `Ultra-Thin 1.74`: Edge **`3.75 mm`** (**`-42.7%`** — sits completely flush within the `4.0 mm` Sabae titanium rim)

### 2.4 380nm–780nm Spectral Transmittance Model
Both engines generate 41 deterministic wavelength samples (`380–780 nm`, `10 nm` step) enforcing `>= 99.5%` UV400 blocking (`<= 400 nm`), a calibrated Gaussian HEV attenuation notch centered at `432 nm` (`415–455 nm` blue-light band) when Studio Blue-Light filtration is active, and `>= 95%` average visible transmittance across `500–780 nm` to preserve editorial color accuracy.

---

## 3. Consequences

- **Positive:** Zero network round-trip latency while dragging Rx sliders on the storefront, while server-side `.NET 10` endpoints guarantee untrusted client payloads cannot bypass 0.25 D clinical checks or manipulate pricing.
- **Positive:** Both Vitest (`22` optical Rx tests) and xUnit `WebApplicationFactory<Program>` (`10` optical Rx integration tests) independently lock down strict thickness monotonicity (`1.74 < 1.67 < 1.59 < 1.50`) and validation edge cases.
- **Trade-off:** Formula constants exist in two languages (TypeScript & C#). Any future adjustment to refractive index coefficients or aspheric factors must be updated synchronously in both suites and verified by cross-test golden vectors.
