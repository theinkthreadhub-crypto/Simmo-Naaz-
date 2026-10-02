'use client';

import React, { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, RoundedBox, Sparkles } from '@react-three/drei';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

type ModuleKey =
  | 'ai'
  | 'quests'
  | 'memory'
  | 'finance'
  | 'skills'
  | 'journal'
  | 'calendar'
  | 'agents';

type ModuleConfig = {
  key: ModuleKey;
  label: string;
  short: string;
  href: string;
  position: [number, number, number];
  color: string;
};

const MODULES: ModuleConfig[] = [
  { key: 'ai', label: 'MENTRA AI', short: 'AI', href: '/mentra', position: [0, 1.65, -2.25], color: '#d8ff63' },
  { key: 'quests', label: 'QUEST BOARD', short: 'Q', href: '/quests', position: [-3.55, 2.05, -2.65], color: '#6ee7ff' },
  { key: 'memory', label: 'MEMORY VAULT', short: 'M', href: '/memory', position: [3.55, 1.2, -2.7], color: '#a78bfa' },
  { key: 'finance', label: 'FINANCE', short: '₹', href: '/finance', position: [-2.65, 0.72, 0.25], color: '#34d399' },
  { key: 'skills', label: 'SKILL MATRIX', short: 'S', href: '/skills', position: [3.55, 2.45, -0.35], color: '#fb7185' },
  { key: 'journal', label: 'JOURNAL', short: 'J', href: '/journal', position: [1.75, 0.55, 0.55], color: '#fbbf24' },
  { key: 'calendar', label: 'CALENDAR', short: 'C', href: '/calendar', position: [-3.55, 2.65, 0.05], color: '#60a5fa' },
  { key: 'agents', label: 'AGENT CORE', short: 'A', href: '/agents', position: [0, 0.95, 0.15], color: '#f4f1e8' },
];

function useHoverScale(active: boolean) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const target = active ? 1.06 : 1;
    ref.current.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
  });
  return ref;
}

function ModuleLabel({ module, hovered }: { module: ModuleConfig; hovered: boolean }) {
  return (
    <Html
      center
      position={[0, 0.72, 0]}
      distanceFactor={8}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      <div
        className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-mono tracking-[0.16em] backdrop-blur-md transition-all duration-200 ${
          hovered ? 'border-white/30 bg-black/80 text-white opacity-100' : 'border-white/10 bg-black/55 text-white/55 opacity-80'
        }`}
      >
        {module.label}
      </div>
    </Html>
  );
}

function ModuleObject({
  module,
  onOpen,
}: {
  module: ModuleConfig;
  onOpen: (module: ModuleConfig) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const group = useHoverScale(hovered);

  const stop = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
  };

  const materialProps = {
    color: hovered ? module.color : '#171a17',
    emissive: module.color,
    emissiveIntensity: hovered ? 0.34 : 0.12,
    metalness: 0.72,
    roughness: 0.3,
  };

  if (module.key === 'ai') {
    return (
      <group ref={group} position={module.position}>
        <RoundedBox args={[2.4, 1.38, 0.14]} radius={0.08} smoothness={4} onPointerOver={stop} onPointerOut={() => setHovered(false)} onClick={() => onOpen(module)}>
          <meshStandardMaterial {...materialProps} />
        </RoundedBox>
        <mesh position={[0, 0, 0.08]}>
          <planeGeometry args={[2.08, 1.08]} />
          <meshStandardMaterial color="#09110c" emissive={module.color} emissiveIntensity={hovered ? 0.2 : 0.08} />
        </mesh>
        <mesh position={[0, -0.91, 0]}>
          <boxGeometry args={[0.16, 0.45, 0.14]} />
          <meshStandardMaterial color="#1f241f" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, -1.14, 0]}>
          <boxGeometry args={[0.9, 0.08, 0.5]} />
          <meshStandardMaterial color="#1f241f" metalness={0.7} roughness={0.3} />
        </mesh>
        <ModuleLabel module={module} hovered={hovered} />
      </group>
    );
  }

  if (module.key === 'quests' || module.key === 'calendar' || module.key === 'skills') {
    return (
      <group ref={group} position={module.position}>
        <RoundedBox args={[1.55, 1.7, 0.12]} radius={0.06} smoothness={3} onPointerOver={stop} onPointerOut={() => setHovered(false)} onClick={() => onOpen(module)}>
          <meshStandardMaterial {...materialProps} />
        </RoundedBox>
        {[0.45, 0, -0.45].map((y, i) => (
          <mesh key={y} position={[i === 1 ? 0.15 : -0.08, y, 0.075]}>
            <boxGeometry args={[i === 1 ? 1.05 : 0.82, 0.055, 0.025]} />
            <meshStandardMaterial color={module.color} emissive={module.color} emissiveIntensity={0.35} />
          </mesh>
        ))}
        <ModuleLabel module={module} hovered={hovered} />
      </group>
    );
  }

  if (module.key === 'memory') {
    return (
      <group ref={group} position={module.position}>
        <RoundedBox args={[1.45, 2.2, 0.85]} radius={0.08} smoothness={4} onPointerOver={stop} onPointerOut={() => setHovered(false)} onClick={() => onOpen(module)}>
          <meshStandardMaterial {...materialProps} />
        </RoundedBox>
        <mesh position={[0, 0.15, 0.46]}>
          <torusGeometry args={[0.33, 0.06, 16, 48]} />
          <meshStandardMaterial color={module.color} emissive={module.color} emissiveIntensity={0.35} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.15, 0.48]}>
          <circleGeometry args={[0.12, 32]} />
          <meshStandardMaterial color="#080907" />
        </mesh>
        <ModuleLabel module={module} hovered={hovered} />
      </group>
    );
  }

  if (module.key === 'agents') {
    return (
      <group ref={group} position={module.position}>
        <mesh onPointerOver={stop} onPointerOut={() => setHovered(false)} onClick={() => onOpen(module)}>
          <icosahedronGeometry args={[0.72, 1]} />
          <meshStandardMaterial {...materialProps} wireframe={!hovered} />
        </mesh>
        <Sparkles count={22} scale={[2, 2, 2]} size={2} speed={0.35} opacity={0.55} color={module.color} />
        <ModuleLabel module={module} hovered={hovered} />
      </group>
    );
  }

  return (
    <group ref={group} position={module.position}>
      <RoundedBox args={[1.25, 0.22, 0.9]} radius={0.06} smoothness={4} onPointerOver={stop} onPointerOut={() => setHovered(false)} onClick={() => onOpen(module)}>
        <meshStandardMaterial {...materialProps} />
      </RoundedBox>
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[0.86, 0.08, 0.58]} />
        <meshStandardMaterial color={module.color} emissive={module.color} emissiveIntensity={0.22} />
      </mesh>
      <ModuleLabel module={module} hovered={hovered} />
    </group>
  );
}

function Room() {
  return (
    <group>
      <mesh position={[0, -0.12, -0.8]} receiveShadow>
        <boxGeometry args={[9.4, 0.18, 7.4]} />
        <meshStandardMaterial color="#0c0e0c" roughness={0.82} metalness={0.12} />
      </mesh>
      <mesh position={[0, 2.3, -4.45]} receiveShadow>
        <boxGeometry args={[9.4, 4.9, 0.16]} />
        <meshStandardMaterial color="#101310" roughness={0.75} />
      </mesh>
      <mesh position={[-4.62, 2.3, -0.8]} receiveShadow>
        <boxGeometry args={[0.16, 4.9, 7.4]} />
        <meshStandardMaterial color="#0d100d" roughness={0.78} />
      </mesh>

      <RoundedBox position={[0, 0.38, -2.0]} args={[4.0, 0.18, 1.45]} radius={0.08} smoothness={4}>
        <meshStandardMaterial color="#171a17" metalness={0.52} roughness={0.35} />
      </RoundedBox>
      {[-1.7, 1.7].map(x => (
        <mesh key={x} position={[x, 0.02, -2.0]}>
          <boxGeometry args={[0.12, 0.82, 1.15]} />
          <meshStandardMaterial color="#151815" metalness={0.45} roughness={0.42} />
        </mesh>
      ))}

      <mesh position={[0, 3.7, -4.32]}>
        <boxGeometry args={[7.6, 0.025, 0.03]} />
        <meshStandardMaterial color="#d8ff63" emissive="#d8ff63" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[-4.48, 3.2, -0.8]}>
        <boxGeometry args={[0.03, 0.025, 5.4]} />
        <meshStandardMaterial color="#6ee7ff" emissive="#6ee7ff" emissiveIntensity={0.85} />
      </mesh>

      <Sparkles count={55} scale={[8.5, 4.2, 6.2]} position={[0, 1.8, -0.8]} size={1.1} speed={0.18} opacity={0.22} color="#d8ff63" />
    </group>
  );
}

function CameraRig() {
  const target = useMemo(() => new THREE.Vector3(0, 1.25, -1.1), []);
  useFrame(({ camera }) => {
    camera.lookAt(target);
  });
  return null;
}

function Scene({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  return (
    <>
      <color attach="background" args={['#060806']} />
      <fog attach="fog" args={['#060806', 8, 16]} />
      <ambientLight intensity={0.48} color="#d9e2cf" />
      <directionalLight position={[2.5, 5.2, 3.5]} intensity={1.35} color="#fff6df" castShadow />
      <pointLight position={[0, 3.3, -2.2]} intensity={2.2} distance={6} color="#d8ff63" />
      <pointLight position={[-3.4, 2.5, 0.8]} intensity={1.4} distance={5} color="#6ee7ff" />
      <pointLight position={[3.5, 2.4, -0.4]} intensity={1.1} distance={5} color="#a78bfa" />
      <Room />
      {MODULES.map(module => (
        <ModuleObject key={module.key} module={module} onOpen={onOpen} />
      ))}
      <CameraRig />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={5.8}
        maxDistance={10}
        minPolarAngle={Math.PI * 0.27}
        maxPolarAngle={Math.PI * 0.54}
        minAzimuthAngle={-0.65}
        maxAzimuthAngle={0.65}
        target={[0, 1.2, -1.1]}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  );
}

export default function MentraHQScene() {
  const router = useRouter();
  const [active, setActive] = useState<ModuleConfig | null>(null);

  const open = (module: ModuleConfig) => {
    setActive(module);
    window.setTimeout(() => router.push(module.href), 180);
  };

  return (
    <div className="relative h-full min-h-[520px] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#060806] shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 4.1, 7.6], fov: 48 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <Scene onOpen={open} />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-5">
        <div className="rounded-full border border-white/10 bg-black/55 px-3 py-2 text-[10px] font-mono tracking-[0.18em] text-white/60 backdrop-blur-xl">
          MENTRA HQ // LIVE
        </div>
        <div className="rounded-full border border-[#d8ff63]/20 bg-[#d8ff63]/10 px-3 py-2 text-[10px] font-mono tracking-[0.14em] text-[#d8ff63] backdrop-blur-xl">
          DRAG TO LOOK · TAP TO OPEN
        </div>
      </div>

      {active && (
        <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-black/75 px-4 py-2 text-xs font-mono text-white backdrop-blur-xl">
          Opening {active.label}…
        </div>
      )}
    </div>
  );
}
