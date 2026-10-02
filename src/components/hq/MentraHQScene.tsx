'use client';

import React, { Suspense, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, RoundedBox } from '@react-three/drei';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

type ModuleConfig = {
  key: string;
  label: string;
  href: string;
  color: string;
};

const MODULES = {
  ai: { key: 'ai', label: 'MENTRA AI', href: '/mentra', color: '#31C48D' },
  quests: { key: 'quests', label: 'QUESTS', href: '/quests', color: '#F0B429' },
  memory: { key: 'memory', label: 'MEMORY', href: '/memory', color: '#8B5CF6' },
  finance: { key: 'finance', label: 'FINANCE', href: '/finance', color: '#2BB673' },
  skills: { key: 'skills', label: 'SKILLS', href: '/skills', color: '#5B7CFA' },
  journal: { key: 'journal', label: 'JOURNAL', href: '/journal', color: '#C88445' },
  calendar: { key: 'calendar', label: 'CALENDAR', href: '/calendar', color: '#4FA3E3' },
  agents: { key: 'agents', label: 'AGENTS', href: '/agents', color: '#6C63FF' },
} satisfies Record<string, ModuleConfig>;

function HoverLabel({
  module,
  visible,
  position = [0, 0.7, 0],
}: {
  module: ModuleConfig;
  visible: boolean;
  position?: [number, number, number];
}) {
  if (!visible) return null;
  return (
    <Html center position={position} distanceFactor={7} style={{ pointerEvents: 'none' }}>
      <div
        className="whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[0.08em] shadow-xl backdrop-blur-xl"
        style={{
          color: '#2F2B27',
          background: 'rgba(255,255,255,.94)',
          borderColor: `${module.color}66`,
          boxShadow: `0 10px 30px rgba(120,93,62,.16), 0 0 0 1px ${module.color}14`,
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
    const target = hovered ? 1.035 : 1;
    const s = THREE.MathUtils.lerp(ref.current.scale.x, target, 0.1);
    ref.current.scale.setScalar(s);
  });

  const onOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = 'pointer';
    setHovered(true);
  };

  return (
    <group
      ref={ref}
      onPointerOver={onOver}
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
      <HoverLabel module={module} visible={hovered} position={labelPosition} />
    </group>
  );
}

function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <cylinderGeometry args={[0.24, 0.18, 0.45, 20]} />
        <meshStandardMaterial color="#E7E1D7" roughness={0.8} />
      </mesh>
      {[
        [-0.18, 0.52, 0],
        [0.18, 0.55, 0.05],
        [0, 0.65, 0.12],
        [-0.08, 0.76, -0.1],
        [0.12, 0.82, -0.06],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0.12 * i, 0.45 * i, i % 2 ? -0.45 : 0.45]} castShadow>
          <coneGeometry args={[0.18, 0.72, 7]} />
          <meshStandardMaterial color={i % 2 ? '#4E8A55' : '#5C9B62'} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function RoomShell() {
  const wood = ['#C99562', '#D5A36D', '#C78F5B', '#D9AA74'];
  return (
    <group>
      <mesh position={[0, -0.15, -0.8]} receiveShadow>
        <boxGeometry args={[12.4, 0.25, 10]} />
        <meshStandardMaterial color="#D6A16D" roughness={0.72} />
      </mesh>

      {Array.from({ length: 18 }).map((_, i) => (
        <mesh key={i} position={[-5.9 + i * 0.68, -0.01, -0.8]} receiveShadow>
          <boxGeometry args={[0.64, 0.018, 9.7]} />
          <meshStandardMaterial color={wood[i % wood.length]} roughness={0.76} />
        </mesh>
      ))}

      <mesh position={[0, 2.65, -5.76]} receiveShadow>
        <boxGeometry args={[12.4, 5.7, 0.2]} />
        <meshStandardMaterial color="#F7F2EA" roughness={0.93} />
      </mesh>
      <mesh position={[-6.05, 2.65, -0.8]} receiveShadow>
        <boxGeometry args={[0.2, 5.7, 10]} />
        <meshStandardMaterial color="#F5F0E7" roughness={0.93} />
      </mesh>
      <mesh position={[6.05, 2.65, -0.8]} receiveShadow>
        <boxGeometry args={[0.2, 5.7, 10]} />
        <meshStandardMaterial color="#F7F2EA" roughness={0.93} />
      </mesh>
      <mesh position={[0, 5.46, -0.8]} receiveShadow>
        <boxGeometry args={[12.4, 0.16, 10]} />
        <meshStandardMaterial color="#FFFCF7" roughness={0.96} />
      </mesh>

      <mesh position={[0, 0.02, 0.7]} receiveShadow>
        <boxGeometry args={[6.3, 0.035, 3.8]} />
        <meshStandardMaterial color="#EDE4D8" roughness={0.96} />
      </mesh>

      {[-3.4, 0, 3.4].map((x) => (
        <group key={x} position={[x, 5.18, -0.8]}>
          <mesh>
            <cylinderGeometry args={[0.18, 0.22, 0.12, 24]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.35} />
          </mesh>
          <pointLight position={[0, -0.25, 0]} intensity={2.1} distance={6} color="#FFF2D8" />
        </group>
      ))}
    </group>
  );
}

function WindowWall() {
  return (
    <group position={[5.9, 2.8, -1.35]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh>
        <boxGeometry args={[5.8, 3.45, 0.08]} />
        <meshStandardMaterial color="#F4F1EB" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[5.42, 3.04]} />
        <meshStandardMaterial color="#BFE3F7" emissive="#D7F0FF" emissiveIntensity={0.6} roughness={0.12} />
      </mesh>
      {[-1.35, 0, 1.35].map((x) => (
        <mesh key={x} position={[x, 0, 0.085]}>
          <boxGeometry args={[0.055, 3.05, 0.04]} />
          <meshStandardMaterial color="#FDFBF8" roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.085]}>
        <boxGeometry args={[5.42, 0.055, 0.04]} />
        <meshStandardMaterial color="#FDFBF8" roughness={0.3} />
      </mesh>

      {[-2.05, -1.3, -0.55, 0.2, 0.95, 1.7].map((x, i) => (
        <mesh key={x} position={[x, -1.0 + (i % 2) * 0.12, 0.1]}>
          <boxGeometry args={[0.36 + (i % 3) * 0.13, 0.55 + (i % 4) * 0.18, 0.03]} />
          <meshStandardMaterial color="#8AA6B7" emissive="#A8C8DA" emissiveIntensity={0.25} />
        </mesh>
      ))}

      <directionalLight position={[0, 1.2, 2.2]} intensity={2.2} color="#FFF0D0" castShadow />
    </group>
  );
}

function DeskAndChair({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  return (
    <group>
      <group position={[0, 0.84, -2.72]}>
        <RoundedBox args={[5.25, 0.22, 1.85]} radius={0.08} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#9D6A45" roughness={0.48} />
        </RoundedBox>
        {[-2.25, 2.25].flatMap((x) => [-0.68, 0.68].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -0.75, z]} castShadow>
            <boxGeometry args={[0.14, 1.5, 0.14]} />
            <meshStandardMaterial color="#6F523E" roughness={0.5} />
          </mesh>
        )))}
      </group>

      <Interactive module={MODULES.ai} onOpen={onOpen} labelPosition={[0, 1.22, 0]}>
        <group position={[0, 2.15, -3.05]}>
          <RoundedBox args={[3.0, 1.75, 0.16]} radius={0.08} smoothness={4} castShadow>
            <meshStandardMaterial color="#2E3130" metalness={0.5} roughness={0.3} />
          </RoundedBox>
          <mesh position={[0, 0, 0.09]}>
            <planeGeometry args={[2.66, 1.42]} />
            <meshStandardMaterial color="#10221A" emissive="#2BB673" emissiveIntensity={0.2} />
          </mesh>
          <Html transform position={[0, 0, 0.11]} distanceFactor={1.26} style={{ pointerEvents: 'none' }}>
            <div
              style={{
                width: 430,
                height: 230,
                borderRadius: 14,
                background: 'linear-gradient(145deg,#10251b,#132f24)',
                padding: 22,
                color: '#F7FFF9',
                fontFamily: 'Arial, sans-serif',
                overflow: 'hidden',
                border: '1px solid rgba(63,201,144,.2)',
              }}
            >
              <div style={{ fontSize: 11, color: '#74E0AE', letterSpacing: '.15em', fontWeight: 700 }}>MENTRA AI</div>
              <div style={{ marginTop: 23, fontSize: 28, fontWeight: 800 }}>Your personal mentor</div>
              <div style={{ marginTop: 7, fontSize: 12, color: 'rgba(255,255,255,.7)' }}>Ask, plan, decide, execute.</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
                {['GOALS', 'MEMORY', 'AGENTS'].map((item) => (
                  <div key={item} style={{ padding: '7px 10px', border: '1px solid rgba(255,255,255,.14)', borderRadius: 20, fontSize: 9, color: 'rgba(255,255,255,.8)' }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Html>
          <mesh position={[0, -1.1, 0]}>
            <boxGeometry args={[0.16, 0.5, 0.18]} />
            <meshStandardMaterial color="#6F7470" metalness={0.55} roughness={0.3} />
          </mesh>
          <mesh position={[0, -1.36, 0]}>
            <boxGeometry args={[0.95, 0.08, 0.5]} />
            <meshStandardMaterial color="#6F7470" metalness={0.55} roughness={0.3} />
          </mesh>
        </group>
      </Interactive>

      <Interactive module={MODULES.finance} onOpen={onOpen} labelPosition={[0, 0.65, 0]}>
        <group position={[-1.75, 1.03, -2.22]}>
          <RoundedBox args={[1.08, 0.12, 0.74]} radius={0.04} smoothness={3}>
            <meshStandardMaterial color="#F5F1EA" roughness={0.55} />
          </RoundedBox>
          {[0.18, 0.02, -0.14].map((z, i) => (
            <mesh key={z} position={[0, 0.07, z]}>
              <boxGeometry args={[0.72 - i * 0.12, 0.025, 0.05]} />
              <meshStandardMaterial color="#2BB673" emissive="#2BB673" emissiveIntensity={0.16} />
            </mesh>
          ))}
        </group>
      </Interactive>

      <Interactive module={MODULES.journal} onOpen={onOpen} labelPosition={[0, 0.55, 0]}>
        <group position={[1.75, 1.03, -2.22]} rotation={[0, -0.16, 0]}>
          <RoundedBox args={[0.95, 0.1, 0.74]} radius={0.04} smoothness={3}>
            <meshStandardMaterial color="#EAD8BE" roughness={0.82} />
          </RoundedBox>
          <mesh position={[0, 0.055, 0]}>
            <boxGeometry args={[0.04, 0.01, 0.65]} />
            <meshStandardMaterial color="#9A6B42" />
          </mesh>
        </group>
      </Interactive>

      <group position={[0, 0.75, 0.05]}>
        <RoundedBox args={[1.45, 0.2, 1.4]} radius={0.1} smoothness={4} castShadow>
          <meshStandardMaterial color="#B9B2A9" roughness={0.65} />
        </RoundedBox>
        <RoundedBox position={[0, 1.0, 0.58]} args={[1.45, 1.75, 0.24]} radius={0.12} smoothness={4} castShadow>
          <meshStandardMaterial color="#C8C2BA" roughness={0.68} />
        </RoundedBox>
        <mesh position={[0, -0.78, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 1.55, 18]} />
          <meshStandardMaterial color="#757A78" metalness={0.45} roughness={0.35} />
        </mesh>
        <mesh position={[0, -1.5, 0]}>
          <cylinderGeometry args={[0.82, 0.82, 0.08, 5]} />
          <meshStandardMaterial color="#757A78" metalness={0.45} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}

function LeftWall({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  return (
    <group>
      <Interactive module={MODULES.skills} onOpen={onOpen} labelPosition={[0, 1.35, 0]}>
        <group position={[-4.95, 2.75, -3.65]} rotation={[0, Math.PI / 2, 0]}>
          <RoundedBox args={[2.55, 2.35, 0.12]} radius={0.05} smoothness={3}>
            <meshStandardMaterial color="#FCFBF8" roughness={0.78} />
          </RoundedBox>
          {[
            ['COMM', 0.62, '#5B7CFA'],
            ['DESIGN', 0.2, '#8B5CF6'],
            ['CODING', -0.22, '#31C48D'],
            ['MARKETING', -0.64, '#F59E0B'],
          ].map(([label, y, color]) => (
            <group key={String(label)}>
              <mesh position={[-0.3, y as number, 0.07]}>
                <boxGeometry args={[0.9, 0.06, 0.025]} />
                <meshStandardMaterial color="#E7E4DF" />
              </mesh>
              <mesh position={[-0.58, y as number, 0.085]}>
                <boxGeometry args={[0.55, 0.075, 0.025]} />
                <meshStandardMaterial color={String(color)} />
              </mesh>
            </group>
          ))}
        </group>
      </Interactive>

      <Interactive module={MODULES.quests} onOpen={onOpen} labelPosition={[0, 1.25, 0]}>
        <group position={[-4.95, 2.55, -0.62]} rotation={[0, Math.PI / 2, 0]}>
          <RoundedBox args={[2.35, 2.15, 0.12]} radius={0.05} smoothness={3}>
            <meshStandardMaterial color="#FBFAF7" roughness={0.78} />
          </RoundedBox>
          {[0.55, 0.15, -0.25, -0.65].map((y, i) => (
            <group key={y}>
              <mesh position={[-0.68, y, 0.075]}>
                <boxGeometry args={[0.13, 0.13, 0.025]} />
                <meshStandardMaterial color={i < 2 ? '#31C48D' : '#CFC9C0'} />
              </mesh>
              <mesh position={[0.18, y, 0.075]}>
                <boxGeometry args={[1.18, 0.05, 0.025]} />
                <meshStandardMaterial color={i < 2 ? '#9B8F83' : '#CFC9C0'} />
              </mesh>
              {i === 1 && (
                <mesh position={[0.72, y + 0.12, 0.08]}>
                  <boxGeometry args={[0.38, 0.34, 0.025]} />
                  <meshStandardMaterial color="#F8D66D" />
                </mesh>
              )}
            </group>
          ))}
        </group>
      </Interactive>

      <group position={[-5.05, 1.75, 2.2]} rotation={[0, Math.PI / 2, 0]}>
        {[-0.8, 0, 0.8].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <boxGeometry args={[2.4, 0.12, 0.5]} />
            <meshStandardMaterial color="#9D6A45" roughness={0.56} />
          </mesh>
        ))}
        {[-0.8, 0, 0.8].map((y, shelfIndex) =>
          [-0.75, 0, 0.72].map((x, i) => (
            <mesh key={`${y}-${x}`} position={[x, y + 0.22, 0]}>
              <boxGeometry args={[0.14 + (i % 2) * 0.08, 0.36 + shelfIndex * 0.04, 0.28]} />
              <meshStandardMaterial color={i === 1 ? '#E2B96D' : '#E8E0D5'} roughness={0.75} />
            </mesh>
          ))
        )}
      </group>

      <Plant position={[-4.85, 0.2, 2.1]} scale={1.1} />
      <Plant position={[-4.75, 3.42, 2.15]} scale={0.7} />
    </group>
  );
}

function RightSide({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  return (
    <group>
      <Interactive module={MODULES.calendar} onOpen={onOpen} labelPosition={[0, 1.15, 0]}>
        <group position={[4.75, 2.8, -3.95]} rotation={[0, -Math.PI / 2, 0]}>
          <RoundedBox args={[2.25, 2.15, 0.12]} radius={0.05} smoothness={3}>
            <meshStandardMaterial color="#FCFBF8" roughness={0.78} />
          </RoundedBox>
          <mesh position={[0, 0.68, 0.075]}>
            <boxGeometry args={[1.65, 0.08, 0.025]} />
            <meshStandardMaterial color="#A9998B" />
          </mesh>
          {[-0.55, 0, 0.55].flatMap((x) => [0.18, -0.28, -0.72].map((y, i) => (
            <mesh key={`${x}-${y}`} position={[x, y, 0.075]}>
              <boxGeometry args={[0.3, 0.26, 0.025]} />
              <meshStandardMaterial color={['#F8D66D', '#8BC6EC', '#E49A83', '#B99CE6'][(i + Math.round((x + 0.6) * 2)) % 4]} />
            </mesh>
          )))}
        </group>
      </Interactive>

      <Interactive module={MODULES.memory} onOpen={onOpen} labelPosition={[0, 1.55, 0]}>
        <group position={[4.45, 1.45, -1.15]}>
          <RoundedBox args={[1.7, 2.85, 1.0]} radius={0.07} smoothness={4} castShadow>
            <meshStandardMaterial color="#ECE6DE" roughness={0.62} />
          </RoundedBox>
          {[-0.65, 0, 0.65].map((y) => (
            <mesh key={y} position={[0, y, 0.52]}>
              <boxGeometry args={[1.35, 0.045, 0.03]} />
              <meshStandardMaterial color="#AFA49A" />
            </mesh>
          ))}
          <mesh position={[0, 0.08, 0.55]}>
            <torusGeometry args={[0.32, 0.05, 16, 48]} />
            <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={0.12} />
          </mesh>
        </group>
      </Interactive>

      <group position={[4.45, 0.78, 1.55]}>
        <RoundedBox args={[2.35, 1.25, 0.85]} radius={0.07} smoothness={4} castShadow>
          <meshStandardMaterial color="#9D6A45" roughness={0.55} />
        </RoundedBox>
        {[-0.4, 0.2].map((y) => (
          <mesh key={y} position={[0, y, 0.45]}>
            <boxGeometry args={[1.95, 0.05, 0.03]} />
            <meshStandardMaterial color="#DAB18A" />
          </mesh>
        ))}
      </group>

      <Interactive module={MODULES.agents} onOpen={onOpen} labelPosition={[0, 1.05, 0]}>
        <group position={[4.35, 1.0, 2.2]}>
          <mesh>
            <sphereGeometry args={[0.52, 32, 32]} />
            <meshPhysicalMaterial
              color="#CFCBFF"
              emissive="#6C63FF"
              emissiveIntensity={0.3}
              transparent
              opacity={0.82}
              transmission={0.25}
              roughness={0.1}
              metalness={0.12}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.72, 0.025, 12, 64]} />
            <meshStandardMaterial color="#D8A56B" emissive="#D8A56B" emissiveIntensity={0.18} />
          </mesh>
          <mesh rotation={[0.45, 0.5, 0]}>
            <torusGeometry args={[0.78, 0.018, 12, 64]} />
            <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={0.16} />
          </mesh>
          <pointLight position={[0, 0, 0]} intensity={1.2} distance={3.2} color="#9B91FF" />
        </group>
      </Interactive>

      <Plant position={[5.0, 0.2, 3.0]} scale={1.0} />
      <Plant position={[4.8, 1.5, 0.8]} scale={0.68} />
    </group>
  );
}

function Lounge() {
  return (
    <group>
      <group position={[-3.8, 0.5, 2.6]} rotation={[0, 0.35, 0]}>
        <RoundedBox args={[2.45, 0.72, 1.25]} radius={0.18} smoothness={5} castShadow>
          <meshStandardMaterial color="#D9D1C8" roughness={0.86} />
        </RoundedBox>
        <RoundedBox position={[0, 0.72, 0.42]} args={[2.45, 0.95, 0.32]} radius={0.18} smoothness={5} castShadow>
          <meshStandardMaterial color="#E2DAD2" roughness={0.86} />
        </RoundedBox>
      </group>

      <group position={[2.65, 0.38, 2.5]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.95, 1.05, 0.18, 42]} />
          <meshStandardMaterial color="#A8744D" roughness={0.55} />
        </mesh>
        <mesh position={[0, -0.42, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.82, 18]} />
          <meshStandardMaterial color="#6D5140" metalness={0.2} roughness={0.5} />
        </mesh>
        <Plant position={[0.32, 0.2, -0.08]} scale={0.45} />
      </group>

      <Plant position={[-5.15, 0.18, 3.35]} scale={1.25} />
    </group>
  );
}

function TrophyShelf() {
  return (
    <group position={[-2.4, 3.55, -5.54]}>
      <mesh>
        <boxGeometry args={[2.2, 0.12, 0.5]} />
        <meshStandardMaterial color="#9D6A45" roughness={0.55} />
      </mesh>
      <group position={[-0.4, 0.42, 0]}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.18, 0.28, 0.45, 24]} />
          <meshStandardMaterial color="#E7B74E" metalness={0.65} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.16, 0.2, 0.12, 20]} />
          <meshStandardMaterial color="#8C623F" roughness={0.6} />
        </mesh>
      </group>
      <Plant position={[0.55, 0.12, 0]} scale={0.48} />
    </group>
  );
}

function WallBrand() {
  return (
    <Html transform position={[0.3, 4.35, -5.56]} distanceFactor={3.8} style={{ pointerEvents: 'none' }}>
      <div style={{ textAlign: 'center', whiteSpace: 'nowrap', color: '#2B2926' }}>
        <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: 900, fontSize: 48, letterSpacing: '.18em' }}>
          MENTRA
        </div>
        <div style={{ marginTop: 6, fontSize: 10, letterSpacing: '.34em', color: '#766D64', fontWeight: 700 }}>
          BUILD A BETTER YOU
        </div>
      </div>
    </Html>
  );
}

function Scene({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  return (
    <>
      <color attach="background" args={['#F7F1E8']} />

      <ambientLight intensity={1.45} color="#FFF7EA" />
      <hemisphereLight intensity={1.25} color="#FFFFFF" groundColor="#C69360" />
      <directionalLight
        position={[5.5, 8.5, 5.5]}
        intensity={2.0}
        color="#FFF0CD"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 4.2, -3.5]} intensity={0.8} distance={7} color="#FFF7EA" />

      <RoomShell />
      <WindowWall />
      <DeskAndChair onOpen={onOpen} />
      <LeftWall onOpen={onOpen} />
      <RightSide onOpen={onOpen} />
      <Lounge />
      <TrophyShelf />
      <WallBrand />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.055}
        minDistance={6.6}
        maxDistance={11.2}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.53}
        minAzimuthAngle={-0.72}
        maxAzimuthAngle={0.72}
        target={[0, 1.7, -1.15]}
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
    <div className="absolute inset-0 overflow-hidden bg-[#F7F1E8]">
      <Canvas
        shadows
        dpr={[1, 1.4]}
        camera={{ position: [0, 4.6, 9.4], fov: 47 }}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <Suspense fallback={null}>
          <Scene onOpen={open} />
        </Suspense>
      </Canvas>

      {active && (
        <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full border border-black/10 bg-white/90 px-4 py-2 text-[10px] font-semibold tracking-[0.12em] text-[#3B332C] shadow-xl backdrop-blur-xl">
          OPENING {active.label}...
        </div>
      )}

      <div className="pointer-events-none absolute bottom-5 right-5 hidden rounded-full border border-black/10 bg-white/75 px-3 py-2 text-[9px] font-semibold tracking-[0.08em] text-[#5C5148] shadow-lg backdrop-blur-xl sm:block">
        DRAG TO LOOK · SCROLL TO ZOOM · CLICK OBJECTS
      </div>
    </div>
  );
}
