'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import gsap from 'gsap';

type ModuleId =
  | 'computer'
  | 'whiteboard'
  | 'shelf'
  | 'certificates'
  | 'phone'
  | 'window'
  | 'cabinet'
  | 'finance';

type ModuleContent = {
  label: string;
  title: string;
  description: string;
  href: string;
  bullets: string[];
};

type FocusTarget = {
  pos: [number, number, number];
  target: [number, number, number];
};

type ClickableGroup = THREE.Group & {
  userData: {
    id: ModuleId;
    focus: FocusTarget;
  };
};

const CONTENT: Record<ModuleId, ModuleContent> = {
  computer: {
    label: 'Mentra AI',
    title: 'Mentra AI',
    description: 'Your main mentor console for planning, decisions and execution.',
    href: '/mentra',
    bullets: ['Ask Mentra anything', 'Build plans from your goals', 'Turn ideas into next actions'],
  },
  whiteboard: {
    label: 'Quest Board',
    title: 'Quests',
    description: 'Your active missions, daily priorities and progress.',
    href: '/quests',
    bullets: ['Daily quests', 'Priority missions', 'Progress tracking'],
  },
  shelf: {
    label: 'Skill Shelf',
    title: 'Skills',
    description: 'Your skill library and long-term growth map.',
    href: '/skills',
    bullets: ['Skill progression', 'Learning roadmap', 'Level-up targets'],
  },
  certificates: {
    label: 'Calendar Wall',
    title: 'Calendar',
    description: 'See the schedule, commitments and important upcoming work.',
    href: '/calendar',
    bullets: ['Upcoming schedule', 'Important dates', 'Planning view'],
  },
  phone: {
    label: 'Journal',
    title: 'Journal',
    description: 'Capture your thoughts, reflection and daily notes.',
    href: '/journal',
    bullets: ['Daily reflection', 'Notes and ideas', 'Personal check-ins'],
  },
  window: {
    label: 'Agent Window',
    title: 'Agents',
    description: 'Open the agent workspace for delegated AI work.',
    href: '/agents',
    bullets: ['Specialist agents', 'Delegated work', 'Automation workflows'],
  },
  cabinet: {
    label: 'Memory Cabinet',
    title: 'Memory',
    description: 'Your stored context, preferences and important information.',
    href: '/memory',
    bullets: ['Long-term context', 'Important facts', 'Personal knowledge'],
  },
  finance: {
    label: 'Finance Pad',
    title: 'Finance',
    description: 'Track money, plans, expenses and financial goals.',
    href: '/finance',
    bullets: ['Money tracking', 'Plans and targets', 'Financial overview'],
  },
};

const HOME = {
  pos: new THREE.Vector3(7.5, 5.5, 8.5),
  target: new THREE.Vector3(0, 1.4, 0),
};

export default function MentraHQScene() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const goHomeRef = useRef<() => void>(() => undefined);
  const [activeId, setActiveId] = useState<ModuleId | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1c2230');

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.copy(HOME.pos);

    const controls = new OrbitControls(camera, canvas);
    controls.target.copy(HOME.target);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 14;
    controls.minPolarAngle = 0.4;
    controls.maxPolarAngle = 1.35;
    controls.minAzimuthAngle = -0.1;
    controls.maxAzimuthAngle = 1.4;

    scene.add(new THREE.HemisphereLight('#fff4e0', '#2a2018', 1.4));

    const sun = new THREE.DirectionalLight('#ffe2b0', 2.2);
    sun.position.set(-3, 6, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -6;
    sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 6;
    sun.shadow.camera.bottom = -6;
    scene.add(sun);

    const lampLight = new THREE.PointLight('#ffc36b', 6, 4);
    lampLight.position.set(1.4, 2.2, -0.6);
    scene.add(lampLight);

    const material = (color: string, options: THREE.MeshStandardMaterialParameters = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...options });

    const mat = {
      floor: material('#6e4a2f', { roughness: 0.6 }),
      wall: material('#24464a'),
      wall2: material('#2c5357'),
      walnut: material('#5b3a24', { roughness: 0.5 }),
      dark: material('#1a1a1a', { roughness: 0.4 }),
      brass: material('#c9a04a', { metalness: 0.8, roughness: 0.3 }),
      paper: material('#f3ede2'),
      steel: material('#7d8790', { metalness: 0.6, roughness: 0.4 }),
      screen: new THREE.MeshStandardMaterial({
        color: '#0d1b2a',
        emissive: '#3a7bd5',
        emissiveIntensity: 0.6,
      }),
    };

    const box = (
      width: number,
      height: number,
      depth: number,
      meshMaterial: THREE.Material,
      x: number,
      y: number,
      z: number,
      parent: THREE.Object3D = scene,
      rounded = false
    ) => {
      const geometry = rounded
        ? new RoundedBoxGeometry(
            width,
            height,
            depth,
            3,
            Math.min(width, height, depth) * 0.15
          )
        : new THREE.BoxGeometry(width, height, depth);

      const mesh = new THREE.Mesh(geometry, meshMaterial);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    box(8, 0.2, 8, mat.floor, 0, -0.1, 0);
    box(8, 4.5, 0.2, mat.wall, 0, 2.25, -4);
    box(0.2, 4.5, 8, mat.wall2, -4, 2.25, 0);
    box(8, 0.15, 0.05, mat.walnut, 0, 0.08, -3.88);
    box(0.05, 0.15, 8, mat.walnut, -3.88, 0.08, 0);

    const rug = new THREE.Mesh(
      new THREE.CircleGeometry(1.8, 48),
      material('#5e2b26', { roughness: 1 })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0.3, 0.01, 0.6);
    rug.receiveShadow = true;
    scene.add(rug);

    const clickables: ClickableGroup[] = [];

    const makeGroup = (id: ModuleId, focus: FocusTarget) => {
      const group = new THREE.Group() as ClickableGroup;
      group.userData = { id, focus };
      scene.add(group);
      clickables.push(group);
      return group;
    };

    box(3, 0.1, 1.4, mat.walnut, 0.3, 1.0, -1.2, scene, true);
    [
      [-1.05, -1.75],
      [1.65, -1.75],
      [-1.05, -0.65],
      [1.65, -0.65],
    ].forEach(([x, z]) => box(0.08, 1, 0.08, mat.dark, x, 0.5, z));

    box(0.7, 0.1, 0.7, mat.dark, 0.3, 0.6, 0.0, scene, true);
    box(0.7, 0.8, 0.1, mat.dark, 0.3, 1.05, 0.33, scene, true);
    box(0.06, 0.55, 0.06, mat.steel, 0.3, 0.3, 0.0);

    box(0.25, 0.05, 0.25, mat.brass, 1.4, 1.08, -1.6);
    box(0.04, 0.9, 0.04, mat.brass, 1.4, 1.5, -1.6);

    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.25, 24, 1, true),
      material('#f0d89c', {
        side: THREE.DoubleSide,
        emissive: '#ffcf70',
        emissiveIntensity: 0.4,
      })
    );
    shade.position.set(1.4, 1.95, -1.6);
    scene.add(shade);

    {
      const group = makeGroup('computer', {
        pos: [0.3, 1.75, 0.4],
        target: [0.0, 1.5, -1.5],
      });
      box(1.3, 0.8, 0.06, mat.dark, 0, 1.55, -1.5, group, true);
      box(1.18, 0.68, 0.01, mat.screen, 0, 1.55, -1.465, group);
      box(0.1, 0.4, 0.1, mat.dark, 0, 1.2, -1.55, group);
      box(0.4, 0.03, 0.25, mat.dark, 0, 1.06, -1.55, group);
      box(0.9, 0.03, 0.3, mat.dark, 0, 1.065, -1.0, group);
    }

    {
      const group = makeGroup('whiteboard', {
        pos: [-0.8, 2.3, 0.4],
        target: [-3.9, 2.3, 0.4],
      });
      box(0.05, 1.4, 2.4, mat.steel, -3.86, 2.4, 0.4, group);
      box(0.02, 1.3, 2.3, mat.paper, -3.83, 2.4, 0.4, group);

      [
        [-0.3, 2.7],
        [0.2, 2.45],
        [-0.1, 2.2],
      ].forEach(([depthOffset, y], index) => {
        box(
          0.01,
          0.05,
          1.2 - index * 0.25,
          material(['#2e5aa8', '#a83232', '#2e8b57'][index]),
          -3.81,
          y,
          0.4 + depthOffset,
          group
        );
      });
    }

    {
      const group = makeGroup('shelf', {
        pos: [-1.2, 1.8, 3.0],
        target: [-3.6, 1.5, 2.6],
      });

      [0.9, 1.7, 2.5].forEach((y) =>
        box(0.5, 0.06, 1.8, mat.walnut, -3.65, y, 2.6, group)
      );
      box(0.5, 2.0, 0.06, mat.walnut, -3.65, 1.6, 1.7, group);
      box(0.5, 2.0, 0.06, mat.walnut, -3.65, 1.6, 3.5, group);

      const books = ['#3b4a2b', '#111111', '#c2b280', '#7a1f1f', '#4f5d73', '#e9e4d8'];
      books.forEach((color, index) => {
        const y = index < 3 ? 1.0 : 1.8;
        const z = 2.0 + (index % 3) * 0.6;
        box(0.4, 0.12, 0.45, material(color), -3.62, y, z, group, true);
      });
    }

    {
      const group = makeGroup('certificates', {
        pos: [2.6, 2.6, 0.2],
        target: [2.6, 2.6, -3.9],
      });

      [
        [2.0, 3.0],
        [3.0, 3.0],
        [2.0, 2.2],
        [3.0, 2.2],
      ].forEach(([x, y]) => {
        box(0.7, 0.55, 0.04, mat.brass, x, y, -3.87, group);
        box(0.6, 0.45, 0.01, mat.paper, x, y, -3.845, group);
      });
    }

    {
      const group = makeGroup('phone', {
        pos: [-0.4, 1.9, -0.2],
        target: [-0.7, 1.05, -1.2],
      });

      box(0.22, 0.03, 0.4, mat.dark, -0.7, 1.07, -1.2, group, true);
      box(
        0.19,
        0.005,
        0.36,
        new THREE.MeshStandardMaterial({
          color: '#4a2c1f',
          emissive: '#c98654',
          emissiveIntensity: 0.28,
        }),
        -0.7,
        1.088,
        -1.2,
        group
      );
    }

    {
      const group = makeGroup('window', {
        pos: [-1.6, 2.4, 0.5],
        target: [-1.6, 2.4, -3.9],
      });

      const skyCanvas = document.createElement('canvas');
      skyCanvas.width = 16;
      skyCanvas.height = 256;
      const context = skyCanvas.getContext('2d');

      if (context) {
        const gradient = context.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, '#f6a35a');
        gradient.addColorStop(0.6, '#f7d9a0');
        gradient.addColorStop(1, '#9fb7c9');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 16, 256);
      }

      const sky = new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(skyCanvas),
      });

      box(1.8, 1.6, 0.02, sky, -1.6, 2.5, -3.88, group);
      box(1.9, 0.08, 0.1, mat.walnut, -1.6, 3.32, -3.85, group);
      box(1.9, 0.08, 0.15, mat.walnut, -1.6, 1.68, -3.85, group);
      box(0.06, 1.6, 0.08, mat.walnut, -1.6, 2.5, -3.85, group);
      box(1.8, 0.05, 0.08, mat.walnut, -1.6, 2.5, -3.85, group);
    }

    {
      const group = makeGroup('cabinet', {
        pos: [3.0, 1.6, 0.8],
        target: [3.2, 0.9, -3.2],
      });

      box(0.9, 1.6, 0.7, mat.steel, 3.2, 0.8, -3.4, group, true);

      [0.35, 0.85, 1.35].forEach((y) => {
        box(
          0.8,
          0.42,
          0.02,
          material('#6b747c', { metalness: 0.5 }),
          3.2,
          y,
          -3.04,
          group
        );
        box(0.25, 0.04, 0.04, mat.brass, 3.2, y + 0.1, -3.02, group);
      });

      box(0.3, 0.3, 0.3, material('#b5652b'), 3.2, 1.75, -3.4, group);
      const leaves = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.32, 1),
        material('#3f6b3a', { flatShading: true })
      );
      leaves.position.set(3.2, 2.15, -3.4);
      leaves.castShadow = true;
      group.add(leaves);
    }

    {
      const group = makeGroup('finance', {
        pos: [1.45, 1.85, 0.1],
        target: [1.05, 1.08, -1.05],
      });

      box(0.65, 0.035, 0.46, mat.dark, 1.05, 1.07, -1.02, group, true);
      box(
        0.58,
        0.006,
        0.39,
        new THREE.MeshStandardMaterial({
          color: '#0d2b21',
          emissive: '#2f9f6d',
          emissiveIntensity: 0.36,
        }),
        1.05,
        1.092,
        -1.02,
        group,
        true
      );
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let hovered: ClickableGroup | null = null;
    let focused = false;
    let downAt: [number, number] | null = null;

    const findGroup = (object: THREE.Object3D | null): ClickableGroup | null => {
      let current: THREE.Object3D | null = object;
      while (current && !clickables.includes(current as ClickableGroup)) {
        current = current.parent;
      }
      return current as ClickableGroup | null;
    };

    const setHighlight = (group: ClickableGroup, on: boolean) => {
      group.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;

        const currentMaterial = Array.isArray(object.material)
          ? object.material[0]
          : object.material;

        if (!(currentMaterial instanceof THREE.MeshStandardMaterial)) return;

        if (on) {
          if (!object.userData.originalMaterial) {
            object.userData.originalMaterial = currentMaterial;
          }

          const highlighted = currentMaterial.clone();
          highlighted.emissive.set('#c9a04a');
          highlighted.emissiveIntensity = 0.25;
          object.material = highlighted;
        } else if (object.userData.originalMaterial) {
          const highlightedMaterial = Array.isArray(object.material)
            ? object.material[0]
            : object.material;

          if (highlightedMaterial !== object.userData.originalMaterial) {
            highlightedMaterial.dispose();
          }

          object.material = object.userData.originalMaterial as THREE.Material;
          delete object.userData.originalMaterial;
        }
      });
    };

    const moveCamera = (
      position: [number, number, number],
      target: [number, number, number],
      onDone?: () => void
    ) => {
      const duration = reduceMotion ? 0 : 1.4;

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
        onComplete: onDone,
      });
    };

    const focusOn = (group: ClickableGroup) => {
      const { id, focus } = group.userData;
      focused = true;
      controls.enabled = false;

      if (tooltipRef.current) {
        tooltipRef.current.classList.remove('opacity-100');
        tooltipRef.current.classList.add('opacity-0');
      }

      moveCamera(focus.pos, focus.target, () => {
        setActiveId(id);
        setPanelOpen(true);
      });
    };

    const goHome = () => {
      setPanelOpen(false);
      moveCamera(
        HOME.pos.toArray() as [number, number, number],
        HOME.target.toArray() as [number, number, number],
        () => {
          focused = false;
          setActiveId(null);
          controls.enabled = true;
        }
      );
    };

    goHomeRef.current = goHome;

    const updatePointer = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (focused) return;

      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);

      const hit = raycaster.intersectObjects(clickables, true)[0];
      const group = hit ? findGroup(hit.object) : null;

      if (group !== hovered) {
        if (hovered) setHighlight(hovered, false);
        if (group) setHighlight(group, true);
        hovered = group;
      }

      canvas.style.cursor = group ? 'pointer' : 'grab';

      const tooltip = tooltipRef.current;
      if (!tooltip) return;

      if (group) {
        tooltip.textContent = CONTENT[group.userData.id].label;
        tooltip.style.left = `${event.clientX + 14}px`;
        tooltip.style.top = `${event.clientY + 14}px`;
        tooltip.classList.remove('opacity-0');
        tooltip.classList.add('opacity-100');
      } else {
        tooltip.classList.remove('opacity-100');
        tooltip.classList.add('opacity-0');
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      downAt = [event.clientX, event.clientY];
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (focused || !downAt) return;

      const moved = Math.hypot(
        event.clientX - downAt[0],
        event.clientY - downAt[1]
      );

      if (moved > 6) return;

      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);

      const hit = raycaster.intersectObjects(clickables, true)[0];
      const group = hit ? findGroup(hit.object) : null;

      if (group) {
        if (hovered) {
          setHighlight(hovered, false);
          hovered = null;
        }
        focusOn(group);
      }
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && focused) {
        goHome();
      }
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    const clock = new THREE.Clock();
    let frameId = 0;

    const tick = () => {
      const elapsed = clock.getElapsedTime();
      lampLight.intensity = 6 + Math.sin(elapsed * 2) * 0.15;
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };

    tick();
    setLoaded(true);

    return () => {
      cancelAnimationFrame(frameId);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);

      if (hovered) setHighlight(hovered, false);

      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(controls.target);
      controls.dispose();

      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();

        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];

        materials.forEach((meshMaterial) => meshMaterial.dispose());
      });

      renderer.dispose();
      goHomeRef.current = () => undefined;
    };
  }, []);

  const active = activeId ? CONTENT[activeId] : null;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#1c2230] text-[#f3ede2]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      <div
        className={`pointer-events-none absolute left-5 top-[calc(18px+env(safe-area-inset-top,0px))] z-10 transition-opacity duration-300 ${
          panelOpen ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <h1 className="font-serif text-[clamp(1.7rem,4vw,2.7rem)] font-bold leading-none text-[#f3ede2]">
          Mentra HQ
        </h1>
        <p className="mt-2 text-sm text-[#f3ede2]/70">
          Drag to look around · tap objects
        </p>
      </div>

      <div
        ref={tooltipRef}
        className="pointer-events-none fixed z-30 rounded-[3px] border border-[#c9a04a] bg-[#1c2230] px-2.5 py-1.5 text-xs text-[#f3ede2] opacity-0 transition-opacity duration-150"
      />

      <div
        className={`fixed bottom-0 right-0 top-0 z-20 w-full border-l-[6px] border-[#c9a04a] bg-[#f3ede2] text-[#1c2230] shadow-[-20px_0_60px_rgba(0,0,0,.22)] transition-transform duration-500 [transition-timing-function:cubic-bezier(.2,.8,.2,1)] sm:w-[420px] ${
          panelOpen ? 'translate-x-0' : 'translate-x-[105%]'
        } max-sm:top-auto max-sm:h-[62%] max-sm:border-l-0 max-sm:border-t-[6px] max-sm:translate-x-0 ${
          panelOpen ? 'max-sm:translate-y-0' : 'max-sm:translate-y-[105%]'
        }`}
      >
        <div className="h-full overflow-y-auto px-7 pb-[calc(28px+env(safe-area-inset-bottom,0px))] pt-[calc(28px+env(safe-area-inset-top,0px))]">
          <button
            type="button"
            onClick={() => goHomeRef.current()}
            className="rounded border border-[#1c2230] px-3.5 py-2 text-sm transition hover:bg-[#1c2230] hover:text-[#f3ede2]"
          >
            ← Back to room
          </button>

          {active && (
            <>
              <div className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7538]">
                {active.label}
              </div>

              <h2 className="mt-2 font-serif text-3xl font-bold leading-tight">
                {active.title}
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#1c2230]/75">
                {active.description}
              </p>

              <ul className="mt-4">
                {active.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="border-b border-[#d8cfbf] py-3 text-sm leading-5"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => router.push(active.href)}
                className="mt-5 inline-flex rounded bg-[#24464a] px-5 py-3 text-sm font-semibold text-[#f3ede2] transition hover:bg-[#1d393c]"
              >
                Open {active.title}
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className={`pointer-events-none fixed inset-0 z-40 grid place-items-center bg-[#1c2230] text-[#c9a04a] transition-opacity duration-500 ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="font-serif text-lg">Entering Mentra HQ…</div>
      </div>
    </div>
  );
}
