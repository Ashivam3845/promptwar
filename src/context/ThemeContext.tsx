'use client';

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { createPreference } from '@/lib/preferences';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

const themePreference = createPreference<Theme>('gigsaathi_theme', ['light', 'dark'], 'dark');

function applyTheme(theme: Theme) {
  for (const el of [document.documentElement, document.body]) {
    el.setAttribute('data-theme', theme);
    el.classList.toggle('light', theme === 'light');
    el.classList.toggle('dark', theme === 'dark');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(themePreference.subscribe, themePreference.get, themePreference.getServer);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => themePreference.set(theme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: themePreference.set }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
