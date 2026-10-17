'use client';

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { SupportedLanguage } from '@/types';
import { translations } from '@/lib/i18n';
import { createPreference } from '@/lib/preferences';
import { useAuth } from '@/context/AuthContext';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (typeof translations)['en'];
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
});

const languagePreference = createPreference<SupportedLanguage>('gigsaathi_language', ['en', 'hi', 'pa'], 'en');

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(languagePreference.subscribe, languagePreference.get, languagePreference.getServer);
  const { user } = useAuth();

  // On sign-in, switch to the language saved in the user's profile (synced across devices).
  const savedLanguage = user?.onboarded ? user.preferredLanguage : null;
  const userId = user?.id;
  useEffect(() => {
    if (savedLanguage) languagePreference.set(savedLanguage);
  }, [userId, savedLanguage]);

  // Screen readers and browser translation rely on the document language.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage: languagePreference.set, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
