'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { signOut as signOutService } from '@/lib/auth/authService';
import type { Tables } from '@/lib/supabase/database.types';

type Profile = Tables<'profiles'>;

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  /** True until the initial session lookup settles, to avoid a sign-in flash. */
  isLoading: boolean;
  /** Nobody is signed in. The whole app still works in this state. */
  isGuest: boolean;
  /** Whether this deployment has persistence configured at all. */
  authAvailable: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  // Only "loading" when there is actually a session to look up. Deriving this
  // instead of setting it from inside the effect avoids a cascading render, and
  // keeps a guest-only deployment from flashing a spinner it can never resolve.
  const [isLoading, setIsLoading] = useState(() => isSupabaseConfigured());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const authAvailable = isSupabaseConfigured();

  const loadProfile = useCallback(async (userId: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (!error) setProfile(data ?? null);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // Guest-only deployment: isLoading already starts false, nothing to do.
    if (!supabase) return;

    let active = true;

    // getSession() reads the locally stored token instead of round-tripping to
    // the auth server. That is deliberate: this state only decides whether the
    // navbar shows a name, and on a slow connection a network call here would
    // stall the first paint. Nothing is authorised on the strength of it —
    // every read is still gated by RLS server-side.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      setIsLoading(false);
      if (sessionUser) void loadProfile(sessionUser.id);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      setIsLoading(false);
      if (sessionUser) {
        void loadProfile(sessionUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const handleSignOut = useCallback(async () => {
    await signOutService();
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isGuest: !user,
        authAvailable,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        signOut: handleSignOut,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
