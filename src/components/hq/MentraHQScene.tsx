'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls, PerspectiveCamera, useTexture } from '@react-three/drei';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

type ModuleConfig = {
  key: string;
  label: string;
  href: string;
  color: string;
  icon: string;
  yaw: number;
  pitch: number;
};

const PANORAMA_URL =
  'https://cdn.polyhaven.com/asset_img/primary/poly_haven_studio.png?height=1440&quality=95';

const MODULES: ModuleConfig[] = [
  { key: 'ai', label: 'MENTRA AI', href: '/mentra', color: '#19B77A', icon: 'AI', yaw: -28, pitch: -4 },
  { key: 'skills', label: 'SKILLS', href: '/skills', color: '#5B7CFA', icon: 'SK', yaw: -72, pitch: 12 },
  { key: 'quests', label: 'QUESTS', href: '/quests', color: '#F39B32', icon: 'Q', yaw: 18, pitch: 8 },
  { key: 'calendar', label: 'CALENDAR', href: '/calendar', color: '#7A5CE5', icon: 'CA', yaw: 55, pitch: 13 },
  { key: 'memory', label: 'MEMORY', href: '/memory', color: '#E85D8C', icon: 'M', yaw: 96, pitch: -3 },
  { key: 'agents', label: 'AGENTS', href: '/agents', color: '#3B9EF3', icon: 'AG', yaw: 138, pitch: 8 },
  { key: 'journal', label: 'JOURNAL', href: '/journal', color: '#C97C3C', icon: 'J', yaw: -126, pitch: -10 },
  { key: 'finance', label: 'FINANCE', href: '/finance', color: '#21A875', icon: '₹', yaw: -176, pitch: -6 },
];

function sphericalPosition(yaw: number, pitch: number, radius = 8): [number, number, number] {
  const yawRad = THREE.MathUtils.degToRad(yaw);
  const pitchRad = THREE.MathUtils.degToRad(pitch);
  const horizontal = Math.cos(pitchRad) * radius;

  return [
    Math.sin(yawRad) * horizontal,
    Math.sin(pitchRad) * radius,
    -Math.cos(yawRad) * horizontal,
  ];
}

function RealOfficePanorama() {
  const texture = useTexture(PANORAMA_URL);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[20, 72, 48]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function Hotspot({
  module,
  onOpen,
}: {
  module: ModuleConfig;
  onOpen: (module: ModuleConfig) => void;
}) {
  const position = sphericalPosition(module.yaw, module.pitch);
  const [active, setActive] = useState(false);

  return (
    <Html center position={position} distanceFactor={8.5} style={{ pointerEvents: 'auto' }}>
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onOpen(module);
        }}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        className="group flex items-center gap-2 rounded-2xl border border-white/80 bg-white/95 p-2 pr-3 text-left shadow-[0_12px_30px_rgba(0,0,0,0.20)] backdrop-blur-md transition active:scale-95"
        style={{ transform: active ? 'scale(1.06)' : 'scale(1)' }}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] font-black text-white shadow-sm"
          style={{ background: module.color }}
        >
          {module.icon}
        </span>
        <span className="hidden sm:block">
          <span className="block whitespace-nowrap text-[10px] font-extrabold tracking-[0.05em] text-[#25211E]">
            {module.label}
          </span>
          <span className="mt-0.5 block whitespace-nowrap text-[8px] font-medium text-[#6E655E]">
            TAP TO OPEN
          </span>
        </span>
      </button>
    </Html>
  );
}

function PanoramaScene({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  return (
    <>
      <color attach="background" args={['#E7DDD3']} />
      <RealOfficePanorama />

      {MODULES.map((module) => (
        <Hotspot key={module.key} module={module} onOpen={onOpen} />
      ))}

      <PerspectiveCamera makeDefault position={[0, 0, 0.015]} fov={72} near={0.01} far={60} />
      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.075}
        rotateSpeed={-0.38}
        minPolarAngle={0.18}
        maxPolarAngle={Math.PI - 0.18}
      />
    </>
  );
}

export default function MentraHQScene() {
  const router = useRouter();
  const [opening, setOpening] = useState<ModuleConfig | null>(null);

  const openModule = (module: ModuleConfig) => {
    setOpening(module);
    window.setTimeout(() => router.push(module.href), 150);
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#E7DDD3]">
      <Canvas
        dpr={[1, 1.45]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <PanoramaScene onOpen={openModule} />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/60 bg-black/55 px-4 py-2 text-[10px] font-semibold tracking-[0.1em] text-white shadow-lg backdrop-blur-md">
        DRAG LEFT / RIGHT · FULL 360°
      </div>

      <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-white/70 bg-white/88 px-3 py-2 text-[10px] font-bold text-[#3D3732] shadow-lg backdrop-blur-md">
        REAL PHOTO · 360°
      </div>

      {opening && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/70 bg-white/95 px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-[#2E2925] shadow-xl">
          OPENING {opening.label}...
        </div>
      )}
    </div>
  );
}
