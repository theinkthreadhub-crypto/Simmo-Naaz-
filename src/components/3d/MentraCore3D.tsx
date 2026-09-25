'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, Ring } from '@react-three/drei';
import * as THREE from 'three';

interface AgentNodeProps {
  name: string;
  angle: number;
  radius: number;
  speed: number;
  color?: string;
}

function OrbitingAgentNode({ name, angle, radius, speed, color = '#ff8a1f' }: AgentNodeProps) {
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
      {/* Outer agent halo */}
      <Sphere args={[0.09, 16, 16]}>
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </Sphere>
      {/* Inner agent pulse */}
      <Sphere args={[0.045, 12, 12]}>
        <meshBasicMaterial color="#ffffff" />
      </Sphere>
    </group>
  );
}

function ParticleField({ count = 200 }: { count?: number }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2.0 + Math.random() * 3.5;
      p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      p[i * 3 + 2] = r * Math.cos(phi);
    }
    return p;
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.03;
      pointsRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.02) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[points, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#ff8a1f"
        transparent
        opacity={0.65}
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
      // Mouse steering
      coreRef.current.rotation.y = THREE.MathUtils.lerp(coreRef.current.rotation.y, mouse.x * 0.6, 0.05);
      coreRef.current.rotation.x = THREE.MathUtils.lerp(coreRef.current.rotation.x, -mouse.y * 0.4, 0.05);
    }
    if (innerSphereRef.current) {
      // Core breathing pulse
      const scale = 1 + Math.sin(t * 2.5) * 0.06;
      innerSphereRef.current.scale.set(scale, scale, scale);
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.4;
      ring1Ref.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.5) * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.35;
      ring2Ref.current.rotation.y = Math.PI / 4 + Math.cos(t * 0.4) * 0.2;
    }
  });

  const agentNodes = useMemo(() => [
    { name: 'Research', angle: 0, radius: 2.2, speed: 0.35, color: '#ff4a00' },
    { name: 'Gmail', angle: Math.PI * 0.25, radius: 2.5, speed: 0.28, color: '#ff8a1f' },
    { name: 'Calendar', angle: Math.PI * 0.5, radius: 2.1, speed: 0.4, color: '#ffb15a' },
    { name: 'Finance', angle: Math.PI * 0.75, radius: 2.7, speed: 0.32, color: '#ff4a00' },
    { name: 'Memory', angle: Math.PI, radius: 2.3, speed: 0.25, color: '#ffffff' },
    { name: 'Learning', angle: Math.PI * 1.25, radius: 2.6, speed: 0.38, color: '#ff8a1f' },
    { name: 'Business', angle: Math.PI * 1.5, radius: 2.4, speed: 0.3, color: '#ff4a00' },
    { name: 'Drive', angle: Math.PI * 1.75, radius: 2.8, speed: 0.22, color: '#ffb15a' },
  ], []);

  return (
    <Float speed={1.8} rotationIntensity={0.3} floatIntensity={0.6}>
      <group ref={coreRef}>
        {/* Deep Dark Metallic Shell */}
        <Sphere args={[0.9, 32, 32]}>
          <meshStandardMaterial
            color="#140603"
            roughness={0.2}
            metalness={0.9}
            wireframe={false}
          />
        </Sphere>

        {/* Geometric Wireframe Cage */}
        <Sphere args={[0.95, 18, 18]}>
          <meshBasicMaterial
            color="#ff8a1f"
            wireframe
            transparent
            opacity={0.3}
          />
        </Sphere>

        {/* Molten Orange Internal Core Plasma */}
        <Sphere ref={innerSphereRef} args={[0.65, 32, 32]}>
          <meshBasicMaterial
            color="#ff4a00"
            transparent
            opacity={0.85}
          />
        </Sphere>

        {/* Inner White Supernova Flare */}
        <Sphere args={[0.3, 16, 16]}>
          <meshBasicMaterial color="#ffffff" />
        </Sphere>

        {/* Molten Amber Orbital Energy Rings */}
        <Ring ref={ring1Ref} args={[1.25, 1.3, 64]}>
          <meshBasicMaterial color="#ff4a00" side={THREE.DoubleSide} transparent opacity={0.7} />
        </Ring>

        <Ring ref={ring2Ref} args={[1.5, 1.54, 64]}>
          <meshBasicMaterial color="#ff8a1f" side={THREE.DoubleSide} transparent opacity={0.5} />
        </Ring>

        {/* 8 Autonomous Orbiting Agent Nodes */}
        {agentNodes.map(agent => (
          <OrbitingAgentNode key={agent.name} {...agent} />
        ))}
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
      setHasWebGL(!!gl);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!mounted) {
    return <div className={`flex items-center justify-center ${className}`} />;
  }

  // Graceful WebGL fallback
  if (!hasWebGL) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-mentra-orange via-mentra-amber to-amber-200 blur-2xl opacity-40 animate-pulse-slow" />
        <div className="absolute w-36 h-36 rounded-full border border-mentra-orange/40 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-mentra-orange/30 border border-mentra-amber/60 flex items-center justify-center">
            <span className="text-[10px] uppercase font-mono tracking-widest text-mentra-amber">CORE</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#ff8a1f" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#ff4a00" />
        <CentralCore />
        <ParticleField count={180} />
      </Canvas>
    </div>
  );
}
