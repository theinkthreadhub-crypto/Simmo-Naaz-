'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls, PerspectiveCamera, RoundedBox, Html,
  Sparkles as ThreeSparkles
} from '@react-three/drei';
import * as THREE from 'three';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ShoppingBag, Sparkles, Share2, Zap, TrendingUp, ArrowUpRight, Brain, Shield, Crosshair } from 'lucide-react';

/* ──────────────────────────────────────────────
   CAMERA MOUSE FOLLOW RIG
────────────────────────────────────────────── */
function CameraRig({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.x += (mouse.current[0] * 1.5 - camera.position.x) * 0.04;
    camera.position.y += (mouse.current[1] * 0.8 + 2.5 - camera.position.y) * 0.04;
    camera.lookAt(0, 0.4, 0);
  });
  return null;
}

/* ──────────────────────────────────────────────
   LIGHTING
────────────────────────────────────────────── */
function Lighting() {
  return (
    <group>
      {/* Ambient room fill */}
      <ambientLight intensity={0.4} color="#18120c" />
      {/* Warm key directional light from window/top */}
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="#ffbe85" castShadow />
      {/* Screen ambient glow */}
      <pointLight position={[0, 0.5, -2.5]} intensity={2.5} distance={6} color="#ff6a00" />
      {/* Desk lamp warm spot */}
      <pointLight position={[-1.8, 0.6, -2.4]} intensity={3} distance={4} color="#ff9933" />
      {/* Wall neon glow */}
      <pointLight position={[0, 3, -4.8]} intensity={2} distance={5} color="#ff5500" />
      {/* Subtle blue accent fill from back right */}
      <pointLight position={[4, 2, -3]} intensity={0.8} distance={6} color="#3b82f6" />
    </group>
  );
}

/* ──────────────────────────────────────────────
   ROOM — Floor, Walls, Ceiling
────────────────────────────────────────────── */
function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#0c0906" roughness={0.4} metalness={0.4} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 2.5, -5]} receiveShadow>
        <planeGeometry args={[16, 9]} />
        <meshStandardMaterial color="#0f0c08" roughness={0.85} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-8, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[16, 9]} />
        <meshStandardMaterial color="#0d0a07" roughness={0.9} />
      </mesh>

      {/* Right wall */}
      <mesh position={[8, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[16, 9]} />
        <meshStandardMaterial color="#0d0a07" roughness={0.9} />
      </mesh>

      {/* Baseboards */}
      <mesh position={[0, -1.45, -4.95]}>
        <boxGeometry args={[16, 0.1, 0.05]} />
        <meshStandardMaterial color="#1a140d" roughness={0.7} />
      </mesh>
    </group>
  );
}

/* ──────────────────────────────────────────────
   DESK SETUP
────────────────────────────────────────────── */
function Desk() {
  return (
    <group position={[0, -0.9, -2.8]}>
      {/* Tabletop */}
      <RoundedBox args={[5.2, 0.12, 2.0]} radius={0.04} castShadow receiveShadow>
        <meshStandardMaterial color="#18130e" roughness={0.35} metalness={0.15} />
      </RoundedBox>

      {/* Desk Mat */}
      <mesh position={[0, 0.065, 0.1]}>
        <boxGeometry args={[3.2, 0.005, 1.2]} />
        <meshStandardMaterial color="#0a0806" roughness={0.9} />
      </mesh>

      {/* Legs */}
      {[[-2.4, -0.75, -0.8], [2.4, -0.75, -0.8], [-2.4, -0.75, 0.8], [2.4, -0.75, 0.8]].map(([x, y, z], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1.45]} />
          <meshStandardMaterial color="#120e0a" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/* ──────────────────────────────────────────────
   KEYBOARD & MOUSE
────────────────────────────────────────────── */
function Keyboard() {
  return (
    <group position={[0, -0.81, -2.5]}>
      {/* Base */}
      <RoundedBox args={[1.2, 0.03, 0.4]} radius={0.01} castShadow>
        <meshStandardMaterial color="#14100c" roughness={0.4} metalness={0.6} />
      </RoundedBox>
      {/* Keycaps highlight glow */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[1.1, 0.005, 0.32]} />
        <meshStandardMaterial color="#ff7700" emissive="#ff5500" emissiveIntensity={0.25} />
      </mesh>
      {/* Mouse */}
      <group position={[0.9, 0, 0.05]}>
        <RoundedBox args={[0.18, 0.04, 0.28]} radius={0.02} castShadow>
          <meshStandardMaterial color="#14100c" roughness={0.3} metalness={0.5} />
        </RoundedBox>
        <mesh position={[0, 0.022, -0.05]}>
          <boxGeometry args={[0.02, 0.008, 0.06]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff5500" emissiveIntensity={0.6} />
        </mesh>
      </group>
    </group>
  );
}

/* ──────────────────────────────────────────────
   ROOM OBJECTS (Speakers, Lamp, Mug, Plant)
────────────────────────────────────────────── */
function RoomObjects() {
  return (
    <group position={[0, -0.9, -2.8]}>
      {/* Left Speaker */}
      <group position={[-1.9, 0.35, -0.4]}>
        <RoundedBox args={[0.26, 0.55, 0.3]} radius={0.02} castShadow>
          <meshStandardMaterial color="#100d0a" roughness={0.4} />
        </RoundedBox>
        <mesh position={[0, 0.08, 0.155]}>
          <cylinderGeometry args={[0.08, 0.08, 0.01]} />
          <meshStandardMaterial color="#ff6600" roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.12, 0.155]}>
          <cylinderGeometry args={[0.06, 0.06, 0.01]} />
          <meshStandardMaterial color="#222" roughness={0.5} />
        </mesh>
      </group>

      {/* Right Speaker */}
      <group position={[1.9, 0.35, -0.4]}>
        <RoundedBox args={[0.26, 0.55, 0.3]} radius={0.02} castShadow>
          <meshStandardMaterial color="#100d0a" roughness={0.4} />
        </RoundedBox>
        <mesh position={[0, 0.08, 0.155]}>
          <cylinderGeometry args={[0.08, 0.08, 0.01]} />
          <meshStandardMaterial color="#ff6600" roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.12, 0.155]}>
          <cylinderGeometry args={[0.06, 0.06, 0.01]} />
          <meshStandardMaterial color="#222" roughness={0.5} />
        </mesh>
      </group>

      {/* Desk Lamp */}
      <group position={[-2.2, 0.4, 0.4]}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.15, 0.18, 0.04]} />
          <meshStandardMaterial color="#1a140d" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.3, 0]} rotation={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.6]} />
          <meshStandardMaterial color="#1a140d" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[-0.12, 0.58, 0]} rotation={[0, 0, -0.5]}>
          <coneGeometry args={[0.12, 0.18, 16]} />
          <meshStandardMaterial color="#ffaa44" emissive="#ff6600" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* Coffee Mug */}
      <group position={[1.5, 0.12, 0.5]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.07, 0.18]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

/* ──────────────────────────────────────────────
   WALL DECOR (Neon Sign & Shelves)
────────────────────────────────────────────── */
function WallDecor() {
  return (
    <group position={[0, 2.2, -4.95]}>
      {/* Neon MENTRA Backing Frame */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[3.6, 0.7, 0.02]} />
        <meshStandardMaterial color="#140e08" roughness={0.8} />
      </mesh>

      {/* Glowing Neon Bar */}
      <mesh position={[0, 0.6, 0.02]}>
        <boxGeometry args={[3.4, 0.04, 0.02]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={3} />
      </mesh>

      {/* Left Wall Floating Shelf */}
      <group position={[-4.5, -0.2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.8, 0.06, 0.4]} />
          <meshStandardMaterial color="#1a140d" roughness={0.6} />
        </mesh>
        <mesh position={[-0.4, 0.2, 0]} castShadow>
          <boxGeometry args={[0.2, 0.35, 0.25]} />
          <meshStandardMaterial color="#ffaa00" emissive="#ff5500" emissiveIntensity={0.2} />
        </mesh>
      </group>
    </group>
  );
}

/* ──────────────────────────────────────────────
   MONITOR WITH INTERACTIVE SCREEN UI
────────────────────────────────────────────── */
function Monitor({ displayName }: { displayName: string }) {
  const [tab, setTab] = useState<'hunt' | 'ugc' | 'finance'>('hunt');

  return (
    <group position={[0, 0.25, -3.5]}>
      {/* Monitor frame */}
      <RoundedBox args={[3.0, 1.9, 0.08]} radius={0.04} castShadow>
        <meshStandardMaterial color="#0e0c0a" roughness={0.2} metalness={0.7} />
      </RoundedBox>

      {/* Screen Bezel Inner */}
      <RoundedBox args={[2.8, 1.7, 0.01]} radius={0.02} position={[0, 0, 0.05]}>
        <meshStandardMaterial color="#050402" roughness={1} />
      </RoundedBox>

      {/* Screen Light Emitter */}
      <RoundedBox args={[2.72, 1.62, 0.005]} radius={0.01} position={[0, 0, 0.06]}>
        <meshStandardMaterial
          color="#ff6a00"
          emissive="#ff4400"
          emissiveIntensity={0.12}
          roughness={1}
        />
      </RoundedBox>

      {/* Interactive HTML Screen */}
      <Html
        transform
        position={[0, 0, 0.075]}
        style={{ width: '540px', height: '320px' }}
        distanceFactor={1.45}
      >
        <div style={{
          width: '540px', height: '320px',
          background: 'linear-gradient(135deg, #0a0805 0%, #120c07 100%)',
          borderRadius: '8px',
          padding: '16px',
          fontFamily: "'Inter', sans-serif",
          overflow: 'hidden',
          border: '1px solid rgba(251,146,60,0.2)',
          boxShadow: '0 0 50px rgba(251,146,60,0.15)',
          userSelect: 'none',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'linear-gradient(135deg, #f97316, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', color: '#000', fontWeight: 'bold' }}>⚡</span>
              </div>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 800, letterSpacing: '0.1em' }}>MENTRA OS</span>
              <span style={{ fontSize: '9px', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', padding: '1px 6px', borderRadius: '99px', fontFamily: 'monospace' }}>LIVE COMMAND</span>
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => setTab('hunt')} style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', background: tab === 'hunt' ? '#f97316' : 'rgba(255,255,255,0.05)', color: tab === 'hunt' ? '#000' : '#888', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Hunt</button>
              <button onClick={() => setTab('ugc')} style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', background: tab === 'ugc' ? '#a78bfa' : 'rgba(255,255,255,0.05)', color: tab === 'ugc' ? '#000' : '#888', border: 'none', cursor: 'pointer', fontWeight: 600 }}>UGC</button>
              <button onClick={() => setTab('finance')} style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', background: tab === 'finance' ? '#10b981' : 'rgba(255,255,255,0.05)', color: tab === 'finance' ? '#000' : '#888', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Growth</button>
            </div>
          </div>

          {/* Tab Content */}
          {tab === 'hunt' && (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontFamily: 'monospace', marginBottom: '8px' }}>▸ AI PRODUCT FINDER & TREND HUNTER</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 600 }}>🔥 Oversized Boxy Tee</p>
                  <p style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>Demand Index: 98/100 · Margin: 68%</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>⚡ Cargo Parachute Pants</p>
                  <p style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>Demand Index: 94/100 · Margin: 72%</p>
                </div>
              </div>
              <Link href="/mentra" style={{ display: 'inline-block', width: '100%', textAlign: 'center', background: '#f97316', color: '#000', padding: '7px 0', borderRadius: '5px', fontSize: '11px', fontWeight: 700, textDecoration: 'none' }}>
                Open Product Hunter Console →
              </Link>
            </div>
          )}

          {tab === 'ugc' && (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontFamily: 'monospace', marginBottom: '8px' }}>▸ AUTOMATED VIRAL SCRIPT & VIDEO GENERATOR</p>
              <div style={{ background: 'rgba(167,139,250,0.06)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(167,139,250,0.2)', marginBottom: '10px' }}>
                <p style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 600 }}>Hook #1: &quot;Stop buying boring hoodies until you see this...&quot;</p>
                <p style={{ fontSize: '9px', color: '#aaa', marginTop: '4px' }}>Estimated Views: 450K - 1.2M · Platform: Instagram Reels / TikTok</p>
              </div>
              <Link href="/creator" style={{ display: 'inline-block', width: '100%', textAlign: 'center', background: '#a78bfa', color: '#000', padding: '7px 0', borderRadius: '5px', fontSize: '11px', fontWeight: 700, textDecoration: 'none' }}>
                Generate UGC Videos Now →
              </Link>
            </div>
          )}

          {tab === 'finance' && (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontFamily: 'monospace', marginBottom: '8px' }}>▸ REVENUE & MARGIN AUTOPILOT</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(16,185,129,0.06)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '10px' }}>
                <div>
                  <p style={{ fontSize: '9px', color: '#888' }}>Projected MoM Sales</p>
                  <p style={{ fontSize: '16px', color: '#10b981', fontWeight: 800 }}>₹4,85,000</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '9px', color: '#888' }}>ROAS Average</p>
                  <p style={{ fontSize: '16px', color: '#f59e0b', fontWeight: 800 }}>4.8x</p>
                </div>
              </div>
              <Link href="/finance" style={{ display: 'inline-block', width: '100%', textAlign: 'center', background: '#10b981', color: '#000', padding: '7px 0', borderRadius: '5px', fontSize: '11px', fontWeight: 700, textDecoration: 'none' }}>
                View Growth Analytics →
              </Link>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

/* ──────────────────────────────────────────────
   FLOATING STAT BADGES
────────────────────────────────────────────── */
function StatCard({ position, icon, label, value, color }: {
  position: [number, number, number];
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Html position={position} transform distanceFactor={3.5}>
      <div style={{
        background: 'rgba(15,11,7,0.85)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${color}40`,
        borderRadius: '10px',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        whiteSpace: 'nowrap',
        boxShadow: `0 4px 20px ${color}20`,
        fontFamily: "'Inter', sans-serif"
      }}>
        <span style={{ fontSize: '14px' }}>{icon}</span>
        <div>
          <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
          <p style={{ fontSize: '13px', color: color, fontWeight: 800 }}>{value}</p>
        </div>
      </div>
    </Html>
  );
}

/* ──────────────────────────────────────────────
   DUST PARTICLES
────────────────────────────────────────────── */
function DustParticles() {
  return (
    <ThreeSparkles
      count={70}
      scale={[14, 8, 12]}
      size={0.9}
      speed={0.3}
      opacity={0.2}
      color="#ffaa44"
      noise={0.5}
    />
  );
}

/* ──────────────────────────────────────────────
   HUD OVERLAY (SPLASH SCREEN BEFORE ENTRY)
────────────────────────────────────────────── */
function HUDOverlay({ onEnter }: { onEnter: () => void }) {
  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-auto"
      style={{ background: 'rgba(10,8,5,0.75)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-lg px-6"
      >
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-mono tracking-[0.2em]">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          MENTRA 3D COMMAND CENTER
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-4 leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          Enter the
          <br />
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
            Command Room.
          </span>
        </h1>
        <p className="text-white/50 mb-8 text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
          Your AI-powered fashion growth HQ. Hunt products, script UGC videos, and manage revenue from your 3D command deck.
        </p>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 45px rgba(249,115,22,0.5)' }}
          whileTap={{ scale: 0.96 }}
          onClick={onEnter}
          className="px-10 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-extrabold text-base tracking-wide shadow-lg shadow-orange-500/20 cursor-pointer"
        >
          Enter Command Room →
        </motion.button>
        <div className="mt-6 flex items-center justify-center gap-6 text-[11px] font-mono text-white/30">
          <span>🖱 Drag to look around</span>
          <span>·</span>
          <span>🖥 Click monitor tabs</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   MAIN COMPONENT EXPORT
────────────────────────────────────────────── */
export default function MentraRoom3D() {
  const mouse = useRef<[number, number]>([0, 0]);
  const [entered, setEntered] = useState(false);

  const displayName = 'Operator';

  const handleMouseMove = (e: React.MouseEvent) => {
    mouse.current = [
      (e.clientX / window.innerWidth - 0.5) * 2,
      -(e.clientY / window.innerHeight - 0.5) * 2
    ];
  };

  return (
    <div className="relative w-full h-screen bg-[#0a0805] overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Navbar header overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-8 py-5"
        style={{ background: 'linear-gradient(to bottom, rgba(10,8,5,0.9), transparent)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Zap className="w-4 h-4 text-black font-bold" />
          </div>
          <span className="text-base font-extrabold tracking-[0.2em] uppercase text-white">MENTRA</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          {[
            ['Hunt', '/mentra'],
            ['Quests', '/quests'],
            ['Finance', '/finance'],
            ['✨ Gemini AI', '/gemini']
          ].map(([label, href]) => (
            <Link key={label} href={href} className="text-xs text-white/50 hover:text-orange-400 transition-colors font-mono">
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* 3D R3F Canvas */}
      <Canvas
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        style={{ background: '#0a0805' }}
      >
        <PerspectiveCamera makeDefault position={[0, 2.5, 5.5]} fov={50} />

        {entered && <CameraRig mouse={mouse} />}

        <Suspense fallback={null}>
          <Lighting />
          <Room />
          <Desk />
          <Keyboard />
          <RoomObjects />
          <WallDecor />
          <Monitor displayName={displayName} />
          <DustParticles />

          {/* Floating stat badges */}
          <StatCard position={[-3.5, 1.4, -1.8]} icon="🛍" label="Products Scanned" value="14" color="#10b981" />
          <StatCard position={[3.5, 1.4, -1.8]} icon="✨" label="UGC Ready" value="4" color="#a78bfa" />
          <StatCard position={[-3.5, 0.3, -1.8]} icon="🔥" label="Growth Streak" value="18d" color="#f97316" />
          <StatCard position={[3.5, 0.3, -1.8]} icon="💰" label="Est. Savings" value="₹91K" color="#f59e0b" />

          {!entered && (
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              maxPolarAngle={Math.PI / 2}
              minPolarAngle={Math.PI / 4}
              autoRotate
              autoRotateSpeed={0.6}
              target={[0, 0.4, 0]}
            />
          )}
        </Suspense>
      </Canvas>

      {/* Entry Splash Overlay */}
      <AnimatePresence>
        {!entered && (
          <HUDOverlay onEnter={() => setEntered(true)} />
        )}
      </AnimatePresence>

      {/* Dock Navigation Bar (Post-Entry) */}
      {entered && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30"
        >
          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl"
            style={{ background: 'rgba(15,11,7,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { icon: Bot, label: 'MENTRA AI', href: '/mentra', color: 'text-orange-400' },
              { icon: ShoppingBag, label: 'Hunt', href: '/mentra', color: 'text-emerald-400' },
              { icon: Sparkles, label: 'UGC', href: '/creator', color: 'text-violet-400' },
              { icon: Share2, label: 'Social', href: '/connections', color: 'text-pink-400' },
              { icon: Brain, label: 'Memory', href: '/memory', color: 'text-cyan-400' },
              { icon: TrendingUp, label: 'Finance', href: '/finance', color: 'text-amber-400' },
            ].map(item => (
              <Link key={item.label} href={item.href}
                className="flex flex-col items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors group">
                <item.icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform`} />
                <span className="text-[10px] font-mono text-white/40 group-hover:text-white transition-colors">{item.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Drag hint */}
      {entered && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute top-18 left-1/2 -translate-x-1/2 text-[10px] font-mono text-white/30 tracking-[0.2em] uppercase"
        >
          Drag mouse to explore room • Click monitor tabs to interact
        </motion.p>
      )}

      {/* Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair Display:wght@700;800&family=Inter:wght@400;500;600;700;800&display=swap');
      `}</style>
    </div>
  );
}
