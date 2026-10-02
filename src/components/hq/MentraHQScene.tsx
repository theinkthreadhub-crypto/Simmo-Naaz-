'use client';

import React, { Suspense, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame } from '@react-three/fiber';
import { ContactShadows, Html, OrbitControls, OrthographicCamera, RoundedBox } from '@react-three/drei';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

type ModuleConfig = {
  key: string;
  label: string;
  href: string;
  color: string;
};

const MODULES = {
  ai: { key: 'ai', label: 'MENTRA AI', href: '/mentra', color: '#2FB47C' },
  quests: { key: 'quests', label: 'QUESTS', href: '/quests', color: '#E9A93C' },
  memory: { key: 'memory', label: 'MEMORY', href: '/memory', color: '#8A6AC8' },
  finance: { key: 'finance', label: 'FINANCE', href: '/finance', color: '#37A46B' },
  skills: { key: 'skills', label: 'SKILLS', href: '/skills', color: '#6A83D6' },
  journal: { key: 'journal', label: 'JOURNAL', href: '/journal', color: '#B77743' },
  calendar: { key: 'calendar', label: 'CALENDAR', href: '/calendar', color: '#5E9DCB' },
  agents: { key: 'agents', label: 'AGENTS', href: '/agents', color: '#7568C7' },
} satisfies Record<string, ModuleConfig>;

function ModuleTag({
  module,
  visible,
  position = [0, 0.65, 0],
}: {
  module: ModuleConfig;
  visible: boolean;
  position?: [number, number, number];
}) {
  if (!visible) return null;
  return (
    <Html center position={position} distanceFactor={9} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          whiteSpace: 'nowrap',
          borderRadius: 999,
          padding: '8px 12px',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '.08em',
          color: '#2D2924',
          background: 'rgba(255,255,255,.96)',
          border: `1px solid ${module.color}55`,
          boxShadow: '0 8px 24px rgba(97,72,52,.18)',
        }}
      >
        {module.label}
      </div>
    </Html>
  );
}

function Interactive({
  module,
  children,
  labelPosition,
  onOpen,
}: {
  module: ModuleConfig;
  children: React.ReactNode;
  labelPosition?: [number, number, number];
  onOpen: (module: ModuleConfig) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    const target = hovered ? 1.04 : 1;
    const s = THREE.MathUtils.lerp(ref.current.scale.x, target, 0.12);
    ref.current.scale.setScalar(s);
  });

  const over = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = 'pointer';
    setHovered(true);
  };

  return (
    <group
      ref={ref}
      onPointerOver={over}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
        setHovered(false);
      }}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(module);
      }}
    >
      {children}
      <ModuleTag module={module} visible={hovered} position={labelPosition} />
    </group>
  );
}

function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <cylinderGeometry args={[0.22, 0.17, 0.42, 18]} />
        <meshStandardMaterial color="#D8C6B5" roughness={0.85} />
      </mesh>
      {[
        [-0.13, 0.5, 0],
        [0.14, 0.54, 0.05],
        [0, 0.64, 0.08],
        [-0.08, 0.72, -0.08],
        [0.1, 0.8, -0.05],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0.15 * i, 0.55 * i, i % 2 ? -0.4 : 0.4]} castShadow>
          <coneGeometry args={[0.15, 0.64, 7]} />
          <meshStandardMaterial color={i % 2 ? '#4E7F54' : '#60945F'} roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}

function FloorAndWalls() {
  const planks = ['#C99363', '#D5A36F', '#BF8759', '#D8AA78'];
  return (
    <group>
      <RoundedBox position={[0, -0.28, 0]} args={[10.8, 0.55, 8.4]} radius={0.12} smoothness={4} receiveShadow castShadow>
        <meshStandardMaterial color="#E9DED1" roughness={0.9} />
      </RoundedBox>

      {Array.from({ length: 17 }).map((_, i) => (
        <mesh key={i} position={[-5.08 + i * 0.63, 0.015, 0]} receiveShadow>
          <boxGeometry args={[0.58, 0.045, 7.85]} />
          <meshStandardMaterial color={planks[i % planks.length]} roughness={0.76} />
        </mesh>
      ))}

      <mesh position={[0, 2.6, -4.08]} receiveShadow castShadow>
        <boxGeometry args={[10.8, 5.2, 0.2]} />
        <meshStandardMaterial color="#F3EEE8" roughness={0.95} />
      </mesh>

      <mesh position={[-5.3, 2.6, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.2, 5.2, 8.4]} />
        <meshStandardMaterial color="#EEE7DF" roughness={0.95} />
      </mesh>

      <mesh position={[0, 0.11, 3.95]} receiveShadow>
        <boxGeometry args={[10.8, 0.2, 0.12]} />
        <meshStandardMaterial color="#DCCDBF" roughness={0.8} />
      </mesh>
      <mesh position={[5.18, 0.11, 0]} receiveShadow>
        <boxGeometry args={[0.12, 0.2, 8.4]} />
        <meshStandardMaterial color="#DCCDBF" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Window() {
  return (
    <group position={[2.95, 2.7, -3.95]}>
      <mesh>
        <boxGeometry args={[3.35, 2.65, 0.08]} />
        <meshStandardMaterial color="#FAF8F4" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0, 0.055]}>
        <planeGeometry args={[3.05, 2.35]} />
        <meshStandardMaterial color="#CFE7F0" emissive="#E5F5FB" emissiveIntensity={0.65} />
      </mesh>
      {[-0.78, 0, 0.78].map((x) => (
        <mesh key={x} position={[x, 0, 0.08]}>
          <boxGeometry args={[0.045, 2.35, 0.03]} />
          <meshStandardMaterial color="#FAF8F4" />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[3.05, 0.045, 0.03]} />
        <meshStandardMaterial color="#FAF8F4" />
      </mesh>
    </group>
  );
}

function Desk({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  return (
    <group>
      <group position={[-0.35, 0.9, -2.65]}>
        <RoundedBox args={[4.25, 0.18, 1.48]} radius={0.06} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#9C6543" roughness={0.5} />
        </RoundedBox>
        {[-1.8, 1.8].flatMap((x) => [-0.52, 0.52].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -0.7, z]} castShadow>
            <boxGeometry args={[0.12, 1.4, 0.12]} />
            <meshStandardMaterial color="#6E5040" roughness={0.55} />
          </mesh>
        )))}
      </group>

      <Interactive module={MODULES.ai} onOpen={onOpen} labelPosition={[0, 1.0, 0]}>
        <group position={[-0.4, 1.85, -2.86]}>
          <RoundedBox args={[2.05, 1.25, 0.13]} radius={0.05} smoothness={4} castShadow>
            <meshStandardMaterial color="#2C302E" roughness={0.32} metalness={0.38} />
          </RoundedBox>
          <mesh position={[0, 0, 0.075]}>
            <planeGeometry args={[1.8, 1.02]} />
            <meshStandardMaterial color="#183A2A" emissive="#2FB47C" emissiveIntensity={0.18} />
          </mesh>
          <Html transform position={[0, 0, 0.09]} distanceFactor={1.45} style={{ pointerEvents: 'none' }}>
            <div style={{
              width: 320,
              height: 178,
              borderRadius: 12,
              background: 'linear-gradient(145deg,#173628,#1c4432)',
              color: 'white',
              padding: 18,
              fontFamily: 'Arial, sans-serif',
            }}>
              <div style={{ fontSize: 10, color: '#7EE2B5', letterSpacing: '.12em', fontWeight: 700 }}>MENTRA AI</div>
              <div style={{ marginTop: 18, fontSize: 24, fontWeight: 800 }}>Personal Mentor</div>
              <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,.72)' }}>Ask · Plan · Execute</div>
            </div>
          </Html>
          <mesh position={[0, -0.82, 0]}>
            <boxGeometry args={[0.12, 0.4, 0.13]} />
            <meshStandardMaterial color="#717773" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[0, -1.03, 0]}>
            <boxGeometry args={[0.7, 0.06, 0.36]} />
            <meshStandardMaterial color="#717773" metalness={0.5} roughness={0.3} />
          </mesh>
        </group>
      </Interactive>

      <Interactive module={MODULES.finance} onOpen={onOpen} labelPosition={[0, 0.55, 0]}>
        <group position={[-1.72, 1.05, -2.36]}>
          <RoundedBox args={[0.9, 0.1, 0.55]} radius={0.035} smoothness={3}>
            <meshStandardMaterial color="#F5F1EA" roughness={0.6} />
          </RoundedBox>
          {[0.13, 0, -0.13].map((z, i) => (
            <mesh key={z} position={[0, 0.06, z]}>
              <boxGeometry args={[0.58 - i * 0.09, 0.025, 0.04]} />
              <meshStandardMaterial color="#37A46B" />
            </mesh>
          ))}
        </group>
      </Interactive>

      <Interactive module={MODULES.journal} onOpen={onOpen} labelPosition={[0, 0.48, 0]}>
        <group position={[1.18, 1.03, -2.36]} rotation={[0, -0.15, 0]}>
          <RoundedBox args={[0.82, 0.08, 0.6]} radius={0.035} smoothness={3}>
            <meshStandardMaterial color="#E8D5B7" roughness={0.86} />
          </RoundedBox>
          <mesh position={[0, 0.045, 0]}>
            <boxGeometry args={[0.035, 0.01, 0.52]} />
            <meshStandardMaterial color="#9A6C47" />
          </mesh>
        </group>
      </Interactive>

      <group position={[-0.2, 0.72, -0.55]}>
        <RoundedBox args={[1.25, 0.18, 1.1]} radius={0.1} smoothness={4} castShadow>
          <meshStandardMaterial color="#B9B1A8" roughness={0.72} />
        </RoundedBox>
        <RoundedBox position={[0, 0.78, 0.42]} args={[1.25, 1.3, 0.22]} radius={0.11} smoothness={4} castShadow>
          <meshStandardMaterial color="#C8C0B7" roughness={0.72} />
        </RoundedBox>
      </group>
    </group>
  );
}

function LeftWallModules({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  return (
    <group>
      <Interactive module={MODULES.skills} onOpen={onOpen} labelPosition={[0, 1.1, 0]}>
        <group position={[-5.16, 2.8, -2.2]} rotation={[0, Math.PI / 2, 0]}>
          <RoundedBox args={[2.15, 2.0, 0.1]} radius={0.04} smoothness={3}>
            <meshStandardMaterial color="#FBFAF8" roughness={0.8} />
          </RoundedBox>
          {[0.48, 0.12, -0.24, -0.6].map((y, i) => (
            <group key={y}>
              <mesh position={[-0.2, y, 0.065]}>
                <boxGeometry args={[0.9, 0.05, 0.02]} />
                <meshStandardMaterial color="#E3E0DB" />
              </mesh>
              <mesh position={[-0.46, y, 0.078]}>
                <boxGeometry args={[0.38 + i * 0.08, 0.065, 0.025]} />
                <meshStandardMaterial color={['#6A83D6','#8A6AC8','#2FB47C','#E9A93C'][i]} />
              </mesh>
            </group>
          ))}
        </group>
      </Interactive>

      <Interactive module={MODULES.quests} onOpen={onOpen} labelPosition={[0, 1.05, 0]}>
        <group position={[-5.16, 2.55, 0.35]} rotation={[0, Math.PI / 2, 0]}>
          <RoundedBox args={[2.0, 1.85, 0.1]} radius={0.04} smoothness={3}>
            <meshStandardMaterial color="#FBFAF8" roughness={0.8} />
          </RoundedBox>
          {[0.45, 0.08, -0.29, -0.66].map((y, i) => (
            <group key={y}>
              <mesh position={[-0.56, y, 0.07]}>
                <boxGeometry args={[0.11, 0.11, 0.02]} />
                <meshStandardMaterial color={i < 2 ? '#2FB47C' : '#D8D1C9'} />
              </mesh>
              <mesh position={[0.12, y, 0.07]}>
                <boxGeometry args={[1.0, 0.045, 0.02]} />
                <meshStandardMaterial color="#A99F96" />
              </mesh>
            </group>
          ))}
        </group>
      </Interactive>

      <group position={[-4.95, 1.35, 2.75]} rotation={[0, Math.PI / 2, 0]}>
        {[-0.55, 0, 0.55].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <boxGeometry args={[2.0, 0.09, 0.45]} />
            <meshStandardMaterial color="#9C6543" roughness={0.58} />
          </mesh>
        ))}
        {[-0.55, 0, 0.55].map((y) =>
          [-0.65, 0, 0.65].map((x, i) => (
            <mesh key={`${y}-${x}`} position={[x, y + 0.18, 0]}>
              <boxGeometry args={[0.12 + (i % 2) * 0.05, 0.3, 0.24]} />
              <meshStandardMaterial color={i === 1 ? '#D4A85D' : '#E8DFD4'} />
            </mesh>
          ))
        )}
      </group>

      <Plant position={[-4.8, 0.2, 2.9]} scale={1.05} />
    </group>
  );
}

function BackWallModules({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  return (
    <group>
      <Interactive module={MODULES.calendar} onOpen={onOpen} labelPosition={[0, 1.0, 0]}>
        <group position={[1.25, 2.6, -3.95]}>
          <RoundedBox args={[2.0, 1.8, 0.1]} radius={0.04} smoothness={3}>
            <meshStandardMaterial color="#FBFAF8" roughness={0.8} />
          </RoundedBox>
          <mesh position={[0, 0.55, 0.065]}>
            <boxGeometry args={[1.5, 0.06, 0.02]} />
            <meshStandardMaterial color="#A99D92" />
          </mesh>
          {[-0.48, 0, 0.48].flatMap((x) => [0.1, -0.3, -0.7].map((y, i) => (
            <mesh key={`${x}-${y}`} position={[x, y, 0.068]}>
              <boxGeometry args={[0.27, 0.22, 0.02]} />
              <meshStandardMaterial color={['#F5D277','#92C7E6','#E4A08C','#BDA4DF'][(i + Math.round((x + 0.5) * 2)) % 4]} />
            </mesh>
          )))}
        </group>
      </Interactive>

      <Interactive module={MODULES.memory} onOpen={onOpen} labelPosition={[0, 1.25, 0]}>
        <group position={[4.1, 1.4, -3.55]}>
          <RoundedBox args={[1.4, 2.7, 0.78]} radius={0.06} smoothness={4} castShadow>
            <meshStandardMaterial color="#E7DFD6" roughness={0.67} />
          </RoundedBox>
          {[-0.62, 0, 0.62].map((y) => (
            <mesh key={y} position={[0, y, 0.41]}>
              <boxGeometry args={[1.12, 0.04, 0.025]} />
              <meshStandardMaterial color="#A89C91" />
            </mesh>
          ))}
          <mesh position={[0, 0.08, 0.44]}>
            <torusGeometry args={[0.28, 0.045, 16, 42]} />
            <meshStandardMaterial color="#8A6AC8" emissive="#8A6AC8" emissiveIntensity={0.1} />
          </mesh>
        </group>
      </Interactive>

      <Interactive module={MODULES.agents} onOpen={onOpen} labelPosition={[0, 0.9, 0]}>
        <group position={[3.75, 0.85, 1.65]}>
          <mesh>
            <sphereGeometry args={[0.46, 32, 32]} />
            <meshPhysicalMaterial color="#C9C4F4" emissive="#7568C7" emissiveIntensity={0.28} roughness={0.12} metalness={0.08} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.64, 0.022, 12, 64]} />
            <meshStandardMaterial color="#D5A26D" />
          </mesh>
          <mesh rotation={[0.45, 0.55, 0]}>
            <torusGeometry args={[0.7, 0.018, 12, 64]} />
            <meshStandardMaterial color="#7568C7" emissive="#7568C7" emissiveIntensity={0.12} />
          </mesh>
        </group>
      </Interactive>

      <group position={[3.85, 0.58, 2.45]}>
        <RoundedBox args={[2.0, 0.9, 0.78]} radius={0.07} smoothness={4} castShadow>
          <meshStandardMaterial color="#9C6543" roughness={0.56} />
        </RoundedBox>
      </group>

      <Plant position={[4.35, 0.2, 2.95]} scale={0.95} />
    </group>
  );
}

function Lounge() {
  return (
    <group>
      <group position={[-3.0, 0.48, 2.0]} rotation={[0, 0.55, 0]}>
        <RoundedBox args={[2.1, 0.68, 1.1]} radius={0.16} smoothness={5} castShadow>
          <meshStandardMaterial color="#D8D0C7" roughness={0.88} />
        </RoundedBox>
        <RoundedBox position={[0, 0.66, 0.38]} args={[2.1, 0.82, 0.3]} radius={0.16} smoothness={5} castShadow>
          <meshStandardMaterial color="#E4DDD6" roughness={0.88} />
        </RoundedBox>
      </group>

      <group position={[1.7, 0.35, 2.15]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.75, 0.8, 0.15, 36]} />
          <meshStandardMaterial color="#A56F4A" roughness={0.56} />
        </mesh>
        <mesh position={[0, -0.36, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.7, 18]} />
          <meshStandardMaterial color="#6D5140" />
        </mesh>
      </group>

      <Plant position={[-4.25, 0.18, 3.1]} scale={1.1} />
      <Plant position={[2.3, 0.18, 2.65]} scale={0.55} />
    </group>
  );
}

function TrophyAndBrand() {
  return (
    <group>
      <group position={[-1.9, 3.55, -3.92]}>
        <mesh>
          <boxGeometry args={[1.8, 0.1, 0.42]} />
          <meshStandardMaterial color="#9C6543" />
        </mesh>
        <mesh position={[-0.35, 0.35, 0]}>
          <cylinderGeometry args={[0.16, 0.24, 0.36, 20]} />
          <meshStandardMaterial color="#E0AF45" metalness={0.55} roughness={0.28} />
        </mesh>
        <Plant position={[0.48, 0.11, 0]} scale={0.4} />
      </group>

      <Html transform position={[-0.55, 4.25, -3.95]} distanceFactor={4.4} style={{ pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center', whiteSpace: 'nowrap', color: '#2D2924' }}>
          <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: 900, fontSize: 42, letterSpacing: '.18em' }}>MENTRA</div>
          <div style={{ marginTop: 5, fontSize: 9, letterSpacing: '.28em', color: '#81766C', fontWeight: 700 }}>BUILD A BETTER YOU</div>
        </div>
      </Html>
    </group>
  );
}

function Scene({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  return (
    <>
      <color attach="background" args={['#C9BDB2']} />
      <ambientLight intensity={1.55} color="#FFF8EF" />
      <hemisphereLight intensity={1.35} color="#FFFFFF" groundColor="#B9875C" />
      <directionalLight position={[7, 9, 7]} intensity={2.2} color="#FFF1D7" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />

      <FloorAndWalls />
      <Window />
      <Desk onOpen={onOpen} />
      <LeftWallModules onOpen={onOpen} />
      <BackWallModules onOpen={onOpen} />
      <Lounge />
      <TrophyAndBrand />

      <ContactShadows position={[0, -0.04, 0]} opacity={0.28} scale={13} blur={2.8} far={5} />

      <OrthographicCamera makeDefault position={[8.2, 7.4, 8.2]} zoom={54} near={0.1} far={100} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        minZoom={42}
        maxZoom={76}
        minPolarAngle={0.66}
        maxPolarAngle={0.98}
        minAzimuthAngle={0.62}
        maxAzimuthAngle={0.98}
        target={[0, 1.55, -0.35]}
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
    <div className="absolute inset-0 overflow-hidden bg-[#C9BDB2]">
      <Canvas
        shadows
        dpr={[1, 1.35]}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <Suspense fallback={null}>
          <Scene onOpen={open} />
        </Suspense>
      </Canvas>

      {active && (
        <div className="pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 rounded-full border border-black/10 bg-white/95 px-4 py-2 text-[10px] font-semibold tracking-[0.1em] text-[#3B332D] shadow-lg">
          OPENING {active.label}...
        </div>
      )}

      <div className="pointer-events-none absolute bottom-4 right-4 hidden rounded-full border border-black/10 bg-white/80 px-3 py-2 text-[9px] font-semibold tracking-[0.08em] text-[#63584F] shadow-md backdrop-blur sm:block">
        DRAG · ZOOM · TAP OBJECTS
      </div>
    </div>
  );
}
