import * as THREE from 'three';
import type { SculptBustProfile } from '../engines/virtualTryOnEngine';

const RADIAL_SEGS = 96;
const HEIGHT_SEGS = 80;

function gauss(x: number, center: number, sigma: number): number {
  const d = (x - center) / sigma;
  return Math.exp(-d * d);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Computes exact vertex positions for a serene museum-grade minimalist alabaster
 * sculpted head (Brancusi x Gentle Monster Parisian gallery aesthetic) calibrated
 * 1:1 with VÉRA-01 Sabae eyewear dimensions so the titanium bridge, rims, and
 * temples fit with tailored haute-couture anatomical accuracy.
 */
export function updateSculptedHeadPositions(
  geometry: THREE.BufferGeometry,
  profile: SculptBustProfile
): void {
  const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
  const cols = RADIAL_SEGS + 1;

  // Cranium origin aligned to VÉRA-01 eyewear assembly (front lenses at z = +0.88, y = +0.12)
  const centerY = 0.32;
  const centerZ = -1.32;

  const baseRy = 2.46 * profile.faceLengthScale;
  const baseRx = 2.02 * profile.craniumWidthScale;
  const baseRzFront = 1.78;
  const baseRzBack = 2.2;

  let idx = 0;
  for (let iy = 0; iy <= HEIGHT_SEGS; iy++) {
    const v = iy / HEIGHT_SEGS; // 0 = crown top, 0.5 = eye line, 1 = under-chin
    const phi = v * Math.PI;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    // Keep upper cranium & cheekbones full so glasses temples hug closely, then taper into sculpted jaw
    const lowerFaceMask = smoothstep(0.55, 0.94, v);
    const jawZone = gauss(v, 0.77, 0.12);
    const chinZone = smoothstep(0.78, 0.98, v);
    const craniumDome = gauss(v, 0.24, 0.18);

    const jawWidthLerp =
      1.0 -
      lowerFaceMask * (0.24 + profile.chinTaper * 0.15) +
      jawZone * (profile.jawWidthScale - 0.94) * 0.36;

    const sliceRx =
      baseRx *
      (1.0 + craniumDome * 0.04) *
      Math.max(0.42, jawWidthLerp) *
      (1.0 - chinZone * (0.14 + profile.chinTaper * 0.12));

    for (let ix = 0; ix <= RADIAL_SEGS; ix++) {
      const u = ix / RADIAL_SEGS;
      // theta = 0 is straight ahead (+Z face front); +/-PI is back of cranium (-Z)
      const theta = (u - 0.5) * Math.PI * 2;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const absTheta = Math.abs(theta);

      // Front face vs noble classical occiput in back
      const frontWeight = smoothstep(-0.25, 0.55, cosTheta);
      const baseRz = baseRzBack * (1 - frontWeight) + baseRzFront * frontWeight;

      // Subtle architectural temporal plane flattening right where titanium temples glide past
      const templeIndent =
        -0.095 * gauss(absTheta, 1.22, 0.26) * gauss(v, 0.44, 0.11);

      // Chiseled mandibular jaw corner (dramatically visible on ANGULAR face archetype!)
      const jawCorner =
        profile.jawAngularity *
        0.22 *
        gauss(absTheta, 0.9, 0.24) *
        gauss(v, 0.76, 0.105);

      // Soft rounded cheek fullness for ROUND face archetype
      const roundCheekFullness =
        (1 - profile.jawAngularity) *
        0.09 *
        gauss(absTheta, 0.7, 0.32) *
        gauss(v, 0.66, 0.12);

      // High-fashion sculpted zygomatic cheekbone plane
      const cheekbone =
        profile.cheekboneProminence *
        0.18 *
        gauss(absTheta, 0.66, 0.22) *
        gauss(v, 0.57, 0.075);

      // Editorial buccal / sub-malar hollow beneath cheekbone for crisp gallery chiaroscuro
      const subMalarHollow =
        (0.055 + profile.cheekboneProminence * 0.065) *
        gauss(absTheta, 0.64, 0.2) *
        gauss(v, 0.685, 0.075);

      let x = sinPhi * sinTheta * (sliceRx + jawCorner + roundCheekFullness + templeIndent);
      let y = centerY + cosPhi * baseRy;
      let z = centerZ + sinPhi * cosTheta * baseRz;

      // Noble cranial occiput sweep in back
      const occiput = gauss(absTheta, Math.PI, 0.72) * gauss(v, 0.38, 0.2);
      z -= occiput * 0.24;
      y += occiput * 0.08;

      // Clean sub-mandibular sweep back into the neck column
      const underJawBack = smoothstep(0.68, 0.95, v) * smoothstep(0.15, -0.6, cosTheta);
      y += underJawBack * 0.36;
      z += underJawBack * 0.14;

      // === CLASSICAL GALLERY FACIAL SCULPTING (Crisp Chiaroscuro C-infinity Reliefs) ===
      if (cosTheta > 0.04) {
        // 1. Architectural supraorbital brow ridge (casts refined shadow onto orbital plane)
        const browArchY = 0.43 - 0.016 * gauss(absTheta, 0.36, 0.21);
        const browRidge =
          (0.13 + profile.browStrength * 0.115) *
          gauss(v, browArchY, 0.036) *
          gauss(absTheta, 0.0, 0.64);

        // 2. Serene Brancusi recessed orbital hollows (clear depth behind lenses)
        const leftOrbit = gauss(theta, -0.36, 0.175) * gauss(v, 0.505, 0.044);
        const rightOrbit = gauss(theta, 0.36, 0.175) * gauss(v, 0.505, 0.044);
        const orbitalRecess = -0.23 * (leftOrbit + rightOrbit);

        // 3. Noble sculpted classical nose bridge, crisp dorsum, tip, and alae wings
        const noseSigmaTheta = 0.078 + profile.noseBridgeWidth * 0.05;
        const nasionBridge =
          (0.16 + profile.noseBridgeProjection * 0.15) *
          gauss(theta, 0.0, noseSigmaTheta) *
          gauss(v, 0.508, 0.042);

        const noseDorsumRamp =
          smoothstep(0.485, 0.618, v) * (1.0 - smoothstep(0.625, 0.662, v));
        const noseLengthMask = gauss(theta, 0.0, 0.072 + (v - 0.49) * 0.2);
        const noseProfile =
          (0.38 + profile.noseBridgeProjection * 0.21) * noseDorsumRamp * noseLengthMask;

        const noseTip =
          (0.2 + profile.noseBridgeProjection * 0.09) *
          gauss(theta, 0.0, 0.088) *
          gauss(v, 0.622, 0.022);

        const noseWings =
          0.105 *
          (gauss(theta, -0.13, 0.06) + gauss(theta, 0.13, 0.06)) *
          gauss(v, 0.632, 0.022);

        // Subtle shadow crease under nose septum into philtrum
        const philtrum = -0.075 * gauss(theta, 0.0, 0.105) * gauss(v, 0.674, 0.02);

        // 4. Classical marble lips (restrained monochrome sculpture contour)
        const lipSpan = gauss(theta, 0.0, 0.225);
        const upperLip =
          0.115 * lipSpan * gauss(v, 0.708, 0.015) * (1.0 - 0.22 * gauss(theta, 0, 0.036));
        const lipParting = -0.072 * gauss(theta, 0.0, 0.2) * gauss(v, 0.725, 0.008);
        const lowerLip = 0.125 * gauss(theta, 0.0, 0.195) * gauss(v, 0.745, 0.018);
        const labiomental = -0.1 * gauss(theta, 0.0, 0.25) * gauss(v, 0.786, 0.022);

        // 5. Noble chin projection
        const chinSigma = 0.32 - profile.chinTaper * 0.11;
        const chinBoss =
          (0.205 - profile.chinTaper * 0.025) *
          gauss(theta, 0.0, chinSigma) *
          gauss(v, 0.855, 0.052);

        const forwardSculpt =
          browRidge +
          orbitalRecess +
          nasionBridge +
          noseProfile +
          noseTip +
          noseWings +
          philtrum +
          upperLip +
          lipParting +
          lowerLip +
          labiomental +
          chinBoss +
          cheekbone * 0.9 -
          subMalarHollow;

        z += forwardSculpt;
        x += Math.sign(sinTheta) * (cheekbone * 0.45 - subMalarHollow * 0.4);
      }

      posAttr.setXYZ(idx, x, y, z);
      idx++;
    }
  }

  for (let iy = 0; iy <= HEIGHT_SEGS; iy++) {
    const first = iy * cols;
    const last = first + RADIAL_SEGS;
    posAttr.setXYZ(
      last,
      posAttr.getX(first),
      posAttr.getY(first),
      posAttr.getZ(first)
    );
  }

  posAttr.needsUpdate = true;
  geometry.computeVertexNormals();
}

export function createSculptedHeadGeometry(
  profile: SculptBustProfile
): THREE.BufferGeometry {
  const cols = RADIAL_SEGS + 1;
  const rows = HEIGHT_SEGS + 1;
  const vertexCount = cols * rows;

  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);

  let uvIdx = 0;
  for (let iy = 0; iy < rows; iy++) {
    const v = iy / HEIGHT_SEGS;
    for (let ix = 0; ix < cols; ix++) {
      const u = ix / RADIAL_SEGS;
      uvs[uvIdx++] = u;
      uvs[uvIdx++] = 1 - v;
    }
  }

  const indices: number[] = [];
  for (let iy = 0; iy < HEIGHT_SEGS; iy++) {
    for (let ix = 0; ix < RADIAL_SEGS; ix++) {
      const a = iy * cols + ix;
      const b = a + 1;
      const c = (iy + 1) * cols + ix;
      const d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  updateSculptedHeadPositions(geometry, profile);
  return geometry;
}

/**
 * Creates a smooth classical sculptural neck + clavicle truncation loft
 * descending seamlessly onto a travertine & brushed brass gallery pedestal collar.
 */
export function createSculptedNeckGeometry(): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.01, -3.55),
    new THREE.Vector2(1.94, -3.55),
    new THREE.Vector2(2.02, -3.38),
    new THREE.Vector2(1.88, -3.14),
    new THREE.Vector2(1.48, -2.86),
    new THREE.Vector2(1.14, -2.52),
    new THREE.Vector2(1.01, -2.14),
    new THREE.Vector2(0.99, -1.72),
    new THREE.Vector2(1.08, -1.32),
    new THREE.Vector2(0.88, -1.0),
  ];
  const geo = new THREE.LatheGeometry(pts, 60);
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const shoulderBlend = smoothstep(-2.45, -3.45, y);
    pos.setXYZ(
      i,
      x * (1.0 + shoulderBlend * 0.25),
      y,
      z * (0.94 - shoulderBlend * 0.16)
    );
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Stylized minimalist sculpted auricle (ear ridge) placed cleanly on the
 * cranium mastoid right beneath the titanium temple ear-tip hook.
 */
export function createSculptedEarGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.44, 24, 20);
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const nx = x * 0.34;
    const ny = y * 1.48;
    const nz = z * 0.72 + y * 0.14;
    pos.setXYZ(i, nx, ny, nz);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates a warm Parisian Honed Travertine / Ivory Alabaster mineral canvas
 * texture with rich subtle stone stratification so directional key & rim lights
 * carve gallery chiaroscuro shadows across every facial plane.
 */
export function createAlabasterStoneTexture(isDark: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    if (isDark) {
      grad.addColorStop(0, '#D8CFC1');
      grad.addColorStop(0.5, '#C7BBA8');
      grad.addColorStop(1, '#B3A58F');
    } else {
      grad.addColorStop(0, '#E8DFD2');
      grad.addColorStop(0.5, '#DDD1C0');
      grad.addColorStop(1, '#CFC1AC');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Organic honed Roman travertine & alabaster mineral veins
    for (let v = 0; v < 34; v++) {
      ctx.beginPath();
      const startY = (v / 34) * 512;
      ctx.moveTo(0, startY);
      for (let x = 0; x <= 512; x += 24) {
        const dy =
          Math.sin(x * 0.016 + v * 1.35) * 14 +
          Math.cos(x * 0.041 + v * 0.75) * 6;
        ctx.lineTo(x, startY + dy);
      }
      ctx.strokeStyle = isDark
        ? `rgba(92, 78, 62, ${(0.055 + (v % 4) * 0.016).toFixed(3)})`
        : `rgba(116, 100, 80, ${(0.06 + (v % 4) * 0.016).toFixed(3)})`;
      ctx.lineWidth = 1.2 + (v % 3) * 0.95;
      ctx.stroke();
    }

    // Ultra-fine matte limestone tactile grain (deterministic LCG)
    let seed = 42071;
    const nextRand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = 0; i < 820; i++) {
      const px = nextRand() * 512;
      const py = nextRand() * 512;
      const r = 0.7 + nextRand() * 1.8;
      ctx.fillStyle =
        i % 3 === 0 ? 'rgba(255,252,246,0.18)' : 'rgba(98,84,68,0.08)';
      ctx.fillRect(px, py, r * 2.2, r);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates a crisp metallic temple monogram texture rendered directly onto the
 * outer titanium temple shaft when the client enables bespoke foil engraving.
 */
export function createTempleMonogramTexture(
  text: string,
  foilHex: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = foilHex;
    ctx.font = '500 28px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const spaced = text.trim().toUpperCase().split('').join(' · ');
    ctx.fillText(spaced || 'M · V', 128, 33);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
