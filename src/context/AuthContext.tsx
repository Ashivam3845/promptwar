'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, ProfileUpdate } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { toUserProfile, toProfileColumns, describeAuthError, RegisterParams, DEMO_PROFILE } from '@/lib/auth';
import { isDemoCookieSet, setDemoCookie, subscribeDemo } from '@/lib/demo';
import { DataStore, demoStore, createSupabaseStore } from '@/lib/workspace';

type AuthResult = { success: boolean; error?: string };

// guest: no account, can use Ask AI / Schemes / draft complaints but not save
// demo:  exploring sample data stored only in this browser
// user:  signed in; data is stored in Supabase under their own identity
export type WorkspaceMode = 'loading' | 'guest' | 'demo' | 'user';

interface AuthContextType {
  user: UserProfile | null;
  /** The signed-in user's profile, or the sample profile in demo mode. */
  profile: UserProfile | null;
  mode: WorkspaceMode;
  /** Where this visitor's records are stored; null for guests. */
  store: DataStore | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult & { profile?: UserProfile }>;
  register: (params: RegisterParams) => Promise<AuthResult & { needsConfirmation?: boolean }>;
  logout: () => Promise<void>;
  updateProfile: (update: ProfileUpdate) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  startDemo: () => void;
  exitDemo: () => void;
}

const notConfigured: AuthResult = {
  success: false,
  error: 'Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.',
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  mode: 'loading',
  store: null,
  isAdmin: false,
  loading: true,
  login: async () => notConfigured,
  register: async () => notConfigured,
  logout: async () => {},
  updateProfile: async () => notConfigured,
  requestPasswordReset: async () => notConfigured,
  updatePassword: async () => notConfigured,
  startDemo: () => {},
  exitDemo: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  // Server snapshot is false: cookies are not available while prerendering.
  const isDemo = useSyncExternalStore(subscribeDemo, isDemoCookieSet, () => false);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? toUserProfile(data.user) : null);
      // A real session always wins over a leftover demo flag.
      if (data.user) setDemoCookie(false);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ? toUserProfile(session.user) : null);
      // Keep other tabs in sync: a sign-out anywhere sends this tab back to the start.
      if (event === 'SIGNED_OUT') {
        router.replace('/');
        router.refresh();
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  const leaveDemo = () => setDemoCookie(false);

  const login = async (email: string, password: string) => {
    if (!supabase) return notConfigured;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { success: false, error: describeAuthError(error) };
    leaveDemo();
    const profile = toUserProfile(data.user);
    setUser(profile);
    return { success: true, profile };
  };

  const register = async (params: RegisterParams) => {
    if (!supabase) return notConfigured;
    const { data, error } = await supabase.auth.signUp({
      email: params.email.trim(),
      password: params.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        data: { full_name: params.fullName.trim(), onboarded: false },
      },
    });
    if (error) return { success: false, error: describeAuthError(error) };

    // Supabase returns a user with no identities when the email is already registered.
    if (data.user && data.user.identities?.length === 0) {
      return { success: false, error: 'An account with this email already exists. Please log in instead.' };
    }

    if (!data.session) return { success: true, needsConfirmation: true };
    leaveDemo();
    setUser(toUserProfile(data.session.user));
    return { success: true };
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    router.replace('/');
    router.refresh();
  };

  const updateProfile = async (update: ProfileUpdate): Promise<AuthResult> => {
    if (!supabase) return notConfigured;
    const columns = toProfileColumns(update);
    const { data, error } = await supabase.auth.updateUser({ data: columns });
    if (error) return { success: false, error: describeAuthError(error) };

    // Mirror into the profiles table for the admin directory. Auth metadata above is the
    // source of truth, so a missing table (migrations not yet run) must not block the user.
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: data.user.id, email: data.user.email, ...columns, updated_at: new Date().toISOString() });
    if (profileError) console.warn('Profile sync skipped:', profileError.message);

    setUser(toUserProfile(data.user));
    return { success: true };
  };

  const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    if (!supabase) return notConfigured;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) return { success: false, error: describeAuthError(error) };
    return { success: true };
  };

  const updatePassword = async (password: string): Promise<AuthResult> => {
    if (!supabase) return notConfigured;
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { success: false, error: describeAuthError(error) };
    return { success: true };
  };

  const startDemo = () => {
    setDemoCookie(true);
    router.push('/dashboard');
  };

  const exitDemo = () => {
    leaveDemo();
    router.replace('/');
    router.refresh();
  };

  const mode: WorkspaceMode = loading ? 'loading' : user ? 'user' : isDemo ? 'demo' : 'guest';

  const store = useMemo<DataStore | null>(() => {
    if (mode === 'user' && supabase) return createSupabaseStore(supabase);
    if (mode === 'demo') return demoStore;
    return null;
  }, [mode]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: mode === 'demo' ? DEMO_PROFILE : user,
        mode,
        store,
        isAdmin: user?.role === 'admin',
        loading,
        login,
        register,
        logout,
        updateProfile,
        requestPasswordReset,
        updatePassword,
        startDemo,
        exitDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
