import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HERO_FRAME_FINISHES, HERO_LENS_TINTS } from '../data/catalog';
import type { HeroEyewearConfig, ThemeMode } from '../types/commerce';

interface Eyewear3DCanvasProps {
  config: HeroEyewearConfig;
  theme: ThemeMode;
  resetSignal: number;
}

function createBrushedTitaniumTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 1) {
      const shade = 112 + Math.floor(Math.sin(y * 1.9) * 14 + (Math.random() - 0.5) * 28);
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

function createShadowDiscTexture(isDark: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 122);
    if (isDark) {
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.52)');
      grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      grad.addColorStop(0, 'rgba(26, 20, 14, 0.24)');
      grad.addColorStop(0.55, 'rgba(26, 20, 14, 0.08)');
      grad.addColorStop(1, 'rgba(26, 20, 14, 0)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  return new THREE.CanvasTexture(canvas);
}

/**
 * Creates an architectural octagonal-crown rim shape with inner cutout hole
 */
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
  // Side profile extending along +X (will be rotated to -Z depth)
  arm.moveTo(0, 0.13);
  arm.lineTo(2.45, 0.085);
  arm.quadraticCurveTo(2.85, 0.06, 3.05, -0.18);
  arm.lineTo(3.26, -0.54);
  arm.quadraticCurveTo(3.32, -0.64, 3.16, -0.68);
  arm.lineTo(2.96, -0.58);
  arm.lineTo(2.74, -0.22);
  arm.quadraticCurveTo(2.6, -0.06, 2.35, -0.05);
  arm.lineTo(0, -0.11);
  arm.closePath();
  return arm;
}

export const Eyewear3DCanvas: React.FC<Eyewear3DCanvasProps> = ({
  config,
  theme,
  resetSignal,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  const materialsRef = useRef<{
    metal: THREE.MeshPhysicalMaterial | null;
    accentMetal: THREE.MeshStandardMaterial | null;
    lens: THREE.MeshPhysicalMaterial | null;
    shadowMat: THREE.MeshBasicMaterial | null;
  }>({ metal: null, accentMetal: null, lens: null, shadowMat: null });

  const orbitTargetRef = useRef({
    rotY: -0.46,
    rotX: 0.16,
    currentY: -0.46,
    currentX: 0.16,
    dragging: false,
    lastX: 0,
    lastY: 0,
    scrollTilt: 0,
  });

  // Reset camera view when requested
  useEffect(() => {
    orbitTargetRef.current.rotY = -0.46;
    orbitTargetRef.current.rotX = 0.16;
  }, [resetSignal]);

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
    renderer.toneMappingExposure = 1.18;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    camera.position.set(0, 0.45, 8.6);
    camera.lookAt(0, -0.04, 0);

    // Studio IBL using RoomEnvironment
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;

    // Studio soft directional + warm rim lighting
    const keyLight = new THREE.DirectionalLight(0xfff6e8, 2.2);
    keyLight.position.set(4.5, 6.5, 5.2);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd4b483, 1.35);
    rimLight.position.set(-5.2, 2.4, -3.5);
    scene.add(rimLight);

    const fillLight = new THREE.HemisphereLight(0xf6f3ed, 0x3b352d, 0.75);
    scene.add(fillLight);

    // Procedural brushed titanium texture
    const brushedTex = createBrushedTitaniumTexture();

    const finish =
      HERO_FRAME_FINISHES.find((f) => f.id === config.frameFinishId) ??
      HERO_FRAME_FINISHES[0];
    const lensSpec =
      HERO_LENS_TINTS.find((l) => l.id === config.lensTintId) ?? HERO_LENS_TINTS[0];

    const metalMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(finish.metalHex),
      metalness: finish.metalness,
      roughness: finish.roughness,
      roughnessMap: brushedTex,
      bumpMap: brushedTex,
      bumpScale: 0.004,
      clearcoat: 0.32,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.45,
    });

    const accentMetalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#B84A27'),
      metalness: 0.85,
      roughness: 0.25,
      envMapIntensity: 1.3,
    });

    const lensMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(lensSpec.hex),
      attenuationColor: new THREE.Color(lensSpec.attenuationHex),
      attenuationDistance: 1.4,
      transmission: 0.72,
      transparent: true,
      opacity: lensSpec.opacity,
      roughness: 0.05,
      metalness: 0.06,
      ior: 1.52,
      thickness: 0.28,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.65,
      side: THREE.DoubleSide,
    });

    const nosePadMat = new THREE.MeshPhysicalMaterial({
      color: 0xeae5db,
      roughness: 0.35,
      transmission: 0.45,
      transparent: true,
      opacity: 0.72,
    });

    materialsRef.current = {
      metal: metalMat,
      accentMetal: accentMetalMat,
      lens: lensMat,
      shadowMat: null,
    };

    // Root eyewear assembly
    const eyewearGroup = new THREE.Group();
    scene.add(eyewearGroup);

    const frontAssembly = new THREE.Group();
    frontAssembly.position.set(0, 0.1, 0.88);
    eyewearGroup.add(frontAssembly);

    // Architectural milled rims (Left & Right) with subtle wrap angle
    const rimGeo = new THREE.ExtrudeGeometry(buildRimShape(1), {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.032,
      bevelSize: 0.024,
      bevelSegments: 4,
      curveSegments: 12,
    });
    rimGeo.center();

    const lensGeo = new THREE.ExtrudeGeometry(buildLensShape(), {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.008,
      bevelSegments: 2,
    });
    lensGeo.center();

    const buildEyeUnit = (side: -1 | 1) => {
      const unit = new THREE.Group();
      const rimMesh = new THREE.Mesh(rimGeo, metalMat);
      if (side === -1) rimMesh.scale.x = -1;
      unit.add(rimMesh);

      const lensMesh = new THREE.Mesh(lensGeo, lensMat);
      if (side === -1) lensMesh.scale.x = -1;
      lensMesh.position.z = -0.01;
      unit.add(lensMesh);

      // Endpiece lug + precision micro-rivets
      const lugGeo = new THREE.BoxGeometry(0.26, 0.18, 0.24);
      const lug = new THREE.Mesh(lugGeo, metalMat);
      lug.position.set(side * 1.0, 0.33, -0.08);
      unit.add(lug);

      const rivetGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.04, 16);
      rivetGeo.rotateX(Math.PI / 2);
      const rivetTop = new THREE.Mesh(rivetGeo, accentMetalMat);
      rivetTop.position.set(side * 1.01, 0.37, 0.05);
      const rivetBot = new THREE.Mesh(rivetGeo, accentMetalMat);
      rivetBot.position.set(side * 1.01, 0.29, 0.05);
      unit.add(rivetTop, rivetBot);

      // Nosepad titanium wire & silicone pad
      const padArmGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.28, 10);
      const padArm = new THREE.Mesh(padArmGeo, metalMat);
      padArm.position.set(-side * 0.72, 0.02, -0.2);
      padArm.rotation.z = side * 0.45;
      padArm.rotation.x = 0.35;
      unit.add(padArm);

      const padGeo = new THREE.CapsuleGeometry(0.055, 0.12, 6, 12);
      const pad = new THREE.Mesh(padGeo, nosePadMat);
      pad.scale.set(0.65, 1, 0.45);
      pad.position.set(-side * 0.64, -0.08, -0.28);
      pad.rotation.y = side * 0.4;
      unit.add(pad);

      unit.position.set(side * 1.15, 0, 0);
      unit.rotation.y = -side * 0.09; // subtle ergonomic wrap
      return unit;
    };

    frontAssembly.add(buildEyeUnit(-1), buildEyeUnit(1));

    // Architectural CNC milled double nose bridge
    const upperBrowGeo = new THREE.BoxGeometry(2.86, 0.095, 0.14);
    const upperBrow = new THREE.Mesh(upperBrowGeo, metalMat);
    upperBrow.position.set(0, 0.56, 0.03);
    frontAssembly.add(upperBrow);

    const bridgeArchGeo = new THREE.BoxGeometry(0.58, 0.12, 0.16);
    const bridgeArch = new THREE.Mesh(bridgeArchGeo, metalMat);
    bridgeArch.position.set(0, 0.28, 0.04);
    frontAssembly.add(bridgeArch);

    // Precision hinge cylinders + sculpted brushed temple arms
    const armGeo = new THREE.ExtrudeGeometry(buildTempleArmShape(), {
      depth: 0.068,
      bevelEnabled: true,
      bevelThickness: 0.014,
      bevelSize: 0.012,
      bevelSegments: 3,
    });
    armGeo.translate(0, 0, -0.034);

    const hingeGeo = new THREE.CylinderGeometry(0.062, 0.062, 0.22, 16);

    const buildTemple = (side: -1 | 1) => {
      const templeGroup = new THREE.Group();
      const hinge = new THREE.Mesh(hingeGeo, metalMat);
      hinge.position.set(side * 2.18, 0.33, 0.72);
      templeGroup.add(hinge);

      const armMesh = new THREE.Mesh(armGeo, metalMat);
      armMesh.rotation.y = Math.PI / 2; // extend backward along -Z
      armMesh.position.set(side * 2.18, 0.33, 0.72);
      armMesh.rotation.y += side * 0.03;
      templeGroup.add(armMesh);

      // Architectural laser groove detail stripe
      const grooveGeo = new THREE.BoxGeometry(0.018, 0.025, 1.55);
      const groove = new THREE.Mesh(grooveGeo, accentMetalMat);
      groove.position.set(side * 2.228, 0.33, -0.2);
      templeGroup.add(groove);

      return templeGroup;
    };

    eyewearGroup.add(buildTemple(-1), buildTemple(1));

    // Floating soft studio shadow disc underneath
    const shadowTex = createShadowDiscTexture(theme === 'nocturne');
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    materialsRef.current.shadowMat = shadowMat;

    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.4), shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0, -1.18, -0.35);
    scene.add(shadowPlane);

    // Pointer drag-to-orbit handlers
    const dom = renderer.domElement;
    dom.style.cursor = 'grab';
    dom.style.touchAction = 'pan-y';

    const onPointerDown = (e: PointerEvent) => {
      orbitTargetRef.current.dragging = true;
      orbitTargetRef.current.lastX = e.clientX;
      orbitTargetRef.current.lastY = e.clientY;
      dom.style.cursor = 'grabbing';
      dom.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!orbitTargetRef.current.dragging) return;
      const dx = e.clientX - orbitTargetRef.current.lastX;
      const dy = e.clientY - orbitTargetRef.current.lastY;
      orbitTargetRef.current.lastX = e.clientX;
      orbitTargetRef.current.lastY = e.clientY;
      orbitTargetRef.current.rotY += dx * 0.0085;
      orbitTargetRef.current.rotX = Math.max(
        -0.55,
        Math.min(0.62, orbitTargetRef.current.rotX + dy * 0.0065)
      );
    };

    const onPointerUp = (e: PointerEvent) => {
      orbitTargetRef.current.dragging = false;
      dom.style.cursor = 'grab';
      if (dom.hasPointerCapture(e.pointerId)) {
        dom.releasePointerCapture(e.pointerId);
      }
    };

    const onScroll = () => {
      const ratio = Math.min(1, window.scrollY / 640);
      orbitTargetRef.current.scrollTilt = ratio * 0.34;
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

    // Animation loop with IntersectionObserver pause when off-screen
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
      if (!isVisible) return;
      const t = clock.getElapsedTime();
      const state = orbitTargetRef.current;

      if (!state.dragging) {
        state.rotY += 0.0014;
      }

      state.currentY += (state.rotY - state.currentY) * 0.08;
      state.currentX += (state.rotX + state.scrollTilt - state.currentX) * 0.08;

      eyewearGroup.rotation.y = state.currentY;
      eyewearGroup.rotation.x = state.currentX;
      eyewearGroup.position.y = 0.18 + Math.sin(t * 1.25) * 0.07;

      const shadowScale = 1 - Math.sin(t * 1.25) * 0.04;
      shadowPlane.scale.set(shadowScale, shadowScale, 1);

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
      shadowTex.dispose();
      envTexture.dispose();
      pmrem.dispose();
      rimGeo.dispose();
      lensGeo.dispose();
      armGeo.dispose();
      hingeGeo.dispose();
      upperBrowGeo.dispose();
      bridgeArchGeo.dispose();
      metalMat.dispose();
      accentMetalMat.dispose();
      lensMat.dispose();
      nosePadMat.dispose();
      shadowMat.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update PBR material colors smoothly when user switches Finish or Lens Tint
  useEffect(() => {
    const finish =
      HERO_FRAME_FINISHES.find((f) => f.id === config.frameFinishId) ??
      HERO_FRAME_FINISHES[0];
    const lensSpec =
      HERO_LENS_TINTS.find((l) => l.id === config.lensTintId) ?? HERO_LENS_TINTS[0];

    if (materialsRef.current.metal) {
      materialsRef.current.metal.color.set(finish.metalHex);
      materialsRef.current.metal.metalness = finish.metalness;
      materialsRef.current.metal.roughness = finish.roughness;
      materialsRef.current.metal.needsUpdate = true;
    }
    if (materialsRef.current.lens) {
      materialsRef.current.lens.color.set(lensSpec.hex);
      materialsRef.current.lens.attenuationColor.set(lensSpec.attenuationHex);
      materialsRef.current.lens.opacity = lensSpec.opacity;
      materialsRef.current.lens.needsUpdate = true;
    }
  }, [config]);

  // Update studio shadow disc for Paper vs Nocturne theme
  useEffect(() => {
    if (materialsRef.current.shadowMat) {
      const oldMap = materialsRef.current.shadowMat.map;
      materialsRef.current.shadowMat.map = createShadowDiscTexture(theme === 'nocturne');
      materialsRef.current.shadowMat.needsUpdate = true;
      oldMap?.dispose();
    }
  }, [theme]);

  if (webglFailed) {
    const finish =
      HERO_FRAME_FINISHES.find((f) => f.id === config.frameFinishId) ??
      HERO_FRAME_FINISHES[0];
    const lensSpec =
      HERO_LENS_TINTS.find((l) => l.id === config.lensTintId) ?? HERO_LENS_TINTS[0];
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
            fill={lensSpec.hex}
            fillOpacity={lensSpec.opacity}
            stroke="url(#fallback-metal)"
            strokeWidth="9"
          />
          <polygon
            points="288,104 316,82 412,82 448,102 444,164 412,194 334,194 298,168"
            fill={lensSpec.hex}
            fillOpacity={lensSpec.opacity}
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
      ref={mountRef}
      data-cursor="DRAG 3D"
      className="h-full w-full select-none"
      aria-label="Interactive 3D VÉRA-01 Monolith Titanium Eyewear Showcase"
    />
  );
};
