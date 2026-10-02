'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function FloatingOrbs({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  const groupRef = useRef<THREE.Group>(null);
  const sphere1Ref = useRef<THREE.Mesh>(null);
  const sphere2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05 + mouse.current[0] * 0.2;
      groupRef.current.rotation.x = mouse.current[1] * 0.1;
    }
    if (sphere1Ref.current) {
      sphere1Ref.current.rotation.z += 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Glowing Hero Glass Crystal */}
      <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
        <mesh ref={sphere1Ref} position={[2.2, 0.5, -1.5]} scale={1.4}>
          <icosahedronGeometry args={[1, 0]} />
          <MeshDistortMaterial
            color="#ff6600"
            emissive="#ff3300"
            emissiveIntensity={0.3}
            roughness={0.2}
            metalness={0.8}
            distort={0.25}
            speed={2}
          />
        </mesh>
      </Float>

      {/* Secondary Violet Floating Crystal */}
      <Float speed={1.5} rotationIntensity={0.8} floatIntensity={1}>
        <mesh ref={sphere2Ref} position={[-2.5, -0.8, -2]} scale={1.1}>
          <dodecahedronGeometry args={[1, 0]} />
          <MeshDistortMaterial
            color="#a78bfa"
            emissive="#7c3aed"
            emissiveIntensity={0.4}
            roughness={0.15}
            metalness={0.9}
            distort={0.3}
            speed={1.5}
          />
        </mesh>
      </Float>

      {/* Small Amber Accent Orb */}
      <Float speed={2.5} rotationIntensity={1} floatIntensity={1.2}>
        <mesh position={[0.8, -1.8, -1]} scale={0.6}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={0.5}
            roughness={0.1}
          />
        </mesh>
      </Float>

      {/* Atmospheric Particles */}
      <Sparkles
        count={80}
        scale={[12, 10, 10]}
        size={1.2}
        speed={0.4}
        opacity={0.35}
        color="#ffaa44"
      />
    </group>
  );
}

export default function JoanHeroScene3D({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} color="#18120c" />
        <pointLight position={[5, 5, 5]} intensity={2} color="#ffbe85" />
        <pointLight position={[-5, -5, -2]} intensity={1.5} color="#a78bfa" />
        <FloatingOrbs mouse={mouse} />
      </Canvas>
    </div>
  );
}
