import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { HERO_FRAME_FINISHES } from '../data/catalog';
import { computeOpticalLensTelemetry } from '../engines/opticalPhysics';
import type {
  EyewearCameraPreset,
  HeroEyewearConfig,
  Locale,
  StudioLightingMood,
  ThemeMode,
} from '../types/commerce';

interface Eyewear3DCanvasProps {
  config: HeroEyewearConfig;
  theme: ThemeMode;
  locale: Locale;
  resetSignal: number;
  paused?: boolean;
}

const CAMERA_PRESETS: Record<
  EyewearCameraPreset,
  {
    camPos: [number, number, number];
    lookAt: [number, number, number];
    rotY: number;
    rotX: number;
    exploded: number;
  }
> = {
  runway: {
    camPos: [0, 0.52, 8.6],
    lookAt: [0, -0.05, 0],
    rotY: -0.46,
    rotX: 0.16,
    exploded: 0,
  },
  hinge: {
    camPos: [2.85, 0.58, 3.85],
    lookAt: [1.82, 0.34, 0.58],
    rotY: -0.92,
    rotX: 0.1,
    exploded: 0,
  },
  optics: {
    camPos: [-0.8, 0.35, 5.45],
    lookAt: [0.1, 0.2, 0.85],
    rotY: 0.24,
    rotX: 0.08,
    exploded: 0,
  },
  exploded: {
    camPos: [0.1, 0.92, 11.2],
    lookAt: [0, 0.14, 0.1],
    rotY: -0.5,
    rotX: 0.2,
    exploded: 1,
  },
};

const LIGHTING_MOODS: Record<
  StudioLightingMood,
  {
    keyColor: string;
    keyIntensity: number;
    rimColor: string;
    rimIntensity: number;
    fillSky: string;
    fillGround: string;
    exposure: number;
    causticOpacity: number;
  }
> = {
  morning: {
    keyColor: '#FFF9F0',
    keyIntensity: 2.35,
    rimColor: '#D6C4A4',
    rimIntensity: 1.4,
    fillSky: '#F6F3ED',
    fillGround: '#4A433B',
    exposure: 1.18,
    causticOpacity: 0.42,
  },
  golden: {
    keyColor: '#FFCE96',
    keyIntensity: 2.75,
    rimColor: '#D46E3C',
    rimIntensity: 1.85,
    fillSky: '#FBE5C8',
    fillGround: '#3E271A',
    exposure: 1.24,
    causticOpacity: 0.58,
  },
  gallery: {
    keyColor: '#FFFFFF',
    keyIntensity: 3.1,
    rimColor: '#B8C4D4',
    rimIntensity: 1.6,
    fillSky: '#E8ECF2',
    fillGround: '#1E2026',
    exposure: 1.12,
    causticOpacity: 0.36,
  },
  nocturne: {
    keyColor: '#D4B483',
    keyIntensity: 2.1,
    rimColor: '#5DA6B8',
    rimIntensity: 2.35,
    fillSky: '#242A36',
    fillGround: '#0B0B0D',
    exposure: 1.08,
    causticOpacity: 0.65,
  },
};

function createBrushedTitaniumTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 1) {
      const shade = 110 + Math.floor(Math.sin(y * 1.9) * 14 + (Math.random() - 0.5) * 28);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(0, y, 256, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function createTravertineTexture(isDark: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = isDark ? '#242220' : '#DFD7C8';
    ctx.fillRect(0, 0, 512, 256);
    for (let y = 0; y < 256; y += 2) {
      const wave = Math.sin(y * 0.14) * 10 + Math.cos(y * 0.42) * 5;
      ctx.fillStyle = isDark
        ? `rgba(212, 180, 131, ${0.03 + Math.abs(wave) * 0.002})`
        : `rgba(110, 96, 78, ${0.04 + Math.abs(wave) * 0.003})`;
      ctx.fillRect(0, y, 512, 2);
    }
    // Subtle mineral pores
    for (let i = 0; i < 180; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const w = 4 + Math.random() * 18;
      ctx.fillStyle = isDark ? 'rgba(0,0,0,0.22)' : 'rgba(90,78,62,0.12)';
      ctx.fillRect(x, y, w, 1.5);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createCausticGlowTexture(hexColor: string, vltPercent = 50): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const col = new THREE.Color(hexColor);
    const r = Math.round(col.r * 255);
    const g = Math.round(col.g * 255);
    const b = Math.round(col.b * 255);
    const vltFactor = 0.28 + (Math.max(10, Math.min(100, vltPercent)) / 100) * 0.42;

    const grad = ctx.createRadialGradient(128, 128, 14, 128, 128, 122);
    grad.addColorStop(0, `rgba(${r},${g},${b},${vltFactor.toFixed(2)})`);
    grad.addColorStop(0.42, `rgba(${r},${g},${b},${(vltFactor * 0.46).toFixed(2)})`);
    grad.addColorStop(0.7, `rgba(17,17,17,0.14)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  return new THREE.CanvasTexture(canvas);
}

function createGradientLensTexture(topHex: string, bottomHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, topHex);
    grad.addColorStop(0.42, topHex);
    grad.addColorStop(1, bottomHex);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Procedural Warm Parisian Boutique HDRI Studio Scene for PMREMGenerator.
 * Emissive HDR softbox strips & travertine bounce planes create realistic
 * specular highlights across brushed Grade-5 titanium and 18K warm gold temples.
 */
function buildBoutiqueStudioEnvTexture(
  pmrem: THREE.PMREMGenerator,
  mood: StudioLightingMood
): THREE.WebGLRenderTarget {
  const envScene = new THREE.Scene();
  const disposables: { dispose: () => void }[] = [];

  const paletteByMood: Record<
    StudioLightingMood,
    {
      dome: [number, number, number];
      overhead: [number, number, number];
      leftStrip: [number, number, number];
      rightStrip: [number, number, number];
      backRim: [number, number, number];
      floorBounce: [number, number, number];
    }
  > = {
    morning: {
      dome: [0.46, 0.43, 0.38],
      overhead: [4.2, 3.9, 3.3],
      leftStrip: [3.4, 2.75, 1.9],
      rightStrip: [2.8, 2.95, 3.2],
      backRim: [3.2, 2.6, 1.75],
      floorBounce: [0.85, 0.78, 0.68],
    },
    golden: {
      dome: [0.4, 0.28, 0.19],
      overhead: [4.5, 3.25, 1.95],
      leftStrip: [4.6, 2.55, 1.2],
      rightStrip: [2.4, 1.95, 1.45],
      backRim: [4.1, 2.2, 1.05],
      floorBounce: [0.92, 0.64, 0.42],
    },
    gallery: {
      dome: [0.32, 0.34, 0.38],
      overhead: [4.8, 4.9, 5.1],
      leftStrip: [3.6, 3.7, 3.9],
      rightStrip: [3.2, 3.45, 3.85],
      backRim: [3.5, 3.6, 3.8],
      floorBounce: [0.55, 0.57, 0.62],
    },
    nocturne: {
      dome: [0.09, 0.1, 0.14],
      overhead: [2.4, 2.0, 1.45],
      leftStrip: [3.8, 2.65, 1.35],
      rightStrip: [1.45, 2.95, 3.6],
      backRim: [1.3, 2.6, 3.35],
      floorBounce: [0.22, 0.2, 0.24],
    },
  };

  const p = paletteByMood[mood];

  const makePanel = (
    w: number,
    h: number,
    rgb: [number, number, number],
    pos: [number, number, number],
    lookAt: [number, number, number]
  ) => {
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setRGB(rgb[0], rgb[1], rgb[2]),
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.lookAt(...lookAt);
    envScene.add(mesh);
    disposables.push(geo, mat);
  };

  // Ambient architectural boutique shell
  const domeGeo = new THREE.SphereGeometry(24, 24, 16);
  const domeMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color().setRGB(p.dome[0], p.dome[1], p.dome[2]),
    side: THREE.BackSide,
  });
  envScene.add(new THREE.Mesh(domeGeo, domeMat));
  disposables.push(domeGeo, domeMat);

  // Overhead Parisian salon softbox canopy (dual strips for sharp metallic horizon bands)
  makePanel(14, 3.6, p.overhead, [0, 10, 1.5], [0, 0, 0]);
  makePanel(10, 1.8, p.overhead, [0, 9.2, -5.5], [0, 0, 0]);

  // Warm champagne left key softbox + crisp alabaster right kicker for temple reflections
  makePanel(3.4, 9.5, p.leftStrip, [-10.5, 2.2, 5.2], [0, 0, 0]);
  makePanel(2.8, 8.5, p.rightStrip, [10.5, 2.8, 4.4], [0, 0, 0]);

  // Rear boutique accent specular ribbon (highlights 5-barrel hinges & chamfered bevels)
  makePanel(11, 2.2, p.backRim, [0, 3.4, -10.2], [0, 0, 0]);

  // Travertine warm floor reflector
  makePanel(16, 16, p.floorBounce, [0, -7.5, 0], [0, 0, 0]);

  const rt = pmrem.fromScene(envScene, 0.028);
  for (const item of disposables) {
    item.dispose();
  }
  return rt;
}

function buildRimShape(outerScale = 1): THREE.Shape {
  const s = outerScale;
  const shape = new THREE.Shape();
  shape.moveTo(-0.92 * s, 0.42 * s);
  shape.lineTo(-0.56 * s, 0.62 * s);
  shape.lineTo(0.54 * s, 0.62 * s);
  shape.lineTo(0.95 * s, 0.36 * s);
  shape.lineTo(0.84 * s, -0.34 * s);
  shape.lineTo(0.46 * s, -0.62 * s);
  shape.lineTo(-0.48 * s, -0.62 * s);
  shape.lineTo(-0.88 * s, -0.28 * s);
  shape.closePath();

  const hole = new THREE.Path();
  const h = 0.84 * s;
  hole.moveTo(-0.9 * h, 0.4 * h);
  hole.lineTo(-0.54 * h, 0.59 * h);
  hole.lineTo(0.52 * h, 0.59 * h);
  hole.lineTo(0.92 * h, 0.34 * h);
  hole.lineTo(0.81 * h, -0.32 * h);
  hole.lineTo(0.44 * h, -0.59 * h);
  hole.lineTo(-0.46 * h, -0.59 * h);
  hole.lineTo(-0.85 * h, -0.26 * h);
  hole.closePath();
  shape.holes.push(hole);

  return shape;
}

function buildLensShape(): THREE.Shape {
  const h = 0.87;
  const lens = new THREE.Shape();
  lens.moveTo(-0.9 * h, 0.4 * h);
  lens.lineTo(-0.54 * h, 0.59 * h);
  lens.lineTo(0.52 * h, 0.59 * h);
  lens.lineTo(0.92 * h, 0.34 * h);
  lens.lineTo(0.81 * h, -0.32 * h);
  lens.lineTo(0.44 * h, -0.59 * h);
  lens.lineTo(-0.46 * h, -0.59 * h);
  lens.lineTo(-0.85 * h, -0.26 * h);
  lens.closePath();
  return lens;
}

function buildTempleArmShape(): THREE.Shape {
  const arm = new THREE.Shape();
  arm.moveTo(0, 0.125);
  arm.lineTo(2.15, 0.085);
  arm.lineTo(2.15, -0.055);
  arm.lineTo(0, -0.105);
  arm.closePath();
  return arm;
}

function buildEarTipSleeveShape(): THREE.Shape {
  const tip = new THREE.Shape();
  tip.moveTo(2.1, 0.095);
  tip.lineTo(2.58, 0.075);
  tip.quadraticCurveTo(2.94, 0.04, 3.16, -0.24);
  tip.lineTo(3.36, -0.62);
  tip.quadraticCurveTo(3.4, -0.74, 3.22, -0.78);
  tip.lineTo(3.0, -0.65);
  tip.lineTo(2.78, -0.26);
  tip.quadraticCurveTo(2.62, -0.08, 2.1, -0.07);
  tip.closePath();
  return tip;
}

export const Eyewear3DCanvas: React.FC<Eyewear3DCanvasProps> = ({
  config,
  theme,
  locale,
  resetSignal,
  paused = false,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef<boolean>(paused);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const sceneRefs = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    pmrem: THREE.PMREMGenerator | null;
    envRT: THREE.WebGLRenderTarget | null;
    metal: THREE.MeshPhysicalMaterial | null;
    lens: THREE.MeshPhysicalMaterial | null;
    lensGradientTex: THREE.CanvasTexture | null;
    plinthMat: THREE.MeshStandardMaterial | null;
    causticMat: THREE.MeshBasicMaterial | null;
    keyLight: THREE.DirectionalLight | null;
    rimLight: THREE.DirectionalLight | null;
    fillLight: THREE.HemisphereLight | null;
  }>({
    renderer: null,
    scene: null,
    pmrem: null,
    envRT: null,
    metal: null,
    lens: null,
    lensGradientTex: null,
    plinthMat: null,
    causticMat: null,
    keyLight: null,
    rimLight: null,
    fillLight: null,
  });

  const targetRef = useRef({
    rotY: CAMERA_PRESETS.runway.rotY,
    rotX: CAMERA_PRESETS.runway.rotX,
    currentY: CAMERA_PRESETS.runway.rotY,
    currentX: CAMERA_PRESETS.runway.rotX,
    camPos: new THREE.Vector3(...CAMERA_PRESETS.runway.camPos),
    lookAt: new THREE.Vector3(...CAMERA_PRESETS.runway.lookAt),
    currentLookAt: new THREE.Vector3(...CAMERA_PRESETS.runway.lookAt),
    explodedTarget: 0,
    explodedCurrent: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    scrollTilt: 0,
    autoOrbit: true,
  });

  // React to Camera Preset changes
  useEffect(() => {
    const preset = CAMERA_PRESETS[config.cameraPreset];
    targetRef.current.camPos.set(...preset.camPos);
    targetRef.current.lookAt.set(...preset.lookAt);
    targetRef.current.rotY = preset.rotY;
    targetRef.current.rotX = preset.rotX;
    targetRef.current.explodedTarget = preset.exploded;
    targetRef.current.autoOrbit = config.cameraPreset === 'runway';
  }, [config.cameraPreset, resetSignal]);

  // Mount Three.js scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 520;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = LIGHTING_MOODS[config.lightingMood].exposure;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.replaceChildren(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    camera.position.set(...CAMERA_PRESETS.runway.camPos);

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const initialEnvRT = buildBoutiqueStudioEnvTexture(pmrem, config.lightingMood);
    scene.environment = initialEnvRT.texture;

    const mood = LIGHTING_MOODS[config.lightingMood];
    const keyLight = new THREE.DirectionalLight(mood.keyColor, mood.keyIntensity);
    keyLight.position.set(4.6, 6.8, 5.4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(mood.rimColor, mood.rimIntensity);
    rimLight.position.set(-5.4, 2.6, -3.8);
    scene.add(rimLight);

    const fillLight = new THREE.HemisphereLight(mood.fillSky, mood.fillGround, 0.78);
    scene.add(fillLight);

    const brushedTex = createBrushedTitaniumTexture();
    const travertineTex = createTravertineTexture(theme === 'nocturne');

    const finish =
      HERO_FRAME_FINISHES.find((f) => f.id === config.frameFinishId) ??
      HERO_FRAME_FINISHES[0];
    const optics = computeOpticalLensTelemetry(config.lensMode, config.uvIndex);
    const initialGradTex = optics.gradientBottomHex
      ? createGradientLensTexture(optics.hexColor, optics.gradientBottomHex)
      : null;

    const metalMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(finish.metalHex),
      metalness: finish.metalness,
      roughness: finish.roughness,
      roughnessMap: brushedTex,
      bumpMap: brushedTex,
      bumpScale: 0.004,
      clearcoat: 0.44,
      clearcoatRoughness: 0.14,
      envMapIntensity: 1.85,
    });

    const accentMetalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#B84A27'),
      metalness: 0.9,
      roughness: 0.2,
      envMapIntensity: 1.65,
    });

    const earSleeveMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#19191D'),
      roughness: 0.24,
      metalness: 0.08,
      clearcoat: 0.72,
      clearcoatRoughness: 0.15,
    });

    const lensMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(optics.hexColor),
      map: initialGradTex,
      attenuationColor: new THREE.Color(optics.attenuationHex),
      attenuationDistance: 1.15,
      transmission: optics.transmission,
      transparent: true,
      opacity: optics.opacity,
      roughness: 0.035,
      metalness: 0.04,
      ior: 1.52,
      thickness: 0.34,
      clearcoat: 1.0,
      clearcoatRoughness: 0.025,
      iridescence: optics.iridescence,
      iridescenceIOR: 1.33,
      specularColor: new THREE.Color(optics.specularSheenHex),
      envMapIntensity: 1.9,
      side: THREE.DoubleSide,
    });

    const nosePadMat = new THREE.MeshPhysicalMaterial({
      color: 0xeae5db,
      roughness: 0.3,
      transmission: 0.5,
      transparent: true,
      opacity: 0.72,
    });

    const plinthMat = new THREE.MeshStandardMaterial({
      map: travertineTex,
      roughness: 0.78,
      metalness: 0.04,
      envMapIntensity: 0.6,
    });

    const causticTex = createCausticGlowTexture(optics.causticHex, optics.vltPercent);
    const causticMat = new THREE.MeshBasicMaterial({
      map: causticTex,
      transparent: true,
      opacity: mood.causticOpacity,
      depthWrite: false,
    });

    sceneRefs.current = {
      renderer,
      scene,
      pmrem,
      envRT: initialEnvRT,
      metal: metalMat,
      lens: lensMat,
      lensGradientTex: initialGradTex,
      plinthMat,
      causticMat,
      keyLight,
      rimLight,
      fillLight,
    };

    // Sculpted Architectural Travertine Plinth beneath eyewear
    const plinthGroup = new THREE.Group();
    plinthGroup.position.set(0, -1.62, -0.2);
    const mainSlabGeo = new THREE.CylinderGeometry(2.65, 2.75, 0.34, 64);
    const mainSlab = new THREE.Mesh(mainSlabGeo, plinthMat);
    plinthGroup.add(mainSlab);

    const upperStepGeo = new THREE.CylinderGeometry(2.2, 2.26, 0.08, 64);
    const upperStep = new THREE.Mesh(upperStepGeo, plinthMat);
    upperStep.position.y = 0.2;
    plinthGroup.add(upperStep);

    const brassInlayGeo = new THREE.TorusGeometry(2.21, 0.014, 12, 72);
    brassInlayGeo.rotateX(Math.PI / 2);
    const brassInlay = new THREE.Mesh(brassInlayGeo, accentMetalMat);
    brassInlay.position.y = 0.24;
    plinthGroup.add(brassInlay);

    const causticPlaneGeo = new THREE.PlaneGeometry(4.1, 2.5);
    const causticPlane = new THREE.Mesh(causticPlaneGeo, causticMat);
    causticPlane.rotation.x = -Math.PI / 2;
    causticPlane.position.set(0, 0.246, 0.15);
    plinthGroup.add(causticPlane);

    scene.add(plinthGroup);

    // Root floating eyewear assembly
    const eyewearGroup = new THREE.Group();
    scene.add(eyewearGroup);

    const frontAssembly = new THREE.Group();
    frontAssembly.position.set(0, 0.12, 0.88);
    eyewearGroup.add(frontAssembly);

    // Geometries with smooth luxury bevels
    const rimGeo = new THREE.ExtrudeGeometry(buildRimShape(1), {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.036,
      bevelSize: 0.026,
      bevelSegments: 7,
      curveSegments: 16,
    });
    rimGeo.center();

    const lensGeo = new THREE.ExtrudeGeometry(buildLensShape(), {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.008,
      bevelSegments: 3,
    });
    lensGeo.center();

    const lugGeo = new THREE.BoxGeometry(0.28, 0.19, 0.24);
    const rivetGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.045, 16);
    rivetGeo.rotateX(Math.PI / 2);
    const padArmGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.3, 12);
    const padGeo = new THREE.CapsuleGeometry(0.056, 0.12, 6, 12);

    // Sub-assembly references for Exploded Assembly animation
    const explodedParts: {
      leftRim: THREE.Group;
      rightRim: THREE.Group;
      leftLens: THREE.Mesh;
      rightLens: THREE.Mesh;
      leftRivets: THREE.Group;
      rightRivets: THREE.Group;
      bridgeGroup: THREE.Group;
      leftTemple: THREE.Group;
      rightTemple: THREE.Group;
    } = {} as never;

    const buildEyeUnit = (side: -1 | 1) => {
      const unit = new THREE.Group();
      const rimMesh = new THREE.Mesh(rimGeo, metalMat);
      if (side === -1) rimMesh.scale.x = -1;
      unit.add(rimMesh);

      const lensMesh = new THREE.Mesh(lensGeo, lensMat);
      if (side === -1) lensMesh.scale.x = -1;
      lensMesh.position.z = -0.01;
      unit.add(lensMesh);

      const lug = new THREE.Mesh(lugGeo, metalMat);
      lug.position.set(side * 1.0, 0.33, -0.08);
      unit.add(lug);

      const rivetsGroup = new THREE.Group();
      const rivetTop = new THREE.Mesh(rivetGeo, accentMetalMat);
      rivetTop.position.set(side * 1.01, 0.375, 0.055);
      const rivetBot = new THREE.Mesh(rivetGeo, accentMetalMat);
      rivetBot.position.set(side * 1.01, 0.285, 0.055);
      rivetsGroup.add(rivetTop, rivetBot);
      unit.add(rivetsGroup);

      // Nosepad titanium wire & contoured pad
      const padArm = new THREE.Mesh(padArmGeo, metalMat);
      padArm.position.set(-side * 0.72, 0.02, -0.2);
      padArm.rotation.z = side * 0.45;
      padArm.rotation.x = 0.35;
      unit.add(padArm);

      const pad = new THREE.Mesh(padGeo, nosePadMat);
      pad.scale.set(0.65, 1, 0.45);
      pad.position.set(-side * 0.64, -0.08, -0.28);
      pad.rotation.y = side * 0.4;
      unit.add(pad);

      unit.position.set(side * 1.15, 0, 0);
      unit.rotation.y = -side * 0.09;

      if (side === -1) {
        explodedParts.leftRim = unit;
        explodedParts.leftLens = lensMesh;
        explodedParts.leftRivets = rivetsGroup;
      } else {
        explodedParts.rightRim = unit;
        explodedParts.rightLens = lensMesh;
        explodedParts.rightRivets = rivetsGroup;
      }
      return unit;
    };

    frontAssembly.add(buildEyeUnit(-1), buildEyeUnit(1));

    // Double milled bridge sub-assembly
    const bridgeGroup = new THREE.Group();
    const upperBrowGeo = new THREE.BoxGeometry(2.86, 0.092, 0.14);
    const upperBrow = new THREE.Mesh(upperBrowGeo, metalMat);
    upperBrow.position.set(0, 0.56, 0.03);
    bridgeGroup.add(upperBrow);

    const bridgeArchGeo = new THREE.BoxGeometry(0.58, 0.12, 0.16);
    const bridgeArch = new THREE.Mesh(bridgeArchGeo, metalMat);
    bridgeArch.position.set(0, 0.28, 0.04);
    bridgeGroup.add(bridgeArch);
    frontAssembly.add(bridgeGroup);
    explodedParts.bridgeGroup = bridgeGroup;

    // Sculpted titanium temples + precision 5-barrel cylindrical hinges + ergonomic ear-tip sleeves
    const armGeo = new THREE.ExtrudeGeometry(buildTempleArmShape(), {
      depth: 0.068,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.012,
      bevelSegments: 4,
    });
    armGeo.translate(0, 0, -0.034);

    const earTipGeo = new THREE.ExtrudeGeometry(buildEarTipSleeveShape(), {
      depth: 0.082,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.016,
      bevelSegments: 5,
    });
    earTipGeo.translate(0, 0, -0.041);

    const barrelGeo = new THREE.CylinderGeometry(0.064, 0.064, 0.036, 20);
    const pinGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.25, 12);
    const grooveGeo = new THREE.BoxGeometry(0.018, 0.024, 1.5);

    const buildTemple = (side: -1 | 1) => {
      const templeGroup = new THREE.Group();

      // Precision 5-barrel cylindrical hinge stack
      for (let b = 0; b < 5; b++) {
        const barrel = new THREE.Mesh(
          barrelGeo,
          b % 2 === 1 ? accentMetalMat : metalMat
        );
        barrel.position.set(side * 2.18, 0.24 + b * 0.045, 0.72);
        templeGroup.add(barrel);
      }
      const hingePin = new THREE.Mesh(pinGeo, metalMat);
      hingePin.position.set(side * 2.18, 0.33, 0.72);
      templeGroup.add(hingePin);

      // Brushed titanium temple shaft
      const armMesh = new THREE.Mesh(armGeo, metalMat);
      armMesh.rotation.y = Math.PI / 2 + side * 0.03;
      armMesh.position.set(side * 2.18, 0.33, 0.72);
      templeGroup.add(armMesh);

      // Ergonomic sculpted ear-tip sleeve
      const earSleeve = new THREE.Mesh(earTipGeo, earSleeveMat);
      earSleeve.rotation.y = Math.PI / 2 + side * 0.03;
      earSleeve.position.set(side * 2.18, 0.33, 0.72);
      templeGroup.add(earSleeve);

      // Laser-etched architectural accent groove
      const groove = new THREE.Mesh(grooveGeo, accentMetalMat);
      groove.position.set(side * 2.226, 0.33, -0.18);
      templeGroup.add(groove);

      if (side === -1) explodedParts.leftTemple = templeGroup;
      else explodedParts.rightTemple = templeGroup;

      return templeGroup;
    };

    eyewearGroup.add(buildTemple(-1), buildTemple(1));

    // Pointer drag-to-orbit handlers
    const dom = renderer.domElement;
    dom.style.cursor = 'grab';
    dom.style.touchAction = 'pan-y';

    const onPointerDown = (e: PointerEvent) => {
      targetRef.current.dragging = true;
      targetRef.current.lastX = e.clientX;
      targetRef.current.lastY = e.clientY;
      dom.style.cursor = 'grabbing';
      dom.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!targetRef.current.dragging) return;
      const dx = e.clientX - targetRef.current.lastX;
      const dy = e.clientY - targetRef.current.lastY;
      targetRef.current.lastX = e.clientX;
      targetRef.current.lastY = e.clientY;
      targetRef.current.rotY += dx * 0.0085;
      targetRef.current.rotX = Math.max(
        -0.55,
        Math.min(0.62, targetRef.current.rotX + dy * 0.0065)
      );
    };

    const onPointerUp = (e: PointerEvent) => {
      targetRef.current.dragging = false;
      dom.style.cursor = 'grab';
      if (dom.hasPointerCapture(e.pointerId)) {
        dom.releasePointerCapture(e.pointerId);
      }
    };

    const onScroll = () => {
      const ratio = Math.min(1, window.scrollY / 640);
      targetRef.current.scrollTilt = ratio * 0.28;
    };

    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('scroll', onScroll, { passive: true });

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(260, Math.floor(entry.contentRect.width));
        const h = Math.max(260, Math.floor(entry.contentRect.height));
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    let rafId = 0;
    let isVisible = true;
    const clock = new THREE.Clock();

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const animate = () => {
      rafId = window.requestAnimationFrame(animate);
      if (!isVisible || pausedRef.current) return;

      const t = clock.getElapsedTime();
      const state = targetRef.current;

      if (!state.dragging && state.autoOrbit) {
        state.rotY += 0.0013;
      }

      state.currentY += (state.rotY - state.currentY) * 0.075;
      state.currentX += (state.rotX + state.scrollTilt - state.currentX) * 0.075;
      state.explodedCurrent += (state.explodedTarget - state.explodedCurrent) * 0.08;

      camera.position.lerp(state.camPos, 0.075);
      state.currentLookAt.lerp(state.lookAt, 0.075);
      camera.lookAt(state.currentLookAt);

      const ex = state.explodedCurrent;

      // Exploded Assembly 3D separation choreography
      explodedParts.leftRim.position.x = -1.15 - ex * 0.42;
      explodedParts.rightRim.position.x = 1.15 + ex * 0.42;
      explodedParts.leftLens.position.z = -0.01 + ex * 0.92;
      explodedParts.rightLens.position.z = -0.01 + ex * 0.92;
      explodedParts.leftRivets.position.z = ex * 0.65;
      explodedParts.rightRivets.position.z = ex * 0.65;
      explodedParts.bridgeGroup.position.y = ex * 0.56;
      explodedParts.bridgeGroup.position.z = ex * 0.35;
      explodedParts.leftTemple.position.set(-ex * 0.62, 0, -ex * 0.65);
      explodedParts.rightTemple.position.set(ex * 0.62, 0, -ex * 0.65);

      eyewearGroup.rotation.y = state.currentY;
      eyewearGroup.rotation.x = state.currentX;
      eyewearGroup.position.y = 0.22 + Math.sin(t * 1.3) * 0.065;

      // Soft breathing caustic glow on travertine plinth
      const causticScale = 1 + Math.sin(t * 1.3) * 0.045;
      causticPlane.scale.set(causticScale, causticScale, 1);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
      resizeObserver.disconnect();
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('scroll', onScroll);
      brushedTex.dispose();
      travertineTex.dispose();
      causticTex.dispose();
      sceneRefs.current.lensGradientTex?.dispose();
      sceneRefs.current.envRT?.dispose();
      pmrem.dispose();
      mainSlabGeo.dispose();
      upperStepGeo.dispose();
      brassInlayGeo.dispose();
      causticPlaneGeo.dispose();
      rimGeo.dispose();
      lensGeo.dispose();
      lugGeo.dispose();
      rivetGeo.dispose();
      padArmGeo.dispose();
      padGeo.dispose();
      upperBrowGeo.dispose();
      bridgeArchGeo.dispose();
      armGeo.dispose();
      earTipGeo.dispose();
      barrelGeo.dispose();
      pinGeo.dispose();
      grooveGeo.dispose();
      metalMat.dispose();
      accentMetalMat.dispose();
      earSleeveMat.dispose();
      lensMat.dispose();
      nosePadMat.dispose();
      plinthMat.dispose();
      causticMat.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update PBR titanium finish, optical lens physics (including UV photochromic), and caustic tint
  useEffect(() => {
    const finish =
      HERO_FRAME_FINISHES.find((f) => f.id === config.frameFinishId) ??
      HERO_FRAME_FINISHES[0];
    const optics = computeOpticalLensTelemetry(config.lensMode, config.uvIndex);

    if (sceneRefs.current.metal) {
      sceneRefs.current.metal.color.set(finish.metalHex);
      sceneRefs.current.metal.metalness = finish.metalness;
      sceneRefs.current.metal.roughness = finish.roughness;
      sceneRefs.current.metal.needsUpdate = true;
    }
    if (sceneRefs.current.lens) {
      const oldGrad = sceneRefs.current.lensGradientTex;
      if (optics.gradientBottomHex) {
        const nextGrad = createGradientLensTexture(
          optics.hexColor,
          optics.gradientBottomHex
        );
        sceneRefs.current.lens.map = nextGrad;
        sceneRefs.current.lensGradientTex = nextGrad;
        sceneRefs.current.lens.color.set('#FFFFFF');
      } else {
        sceneRefs.current.lens.map = null;
        sceneRefs.current.lensGradientTex = null;
        sceneRefs.current.lens.color.set(optics.hexColor);
      }
      oldGrad?.dispose();

      sceneRefs.current.lens.attenuationColor.set(optics.attenuationHex);
      sceneRefs.current.lens.transmission = optics.transmission;
      sceneRefs.current.lens.opacity = optics.opacity;
      sceneRefs.current.lens.iridescence = optics.iridescence;
      sceneRefs.current.lens.specularColor.set(optics.specularSheenHex);
      sceneRefs.current.lens.needsUpdate = true;
    }
    if (sceneRefs.current.causticMat) {
      const oldMap = sceneRefs.current.causticMat.map;
      sceneRefs.current.causticMat.map = createCausticGlowTexture(
        optics.causticHex,
        optics.vltPercent
      );
      sceneRefs.current.causticMat.needsUpdate = true;
      oldMap?.dispose();
    }
  }, [config.frameFinishId, config.lensMode, config.uvIndex]);

  // Update real-time Studio Lighting Mood + Procedural PMREM Boutique HDRI
  useEffect(() => {
    const mood = LIGHTING_MOODS[config.lightingMood];
    if (sceneRefs.current.scene && sceneRefs.current.pmrem) {
      const oldRT = sceneRefs.current.envRT;
      const nextRT = buildBoutiqueStudioEnvTexture(
        sceneRefs.current.pmrem,
        config.lightingMood
      );
      sceneRefs.current.scene.environment = nextRT.texture;
      sceneRefs.current.envRT = nextRT;
      oldRT?.dispose();
    }
    if (sceneRefs.current.keyLight) {
      sceneRefs.current.keyLight.color.set(mood.keyColor);
      sceneRefs.current.keyLight.intensity = mood.keyIntensity;
    }
    if (sceneRefs.current.rimLight) {
      sceneRefs.current.rimLight.color.set(mood.rimColor);
      sceneRefs.current.rimLight.intensity = mood.rimIntensity;
    }
    if (sceneRefs.current.fillLight) {
      sceneRefs.current.fillLight.color.set(mood.fillSky);
      sceneRefs.current.fillLight.groundColor.set(mood.fillGround);
    }
    if (sceneRefs.current.renderer) {
      sceneRefs.current.renderer.toneMappingExposure = mood.exposure;
    }
    if (sceneRefs.current.causticMat) {
      sceneRefs.current.causticMat.opacity = mood.causticOpacity;
    }
  }, [config.lightingMood]);

  // Update travertine plinth material tone on Paper <-> Nocturne wipe
  useEffect(() => {
    if (sceneRefs.current.plinthMat) {
      const oldMap = sceneRefs.current.plinthMat.map;
      sceneRefs.current.plinthMat.map = createTravertineTexture(theme === 'nocturne');
      sceneRefs.current.plinthMat.needsUpdate = true;
      oldMap?.dispose();
    }
  }, [theme]);

  if (webglFailed) {
    const finish =
      HERO_FRAME_FINISHES.find((f) => f.id === config.frameFinishId) ??
      HERO_FRAME_FINISHES[0];
    const optics = computeOpticalLensTelemetry(config.lensMode, config.uvIndex);
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <svg viewBox="0 0 540 280" className="w-full max-w-[480px]" aria-label="VÉRA-01 Monolith Frame">
          <defs>
            <linearGradient id="fallback-metal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={finish.metalHex} />
              <stop offset="100%" stopColor="#6D6A64" />
            </linearGradient>
          </defs>
          <ellipse cx="270" cy="236" rx="170" ry="18" fill="currentColor" opacity="0.1" />
          <line x1="90" y1="88" x2="450" y2="88" stroke="url(#fallback-metal)" strokeWidth="8" />
          <polygon
            points="92,102 128,82 224,82 252,104 242,168 206,194 128,194 96,164"
            fill={optics.hexColor}
            fillOpacity={optics.opacity}
            stroke="url(#fallback-metal)"
            strokeWidth="9"
          />
          <polygon
            points="288,104 316,82 412,82 448,102 444,164 412,194 334,194 298,168"
            fill={optics.hexColor}
            fillOpacity={optics.opacity}
            stroke="url(#fallback-metal)"
            strokeWidth="9"
          />
          <rect x="248" y="114" width="44" height="10" rx="2" fill="url(#fallback-metal)" />
        </svg>
      </div>
    );
  }

  const liveOptics = computeOpticalLensTelemetry(config.lensMode, config.uvIndex);

  return (
    <div className="relative h-full w-full">
      <div
        ref={mountRef}
        data-cursor="DRAG 3D"
        className="h-full w-full select-none"
        aria-label="Interactive 3D VÉRA-01 Monolith Titanium Eyewear Showcase"
      />

      {/* Live PMREM Studio HDRI & Optical Physics Readout Pill */}
      <div
        data-testid="3d-optical-hud"
        className="pointer-events-none absolute bottom-4 left-5 z-10 flex flex-wrap items-center gap-2 border border-[var(--hairline-strong)] bg-[var(--surface)]/90 px-3 py-1.5 font-mono-tech text-[9.5px] uppercase tracking-[0.14em] text-[var(--ink)] backdrop-blur-md sm:left-7"
      >
        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
        <span>PMREM HDRI</span>
        <span className="opacity-35">|</span>
        <span>VLT {liveOptics.vltPercent}%</span>
        <span className="opacity-35">|</span>
        <span>GLARE -{liveOptics.glareReductionPercent}%</span>
        <span className="opacity-35">|</span>
        <span className="text-[var(--accent)]">{liveOptics.filterCategory}</span>
        {config.lensMode === 'photochromic-uv' && (
          <>
            <span className="opacity-35">|</span>
            <span>UV {liveOptics.uvIndex}/11</span>
          </>
        )}
      </div>

      {/* Exploded Assembly Floating Engineering Callout Badges */}
      {config.cameraPreset === 'exploded' && (
        <div
          data-testid="exploded-callouts"
          className="pointer-events-none absolute inset-0 z-10 hidden sm:block"
        >
          <div className="absolute left-[10%] top-[24%] border border-[var(--hairline-strong)] bg-[var(--surface)]/92 px-2.5 py-1 font-mono-tech text-[9px] uppercase tracking-[0.18em] text-[var(--ink)] shadow-sm backdrop-blur-sm">
            <span className="text-[var(--accent)]">01 · </span>
            {locale === 'en' ? 'ZERO-SOLDER TI BRIDGE' : 'CẦU KÍNH TITAN KHÔNG HÀN'}
          </div>
          <div className="absolute right-[9%] top-[27%] border border-[var(--hairline-strong)] bg-[var(--surface)]/92 px-2.5 py-1 font-mono-tech text-[9px] uppercase tracking-[0.18em] text-[var(--ink)] shadow-sm backdrop-blur-sm">
            <span className="text-[var(--accent)]">02 · </span>
            {locale === 'en' ? '5-BARREL CNC HINGE' : 'BẢN LỀ CNC 5 CHẤU'}
          </div>
          <div className="absolute left-[14%] bottom-[24%] border border-[var(--hairline-strong)] bg-[var(--surface)]/92 px-2.5 py-1 font-mono-tech text-[9px] uppercase tracking-[0.18em] text-[var(--ink)] shadow-sm backdrop-blur-sm">
            <span className="text-[var(--accent)]">03 · </span>
            {locale === 'en' ? 'CR-39 IRIDESCENT OPTICS' : 'TRÒNG QUANG HỌC CR-39'}
          </div>
          <div className="absolute right-[13%] bottom-[22%] border border-[var(--hairline-strong)] bg-[var(--surface)]/92 px-2.5 py-1 font-mono-tech text-[9px] uppercase tracking-[0.18em] text-[var(--ink)] shadow-sm backdrop-blur-sm">
            <span className="text-[var(--accent)]">04 · </span>
            {locale === 'en' ? '4MM GRADE-5 BEVEL RIM' : 'VÀNH TITAN CẤP 5 DÀY 4MM'}
          </div>
        </div>
      )}
    </div>
  );
};
