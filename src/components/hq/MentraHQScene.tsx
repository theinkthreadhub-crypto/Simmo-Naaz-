'use client';

import React, { Suspense, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, RoundedBox, Sparkles } from '@react-three/drei';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

type ModuleConfig = {
  key: string;
  label: string;
  href: string;
  color: string;
};

const MODULES = {
  ai: { key: 'ai', label: 'MENTRA AI', href: '/mentra', color: '#d8ff63' },
  quests: { key: 'quests', label: 'QUESTS', href: '/quests', color: '#70e1ff' },
  memory: { key: 'memory', label: 'MEMORY VAULT', href: '/memory', color: '#a78bfa' },
  finance: { key: 'finance', label: 'FINANCE', href: '/finance', color: '#34d399' },
  skills: { key: 'skills', label: 'SKILL MATRIX', href: '/skills', color: '#fb7185' },
  journal: { key: 'journal', label: 'JOURNAL', href: '/journal', color: '#fbbf24' },
  calendar: { key: 'calendar', label: 'CALENDAR', href: '/calendar', color: '#60a5fa' },
  agents: { key: 'agents', label: 'AGENT CORE', href: '/agents', color: '#f4f1e8' },
} satisfies Record<string, ModuleConfig>;

function HoverLabel({ label, color, visible, position = [0, 0.7, 0] }: {
  label: string;
  color: string;
  visible: boolean;
  position?: [number, number, number];
}) {
  if (!visible) return null;
  return (
    <Html center position={position} distanceFactor={7.5} style={{ pointerEvents: 'none' }}>
      <div
        className="whitespace-nowrap rounded-full border bg-black/80 px-3 py-1.5 text-[9px] font-mono tracking-[0.18em] text-white backdrop-blur-xl"
        style={{ borderColor: `${color}66`, boxShadow: `0 0 30px ${color}22` }}
      >
        {label}
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
    const target = hovered ? 1.035 : 1;
    const s = THREE.MathUtils.lerp(ref.current.scale.x, target, 0.12);
    ref.current.scale.setScalar(s);
  });

  const over = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = 'pointer';
    setHovered(true);
  };

  const out = () => {
    document.body.style.cursor = 'default';
    setHovered(false);
  };

  return (
    <group
      ref={ref}
      onPointerOver={over}
      onPointerOut={out}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(module);
      }}
    >
      {children}
      <HoverLabel
        label={module.label}
        color={module.color}
        visible={hovered}
        position={labelPosition}
      />
    </group>
  );
}

function RoomShell() {
  return (
    <group>
      <mesh position={[0, -0.12, -0.8]} receiveShadow>
        <boxGeometry args={[12, 0.22, 10]} />
        <meshStandardMaterial color="#191a18" roughness={0.72} metalness={0.12} />
      </mesh>

      {Array.from({ length: 17 }).map((_, i) => (
        <mesh key={i} position={[-5.6 + i * 0.7, 0.005, -0.7]} receiveShadow>
          <boxGeometry args={[0.63, 0.012, 9.2]} />
          <meshStandardMaterial color={i % 2 ? '#20211f' : '#242522'} roughness={0.78} />
        </mesh>
      ))}

      <mesh position={[0, 2.65, -5.72]} receiveShadow>
        <boxGeometry args={[12, 5.7, 0.2]} />
        <meshStandardMaterial color="#111310" roughness={0.9} />
      </mesh>

      <mesh position={[-5.9, 2.65, -0.8]} receiveShadow>
        <boxGeometry args={[0.2, 5.7, 10]} />
        <meshStandardMaterial color="#0f110f" roughness={0.9} />
      </mesh>

      <mesh position={[5.9, 2.65, -0.8]} receiveShadow>
        <boxGeometry args={[0.2, 5.7, 10]} />
        <meshStandardMaterial color="#101210" roughness={0.9} />
      </mesh>

      <mesh position={[0, 5.44, -0.8]} receiveShadow>
        <boxGeometry args={[12, 0.16, 10]} />
        <meshStandardMaterial color="#0b0d0b" roughness={0.9} />
      </mesh>

      <mesh position={[0, 0.025, 0.65]} receiveShadow>
        <boxGeometry args={[5.4, 0.03, 3.3]} />
        <meshStandardMaterial color="#111512" roughness={0.95} />
      </mesh>

      {[-3.2, 0, 3.2].map((x) => (
        <group key={x} position={[x, 5.12, -0.8]}>
          <mesh>
            <cylinderGeometry args={[0.18, 0.22, 0.12, 24]} />
            <meshStandardMaterial color="#232522" metalness={0.65} roughness={0.25} />
          </mesh>
          <pointLight position={[0, -0.2, 0]} intensity={1.8} distance={5.5} color="#fff2d2" />
        </group>
      ))}
    </group>
  );
}

function WindowWall() {
  return (
    <group position={[5.76, 2.75, -1.4]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh>
        <boxGeometry args={[5.5, 3.25, 0.05]} />
        <meshStandardMaterial color="#06090b" roughness={0.1} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <planeGeometry args={[5.12, 2.86]} />
        <meshStandardMaterial
          color="#11253a"
          emissive="#16324d"
          emissiveIntensity={0.34}
          roughness={0.12}
          metalness={0.15}
        />
      </mesh>
      {[-1.28, 0, 1.28].map(x => (
        <mesh key={x} position={[x, 0, 0.07]}>
          <boxGeometry args={[0.04, 2.86, 0.035]} />
          <meshStandardMaterial color="#2d312f" metalness={0.65} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.075]}>
        <boxGeometry args={[5.12, 0.04, 0.035]} />
        <meshStandardMaterial color="#2d312f" metalness={0.65} roughness={0.3} />
      </mesh>
      {[-1.95, -1.2, -0.45, 0.3, 1.05, 1.8].map((x, i) => (
        <mesh key={x} position={[x, -0.98 + (i % 2) * 0.12, 0.09]}>
          <boxGeometry args={[0.35 + (i % 3) * 0.12, 0.5 + (i % 4) * 0.2, 0.03]} />
          <meshStandardMaterial color="#26384a" emissive="#335779" emissiveIntensity={0.12} />
        </mesh>
      ))}
    </group>
  );
}

function DeskAndChair({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  return (
    <group>
      <group position={[0, 0.82, -2.72]}>
        <RoundedBox args={[5.1, 0.22, 1.85]} radius={0.08} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#29231e" roughness={0.42} metalness={0.2} />
        </RoundedBox>
        {[-2.2, 2.2].flatMap(x => [-0.68, 0.68].map(z => (
          <mesh key={`${x}-${z}`} position={[x, -0.74, z]} castShadow>
            <boxGeometry args={[0.12, 1.48, 0.12]} />
            <meshStandardMaterial color="#151715" metalness={0.72} roughness={0.28} />
          </mesh>
        )))}
      </group>

      <Interactive module={MODULES.ai} onOpen={onOpen} labelPosition={[0, 1.15, 0]}>
        <group position={[0, 2.12, -3.05]}>
          <RoundedBox args={[2.9, 1.68, 0.16]} radius={0.08} smoothness={4} castShadow>
            <meshStandardMaterial color="#0d100d" metalness={0.78} roughness={0.24} />
          </RoundedBox>
          <mesh position={[0, 0, 0.09]}>
            <planeGeometry args={[2.56, 1.35]} />
            <meshStandardMaterial color="#081109" emissive="#d8ff63" emissiveIntensity={0.15} />
          </mesh>
          <Html transform position={[0, 0, 0.105]} distanceFactor={1.28} style={{ pointerEvents: 'none' }}>
            <div
              style={{
                width: 420,
                height: 220,
                borderRadius: 12,
                background: 'linear-gradient(150deg,#061008,#0a0d0a)',
                padding: 20,
                color: '#f4f1e8',
                fontFamily: 'monospace',
                overflow: 'hidden',
                border: '1px solid rgba(216,255,99,.15)',
              }}
            >
              <div style={{ fontSize: 11, color: '#d8ff63', letterSpacing: '.2em' }}>MENTRA // CORE ONLINE</div>
              <div style={{ marginTop: 24, fontSize: 28, fontFamily: 'sans-serif', fontWeight: 700 }}>Good to see you.</div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,.45)' }}>Tap the monitor to open your AI mentor.</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
                {['MEMORY', 'GOALS', 'AGENTS'].map((item) => (
                  <div key={item} style={{ padding: '7px 10px', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, fontSize: 9, color: 'rgba(255,255,255,.6)' }}>{item}</div>
                ))}
              </div>
            </div>
          </Html>
          <mesh position={[0, -1.08, 0]}>
            <boxGeometry args={[0.16, 0.5, 0.18]} />
            <meshStandardMaterial color="#181b18" metalness={0.75} roughness={0.25} />
          </mesh>
          <mesh position={[0, -1.33, 0]}>
            <boxGeometry args={[0.9, 0.08, 0.5]} />
            <meshStandardMaterial color="#181b18" metalness={0.75} roughness={0.25} />
          </mesh>
        </group>
      </Interactive>

      <Interactive module={MODULES.finance} onOpen={onOpen} labelPosition={[0, 0.65, 0]}>
        <group position={[-1.75, 1.02, -2.22]}>
          <RoundedBox args={[1.05, 0.12, 0.72]} radius={0.04} smoothness={3}>
            <meshStandardMaterial color="#0e1511" emissive="#34d399" emissiveIntensity={0.09} metalness={0.55} roughness={0.3} />
          </RoundedBox>
          {[0.18, 0.02, -0.14].map((z, i) => (
            <mesh key={z} position={[0, 0.07, z]}>
              <boxGeometry args={[0.72 - i * 0.12, 0.025, 0.05]} />
              <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.38} />
            </mesh>
          ))}
        </group>
      </Interactive>

      <Interactive module={MODULES.journal} onOpen={onOpen} labelPosition={[0, 0.55, 0]}>
        <group position={[1.72, 1.02, -2.22]} rotation={[0, -0.16, 0]}>
          <RoundedBox args={[0.92, 0.1, 0.72]} radius={0.04} smoothness={3}>
            <meshStandardMaterial color="#2d2412" roughness={0.75} />
          </RoundedBox>
          <mesh position={[0, 0.055, 0]}>
            <boxGeometry args={[0.04, 0.01, 0.64]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.18} />
          </mesh>
        </group>
      </Interactive>

      <group position={[0, 0.72, 0.0]}>
        <mesh castShadow>
          <boxGeometry args={[1.35, 0.18, 1.35]} />
          <meshStandardMaterial color="#151715" roughness={0.46} metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.0, 0.55]} rotation={[-0.1, 0, 0]} castShadow>
          <boxGeometry args={[1.35, 1.75, 0.22]} />
          <meshStandardMaterial color="#111311" roughness={0.48} metalness={0.28} />
        </mesh>
        <mesh position={[0, -0.75, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 1.5, 18]} />
          <meshStandardMaterial color="#141614" metalness={0.72} roughness={0.25} />
        </mesh>
        <mesh position={[0, -1.46, 0]}>
          <cylinderGeometry args={[0.78, 0.78, 0.08, 5]} />
          <meshStandardMaterial color="#141614" metalness={0.72} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}

function LeftWall({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  return (
    <group>
      <Interactive module={MODULES.quests} onOpen={onOpen} labelPosition={[0, 1.25, 0]}>
        <group position={[-4.9, 2.65, -3.82]} rotation={[0, Math.PI / 2, 0]}>
          <RoundedBox args={[2.4, 2.25, 0.12]} radius={0.05} smoothness={3}>
            <meshStandardMaterial color="#12191b" roughness={0.6} />
          </RoundedBox>
          {[0.58, 0.18, -0.22, -0.62].map((y, i) => (
            <group key={y}>
              <mesh position={[-0.62 + (i % 2) * 0.18, y, 0.07]}>
                <boxGeometry args={[0.12, 0.12, 0.025]} />
                <meshStandardMaterial color={i < 2 ? '#70e1ff' : '#41515a'} emissive={i < 2 ? '#70e1ff' : '#000000'} emissiveIntensity={0.35} />
              </mesh>
              <mesh position={[0.26, y, 0.07]}>
                <boxGeometry args={[1.28, 0.045, 0.025]} />
                <meshStandardMaterial color={i < 2 ? '#70e1ff' : '#5b6264'} emissive={i < 2 ? '#70e1ff' : '#000000'} emissiveIntensity={0.2} />
              </mesh>
            </group>
          ))}
        </group>
      </Interactive>

      <Interactive module={MODULES.calendar} onOpen={onOpen} labelPosition={[0, 1.05, 0]}>
        <group position={[-4.9, 2.45, -0.58]} rotation={[0, Math.PI / 2, 0]}>
          <RoundedBox args={[2.1, 1.9, 0.12]} radius={0.05} smoothness={3}>
            <meshStandardMaterial color="#11161d" roughness={0.62} />
          </RoundedBox>
          <mesh position={[0, 0.58, 0.07]}>
            <boxGeometry args={[1.6, 0.08, 0.025]} />
            <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.35} />
          </mesh>
          {[-0.5, 0, 0.5].flatMap(x => [-0.2, -0.62].map(y => (
            <mesh key={`${x}-${y}`} position={[x, y, 0.07]}>
              <boxGeometry args={[0.26, 0.22, 0.025]} />
              <meshStandardMaterial color="#26354a" emissive="#60a5fa" emissiveIntensity={0.08} />
            </mesh>
          )))}
        </group>
      </Interactive>

      <group position={[-4.9, 0.72, 2.2]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.5, 0.58, 1.15, 20]} />
          <meshStandardMaterial color="#1c201b" roughness={0.85} />
        </mesh>
        {[0, 0.55, 1.0].map((y, i) => (
          <mesh key={y} position={[0.12 * (i - 1), 0.7 + y, 0]} rotation={[0.15 * i, 0.2 * i, 0.1 * i]}>
            <coneGeometry args={[0.35 - i * 0.04, 1.1 - i * 0.08, 6]} />
            <meshStandardMaterial color={i === 1 ? '#406c4e' : '#33593f'} roughness={0.78} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function RightStorage({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  return (
    <group>
      <Interactive module={MODULES.memory} onOpen={onOpen} labelPosition={[0, 1.55, 0]}>
        <group position={[4.42, 1.55, -4.2]}>
          <RoundedBox args={[1.55, 3.05, 1.0]} radius={0.07} smoothness={4} castShadow>
            <meshStandardMaterial color="#15131b" metalness={0.48} roughness={0.34} />
          </RoundedBox>
          {[-0.72, 0, 0.72].map(y => (
            <mesh key={y} position={[0, y, 0.52]}>
              <boxGeometry args={[1.28, 0.025, 0.03]} />
              <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.18} />
            </mesh>
          ))}
          <mesh position={[0, 0, 0.55]}>
            <torusGeometry args={[0.34, 0.055, 16, 48]} />
            <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.38} metalness={0.72} roughness={0.22} />
          </mesh>
        </group>
      </Interactive>

      <Interactive module={MODULES.skills} onOpen={onOpen} labelPosition={[0, 1.25, 0]}>
        <group position={[4.32, 2.65, -1.55]} rotation={[0, -Math.PI / 2, 0]}>
          <RoundedBox args={[2.35, 2.2, 0.12]} radius={0.05} smoothness={3}>
            <meshStandardMaterial color="#1b1115" roughness={0.62} />
          </RoundedBox>
          {[[-0.65, 0.45], [0, 0.72], [0.62, 0.2], [-0.1, -0.15], [0.55, -0.58], [-0.62, -0.52]].map(([x, y], i) => (
            <group key={i}>
              <mesh position={[x, y, 0.08]}>
                <circleGeometry args={[0.13, 24]} />
                <meshStandardMaterial color="#fb7185" emissive="#fb7185" emissiveIntensity={0.32} />
              </mesh>
              {i > 0 && (
                <mesh position={[(x as number) * 0.52, (y as number) * 0.52, 0.067]} rotation={[0, 0, Math.atan2(y as number, x as number)]}>
                  <boxGeometry args={[Math.sqrt((x as number) ** 2 + (y as number) ** 2) * 0.9, 0.025, 0.02]} />
                  <meshStandardMaterial color="#fb7185" emissive="#fb7185" emissiveIntensity={0.14} />
                </mesh>
              )}
            </group>
          ))}
        </group>
      </Interactive>

      <group position={[4.3, 0.82, 1.4]}>
        <RoundedBox args={[2.3, 1.25, 0.78]} radius={0.06} smoothness={3} castShadow>
          <meshStandardMaterial color="#171917" roughness={0.65} metalness={0.32} />
        </RoundedBox>
        {[0.34, -0.05, -0.44].map(y => (
          <mesh key={y} position={[0, y, 0.41]}>
            <boxGeometry args={[1.92, 0.06, 0.03]} />
            <meshStandardMaterial color="#343834" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function AgentCore({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.22;
    ref.current.position.y = 1.55 + Math.sin(state.clock.elapsedTime * 1.3) * 0.08;
  });

  return (
    <Interactive module={MODULES.agents} onOpen={onOpen} labelPosition={[0, 1.0, 0]}>
      <group position={[0, 0, 2.0]}>
        <group ref={ref}>
          <mesh castShadow>
            <icosahedronGeometry args={[0.62, 1]} />
            <meshStandardMaterial
              color="#f4f1e8"
              emissive="#d8ff63"
              emissiveIntensity={0.18}
              wireframe
              metalness={0.75}
              roughness={0.2}
            />
          </mesh>
          <mesh scale={0.52}>
            <icosahedronGeometry args={[0.62, 1]} />
            <meshStandardMaterial color="#111410" emissive="#d8ff63" emissiveIntensity={0.32} />
          </mesh>
        </group>
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <cylinderGeometry args={[0.82, 1.02, 0.22, 32]} />
          <meshStandardMaterial color="#141714" metalness={0.62} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.21, 0]}>
          <torusGeometry args={[0.72, 0.035, 16, 64]} />
          <meshStandardMaterial color="#d8ff63" emissive="#d8ff63" emissiveIntensity={0.72} />
        </mesh>
        <pointLight position={[0, 1.55, 0]} intensity={1.5} distance={4.5} color="#d8ff63" />
        <Sparkles count={26} scale={[2.1, 2.4, 2.1]} position={[0, 1.55, 0]} size={1.3} speed={0.25} opacity={0.34} color="#d8ff63" />
      </group>
    </Interactive>
  );
}

function NeonBrand() {
  return (
    <Html
      transform
      position={[0, 4.1, -5.56]}
      distanceFactor={3.5}
      style={{ pointerEvents: 'none' }}
    >
      <div style={{
        fontFamily: 'sans-serif',
        fontWeight: 800,
        fontSize: 52,
        letterSpacing: '0.28em',
        color: '#eef9cf',
        textShadow: '0 0 12px rgba(216,255,99,.6), 0 0 38px rgba(216,255,99,.28)',
        whiteSpace: 'nowrap',
      }}>
        MENTRA
      </div>
    </Html>
  );
}

function Scene({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  return (
    <>
      <color attach="background" args={['#060806']} />
      <fog attach="fog" args={['#060806', 9, 19]} />

      <ambientLight intensity={0.4} color="#dfe7d8" />
      <directionalLight position={[4.5, 7, 5]} intensity={1.15} color="#fff1cc" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[0, 3.5, -4.2]} intensity={1.15} distance={6} color="#d8ff63" />
      <pointLight position={[4.6, 3.2, -1]} intensity={1.25} distance={6} color="#5fa8ff" />
      <pointLight position={[-4.6, 2.8, -1.5]} intensity={0.8} distance={5} color="#70e1ff" />

      <RoomShell />
      <WindowWall />
      <DeskAndChair onOpen={onOpen} />
      <LeftWall onOpen={onOpen} />
      <RightStorage onOpen={onOpen} />
      <AgentCore onOpen={onOpen} />
      <NeonBrand />

      <Sparkles count={44} scale={[11, 5, 9]} position={[0, 2.4, -0.8]} size={0.7} speed={0.08} opacity={0.12} color="#d8ff63" />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.055}
        minDistance={6.6}
        maxDistance={11.5}
        minPolarAngle={Math.PI * 0.27}
        maxPolarAngle={Math.PI * 0.54}
        minAzimuthAngle={-0.72}
        maxAzimuthAngle={0.72}
        target={[0, 1.65, -1.25]}
      />
    </>
  );
}

export default function MentraHQScene() {
  const router = useRouter();
  const [active, setActive] = useState<ModuleConfig | null>(null);

  const open = (module: ModuleConfig) => {
    setActive(module);
    window.setTimeout(() => router.push(module.href), 220);
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#060806]">
      <Canvas
        shadows
        dpr={[1, 1.45]}
        camera={{ position: [0, 4.6, 9.3], fov: 47 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <Scene onOpen={open} />
        </Suspense>
      </Canvas>

      {active && (
        <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-black/75 px-4 py-2 text-[10px] font-mono tracking-[0.16em] text-white backdrop-blur-xl">
          ENTERING {active.label}...
        </div>
      )}

      <div className="pointer-events-none absolute bottom-5 right-5 hidden rounded-full border border-white/10 bg-black/45 px-3 py-2 text-[9px] font-mono tracking-[0.12em] text-white/42 backdrop-blur-xl sm:block">
        DRAG TO LOOK · SCROLL TO ZOOM · CLICK OBJECTS
      </div>
    </div>
  );
}
