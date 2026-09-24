'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Ring, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function CoreOrb() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const outerRingRef = useRef<THREE.Group>(null!);
  const innerRingRef = useRef<THREE.Group>(null!);
  const particlesRef = useRef<THREE.Points>(null!);

  // Particle positions
  const particleCount = 180;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const phi = THREE.MathUtils.randFloatSpread(Math.PI);
      const distance = THREE.MathUtils.randFloat(1.6, 2.8);

      pos[i * 3] = distance * Math.sin(theta) * Math.cos(phi);
      pos[i * 3 + 1] = distance * Math.sin(theta) * Math.sin(phi);
      pos[i * 3 + 2] = distance * Math.cos(theta);
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.2;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.3;
      outerRingRef.current.rotation.x += delta * 0.15;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.y -= delta * 0.5;
      innerRingRef.current.rotation.z -= delta * 0.2;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group>
      {/* Central Floating AI Core */}
      <Float speed={2.5} rotationIntensity={0.6} floatIntensity={0.8}>
        <Sphere ref={meshRef} args={[0.85, 32, 32]}>
          <meshStandardMaterial
            color="#00f2fe"
            emissive="#4facfe"
            emissiveIntensity={0.8}
            roughness={0.15}
            metalness={0.9}
            wireframe={true}
          />
        </Sphere>
      </Float>

      {/* Inner Holographic Ring */}
      <group ref={innerRingRef}>
        <Ring args={[1.2, 1.25, 48]}>
          <meshBasicMaterial color="#a18cd1" side={THREE.DoubleSide} transparent opacity={0.6} wireframe />
        </Ring>
      </group>

      {/* Outer Tactical Orbital Ring */}
      <group ref={outerRingRef}>
        <Ring args={[1.7, 1.74, 64]}>
          <meshBasicMaterial color="#00f2fe" side={THREE.DoubleSide} transparent opacity={0.5} wireframe />
        </Ring>
      </group>

      {/* Ambient Neural Particles */}
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
          opacity={0.7}
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
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#00f2fe" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#8a2be2" />
        <CoreOrb />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090a0f] via-transparent to-transparent opacity-80" />
    </div>
  );
}
