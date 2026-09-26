'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Ring, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface AgentNodeProps {
  name: string;
  angle: number;
  radius: number;
  speed: number;
  color?: string;
}

function OrbitingAgentNode({ angle, radius, speed, color = '#67e8f9' }: AgentNodeProps) {
  const nodeRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!nodeRef.current) return;
    const t = clock.getElapsedTime() * speed + angle;
    nodeRef.current.position.x = Math.cos(t) * radius;
    nodeRef.current.position.z = Math.sin(t) * radius;
    nodeRef.current.position.y = Math.sin(t * 2) * 0.35;
  });

  return (
    <group ref={nodeRef}>
      <Sphere args={[0.09, 16, 16]}>
        <meshBasicMaterial color={color} transparent opacity={0.82} />
      </Sphere>
      <Sphere args={[0.042, 12, 12]}>
        <meshBasicMaterial color="#ffffff" />
      </Sphere>
    </group>
  );
}

function ParticleField({ count = 180 }: { count?: number }) {
  const points = useMemo(() => {
    const values = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 2 + Math.random() * 3.5;
      values[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      values[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      values[i * 3 + 2] = radius * Math.cos(phi);
    }
    return values;
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = clock.getElapsedTime() * 0.025;
    pointsRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.02) * 0.08;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.032}
        color="#67e8f9"
        transparent
        opacity={0.48}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function CentralCore() {
  const coreRef = useRef<THREE.Group>(null);
  const innerSphereRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock, mouse }) => {
    const t = clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.rotation.y = THREE.MathUtils.lerp(coreRef.current.rotation.y, mouse.x * 0.5, 0.05);
      coreRef.current.rotation.x = THREE.MathUtils.lerp(coreRef.current.rotation.x, -mouse.y * 0.35, 0.05);
    }
    if (innerSphereRef.current) {
      const scale = 1 + Math.sin(t * 2.2) * 0.055;
      innerSphereRef.current.scale.set(scale, scale, scale);
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.35;
      ring1Ref.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.5) * 0.18;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.28;
      ring2Ref.current.rotation.y = Math.PI / 4 + Math.cos(t * 0.4) * 0.18;
    }
  });

  const agentNodes = useMemo(() => [
    { name: 'Research', angle: 0, radius: 2.2, speed: 0.35, color: '#5b6cff' },
    { name: 'Gmail', angle: Math.PI * 0.25, radius: 2.5, speed: 0.28, color: '#67e8f9' },
    { name: 'Calendar', angle: Math.PI * 0.5, radius: 2.1, speed: 0.4, color: '#a5b4fc' },
    { name: 'Finance', angle: Math.PI * 0.75, radius: 2.7, speed: 0.32, color: '#818cf8' },
    { name: 'Memory', angle: Math.PI, radius: 2.3, speed: 0.25, color: '#ffffff' },
    { name: 'Learning', angle: Math.PI * 1.25, radius: 2.6, speed: 0.38, color: '#67e8f9' },
    { name: 'Business', angle: Math.PI * 1.5, radius: 2.4, speed: 0.3, color: '#5b6cff' },
    { name: 'Drive', angle: Math.PI * 1.75, radius: 2.8, speed: 0.22, color: '#c7d2fe' },
  ], []);

  return (
    <Float speed={1.5} rotationIntensity={0.22} floatIntensity={0.45}>
      <group ref={coreRef}>
        <Sphere args={[0.9, 32, 32]}>
          <meshStandardMaterial color="#0b1020" roughness={0.18} metalness={0.92} />
        </Sphere>
        <Sphere args={[0.96, 18, 18]}>
          <meshBasicMaterial color="#818cf8" wireframe transparent opacity={0.24} />
        </Sphere>
        <Sphere ref={innerSphereRef} args={[0.64, 32, 32]}>
          <meshBasicMaterial color="#5b6cff" transparent opacity={0.76} />
        </Sphere>
        <Sphere args={[0.28, 16, 16]}>
          <meshBasicMaterial color="#eef2ff" />
        </Sphere>
        <Ring ref={ring1Ref} args={[1.25, 1.29, 64]}>
          <meshBasicMaterial color="#5b6cff" side={THREE.DoubleSide} transparent opacity={0.62} />
        </Ring>
        <Ring ref={ring2Ref} args={[1.5, 1.535, 64]}>
          <meshBasicMaterial color="#67e8f9" side={THREE.DoubleSide} transparent opacity={0.40} />
        </Ring>
        {agentNodes.map(agent => <OrbitingAgentNode key={agent.name} {...agent} />)}
      </group>
    </Float>
  );
}

export default function MentraCore3D({ className = 'w-full h-full' }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setHasWebGL(Boolean(gl));
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!mounted) return <div className={`flex items-center justify-center ${className}`} />;

  if (!hasWebGL) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="h-52 w-52 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-400 to-cyan-300 blur-3xl opacity-35 animate-pulse-slow" />
        <div className="absolute h-36 w-36 rounded-full border border-indigo-400/40 flex items-center justify-center">
          <div className="h-20 w-20 rounded-full bg-indigo-500/30 border border-cyan-300/50 flex items-center justify-center">
            <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-200">CORE</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
        <ambientLight intensity={0.45} />
        <pointLight position={[10, 10, 10]} intensity={1.35} color="#67e8f9" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#5b6cff" />
        <CentralCore />
        <ParticleField />
      </Canvas>
    </div>
  );
}
