'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { getCurrentUser, setCurrentUser as persistCurrentUser, loginUser, registerUser, logoutUser } from '@/lib/auth';

interface AuthContextType {
  user: UserProfile | null;
  isAdmin: boolean;
  login: (email: string) => { success: boolean; error?: string };
  register: (params: {
    email: string;
    fullName: string;
    phoneNumber?: string;
    role?: 'worker' | 'admin';
    primaryPlatform: string;
    city: string;
  }) => { success: boolean; error?: string };
  logout: () => void;
  switchUser: (targetRole: 'worker' | 'admin') => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  login: () => ({ success: false }),
  register: () => ({ success: false }),
  logout: () => {},
  switchUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const active = getCurrentUser();
    setUser(active);
  }, []);

  const login = (email: string) => {
    const res = loginUser(email);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const register = (params: {
    email: string;
    fullName: string;
    phoneNumber?: string;
    role?: 'worker' | 'admin';
    primaryPlatform: string;
    city: string;
  }) => {
    const res = registerUser(params);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  const switchUser = (targetRole: 'worker' | 'admin') => {
    if (targetRole === 'admin') {
      login('admin@gigsaathi.in');
    } else {
      login('ramesh.delivery@gmail.com');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
