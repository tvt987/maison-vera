import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { CameraOff, RotateCcw, Sparkles } from 'lucide-react';
import { HERO_FRAME_FINISHES } from '../data/catalog';
import { FOIL_BY_ID } from '../engines/monogramEngine';
import {
  clampHeadPose,
  computePolarizedGlareShield,
  createHeadPoseFilter,
  estimateFacePoseFromImageData,
  evaluateVirtualTryOnFit,
  getFaceArchetype,
  HEAD_PITCH_LIMIT_DEG,
  HEAD_YAW_LIMIT_DEG,
  resolveTryOnLensMaterialState,
  stepHeadPoseFilter,
  type FaceArchetypeId,
  type HeadPoseFilterState,
  type HeroStageMode,
} from '../engines/virtualTryOnEngine';
import type {
  EyewearCameraPreset,
  HeroEyewearConfig,
  Locale,
  MonogramConfig,
  SabaeFrameSkuId,
  StudioLightingMood,
  ThemeMode,
} from '../types/commerce';
import {
  createAlabasterStoneTexture,
  createSculptedEarGeometry,
  createSculptedHeadGeometry,
  createSculptedNeckGeometry,
  createTempleMonogramTexture,
  updateSculptedHeadPositions,
} from './sculptedBustGeometry';

export interface WebcamArNudge {
  scale: number; // 0.8..1.25
  offsetY: number; // -0.6..0.6
  tiltDeg: number; // -15..15
}

export interface Eyewear3DCanvasHandle {
  getWebGLCanvas: () => HTMLCanvasElement | null;
  getVideoElement: () => HTMLVideoElement | null;
  getCurrentHeadPose: () => { yawDeg: number; pitchDeg: number };
  setTryOnPose: (yawDeg: number, pitchDeg: number) => void;
}

interface Eyewear3DCanvasProps {
  config: HeroEyewearConfig;
  theme: ThemeMode;
  locale: Locale;
  resetSignal: number;
  paused?: boolean;
  stageMode?: Exclude<HeroStageMode, 'campaign'>;
  faceArchetype?: FaceArchetypeId;
  frameSku?: SabaeFrameSkuId;
  pdMm?: number;
  monogram?: MonogramConfig;
  glareSplitEnabled?: boolean;
  glareAngleDeg?: number;
  glareSplitPercent?: number;
  onGlareSplitPercentChange?: (next: number) => void;
  arNudge?: WebcamArNudge;
  onHeadPoseChange?: (yawDeg: number, pitchDeg: number) => void;
  onReturnToTryOn?: () => void;
  onArStatusChange?: (status: 'idle' | 'requesting' | 'active' | 'fallback', tracked: boolean) => void;
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
    keyColor: '#FFF7EB',
    keyIntensity: 2.95,
    rimColor: '#D6B88D',
    rimIntensity: 2.15,
    fillSky: '#EFE7DA',
    fillGround: '#3E362E',
    exposure: 1.08,
    causticOpacity: 0.42,
  },
  golden: {
    keyColor: '#FFCA8A',
    keyIntensity: 3.15,
    rimColor: '#D46E3C',
    rimIntensity: 2.35,
    fillSky: '#F5DFC2',
    fillGround: '#362216',
    exposure: 1.12,
    causticOpacity: 0.58,
  },
  gallery: {
    keyColor: '#FFFFFF',
    keyIntensity: 3.25,
    rimColor: '#AFC0D6',
    rimIntensity: 2.05,
    fillSky: '#E0E5EC',
    fillGround: '#1B1E24',
    exposure: 1.06,
    causticOpacity: 0.36,
  },
  nocturne: {
    keyColor: '#DCC093',
    keyIntensity: 2.65,
    rimColor: '#5DA6B8',
    rimIntensity: 2.65,
    fillSky: '#252D3C',
    fillGround: '#09090B',
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
    let seed = 10913;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let y = 0; y < 256; y += 1) {
      const shade = 110 + Math.floor(Math.sin(y * 1.9) * 14 + (rand() - 0.5) * 28);
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
    let seed = 7381;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = 0; i < 180; i++) {
      const x = rand() * 512;
      const y = rand() * 256;
      const w = 4 + rand() * 18;
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
 * Generates an anti-reflective diagonal Parisian studio softbox glass reflection
 * highlight texture so lenses gleam with authentic curved Zeiss CR-39 optical depth.
 */
function createLensSpecularSheenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 256, 256);
    const diag = ctx.createLinearGradient(0, 0, 256, 256);
    diag.addColorStop(0.0, 'rgba(255, 252, 245, 0.0)');
    diag.addColorStop(0.24, 'rgba(255, 252, 245, 0.0)');
    diag.addColorStop(0.32, 'rgba(255, 253, 248, 0.42)');
    diag.addColorStop(0.38, 'rgba(255, 255, 255, 0.14)');
    diag.addColorStop(0.45, 'rgba(255, 252, 245, 0.0)');
    diag.addColorStop(0.62, 'rgba(218, 242, 236, 0.0)');
    diag.addColorStop(0.68, 'rgba(218, 246, 238, 0.18)');
    diag.addColorStop(0.74, 'rgba(255, 252, 245, 0.0)');
    diag.addColorStop(1.0, 'rgba(255, 252, 245, 0.0)');
    ctx.fillStyle = diag;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

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

  const domeGeo = new THREE.SphereGeometry(24, 24, 16);
  const domeMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color().setRGB(p.dome[0], p.dome[1], p.dome[2]),
    side: THREE.BackSide,
  });
  envScene.add(new THREE.Mesh(domeGeo, domeMat));
  disposables.push(domeGeo, domeMat);

  makePanel(14, 3.6, p.overhead, [0, 10, 1.5], [0, 0, 0]);
  makePanel(10, 1.8, p.overhead, [0, 9.2, -5.5], [0, 0, 0]);
  makePanel(3.4, 9.5, p.leftStrip, [-10.5, 2.2, 5.2], [0, 0, 0]);
  makePanel(2.8, 8.5, p.rightStrip, [10.5, 2.8, 4.4], [0, 0, 0]);
  makePanel(11, 2.2, p.backRim, [0, 3.4, -10.2], [0, 0, 0]);
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

export const Eyewear3DCanvas = React.forwardRef<Eyewear3DCanvasHandle, Eyewear3DCanvasProps>(
  (
    {
      config,
      theme,
      locale,
      resetSignal,
      paused = false,
      stageMode = 'cad',
      faceArchetype = 'OVAL',
      frameSku = 'MV-EYE-01',
      pdMm = 64,
      monogram,
      glareSplitEnabled = false,
      glareAngleDeg = 90,
      glareSplitPercent = 52,
      onGlareSplitPercentChange,
      arNudge = { scale: 1, offsetY: 0, tiltDeg: 0 },
      onHeadPoseChange,
      onReturnToTryOn,
      onArStatusChange,
    },
    ref
  ) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const stageWrapperRef = useRef<HTMLDivElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const pausedRef = useRef<boolean>(paused);
    const stageModeRef = useRef<Exclude<HeroStageMode, 'campaign'>>(stageMode);
    const arNudgeRef = useRef<WebcamArNudge>(arNudge);
    const onHeadPoseChangeRef = useRef(onHeadPoseChange);
    const onArStatusChangeRef = useRef(onArStatusChange);

    const [webglFailed, setWebglFailed] = useState(false);
    const [arStatus, setArStatus] = useState<'idle' | 'requesting' | 'active' | 'fallback'>('idle');
    const [arTracked, setArTracked] = useState(false);
    const [arErrorNote, setArErrorNote] = useState<string>('');
    const [draggingDivider, setDraggingDivider] = useState(false);

    useEffect(() => {
      pausedRef.current = paused;
    }, [paused]);

    useEffect(() => {
      stageModeRef.current = stageMode;
    }, [stageMode]);

    useEffect(() => {
      arNudgeRef.current = arNudge;
    }, [arNudge]);

    useEffect(() => {
      onHeadPoseChangeRef.current = onHeadPoseChange;
    }, [onHeadPoseChange]);

    useEffect(() => {
      onArStatusChangeRef.current = onArStatusChange;
    }, [onArStatusChange]);

    const fitEval = evaluateVirtualTryOnFit(faceArchetype, frameSku, pdMm);
    const fitTransformRef = useRef(fitEval.transform3d);
    useEffect(() => {
      fitTransformRef.current = fitEval.transform3d;
    }, [fitEval.transform3d]);

    const sceneRefs = useRef<{
      renderer: THREE.WebGLRenderer | null;
      scene: THREE.Scene | null;
      pmrem: THREE.PMREMGenerator | null;
      envRT: THREE.WebGLRenderTarget | null;
      metal: THREE.MeshPhysicalMaterial | null;
      lens: THREE.MeshPhysicalMaterial | null;
      lensGradientTex: THREE.CanvasTexture | null;
      plinthMat: THREE.MeshStandardMaterial | null;
      alabasterMat: THREE.MeshPhysicalMaterial | null;
      causticMat: THREE.MeshBasicMaterial | null;
      monogramMat: THREE.MeshBasicMaterial | null;
      monogramTex: THREE.CanvasTexture | null;
      leftMonogramMesh: THREE.Mesh | null;
      rightMonogramMesh: THREE.Mesh | null;
      upperBrowMesh: THREE.Mesh | null;
      headGeo: THREE.BufferGeometry | null;
      leftEarMesh: THREE.Mesh | null;
      rightEarMesh: THREE.Mesh | null;
      plinthGroup: THREE.Group | null;
      bustGroup: THREE.Group | null;
      tryOnRoot: THREE.Group | null;
      eyewearGroup: THREE.Group | null;
      leftTemple: THREE.Group | null;
      rightTemple: THREE.Group | null;
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
      alabasterMat: null,
      causticMat: null,
      monogramMat: null,
      monogramTex: null,
      leftMonogramMesh: null,
      rightMonogramMesh: null,
      upperBrowMesh: null,
      headGeo: null,
      leftEarMesh: null,
      rightEarMesh: null,
      plinthGroup: null,
      bustGroup: null,
      tryOnRoot: null,
      eyewearGroup: null,
      leftTemple: null,
      rightTemple: null,
      keyLight: null,
      rimLight: null,
      fillLight: null,
    });

    const targetRef = useRef({
      // CAD orbit state
      rotY: CAMERA_PRESETS.runway.rotY,
      rotX: CAMERA_PRESETS.runway.rotX,
      currentY: CAMERA_PRESETS.runway.rotY,
      currentX: CAMERA_PRESETS.runway.rotX,
      camPos: new THREE.Vector3(...CAMERA_PRESETS.runway.camPos),
      lookAt: new THREE.Vector3(...CAMERA_PRESETS.runway.lookAt),
      currentLookAt: new THREE.Vector3(...CAMERA_PRESETS.runway.lookAt),
      explodedTarget: 0,
      explodedCurrent: 0,
      // 3D Virtual Try-On 6-DOF head pose target + EMA filter
      tryOnYawTargetDeg: -14,
      tryOnPitchTargetDeg: 4,
      poseFilter: createHeadPoseFilter({
        yawDeg: -14,
        pitchDeg: 4,
        rollDeg: 0,
        tx: 0,
        ty: 0,
        scale: 1,
        ipdPx: 140,
      }) as HeadPoseFilterState,
      // Webcam AR pose filter + raw measurement
      arPoseFilter: createHeadPoseFilter({
        yawDeg: 0,
        pitchDeg: 0,
        rollDeg: 0,
        tx: 0,
        ty: 0,
        scale: 1,
        ipdPx: 140,
      }) as HeadPoseFilterState,
      arTargetPose: {
        yawDeg: 0,
        pitchDeg: 0,
        rollDeg: 0,
        tx: 0,
        ty: 0,
        scale: 1,
        ipdPx: 140,
      },
      dragging: false,
      lastX: 0,
      lastY: 0,
      scrollTilt: 0,
      autoOrbit: true,
      aspect: 1.32,
      lastReportedYaw: -14,
      lastReportedPitch: 4,
    });

    useImperativeHandle(ref, () => ({
      getWebGLCanvas: () => sceneRefs.current.renderer?.domElement ?? null,
      getVideoElement: () => videoRef.current,
      getCurrentHeadPose: () => ({
        yawDeg: targetRef.current.poseFilter.pose.yawDeg,
        pitchDeg: targetRef.current.poseFilter.pose.pitchDeg,
      }),
      setTryOnPose: (yawDeg: number, pitchDeg: number) => {
        const clamped = clampHeadPose({
          yawDeg,
          pitchDeg,
          rollDeg: 0,
          tx: 0,
          ty: 0,
          scale: 1,
          ipdPx: 140,
        });
        targetRef.current.tryOnYawTargetDeg = clamped.yawDeg;
        targetRef.current.tryOnPitchTargetDeg = clamped.pitchDeg;
      },
    }));

    // React to Camera Preset changes & Reset signal
    useEffect(() => {
      if (stageMode === 'cad') {
        const preset = CAMERA_PRESETS[config.cameraPreset];
        targetRef.current.camPos.set(...preset.camPos);
        targetRef.current.lookAt.set(...preset.lookAt);
        targetRef.current.rotY = preset.rotY;
        targetRef.current.rotX = preset.rotX;
        targetRef.current.explodedTarget = preset.exploded;
        targetRef.current.autoOrbit = config.cameraPreset === 'runway';
      } else if (stageMode === 'tryon') {
        targetRef.current.explodedTarget = 0;
        targetRef.current.autoOrbit = false;
        const aspectBoost =
          targetRef.current.aspect < 1.0
            ? 1 / Math.max(0.72, targetRef.current.aspect * 1.05)
            : 1.0;
        targetRef.current.camPos.set(0, 0.18, 12.8 * aspectBoost);
        targetRef.current.lookAt.set(0, -0.34, -0.5);
      } else if (stageMode === 'ar') {
        targetRef.current.explodedTarget = 0;
        targetRef.current.autoOrbit = false;
        targetRef.current.camPos.set(0, 0.16, 9.8);
        targetRef.current.lookAt.set(0, 0.08, 0);
      }
    }, [config.cameraPreset, resetSignal, stageMode]);

    // Reset try-on head angle when resetSignal increments
    useEffect(() => {
      if (resetSignal > 0 && stageMode === 'tryon') {
        targetRef.current.tryOnYawTargetDeg = -14;
        targetRef.current.tryOnPitchTargetDeg = 4;
      }
    }, [resetSignal, stageMode]);

    // Mount Three.js scene once
    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
        });
      } catch {
        setWebglFailed(true);
        return;
      }

      const width = container.clientWidth || 640;
      const height = container.clientHeight || 520;
      targetRef.current.aspect = width / Math.max(1, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = LIGHTING_MOODS[config.lightingMood].exposure;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.replaceChildren(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
      if (stageModeRef.current === 'tryon') {
        const aspectBoost =
          width / height < 1.0 ? 1 / Math.max(0.72, (width / height) * 1.05) : 1.0;
        camera.position.set(0, 0.18, 12.8 * aspectBoost);
        targetRef.current.camPos.set(0, 0.18, 12.8 * aspectBoost);
        targetRef.current.lookAt.set(0, -0.34, -0.5);
        targetRef.current.currentLookAt.set(0, -0.34, -0.5);
      } else {
        camera.position.set(...CAMERA_PRESETS.runway.camPos);
      }

      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      const initialEnvRT = buildBoutiqueStudioEnvTexture(pmrem, config.lightingMood);
      scene.environment = initialEnvRT.texture;

      const mood = LIGHTING_MOODS[config.lightingMood];
      const keyLight = new THREE.DirectionalLight(mood.keyColor, mood.keyIntensity);
      keyLight.position.set(5.8, 6.2, 4.4);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(mood.rimColor, mood.rimIntensity);
      rimLight.position.set(-6.0, 3.0, -3.4);
      scene.add(rimLight);

      const fillLight = new THREE.HemisphereLight(mood.fillSky, mood.fillGround, 0.44);
      scene.add(fillLight);

      const brushedTex = createBrushedTitaniumTexture();
      const travertineTex = createTravertineTexture(theme === 'nocturne');
      const alabasterTex = createAlabasterStoneTexture(theme === 'nocturne');
      const lensSheenTex = createLensSpecularSheenTexture();

      const lensSheenMat = new THREE.MeshBasicMaterial({
        map: lensSheenTex,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });

      const finish =
        HERO_FRAME_FINISHES.find((f) => f.id === config.frameFinishId) ??
        HERO_FRAME_FINISHES[0];
      const optics = resolveTryOnLensMaterialState(config.lensMode, config.uvIndex);
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

      const brassCollarMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#C8A464'),
        metalness: 0.92,
        roughness: 0.24,
        envMapIntensity: 1.5,
      });

      const earSleeveMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#19191D'),
        roughness: 0.24,
        metalness: 0.08,
        clearcoat: 0.72,
        clearcoatRoughness: 0.15,
      });

      const lensMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(initialGradTex ? '#FFFFFF' : optics.hexColor),
        map: initialGradTex,
        attenuationColor: new THREE.Color(optics.attenuationHex),
        attenuationDistance: 1.15,
        transmission: optics.transmission * 0.28,
        transparent: true,
        opacity: optics.opacity,
        roughness: 0.03,
        metalness: 0.08,
        ior: 1.52,
        thickness: 0.26,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        iridescence: optics.iridescence,
        iridescenceIOR: 1.33,
        specularColor: new THREE.Color(optics.specularSheenHex),
        envMapIntensity: 2.55,
        side: THREE.DoubleSide,
      });

      const nosePadMat = new THREE.MeshPhysicalMaterial({
        color: 0xeae5db,
        roughness: 0.3,
        transmission: 0.35,
        transparent: true,
        opacity: 0.72,
      });

      const plinthMat = new THREE.MeshStandardMaterial({
        map: travertineTex,
        roughness: 0.78,
        metalness: 0.04,
        envMapIntensity: 0.6,
      });

      // Museum-grade Parisian Alabaster / Honed Marble material with gallery chiaroscuro falloff
      const alabasterMat = new THREE.MeshPhysicalMaterial({
        map: alabasterTex,
        bumpMap: alabasterTex,
        bumpScale: 0.012,
        roughness: 0.58,
        metalness: 0.015,
        clearcoat: 0.16,
        clearcoatRoughness: 0.42,
        sheen: 0.26,
        sheenColor: new THREE.Color('#F6EFE2'),
        sheenRoughness: 0.68,
        envMapIntensity: 0.52,
      });

      const causticTex = createCausticGlowTexture(optics.hexColor, optics.vltPercent);
      const causticMat = new THREE.MeshBasicMaterial({
        map: causticTex,
        transparent: true,
        opacity: mood.causticOpacity,
        depthWrite: false,
      });

      // CAD Roman Travertine Plinth
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

      plinthGroup.visible = stageModeRef.current === 'cad';
      scene.add(plinthGroup);

      // Unified Try-On Root (rotates sculpted bust + fitted glasses together in 6-DOF)
      const tryOnRoot = new THREE.Group();
      scene.add(tryOnRoot);

      // Sculpted Parisian Alabaster / Travertine Architectural Bust
      const bustGroup = new THREE.Group();
      const initialProfile = getFaceArchetype(faceArchetype).sculptProfile;
      const headGeo = createSculptedHeadGeometry(initialProfile);
      const headMesh = new THREE.Mesh(headGeo, alabasterMat);
      bustGroup.add(headMesh);

      const earGeo = createSculptedEarGeometry();
      const leftEarMesh = new THREE.Mesh(earGeo, alabasterMat);
      leftEarMesh.position.set(-1.95 * initialProfile.craniumWidthScale, -0.08, -1.72);
      leftEarMesh.rotation.y = -0.26;
      leftEarMesh.rotation.z = 0.12;
      bustGroup.add(leftEarMesh);

      const rightEarMesh = new THREE.Mesh(earGeo, alabasterMat);
      rightEarMesh.position.set(1.95 * initialProfile.craniumWidthScale, -0.08, -1.72);
      rightEarMesh.rotation.y = 0.26;
      rightEarMesh.rotation.z = -0.12;
      bustGroup.add(rightEarMesh);

      const neckGeo = createSculptedNeckGeometry();
      const neckMesh = new THREE.Mesh(neckGeo, alabasterMat);
      neckMesh.position.set(0, 0, -1.48);
      bustGroup.add(neckMesh);

      // Minimalist gallery pedestal collar under clavicles
      const collarGeo = new THREE.CylinderGeometry(2.14, 2.28, 0.28, 64);
      const collarMesh = new THREE.Mesh(collarGeo, plinthMat);
      collarMesh.position.set(0, -3.69, -1.48);
      bustGroup.add(collarMesh);

      const collarBrassGeo = new THREE.TorusGeometry(2.15, 0.022, 12, 72);
      collarBrassGeo.rotateX(Math.PI / 2);
      const collarBrassMesh = new THREE.Mesh(collarBrassGeo, brassCollarMat);
      collarBrassMesh.position.set(0, -3.55, -1.48);
      bustGroup.add(collarBrassMesh);

      bustGroup.visible = stageModeRef.current === 'tryon';
      tryOnRoot.add(bustGroup);

      // Precision VÉRA-01 Grade-5 Titanium Eyewear Assembly
      const eyewearGroup = new THREE.Group();
      tryOnRoot.add(eyewearGroup);

      const frontAssembly = new THREE.Group();
      frontAssembly.position.set(0, 0.12, 0.88);
      eyewearGroup.add(frontAssembly);

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

      const lensSheenGeo = new THREE.ShapeGeometry(buildLensShape(), 16);
      lensSheenGeo.center();
      lensSheenGeo.computeBoundingBox();
      if (lensSheenGeo.boundingBox) {
        const bb = lensSheenGeo.boundingBox;
        const spanX = Math.max(0.001, bb.max.x - bb.min.x);
        const spanY = Math.max(0.001, bb.max.y - bb.min.y);
        const pos = lensSheenGeo.getAttribute('position') as THREE.BufferAttribute;
        const uvs = lensSheenGeo.getAttribute('uv') as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          uvs.setXY(
            i,
            (pos.getX(i) - bb.min.x) / spanX,
            (pos.getY(i) - bb.min.y) / spanY
          );
        }
        uvs.needsUpdate = true;
      }

      const lugGeo = new THREE.BoxGeometry(0.28, 0.19, 0.24);
      const rivetGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.045, 16);
      rivetGeo.rotateX(Math.PI / 2);
      const padArmGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.3, 12);
      const padGeo = new THREE.CapsuleGeometry(0.056, 0.12, 6, 12);

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
        const sheenOverlay = new THREE.Mesh(lensSheenGeo, lensSheenMat);
        sheenOverlay.position.z = 0.036;
        lensMesh.add(sheenOverlay);
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
      const monoPlateGeo = new THREE.PlaneGeometry(0.68, 0.16);
      const initialMonoTex = createTempleMonogramTexture(
        monogram?.text || 'TVT',
        FOIL_BY_ID[monogram?.foil ?? 'gold-24k'].swatchHex
      );
      const monogramMat = new THREE.MeshBasicMaterial({
        map: initialMonoTex,
        transparent: true,
        depthWrite: false,
      });

      let leftMonogramMesh: THREE.Mesh | null = null;
      let rightMonogramMesh: THREE.Mesh | null = null;

      const buildTemple = (side: -1 | 1) => {
        // Pivot cleanly at the 5-barrel hinge so templeSplayRad opens naturally outward!
        const templeGroup = new THREE.Group();
        templeGroup.position.set(side * 2.18, 0.33, 0.72);

        for (let b = 0; b < 5; b++) {
          const barrel = new THREE.Mesh(
            barrelGeo,
            b % 2 === 1 ? accentMetalMat : metalMat
          );
          barrel.position.set(0, -0.09 + b * 0.045, 0);
          templeGroup.add(barrel);
        }
        const hingePin = new THREE.Mesh(pinGeo, metalMat);
        hingePin.position.set(0, 0, 0);
        templeGroup.add(hingePin);

        const armMesh = new THREE.Mesh(armGeo, metalMat);
        armMesh.rotation.y = Math.PI / 2 + side * 0.03;
        templeGroup.add(armMesh);

        const earSleeve = new THREE.Mesh(earTipGeo, earSleeveMat);
        earSleeve.rotation.y = Math.PI / 2 + side * 0.03;
        templeGroup.add(earSleeve);

        const groove = new THREE.Mesh(grooveGeo, accentMetalMat);
        groove.position.set(side * 0.046, 0, -0.9);
        templeGroup.add(groove);

        const monoMesh = new THREE.Mesh(monoPlateGeo, monogramMat);
        monoMesh.position.set(side * 0.062, 0.01, -0.78);
        monoMesh.rotation.y = side === 1 ? Math.PI / 2 : -Math.PI / 2;
        monoMesh.visible = Boolean(monogram?.enabled && monogram.text.trim());
        templeGroup.add(monoMesh);

        if (side === -1) {
          explodedParts.leftTemple = templeGroup;
          leftMonogramMesh = monoMesh;
        } else {
          explodedParts.rightTemple = templeGroup;
          rightMonogramMesh = monoMesh;
        }

        return templeGroup;
      };

      const leftTemple = buildTemple(-1);
      const rightTemple = buildTemple(1);
      eyewearGroup.add(leftTemple, rightTemple);

      sceneRefs.current = {
        renderer,
        scene,
        pmrem,
        envRT: initialEnvRT,
        metal: metalMat,
        lens: lensMat,
        lensGradientTex: initialGradTex,
        plinthMat,
        alabasterMat,
        causticMat,
        monogramMat,
        monogramTex: initialMonoTex,
        leftMonogramMesh,
        rightMonogramMesh,
        upperBrowMesh: upperBrow,
        headGeo,
        leftEarMesh,
        rightEarMesh,
        plinthGroup,
        bustGroup,
        tryOnRoot,
        eyewearGroup,
        leftTemple,
        rightTemple,
        keyLight,
        rimLight,
        fillLight,
      };

      // Direct pointer drag-to-rotate handlers (6-DOF Try-On head pose OR CAD orbit)
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

        if (stageModeRef.current === 'tryon') {
          targetRef.current.tryOnYawTargetDeg = Math.max(
            -HEAD_YAW_LIMIT_DEG,
            Math.min(HEAD_YAW_LIMIT_DEG, targetRef.current.tryOnYawTargetDeg + dx * 0.34)
          );
          targetRef.current.tryOnPitchTargetDeg = Math.max(
            -HEAD_PITCH_LIMIT_DEG,
            Math.min(HEAD_PITCH_LIMIT_DEG, targetRef.current.tryOnPitchTargetDeg + dy * 0.22)
          );
        } else if (stageModeRef.current === 'cad') {
          targetRef.current.rotY += dx * 0.0085;
          targetRef.current.rotX = Math.max(
            -0.55,
            Math.min(0.62, targetRef.current.rotX + dy * 0.0065)
          );
        }
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
          const aspect = w / h;
          targetRef.current.aspect = aspect;
          camera.aspect = aspect;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
          if (stageModeRef.current === 'tryon') {
            const aspectBoost = aspect < 1.0 ? 1 / Math.max(0.72, aspect * 1.05) : 1.0;
            targetRef.current.camPos.set(0, 0.18, 12.8 * aspectBoost);
          }
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
        const mode = stageModeRef.current;
        const fitT = fitTransformRef.current;

        camera.position.lerp(state.camPos, 0.09);
        state.currentLookAt.lerp(state.lookAt, 0.09);
        camera.lookAt(state.currentLookAt);

        if (mode === 'tryon') {
          plinthGroup.visible = false;
          bustGroup.visible = true;

          // Subtle studio gallery micro-poise when idle, instant drag responsiveness via 6-DOF filter
          const idleSwayDeg = state.dragging ? 0 : Math.sin(t * 0.65) * 1.6;
          state.poseFilter = stepHeadPoseFilter(state.poseFilter, {
            yawDeg: state.tryOnYawTargetDeg + idleSwayDeg,
            pitchDeg: state.tryOnPitchTargetDeg,
            rollDeg: 0,
            tx: 0,
            ty: 0,
            scale: 1,
            ipdPx: 140,
          });

          const smoothed = state.poseFilter.pose;
          tryOnRoot.rotation.y = (smoothed.yawDeg * Math.PI) / 180;
          tryOnRoot.rotation.x = (smoothed.pitchDeg * Math.PI) / 180;
          tryOnRoot.rotation.z = 0;
          tryOnRoot.position.set(0, 0.28 + Math.sin(t * 1.1) * 0.025, 0);
          tryOnRoot.scale.set(1, 1, 1);

          // Seat configured 3D glasses anatomically on nose bridge & temples with tailored couture proportion
          const coutureScale = 0.94;
          eyewearGroup.rotation.set(0, 0, 0);
          eyewearGroup.position.set(0, fitT.offsetY + 0.06, fitT.offsetZ + 0.05);
          eyewearGroup.scale.set(
            fitT.scaleX * coutureScale,
            fitT.scaleY * coutureScale,
            fitT.scaleZ * coutureScale
          );

          // Reset any exploded offsets cleanly
          explodedParts.leftRim.position.x = -1.15;
          explodedParts.rightRim.position.x = 1.15;
          explodedParts.leftLens.position.z = -0.01;
          explodedParts.rightLens.position.z = -0.01;
          explodedParts.leftRivets.position.z = 0;
          explodedParts.rightRivets.position.z = 0;
          explodedParts.bridgeGroup.position.set(0, 0, 0);
          explodedParts.leftTemple.position.set(-2.18, 0.33, 0.72);
          explodedParts.rightTemple.position.set(2.18, 0.33, 0.72);
          // Natural subtle temple splay so arms clear sculpted cranium cleanly
          explodedParts.leftTemple.rotation.y = -fitT.templeSplayRad;
          explodedParts.rightTemple.rotation.y = fitT.templeSplayRad;

          const roundedYaw = Math.round(smoothed.yawDeg);
          const roundedPitch = Math.round(smoothed.pitchDeg);
          if (
            roundedYaw !== state.lastReportedYaw ||
            roundedPitch !== state.lastReportedPitch
          ) {
            state.lastReportedYaw = roundedYaw;
            state.lastReportedPitch = roundedPitch;
            onHeadPoseChangeRef.current?.(roundedYaw, roundedPitch);
          }
        } else if (mode === 'ar') {
          plinthGroup.visible = false;
          bustGroup.visible = false;

          state.arPoseFilter = stepHeadPoseFilter(state.arPoseFilter, state.arTargetPose);
          const p = state.arPoseFilter.pose;
          const nudge = arNudgeRef.current;

          tryOnRoot.position.set(
            -p.tx * 2.1,
            -p.ty * 1.35 + nudge.offsetY,
            0
          );
          tryOnRoot.rotation.set(
            (p.pitchDeg * Math.PI) / 180,
            (p.yawDeg * Math.PI) / 180,
            ((p.rollDeg + nudge.tiltDeg) * Math.PI) / 180
          );
          const arScale = p.scale * nudge.scale * 0.92;
          tryOnRoot.scale.set(arScale, arScale, arScale);

          eyewearGroup.position.set(0, 0, 0);
          eyewearGroup.rotation.set(0, 0, 0);
          eyewearGroup.scale.set(fitT.scaleX, fitT.scaleY, fitT.scaleZ);
          explodedParts.leftRim.position.x = -1.15;
          explodedParts.rightRim.position.x = 1.15;
          explodedParts.leftLens.position.z = -0.01;
          explodedParts.rightLens.position.z = -0.01;
          explodedParts.leftRivets.position.z = 0;
          explodedParts.rightRivets.position.z = 0;
          explodedParts.bridgeGroup.position.set(0, 0, 0);
          explodedParts.leftTemple.position.set(-2.18, 0.33, 0.72);
          explodedParts.rightTemple.position.set(2.18, 0.33, 0.72);
          explodedParts.leftTemple.rotation.y = 0;
          explodedParts.rightTemple.rotation.y = 0;
        } else {
          // Sculptural 3D CAD Mode (preserving original v6.0 studio & Exploded Assembly!)
          plinthGroup.visible = true;
          bustGroup.visible = false;
          tryOnRoot.position.set(0, 0, 0);
          tryOnRoot.rotation.set(0, 0, 0);
          tryOnRoot.scale.set(1, 1, 1);

          if (!state.dragging && state.autoOrbit) {
            state.rotY += 0.0013;
          }

          state.currentY += (state.rotY - state.currentY) * 0.075;
          state.currentX += (state.rotX + state.scrollTilt - state.currentX) * 0.075;
          state.explodedCurrent += (state.explodedTarget - state.explodedCurrent) * 0.08;

          const ex = state.explodedCurrent;
          explodedParts.leftRim.position.x = -1.15 - ex * 0.42;
          explodedParts.rightRim.position.x = 1.15 + ex * 0.42;
          explodedParts.leftLens.position.z = -0.01 + ex * 0.92;
          explodedParts.rightLens.position.z = -0.01 + ex * 0.92;
          explodedParts.leftRivets.position.z = ex * 0.65;
          explodedParts.rightRivets.position.z = ex * 0.65;
          explodedParts.bridgeGroup.position.set(0, ex * 0.56, ex * 0.35);
          explodedParts.leftTemple.position.set(-2.18 - ex * 0.62, 0.33, 0.72 - ex * 0.65);
          explodedParts.rightTemple.position.set(2.18 + ex * 0.62, 0.33, 0.72 - ex * 0.65);
          explodedParts.leftTemple.rotation.y = 0;
          explodedParts.rightTemple.rotation.y = 0;

          eyewearGroup.scale.set(1, 1, 1);
          eyewearGroup.rotation.y = state.currentY;
          eyewearGroup.rotation.x = state.currentX;
          eyewearGroup.position.set(0, 0.22 + Math.sin(t * 1.3) * 0.065, 0);

          const causticScale = 1 + Math.sin(t * 1.3) * 0.045;
          causticPlane.scale.set(causticScale, causticScale, 1);
        }

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
        alabasterTex.dispose();
        lensSheenTex.dispose();
        causticTex.dispose();
        sceneRefs.current.lensGradientTex?.dispose();
        sceneRefs.current.monogramTex?.dispose();
        sceneRefs.current.envRT?.dispose();
        pmrem.dispose();
        mainSlabGeo.dispose();
        upperStepGeo.dispose();
        brassInlayGeo.dispose();
        causticPlaneGeo.dispose();
        headGeo.dispose();
        earGeo.dispose();
        neckGeo.dispose();
        collarGeo.dispose();
        collarBrassGeo.dispose();
        rimGeo.dispose();
        lensGeo.dispose();
        lensSheenGeo.dispose();
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
        monoPlateGeo.dispose();
        metalMat.dispose();
        accentMetalMat.dispose();
        brassCollarMat.dispose();
        earSleeveMat.dispose();
        lensMat.dispose();
        lensSheenMat.dispose();
        nosePadMat.dispose();
        plinthMat.dispose();
        alabasterMat.dispose();
        causticMat.dispose();
        monogramMat.dispose();
        renderer.dispose();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Morph Sculpted Alabaster Bust live when Face Archetype changes
    useEffect(() => {
      const profile = getFaceArchetype(faceArchetype).sculptProfile;
      if (sceneRefs.current.headGeo) {
        updateSculptedHeadPositions(sceneRefs.current.headGeo, profile);
      }
      if (sceneRefs.current.leftEarMesh && sceneRefs.current.rightEarMesh) {
        const earX = 1.95 * profile.craniumWidthScale;
        sceneRefs.current.leftEarMesh.position.x = -earX;
        sceneRefs.current.rightEarMesh.position.x = earX;
      }
    }, [faceArchetype]);

    // Update Frame SKU subtle structural bridge styling
    useEffect(() => {
      if (sceneRefs.current.upperBrowMesh) {
        // Monolith & Aviator showcase signature twin brow bar; Panto / Archival hide upper bar for sleek panto profile
        sceneRefs.current.upperBrowMesh.visible =
          frameSku === 'MV-EYE-01' || frameSku === 'MV-EYE-02';
      }
    }, [frameSku]);

    // Update Temple Foil Monogram engraving live on 3D frame
    useEffect(() => {
      const showMono = Boolean(monogram?.enabled && monogram.text.trim().length > 0);
      if (sceneRefs.current.leftMonogramMesh && sceneRefs.current.rightMonogramMesh) {
        sceneRefs.current.leftMonogramMesh.visible = showMono;
        sceneRefs.current.rightMonogramMesh.visible = showMono;
      }
      if (showMono && sceneRefs.current.monogramMat && monogram) {
        const oldTex = sceneRefs.current.monogramTex;
        const foilColor = FOIL_BY_ID[monogram.foil].swatchHex;
        const nextTex = createTempleMonogramTexture(monogram.text, foilColor);
        sceneRefs.current.monogramMat.map = nextTex;
        sceneRefs.current.monogramMat.needsUpdate = true;
        sceneRefs.current.monogramTex = nextTex;
        oldTex?.dispose();
      }
    }, [monogram]);

    // Update PBR Titanium Finish + Real-Time Photochromic UV / Lens Physics + Caustic Glow
    useEffect(() => {
      const finish =
        HERO_FRAME_FINISHES.find((f) => f.id === config.frameFinishId) ??
        HERO_FRAME_FINISHES[0];
      const optics = resolveTryOnLensMaterialState(config.lensMode, config.uvIndex);

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
        sceneRefs.current.lens.transmission = optics.transmission * 0.28;
        sceneRefs.current.lens.opacity = optics.opacity;
        sceneRefs.current.lens.iridescence = glareSplitEnabled
          ? Math.min(0.85, optics.iridescence + 0.22)
          : optics.iridescence;
        sceneRefs.current.lens.specularColor.set(optics.specularSheenHex);
        sceneRefs.current.lens.needsUpdate = true;
      }
      if (sceneRefs.current.causticMat) {
        const oldMap = sceneRefs.current.causticMat.map;
        sceneRefs.current.causticMat.map = createCausticGlowTexture(
          optics.hexColor,
          optics.vltPercent
        );
        sceneRefs.current.causticMat.needsUpdate = true;
        oldMap?.dispose();
      }
    }, [config.frameFinishId, config.lensMode, config.uvIndex, glareSplitEnabled]);

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

    // Update stone/alabaster tones on Paper <-> Nocturne wipe
    useEffect(() => {
      if (sceneRefs.current.plinthMat) {
        const oldMap = sceneRefs.current.plinthMat.map;
        sceneRefs.current.plinthMat.map = createTravertineTexture(theme === 'nocturne');
        sceneRefs.current.plinthMat.needsUpdate = true;
        oldMap?.dispose();
      }
      if (sceneRefs.current.alabasterMat) {
        const oldMap = sceneRefs.current.alabasterMat.map;
        const nextTex = createAlabasterStoneTexture(theme === 'nocturne');
        sceneRefs.current.alabasterMat.map = nextTex;
        sceneRefs.current.alabasterMat.bumpMap = nextTex;
        sceneRefs.current.alabasterMat.needsUpdate = true;
        oldMap?.dispose();
      }
    }, [theme]);

    // Privacy-First Webcam AR Lifecycle (ONLY requests getUserMedia when stageMode === 'ar')
    useEffect(() => {
      if (stageMode !== 'ar') {
        setArStatus('idle');
        setArTracked(false);
        onArStatusChangeRef.current?.('idle', false);
        return;
      }

      let cancelled = false;
      let activeStream: MediaStream | null = null;
      let trackIntervalId = 0;

      const startWebcam = async () => {
        if (
          typeof navigator === 'undefined' ||
          !navigator.mediaDevices ||
          typeof navigator.mediaDevices.getUserMedia !== 'function'
        ) {
          if (!cancelled) {
            setArStatus('fallback');
            setArErrorNote(
              locale === 'en'
                ? 'Browser camera interface unavailable in this environment.'
                : 'Trình duyệt hiện tại không hỗ trợ truy cập camera trực tiếp.'
            );
            onArStatusChangeRef.current?.('fallback', false);
          }
          return;
        }

        setArStatus('requesting');
        onArStatusChangeRef.current?.('requesting', false);

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
          if (cancelled) {
            stream.getTracks().forEach((tr) => tr.stop());
            return;
          }
          activeStream = stream;
          const video = videoRef.current;
          if (video) {
            video.srcObject = stream;
            await video.play().catch(() => {});
          }
          setArStatus('active');
          onArStatusChangeRef.current?.('active', false);

          // Lightweight 96x72 on-device skin-centroid face pose estimator (~15 Hz)
          const probeCanvas = document.createElement('canvas');
          probeCanvas.width = 96;
          probeCanvas.height = 72;
          const probeCtx = probeCanvas.getContext('2d', { willReadFrequently: true });

          trackIntervalId = window.setInterval(() => {
            if (cancelled || !probeCtx || !videoRef.current) return;
            const v = videoRef.current;
            if (v.readyState < 2 || v.videoWidth === 0) return;

            probeCtx.drawImage(v, 0, 0, 96, 72);
            const imgData = probeCtx.getImageData(0, 0, 96, 72);
            const est = estimateFacePoseFromImageData(imgData.data, 96, 72);
            setArTracked(est.detected);
            onArStatusChangeRef.current?.('active', est.detected);

            if (est.detected) {
              targetRef.current.arTargetPose = {
                yawDeg: est.estimatedYawDeg,
                pitchDeg: est.estimatedPitchDeg,
                rollDeg: est.estimatedRollDeg,
                tx: est.centerXNorm,
                ty: est.centerYNorm,
                scale: Math.max(0.7, Math.min(1.45, est.faceWidthRatio / 0.34)),
                ipdPx: est.estimatedIpdPx,
              };
            }
          }, 66);
        } catch {
          if (!cancelled) {
            setArStatus('fallback');
            setArErrorNote(
              locale === 'en'
                ? 'No live camera detected or camera permission declined. All 3D processing stays 100% on-device.'
                : 'Không phát hiện camera hoặc chưa cấp quyền truy cập. Toàn bộ xử lý 3D diễn ra nội bộ trên thiết bị.'
            );
            onArStatusChangeRef.current?.('fallback', false);
          }
        }
      };

      void startWebcam();

      return () => {
        cancelled = true;
        if (trackIntervalId) window.clearInterval(trackIntervalId);
        if (activeStream) {
          activeStream.getTracks().forEach((tr) => tr.stop());
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };
    }, [stageMode, locale]);

    // Polarized Glare Curtain pointer drag handler
    const updateGlareSplitFromClientX = (clientX: number) => {
      const rect = stageWrapperRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0) return;
      const pct = Math.max(14, Math.min(86, Math.round(((clientX - rect.left) / rect.width) * 100)));
      onGlareSplitPercentChange?.(pct);
    };

    const liveOptics = resolveTryOnLensMaterialState(config.lensMode, config.uvIndex);
    const glareShield = computePolarizedGlareShield(glareAngleDeg, glareSplitEnabled);
    const unpolarizedGlare = computePolarizedGlareShield(glareAngleDeg, false);

    if (webglFailed) {
      const finish =
        HERO_FRAME_FINISHES.find((f) => f.id === config.frameFinishId) ??
        HERO_FRAME_FINISHES[0];
      return (
        <div className="flex h-full w-full items-center justify-center p-8">
          <svg
            viewBox="0 0 540 280"
            className="w-full max-w-[480px]"
            aria-label="VÉRA-01 Monolith Frame"
          >
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
              fill={liveOptics.hexColor}
              fillOpacity={liveOptics.opacity}
              stroke="url(#fallback-metal)"
              strokeWidth="9"
            />
            <polygon
              points="288,104 316,82 412,82 448,102 444,164 412,194 334,194 298,168"
              fill={liveOptics.hexColor}
              fillOpacity={liveOptics.opacity}
              stroke="url(#fallback-metal)"
              strokeWidth="9"
            />
            <rect x="248" y="114" width="44" height="10" rx="2" fill="url(#fallback-metal)" />
          </svg>
        </div>
      );
    }

    return (
      <div
        ref={stageWrapperRef}
        className="relative h-full w-full overflow-hidden"
        onPointerMove={(e) => {
          if (draggingDivider) {
            updateGlareSplitFromClientX(e.clientX);
          }
        }}
        onPointerUp={() => setDraggingDivider(false)}
        onPointerCancel={() => setDraggingDivider(false)}
      >
        {/* Subtle Parisian Gallery Chiaroscuro Backdrop behind Sculpted Bust (Try-On Mode) */}
        {stageMode === 'tryon' && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background:
                theme === 'nocturne'
                  ? 'radial-gradient(ellipse 68% 72% at 50% 44%, rgba(64, 58, 50, 0.45) 0%, rgba(16, 16, 20, 0.78) 68%, rgba(11, 11, 13, 0.94) 100%)'
                  : 'radial-gradient(ellipse 66% 70% at 50% 44%, rgba(226, 217, 202, 0.35) 0%, rgba(196, 184, 165, 0.56) 66%, rgba(173, 160, 141, 0.72) 100%)',
            }}
          />
        )}

        {/* Mirrored Privacy-First Webcam Feed Layer (Only visible when stageMode === 'ar' & camera active) */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          aria-label="Mirrored Live Webcam Virtual Try-On Feed"
          className={`absolute inset-0 h-full w-full -scale-x-100 object-cover transition-opacity duration-300 ${
            stageMode === 'ar' && arStatus === 'active'
              ? 'z-[1] opacity-100'
              : 'pointer-events-none z-0 opacity-0'
          }`}
        />

        {/* Primary 60fps Three.js PBR WebGL Canvas */}
        <div
          ref={mountRef}
          data-testid="eyewear-webgl-mount"
          data-cursor={stageMode === 'tryon' ? 'ROTATE HEAD' : 'DRAG 3D'}
          className="relative z-[5] h-full w-full select-none"
          aria-label="Interactive 3D Maison Véra Virtual Try-On & Titanium Eyewear Stage"
        />

        {/* Live Polarized Riviera Glare Optical Curtain Overlay (Try-On & AR Modes) */}
        {glareSplitEnabled && (stageMode === 'tryon' || stageMode === 'ar') && (
          <div
            data-testid="tryon-glare-overlay"
            className="pointer-events-none absolute inset-0 z-[12] overflow-hidden"
          >
            {/* LEFT SIDE: Unpolarized Dazzling Riviera Sunlit Horizontal Glare Veil */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${glareSplitPercent}%` }}
            >
              <div
                className="h-full w-full"
                style={{
                  background: `linear-gradient(168deg, rgba(255,246,220,${(
                    unpolarizedGlare.glareVeilOpacity * 0.62
                  ).toFixed(2)}) 0%, rgba(255,222,158,${(
                    unpolarizedGlare.glareVeilOpacity * 0.44
                  ).toFixed(2)}) 36%, rgba(255,252,240,${(
                    unpolarizedGlare.glareVeilOpacity * 0.72
                  ).toFixed(2)}) 54%, rgba(235,204,148,${(
                    unpolarizedGlare.glareVeilOpacity * 0.36
                  ).toFixed(2)}) 100%)`,
                }}
              />
              {/* Horizontal Brewster 53.1° Riviera Water/Road Specular Shimmer Bands */}
              <svg
                viewBox="0 0 600 500"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="absolute inset-0 h-full w-full opacity-75"
              >
                <defs>
                  <linearGradient id="riviera-streak" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FFFDF5" stopOpacity="0.1" />
                    <stop offset="48%" stopColor="#FFFDF2" stopOpacity="0.92" />
                    <stop offset="100%" stopColor="#FFE1A6" stopOpacity="0.15" />
                  </linearGradient>
                </defs>
                <rect x="0" y="138" width="600" height="7" fill="url(#riviera-streak)" />
                <rect x="0" y="168" width="600" height="14" fill="url(#riviera-streak)" opacity="0.72" />
                <rect x="0" y="212" width="600" height="5" fill="url(#riviera-streak)" opacity="0.88" />
                <rect x="0" y="256" width="600" height="11" fill="url(#riviera-streak)" opacity="0.64" />
                <rect x="0" y="314" width="600" height="6" fill="url(#riviera-streak)" opacity="0.52" />
              </svg>
              <div className="absolute left-3 top-[116px] border border-amber-900/35 bg-[#111111]/82 px-2.5 py-1 font-mono-tech text-[9px] uppercase tracking-[0.15em] text-[#FCE7BD] backdrop-blur-sm sm:left-5 sm:top-[122px]">
                {locale === 'en' ? 'UNPOLARIZED RIVIERA GLARE' : 'CHÓI NGANG CHƯA PHÂN CỰC'}
              </div>
            </div>

            {/* RIGHT SIDE: Crossed Vertical Polarizer Optical Clarity Zone */}
            <div
              className="absolute inset-y-0 right-0"
              style={{
                left: `${glareSplitPercent}%`,
                background: `linear-gradient(180deg, rgba(16, 28, 30, ${(
                  0.04 + (1 - glareShield.transmittedGlareFraction) * 0.06
                ).toFixed(3)}) 0%, rgba(184, 74, 39, 0.03) 100%)`,
              }}
            >
              <div className="absolute right-3 top-3 border border-[#D4B483]/50 bg-[#111111]/84 px-2.5 py-1 font-mono-tech text-[9px] uppercase tracking-[0.15em] text-[#D4B483] backdrop-blur-sm sm:right-5 sm:top-4">
                {locale === 'en' ? 'POLARIZED' : 'PHÂN CỰC'} · -{glareShield.glareReductionPercent}% (θ={glareShield.glareAngleDeg.toFixed(0)}°)
              </div>
            </div>

            {/* Draggable Champagne-Gold Malus Optical Split Handle */}
            <button
              type="button"
              data-testid="tryon-glare-divider"
              aria-label="Drag Polarized Glare Optical Split Handle"
              onPointerDown={(e) => {
                e.stopPropagation();
                setDraggingDivider(true);
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') {
                  onGlareSplitPercentChange?.(Math.max(14, glareSplitPercent - 4));
                } else if (e.key === 'ArrowRight') {
                  onGlareSplitPercentChange?.(Math.min(86, glareSplitPercent + 4));
                }
              }}
              className="pointer-events-auto absolute inset-y-0 z-20 -ml-3 flex w-6 cursor-ew-resize items-center justify-center focus:outline-none"
              style={{ left: `${glareSplitPercent}%` }}
            >
              <span className="h-full w-[1.5px] bg-[#D4B483] shadow-[0_0_12px_rgba(212,180,131,0.85)]" />
              <span className="absolute flex h-8 w-8 items-center justify-center rounded-full border border-[#D4B483] bg-[#111111]/90 text-[#F6F3ED] shadow-md">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M5.5 4.5 L2.5 8 L5.5 11.5" />
                  <path d="M10.5 4.5 L13.5 8 L10.5 11.5" />
                </svg>
              </span>
            </button>
          </div>
        )}

        {/* Parisian Studio Fallback Notice when Webcam AR has no camera or declined permission */}
        {stageMode === 'ar' && arStatus === 'fallback' && (
          <div
            data-testid="webcam-ar-fallback"
            className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--studio-bg)]/94 p-6 backdrop-blur-md"
          >
            <div className="max-w-md border border-[var(--hairline-strong)] bg-[var(--surface)] p-6 text-center shadow-lg">
              <div className="mx-auto flex h-11 w-11 items-center justify-center border border-[var(--accent)]/40 bg-[var(--bg)] text-[var(--accent)]">
                <CameraOff size={18} strokeWidth={1.5} />
              </div>
              <p className="mt-3 font-mono-tech text-[9.5px] uppercase tracking-[0.22em] text-[var(--accent)]">
                {locale === 'en' ? 'PARISIAN STUDIO FALLBACK' : 'CHẾ ĐỘ DỰ PHÒNG STUDIO PARIS'}
              </p>
              <h3 className="mt-1.5 font-serif-editorial text-2xl font-normal text-[var(--ink)]">
                {locale === 'en'
                  ? 'Camera Feed Unavailable'
                  : 'Không Phát Hiện Camera Trực Tiếp'}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
                {arErrorNote}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {onReturnToTryOn && (
                  <button
                    type="button"
                    data-testid="ar-return-tryon-btn"
                    onClick={onReturnToTryOn}
                    className="inline-flex items-center gap-1.5 border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--surface)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)]"
                  >
                    <Sparkles size={12} strokeWidth={1.6} />
                    {locale === 'en'
                      ? 'Return to 3D Virtual Try-On'
                      : 'Quay Lại Thử Kính 3D'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Webcam AR Requesting Indicator */}
        {stageMode === 'ar' && arStatus === 'requesting' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--studio-bg)]/84 p-4 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 border border-[var(--hairline-strong)] bg-[var(--surface)] px-5 py-4 text-center">
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--ink)]">
                {locale === 'en'
                  ? 'INITIALIZING PRIVACY-FIRST ON-DEVICE CAMERA...'
                  : 'ĐANG KHỞI TẠO CAMERA NỘI BỘ BẢO MẬT...'}
              </span>
              {onReturnToTryOn && (
                <button
                  type="button"
                  onClick={onReturnToTryOn}
                  className="font-mono-tech text-[9.5px] uppercase tracking-[0.16em] text-[var(--accent)] underline underline-offset-4"
                >
                  {locale === 'en' ? 'Switch to 3D Studio Bust' : 'Chuyển Sang Tượng 3D Studio'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Webcam AR Live Tracking Badge */}
        {stageMode === 'ar' && arStatus === 'active' && (
          <div className="pointer-events-none absolute left-4 top-4 z-15 flex items-center gap-2 border border-[var(--hairline-strong)] bg-[#111111]/82 px-3 py-1.5 font-mono-tech text-[9.5px] uppercase tracking-[0.16em] text-[#F6F3ED] backdrop-blur-md">
            <span
              className={`h-2 w-2 rounded-full ${
                arTracked ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span>
              {arTracked
                ? locale === 'en'
                  ? 'ON-DEVICE 6-DOF FACE LOCK'
                  : 'ĐÃ KHÓA KHUÔN MẶT 6-DOF'
                : locale === 'en'
                ? 'CENTER FACE IN FRAME · MICRO-ALIGN READY'
                : 'ĐẶT MẶT VÀO GIỮA KHUNG · TÙY CHỈNH SẴN SÀNG'}
            </span>
          </div>
        )}

        {/* Live Optical Physics Readout Pill (CAD Mode) */}
        {stageMode === 'cad' && (
          <div
            data-testid="3d-optical-hud"
            className="pointer-events-none absolute bottom-4 left-5 z-10 flex flex-wrap items-center gap-2 border border-[var(--hairline-strong)] bg-[var(--surface)]/90 px-3 py-1.5 font-mono-tech text-[9.5px] uppercase tracking-[0.14em] text-[var(--ink)] backdrop-blur-md sm:left-7"
          >
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            <span>PMREM HDRI</span>
            <span className="opacity-35">|</span>
            <span>VLT {liveOptics.vltPercent}%</span>
            <span className="opacity-35">|</span>
            <span>UV400 {liveOptics.uv400BlockPercent}%</span>
            <span className="opacity-35">|</span>
            <span className="text-[var(--accent)]">{liveOptics.filterCategory}</span>
            {config.lensMode === 'photochromic-uv' && (
              <>
                <span className="opacity-35">|</span>
                <span>UV {config.uvIndex}/11</span>
              </>
            )}
          </div>
        )}

        {/* Exploded Assembly Floating Engineering Callout Badges (CAD Mode Only) */}
        {stageMode === 'cad' && config.cameraPreset === 'exploded' && (
          <div
            data-testid="exploded-callouts"
            className="pointer-events-none absolute inset-0 z-10 hidden sm:block"
          >
            <div className="absolute left-[8%] top-[22%] border border-[var(--hairline-strong)] bg-[var(--surface)]/92 px-2.5 py-1 font-mono-tech text-[9px] uppercase tracking-[0.18em] text-[var(--ink)] shadow-sm backdrop-blur-sm">
              <span className="text-[var(--accent)]">01 · </span>
              {locale === 'en' ? 'ZERO-SOLDER TI BRIDGE' : 'CẦU KÍNH TITAN KHÔNG HÀN'}
            </div>
            <div className="absolute right-[7%] top-[25%] border border-[var(--hairline-strong)] bg-[var(--surface)]/92 px-2.5 py-1 font-mono-tech text-[9px] uppercase tracking-[0.18em] text-[var(--ink)] shadow-sm backdrop-blur-sm">
              <span className="text-[var(--accent)]">02 · </span>
              {locale === 'en' ? '5-BARREL CNC HINGE' : 'BẢN LỀ CNC 5 CHẤU'}
            </div>
            <div className="absolute left-[12%] bottom-[22%] border border-[var(--hairline-strong)] bg-[var(--surface)]/92 px-2.5 py-1 font-mono-tech text-[9px] uppercase tracking-[0.18em] text-[var(--ink)] shadow-sm backdrop-blur-sm">
              <span className="text-[var(--accent)]">03 · </span>
              {locale === 'en' ? 'CR-39 IRIDESCENT OPTICS' : 'TRÒNG QUANG HỌC CR-39'}
            </div>
            <div className="absolute right-[10%] bottom-[20%] border border-[var(--hairline-strong)] bg-[var(--surface)]/92 px-2.5 py-1 font-mono-tech text-[9px] uppercase tracking-[0.18em] text-[var(--ink)] shadow-sm backdrop-blur-sm">
              <span className="text-[var(--accent)]">04 · </span>
              {locale === 'en' ? '4MM GRADE-5 BEVEL RIM' : 'VÀNH TITAN CẤP 5 DÀY 4MM'}
            </div>
          </div>
        )}

        {/* Quick 3/4 Pose & Reset Micro-Bar in Try-On Mode (Bottom Right of Canvas) */}
        {stageMode === 'tryon' && (
          <div className="absolute bottom-3 right-3 z-15 flex items-center gap-1 border border-[var(--hairline-strong)] bg-[var(--surface)]/90 p-0.5 backdrop-blur-md sm:bottom-4 sm:right-5">
            {[
              { id: 'pose-left', label: '-34°', yaw: -34, pitch: 4 },
              { id: 'pose-front', label: '0°', yaw: 0, pitch: 2 },
              { id: 'pose-right', label: '+34°', yaw: 34, pitch: 4 },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                data-testid={p.id}
                onClick={() => {
                  targetRef.current.tryOnYawTargetDeg = p.yaw;
                  targetRef.current.tryOnPitchTargetDeg = p.pitch;
                }}
                className="px-2 py-1 font-mono-tech text-[9.5px] uppercase tracking-[0.1em] text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--surface)]"
                title={`Rotate bust to ${p.label}`}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              data-testid="tryon-reset-pose-btn"
              onClick={() => {
                targetRef.current.tryOnYawTargetDeg = -14;
                targetRef.current.tryOnPitchTargetDeg = 4;
              }}
              className="inline-flex items-center justify-center border-l border-[var(--hairline)] px-2 py-1 text-[var(--ink-muted)] transition-colors hover:text-[var(--accent)]"
              aria-label="Reset head pose"
              title="Reset pose"
            >
              <RotateCcw size={11} strokeWidth={1.6} />
            </button>
          </div>
        )}
      </div>
    );
  }
);

Eyewear3DCanvas.displayName = 'Eyewear3DCanvas';
