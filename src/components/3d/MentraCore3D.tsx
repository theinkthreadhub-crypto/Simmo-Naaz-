'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Ring, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

const AGENT_NAMES = [
  'Research',
  'Gmail',
  'Calendar',
  'Finance',
  'Memory',
  'Learning',
  'Business',
  'Drive'
];

function OrbitingAgentNode({ angle, radius, color, label }: { angle: number; radius: number; color: string; label: string }) {
  const nodeRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.3 + angle;
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    const y = Math.sin(t * 2) * 0.35;
    if (nodeRef.current) {
      nodeRef.current.position.set(x, y, z);
    }
  });

  return (
    <group ref={nodeRef}>
      <Sphere args={[0.09, 16, 16]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </Sphere>
    </group>
  );
}

function CoreScene() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const outerRingRef = useRef<THREE.Group>(null!);
  const innerRingRef = useRef<THREE.Group>(null!);
  const particlesRef = useRef<THREE.Points>(null!);

  const particleCount = 220;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const phi = THREE.MathUtils.randFloatSpread(Math.PI);
      const distance = THREE.MathUtils.randFloat(1.8, 3.2);

      pos[i * 3] = distance * Math.sin(theta) * Math.cos(phi);
      pos[i * 3 + 1] = distance * Math.sin(theta) * Math.sin(phi);
      pos[i * 3 + 2] = distance * Math.cos(theta);
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.35;
      meshRef.current.rotation.x += delta * 0.15;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.25;
      outerRingRef.current.rotation.x += delta * 0.1;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.y -= delta * 0.4;
      innerRingRef.current.rotation.z -= delta * 0.2;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group>
      {/* Central Floating AI Core */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.7}>
        <Sphere ref={meshRef} args={[0.85, 32, 32]}>
          <meshStandardMaterial
            color="#00f2fe"
            emissive="#00f2fe"
            emissiveIntensity={0.65}
            roughness={0.2}
            metalness={0.8}
            wireframe={true}
          />
        </Sphere>
      </Float>

      {/* Holographic Ring 1 */}
      <group ref={innerRingRef}>
        <Ring args={[1.25, 1.28, 48]}>
          <meshBasicMaterial color="#8b5cf6" side={THREE.DoubleSide} transparent opacity={0.6} wireframe />
        </Ring>
      </group>

      {/* Holographic Ring 2 */}
      <group ref={outerRingRef}>
        <Ring args={[1.75, 1.78, 64]}>
          <meshBasicMaterial color="#00f2fe" side={THREE.DoubleSide} transparent opacity={0.5} wireframe />
        </Ring>
      </group>

      {/* Orbiting Agent Nodes */}
      {AGENT_NAMES.map((name, i) => {
        const angle = (i / AGENT_NAMES.length) * Math.PI * 2;
        const color = i % 2 === 0 ? '#00f2fe' : '#a78bfa';
        return (
          <OrbitingAgentNode
            key={name}
            angle={angle}
            radius={2.1}
            color={color}
            label={name}
          />
        );
      })}

      {/* Ambient Neural Particle Cloud */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#00f2fe"
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function MentraCore3D({ className = 'h-[360px] w-full' }: { className?: string }) {
  return (
    <div className={`relative ${className} flex items-center justify-center overflow-hidden`}>
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.4} color="#00f2fe" />
        <pointLight position={[-10, -10, -10]} intensity={0.9} color="#8b5cf6" />
        <CoreScene />
      </Canvas>
    </div>
  );
}
