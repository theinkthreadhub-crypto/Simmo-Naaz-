'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Shield, ArrowRight, Lock, Mail, User, Terminal } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

const MentraCore3D = dynamic(() => import('@/components/3d/MentraCore3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-48 h-48 rounded-full bg-mentra-orange/20 blur-3xl animate-pulse" />
    </div>
  )
});

export default function AuthScreen() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    if (isSignUp) {
      if (!displayName.trim()) {
        setErrorMsg('Please specify your operator name.');
        setLoading(false);
        return;
      }
      const res = await signUp(email, password, displayName);
      if (res.error) setErrorMsg(res.error);
      if (res.message) setSuccessMsg(res.message);
    } else {
      const res = await signIn(email, password);
      if (res.error) setErrorMsg(res.error);
      if (res.message) setSuccessMsg(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-energy-horizon flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-mentra-orange/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[200px] bg-mentra-amber/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Hero 3D Orb & Editorial Headline */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-pill border-mentra-orange/30 bg-black/40 text-xs text-mentra-amber font-mono">
            <span className="w-2 h-2 rounded-full bg-mentra-orange animate-pulse" />
            <span>SYSTEM SECURITY KERNEL</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-white leading-tight">
            ENTER <br />
            <span className="bg-gradient-to-r from-mentra-orange via-mentra-amber to-amber-200 bg-clip-text text-transparent">
              MENTRA
            </span>
          </h1>

          <p className="text-base text-white/70 max-w-md font-sans">
            Your personal AI operating system. One unified command center for missions, capital velocity, and autonomous agent clusters.
          </p>

          <div className="w-full h-64 lg:h-72 relative flex items-center justify-center">
            <MentraCore3D className="w-full h-full" />
          </div>
        </div>

        {/* Right Glass Authentication Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="glass-panel-orange p-6 sm:p-8 bg-black/70 border-white/15 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl font-display font-bold text-white">
                  {isSignUp ? 'INITIALIZE OPERATOR' : 'OPERATOR ACCESS'}
                </h2>
                <p className="text-xs text-white/50 font-mono mt-0.5">
                  {isSignUp ? 'Establish new neural identity' : 'Verify neural credentials'}
                </p>
              </div>
              <Shield className="w-6 h-6 text-mentra-orange" />
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                {successMsg}
              </div>
            )}

            {googleAuthEnabled && (
              <button
                onClick={async () => {
                  setErrorMsg(null);
                  const res = await signInWithGoogle();
                  if (res.error) setErrorMsg(res.error);
                }}
                className="mt-6 w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full bg-white/5 border border-white/15 hover:bg-white/10 text-white text-xs font-medium transition-all group"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.8 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                  <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.5 0 12.8s.6 4.5 1.6 6.4l3.7-4.5z"/>
                  <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.4-6.7-5.3L1.6 18.5C3.5 22.4 7.4 24 12 24z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            )}

            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-[1px] bg-white/10" />
              <span className="text-[10px] uppercase font-mono tracking-widest text-white/40">OR PROTOCOL</span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1">OPERATOR CODENAME</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Operator Naaz"
                      className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-white/60 mb-1">SYSTEM EMAIL</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@mentra.system"
                    className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-white/60 mb-1">PASSPHRASE</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-white/5 border border-white/15 focus:border-mentra-orange rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-full bg-gradient-to-r from-mentra-orange to-mentra-amber hover:opacity-90 active:scale-98 text-white text-xs font-semibold tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,74,0,0.4)] transition-all disabled:opacity-50"
              >
                <span>{loading ? 'AUTHENTICATING...' : isSignUp ? 'INITIALIZE PROFILE' : 'ACCESS SYSTEM'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Toggle Sign In / Sign Up */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-white/50">
                {isSignUp ? 'Already registered?' : 'New operator?'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setPassword('');
                }}
                className="text-mentra-amber hover:text-white font-medium transition-colors"
              >
                {isSignUp ? 'Sign In Instead' : 'Create Identity'}
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 text-center">
              <Link
                href="/demo"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-white/40 hover:text-mentra-amber transition-colors"
              >
                <Terminal className="w-3 h-3" />
                <span>View Read-Only Demo</span>
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
