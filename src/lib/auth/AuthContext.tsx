'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Profile, PlayerProgress, PlayerStats } from '@/types/mentra';
import { getProfile, getPlayerProgress, getPlayerStats, initializeUserProfile } from '@/lib/db/profiles';
import { useMentraStore } from '@/lib/store/mentraStore';

interface AuthActionResult {
  error?: string;
  message?: string;
}

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  progress: PlayerProgress | null;
  stats: PlayerStats | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (email: string, password: string, displayName: string) => Promise<AuthActionResult>;
  signInWithGoogle: () => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  completeOnboarding: (displayName: string, primaryGoal: string, priorities: string[]) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
  setDemoUser: (name?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to strictly gate demo mode to explicit dev environments
const isDevDemoAllowed = () => {
  return process.env.NODE_ENV !== 'production' && 
    (process.env.NEXT_PUBLIC_MENTRA_DEMO_MODE === 'true' || process.env.MENTRA_DEMO_MODE === 'true');
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserData = async (userId: string) => {
    try {
      const [p, prog, st] = await Promise.all([
        getProfile(userId),
        getPlayerProgress(userId),
        getPlayerStats(userId)
      ]);
      setProfile(p);
      setProgress(prog);
      setStats(st);
      // Synchronize database records with zustand store
      await useMentraStore.getState().syncUserDatabase(userId);
    } catch (err) {
      console.warn('[AUTH] Error loading user database tables:', err);
    }
  };

  const refreshUserData = async () => {
    if (user?.id) {
      await loadUserData(user.id);
    }
  };

  useEffect(() => {
    // Check active session on mount
    const initAuth = async () => {
      try {
        // Check localStorage for offline demo session only if explicitly allowed in development
        if (isDevDemoAllowed()) {
          const savedDemo = localStorage.getItem('mentra_demo_session');
          if (savedDemo) {
            const parsed = JSON.parse(savedDemo);
            setUser(parsed.user);
            setProfile(parsed.profile);
            setProgress(parsed.progress);
            setStats(parsed.stats);
            setIsLoading(false);
            return;
          }
        } else {
          // Clear any stale demo session in non-demo mode
          localStorage.removeItem('mentra_demo_session');
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await loadUserData(session.user.id);
        }
      } catch (err) {
        console.warn('[AUTH] Supabase session check fallback:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadUserData(session.user.id);
      } else {
        if (!isDevDemoAllowed() || !localStorage.getItem('mentra_demo_session')) {
          setUser(null);
          setProfile(null);
          setProgress(null);
          setStats(null);
        }
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (isDevDemoAllowed() && (error.message.includes('FetchError') || error.message.includes('Failed to fetch') || error.message.includes('Invalid API key'))) {
          setDemoUser(email.split('@')[0]);
          setIsLoading(false);
          return {};
        }
        setIsLoading(false);
        const message = /invalid login credentials/i.test(error.message)
          ? 'No account found with these credentials. First time here? Choose Create Identity.'
          : error.message;
        return { error: message };
      }
      if (data.user) {
        setUser(data.user);
        await loadUserData(data.user.id);
      }
      setIsLoading(false);
      return {};
    } catch (err: any) {
      if (isDevDemoAllowed()) {
        setDemoUser(email.split('@')[0]);
        setIsLoading(false);
        return {};
      }
      setIsLoading(false);
      return { error: err.message || 'Authentication provider unavailable' };
    }
  };

  const signUp = async (email: string, password: string, displayName: string): Promise<AuthActionResult> => {
    setIsLoading(true);

    if (password.length < 6) {
      setIsLoading(false);
      return { error: 'Passphrase must be at least 6 characters.' };
    }

    try {
      const emailRedirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo
        }
      });

      if (error) {
        if (
          isDevDemoAllowed() &&
          (error.message.includes('FetchError') ||
            error.message.includes('Failed to fetch') ||
            error.message.includes('Invalid API key'))
        ) {
          setDemoUser(displayName || email.split('@')[0]);
          setIsLoading(false);
          return {};
        }
        setIsLoading(false);
        return { error: error.message };
      }

      // With email confirmation enabled Supabase returns a user but no session.
      // Do not pretend the user is authenticated until a real session exists.
      if (data.user && data.session) {
        setUser(data.user);
        await initializeUserProfile(data.user.id, displayName);
        await loadUserData(data.user.id);
        setIsLoading(false);
        return { message: 'Identity created. Welcome to MENTRA.' };
      }

      setIsLoading(false);
      return {
        message:
          'Identity created. Check your email to confirm the account, then return here and sign in.'
      };
    } catch (err: any) {
      if (isDevDemoAllowed()) {
        setDemoUser(displayName || email.split('@')[0]);
        setIsLoading(false);
        return {};
      }
      setIsLoading(false);
      return { error: err.message || 'Authentication provider unavailable' };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
        }
      });
      if (error) {
        if (isDevDemoAllowed()) {
          setDemoUser('Google Operator');
          return {};
        }
        return { error: error.message };
      }
      return {};
    } catch (err: any) {
      if (isDevDemoAllowed()) {
        setDemoUser('Google Operator');
        return {};
      }
      return { error: err.message || 'Google authentication unavailable' };
    }
  };

  const setDemoUser = (name = 'Operator Naaz') => {
    if (!isDevDemoAllowed()) {
      console.warn('[AUTH] Demo user bypass rejected: production mode active.');
      return;
    }

    const demoUser = {
      id: 'demo_user_001',
      email: `${name.toLowerCase().replace(/\s+/g, '')}@mentra.system`,
      user_metadata: { display_name: name }
    };
    const demoProfile: Profile = {
      id: 'prof_demo',
      user_id: 'demo_user_001',
      display_name: name,
      timezone: 'UTC',
      preferred_language: 'en',
      onboarding_completed: true,
      primary_goal: 'Scale automated brand revenue to ₹1,00,000/mo'
    };
    const demoProgress: PlayerProgress = {
      user_id: 'demo_user_001',
      level: 7,
      current_xp: 680,
      total_xp: 4200,
      current_streak: 12,
      longest_streak: 14,
      last_active_date: new Date().toISOString().split('T')[0],
      quests_completed: 42
    };
    const demoStats: PlayerStats = {
      discipline: 82,
      focus: 78,
      knowledge: 85,
      business: 74,
      finance: 69,
      communication: 72,
      fitness: 65
    };

    localStorage.setItem('mentra_demo_session', JSON.stringify({
      user: demoUser,
      profile: demoProfile,
      progress: demoProgress,
      stats: demoStats
    }));

    setUser(demoUser);
    setProfile(demoProfile);
    setProgress(demoProgress);
    setStats(demoStats);
  };

  const signOut = async () => {
    localStorage.removeItem('mentra_demo_session');
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setProfile(null);
    setProgress(null);
    setStats(null);
  };

  const completeOnboarding = async (displayName: string, primaryGoal: string, priorities: string[]): Promise<boolean> => {
    if (!user) return false;

    if (user.id !== 'demo_user_001') {
      try {
        await initializeUserProfile(user.id, displayName, primaryGoal, priorities);
        await loadUserData(user.id);
        return true;
      } catch {
        return false;
      }
    } else {
      const updatedProfile: Profile = {
        id: 'prof_demo',
        user_id: 'demo_user_001',
        display_name: displayName,
        timezone: 'UTC',
        preferred_language: 'en',
        onboarding_completed: true,
        primary_goal: primaryGoal
      };
      const updatedProgress: PlayerProgress = {
        user_id: 'demo_user_001',
        level: 1,
        current_xp: 0,
        total_xp: 0,
        current_streak: 1,
        longest_streak: 1,
        last_active_date: new Date().toISOString().split('T')[0],
        quests_completed: 0
      };
      const updatedStats: PlayerStats = {
        discipline: 20,
        focus: 20,
        knowledge: 20,
        business: 20,
        finance: 20,
        communication: 20,
        fitness: 20
      };

      setProfile(updatedProfile);
      setProgress(updatedProgress);
      setStats(updatedStats);

      localStorage.setItem('mentra_demo_session', JSON.stringify({
        user,
        profile: updatedProfile,
        progress: updatedProgress,
        stats: updatedStats
      }));
      return true;
    }
  };

  const isAuthenticated = !!user;
  const onboardingCompleted = profile?.onboarding_completed ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        progress,
        stats,
        isLoading,
        isAuthenticated,
        onboardingCompleted,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        completeOnboarding,
        refreshUserData,
        setDemoUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
