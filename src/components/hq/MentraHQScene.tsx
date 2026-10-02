'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber';
import {
  ContactShadows,
  Html,
  OrbitControls,
  OrthographicCamera,
  RoundedBox,
} from '@react-three/drei';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

type ModuleConfig = {
  key: string;
  label: string;
  href: string;
  color: string;
};

const MODULES = {
  ai: { key: 'ai', label: 'MENTRA AI', href: '/mentra', color: '#2FAF79' },
  quests: { key: 'quests', label: 'QUESTS', href: '/quests', color: '#E8A63A' },
  skills: { key: 'skills', label: 'SKILLS', href: '/skills', color: '#6680D8' },
  calendar: { key: 'calendar', label: 'CALENDAR', href: '/calendar', color: '#6AAAD6' },
  memory: { key: 'memory', label: 'MEMORY', href: '/memory', color: '#8B6BC9' },
  journal: { key: 'journal', label: 'JOURNAL', href: '/journal', color: '#B87948' },
  finance: { key: 'finance', label: 'FINANCE', href: '/finance', color: '#2F9F6D' },
  agents: { key: 'agents', label: 'AGENTS', href: '/agents', color: '#7468C8' },
} satisfies Record<string, ModuleConfig>;

function HoverLabel({
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
    <Html center position={position} distanceFactor={8} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          whiteSpace: 'nowrap',
          borderRadius: 999,
          padding: '7px 11px',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '.08em',
          color: '#2E2925',
          background: 'rgba(255,255,255,.96)',
          border: `1px solid ${module.color}55`,
          boxShadow: '0 10px 28px rgba(93,68,48,.18)',
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

  useEffect(() => {
    if (!hovered || !ref.current) return;
    ref.current.scale.setScalar(1.02);
    return () => {
      if (ref.current) ref.current.scale.setScalar(1);
    };
  }, [hovered]);

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
      <HoverLabel module={module} visible={hovered} position={labelPosition} />
    </group>
  );
}

function Plant({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <cylinderGeometry args={[0.2, 0.16, 0.42, 20]} />
        <meshStandardMaterial color="#D8C8B8" roughness={0.82} />
      </mesh>

      {[
        [-0.14, 0.48, 0.02, -0.38],
        [0.15, 0.54, 0.02, 0.38],
        [0.03, 0.66, 0.08, -0.12],
        [-0.09, 0.73, -0.06, 0.28],
        [0.1, 0.8, -0.04, -0.25],
      ].map(([x, y, z, rot], index) => (
        <mesh
          key={index}
          position={[x, y, z]}
          rotation={[0.1, index * 0.7, rot]}
          castShadow
        >
          <coneGeometry args={[0.15, 0.64, 7]} />
          <meshStandardMaterial
            color={index % 2 ? '#4F8057' : '#628F61'}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

function RoomShell() {
  const planks = ['#C58E60', '#D5A06F', '#BF875A', '#D9AA77'];

  return (
    <group>
      <RoundedBox
        position={[0, -0.33, 0]}
        args={[10.4, 0.6, 7.9]}
        radius={0.12}
        smoothness={5}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial color="#E8DDD2" roughness={0.88} />
      </RoundedBox>

      {Array.from({ length: 17 }).map((_, index) => (
        <mesh
          key={index}
          position={[-4.8 + index * 0.6, 0.005, 0]}
          receiveShadow
        >
          <boxGeometry args={[0.56, 0.035, 7.35]} />
          <meshStandardMaterial color={planks[index % planks.length]} roughness={0.76} />
        </mesh>
      ))}

      <mesh position={[0, 2.55, -3.82]} receiveShadow castShadow>
        <boxGeometry args={[10.35, 5.1, 0.18]} />
        <meshStandardMaterial color="#F4F0EA" roughness={0.94} />
      </mesh>

      <mesh position={[-5.1, 2.55, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.18, 5.1, 7.7]} />
        <meshStandardMaterial color="#EEE7DF" roughness={0.94} />
      </mesh>

      <mesh position={[0, 0.12, 3.67]} receiveShadow>
        <boxGeometry args={[10.3, 0.2, 0.12]} />
        <meshStandardMaterial color="#D8C8B9" roughness={0.8} />
      </mesh>

      <mesh position={[5.02, 0.12, 0]} receiveShadow>
        <boxGeometry args={[0.12, 0.2, 7.7]} />
        <meshStandardMaterial color="#D8C8B9" roughness={0.8} />
      </mesh>
    </group>
  );
}

function WindowAndCurtains() {
  return (
    <group position={[3.15, 2.55, -3.72]}>
      <mesh>
        <boxGeometry args={[2.9, 2.55, 0.08]} />
        <meshStandardMaterial color="#FBF8F3" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.055]}>
        <planeGeometry args={[2.62, 2.25]} />
        <meshStandardMaterial
          color="#CDE6F1"
          emissive="#E7F4F9"
          emissiveIntensity={0.45}
        />
      </mesh>

      {[-0.66, 0, 0.66].map((x) => (
        <mesh key={x} position={[x, 0, 0.08]}>
          <boxGeometry args={[0.045, 2.25, 0.03]} />
          <meshStandardMaterial color="#FBF8F3" />
        </mesh>
      ))}

      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[2.62, 0.045, 0.03]} />
        <meshStandardMaterial color="#FBF8F3" />
      </mesh>

      {[-1.55, 1.55].map((x) => (
        <RoundedBox
          key={x}
          position={[x, 0, 0.1]}
          args={[0.42, 2.8, 0.1]}
          radius={0.06}
          smoothness={4}
        >
          <meshStandardMaterial color="#D8CDC2" roughness={0.92} />
        </RoundedBox>
      ))}
    </group>
  );
}

function MainDesk({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  return (
    <group>
      <group position={[-0.55, 0.88, -2.55]}>
        <RoundedBox
          args={[4.25, 0.2, 1.48]}
          radius={0.07}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#9D6746" roughness={0.5} />
        </RoundedBox>

        {[-1.82, 1.82].flatMap((x) =>
          [-0.52, 0.52].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, -0.72, z]} castShadow>
              <boxGeometry args={[0.12, 1.42, 0.12]} />
              <meshStandardMaterial color="#6D5140" roughness={0.58} />
            </mesh>
          ))
        )}
      </group>

      <Interactive module={MODULES.ai} onOpen={onOpen} labelPosition={[0, 1.05, 0]}>
        <group position={[-0.55, 1.82, -2.82]}>
          <RoundedBox args={[2.05, 1.22, 0.12]} radius={0.05} smoothness={4} castShadow>
            <meshStandardMaterial color="#2D302E" metalness={0.34} roughness={0.32} />
          </RoundedBox>

          <mesh position={[0, 0, 0.07]}>
            <planeGeometry args={[1.82, 1.0]} />
            <meshPhysicalMaterial
              color="#173C2B"
              emissive="#2FAF79"
              emissiveIntensity={0.22}
              roughness={0.18}
              metalness={0.08}
            />
          </mesh>

          <Html
            transform
            position={[0, 0, 0.085]}
            distanceFactor={1.55}
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                width: 290,
                height: 160,
                borderRadius: 10,
                padding: 18,
                background: 'linear-gradient(145deg,#173628,#1e4433)',
                color: '#F6FFF9',
                fontFamily: 'Arial, sans-serif',
                overflow: 'hidden',
              }}
            >
              <div style={{ fontSize: 10, letterSpacing: '.14em', fontWeight: 800, color: '#82E0B6' }}>
                MENTRA AI
              </div>
              <div style={{ marginTop: 20, fontSize: 22, fontWeight: 800 }}>Personal Mentor</div>
              <div style={{ marginTop: 6, fontSize: 11, opacity: 0.72 }}>Ask · Plan · Execute</div>
            </div>
          </Html>

          <mesh position={[0, -0.79, 0]}>
            <boxGeometry args={[0.12, 0.4, 0.12]} />
            <meshStandardMaterial color="#747875" metalness={0.45} roughness={0.32} />
          </mesh>
          <mesh position={[0, -1.0, 0]}>
            <boxGeometry args={[0.72, 0.06, 0.34]} />
            <meshStandardMaterial color="#747875" metalness={0.45} roughness={0.32} />
          </mesh>
        </group>
      </Interactive>

      <Interactive module={MODULES.finance} onOpen={onOpen} labelPosition={[0, 0.52, 0]}>
        <group position={[-1.82, 1.04, -2.27]}>
          <RoundedBox args={[0.92, 0.1, 0.58]} radius={0.035} smoothness={3}>
            <meshStandardMaterial color="#F4F0EA" roughness={0.58} />
          </RoundedBox>
          {[0.14, 0, -0.14].map((z, index) => (
            <mesh key={z} position={[0, 0.058, z]}>
              <boxGeometry args={[0.58 - index * 0.08, 0.024, 0.04]} />
              <meshStandardMaterial color="#2F9F6D" />
            </mesh>
          ))}
        </group>
      </Interactive>

      <Interactive module={MODULES.journal} onOpen={onOpen} labelPosition={[0, 0.5, 0]}>
        <group position={[0.92, 1.04, -2.25]} rotation={[0, -0.12, 0]}>
          <RoundedBox args={[0.82, 0.08, 0.6]} radius={0.035} smoothness={3}>
            <meshStandardMaterial color="#E6D1B0" roughness={0.86} />
          </RoundedBox>
          <mesh position={[0, 0.045, 0]}>
            <boxGeometry args={[0.035, 0.01, 0.52]} />
            <meshStandardMaterial color="#9B6D49" />
          </mesh>
        </group>
      </Interactive>

      <group position={[-0.35, 0.68, -0.42]}>
        <RoundedBox args={[1.22, 0.2, 1.0]} radius={0.1} smoothness={4} castShadow>
          <meshStandardMaterial color="#BBB2A8" roughness={0.72} />
        </RoundedBox>
        <RoundedBox
          position={[0, 0.78, 0.38]}
          args={[1.22, 1.32, 0.24]}
          radius={0.11}
          smoothness={4}
          castShadow
        >
          <meshStandardMaterial color="#C9C1B8" roughness={0.72} />
        </RoundedBox>
      </group>
    </group>
  );
}

function WallModules({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  return (
    <group>
      <Interactive module={MODULES.skills} onOpen={onOpen} labelPosition={[0, 1.0, 0]}>
        <group position={[-4.98, 2.82, -2.25]} rotation={[0, Math.PI / 2, 0]}>
          <RoundedBox args={[2.1, 1.9, 0.1]} radius={0.045} smoothness={3}>
            <meshStandardMaterial color="#FCFBF8" roughness={0.82} />
          </RoundedBox>

          {[0.45, 0.1, -0.25, -0.6].map((y, index) => (
            <group key={y}>
              <mesh position={[-0.16, y, 0.065]}>
                <boxGeometry args={[0.92, 0.048, 0.02]} />
                <meshStandardMaterial color="#E5E0DB" />
              </mesh>
              <mesh position={[-0.46, y, 0.076]}>
                <boxGeometry args={[0.35 + index * 0.11, 0.064, 0.022]} />
                <meshStandardMaterial
                  color={['#6680D8', '#8B6BC9', '#2FAF79', '#E8A63A'][index]}
                />
              </mesh>
            </group>
          ))}
        </group>
      </Interactive>

      <Interactive module={MODULES.quests} onOpen={onOpen} labelPosition={[0, 1.0, 0]}>
        <group position={[-4.98, 2.55, 0.25]} rotation={[0, Math.PI / 2, 0]}>
          <RoundedBox args={[1.95, 1.82, 0.1]} radius={0.045} smoothness={3}>
            <meshStandardMaterial color="#FBFAF8" roughness={0.82} />
          </RoundedBox>

          {[0.44, 0.08, -0.28, -0.64].map((y, index) => (
            <group key={y}>
              <mesh position={[-0.55, y, 0.07]}>
                <boxGeometry args={[0.11, 0.11, 0.02]} />
                <meshStandardMaterial color={index < 2 ? '#2FAF79' : '#D8D1C9'} />
              </mesh>
              <mesh position={[0.12, y, 0.07]}>
                <boxGeometry args={[0.96, 0.045, 0.02]} />
                <meshStandardMaterial color="#A89E95" />
              </mesh>
            </group>
          ))}
        </group>
      </Interactive>

      <Interactive module={MODULES.calendar} onOpen={onOpen} labelPosition={[0, 1.0, 0]}>
        <group position={[0.95, 2.6, -3.7]}>
          <RoundedBox args={[1.95, 1.75, 0.1]} radius={0.045} smoothness={3}>
            <meshStandardMaterial color="#FCFBF8" roughness={0.82} />
          </RoundedBox>

          <mesh position={[0, 0.55, 0.065]}>
            <boxGeometry args={[1.48, 0.06, 0.02]} />
            <meshStandardMaterial color="#A69B91" />
          </mesh>

          {[-0.48, 0, 0.48].flatMap((x) =>
            [0.12, -0.28, -0.68].map((y, index) => (
              <mesh key={`${x}-${y}`} position={[x, y, 0.068]}>
                <boxGeometry args={[0.26, 0.2, 0.02]} />
                <meshStandardMaterial
                  color={['#F4D074', '#90C7E4', '#E29E89', '#BBA4DD'][
                    (index + Math.round((x + 0.5) * 2)) % 4
                  ]}
                />
              </mesh>
            ))
          )}
        </group>
      </Interactive>
    </group>
  );
}

function StorageAndAgents({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  return (
    <group>
      <Interactive module={MODULES.memory} onOpen={onOpen} labelPosition={[0, 1.2, 0]}>
        <group position={[4.15, 1.45, -2.9]}>
          <RoundedBox args={[1.45, 2.75, 0.82]} radius={0.06} smoothness={4} castShadow>
            <meshStandardMaterial color="#E8E0D7" roughness={0.68} />
          </RoundedBox>

          {[-0.65, 0, 0.65].map((y) => (
            <mesh key={y} position={[0, y, 0.43]}>
              <boxGeometry args={[1.16, 0.04, 0.025]} />
              <meshStandardMaterial color="#A99E93" />
            </mesh>
          ))}

          <mesh position={[0, 0.08, 0.46]}>
            <torusGeometry args={[0.28, 0.045, 16, 44]} />
            <meshStandardMaterial color="#8B6BC9" emissive="#8B6BC9" emissiveIntensity={0.08} />
          </mesh>
        </group>
      </Interactive>

      <group position={[4.15, 0.55, 1.8]}>
        <RoundedBox args={[1.9, 0.8, 0.72]} radius={0.07} smoothness={4} castShadow>
          <meshStandardMaterial color="#9C6746" roughness={0.56} />
        </RoundedBox>
      </group>

      <Interactive module={MODULES.agents} onOpen={onOpen} labelPosition={[0, 0.92, 0]}>
        <group position={[4.08, 1.08, 1.8]}>
          <mesh castShadow>
            <sphereGeometry args={[0.45, 32, 32]} />
            <meshPhysicalMaterial
              color="#C9C4F4"
              emissive="#7468C8"
              emissiveIntensity={0.28}
              roughness={0.12}
              metalness={0.08}
              transmission={0.18}
              transparent
              opacity={0.92}
            />
          </mesh>

          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.62, 0.022, 12, 64]} />
            <meshStandardMaterial color="#D5A26D" />
          </mesh>
          <mesh rotation={[0.48, 0.58, 0]}>
            <torusGeometry args={[0.68, 0.018, 12, 64]} />
            <meshStandardMaterial
              color="#7468C8"
              emissive="#7468C8"
              emissiveIntensity={0.1}
            />
          </mesh>
        </group>
      </Interactive>
    </group>
  );
}

function Bookshelf() {
  return (
    <group position={[-4.7, 1.35, 2.6]} rotation={[0, Math.PI / 2, 0]}>
      {[-0.58, 0, 0.58].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[1.9, 0.09, 0.44]} />
          <meshStandardMaterial color="#9C6746" roughness={0.58} />
        </mesh>
      ))}

      {[-0.58, 0, 0.58].map((y) =>
        [-0.62, 0, 0.62].map((x, index) => (
          <mesh key={`${y}-${x}`} position={[x, y + 0.17, 0]}>
            <boxGeometry args={[0.12 + (index % 2) * 0.05, 0.3, 0.24]} />
            <meshStandardMaterial color={index === 1 ? '#D4A65C' : '#E9E0D5'} />
          </mesh>
        ))
      )}
    </group>
  );
}

function Lounge() {
  return (
    <group>
      <group position={[-3.0, 0.48, 2.0]} rotation={[0, 0.52, 0]}>
        <RoundedBox args={[2.1, 0.68, 1.08]} radius={0.16} smoothness={5} castShadow>
          <meshStandardMaterial color="#D8D0C7" roughness={0.88} />
        </RoundedBox>
        <RoundedBox
          position={[0, 0.65, 0.36]}
          args={[2.1, 0.82, 0.3]}
          radius={0.16}
          smoothness={5}
          castShadow
        >
          <meshStandardMaterial color="#E4DDD6" roughness={0.88} />
        </RoundedBox>

        {[-0.68, 0.68].map((x) => (
          <RoundedBox
            key={x}
            position={[x, 0.55, -0.18]}
            args={[0.52, 0.52, 0.22]}
            radius={0.1}
            smoothness={4}
          >
            <meshStandardMaterial color={x < 0 ? '#D1B395' : '#C9D2C0'} roughness={0.88} />
          </RoundedBox>
        ))}
      </group>

      <group position={[1.3, 0.35, 1.8]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.72, 0.78, 0.15, 36]} />
          <meshStandardMaterial color="#A56F4A" roughness={0.56} />
        </mesh>
        <mesh position={[0, -0.36, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.7, 18]} />
          <meshStandardMaterial color="#6D5140" />
        </mesh>
      </group>

      <mesh position={[-0.75, 0.025, 1.65]} receiveShadow>
        <boxGeometry args={[5.1, 0.03, 2.65]} />
        <meshStandardMaterial color="#E8DED2" roughness={0.95} />
      </mesh>
    </group>
  );
}

function Decor() {
  return (
    <group>
      <Plant position={[-4.55, 0.2, 2.95]} scale={1.08} />
      <Plant position={[4.55, 0.2, 3.0]} scale={0.95} />
      <Plant position={[2.25, 0.2, 2.45]} scale={0.55} />

      <group position={[-1.85, 3.55, -3.7]}>
        <mesh>
          <boxGeometry args={[1.7, 0.1, 0.4]} />
          <meshStandardMaterial color="#9C6746" />
        </mesh>

        <mesh position={[-0.3, 0.32, 0]}>
          <cylinderGeometry args={[0.16, 0.24, 0.34, 20]} />
          <meshStandardMaterial color="#DFAE48" metalness={0.5} roughness={0.28} />
        </mesh>
        <Plant position={[0.46, 0.1, 0]} scale={0.38} />
      </group>

      <Html
        transform
        position={[-0.4, 4.15, -3.72]}
        distanceFactor={4.8}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{ textAlign: 'center', whiteSpace: 'nowrap', color: '#2F2A26' }}>
          <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: 900, fontSize: 36, letterSpacing: '.18em' }}>
            MENTRA
          </div>
          <div style={{ marginTop: 4, fontSize: 9, letterSpacing: '.28em', color: '#84776C', fontWeight: 700 }}>
            BUILD A BETTER YOU
          </div>
        </div>
      </Html>
    </group>
  );
}

function CameraRig() {
  const cameraRef = useRef<THREE.OrthographicCamera>(null);
  const { size } = useThree();

  useEffect(() => {
    if (!cameraRef.current) return;
    cameraRef.current.zoom = size.width < 640 ? 46 : size.width < 1024 ? 54 : 62;
    cameraRef.current.updateProjectionMatrix();
  }, [size.width]);

  return (
    <>
      <OrthographicCamera
        ref={cameraRef}
        makeDefault
        position={[8.1, 7.3, 8.1]}
        near={0.1}
        far={100}
        zoom={58}
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        minZoom={42}
        maxZoom={74}
        minPolarAngle={0.66}
        maxPolarAngle={0.98}
        minAzimuthAngle={0.55}
        maxAzimuthAngle={1.02}
        target={[0, 1.5, -0.25]}
      />
    </>
  );
}

function Scene({ onOpen }: { onOpen: (module: ModuleConfig) => void }) {
  return (
    <>
      <color attach="background" args={['#CBBEB2']} />

      <ambientLight intensity={1.45} color="#FFF8EF" />
      <hemisphereLight intensity={1.3} color="#FFFFFF" groundColor="#B88860" />
      <directionalLight
        position={[7, 9, 7]}
        intensity={2.15}
        color="#FFF0D5"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-2, 4.2, -2.8]} intensity={0.7} distance={6} color="#FFF5E8" />

      <RoomShell />
      <WindowAndCurtains />
      <MainDesk onOpen={onOpen} />
      <WallModules onOpen={onOpen} />
      <StorageAndAgents onOpen={onOpen} />
      <Bookshelf />
      <Lounge />
      <Decor />

      <ContactShadows
        position={[0, -0.04, 0]}
        opacity={0.28}
        scale={12}
        blur={2.8}
        far={5}
      />

      <CameraRig />
    </>
  );
}

export default function MentraHQScene() {
  const router = useRouter();
  const [opening, setOpening] = useState<ModuleConfig | null>(null);

  const openModule = (module: ModuleConfig) => {
    setOpening(module);
    window.setTimeout(() => router.push(module.href), 160);
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#CBBEB2]">
      <Canvas
        shadows
        dpr={[1, 1.35]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
      >
        <Suspense fallback={null}>
          <Scene onOpen={openModule} />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-[9px] font-semibold tracking-[0.08em] text-[#5D534B] shadow-md backdrop-blur-md">
        DRAG ROOM · PINCH ZOOM · TAP OBJECTS
      </div>

      {opening && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-black/10 bg-white/95 px-4 py-3 text-[10px] font-bold tracking-[0.08em] text-[#312B26] shadow-xl">
          OPENING {opening.label}...
        </div>
      )}
    </div>
  );
}
