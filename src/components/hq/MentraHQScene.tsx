'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';

type ModuleKey =
  | 'ai'
  | 'quests'
  | 'agents'
  | 'calendar'
  | 'skills'
  | 'memory'
  | 'finance'
  | 'journal';

type ModuleConfig = {
  label: string;
  href: string;
  objectName?: string;
  focus?: {
    position: [number, number, number];
    target: [number, number, number];
  };
};

const MODULES: Record<ModuleKey, ModuleConfig> = {
  ai: {
    label: 'MENTRA AI',
    href: '/mentra',
    objectName: 'leftMonitor',
    focus: {
      position: [1.06738, 2.60725, -1.6],
      target: [1.06738, 2.50725, -4.23009],
    },
  },
  quests: {
    label: 'QUESTS',
    href: '/quests',
    objectName: 'rightMonitor',
    focus: {
      position: [2.13997, 2.60716, -1.53751],
      target: [2.47898, 2.50716, -4.14566],
    },
  },
  agents: {
    label: 'AGENTS',
    href: '/agents',
    objectName: 'arcadeMachine',
    focus: {
      position: [-1.7, 5.5, 2.3009],
      target: [3.25776, 2.74209, 2.3009],
    },
  },
  calendar: {
    label: 'CALENDAR',
    href: '/calendar',
    objectName: 'whiteboard',
    focus: {
      position: [-3.3927, 5.18774, 4.61366],
      target: [-3.3927, 3.18774, -4.61366],
    },
  },
  skills: {
    label: 'SKILLS',
    href: '/skills',
    objectName: 'rubikGroup',
    focus: {
      position: [-0.2, 2.0, -1.25],
      target: [-0.67868, 1.499, -3.92849],
    },
  },
  memory: {
    label: 'MEMORY',
    href: '/memory',
    focus: {
      position: [-1.4, 3.0, 1.9],
      target: [-3.15, 1.8, 1.6],
    },
  },
  finance: {
    label: 'FINANCE',
    href: '/finance',
    focus: {
      position: [0.8, 2.25, -0.4],
      target: [1.0, 1.45, -3.2],
    },
  },
  journal: {
    label: 'JOURNAL',
    href: '/journal',
    focus: {
      position: [-0.8, 2.2, -0.4],
      target: [0.23, 2.3, -3.64951],
    },
  },
};

const HOME_POSITION = new THREE.Vector3(-23, 17, 23);
const HOME_TARGET = new THREE.Vector3(0, 2.5, 0);

const ROUTE_MODULES: Array<[string, ModuleKey]> = [
  ['/mentra', 'ai'],
  ['/quests', 'quests'],
  ['/goals', 'quests'],
  ['/habits', 'quests'],
  ['/projects', 'quests'],
  ['/missions', 'quests'],
  ['/focus', 'quests'],
  ['/agents', 'agents'],
  ['/connections', 'agents'],
  ['/calendar', 'calendar'],
  ['/skills', 'skills'],
  ['/memory', 'memory'],
  ['/reports', 'memory'],
  ['/settings', 'memory'],
  ['/system', 'memory'],
  ['/finance', 'finance'],
  ['/journal', 'journal'],
];

function moduleForPath(pathname: string): ModuleKey | null {
  const match = ROUTE_MODULES.find(([path]) => pathname.startsWith(path));
  return match?.[1] ?? null;
}

const ASSET_ROOT = '/api/joan-assets';
const MODEL_ROOT = `${ASSET_ROOT}/assets/models`;
const TEXTURE_ROOT = `${ASSET_ROOT}/assets/textures`;
const BASIS_ROOT = `${ASSET_ROOT}/basis/`;
const DRACO_ROOT = `${ASSET_ROOT}/draco/`;

function createMonitorTexture(
  title: string,
  subtitle: string,
  items: string[],
  accent: string
) {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 780;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  const gradient = ctx.createLinearGradient(0, 0, 1400, 780);
  gradient.addColorStop(0, '#071624');
  gradient.addColorStop(1, '#0b2d43');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1400, 780);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.strokeRect(34, 34, 1332, 712);

  ctx.fillStyle = accent;
  ctx.font = '700 46px Arial';
  ctx.fillText(title, 82, 126);

  ctx.fillStyle = 'rgba(255,255,255,.72)';
  ctx.font = '400 28px Arial';
  ctx.fillText(subtitle, 82, 182);

  items.forEach((item, index) => {
    const y = 300 + index * 112;
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.fillRect(82, y - 48, 1230, 74);

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(116, y - 10, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f4f7fa';
    ctx.font = '600 28px Arial';
    ctx.fillText(item, 150, y);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function createArcadeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1210;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#030812';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y += 7) {
    ctx.fillStyle = 'rgba(77,160,255,.035)';
    ctx.fillRect(0, y, canvas.width, 2);
  }

  ctx.fillStyle = '#eda72d';
  ctx.textAlign = 'center';
  ctx.font = '800 58px Arial';
  ctx.fillText('MENTRA AGENTS', 512, 230);

  ctx.fillStyle = '#f6f8fb';
  ctx.font = '700 42px Arial';
  ctx.fillText('AUTOMATION CORE', 512, 320);

  ctx.fillStyle = 'rgba(255,255,255,.64)';
  ctx.font = '400 27px Arial';
  ctx.fillText('Delegate work to specialist AI agents', 512, 388);

  ['RESEARCH', 'CONTENT', 'BROWSER', 'OPERATIONS'].forEach((label, index) => {
    const y = 540 + index * 120;
    ctx.strokeStyle = index === 0 ? '#eda72d' : 'rgba(255,255,255,.22)';
    ctx.lineWidth = 4;
    ctx.strokeRect(210, y - 54, 604, 76);
    ctx.fillStyle = '#f6f8fb';
    ctx.font = '700 30px Arial';
    ctx.fillText(label, 512, y - 4);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export default function MentraHQScene({
  activePath = '/hq',
  shellMode = false,
}: {
  activePath?: string;
  shellMode?: boolean;
}) {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState<ModuleKey | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let frameId = 0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x072446);

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );

    const homePosition =
      window.innerWidth < 720
        ? new THREE.Vector3(-18, 13, 18)
        : HOME_POSITION.clone();

    camera.position.copy(homePosition);

    const isMobile = window.innerWidth < 768;
    const pixelRatio = isMobile ? 1 : Math.min(Math.max(window.devicePixelRatio, 1), 2);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      powerPreference: 'high-performance',
    });

    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    renderer.setClearColor(0x072446, 1);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.localClippingEnabled = true;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';

    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.4;
    controls.zoomSpeed = 1;
    controls.maxAzimuthAngle = Math.PI * 2;
    controls.minAzimuthAngle = -Math.PI / 2;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 2;
    controls.maxDistance = 35;
    controls.target.copy(HOME_TARGET);

    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(window.innerWidth, window.innerHeight);

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      scene,
      camera
    );
    outlinePass.visibleEdgeColor.set(0xffffff);
    outlinePass.hiddenEdgeColor.set(0xffffff);
    outlinePass.edgeThickness = 3;
    outlinePass.edgeStrength = 6;
    composer.addPass(outlinePass);

    composer.addPass(new ShaderPass(GammaCorrectionShader));

    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_ROOT);
    draco.setDecoderConfig({ type: 'js' });

    const ktx2 = new KTX2Loader();
    ktx2.setTranscoderPath(BASIS_ROOT);
    ktx2.setWorkerLimit(isMobile ? 1 : 2);
    ktx2.detectSupport(renderer);

    const gltf = new GLTFLoader();
    gltf.setDRACOLoader(draco);
    gltf.setKTX2Loader(ktx2);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const interactiveRoots: THREE.Object3D[] = [];
    const moduleByObject = new Map<THREE.Object3D, ModuleKey>();
    const screenTextures: THREE.Texture[] = [];

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    const configureTexture = (texture: THREE.CompressedTexture) => {
      texture.anisotropy = maxAnisotropy;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      return texture;
    };

    const applyMaterial = (root: THREE.Object3D, material: THREE.Material) => {
      root.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = material;
        }
      });
    };

    const registerInteractive = (root: THREE.Object3D, key: ModuleKey) => {
      root.userData.moduleKey = key;
      interactiveRoots.push(root);
      moduleByObject.set(root, key);
      scene.add(root);
    };

    const findInteractiveRoot = (object: THREE.Object3D | null) => {
      let current = object;
      while (current) {
        if (moduleByObject.has(current)) return current;
        current = current.parent;
      }
      return null;
    };

    const createHotspot = (
      key: ModuleKey,
      position: [number, number, number],
      size: [number, number, number]
    ) => {
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.position.set(...position);
      registerInteractive(mesh, key);
      return mesh;
    };

    const addScreen = (
      geometry: THREE.PlaneGeometry,
      texture: THREE.Texture,
      position: THREE.Vector3,
      rotation: THREE.Euler,
      scale: THREE.Vector3
    ) => {
      screenTextures.push(texture);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        toneMapped: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.rotation.copy(rotation);
      mesh.scale.copy(scale);
      scene.add(mesh);
      return mesh;
    };

    const loadRoom = async () => {
      const fallback1 = new THREE.MeshBasicMaterial({
        color: '#d7c2a4',
      });
      const fallback2 = new THREE.MeshBasicMaterial({
        color: '#815d46',
      });
      const fallback3 = new THREE.MeshBasicMaterial({
        color: '#264c55',
      });

      try {
        const [
          room1,
          room2,
          room3,
          leftMonitor,
          rightMonitor,
          whiteboard,
          arcadeMachine,
          rubik,
          topChair,
        ] = await Promise.all([
          gltf.loadAsync(`${MODEL_ROOT}/room.glb`),
          gltf.loadAsync(`${MODEL_ROOT}/room2.glb`),
          gltf.loadAsync(`${MODEL_ROOT}/room3.glb`),
          gltf.loadAsync(`${MODEL_ROOT}/leftMonitor.glb`),
          gltf.loadAsync(`${MODEL_ROOT}/rightMonitor.glb`),
          gltf.loadAsync(`${MODEL_ROOT}/whiteboard.glb`),
          gltf.loadAsync(`${MODEL_ROOT}/arcadeMachine.glb`),
          gltf.loadAsync(`${MODEL_ROOT}/Rubik.glb`),
          gltf.loadAsync(`${MODEL_ROOT}/topChair.glb`),
        ]);

        if (disposed) return;

        applyMaterial(room1.scene, fallback1);
        applyMaterial(room2.scene, fallback2);
        applyMaterial(room3.scene, fallback3);
        scene.add(room1.scene, room2.scene, room3.scene);

        applyMaterial(leftMonitor.scene, fallback2);
        leftMonitor.scene.name = 'leftMonitor';
        registerInteractive(leftMonitor.scene, 'ai');

        applyMaterial(rightMonitor.scene, fallback2);
        rightMonitor.scene.name = 'rightMonitor';
        registerInteractive(rightMonitor.scene, 'quests');

        applyMaterial(whiteboard.scene, fallback2);
        whiteboard.scene.name = 'whiteboard';
        registerInteractive(whiteboard.scene, 'calendar');

        applyMaterial(arcadeMachine.scene, fallback2);
        arcadeMachine.scene.name = 'arcadeMachine';
        registerInteractive(arcadeMachine.scene, 'agents');

        rubik.scene.name = 'rubikGroup';
        rubik.scene.position.set(-0.67868, 1.499, -3.92849);
        rubik.scene.scale.setScalar(0.021432);
        registerInteractive(rubik.scene, 'skills');

        applyMaterial(topChair.scene, fallback2);
        topChair.scene.position.set(1.4027, 0.496728, -1.21048);
        scene.add(topChair.scene);

        createHotspot('memory', [-3.35, 1.75, 2.35], [1.1, 2.4, 1.8]);
        createHotspot('finance', [1.0, 1.55, -3.15], [1.2, 1.1, 1.0]);
        createHotspot('journal', [0.23, 2.25, -3.65], [0.7, 0.8, 0.7]);

        const leftTexture = createMonitorTexture(
          'MENTRA AI',
          'Your personal mentor',
          ['Ask anything', 'Build a plan', 'Turn goals into action'],
          '#eda72d'
        );
        addScreen(
          new THREE.PlaneGeometry(1370.178, 764.798),
          leftTexture,
          new THREE.Vector3(1.06738, 2.50725, -4.23009),
          new THREE.Euler(0, 0, 0),
          new THREE.Vector3(0.00102, 0.00102, 1)
        );

        const rightTexture = createMonitorTexture(
          'DAILY QUESTS',
          'Today inside Mentra',
          ['Top priority mission', 'Daily habit streak', 'Next planned action'],
          '#75d6ff'
        );
        addScreen(
          new THREE.PlaneGeometry(1370.178, 764.798),
          rightTexture,
          new THREE.Vector3(2.47898, 2.50716, -4.14566),
          new THREE.Euler(0, (-7.406 * Math.PI) / 180, 0),
          new THREE.Vector3(0.00102, 0.00102, 1)
        );

        const arcadeTexture = createArcadeTexture();
        addScreen(
          new THREE.PlaneGeometry(1006.986, 1210.1182617331252),
          arcadeTexture,
          new THREE.Vector3(3.24776, 2.7421, 2.3009),
          new THREE.Euler(-Math.PI / 7, -Math.PI / 2, 0),
          new THREE.Vector3(0.00102, 0.00102, 0.00102)
        );

        controls.enabled = true;
        setLoaded(true);

        try {
          const baked1 = await ktx2.loadAsync(`${TEXTURE_ROOT}/baked1.ktx2`);
          if (disposed) return;
          const material1 = new THREE.MeshBasicMaterial({
            map: configureTexture(baked1),
          });
          applyMaterial(room1.scene, material1);

          const baked2 = await ktx2.loadAsync(`${TEXTURE_ROOT}/baked2.ktx2`);
          if (disposed) return;
          const material2 = new THREE.MeshBasicMaterial({
            map: configureTexture(baked2),
          });
          applyMaterial(room2.scene, material2);
          applyMaterial(leftMonitor.scene, material2);
          applyMaterial(rightMonitor.scene, material2);
          applyMaterial(whiteboard.scene, material2);
          applyMaterial(arcadeMachine.scene, material2);
          applyMaterial(topChair.scene, material2);

          const baked3 = await ktx2.loadAsync(`${TEXTURE_ROOT}/baked3.ktx2`);
          if (disposed) return;
          const material3 = new THREE.MeshBasicMaterial({
            map: configureTexture(baked3),
          });
          applyMaterial(room3.scene, material3);
        } catch (textureError) {
          console.warn('Mentra HQ baked textures unavailable; using fallback materials', textureError);
          void fetch('/api/hq-client-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stage: 'ktx2',
              message:
                textureError instanceof Error
                  ? textureError.message
                  : String(textureError),
              mobile: isMobile,
              userAgent: navigator.userAgent.slice(0, 180),
            }),
          }).catch(() => undefined);
        }
      } catch (modelError) {
        console.error('Mentra HQ model load failed', modelError);
        controls.enabled = true;
        setLoaded(true);
      }
    };

    const loadingFailSafe = window.setTimeout(() => {
      controls.enabled = true;
      setLoaded(true);
    }, 12000);

    void loadRoom().finally(() => {
      window.clearTimeout(loadingFailSafe);
    });



    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const moveCamera = (
      position: [number, number, number],
      target: [number, number, number]
    ) => {
      controls.enabled = false;
      const duration = reduceMotion ? 0 : 1.1;

      gsap.to(camera.position, {
        x: position[0],
        y: position[1],
        z: position[2],
        duration,
        ease: 'power3.inOut',
      });

      gsap.to(controls.target, {
        x: target[0],
        y: target[1],
        z: target[2],
        duration,
        ease: 'power3.inOut',
        onComplete: () => {
          setFocused(true);
        },
      });
    };

    const goHome = () => {
      setActive(null);
      setFocused(false);
      const destination =
        window.innerWidth < 720 ? [-18, 13, 18] : [-23, 17, 23];

      const duration = reduceMotion ? 0 : 1.05;

      gsap.to(camera.position, {
        x: destination[0],
        y: destination[1],
        z: destination[2],
        duration,
        ease: 'power3.inOut',
      });

      gsap.to(controls.target, {
        x: HOME_TARGET.x,
        y: HOME_TARGET.y,
        z: HOME_TARGET.z,
        duration,
        ease: 'power3.inOut',
        onComplete: () => {
          controls.enabled = true;
        },
      });
    };

    (mount as HTMLDivElement & { goHome?: () => void }).goHome = goHome;

    const openModuleFocus = (key: ModuleKey) => {
      const moduleConfig = MODULES[key];
      setActive(key);
      setFocused(false);

      if (moduleConfig.focus) {
        moveCamera(moduleConfig.focus.position, moduleConfig.focus.target);
      } else {
        setFocused(true);
      }
    };

    (mount as HTMLDivElement & { focusModule?: (key: ModuleKey) => void })
      .focusModule = openModuleFocus;

    let hoveredRoot: THREE.Object3D | null = null;
    let pointerDown: [number, number] | null = null;

    const updatePointer = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!controls.enabled) return;

      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(interactiveRoots, true)[0];
      const root = hit ? findInteractiveRoot(hit.object) : null;

      if (root !== hoveredRoot) {
        hoveredRoot = root;
        outlinePass.selectedObjects = root ? [root] : [];
      }

      renderer.domElement.style.cursor = root ? 'pointer' : 'grab';
    };

    const handlePointerDown = (event: PointerEvent) => {
      pointerDown = [event.clientX, event.clientY];
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!controls.enabled || !pointerDown) return;

      const moved = Math.hypot(
        event.clientX - pointerDown[0],
        event.clientY - pointerDown[1]
      );

      if (moved > 7) return;

      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(interactiveRoots, true)[0];
      const root = hit ? findInteractiveRoot(hit.object) : null;

      if (!root) return;

      const key = moduleByObject.get(root);
      if (!key) return;

      outlinePass.selectedObjects = [];
      openModuleFocus(key);
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
      outlinePass.setSize(window.innerWidth, window.innerHeight);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') goHome();
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    const clock = new THREE.Clock();

    const tick = () => {
      const elapsed = clock.getElapsedTime();

      const chair = scene.children.find(
        (child) =>
          child.position.x === 1.4027 &&
          Math.abs(child.position.z + 1.21048) < 0.01
      );

      if (chair) {
        chair.rotation.y = Math.sin(elapsed * 0.3) * 0.5;
      }

      controls.update();
      if (isMobile) {
        renderer.render(scene, camera);
      } else {
        composer.render();
      }
      frameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);

      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);

      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(controls.target);

      controls.dispose();
      draco.dispose();
      ktx2.dispose();

      screenTextures.forEach((texture) => texture.dispose());

      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;

        object.geometry?.dispose();

        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];

        materials.forEach((material) => material.dispose());
      });

      composer.dispose();
      renderer.dispose();
      mount.replaceChildren();
    };
  }, []);

  const activeModule = active ? MODULES[active] : null;

  const focusModule = (key: ModuleKey) => {
    const mount = mountRef.current as
      | (HTMLDivElement & { focusModule?: (key: ModuleKey) => void })
      | null;

    mount?.focusModule?.(key);
  };

  const goHome = () => {
    const mount = mountRef.current as
      | (HTMLDivElement & { goHome?: () => void })
      | null;

    mount?.goHome?.();
  };

  useEffect(() => {
    if (!loaded) return;

    const mount = mountRef.current as
      | (HTMLDivElement & {
          focusModule?: (key: ModuleKey) => void;
          goHome?: () => void;
        })
      | null;

    const routeModule = moduleForPath(activePath);
    const timer = window.setTimeout(() => {
      if (routeModule) {
        mount?.focusModule?.(routeModule);
      } else {
        mount?.goHome?.();
      }
    }, 80);

    return () => window.clearTimeout(timer);
  }, [activePath, loaded]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#072446]">
      <div ref={mountRef} className="absolute inset-0" />

      {!shellMode && (
      <nav
        className={`absolute left-0 right-0 top-0 z-20 flex h-[64px] items-center gap-2 overflow-x-auto bg-[#0a3362] px-3 text-[#eda72d] shadow-[0_2px_8px_rgba(0,0,0,.55)] transition-transform duration-500 sm:justify-around sm:px-6 ${
          active ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        {([
          'ai',
          'quests',
          'agents',
          'calendar',
          'skills',
          'memory',
          'finance',
          'journal',
        ] as ModuleKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => focusModule(key)}
            className="shrink-0 px-2 py-2 text-[11px] font-black tracking-[0.06em] transition hover:scale-105 sm:text-sm"
          >
            {MODULES[key].label}
          </button>
        ))}
      </nav>
      )}

      {!loaded && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-[#072446]">
          <div className="grid h-32 w-32 place-items-center rounded-full border-[8px] border-[#eda72d] bg-[#0a3362] text-center text-sm font-black leading-5 text-[#eda72d] shadow-xl">
            MENTRA
            <br />
            HQ
          </div>
        </div>
      )}

      {!shellMode && active && (
        <button
          type="button"
          onClick={goHome}
          className="absolute bottom-5 left-5 z-30 grid h-16 w-16 place-items-center rounded-full bg-[#0a3362] text-2xl font-black text-[#eda72d] shadow-[0_4px_14px_rgba(0,0,0,.5)] transition hover:scale-105 sm:bottom-10 sm:left-10 sm:h-20 sm:w-20"
          aria-label="Back to room"
        >
          ←
        </button>
      )}

      {!shellMode && activeModule && focused && (
        <div className="absolute bottom-5 left-1/2 z-30 w-[min(90vw,430px)] -translate-x-1/2 rounded-2xl border border-[#eda72d]/60 bg-[#0a3362]/95 p-4 text-center text-white shadow-2xl backdrop-blur-md sm:bottom-8">
          <div className="text-xs font-black tracking-[0.15em] text-[#eda72d]">
            {activeModule.label}
          </div>
          <div className="mt-2 text-sm text-white/70">
            Camera locked on this Mentra module.
          </div>
          <button
            type="button"
            onClick={() => router.push(activeModule.href)}
            className="mt-3 rounded-lg bg-[#eda72d] px-5 py-2.5 text-sm font-black text-[#072446] transition hover:scale-[1.02]"
          >
            OPEN {activeModule.label}
          </button>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full bg-[#0a3362]/80 px-3 py-2 text-[9px] font-bold tracking-[0.08em] text-[#eda72d] backdrop-blur sm:bottom-5 sm:right-5">
        DRAG · ZOOM · TAP OBJECTS
      </div>
    </div>
  );
}
